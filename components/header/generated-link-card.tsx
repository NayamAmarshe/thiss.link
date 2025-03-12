"use client";

import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { popInAnimation } from "@/lib/motion";
import Link from "next/link";
import { LinkDocument } from "@/types/documents";
import { FaClipboard, FaLink, FaList } from "react-icons/fa";
import { toast } from "sonner";

const GeneratedLinkCard = ({
  generatedLink,
}: {
  generatedLink: LinkDocument | null;
}) => {
  if (!generatedLink) return null;

  return (
    <motion.div
      className="flex items-center justify-between gap-2 rounded-base border-2 border-border bg-main p-4 text-black shadow-light dark:border-darkBorder dark:shadow-dark"
      variants={popInAnimation}
      initial="hidden"
      animate="visible"
    >
      <a href={generatedLink.link} target="_blank" className="w-full">
        <Button className="w-full font-bold" variant="neutral" type="button">
          <FaLink className="mr-2 h-4 w-4" />
          <span className="max-w-48 truncate">{generatedLink.link}</span>
        </Button>
      </a>
      <Link href={`/links`}>
        <Button
          size="sm"
          type="button"
          variant="neutral"
          onClick={() => {
            navigator.clipboard.writeText(generatedLink.link);
            toast.success("Link copied to clipboard");
          }}
        >
          <FaList className="mr-2" />
          My Links
        </Button>
      </Link>
      <Button
        size="sm"
        type="button"
        variant="neutral"
        onClick={() => {
          navigator.clipboard.writeText(generatedLink.link);
          toast.success("Link copied to clipboard");
        }}
      >
        <FaClipboard className="mr-2" />
        Copy
      </Button>
    </motion.div>
  );
};

export default GeneratedLinkCard;
