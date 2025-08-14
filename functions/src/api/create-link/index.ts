import { Timestamp } from "firebase-admin/firestore";
import { onCall } from "firebase-functions/https";
import { encryptUrl } from "./encrypt-url";
import { googleSafeBrowsingCheck } from "./safe-browsing";
import Monkey from "monkey-typewriter";
import { LinkDocument, UserDocument } from "../../../../types/documents";
import { logger } from "../../lib/logger";
import { db } from "../../lib/db";

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

export const createLink = onCall(
  {
    cors: true,
    timeoutSeconds: 60,
    region: ["us-central1"],
  },
  async (req): Promise<CreateLinkResponse> => {
    logger.info("createLink called!", { structuredData: true });

    try {
      const body: CreateLinkRequest = req.data;
      const {
        url,
        password,
        userId,
        slug: providedSlug,
        expiry: providedExpiry,
      } = body;

      let slug = providedSlug || "";
      let expiry = providedExpiry;

      let userData: UserDocument | null = null;

      // If user is not logged in, disable premium features
      if (!userId) {
        expiry = undefined;
        slug = "";
      } else {
        // Check subscription status for logged-in users
        const userDoc = await db.collection("users").doc(userId).get();
        userData = userDoc.data() as UserDocument;

        // If no active subscription, check custom link limits and update usage
        if (!userData?.isSubscribed) {
          expiry = undefined;
          // Initialize or check monthly usage
          const now = new Date();
          const currentUsage = userData.customLinksUsage || {
            count: 0,
            monthlyReset: Timestamp.fromDate(now),
          };
          // Reset counter if we're in a new month
          if (now.getTime() > currentUsage.monthlyReset.toDate().getTime()) {
            currentUsage.count = 0;
            currentUsage.monthlyReset = Timestamp.fromDate(
              new Date(now.getFullYear(), now.getMonth() + 1, 1),
            );
          }
          // Check if user has reached monthly limit
          if (slug.length && currentUsage.count >= 5) {
            return {
              status: "error",
              message:
                "You have reached the limit of 5 custom links for this month. Please upgrade to create more custom links.",
            };
          }
          // Store current usage for later update after successful creation
          userData.customLinksUsage = currentUsage;
        }
      }

      if (!url) {
        return {
          status: "error",
          message: "Missing required fields",
        };
      }

      // Validate URL
      const urlRegex = /^(https?:\/\/|ftp:\/\/|magnet:\?).+/i;
      if (!urlRegex.test(url)) {
        return {
          status: "error",
          message: "Invalid URL",
        };
      }

      // Validate slug
      if (slug) {
        const slugRegex = /^[a-zA-Z0-9_-]+$/;
        if (slug.length < 3 || slug.length > 50) {
          return {
            status: "error",
            message: "Slug must be between 3 and 50 characters.",
          };
        }
        if (!slugRegex.test(slug)) {
          return {
            status: "error",
            message:
              "Slug can only contain letters, numbers, dash, and underscore",
          };
        }
      }

      // Google Safe Browsing Check
      try {
        await googleSafeBrowsingCheck(url);
      } catch (error: any) {
        return {
          status: "error",
          message: error.message,
        };
      }

      // Calculate expiration date
      let expiresAt: Date | null = null;
      if (expiry && userId && userData?.isSubscribed) {
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
      } else {
        // Default expiration date for non-premium users
        expiresAt = new Date(new Date().setMonth(new Date().getMonth() + 6));
      }

      // Generate slug if not provided
      if (!slug || (slug && !userId)) {
        slug = Monkey.word();
      }

      // Check if slug is already in use
      const slugDoc = await db.collection("new-links").doc(slug).get();
      if (slugDoc.exists) {
        return {
          status: "error",
          message:
            "This custom link is already in use. Please try another one.",
        };
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

        // Only increment usage after successful creation for non-premium users
        // Check subscription status for logged-in users
        if (
          providedSlug &&
          userData?.customLinksUsage &&
          !userData?.isSubscribed
        ) {
          batch.update(db.collection("users").doc(userId), {
            customLinksUsage: {
              count: userData.customLinksUsage.count + 1,
              monthlyReset: userData.customLinksUsage.monthlyReset,
            },
          });
        }
      }

      await batch.commit();

      const responseData: CreateLinkResponse = {
        status: "success",
        message: "Link created successfully",
        linkData: {
          createdAt: Timestamp.fromDate(new Date()),
          link:
            process.env.NODE_ENV === "development"
              ? `http://localhost:3000/${slug}`
              : `https://thiss.link/${slug}`,
          slug,
          expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
          isProtected,
        },
      };
      logger.info("🚀 => Created link:", responseData);

      return responseData;
    } catch (error) {
      console.error(error);
      return {
        status: "error",
        message:
          "Something went wrong, please try again. " + JSON.stringify(error),
      };
    }
  },
);
