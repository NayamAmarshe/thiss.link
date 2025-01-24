type WeightedItem = [string | number, number];

const prefixes: string[] = [
  "wa",
  "de",
  "re",
  "ex",
  "in",
  "po",
  "pro",
  "con",
  "auto",
  "ex",
  "extra",
  "hyper",
  "anti",
  "co",
  "in",
  "mono",
  "non",
  "intra",
  "un",
  "post",
  "tele",
  "trans",
  "up",
];

const suffixes: string[] = [
  "ion",
  "ity",
  "ic",
  "ical",
  "ian",
  "ial",
  "ious",
  "ing",
  "ed",
  "s",
  "es",
  "acy",
  "ate",
  "en",
  "al",
  "fy",
  "ify",
  "esque",
  "able",
  "ible",
  "ness",
  "ship",
  "sion",
  "ment",
  "ist",
  "ism",
  "ful",
  "y",
];

const voiceless: WeightedItem[] = [
  ["ch", 10],
  ["f", 10],
  ["k", 10],
  ["p", 10],
  ["s", 10],
  ["sh", 10],
  ["t", 10],
];

const voiced: WeightedItem[] = [
  ["b", 10],
  ["d", 10],
  ["g", 10],
  ["j", 2],
  ["l", 10],
  ["m", 10],
  ["n", 10],
  ["ng", 2],
  ["r", 10],
  ["th", 8],
  ["v", 10],
  ["w", 3],
  ["y", 4],
  ["z", 2],
];

const syls: WeightedItem[] = [
  ["pho", 10],
  ["lo", 10],
  ["di", 10],
  ["ta", 10],
  ["bo", 10],
];

const vowels: string[] = ["a", "e", "i", "o", "u"];

const syls_lengths: WeightedItem[] = [
  [1, 25],
  [2, 10],
  [3, 5],
  [4, 2],
];

const short_syls_lengths: WeightedItem[] = [
  [1, 10],
  [2, 20],
];

function weightedRandom(data: WeightedItem[]): string {
  let total = 0;
  for (let i = 0; i < data.length; ++i) {
    total += data[i][1];
  }

  const threshold = Math.random() * total;
  total = 0;
  for (let i = 0; i < data.length - 1; ++i) {
    total += data[i][1];
    if (total >= threshold) {
      return data[i][0] as string;
    }
  }

  return data[data.length - 1][0] as string;
}

const sample = <T>(items: T[]): T => {
  return items[Math.floor(Math.random() * items.length)];
};

const syl = (): string => {
  let c = weightedRandom(voiced);
  if (Math.random() > 0.6) {
    c = weightedRandom(voiceless);
    if (Math.random() > 0.6) {
      c = c + sample(vowels);
    }
  }
  let s = c + sample(vowels);
  if (Math.random() > 0.9) {
    s = weightedRandom(syls);
  }
  return s;
};
export const generateSlug = (length: number = 1): string => {
  return Array.from({ length }).map(generateWord).join("-");
};

export const generateWord = (): string => {
  const buildWord = (): string[] => {
    const w: string[] = [];

    if (Math.random() > 0.2) {
      w.push(sample(prefixes));
    }

    const syllableCount = Number(weightedRandom(syls_lengths));
    const syllables = Array.from({ length: syllableCount }, () => syl());
    w.push(...syllables);

    if (!w.length) {
      w.push(syl());
    }

    const wordStr = w.join("");
    const lastChar = wordStr[wordStr.length - 1];

    if (vowels.includes(lastChar) && Math.random() > 0.15 && lastChar !== "e") {
      w.push(
        Math.random() > 0.8
          ? weightedRandom(voiced)
          : weightedRandom(voiceless),
      );
    }

    if (Math.random() > 0.3) {
      if (Math.random() > 0.5) {
        w.push(weightedRandom(voiced));
      }
      w.push(sample(suffixes));
    }

    return w;
  };

  const word = buildWord().join("");
  return word.length < 3 ? generateWord() : word;
};
