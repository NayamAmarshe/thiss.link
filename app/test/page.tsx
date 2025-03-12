"use client";

import { functions } from "@/lib/firebase/firebase";
import { httpsCallable } from "firebase/functions";
import React from "react";

const TestPage = () => {
  const test = async () => {
    const createLink = httpsCallable(functions, "test");
    const response = await createLink();
    console.log(response);
  };
  return <button onClick={() => test()}>TestPage</button>;
};

export default TestPage;
