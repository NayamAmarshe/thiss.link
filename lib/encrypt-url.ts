export const encryptUrl = async (url: string, password?: string) => {
  // // For non-password URLs, just base64 encode
  // if (!password) {
  //   return btoa
  // }
  const textEncoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const baseKey = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      textEncoder.encode(url),
    ),
  );
  const totalLength = salt.length + iv.length + encrypted.length;
  const mergedData = new Uint8Array(totalLength);
  mergedData.set(salt);
  mergedData.set(iv, salt.length);
  mergedData.set(encrypted, salt.length + iv.length);
  return mergedData;
};
