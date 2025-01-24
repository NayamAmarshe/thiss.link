import { db } from "@/lib/firebase";
import { UserDocument } from "@/types/documents";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface CreateUserRequest {
  user: {
    uid: string;
    displayName?: string;
    email?: string;
    photoURL?: string;
  };
}

export type CreateUserResponse = {
  status: "success" | "error";
  message: string;
};

export async function POST(req: Request) {
  try {
    const body: CreateUserRequest = await req.json();

    const { user } = body;

    if (!user?.uid) {
      return NextResponse.json<CreateUserResponse>(
        {
          status: "error",
          message: "Missing required fields",
        },
        { status: 400 },
      );
    }

    const usersRef = collection(db, "users");
    const userDoc = doc(usersRef, user.uid);
    const userDocSnapshot = await getDoc(userDoc);

    if (userDocSnapshot.exists()) {
      return NextResponse.json<CreateUserResponse>(
        {
          status: "success",
          message: "User already exists",
        },
        { status: 200 },
      );
    }

    await setDoc(userDoc, {
      createdAt: new Date().toISOString(),
      name: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      uid: user.uid,
    } as UserDocument);

    return NextResponse.json<CreateUserResponse>(
      {
        status: "success",
        message: "User created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json<CreateUserResponse>(
      {
        status: "error",
        message: "Error creating user",
      },
      { status: 500 },
    );
  }
}
