"use server";

import type { LinkExpiry } from "@/components/atoms/user-settings";
import { LinkDocument } from "@/types/documents";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";
import { encryptUrl } from "../encrypt-url";
import Monkey from "monkey-typewriter";
import { googleSafeBrowsingCheck } from "../safe-browsing";

export type CreateLinkRequest = {
  slug: string;
  url: string;
  password: string;
  userId?: string;
  expiry?: LinkExpiry | "never";
};

export type CreateLinkResponse = {
  status: string;
  message: string;
  linkData?: LinkDocument;
};

export async function createLink({
  url,
  password,
  userId,
  slug: providedSlug,
  expiry: providedExpiry,
}: CreateLinkRequest): Promise<CreateLinkResponse> {
  let slug = providedSlug || "";
  let expiry = providedExpiry;
  if (!userId) {
    expiry = undefined;
  }

  if (!url) {
    return {
      status: "error",
      message: "Missing required fields",
    };
  }

  const urlRegex = /^(https?:\/\/|ftp:\/\/|magnet:\?).+/i;
  if (!urlRegex.test(url)) {
    return { status: "error", message: "Invalid URL" };
  }

  // Validate slug if provided
  if (slug) {
    const slugRegex = /^[a-zA-Z0-9_-]+$/;
    if (slug.length < 3 || slug.length > 50) {
      return {
        status: "error",
        message: "Slug must be between 3 and 50 characters",
      };
    }
    if (!slugRegex.test(slug)) {
      return {
        status: "error",
        message: "Slug can only contain letters, numbers, dash and underscore",
      };
    }
  }

  // GOOGLE SAFE BROWSING CHECK
  try {
    await googleSafeBrowsingCheck(url);
  } catch (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  let expiresAt: Date | null = null;
  if (expiry && userId) {
    expiresAt = new Date();
    switch (expiry) {
      case "24-hours":
        expiresAt.setDate(expiresAt.getDate() + 1);
        break;
      case "2-days":
        expiresAt.setDate(expiresAt.getDate() + 2);
        break;
      case "1-week":
        expiresAt.setDate(expiresAt.getDate() + 7);
        break;
      case "1-month":
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        break;
      case "never":
        expiresAt = null;
        break;
    }
  } else if (!expiry && !userId) {
    expiresAt = new Date(new Date().setMonth(new Date().getMonth() + 6));
  }

  try {
    if ((slug && !userId) || !slug) {
      slug = Monkey.word();
    }

    // Check if slug is already in use
    const slugDoc = await getDoc(doc(db, `new-links/${slug}`));
    if (slugDoc.exists()) {
      return {
        status: "error",
        message: "This slug is already in use. Please try another one.",
      };
    }
    const isProtected = !!password;
    let encryptedUrl = url;
    if (password) {
      const encryptUrlResponse = await encryptUrl(url, password);
      encryptedUrl = btoa(String.fromCharCode(...encryptUrlResponse));
    }

    const linkData: LinkDocument = {
      link: isProtected ? encryptedUrl : url,
      slug: slug,
      isProtected: isProtected,
      ...(userId && { userId }),
      createdAt: Timestamp.fromDate(new Date()),
      expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
    };

    const setDocPromises = [setDoc(doc(db, `new-links/${slug}`), linkData)];

    if (userId) {
      setDocPromises.push(
        setDoc(doc(db, `users/${userId}/links/${slug}`), {
          createdAt: new Date(),
          ...(!userId && {
            expiresAt,
          }),
          slug: slug,
        }),
      );
    }

    await Promise.all(setDocPromises);

    return {
      status: "success",
      message: "Link created successfully",
      linkData: {
        createdAt: new Date().getTime(),
        link:
          process.env.NODE_ENV === "development"
            ? `http://localhost:3000/${slug}`
            : `https://thiss.link/${slug}`,
        slug: slug,
        expiresAt: expiresAt ? expiresAt.getTime() : null,
        isProtected,
        userId,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      message: "Something went wrong, please try again",
    };
  }
}
