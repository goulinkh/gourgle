const { writeFile } = require("fs/promises");
const { JSDOM } = require("jsdom");
const fetch = require("node-fetch");

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.85 Safari/537.36";
/**
 *
 * @param {HTMLElement} rootEl
 * @returns {HTMLElement}
 */
function getFeaturedSnippet(rootEl) {
  /**
   * @type HTMLElement
   */
  let supportLink = rootEl.querySelector(
    'a[href*="featured_snippets" i]'
  );
  if (!supportLink) return null;
  /**
   * @type HTMLElement
   */
  while (supportLink.parentElement.id !== rootEl.id) {
    supportLink = supportLink.parentElement;
  }
  return supportLink;
}
async function start() {
  query = "Best rated sub 2020";
  language = "en";
  const url = `https://www.google.com/search?q=${query}&hl=${language}`;
  const html = await (
    await fetch(url, { header: { "User-Agent": USER_AGENT } })
  ).text();
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const rootEl = document.querySelector("#main");
  if (!rootEl) throw new Error("Main element not found");
  const featuredSnippet = getFeaturedSnippet(rootEl);
  console.log(`featuredSnippet`, featuredSnippet)
  if (!featuredSnippet) {
    console.log("No features snippet");
    return;
  }
  const bulletedList = featuredSnippet.querySelector("ul");
  if (bulletedList) {
    console.log("[INFO] features-snippet:bulleted-list");
    Array.from(bulletedList.querySelectorAll("li")).forEach((e) =>
      console.log(e.textContent)
    );
  }
  await writeFile("./test.html", html, { encoding: "utf-8" });
  // const searchSectionEls = Array.from(document.querySelectorAll("#rso > *"));
  // searchSectionEls.forEach((el) => {
  //   el.querySelector()
  // });
}

start();
