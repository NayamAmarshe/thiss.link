import { Response } from "express";
import { Request } from "firebase-functions/https";
import { Firestore } from "firebase-admin/firestore";
import { LinkDocument } from "../../../types/documents";

export type GetLinkRequest = {
  slug: string;
};

export type GetLinkResponse = {
  status: string;
  message: string;
  linkData?: LinkDocument;
};

export const getLinkHandler = async (
  req: Request,
  res: Response,
  db: Firestore,
) => {
  try {
    const body: GetLinkRequest = req.body.data;
    console.log("🚀 => body:", body);
    const { slug } = body;

    if (!slug) {
      return res.status(200).send({
        data: {
          status: "error",
          message: "Slug is required",
        },
      });
    }

    const linkRef = db.collection("new-links").doc(slug);
    const linkDoc = await linkRef.get();

    if (!linkDoc.exists) {
      return res.status(200).send({
        data: {
          status: "error",
          message: "Link not found",
        },
      });
    }

    const linkData = linkDoc.data() as LinkDocument;

    // Check if the link is expired
    if (linkData.expiresAt) {
      const now = new Date().getTime();
      if (linkData.expiresAt.toDate().getTime() <= now) {
        // Delete expired link
        await linkRef.delete();
        return res.status(200).send({
          data: {
            status: "error",
            message: "Link has expired and been deleted",
          },
        });
      }
    }

    return res.status(200).send({
      data: {
        status: "success",
        message: "Link found",
        linkData,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send({
      data: {
        status: "error",
        message: "Something went wrong, please try again",
      },
    });
  }
};
