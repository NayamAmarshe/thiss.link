import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FaSpinner, FaUnlock } from "react-icons/fa";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "motion/react";
import { popInAnimation } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { LinkDocument } from "@/types/documents";
import { decryptUrl } from "@/lib/decrypt-url";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "./ui/toast";
import { useRouter } from "next/navigation";

const UnlockForm = ({
  checkingLink,
  setCheckingLink,
  linkData,
}: {
  checkingLink: boolean;
  setCheckingLink: (value: boolean) => void;
  linkData?: LinkDocument | null;
}) => {
  const router = useRouter();
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckingLink(true);
    if (!linkData) return;
    try {
      const decoded = await decryptUrl(linkData?.link, password);
      if (decoded) {
        router.push(decoded);
      } else {
        toast({
          title: "Invalid password",
          description: "The password you entered is incorrect.",
          action: <ToastAction altText="Got it">Got it</ToastAction>,
        });
      }
    } catch (error) {
      toast({
        title: "Invalid password",
        description: "The password you entered is incorrect.",
        action: <ToastAction altText="Got it">Got it</ToastAction>,
      });
    }

    setCheckingLink(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-[900px]">
      <motion.div
        className="flex w-full flex-col gap-3"
        variants={popInAnimation}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
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
        </AnimatePresence>

        <motion.div variants={popInAnimation} className="z-10 flex gap-2">
          <Button
            type="submit"
            className={cn(
              "h-12 w-full text-base font-heading md:text-lg lg:h-14 lg:text-xl",
              checkingLink &&
                "pointer-events-none translate-x-boxShadowX translate-y-boxShadowY shadow-none dark:shadow-none",
            )}
            size="lg"
            disabled={checkingLink}
          >
            {checkingLink ? (
              <FaSpinner className="mr-2 animate-spin" />
            ) : (
              <FaUnlock className="mr-2" />
            )}
            unlock thiss link
          </Button>
        </motion.div>
      </motion.div>
    </form>
  );
};

export default UnlockForm;
