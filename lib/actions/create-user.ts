import { db } from "@/lib/firebase";
import { UserDocument } from "@/types/documents";
import { User } from "firebase/auth";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";

export const runtime = "edge";

export interface CreateUserRequest {
  user?: User;
}
export type CreateUserResponse = {
  status: "success" | "error";
  message: string;
};

export async function createUser({
  user,
}: CreateUserRequest): Promise<CreateUserResponse> {
  if (!user?.uid) {
    console.error("No user found");
    return {
      status: "error",
      message: "Missing required fields",
    };
  }

  try {
    const usersRef = collection(db, "users");

    const userDoc = doc(usersRef, user.uid);
    const userDocSnapshot = await getDoc(userDoc);
    if (userDocSnapshot.exists()) {
      console.log("User already exists");
      return {
        status: "success",
        message: "User already exists",
      };
    }
    await setDoc(userDoc, {
      createdAt: new Date().toISOString(),
      name: user?.displayName,
      email: user?.email,
      photoURL: user?.photoURL,
      uid: user?.uid,
    } as UserDocument);
    console.log("User created successfully");
  } catch (error) {
    console.error("Error creating user:", error);
    return {
      status: "error",
      message: "Error creating user",
    };
  }

  return {
    status: "success",
    message: "User created successfully",
  };
}
