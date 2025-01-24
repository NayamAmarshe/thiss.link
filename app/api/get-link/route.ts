import { NextResponse } from "next/server";
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

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const { slug }: GetLinkRequest = body;

  if (!slug) {
    return NextResponse.json<GetLinkResponse>(
      {
        status: "error",
        message: "Slug is required",
      },
      { status: 400 },
    );
  }

  try {
    const linkRef = doc(db, "new-links", slug);
    const linkDoc = await getDoc(linkRef);

    if (!linkDoc.exists()) {
      return NextResponse.json<GetLinkResponse>(
        {
          status: "error",
          message: "Link not found",
        },
        { status: 404 },
      );
    }

    const linkData = linkDoc.data() as LinkDocument;

    // Check if the link is expired
    if (linkData.expiresAt) {
      const now = new Date();
      const expiryDate = (linkData.expiresAt as Timestamp).toDate();

      if (expiryDate <= now) {
        // Delete expired link
        await deleteDoc(linkRef);
        return NextResponse.json<GetLinkResponse>(
          {
            status: "error",
            message: "Link has expired and been deleted",
          },
          { status: 410 },
        );
      }
    }

    return NextResponse.json<GetLinkResponse>({
      status: "success",
      message: "Link found",
      linkData: {
        ...linkData,
        createdAt: (linkData.createdAt as Timestamp).toDate().getTime(),
        expiresAt: linkData.expiresAt
          ? (linkData.expiresAt as Timestamp).toDate().getTime()
          : null,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json<GetLinkResponse>(
      {
        status: "error",
        message: "Something went wrong, please try again",
      },
      { status: 500 },
    );
  }
}
