import * as firebaseLogger from "firebase-functions/logger";

// Determine if we're in a production environment
// This checks for common environment variables used to indicate production
const isProduction = () => {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.FUNCTIONS_EMULATOR !== "true"
  );
};

/**
 * Custom logger that uses console.log in development and Firebase logger in production
 */
export const logger = {
  /**
   * Log info level messages
   * @param message The message to log
   * @param data Optional structured data to include
   */
  info: (message: string, data?: any) => {
    if (isProduction()) {
      firebaseLogger.info(message, { structuredData: true, ...data });
    } else {
      console.log(`[INFO] ${message}`, data || "");
    }
  },

  /**
   * Log warning level messages
   * @param message The message to log
   * @param data Optional structured data to include
   */
  warn: (message: string, data?: any) => {
    if (isProduction()) {
      firebaseLogger.warn(message, { structuredData: true, ...data });
    } else {
      console.warn(`[WARN] ${message}`, data || "");
    }
  },

  /**
   * Log error level messages
   * @param message The message to log
   * @param data Optional structured data to include
   */
  error: (message: string, data?: any) => {
    if (isProduction()) {
      firebaseLogger.error(message, { structuredData: true, ...data });
    } else {
      console.error(`[ERROR] ${message}`, data || "");
    }
  },

  /**
   * Log debug level messages (only shown in development)
   * @param message The message to log
   * @param data Optional structured data to include
   */
  debug: (message: string, data?: any) => {
    if (isProduction()) {
      // In production, debug logs are typically suppressed
      // But you could enable them with firebaseLogger.debug if needed
    } else {
      console.debug(`[DEBUG] ${message}`, data || "");
    }
  },
};
