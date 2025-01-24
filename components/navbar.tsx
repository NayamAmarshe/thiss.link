"use client";

import { useState } from "react";
import Link from "next/link";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "./ui/button";
import useUser from "../hooks/use-user";

const Navbar = () => {
  const { isLoggedIn, user, handleLogin, userLoading } = useUser();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      window.location.reload();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="dark:border-darkNavBorder m500:h-16 fixed left-0 top-0 z-20 mx-auto flex h-[88px] w-full items-center border-b-4 border-border bg-white/80 px-5 backdrop-blur-3xl dark:bg-secondaryBlack">
      <div className="mx-auto flex w-[1500px] max-w-full items-center justify-between text-text dark:text-darkText">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center">
            <span className="m900:w-[unset] m500:text-xl text-[33px] font-heading">
              thiss.link
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <Button
                onClick={handleLogout}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 animate gap-2 rounded-lg px-2 py-2 transition-colors !duration-200"
              >
                Sign Out
                {user?.photoURL && (
                  <img
                    referrerPolicy="no-referrer"
                    src={user.photoURL}
                    alt="Profile"
                    className="h-6 w-6 rounded-full"
                  />
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleLogin}
              disabled={userLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
            >
              {userLoading ? "Signing in..." : "Sign In"}
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
