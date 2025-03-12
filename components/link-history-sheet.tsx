"use client";

import { useAtom } from "jotai";
import { generatedLinksAtom } from "../atoms/user-settings";
import { FaClipboard, FaLink, FaTrash } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatDistance } from "date-fns";

interface LinkHistorySheetProps {
  children: React.ReactNode;
}

const LinkHistorySheet = ({ children }: LinkHistorySheetProps) => {
  const [generatedLinks, setGeneratedLinks] = useAtom(generatedLinksAtom);

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard");
  };

  const handleDeleteLink = (slug: string) => {
    setGeneratedLinks((prev) => prev.filter((link) => link.slug !== slug));
    toast.success("Link removed from history");
  };

  const formatDate = (timestamp: {
    _seconds: number;
    _nanoseconds: number;
  }) => {
    console.log("🚀 => formatDate => timestamp:", timestamp);
    if (!timestamp) return "N/A";
    try {
      // Convert Firebase Timestamp to JS Date if needed
      const date = new Date(timestamp._seconds * 1000);
      return formatDistance(date, new Date(), { addSuffix: true });
    } catch (error) {
      return "Invalid date";
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>My Links</SheetTitle>
          <SheetDescription>
            Your previously generated short links
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-4">
          {generatedLinks.length === 0 ? (
            <div className="text-muted-foreground text-center">
              No links generated yet
            </div>
          ) : (
            generatedLinks.map((link) => (
              <div
                key={link.slug}
                className="flex flex-col gap-2 rounded-base border-2 border-border bg-main p-4 shadow-light dark:border-darkBorder dark:shadow-dark"
              >
                <div className="flex items-center justify-between">
                  <a href={link.link} target="_blank" className="w-full">
                    <Button
                      className="w-full font-bold"
                      variant="neutral"
                      type="button"
                    >
                      <FaLink className="mr-2 h-4 w-4" />
                      <span className="max-w-48 truncate">{link.link}</span>
                    </Button>
                  </a>
                </div>

                <div className="text-muted-foreground flex flex-col items-start justify-between text-sm">
                  <span>Created {formatDate(link.createdAt as any)}</span>
                  {link.expiresAt && (
                    <span>Expires {formatDate(link.expiresAt as any)}</span>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    type="button"
                    variant="neutral"
                    onClick={() => handleCopyLink(link.link)}
                  >
                    <FaClipboard className="mr-2" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    type="button"
                    variant="reverse"
                    onClick={() => handleDeleteLink(link.slug)}
                  >
                    <FaTrash className="mr-2" />
                    Remove
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LinkHistorySheet;
