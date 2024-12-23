"use client";

import Header from "@/components/sections/header";
import Features from "@/components/sections/features";
import Community from "@/components/sections/community";
import Faq from "@/components/sections/faq";
import Pricing from "@/components/sections/pricing";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";

const HomePage = () => {
  return (
    <>
      <Navbar />
      <main className="max-w-screen relative z-0 flex h-full min-h-screen w-full snap-both snap-proximity flex-col overflow-y-scroll pt-16">
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
