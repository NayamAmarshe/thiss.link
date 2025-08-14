import { KeyboardIcon, MouseIcon } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t-border bg-background font-base z-30 flex flex-col items-center justify-between gap-2 border-t-2 px-5 py-5 text-center text-sm sm:flex-row">
      <div className="flex items-end gap-4">
        <h4 className="text-xl font-bold">thiss.link</h4>
        <div className="my-auto flex items-center gap-2">
          <a
            target="_blank"
            href="https://github.com/NayamAmarshe/thiss.link"
            className="font-heading underline"
          >
            Github
          </a>
          <a
            target="_blank"
            href="https://www.buymeacoffee.com/fossisthefuture"
            className="font-heading underline"
          >
            Buy Me A Coffee
          </a>
        </div>
      </div>
      <p className="text-sm">
        Copyright © {new Date().getFullYear()} -{" "}
        <span className="font-bold">thiss.link</span>.
      </p>
      <p className="flex items-center text-sm">
        Made with <MouseIcon className="mx-1 h-4 w-4" /> and{" "}
        <KeyboardIcon className="mx-1 h-4 w-4" />
      </p>
      {/* Released under MIT License. The source code is available on{" "}
      <a
        target="_blank"
        href="https://github.com/neobrutalism-templates/saas"
        className="font-heading underline"
      >
        Github
      </a>
      . */}
    </footer>
  );
}
