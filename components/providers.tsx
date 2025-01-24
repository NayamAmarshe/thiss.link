"use client";

import { Provider } from "jotai";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import "react-toastify/dist/ReactToastify.css";
import "../styles/globals.css";

// import { connectFirestoreEmulator } from "firebase/firestore";
// import { auth, db } from "@/lib/firebase/firebase";
// import { connectAuthEmulator } from "firebase/auth";

// // Add emulator connection before initialization
// connectFirestoreEmulator(db, "localhost", 8080);
// connectAuthEmulator(auth, "http://localhost:9099");

export const Providers = ({ children }) => {
  return (
    <Provider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
      >
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
