const { JSDOM } = require("jsdom");
const { readFile } = require("fs/promises");

async function start() {
  const html = await readFile("./test.html", { encoding: "utf-8" });
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const searchSection = document.querySelectorAll("#rso > *");
  
}

start();
