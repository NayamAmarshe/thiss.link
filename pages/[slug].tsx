import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { GetLinkRequest, GetLinkResponse } from "./api/link";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import Head from "next/head";
import Navbar from "@/components/navbar";
import Header from "@/components/sections/header";
import Footer from "@/components/footer";
import { LinkDocument } from "@/types/documents";

const SlugPage = () => {
  const router = useRouter();
  const [linkData, setLinkData] = useState<LinkDocument | null>(null);

  const fetchLink = async () => {
    try {
      const response = await fetch("/api/link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: router.query.slug,
        } as GetLinkRequest["body"]),
        cache: "no-cache",
      });
      const responseData: GetLinkResponse = await response.json();
      if (responseData.status === "error" || !response.ok) {
        throw new Error(responseData.message);
      }
      if (responseData.status === "success" && responseData.linkData) {
        console.log("🚀 => responseData:", responseData);
        if (!responseData.linkData.isProtected) {
          router.push(responseData.linkData.link);
        } else {
          setLinkData(responseData.linkData);
        }
      }
    } catch (error) {
      router.push("/");
      toast({
        title: "Error",
        description: error.message,
        action: <ToastAction altText="Got it">Got it</ToastAction>,
      });
    }
  };

  useEffect(() => {
    if (!router.query.slug) return;
    fetchLink();
  }, [router.query.slug]);

  if (!router.query.slug || !linkData) {
    return null;
  }

  return (
    <>
      <Head>
        <title>thiss.link - Link Shortener</title>
        <meta name="description" content="Simple and fast URL shortener" />
      </Head>

      <Navbar />

      <main className="max-w-screen relative z-0 flex h-screen w-full snap-both snap-proximity flex-col overflow-y-scroll pt-16">
        <Header linkData={linkData} />
        <Footer />
      </main>
    </>
  );
};

export default SlugPage;
