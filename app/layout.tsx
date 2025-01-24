import "react-toastify/dist/ReactToastify.css";
import "../styles/globals.css";
import { Providers } from "@/components/providers";
import { connectFirestoreEmulator } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { connectAuthEmulator } from "firebase/auth";

export const metadata = {
  title: "MagLit🔥 - Privacy Respecting Encrypted Link Shortener",
  description: "Encrypted & Privacy Respecting Magnet/HTTP(s) Link Shortener",
  // metadataBase: new URL(BASE_URL),
  // manifest: "/manifest.json",
  // openGraph: {
  //   title: "MagLit🔥",
  //   description:
  //     "A Free and Open Source Encrypted Privacy Respecting Magnet/HTTP(s) Link Shortener",
  //   url: BASE_URL,
  //   themeColor: "#fcd34d",
  //   type: "website",
  //   images: [`${BASE_URL}og-image.jpg`],
  // },
  // twitter: {
  //   card: "summary",
  //   title: "MagLit🔥 - Encrypted Private Link Shortener",
  //   description:
  //     "A Free and Open Source Encrypted Privacy Respecting Magnet/HTTP(s) Link Shortener",
  //   images: [`${BASE_URL}og-image.jpg`],
  // },
  // googleAdsense: {
  //   account: "ca-pub-8844413928625246",
  // },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
