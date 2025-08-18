import { linkSettingsOpenState } from "../atoms/linkSettingsOpenState";
import LinkOptionsModal from "../components/home/LinkOptionsModal";
import TopRightButtons from "../components/home/TopRightButtons";
import { cardsOpenState } from "../atoms/cardsOpenState";
import LinkClipboard from "../components/home/LinkClipboard";
import { AnimatePresence } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import { navbarState } from "../atoms/navbarAtom";
import { linksState } from "../atoms/linksState";
import { RiArrowUpSLine } from "react-icons/ri";
import { useSwipeable } from "react-swipeable";
import { BsArchiveFill } from "react-icons/bs";
import MainLogo from "../components/home/MainLogo";
import * as Monkey from "monkey-typewriter";
import { BASE_URL } from "../utils/config";
import { useAtom } from "jotai";
import Form from "../components/home/Form";
import { useEffect } from "react";
import { useState } from "react";
import Background from "../components/Background";
import { useTurnstile } from "react-turnstile";

export default function Home() {
  // !GLOBAL
  const [navbarOpen, setNavbarOpen] = useAtom(navbarState);
  const [cardsOpen, setCardsOpen] = useAtom(cardsOpenState);
  const [links, setLinks] = useAtom(linksState);
  const [linkSettingsOpen, setLinkSettingsOpen] = useAtom(
    linkSettingsOpenState,
  );

  // !LOCAL
  const [magnetLink, setMagnetLink] = useState("");
  const [outputLink, setOutputLink] = useState("");
  const [oneTimeUse, setOneTimeUse] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState("");
  const [locked, setLocked] = useState(false);
  const [customSlug, setCustomSlug] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);
  const slugRegex = /^[a-z0-9](-?[a-z0-9])*$/;
  const turnstile = useTurnstile();

  const linkRegex = /^(https?|ftp|magnet):(?:\/\/[^\s/$.?#].[^\s]*|[^\s]*)$/;

  useEffect(() => {
    const linksInStorage = JSON.parse(localStorage.getItem("links")) || [];
    setLinks(linksInStorage);
  }, [localStorage]);

  // !FUNCTIONS
  const generateSlug = async () => {
    let slug = Monkey.slug(2);
    return slug;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputLink);
    if (outputLink.length > 1) {
      toast.info("Copied link to clipboard, happy pasting :)", {
        position: "top-center",
        autoClose: "10000",
        hideProgressBar: false,
        newestOnTop: true,
        closeOnClick: true,
        theme: "colored",
        pauseOnFocusLoss: true,
        draggable: true,
        pauseOnHover: true,
      });
    }
  };

  // !HANDLER FUNCTIONS
  const handlers = useSwipeable({
    onSwipedRight: (e) => {
      if (e.event.target.id === "no-swipe" && magnetLink.length > 1) return;
      if (linkSettingsOpen) return;
      setCardsOpen(true);
    },
    onSwipedLeft: (e) => {
      if (e.event.target.id === "no-swipe" && magnetLink.length > 1) return;
      if (linkSettingsOpen) return;
      setNavbarOpen(true);
    },
  });

  const handleScroll = (e) => {
    if (e.deltaY > 0 && !linkSettingsOpen) {
      setCardsOpen(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!captchaToken) {
      toast.warn("Please complete the captcha verification");
      return;
    }

    if (locked && password === "") {
      toast.warn("Please enter a password to unlock the link");
      return;
    }

    if (!locked) {
      setPassword("");
    }

    if (magnetLink.length < 1) {
      toast.error("You entered an invalid link");
      return;
    }

    if (!linkRegex.test(magnetLink)) {
      toast.warn(
        "Please make sure your link starts with 'http://' or 'https://' or 'magnet://'",
      );
      return;
    }

    const slug = await generateSlug();

    const customOrDefaultSlug = customSlug.length == 0 ? slug : customSlug;

    if (slug.length < 1) {
      toast.error("Invalid Slug!");
      return;
    }

    if (!slugRegex.test(customOrDefaultSlug)) {
      toast.error(
        "The slug should only contain lowercase alphabets, numbers and hyphen",
      );
      return;
    }

    const loadingToast = toast.loading("Hold on, lighting up your link...");

    await fetch(BASE_URL + "api/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        slug: customOrDefaultSlug,
        password: locked ? password : "",
        link: magnetLink,
        captchaToken: captchaToken,
      }),
    })
      .then((response) => {
        if (response.status !== 200) {
          return response.json().then((response) => {
            throw new Error(response.message);
          });
        } else {
          return response.json();
        }
      })
      .then((response) => {
        setOutputLink(BASE_URL + customOrDefaultSlug);

        console.log("🚀 => file: index.jsx:175 => response", response);

        // SAVE LINK IN LOCAL STORAGE
        const linksInStorage = JSON.parse(localStorage.getItem("links")) || [];
        linksInStorage.push({
          link: BASE_URL + customOrDefaultSlug,
          password: locked ? password : "",
        });
        localStorage.setItem("links", JSON.stringify(linksInStorage));

        // SET LINKS STATE
        setLinks(linksInStorage);
        // SHOW TOAST
        toast.update(loadingToast, {
          render: response.message,
          type: "success",
          isLoading: false,
          position: "top-center",
          autoClose: "3000",
          hideProgressBar: true,
          newestOnTop: true,
          closeOnClick: true,
          theme: "colored",
          pauseOnFocusLoss: true,
          draggable: true,
          pauseOnHover: true,
        });
        copyToClipboard();
      })
      .catch((error) => {
        console.log("🚀 => file: index.jsx:206 => error", error);

        toast.update(loadingToast, {
          render: error.message,
          type: "error",
          isLoading: false,
          position: "top-center",
          autoClose: "3000",
          hideProgressBar: true,
          newestOnTop: true,
          closeOnClick: true,
          theme: "colored",
          pauseOnFocusLoss: true,
          draggable: true,
          pauseOnHover: true,
        });
      });
    turnstile.reset();
  };

  return (
    <div
      className={`${
        navbarOpen || cardsOpen ? "scale-90 blur-3xl" : "scale-100 blur-none"
      } animate relative z-10 flex h-screen flex-col items-center justify-center gap-y-10 overflow-hidden`}
      onWheel={handleScroll}
      {...handlers}
    >
      <TopRightButtons
        navbarOpen={navbarOpen}
        setNavbarOpen={setNavbarOpen}
        cardsOpen={cardsOpen}
      />
      <AnimatePresence exitBeforeEnter>
        {linkSettingsOpen && (
          <LinkOptionsModal
            customSlug={customSlug}
            setCustomSlug={setCustomSlug}
            linkSettingsOpen={linkSettingsOpen}
            setLinkSettingsOpen={setLinkSettingsOpen}
          />
        )}
      </AnimatePresence>

      <div className="pointer-events-none fixed top-0 z-20 h-20 w-full bg-gradient-to-b from-black/30 to-transparent xs:hidden"></div>

      {/* MAIN CONTENT */}
      <div className="z-10 flex h-screen flex-col items-center justify-center">
        <div className="flex w-full flex-col gap-y-4 xs:gap-y-10">
          <MainLogo />
          <Form
            locked={locked}
            setLocked={setLocked}
            handleSubmit={handleSubmit}
            password={password}
            setPassword={setPassword}
            magnetLink={magnetLink}
            setMagnetLink={setMagnetLink}
            setLinkSettingsOpen={setLinkSettingsOpen}
            captchaToken={captchaToken}
            setCaptchaToken={setCaptchaToken}
            turnstile={turnstile}
          />
        </div>
        <LinkClipboard
          outputLink={outputLink}
          copyToClipboard={copyToClipboard}
        />
      </div>

      {/* LIT LINKS BUTTON */}
      {/* DESKTOP */}
      <button
        className="invisible absolute bottom-5 flex flex-col items-center justify-center font-medium text-slate-400 dark:text-stone-400 sm:visible"
        onClick={() => {
          setCardsOpen(!cardsOpen);
        }}
      >
        <RiArrowUpSLine className="text-3xl" />
        Lit Links
      </button>

      {/* MOBILE */}
      <button
        className={`${
          navbarOpen || cardsOpen
            ? "scale-0 opacity-0"
            : "scale-100 opacity-100"
        } animate visible absolute left-5 top-5 z-50 rounded-sm text-xl text-slate-400 hover:text-blue-500 dark:text-stone-400 sm:invisible md:text-3xl`}
        onClick={() => {
          setCardsOpen(!cardsOpen);
        }}
      >
        <BsArchiveFill />
      </button>

      {/*       <a
        href="https://www.netlify.com"
        rel="noreferrer"
        target="_blank"
        className="absolute bottom-5 right-5"
      >
        <img
          src="https://www.netlify.com/v3/img/components/netlify-light.svg"
          alt="Deploys by Netlify"
          className="mix-blend-darken dark:hidden"
        />
        <img
          src="https://www.netlify.com/v3/img/components/netlify-dark.svg"
          alt="Deploys by Netlify"
          className="hidden mix-blend-lighten dark:block"
        />
      </a> */}

      {/* <a
        href="https://vercel.com/?utm_source=mag-lit&utm_campaign=oss"
        rel="noreferrer"
        target="_blank"
      >
        <img
          src="/powered-by-vercel.svg"
          alt="Powered by Vercel"
          className="absolute bottom-5 right-5 w-52 mix-blend-exclusion"
        />
      </a> */}

      {/* TOASTIFY */}
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={true}
        newestOnTop={true}
        closeOnClick
        theme="colored"
        pauseOnFocusLoss
        draggable
        pauseOnHover
        limit={2}
      />
    </div>
  );
}
