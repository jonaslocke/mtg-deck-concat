const decksElement = document.querySelector("#decksElement");
const concatSummary = document.querySelector("#concat-summary");

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

decksElement.addEventListener("change", async () => {
  const { files } = decksElement;
  const readers = [];
  if (!files.length) return;

  for (let deck of files) readers.push(readFileAsText(deck));

  const promises = await Promise.all(readers);

  const cardsSummary = summarizeDecks(promises);

  const deckList = exportDeckString(cardsSummary);
  console.log(deckList);
});
