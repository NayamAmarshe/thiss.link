"use server";

import { doc, getDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LinkDocument } from "@/types/documents";

export interface GetLinkRequest {
  slug: string;
}
export type GetLinkResponse = {
  status: string;
  message: string;
  linkData?: LinkDocument;
};

export async function getLink({
  slug: providedSlug,
}: GetLinkRequest): Promise<GetLinkResponse> {
  let slug = providedSlug || "";

  if (!slug) {
    return {
      status: "error",
      message: "Slug is required",
    };
  }

  try {
    const linkRef = doc(db, "new-links", slug);
    const linkDoc = await getDoc(linkRef);
    if (!linkDoc.exists()) {
      return {
        status: "error",
        message: "Link not found",
      };
    }

    const linkData = linkDoc.data() as LinkDocument;

    // Check if link is expired
    if (linkData.expiresAt) {
      const now = new Date();
      const expiryDate = (linkData.expiresAt as Timestamp).toDate();

      if (expiryDate <= now) {
        // Delete expired link
        await deleteDoc(linkRef);
        return {
          status: "error",
          message: "Link has expired and been deleted",
        };
      }
    }

    return {
      status: "success",
      message: "Link found",
      linkData: {
        ...linkData,
        createdAt: (linkData.createdAt as Timestamp).toDate().getTime(),
        expiresAt: linkData.expiresAt
          ? (linkData.expiresAt as Timestamp).toDate().getTime()
          : null,
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
