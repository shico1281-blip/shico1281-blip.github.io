// Nile Coloring Books — site v1.2.5 (Black Friday offer links).
// The catalog is intentionally data-driven. Add new books to catalog.json.
const catalogNode = document.querySelector("#catalog");
const dialog = document.querySelector("#book-dialog");
const dialogContent = document.querySelector("#dialog-content");
let products = [];
let activeFilter = "all";

const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[char]);
const cardColor = value => /^#[0-9a-fA-F]{6}$/.test(value || "") ? value : "#edf1e7";


// Black Friday — whole November 2026 (Nov 8-30). Sale prices are computed from
// catalog.json, never stored: original prices stay untouched.
const BF_CODE = "BLACKFRIDAY30";
const BF_END = new Date("2026-11-30T23:59:59+02:00");
const salePrice = price => price == null ? null : (Math.round(Number(price) * 70) / 100).toFixed(2);
const money = value => "$" + Number(value).toFixed(2);

function coverMarkup(book) {
  if (book.image) {
    return `<img src="${escapeHTML(book.image)}" alt="${escapeHTML(book.title)} cover" width="${book.width || 400}" height="${book.height || 566}" loading="lazy" decoding="async">`;
  }
  return `<div class="missing-cover"><span>✳</span><b>${escapeHTML(book.title)}</b><small>Cover artwork pending</small></div>`;
}

const SHELVES = [
  {id: "ages-4-7", title: "Ages 4–7 — first coloring adventures"},
  {id: "animals", title: "Animals — meet the creatures"},
  {id: "school", title: "School days"},
  {id: "quiet", title: "A quiet moment — for grown-ups"},
];

function cardHTML(book) {
  return `<article class="book-card">
    <button class="book-image-button" type="button" data-book="${escapeHTML(book.slug)}" aria-label="View ${escapeHTML(book.title)}">
      <div class="book-cover" style="--card-bg:${cardColor(book.cardColor)}">
        ${coverMarkup(book)}<span class="book-badge">${escapeHTML(book.label || (book.category === "kids" ? "For kids" : "For adults"))}</span>
      </div></button>
    <div class="book-meta"><span class="book-category">${escapeHTML(book.kind || "Coloring book")}</span>
      <h3>${escapeHTML(book.title)}</h3>
      <p class="book-pages">${book.pages ? `${book.pages} pages · ${escapeHTML(book.sizes || "A4")}` : ""}</p>
      <div class="book-bottom"><span class="book-price">${book.price == null ? "Price pending" : `<span class="sale-price">${money(salePrice(book.price))}</span> <s class="was-price">${money(book.price)}</s>`}</span>
      <button type="button" data-book="${escapeHTML(book.slug)}">View book →</button></div>
    </div></article>`;
}

function renderCatalog() {
  const visible = products.filter(book => activeFilter === "all" || book.category === activeFilter);
  if (!visible.length) { catalogNode.innerHTML = "<p>No books in this collection yet.</p>"; return; }
  const groups = SHELVES.map(shelf => ({...shelf, books: visible.filter(b => b.shelf === shelf.id)}))
    .filter(g => g.books.length);
  const ungrouped = visible.filter(b => !SHELVES.some(shelf => shelf.id === b.shelf));
  if (ungrouped.length) groups.push({id: "more", title: "More books", books: ungrouped});
  catalogNode.innerHTML = groups.map(g => `<section class="shelf" aria-label="${escapeHTML(g.title)}"><h3 class="shelf-title">${escapeHTML(g.title)}</h3><div class="catalog-grid">${g.books.map(cardHTML).join("")}</div></section>`).join("");
}

function setFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll(".filter").forEach(button => {
    const selected = button.dataset.filter === filter;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  renderCatalog();
}

function openBook(slug) {
  const book = products.find(item => item.slug === slug);
  if (!book) return;
  const checkoutURL = safeCheckoutURL(book.purchaseUrl);
  const checkout = checkoutURL
    ? `<a class="button button-primary" href="${escapeHTML(checkoutURL.href)}" target="_blank" rel="noopener noreferrer">Get the book · ${book.price == null ? "See price" : money(salePrice(book.price))} →</a><p class="bf-dialog-note">🖤 Black Friday: 30% off applies automatically at checkout · Code <code class="bf-code">${BF_CODE}</code> — ends Nov 30, 2026.</p><p class="book-actual-note">Checkout opens on ${escapeHTML(checkoutURL.hostname)}.</p>`
    : '<p class="pending-link">Purchase link pending. This preview does not take payments.</p>';
  const previews = Array.isArray(book.previews) ? book.previews : [];
  const previewHTML = previews.length
    ? `<div class="dialog-previews"><h3>Inside the book — real pages</h3><div class="dialog-preview-grid">${previews.map(p => `<a class="dialog-preview" href="/books/${encodeURIComponent(book.slug)}/#previews"><img src="${escapeHTML(p.src)}" alt="${escapeHTML(p.label)}" loading="lazy"><span>${escapeHTML(p.label)}</span></a>`).join("")}</div></div>`
    : "";
  const awaiting = previews.length ? "" : `<p class="book-actual-note">Interior previews are awaiting the actual book files.</p>`;
  dialogContent.innerHTML = `<div class="dialog-grid"><div class="dialog-cover">${coverMarkup(book)}</div>
    <div class="dialog-copy"><span class="mini-label">${escapeHTML(book.kind || "Coloring book")}</span>
      <h2 id="dialog-title">${escapeHTML(book.title)}</h2><p>${escapeHTML(book.description || "A printable coloring book to make your own.")}</p>
      <p class="dialog-price">${book.price == null ? "Price to confirm" : `<span class="sale-price">${money(salePrice(book.price))}</span> <s class="was-price">${money(book.price)}</s>`}</p>
      ${checkout}${previewHTML}<p><a href="/books/${encodeURIComponent(book.slug)}/">View full book page →</a></p>${awaiting}
    </div></div>`;
  dialog.showModal();
}

function safeCheckoutURL(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (!(url.protocol === "https:" && (host === "gumroad.com" || host.endsWith(".gumroad.com") || host === "creem.io" || host.endsWith(".creem.io")))) return null;
    // v1.2.5: Gumroad checkout shows no discount-code field, so the offer
    // link must carry the code — set() is idempotent if catalog.json
    // already has it.
    if (host === "gumroad.com" || host.endsWith(".gumroad.com")) url.searchParams.set("offer_code", BF_CODE);
    return url;
  } catch { return null; }
}

