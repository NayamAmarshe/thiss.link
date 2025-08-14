"use client";

import { useAtom } from "jotai";
import { generatedLinksAtom } from "../atoms/user-settings";
import { FaClipboard, FaLink, FaTrash, FaSpinner } from "react-icons/fa";
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
import { useCallback, useEffect, useState } from "react";
import useUser from "@/hooks/use-user";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  deleteDoc,
  doc,
  Query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LinkDocument } from "@/types/documents";

interface LinkHistorySheetProps {
  children: React.ReactNode;
}

const LINKS_PER_PAGE = 10;

const LinkHistorySheet = ({ children }: LinkHistorySheetProps) => {
  const [generatedLinks, setGeneratedLinks] = useAtom(generatedLinksAtom);
  const { user, isLoggedIn } = useUser();

  const [firestoreLinks, setFirestoreLinks] = useState<LinkDocument[]>([]);
  const [combinedLinks, setCombinedLinks] = useState<LinkDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastLink, setLastLink] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Function to fetch links from Firestore
  const fetchFirestoreLinks = useCallback(
    async (isFirstLoad = true) => {
      if (!isLoggedIn || !user) return;

      setLoading(true);
      try {
        let linksQuery: Query;

        if (isFirstLoad) {
          linksQuery = query(
            collection(db, `users/${user.uid}/links`),
            orderBy("createdAt", "desc"),
            limit(LINKS_PER_PAGE),
          );
        } else {
          if (!lastLink) return;

          linksQuery = query(
            collection(db, `users/${user.uid}/links`),
            orderBy("createdAt", "desc"),
            startAfter(lastLink),
            limit(LINKS_PER_PAGE),
          );
        }

        const querySnapshot = await getDocs(linksQuery);

        if (querySnapshot.empty) {
          setHasMore(false);
          setLoading(false);
          return;
        }

        const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        setLastLink(lastDoc);

        const links = querySnapshot.docs.map((doc) => {
          const data = doc.data() as LinkDocument;
          return data;
        });

        setFirestoreLinks((prev) =>
          isFirstLoad ? links : [...prev, ...links],
        );
        setHasMore(querySnapshot.docs.length === LINKS_PER_PAGE);
      } catch (error) {
        console.error("Error fetching links:", error);
        toast.error("Failed to load links");
      } finally {
        setLoading(false);
      }
    },
    [isLoggedIn, lastLink, user],
  );

  // Combine local and Firestore links, removing duplicates
  useEffect(() => {
    const allLinks = [...generatedLinks, ...firestoreLinks];

    // Use a Map to remove duplicates based on slug
    const uniqueLinks = new Map();
    allLinks.forEach((link) => {
      if (!uniqueLinks.has(link.slug)) {
        uniqueLinks.set(link.slug, link);
      }
    });

    // Convert Map back to array and sort by creation date (newest first)
    const sortedLinks = Array.from(uniqueLinks.values()).sort((a, b) => {
      const dateA = a.createdAt?._seconds || 0;
      const dateB = b.createdAt?._seconds || 0;
      return dateB - dateA;
    });

    setCombinedLinks(sortedLinks);
  }, [generatedLinks, firestoreLinks]);

  // Fetch links when the sheet is opened
  useEffect(() => {
    if (isOpen && isLoggedIn) {
      fetchFirestoreLinks();
    }
  }, [isOpen, isLoggedIn, fetchFirestoreLinks]);

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard");
  };

  const handleDeleteLink = async (slug: string) => {
    // Remove from local storage
    setGeneratedLinks((prev) => prev.filter((link) => link.slug !== slug));

    // If user is logged in and we have an ID, also remove from Firestore
    if (isLoggedIn && user && slug) {
      try {
        await deleteDoc(doc(db, `users/${user.uid}/links/${slug}`));
        setFirestoreLinks((prev) => prev.filter((link) => link.slug !== slug));
        toast.success("Link removed from your account");
      } catch (error) {
        console.error("Error deleting link:", error);
        toast.error("Failed to remove link from your account");
      }
    } else {
      toast.success("Link removed from history");
    }
  };

  const formatDate = (timestamp: {
    _seconds: number;
    _nanoseconds: number;
  }) => {
    if (!timestamp) return "N/A";
    try {
      // Convert Firebase Timestamp to JS Date if needed
      const date = new Date(timestamp._seconds * 1000);
      return formatDistance(date, new Date(), { addSuffix: true });
    } catch (error) {
      return "Invalid date";
    }
  };

  const loadMoreLinks = () => {
    fetchFirestoreLinks(false);
  };

  return (
    <Sheet onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>My Links</SheetTitle>
          <SheetDescription>
            {isLoggedIn
              ? "Your previously generated short links from this device and your account"
              : "Your previously generated short links from this device"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-4">
          {combinedLinks.length === 0 && !loading ? (
            <div className="text-muted-foreground text-center text-sm">
              No links generated yet
            </div>
          ) : (
            <>
              {combinedLinks.map((link) => (
                <div
                  key={link.slug}
                  className="flex flex-col gap-2 rounded-base border-2 border-border bg-main p-4 shadow-light dark:border-dark-border dark:shadow-dark"
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
              ))}

              {isLoggedIn && hasMore && (
                <Button
                  onClick={loadMoreLinks}
                  disabled={loading}
                  variant="neutral"
                  className="mt-2"
                >
                  {loading ? <FaSpinner className="mr-2 animate-spin" /> : null}
                  {loading ? "Loading..." : "Load More"}
                </Button>
              )}

              {loading && combinedLinks.length === 0 && (
                <div className="flex justify-center py-4">
                  <FaSpinner className="text-muted-foreground h-6 w-6 animate-spin" />
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LinkHistorySheet;
