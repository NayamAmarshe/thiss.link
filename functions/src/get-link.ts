import { Response } from "express";
import { Request } from "firebase-functions/https";
import { Firestore } from "firebase-admin/firestore";
import { LinkDocument } from "../../types/documents";

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
  res: Response<GetLinkResponse>,
  db: Firestore,
) => {
  try {
    const body: GetLinkRequest = req.body.data;
    const { slug } = body;

    if (!slug) {
      res.status(400).json({
        status: "error",
        message: "Slug is required",
      });
      return;
    }

    const linkRef = db.collection("new-links").doc(slug);
    const linkDoc = await linkRef.get();

    if (!linkDoc.exists) {
      res.status(404).json({
        status: "error",
        message: "Link not found",
      });
      return;
    }

    const linkData = linkDoc.data() as LinkDocument;

    // Check if the link is expired
    if (linkData.expiresAt) {
      const now = new Date().getTime();
      if (linkData.expiresAt.toDate().getTime() <= now) {
        // Delete expired link
        await linkRef.delete();
        res.status(410).json({
          status: "error",
          message: "Link has expired and been deleted",
        });
        return;
      }
    }

    res.status(200).json({
      status: "success",
      message: "Link found",
      linkData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Something went wrong, please try again",
    });
  }
};
