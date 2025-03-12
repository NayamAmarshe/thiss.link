import * as admin from "firebase-admin";
admin.initializeApp();

import { createLink } from "./handlers/create-link";
import { verifySubscription } from "./handlers/verify-subscription";
import { getLink } from "./handlers/get-link";

export { createLink, verifySubscription, getLink };
