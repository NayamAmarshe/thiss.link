import { LinkDocument } from "@/types/documents";
import { atomWithStorage } from "jotai/utils";

export type LinkExpiry =
  | "24-hours"
  | "2-days"
  | "1-week"
  | "1-month"
  | undefined;
export const linkExpiryAtom = atomWithStorage<LinkExpiry>(
  "link_expiry",
  undefined,
);

export const downloadQrCodeAtom = atomWithStorage<boolean>(
  "download_qr_code",
  false,
);

export const generatedLinksAtom = atomWithStorage<LinkDocument[]>(
  "generated_links",
  [],
);
