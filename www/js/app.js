const decksElement = document.querySelector("#decksElement");

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

decksElement.addEventListener("change", async () => {
  const { files } = decksElement;
  const readers = [];
  if (!files.length) return;

  for (let deck of files) readers.push(readFileAsText(deck));

  const promises = await Promise.all(readers);

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
  const cardsSummary = cards.reduce((acc, cur) => {
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

  deckList = "";
  for (let card in cardsSummary) {
    const { max } = cardsSummary[card];
    deckList += `${max} ${card} \n`;
  }
  console.log(deckList);
});
