import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FaLock, FaSpinner, FaUnlock, FaList } from "react-icons/fa";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "motion/react";
import { popInAnimation } from "@/lib/motion";
import { cn } from "@/lib/utils";
import LinkOptionsDialog from "./header/link-options";
import { useAtom, useAtomValue } from "jotai";
import { generatedLinksAtom, linkExpiryAtom } from "../atoms/user-settings";
import useUser from "../hooks/use-user";
import { LinkDocument } from "@/types/documents";
import GeneratedLinkCard from "./header/generated-link-card";
import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase/firebase";
import {
  CreateLinkRequest,
  CreateLinkResponse,
} from "../functions/src/handlers/create-link";
import { toast } from "sonner";
import LinkHistorySheet from "./link-history-sheet";

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
      toast.error("Invalid URL", {
        description:
          "URL must start with http://, https://, ftp://, or magnet:?",
        action: <Button>Got it</Button>,
      });
      return;
    }

    try {
      const createLink = httpsCallable<CreateLinkRequest, CreateLinkResponse>(
        functions,
        "createLink",
      );
      const responseData = await createLink({
        url,
        password,
        userId: user?.uid,
        slug,
        expiry: linkExpiry,
      } as CreateLinkRequest);
      console.log("🚀 => handleSubmit => responseData:", responseData);

      if (responseData.data.status === "error") {
        toast.error(responseData.data.message);
        return;
      }

      if (responseData.data.linkData) {
        toast.success("Success", {
          description: "thiss link has been copied to clipboard",
        });
        setGeneratedLinks((prev) => [...prev, responseData.data.linkData!]);
        setGeneratedLink(responseData.data.linkData);
      }
    } catch (error) {
      console.error("🚀 => handleSubmit => error:", error);
      toast.error(error.message, {
        action: <Button>Got it</Button>,
      });
    } finally {
      setCreatingLink(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <motion.div
        className="flex w-full flex-col gap-3"
        variants={popInAnimation}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="z-10 w-full" variants={popInAnimation}>
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
              className="w-full"
            >
              <Input
                type="password"
                className="h-12 w-full text-base font-heading md:text-lg lg:h-14 lg:text-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password here..."
                required
              />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          variants={popInAnimation}
          className="z-10 flex w-full flex-col gap-2 sm:flex-row"
        >
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

          <div className="flex items-center justify-between gap-2">
            <Button
              size="lg"
              type="button"
              className="h-12 w-full text-base font-heading dark:text-text md:text-lg lg:h-14 lg:text-xl"
              variant={isLocked ? "default" : "neutral"}
              onClick={() => setIsLocked(!isLocked)}
            >
              {isLocked ? <FaLock /> : <FaUnlock />}
            </Button>

            <LinkOptionsDialog slug={slug} setSlug={setSlug} />

            <LinkHistorySheet>
              <Button
                size="lg"
                type="button"
                className="h-12 w-full text-base font-heading dark:text-text md:text-lg lg:h-14 lg:text-xl"
                variant="neutral"
              >
                <FaList />
              </Button>
            </LinkHistorySheet>
          </div>
        </motion.div>

        <GeneratedLinkCard generatedLink={generatedLink} />
      </motion.div>
    </form>
  );
};

export default LinkForm;
