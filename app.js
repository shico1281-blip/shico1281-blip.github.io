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

function renderCatalog() {
  const visible = products.filter(book => activeFilter === "all" || book.category === activeFilter);
  catalogNode.innerHTML = visible.map(book => `<article class="book-card">
    <button class="book-image-button" type="button" data-book="${escapeHTML(book.slug)}" aria-label="View ${escapeHTML(book.title)}">
      <div class="book-cover" style="--card-bg:${cardColor(book.cardColor)}">
        ${coverMarkup(book)}<span class="book-badge">${escapeHTML(book.label || (book.category === "kids" ? "For kids" : "For adults"))}</span><span class="sale-badge">−30% · BLACK FRIDAY</span>
      </div></button>
    <div class="book-meta"><span class="book-category">${escapeHTML(book.kind || "Coloring book")}</span>
      <h3>${escapeHTML(book.title)}</h3><div class="book-bottom"><span class="book-price">${book.price == null ? "Price pending" : `<span class="sale-price">${money(salePrice(book.price))}</span> <s class="was-price">${money(book.price)}</s>`}</span>
      <button type="button" data-book="${escapeHTML(book.slug)}">View book →</button></div>
      <p class="book-code-hint">−30% with code ${BF_CODE} · applies automatically</p>
    </div></article>`).join("");
  if (!visible.length) catalogNode.innerHTML = "<p>No books in this collection yet.</p>";
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
  dialogContent.innerHTML = `<div class="dialog-grid"><div class="dialog-cover">${coverMarkup(book)}</div>
    <div class="dialog-copy"><span class="mini-label">${escapeHTML(book.kind || "Coloring book")}</span>
      <h2 id="dialog-title">${escapeHTML(book.title)}</h2><p>${escapeHTML(book.description || "A printable coloring book to make your own.")}</p>
      <p class="dialog-price">${book.price == null ? "Price to confirm" : `<span class="sale-price">${money(salePrice(book.price))}</span> <s class="was-price">${money(book.price)}</s>`}</p>
      ${checkout}<p><a href="/books/${encodeURIComponent(book.slug)}/">View full book page →</a></p><p class="book-actual-note">Interior previews are awaiting the actual book files.</p>
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

// v1.2 — short intro: hides after ~1.4s, on click, or at once for reduced motion.
(function(){
  const intro = document.querySelector("#intro");
  if (!intro) return;
  const hide = () => { intro.classList.add("intro-hide"); setTimeout(() => intro.remove(), 450); };
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { intro.remove(); return; }
  const timer = setTimeout(hide, 1400);
  intro.addEventListener("click", () => { clearTimeout(timer); hide(); });
})();

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
