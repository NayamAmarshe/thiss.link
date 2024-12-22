"use client";

import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import Head from "next/head";
import Navbar from "@/components/navbar";
import Header from "@/components/sections/header";
import Footer from "@/components/footer";
import { LinkDocument } from "@/types/documents";
import { useRouter } from "next/navigation";
import { getLink } from "@/lib/actions/get-link";

export const runtime = "edge";

const SlugPage = ({ params }: { params: { slug: string } }) => {
  const router = useRouter();

  const [linkData, setLinkData] = useState<LinkDocument | null>(null);

  const fetchLink = async () => {
    if (!params.slug) return;
    try {
      const responseData = await getLink({
        slug: params.slug,
      });
      if (responseData.status === "error") {
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
        description: "Error fetching link",
        action: <ToastAction altText="Got it">Got it</ToastAction>,
      });
    }
  };

  useEffect(() => {
    if (!params.slug) return;
    fetchLink();
  }, [params.slug]);

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