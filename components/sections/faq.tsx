import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Marquee from "react-fast-marquee";

export default function Faq() {
  return (
    <div className="snap-start snap-always">
      <section className="bg-bg py-20 font-base dark:bg-darkBg lg:py-[100px]">
        <h2 className="mb-14 px-5 text-center text-2xl font-heading md:text-3xl lg:mb-20 lg:text-4xl">
          Frequently asked questions
        </h2>

        <div className="mx-auto grid w-[700px] max-w-full px-5">
          <Accordion className="text-base sm:text-lg" type="single" collapsible>
            <AccordionItem className="mb-2" value="item-1">
              <AccordionTrigger>What&apos;s this all about?</AccordionTrigger>
              <AccordionContent>
                thiss.link is a free and open source an encrypted link
                shortening service that supports HTTP, HTTPs, FTP, and Torrent
                Magnet links.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem className="mb-2" value="item-2">
              <AccordionTrigger>Why should I use this?</AccordionTrigger>
              <AccordionContent>
                1. MagLit keeps everything encrypted. This means nobody except
                you has access to your links when you use your own password.
                <br />
                <br />
                2. MagLit lets you password protect your links and also lets you
                use custom links. All without any sign-up or account
                registration.
                <br />
                <br />
                3. MagLit protects your privacy. 100% free and open source,
                verifiable website deployments. No data mining, no data selling.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
      <div>
        <Marquee
          className="border-y-2 border-y-border bg-white py-3 font-base dark:border-darkBorder dark:border-y-darkBorder dark:bg-secondaryBlack sm:py-5"
          direction="right"
        >
          {Array(10)
            .fill("xd")
            .map((x, id) => {
              return (
                <div className="flex items-center" key={id}>
                  <span className="mx-8 text-xl font-heading sm:text-2xl lg:text-4xl">
                    thiss.link
                  </span>
                </div>
              );
            })}
        </Marquee>
      </div>
    </div>
  );
}
