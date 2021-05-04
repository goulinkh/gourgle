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
  let supportLinkEl = rootEl.querySelector('a[href*="featured_snippets" i]');
  if (!supportLinkEl) return null;
  /**
   * @type HTMLElement
   */
  let referenceLink = null;
  console.log(`supportLink.href`, supportLinkEl.href);
  const supportLink = supportLinkEl.href;
  while (supportLinkEl.parentElement.id !== rootEl.id) {
    referenceLink =
      referenceLink ||
      Array.from(supportLinkEl.querySelectorAll("a")).filter(
        (e) => e.href !== supportLink
      )?.[0];

    supportLinkEl = supportLinkEl.parentElement;
  }
  if (!supportLinkEl)
    throw new Error("Couldn't find the feature snippets root element");

  const featuredSnippetEl = supportLinkEl;
  let data =
    parseBulletedList(featuredSnippetEl) ||
    parseOrderedList(featuredSnippetEl) ||
    parseTable(featuredSnippetEl) ||
    parseParagraph(featuredSnippetEl, referenceLink);

  if (referenceLink) {
    url = referenceLink.href;
    if (url.match(/^\/url\?q=/)) {
      referenceLink = new URLSearchParams(url).get("/url?q");
    } else {
      referenceLink = url;
    }
  }

  return {
    data,
    referenceLink,
  };
}

function parseBulletedList(featuredSnippet) {
  const bulletedList = featuredSnippet.querySelector("ul");
  if (bulletedList) {
    console.log("[INFO] features-snippet:bulleted-list");
    const items = [];
    Array.from(bulletedList.querySelectorAll("li")).forEach((e) =>
      items.push(e.textContent)
    );
    return { type: "bulleted-list", items };
  }
  return null;
}

function parseOrderedList(featuredSnippet) {
  const bulletedList = featuredSnippet.querySelector("ol");
  if (bulletedList) {
    console.log("[INFO] features-snippet:ordered-list");
    const items = [];
    Array.from(bulletedList.querySelectorAll("li")).forEach((e) =>
      items.push(e.textContent)
    );
    return { type: "ordered-list", items };
  }
  return null;
}

/**
 *
 * @param {HTMLElement} featuredSnippet
 * @returns {object}
 */
function parseTable(featuredSnippet) {
  const table = featuredSnippet.querySelector("table");
  if (table) {
    console.log("[INFO] features-snippet:table");
    const header = table.querySelector("tr:first-child");
    const keys = Array.from(header.querySelectorAll(":scope > *")).map(
      (e) => e.textContent
    );
    console.log(`keys`, keys);
    if (!keys || !keys.length) return null;
    const data = Array.from(table.querySelectorAll("tr"))
      .filter((e) => e !== header)
      .map((e) => {
        const dataCells = Array.from(e.querySelectorAll(":scope > *"));
        const row = {};
        keys.map((e, i) => (row[e] = dataCells[i].textContent));
        return row;
      });
    return { type: "table", data };
  }
  return null;
}

/**
 *
 * @param {HTMLElement} featuredSnippetEl
 * @param {HTMLElement} referenceLinkEl
 */
function parseParagraph(featuredSnippetEl, referenceLinkEl) {
  const referenceContent = referenceLinkEl.textContent;
  const texts = Array.from(featuredSnippetEl.querySelectorAll("div,span"))
    .map((e) => e.textContent || "")
    .sort((e1, e2) => e2.length - e1.length);
  let data = null;
  for (let i = 0; i < texts.length; i++) {
    const text = texts[i];
    if (text && !text.includes(referenceContent)) {
      data = { type: "paragraph", text };
      break;
    }
  }
  return data;
}

async function start() {
  // bulleted list
  // query = "Best rated sub 2020";
  // table
  // query = "plus grandes villes de france";
  // ordered list
  // query = "nigella lawson chocolate cake recipe";
  // paragraph
  query = "seo links";

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
  console.log(`featuredSnippet`, featuredSnippet);

  await writeFile("./test.html", html, { encoding: "utf-8" });
  // const searchSectionEls = Array.from(document.querySelectorAll("#rso > *"));
  // searchSectionEls.forEach((el) => {
  //   el.querySelector()
  // });
}

start();
