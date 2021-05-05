#! /usr/bin/env node
const { search } = require("./index");

function help(status = 0) {
  console.log(`./gourgle-cli.js query [page-number [language]]`);
  process.exit(status);
}

async function start() {
  // bulleted list
  // query = "Best rated sub 2020";
  // table
  // query = "plus grandes villes de france";
  // ordered list
  // query = "nigella lawson chocolate cake recipe";
  // paragraph
  if (process.argv[2] && process.argv[2].match(/^--help|-h$/)) help();
  if (process.argv.length < 3 || process.argv.length > 5) help(1);
  const query = process.argv[2];
  const pageNumber = process.argv[3];
  const language = process.argv[4] || "en";
  console.log(
    JSON.stringify(await search(query, language, pageNumber), null, 2)
  );

  // const searchSectionEls = Array.from(document.querySelectorAll("#rso > *"));
  // searchSectionEls.forEach((el) => {
  //   el.querySelector()
  // });
}

start();
