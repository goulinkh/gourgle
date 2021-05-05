const { writeFile } = require("fs/promises");
const { JSDOM } = require("jsdom");
const fetch = require("node-fetch");
const randomUseragent = require("random-useragent");

const USER_AGENT = randomUseragent.getRandom();
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
    referenceLink = getUrl(referenceLink.href);
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
    return { type: "table", ...data };
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

/**
 *
 * @param {HTMLElement} document
 */
function getAllLinks(document) {
  return uniqBy(
    Array.from(document.querySelectorAll("div"))
      .filter((e) => {
        const links = Array.from(e.querySelectorAll("a"));
        if (links.length !== 1) return false;
        if (!links[0].textContent.includes(" › ")) return false;
        return (
          Array.from(e.querySelectorAll("div,span"))
            .map((e) => getTextContent(e))
            .filter((e) => !!e).length > 1
        );
      })
      .map((e) => {
        // return e.textContent;
        const aEl = e.querySelector("a");
        const aTexts = Array.from(aEl.querySelectorAll("*")).map(
          (e) => e.textContent
        );
        const title = aTexts[1];
        const path = aTexts[2];
        const texts = Array.from(e.querySelectorAll("div,span"))
          .map((e) => getTextContent(e))
          .filter((e) => !!e && !e.includes(title) && !e.includes(path))
          .sort((e1, e2) => e2.length - e1.length);
        const description = texts?.[0]?.length > 13 ? texts[0] : null;
        return {
          title,
          path,
          description,
          link: getUrl(aEl.href),
        };
      }),
    (e) => e.link
  );
}

/**
 * get element’s text content without its child nodes
 * @param {HTMLElement} e
 * @returns {string}
 */
function getTextContent(e) {
  return [].reduce.call(
    e.childNodes,
    function (a, b) {
      return a + (b.nodeType === 3 ? b.textContent : "");
    },
    ""
  );
}
function uniqBy(a, key) {
  var seen = {};
  return a.filter(function (item) {
    var k = key(item);
    return seen.hasOwnProperty(k) ? false : (seen[k] = true);
  });
}
function getUrl(str) {
  if (str.match(/^\/url\?q=/)) {
    return new URLSearchParams(str).get("/url?q");
  } else {
    return str;
  }
}

async function search(query, language, page = 1) {
  const url = `https://www.google.com/search?q=${query}&hl=${language}&start=${
    page - 1
  }0`;
  const html = await (
    await fetch(url, {
      header: {
        "User-Agent": USER_AGENT,
      },
    })
  ).text();
  const {
    window: { document },
  } = new JSDOM(html);
  const rootEl = document.querySelector("#main");
  if (!rootEl) throw new Error("Main element not found");
  const featuredSnippet = getFeaturedSnippet(rootEl);
  const links = getAllLinks(document);
  return { featuredSnippet, links };
}

module.exports = {
  search,
  supportedLanguages: require("./languages.json"),
};
