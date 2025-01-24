const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

export async function getFirestoreDoc(path: string) {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.FIREBASE_ADMIN_TOKEN}`,
      },
    },
  );
  if (!response.ok) return null;
  return response.json();
}

export async function setFirestoreDoc(path: string, data: any) {
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${path}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.FIREBASE_ADMIN_TOKEN}`,
      },
      body: JSON.stringify({
        fields: convertToFirestoreFields(data),
      }),
    },
  );
  return response.json();
}

function convertToFirestoreFields(data: any) {
  const fields: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value instanceof Date) {
      fields[key] = { timestampValue: value.toISOString() };
    } else if (value === null) {
      fields[key] = { nullValue: null };
    } else if (typeof value === "string") {
      fields[key] = { stringValue: value };
    } else if (typeof value === "boolean") {
      fields[key] = { booleanValue: value };
    } else if (typeof value === "number") {
      fields[key] = { integerValue: value };
    }
  }
  return fields;
}
