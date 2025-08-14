"use client";

import Header from "@/components/sections/header";
import Features from "@/components/sections/features";
import Community from "@/components/sections/community";
import Faq from "@/components/sections/faq";
import Pricing from "@/components/sections/pricing";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import LinkHistorySheet from "@/components/link-history-sheet";
import { Button } from "@/components/ui/button";
import { FaList } from "react-icons/fa";

const HomePage = () => {
  return (
    <>
      <Navbar />
      <main className="relative z-0 flex h-full min-h-screen w-full max-w-screen snap-both snap-proximity flex-col overflow-y-scroll pt-16">
        <div className="fixed right-6 bottom-6 z-50">
          <LinkHistorySheet>
            <Button size="lg" variant="default" className="rounded-full p-4">
              <FaList className="h-5 w-5" />
            </Button>
          </LinkHistorySheet>
        </div>
        <Header />
        <Features />
        <Community />
        <Faq />
        <Pricing />
        <Footer />
      </main>
    </>
  );
};

export default HomePage;
