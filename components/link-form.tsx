import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FaLock, FaSpinner, FaUnlock } from "react-icons/fa";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "motion/react";
import { popInAnimation } from "@/lib/motion";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "./ui/toast";
import { cn } from "@/lib/utils";
import LinkOptionsDialog from "./header/link-options";
import { useAtom, useAtomValue } from "jotai";
import { generatedLinksAtom, linkExpiryAtom } from "../atoms/user-settings";
import useUser from "../hooks/use-user";
import { LinkDocument } from "@/types/documents";
import GeneratedLinkCard from "./header/generated-link-card";
import {
  CreateLinkRequest,
  CreateLinkResponse,
} from "@/app/api/create-link/route";

const LinkForm = ({
  creatingLink,
  setCreatingLink,
}: {
  creatingLink: boolean;
  setCreatingLink: (value: boolean) => void;
}) => {
  const { user } = useUser();

  const [url, setUrl] = useState("");
  const [slug, setSlug] = useState("");
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const linkExpiry = useAtomValue(linkExpiryAtom);
  const [generatedLinks, setGeneratedLinks] = useAtom(generatedLinksAtom);
  const [generatedLink, setGeneratedLink] = useState<LinkDocument | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingLink(true);

    const urlRegex = /^(https?:\/\/|ftp:\/\/|magnet:\?).+/i;
    if (!urlRegex.test(url)) {
      toast({
        title: "Invalid URL",
        description:
          "URL must start with http://, https://, ftp://, or magnet:?",
        action: <ToastAction altText="Got it">Got it</ToastAction>,
      });
      return;
    }

    try {
      const response = await fetch("/api/create-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          password,
          userId: user?.uid,
          slug: slug,
          expiry: linkExpiry,
        } as CreateLinkRequest),
      });
      const responseData: CreateLinkResponse = await response.json();
      console.log("🚀 => responseData:", responseData);
      if (responseData.status === "error" || !response.ok) {
        throw new Error(responseData.message);
      }

      if (responseData.linkData) {
        toast({
          title: "Success",
          description: "thiss link has been copied to clipboard",
          action: <ToastAction altText="Got it">Got it</ToastAction>,
        });
        setGeneratedLinks((prev) => [...prev, responseData.linkData!]);
        setGeneratedLink(responseData.linkData);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error creating link",
        action: <ToastAction altText="Got it">Got it</ToastAction>,
      });
    } finally {
      setCreatingLink(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-[900px]">
      <motion.div
        className="flex w-full flex-col gap-3"
        variants={popInAnimation}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="z-10 flex w-full gap-2"
          variants={popInAnimation}
        >
          <Input
            className="h-12 w-full text-base font-heading md:text-lg lg:h-14 lg:text-xl"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter link here..."
            required
          />
        </motion.div>

        <AnimatePresence mode="popLayout">
          {isLocked && (
            <motion.div
              variants={popInAnimation}
              initial="hidden"
              animate="visible"
              exit={{
                opacity: 0,
                y: -20,
                scale: 0.95,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                  duration: 0.2,
                },
              }}
            >
              <Input
                type="password"
                className="h-12 text-base font-heading md:text-lg lg:h-14 lg:text-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password here..."
                required
              />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={popInAnimation} className="z-10 flex gap-2">
          <Button
            type="submit"
            className={cn(
              "h-12 w-full text-base font-heading md:text-lg lg:h-14 lg:text-xl",
              creatingLink &&
                "pointer-events-none translate-x-boxShadowX translate-y-boxShadowY shadow-none dark:shadow-none",
            )}
            size="lg"
            disabled={creatingLink}
          >
            {creatingLink ? <FaSpinner className="mr-2 animate-spin" /> : null}{" "}
            {!creatingLink ? "(ツ) squish thiss link" : "squishing"}
          </Button>

          <LinkOptionsDialog slug={slug} setSlug={setSlug} />

          <Button
            size="lg"
            type="button"
            className="h-12 text-base font-heading dark:text-text md:text-lg lg:h-14 lg:text-xl"
            variant={isLocked ? "default" : "neutral"}
            onClick={() => setIsLocked(!isLocked)}
          >
            {isLocked ? <FaLock /> : <FaUnlock />}
          </Button>
        </motion.div>

        <GeneratedLinkCard generatedLink={generatedLink} />
      </motion.div>
    </form>
  );
};

export default LinkForm;
