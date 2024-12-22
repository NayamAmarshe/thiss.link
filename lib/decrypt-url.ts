export const decryptUrl = async (
  url: string,
  password: string,
): Promise<string> => {
  const textEncoder = new TextEncoder();

  const encryptedData = new Uint8Array(
    Array.from(atob(url), (c) => c.charCodeAt(0)),
  );

  const salt = encryptedData.slice(0, 32);
  const iv = encryptedData.slice(32, 48);
  const data = encryptedData.slice(48);

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
    ["decrypt"],
  );

  // Will throw an error if the password is incorrect
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data,
  );

  return new TextDecoder().decode(decrypted);
};
