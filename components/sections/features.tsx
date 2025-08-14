import Marquee from "react-fast-marquee";

export default function Features() {
  const features = [
    {
      title: "It's a free (and open source), Mario!",
      text: "It's free and open source, so you can use it for whatever you want. If you want to support me, you can buy me a coffee though (I don't drink coffee 🤫)",
    },
    {
      title: "Passwords! Passwords! Passwords!",
      text: "You can set a password for your links, so that only you can access them. Tell me if that isn't enough to make you happy for whatever reason 🤷🏻‍♂️",
    },
    {
      title: "It's secure 😎",
      text: "All the password protected links are encrypted hehe. This means that you're safe, you're secure, you're protected 🤗",
    },
    {
      title: "It's a link shortener",
      text: "I'm not sure what else you expect but yeah, it's a pretty simple and fast link shortener. I made it myself ☺️",
    },
    {
      title: "It's beautiful!",
      text: "What do you mean you don't like the UI design? 😰",
    },
    {
      title: "I've run out of things to say...",
      text: "I need ideas, please! 😭",
    },
  ];

  return (
    <div className="bg-background snap-start snap-always">
      <section className="border-t-border bg-bg font-base dark:border-t-dark-border dark:bg-dark-bg border-t-2 py-20 md:px-20 lg:py-[100px]">
        <h2 className="font-heading mb-14 px-5 text-center text-2xl md:text-3xl lg:mb-20 lg:text-4xl">
          Features? Yeah I&apos;ll show you features!
        </h2>

        <div className="w-container mx-auto grid max-w-full grid-cols-1 gap-5 px-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            return (
              <div
                className="rounded-base border-border shadow-shadow dark:border-dark-border dark:bg-secondary-black dark:shadow-dark flex flex-col gap-3 border-2 bg-white p-5"
                key={i}
              >
                <h4 className="font-heading text-xl">{feature.title}</h4>
                <p>{feature.text}</p>
              </div>
            );
          })}
        </div>
      </section>
      <div>
        <Marquee
          className="border-y-border font-base dark:border-dark-border dark:border-y-dark-border dark:bg-secondary-black border-y-2 bg-white py-3 sm:py-5"
          direction="left"
        >
          {Array(10)
            .fill("xd")
            .map((x, id) => {
              return (
                <div className="flex items-center" key={id}>
                  <span className="font-heading mx-8 text-xl sm:text-2xl lg:text-4xl">
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
