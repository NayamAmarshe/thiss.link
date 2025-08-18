import { doc, setDoc } from "firebase/firestore";
import { db } from "../../utils/firebase";
import CryptoJS from "crypto-js";
import { StatusCodes } from "http-status-codes";

const regex = /^(?:(http)s?|ftp|magnet):(?:\/\/[^\s/$.?#].[^\s]*|[^\s]*)$/;

const slugRegex = /^[a-z0-9](-?[a-z0-9])*$/;

const MAX_REDIRECTS = 1; // Maximum allowed redirects

const maliciousDomains = [
  ".eu.org",
  "nakula.fun",
  "ixg.llc",
  "datingflirt.click",
  "wahyucakep.org",
];

// Helper function to check JavaScript-based or meta redirects in page content
function checkForJSRedirect(content) {
  // Regex patterns to detect JavaScript and meta tag redirects
  const jsRedirectRegex =
    /(?:window\.location\.(?:href|assign|replace)\s*=\s*['"]([^'"]+)['"]|window\.opener\s*=\s*null;\s*location\.(?:replace|href|assign)\(['"]([^'"]+)['"]\))/;
  const metaRedirectRegex =
    /<meta[^>]+http-equiv=["']refresh["'][^>]+url=([^'"]+)/i;

  // Check for JavaScript-based redirects
  const jsMatch = content.match(jsRedirectRegex);
  const metaMatch = content.match(metaRedirectRegex);

  // Return the URL if found in any match
  return jsMatch?.[1] || jsMatch?.[2] || metaMatch?.[1] || null;
}

async function fetchWithRedirects(url, maxRedirects) {
  let currentUrl = url;
  let redirectCount = 0;

  while (redirectCount < maxRedirects) {
    const response = await fetch(currentUrl, {
      redirect: "manual", // Do not follow redirects
    });

    const pageContent = await response.text();
    const jsRedirect = checkForJSRedirect(pageContent);

    if (jsRedirect) {
      currentUrl = jsRedirect;
      redirectCount++;
      console.log(`JS Redirect ${redirectCount} to: ${currentUrl}`);
    } else {
      // No further redirects, return the final response
      return { response, redirectCount, currentUrl };
    }
  }

  // Return the final response after redirect threshold or no more redirects
  return { response: await fetch(currentUrl), redirectCount };
}

// Function to verify Turnstile token
async function verifyTurnstileToken(token) {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Turnstile secret key not configured");
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    },
  );

  const result = await response.json();
  return result.success;
}

export default async function handler(req, res) {
  const { slug, link, password, captchaToken } = req.body;
  console.log("🚀 => body:", req.body);

  // Verify captcha token first
  if (!captchaToken) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Captcha verification required",
    });
  }

  try {
    const captchaValid = await verifyTurnstileToken(captchaToken);
    if (!captchaValid) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Captcha verification failed. Please try again.",
      });
    }
  } catch (error) {
    console.error("Captcha verification error:", error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Captcha verification service unavailable",
    });
  }

  const apiKey = process.env.SAFE_BROWSING_API_KEY;

  if (!apiKey) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "API not available" });
  }

  const collectionName =
      process.env.NODE_ENV === "production" ? "links" : "testLinks",
    URI = regex.exec(link);

  // check if link is valid
  if (link.length < 1) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ slug, message: "You entered an invalid link" });
  }

  if (URI === null) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      slug,
      message:
        "Please make sure your link starts with http://, https://, ftp://, or magnet:",
    });
  }

  // check if slug is valid
  if (slug.length < 1) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Invalid Slug!" });
  }

  if (!slugRegex.test(slug)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message:
        "The slug should only contain lowercase alphabets, numbers and hyphen",
    });
  }

  if (maliciousDomains.some((domain) => link.includes(domain))) {
    return res.status(401).json({ message: "Malicious link entered!" });
  }

  if (URI[1]) {
    // Redirection check
    try {
      // Step 1: Check for HTTP redirects using fetch
      const { redirectCount, currentUrl } = await fetchWithRedirects(
        link,
        MAX_REDIRECTS,
      );

      if (maliciousDomains.some((domain) => currentUrl.includes(domain))) {
        return res.status(401).json({ message: "Malicious link entered!" });
      }
      if (redirectCount >= MAX_REDIRECTS) {
        console.log("🚀 => redirectCount:", redirectCount);
        return res.status(400).json({
          message: `Suspcious URL detected. If this is a valid URL, please report this issue.`,
        });
      }
    } catch (error) {
      console.error("Error checking link:", error);
      return res.status(500).json({
        message: "Error checking the link.",
      });
    }

    if (process.env.SKIP_SAFE_BROWSING === "true") {
      console.log("Skipping safe browsing check");
    } else {
      try {
        const response = await fetch(
          "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=" +
            apiKey,
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
                threatEntries: [{ url: `${link}` }],
              },
            }),
          },
        );

        const data = await response.json();
        console.log("🚀 => data:", data);

        if (data && data?.matches?.length > 0) {
          // Handle error cases where the URL might not be checked by Safe Browsing
          res.status(401).json({ message: "Malicious link entered!" });
        }
      } catch (error) {
        res.status(500).json({ error: "Failed to check the URL." });
      }
    }
  }

  try {
    // create a new link
    if (!process.env.SECRET_KEY) {
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Server error..." });
    }
    const encryptedLink = CryptoJS.AES.encrypt(
      JSON.stringify({ link }),
      password === ""
        ? process.env.SECRET_KEY
        : process.env.SECRET_KEY + password,
    ).toString();

    await setDoc(doc(db, collectionName, slug), {
      link: encryptedLink,
      slug: slug,
      protected: !(password === ""),
    });

    res.setHeader("Cache-Control", "s-maxage=176400");
    return res.status(StatusCodes.OK).json({
      message: "Link lit successfully",
      maglitLink: slug,
    });
  } catch (err) {
    console.log("Error", err);
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Server Error, Please try again..." });
  }
}
