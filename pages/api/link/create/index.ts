import { NextApiRequest, NextApiResponse } from "next";
import { googleSafeBrowsingCheck } from "./safe-browsing";
import { encryptUrl } from "../../../../lib/encrypt-url";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Monkey from "monkey-typewriter";
import { LinkDocument } from "@/types/documents";
import type { LinkExpiry } from "@/components/atoms/user-settings";

export interface CreateLinkRequest extends NextApiRequest {
  body: {
    slug: string;
    url: string;
    password: string;
    userId?: string;
    expiry?: LinkExpiry | "never";
  };
}
export type CreateLinkResponse = {
  status: string;
  message: string;
  linkData?: LinkDocument;
};

export default async function handler(
  req: CreateLinkRequest,
  res: NextApiResponse<CreateLinkResponse>,
) {
  const { url, password, userId } = req.body;

  let slug = req.body.slug || "";
  let expiry = req.body.expiry;
  if (!userId) {
    expiry = undefined;
  }

  if (!url) {
    return res.status(400).json({
      status: "error",
      message: "Missing required fields",
    });
  }

  const urlRegex = /^(https?:\/\/|ftp:\/\/|magnet:\?).+/i;
  if (!urlRegex.test(url)) {
    return res.status(400).json({
      status: "error",
      message: "Invalid URL",
    });
  }

  // GOOGLE SAFE BROWSING CHECK
  try {
    await googleSafeBrowsingCheck(url);
  } catch (error) {
    return res.status(401).json({
      status: "error",
      message: error.message,
    });
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
    const isProtected = !!password;
    let encryptedUrl = url;
    if (password) {
      const encryptUrlResponse = await encryptUrl(url, password);
      encryptedUrl = btoa(String.fromCharCode(...encryptUrlResponse));
    }

    const forwarded = req.headers["x-forwarded-for"];
    // Store IP Address of potential scammers
    const ip = forwarded
      ? (forwarded as string).split(/, /)[0]
      : req.socket.remoteAddress;

    const linkData: LinkDocument = {
      link: isProtected ? encryptedUrl : url,
      slug: slug,
      isProtected: isProtected,
      ...(userId && { userId }),
      ...(!userId && {
        ip,
      }),
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

    return res.status(200).json({
      status: "success",
      message: "Link created successfully",
      linkData: {
        createdAt: Timestamp.fromDate(new Date()),
        link:
          process.env.NODE_ENV === "development"
            ? `http://localhost:3000/${slug}`
            : `https://thiss.link/${slug}`,
        slug: slug,
        expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
        isProtected,
        userId,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong, please try again",
    });
  }
}
