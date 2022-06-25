const decksElement = document.querySelector("#decksElement");
const concatSummaryElement = document.querySelector("#concat-summary");
const uniqueCardsElement = document.querySelector("#unique-cards");
const resetConcat = document.querySelector("#reset");

let decksToVisualization = 0;

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
  return cards.sort((a, b) => b.count - a.count);
};

const summarizeDecks = (promises) => {
  const cards = convertDeckTextToArray(promises);

  const result = cards.reduce((acc, cur) => {
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

  return result;
};

const exportDeckString = (cards, prop = "max") => {
  let deckList = "";
  for (let card in cards) {
    const value = cards[card][prop];
    deckList += `${value} ${card} \n`;
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

const createDeckVisualization = (deckList) => {
  decksToVisualization++;
  deckList = deckList.split("\n");
  const ul = dce({ el: "ul" });
  ul.setAttribute("id", `deck-vis-${decksToVisualization}`);
  eac({ el: ul, arr: ["deck-vis"] });
  deckList.forEach((card) => {
    const el = dce({ el: "li", inner: card.trim() });
    eac({ el, arr: ["fz-3", "pxy-0-1"] });
    ul.appendChild(el);
  });

  return ul;
};
const changeDeckVisualization = (index = 0) => {
  const parents = [
    document.querySelectorAll(".deck-vis"),
    document.querySelectorAll(".deck-vis-selector li"),
  ];

  const targets = [
    document.querySelectorAll(".deck-vis")[index],
    document.querySelectorAll(".deck-vis-selector li")[index],
  ];

  parents.forEach((element) =>
    element.forEach((vis) => vis.classList.remove("active"))
  );

  targets.forEach((target) => target.classList.add("active"));
};

const createVisualizationSelector = (arr) => {
  const ul = dce({ el: "ul" });
  eac({ el: ul, arr: ["deck-vis-selector"] });
  for (let index = 0; index < decksToVisualization; index++) {
    const li = dce({ el: "li", inner: arr[index] });
    if (index === 0) eac({ el: li, arr: ["active"] });
    li.addEventListener("click", () => changeDeckVisualization(index));
    ul.appendChild(li);
  }
  return ul;
};

decksElement.addEventListener("change", async () => {
  const { files } = decksElement;
  const readers = [];
  if (!files.length) return;

  for (let deck of files) readers.push(readFileAsText(deck));

  const promises = await Promise.all(readers);
  const cardsSummary = summarizeDecks(promises);
  const uniqueDeckList = exportDeckString(cardsSummary);
  const totalDeckList = exportDeckString(cardsSummary, "count");
  const concatSum = concatSummary(files, cardsSummary);
  const summaryEl = createSummaryEl(concatSum);
  concatSummaryElement.appendChild(summaryEl);

  const uniqueCardsEl = createDeckVisualization(uniqueDeckList);
  const totalCardsEl = createDeckVisualization(totalDeckList);
  const deckVisualizations = [uniqueCardsEl, totalCardsEl];
  const visualizationSelectors = createVisualizationSelector([
    "unique",
    "total",
  ]);
  uniqueCardsElement.appendChild(visualizationSelectors);
  deckVisualizations.forEach((vis) => uniqueCardsElement.appendChild(vis));
  changeDeckVisualization();

  decksElement.disabled = true;
  showResetButton();
});

const showResetButton = () => {
  resetConcat.classList.remove("d-none");
  resetConcat.classList.add("d-flex");
};

resetConcat.addEventListener("click", () => location.reload());
