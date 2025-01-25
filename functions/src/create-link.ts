import { Firestore, Timestamp } from "firebase-admin/firestore";
import { LinkDocument } from "../../types/documents";
import { Request } from "firebase-functions/https";
import { Response } from "express";
import { encryptUrl } from "../../lib/encrypt-url";
import { googleSafeBrowsingCheck } from "./safe-browsing";
import Monkey from "monkey-typewriter";

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

export const createLinkHandler = async (
  req: Request,
  res: Response<CreateLinkResponse>,
  db: Firestore,
) => {
  try {
    const body: CreateLinkRequest = req.body.data;
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
      res.status(400).send({
        status: "error",
        message: "Missing required fields",
      });
      return;
    }

    // Validate URL
    const urlRegex = /^(https?:\/\/|ftp:\/\/|magnet:\?).+/i;
    if (!urlRegex.test(url)) {
      res.status(400).json({
        status: "error",
        message: "Invalid URL",
      });
      return;
    }

    // Validate slug
    if (slug) {
      const slugRegex = /^[a-zA-Z0-9_-]+$/;
      if (slug.length < 3 || slug.length > 50) {
        res.status(400).json({
          status: "error",
          message: "Slug must be between 3 and 50 characters.",
        });
        return;
      }
      if (!slugRegex.test(slug)) {
        res.status(400).json({
          status: "error",
          message:
            "Slug can only contain letters, numbers, dash, and underscore",
        });
        return;
      }
    }

    // Google Safe Browsing Check
    try {
      await googleSafeBrowsingCheck(url);
    } catch (error: any) {
      res.status(400).json({
        status: "error",
        message: error.message,
      });
      return;
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
      slug = Monkey.word();
    }

    // Check if slug is already in use
    const slugDoc = await db.collection("new-links").doc(slug).get();
    if (slugDoc.exists) {
      res.status(400).json({
        status: "error",
        message: "This slug is already in use. Please try another one.",
      });
      return;
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
      ...(expiresAt && { expiresAt: Timestamp.fromDate(expiresAt) }),
    };

    // Write data to Firestore
    const batch = db.batch();
    batch.set(db.collection("new-links").doc(slug), linkData);

    if (userId) {
      batch.set(
        db.collection("users").doc(userId).collection("links").doc(slug),
        {
          createdAt: new Date(),
          ...(expiresAt && { expiresAt }),
          slug,
        },
      );
    }

    await batch.commit();

    const isDev = process.env.NODE_ENV === "development";

    const responseData: CreateLinkResponse = {
      status: "success",
      message: "Link created successfully",
      linkData: {
        createdAt: Timestamp.fromDate(new Date()),
        link: isDev
          ? `http://localhost:3000/${slug}`
          : `https://thiss.link/${slug}`,
        slug,
        expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
        isProtected,
      },
    };

    res.status(201).json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message:
        "Something went wrong, please try again. " + JSON.stringify(error),
    });
  }
};
