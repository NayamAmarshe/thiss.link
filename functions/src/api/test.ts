import { onCall } from "firebase-functions/https";
import { logger } from "../lib/logger";

export type TestRequest = {
  status: string;
  message: string;
};

export const test = onCall(
  {
    cors: true,
    timeoutSeconds: 60,
    region: ["us-central1"],
  },
  async (req): Promise<TestRequest> => {
    logger.info("createLink called!", { structuredData: true });
    console.log("🚀 => req.body:", req.data);
    return {
      status: "error",
      message: "Missing required fields",
    };
  },
);
