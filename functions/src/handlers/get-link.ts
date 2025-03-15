import { onCall } from "firebase-functions/https";
import { LinkDocument } from "../../../types/documents";
import { db } from "../lib/db";
import { logger } from "../lib/logger";

export type GetLinkRequest = {
  slug: string;
};

export type GetLinkResponse = {
  status: string;
  message: string;
  linkData?: LinkDocument;
};

export const getLink = onCall(
  {
    cors: true,
    timeoutSeconds: 60,
    region: ["us-central1"],
  },
  async (request): Promise<GetLinkResponse> => {
    logger.info("getLink called!", { structuredData: true });
    try {
      const body: GetLinkRequest = request.data;
      console.log("🚀 => body:", body);
      const { slug } = body;

      if (!slug) {
        return {
          status: "error",
          message: "Slug is required",
        };
      }

      const linkRef = db.collection("new-links").doc(slug);
      const linkDoc = await linkRef.get();

      if (!linkDoc.exists) {
        return {
          status: "error",
          message: "Link not found",
        };
      }

      const linkData = linkDoc.data() as LinkDocument;

      // Check if the link is expired
      if (linkData.expiresAt) {
        const now = new Date().getTime();
        if (linkData.expiresAt.toDate().getTime() <= now) {
          // Delete expired link
          await linkRef.delete();
          return {
            status: "error",
            message: "Link has expired and been deleted",
          };
        }
      }

      return {
        status: "success",
        message: "Link found",
        linkData,
      };
    } catch (error) {
      console.error(error);
      return {
        status: "error",
        message: "Something went wrong, please try again",
      };
    }
  },
);