async function loadCatalog() {
  try {
    const response = await fetch("catalog.json");
    if (!response.ok) throw Error("Catalog unavailable");
    const data = await response.json();
    if (!Array.isArray(data) || !data.every(x => typeof x.slug === "string" && typeof x.title === "string")) throw Error("Invalid catalog");
    products = data.filter(x => x.published !== false);
    renderCatalog();
    const count = document.querySelector(".catalog-count");
    const books = products.filter(x => x.kind !== "Bundle").length;
    const bundles = products.length - books;
    count.textContent = `${books} books · ${bundles} bundles`;
  } catch (error) {
    catalogNode.innerHTML = '<p role="alert">The bookshelf could not load. Please refresh the page.</p>';
  }
}

document.querySelector(".filter-row").addEventListener("click", event => {
  const button = event.target.closest(".filter");
  if (button) setFilter(button.dataset.filter);
});
document.querySelectorAll('a[data-filter-link]').forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    setFilter(link.dataset.filterLink);
    document.querySelector("#books").scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"});
    history.replaceState(null, "", "#books");
  });
});
catalogNode.addEventListener("click", event => {
  const button = event.target.closest("[data-book]");
  if (button) openBook(button.dataset.book);
});
dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
document.querySelector("#year").textContent = new Date().getFullYear();
loadCatalog();

// Black Friday countdown: days left until Nov 30, 2026 (Cairo time).
(function () {
  var el = document.getElementById("bf-days");
  if (!el) return;
  var now = new Date();
  var diff = BF_END - now;
  var days = Math.ceil(diff / 86400000);
  el.textContent = diff <= 0 ? "· Sale ended Nov 30" : days > 1 ? "· " + days + " days left" : days === 1 ? "· Last day!" : "· Ends tonight!";
})();

// Visitor counter (CountAPI alternative, no signup). First visit from a browser
// hits /hit/ (counts), later visits use /get/ (read-only) so reloads don't inflate
// the number. Any failure leaves a quiet "—" and the site works normally.
(function () {
  var el = document.getElementById("visitor-count");
  if (!el) return;
  var KEY = "nilecoloringbooks-com-visits";
  var seen = null;
  try { seen = localStorage.getItem("nbc-counted"); } catch (e) {}
  var url = seen
    ? "https://countapi.mileshilliard.com/api/v1/get/" + KEY
    : "https://countapi.mileshilliard.com/api/v1/hit/" + KEY;
  var done = false;
  var timer = setTimeout(function () { if (!done) el.textContent = "—"; }, 6000);
  fetch(url)
    .then(function (r) { return r.json(); })
    .then(function (d) {
      if (!d || !isFinite(Number(d.value))) throw new Error("bad counter value");
      done = true; clearTimeout(timer);
      el.textContent = Number(d.value).toLocaleString("en-US");
      try { localStorage.setItem("nbc-counted", "1"); } catch (e) {}
    })
    .catch(function () { done = true; clearTimeout(timer); el.textContent = "—"; });
})();

// v1.2.8: the beach studio on the homepage starts as a small preview; the full
// studio loads only when the visitor asks for it.
(function () {
  const btn = document.querySelector("#beach-expand");
  const preview = document.querySelector("#beach-preview");
  const studio = document.querySelector("#ncb-studio");
  if (!btn || !preview || !studio) return;
  btn.addEventListener("click", () => {
    preview.hidden = true;
    studio.hidden = false;
    studio.scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start"});
  });
})();

// v1.2.8: "See it after coloring" — swap the soccer studio for its colored example.
(function () {
  const btn = document.querySelector("#soc-colored-toggle");
  const studio = document.querySelector("#soc-studio");
  const colored = document.querySelector("#soc-colored");
  if (!btn || !studio || !colored) return;
  btn.addEventListener("click", () => {
    const showing = colored.hidden;
    colored.hidden = !showing;
    studio.hidden = showing;
    btn.setAttribute("aria-pressed", String(showing));
    btn.textContent = showing ? "↩ Back to coloring" : "👀 See it after coloring";
  });
})();
