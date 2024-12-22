import { NextApiRequest, NextApiResponse } from "next";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LinkDocument } from "@/types/documents";

export interface GetLinkRequest extends NextApiRequest {
  body: {
    slug: string;
  };
}
export type GetLinkResponse = {
  status: string;
  message: string;
  linkData?: LinkDocument;
};

export default async function handler(
  req: GetLinkRequest,
  res: NextApiResponse<GetLinkResponse>,
) {
  let slug = req.body.slug || "";

  if (!slug) {
    return res.status(400).json({
      status: "error",
      message: "Slug is required",
    });
  }

  try {
    const linkRef = doc(db, "new-links", slug);
    const linkDoc = await getDoc(linkRef);
    if (!linkDoc.exists()) {
      return res.status(400).json({
        status: "error",
        message: "Link not found",
      });
    }

    const linkData = linkDoc.data() as LinkDocument;

    // Calculate cache duration based on expiry
    if (linkData.expiresAt) {
      const now = new Date();
      const expiryDate = linkData.expiresAt.toDate();
      console.log("🚀 => expiryDate:", expiryDate);

      if (expiryDate > now) {
        // Calculate seconds until expiry
        const maxAge = Math.floor(
          (expiryDate.getTime() - now.getTime()) / 1000,
        );
        // Set cache headers
        res.setHeader(
          "Cache-Control",
          `public, max-age=${maxAge}, s-maxage=${maxAge}`,
        );
        // Add stale-while-revalidate for better performance
        res.setHeader("Surrogate-Control", `max-age=${maxAge}`);
        // Add Expires header
        res.setHeader("Expires", expiryDate.toUTCString());
      } else {
        // If already expired, don't cache
        res.setHeader("Cache-Control", "no-store");
      }
    } else {
      // If no expiry set, cache for a default period (e.g., 1 hour)
      res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
      res.setHeader("Surrogate-Control", "max-age=3600");
    }

    return res.status(200).json({
      status: "success",
      message: "Link found",
      linkData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "Something went wrong, please try again",
    });
  }
}
