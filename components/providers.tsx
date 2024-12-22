"use client";

import { Provider } from "jotai";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import "react-toastify/dist/ReactToastify.css";
import "../styles/globals.css";

export const Providers = ({ children }) => {
  return (
    <Provider>
      <ThemeProvider attribute="class" defaultTheme="light">
        <PayPalScriptProvider
          options={{
            clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
            vault: true,
          }}
        >
          {children}
        </PayPalScriptProvider>
      </ThemeProvider>
      <Toaster />
    </Provider>
  );
};
