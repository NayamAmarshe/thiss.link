import { Timestamp } from "firebase/firestore";

export type UserDocument = {
  uid: string;
  email: string;
  photoURL: string | undefined;
  name: string;
  createdAt: string;
  updatedAt: string;
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
  createdAt: Timestamp | number | null;
  ip?: string;
  isProtected?: boolean;
  expiresAt?: Timestamp | number | null;
};
