"use client";

import { Provider } from "jotai";
import { ThemeProvider } from "next-themes";
import "react-toastify/dist/ReactToastify.css";
import "../styles/globals.css";
import { Toaster } from "./ui/sonner";

// import { connectFirestoreEmulator } from "firebase/firestore";
// import { auth, db } from "@/lib/firebase/firebase";
// import { connectAuthEmulator } from "firebase/auth";

// // Add emulator connection before initialization
// connectFirestoreEmulator(db, "localhost", 8080);
// connectAuthEmulator(auth, "http://localhost:9099");

export const Providers = ({ children }) => {
  return (
    <Provider>
      <ThemeProvider attribute="class" forcedTheme="light" enableSystem={false}>
        {children}
      </ThemeProvider>
      <Toaster />
    </Provider>
  );
};
