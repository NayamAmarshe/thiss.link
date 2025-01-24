import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { encryptUrl } from "@/lib/encrypt-url";
import { NextResponse } from "next/server";
import { LinkDocument } from "@/types/documents";
import { googleSafeBrowsingCheck } from "./safe-browsing";
import { generateWord } from "@/lib/generate-slug";

export type CreateLinkRequest = {
  slug: string;
  url: string;
  password: string;
  userId?: string;
  expiry?: "24-hours" | "2-days" | "1-week" | "1-month" | "never";
};

export type CreateLinkResponse = {
  status: string;
  message: string;
  linkData?: LinkDocument;
};

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body: CreateLinkRequest = await req.json();
    const {
      url,
      password,
      userId,
      slug: providedSlug,
      expiry: providedExpiry,
    } = body;

    let slug = providedSlug || "";
    let expiry = providedExpiry;

    if (!userId) {
      expiry = undefined;
    }

    if (!url) {
      return NextResponse.json<CreateLinkResponse>(
        { status: "error", message: "Missing required fields" },
        { status: 400 },
      );
    }

    // Validate URL
    const urlRegex = /^(https?:\/\/|ftp:\/\/|magnet:\?).+/i;
    if (!urlRegex.test(url)) {
      return NextResponse.json<CreateLinkResponse>(
        { status: "error", message: "Invalid URL" },
        { status: 400 },
      );
    }

    // Validate slug
    if (slug) {
      const slugRegex = /^[a-zA-Z0-9_-]+$/;
      if (slug.length < 3 || slug.length > 50) {
        return NextResponse.json<CreateLinkResponse>(
          {
            status: "error",
            message: "Slug must be between 3 and 50 characters.",
          },
          { status: 400 },
        );
      }
      if (!slugRegex.test(slug)) {
        return NextResponse.json<CreateLinkResponse>(
          {
            status: "error",
            message:
              "Slug can only contain letters, numbers, dash, and underscore",
          },
          { status: 400 },
        );
      }
    }

    // Google Safe Browsing Check
    try {
      await googleSafeBrowsingCheck(url);
    } catch (error: any) {
      return NextResponse.json<CreateLinkResponse>(
        { status: "error", message: error.message },
        { status: 400 },
      );
    }

    // Calculate expiration date
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

    // Generate slug if not provided
    if (!slug || (slug && !userId)) {
      slug = generateWord();
    }

    // Check if slug is already in use
    const slugDoc = await getDoc(doc(db, `new-links/${slug}`));
    if (slugDoc.exists()) {
      return NextResponse.json<CreateLinkResponse>(
        {
          status: "error",
          message: "This slug is already in use. Please try another one.",
        },
        { status: 400 },
      );
    }

    // Encrypt URL if password is provided
    const isProtected = !!password;
    let encryptedUrl = url;
    if (password) {
      const encryptUrlResponse = await encryptUrl(url, password);
      encryptedUrl = btoa(String.fromCharCode(...encryptUrlResponse));
    }

    // Prepare link data
    const linkData: LinkDocument = {
      link: isProtected ? encryptedUrl : url,
      slug,
      isProtected,
      createdAt: Timestamp.fromDate(new Date()),
      expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
    };

    // Write data to Firestore
    const setDocPromises = [setDoc(doc(db, `new-links/${slug}`), linkData)];

    if (userId) {
      setDocPromises.push(
        setDoc(doc(db, `users/${userId}/links/${slug}`), {
          createdAt: new Date(),
          ...(expiresAt && { expiresAt }),
          slug,
        }),
      );
    }

    await Promise.all(setDocPromises);

    const isDev = process.env.NODE_ENV === "development";

    const responseData: CreateLinkResponse = {
      status: "success",
      message: "Link created successfully",
      linkData: {
        createdAt: new Date().getTime(),
        link: isDev
          ? `http://localhost:3000/${slug}`
          : `https://thiss.link/${slug}`,
        slug,
        expiresAt: expiresAt ? expiresAt.getTime() : null,
        isProtected,
      },
    };

    return NextResponse.json<CreateLinkResponse>(responseData, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json<CreateLinkResponse>(
      {
        status: "error",
        message:
          "Something went wrong, please try again. " + JSON.stringify(error),
      },
      { status: 500 },
    );
  }
}
