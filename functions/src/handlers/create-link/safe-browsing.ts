import { logger } from "firebase-functions/v1";

export const dynamic = "force-dynamic";

export const googleSafeBrowsingCheck = async (url: string) => {
  logger.log("Checking URL:", url);
  
  // Check if safe browsing should be skipped
  const SKIP_SAFE_BROWSING = process.env.SKIP_SAFE_BROWSING;
  if (SKIP_SAFE_BROWSING === "true") {
    logger.log("🚀 => googleSafeBrowsingCheck => SKIP_SAFE_BROWSING is true, skipping safe browsing check");
    return;
  }
  
  try {
    const SAFE_BROWSING_API_KEY = process.env.SAFE_BROWSING_API_KEY;
    logger.log(
      "🚀 => googleSafeBrowsingCheck => SAFE_BROWSING_API_KEY:",
      SAFE_BROWSING_API_KEY,
    );

    if (!SAFE_BROWSING_API_KEY) {
      console.log("API key not found.");
      throw new Error("API key not found.");
    }
    const response = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${SAFE_BROWSING_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client: {
            clientId: "maglit-website",
            clientVersion: "1.0.0",
          },
          threatInfo: {
            threatTypes: [
              "MALWARE",
              "SOCIAL_ENGINEERING",
              "UNWANTED_SOFTWARE",
              "POTENTIALLY_HARMFUL_APPLICATION",
            ],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }],
          },
        }),
      },
    );

    const data = await response.json();
    logger.info("Safe Browsing Check Response:", data);

    if (data && data?.matches?.length > 0) {
      // Handle error cases where the URL might not be checked by Safe Browsing
      throw new Error("Malicious link entered!");
    }
  } catch (error: any) {
    throw new Error(error.message);
  }
};
