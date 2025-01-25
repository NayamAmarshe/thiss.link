import { Timestamp } from "@google-cloud/firestore";

export type UserDocument = {
  uid: string;
  email: string;
  photoURL: string | undefined;
  name: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  subscription?: {
    planDuration?: "monthly" | "yearly";
    subscriptionId: string;
    status: "ACTIVE" | "INACTIVE" | "CREATED";
    startPaymentTime: Timestamp | null;
    lastPaymentTime: Timestamp | null;
    nextPaymentTime: Timestamp | null;
    planId: string;
  };
};

export type UserLinksDocument = {
  createdAt: string;
  expiresAt?: string;
  slug: string;
};

export type LinkDocument = {
  link: string;
  slug: string;
  createdAt: Timestamp | null;
  ip?: string;
  isProtected?: boolean;
  expiresAt?: Timestamp | null;
};
