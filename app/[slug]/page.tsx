"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import Head from "next/head";
import Navbar from "@/components/navbar";
import Header from "@/components/sections/header";
import Footer from "@/components/footer";
import { LinkDocument } from "@/types/documents";
import { useRouter } from "next/navigation";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../lib/firebase/firebase";
import { GetLinkRequest, GetLinkResponse } from "../../functions/src/get-link";

const SlugPage = ({ params }: { params: { slug: string } }) => {
  const router = useRouter();

  const [linkData, setLinkData] = useState<LinkDocument | null>(null);

  const fetchLink = useCallback(async () => {
    if (!params.slug) {
      console.error("Slug is required");
      return;
    }
    try {
      const getLink = httpsCallable<GetLinkRequest, GetLinkResponse>(
        functions,
        "getLink",
      );
      const response = await getLink({ slug: params.slug });
      const responseData = response.data;
      console.log("🚀 => fetchLink => responseData:", responseData);
      if (!responseData) {
        throw new Error("Error fetching link");
      }
      if (responseData.status === "error") {
        throw new Error(responseData.message);
      }
      if (responseData.status === "success" && responseData.linkData) {
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
        description: "Error fetching link",
        action: <ToastAction altText="Got it">Got it</ToastAction>,
      });
    }
  }, [params.slug, router]);

  useEffect(() => {
    if (!params.slug) return;
    fetchLink();
  }, [fetchLink, params.slug]);

  if (!params.slug || !linkData) {
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
