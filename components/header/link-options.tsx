import { Button } from "@/components/ui/button";
import { FaSave, FaWrench } from "react-icons/fa";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAtom } from "jotai";
import {
  downloadQrCodeAtom,
  LinkExpiry,
  linkExpiryAtom,
} from "../../atoms/user-settings";
import useUser from "../../hooks/use-user";
import { useCallback, useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "../ui/toast";

const LinkOptionsDialog = ({
  slug,
  setSlug,
}: {
  slug: string;
  setSlug: (value: string) => void;
}) => {
  const [linkExpiry, setLinkExpiry] = useAtom(linkExpiryAtom);
  const [downloadQrCode, setDownloadQrCode] = useAtom(downloadQrCodeAtom);
  const [error, setError] = useState<string | null>(null);

  const { isLoggedIn } = useUser();

  const checkSlug = useCallback(() => {
    console.log("Checking slug");
    const slugRegex = /^[a-zA-Z0-9_-]+$/;
    if (!slug) {
      console.log("Slug is required");
      setError(null);
      return;
    }
    if (slug.length < 3 || slug.length > 50) {
      const error = "Slug must be between 3 and 50 characters.";
      console.log(error);
      setError(error);

      return;
    }
    if (!slugRegex.test(slug)) {
      const error =
        "Slug can only contain letters, numbers, dash and underscore.";
      console.error(error);
      setError(error);
      return;
    }

    setError(null);
  }, [slug]);

  useEffect(() => {
    checkSlug();
  }, [slug, checkSlug]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="lg"
          type="button"
          variant="neutral"
          className="h-12 text-base font-heading md:text-lg lg:h-14 lg:text-xl"
        >
          <FaWrench />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link Options</DialogTitle>
          <DialogDescription>
            {isLoggedIn ? (
              "Make changes to your link here."
            ) : (
              <span className="font-semibold text-red-500">
                Sign in to make changes to your link.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex w-full flex-col gap-4">
          <div className="flex flex-col items-start gap-2">
            <Label htmlFor="name" className="text-right">
              Custom Link
            </Label>
            <div className="relative flex w-full items-center">
              <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-sm text-text text-opacity-50 dark:text-darkText">
                https://thiss.link/
              </span>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full pl-[118px] font-semibold"
                disabled={!isLoggedIn}
              />
            </div>
          </div>

          <div className="flex flex-col items-start gap-2">
            <Label htmlFor="download-qr-code">Download QR Code</Label>
            <Switch
              id="download-qr-code"
              checked={downloadQrCode}
              disabled={!isLoggedIn}
              onCheckedChange={(checked) => setDownloadQrCode(checked)}
            />
          </div>

          <div className="flex flex-col items-start gap-2">
            <Label htmlFor="download-qr-code">Link Expiration</Label>
            <div className="flex items-center gap-2">
              <Switch
                id="disable-link-expiry"
                checked={!!linkExpiry}
                onCheckedChange={(checked) => {
                  setLinkExpiry(checked ? "24-hours" : undefined);
                }}
                disabled={!isLoggedIn}
              />
              <Select
                onValueChange={(value) => setLinkExpiry(value as LinkExpiry)}
                value={linkExpiry as string | undefined}
                disabled={!linkExpiry || !isLoggedIn}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Never" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24-hours">24 hours</SelectItem>
                  <SelectItem value="2-days">2 days</SelectItem>
                  <SelectItem value="1-week">1 week</SelectItem>
                  <SelectItem value="1-month">1 month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              type={error ? "button" : "submit"}
              onClick={(e) => {
                checkSlug();
                if (error) {
                  toast({
                    title: "Error",
                    description: error,
                    action: <ToastAction altText="Got it">Got it</ToastAction>,
                  });
                  e.preventDefault();
                }
              }}
            >
              <FaSave className="mr-2 h-4 w-4" />
              Save changes
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LinkOptionsDialog;
