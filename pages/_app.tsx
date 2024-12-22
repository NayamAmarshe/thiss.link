import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider } from "next-themes";
import "../styles/globals.css";
import Head from "next/head";
import { Provider } from "jotai";
import { useEffect } from "react";
import { BASE_URL } from "@/lib/config";
import { Toaster } from "@/components/ui/toaster";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if (
      !sessionStorage.getItem("_swa") &&
      document.referrer.indexOf(location.protocol + "//" + location.host) !== 0
    ) {
      fetch(
        "https://counter.dev/track?" +
          new URLSearchParams({
            referrer: document.referrer,
            screen: screen.width + "x" + screen.height,
            user: "maglit-admin@protonmail.com",
            utcoffset: "6",
          }),
      );
    }
    sessionStorage.setItem("_swa", "1");
  }, []);

  return (
    <>
      <Head>
        <title>MagLit🔥 - Privacy Respecting Encrypted Link Shortener</title>
        <meta
          name="google-adsense-account"
          content="ca-pub-8844413928625246"
        ></meta>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta
          name="description"
          content="Encrypted & Privacy Respecting Magnet/HTTP(s) Link Shortener"
        />
        <meta property="og:title" content="MagLit🔥" />
        <meta
          property="og:description"
          content="A Free and Open Source Encrypted Privacy Respecting Magnet/HTTP(s) Link Shortener"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta property="og:url" content={BASE_URL} />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={BASE_URL + "og-image.jpg"} />
        <meta property="og:image" content={BASE_URL + "og-image.jpg"} />
        <meta name="twitter:card" content="summary" />
        <meta
          property="twitter:title"
          content="MagLit🔥 - Encrypted Private Link Shortener"
        />
        <meta
          property="twitter:description"
          content="A Free and Open Source Encrypted Privacy Respecting Magnet/HTTP(s) Link Shortener"
        />
        <meta property="twitter:url" content={BASE_URL} />
        <meta property="twitter:image" content={BASE_URL + "og-image.jpg"} />
        <meta name="theme-color" content="#fcd34d" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Provider>
        <ThemeProvider attribute="class" defaultTheme="light">
          <PayPalScriptProvider
            options={{
              clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
              vault: true,
            }}
          >
            <Component {...pageProps} />
          </PayPalScriptProvider>
        </ThemeProvider>
        <Toaster />
      </Provider>
    </>
  );
}

export default MyApp;
