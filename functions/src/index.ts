import * as admin from "firebase-admin";
admin.initializeApp();

import { createLink } from "./api/create-link";
import { verifySubscription } from "./api/verify-subscription";
import { getLink } from "./api/get-link";

export { createLink, verifySubscription, getLink };
