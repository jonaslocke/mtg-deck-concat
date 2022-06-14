const decksElement = document.querySelector("#decksElement");
const concatSummaryElement = document.querySelector("#concat-summary");

const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();

    fr.onload = () => {
      resolve(fr.result);
    };

    fr.onerror = () => {
      reject(fr);
    };

    fr.readAsText(file);
  });
};

const convertDeckTextToArray = (promises) => {
  const cards = [];
  for (let promise of promises) {
    const lines = promise.split("\n");
    for (let line of lines) {
      if (line.length > 1 && !line.match(new RegExp("sideboard", "i"))) {
        const data = line.split(/ (.*)/s);
        const name = data[1].trim();
        const count = data[0];

        cards.push({ name, count });
      }
    }
  }
  return cards;
};

const summarizeDecks = (promises) => {
  const cards = convertDeckTextToArray(promises);

  return cards.reduce((acc, cur) => {
    const { name } = cur;
    const count = Number.parseInt(cur.count);
    acc[name] = !acc[name]
      ? { count, max: count }
      : {
          count: acc[name].count + count,
          max: count > acc[name].max ? count : acc[name].max,
        };
    return acc;
  }, {});
};

const exportDeckString = (cardsSummary) => {
  let deckList = "";
  for (let card in cardsSummary) {
    const { max } = cardsSummary[card];
    deckList += `${max} ${card} \n`;
  }
  return deckList;
};

const concatSummary = (files, summary) => {
  const deckNames = [];
  for (let file of files) deckNames.push(file.name);
  return {
    decks: { total: files.length, names: deckNames },
    uniqueCards: Object.keys(summary).length,
  };
};

const dce = ({ el, inner }) => {
  const element = document.createElement(el);
  if (inner) element.innerText = inner;
  return element;
};

const eac = ({ el, arr }) => arr.forEach((a) => el.classList.add(a));

const createSummaryEl = (summaryData) => {
  const { decks, uniqueCards } = summaryData;
  const { total, names } = decks;
  const summary = dce({ el: "div" });
  eac({ el: summary, arr: ["d-flex"] });

  const ulInfo = dce({ el: "ul" });
  const ulDecks = dce({ el: "ul" });

  [ulInfo, ulDecks].forEach((el) => {
    eac({ el, arr: ["pa-0", "pr-3", "ma-0"] });
    el.style = "list-style:none;";
  });

  const ulInfo_title = dce({ el: "li", inner: "Analyzed decks:" });

  ulInfo.appendChild(ulInfo_title);

  for (let deck of names) {
    const t1 = deck.replace("Deck -", "").replace(".txt", "");
    const li = dce({ el: "li", inner: t1.trim() });
    ulInfo.appendChild(li);
  }

  const ulDecks_title = dce({ el: "li", inner: "Decks Info:" });
  ulDecks.appendChild(ulDecks_title);
  ulDecks.appendChild(dce({ el: "li", inner: `Total Decks: ${total}` }));
  ulDecks.appendChild(dce({ el: "li", inner: `Unique cards: ${uniqueCards}` }));

  summary.appendChild(ulDecks);
  summary.appendChild(ulInfo);
  return summary;
};

decksElement.addEventListener("change", async () => {
  const { files } = decksElement;
  const readers = [];
  if (!files.length) return;

  for (let deck of files) readers.push(readFileAsText(deck));

  const promises = await Promise.all(readers);
  const cardsSummary = summarizeDecks(promises);
  const deckList = exportDeckString(cardsSummary);
  const concatSum = concatSummary(files, cardsSummary);
  const summaryEl = createSummaryEl(concatSum);
  concatSummaryElement.appendChild(summaryEl);

  console.log(deckList, concatSum);
});
