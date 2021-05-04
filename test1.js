const { JSDOM } = require("jsdom");
const { readFile, writeFile } = require("fs/promises");

/**
 *
 * @param {HTMLElement} e
 * @returns {string}
 */
function getTextContent(e) {
  const clone = e.cloneNode();
  console.log(`clone`, clone.textContent);
  return clone.textContent || "";
}

async function start() {
  const html = await readFile("./test.html", { encoding: "utf-8" });
  const {
    window: { document },
  } = new JSDOM(html);
  Array.from(document.querySelectorAll("div,span")).forEach((e) => {
    if (getTextContent(e)) console.log(getTextContent(e));
    if (!getTextContent(e).includes("›")) return;
    console.log(getTextContent(e));
  });
}

start();
