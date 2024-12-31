"use client";

import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { popInAnimation } from "@/lib/motion";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { LinkDocument } from "@/types/documents";
import { ToastAction } from "../ui/toast";
import { FaClipboard, FaLink, FaList } from "react-icons/fa";

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
          <span className="max-w-48 truncate">
            {generatedLink.link}qweqwke12ok321o3ko1kj3
          </span>
        </Button>
      </a>
      <Link href={`/links`}>
        <Button
          size="sm"
          type="button"
          variant="neutral"
          onClick={() => {
            navigator.clipboard.writeText(generatedLink.link);
            toast({
              title: "Copied",
              description: "Link copied to clipboard",
              action: <ToastAction altText="Got it">Got it</ToastAction>,
            });
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
          toast({
            title: "Copied",
            description: "Link copied to clipboard",
            action: <ToastAction altText="Got it">Got it</ToastAction>,
          });
        }}
      >
        <FaClipboard className="mr-2" />
        Copy
      </Button>
    </motion.div>
  );
};

export default GeneratedLinkCard;
