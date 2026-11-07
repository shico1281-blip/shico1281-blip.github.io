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
        ${coverMarkup(book)}<span class="book-badge">${escapeHTML(book.label || (book.category === "kids" ? "For kids" : "For adults"))}</span>
      </div></button>
    <div class="book-meta"><span class="book-category">${escapeHTML(book.kind || "Coloring book")}</span>
      <h3>${escapeHTML(book.title)}</h3><div class="book-bottom"><span>${book.price == null ? "Price pending" : "$" + Number(book.price).toFixed(2)}</span>
      <button type="button" data-book="${escapeHTML(book.slug)}">View book →</button></div>
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
    ? `<a class="button button-primary" href="${escapeHTML(checkoutURL.href)}" target="_blank" rel="noopener noreferrer">Get the book · ${book.price == null ? "See price" : "$" + Number(book.price).toFixed(2)} →</a><p class="book-actual-note">Checkout opens on ${escapeHTML(checkoutURL.hostname)}.</p>`
    : '<p class="pending-link">Purchase link pending. This preview does not take payments.</p>';
  dialogContent.innerHTML = `<div class="dialog-grid"><div class="dialog-cover">${coverMarkup(book)}</div>
    <div class="dialog-copy"><span class="mini-label">${escapeHTML(book.kind || "Coloring book")}</span>
      <h2 id="dialog-title">${escapeHTML(book.title)}</h2><p>${escapeHTML(book.description || "A printable coloring book to make your own.")}</p>
      <p class="dialog-price">${book.price == null ? "Price to confirm" : "$" + Number(book.price).toFixed(2)}</p>
      ${checkout}<p><a href="/books/${encodeURIComponent(book.slug)}/">View full book page →</a></p><p class="book-actual-note">Interior previews are awaiting the actual book files.</p>
    </div></div>`;
  dialog.showModal();
}

function safeCheckoutURL(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && (host === "gumroad.com" || host.endsWith(".gumroad.com") || host === "creem.io" || host.endsWith(".creem.io")) ? url : null;
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

// Each closed SVG shape is an independent colorable region. Undo stores one
// complete change so Start over can also be undone as one action.
const scene = document.querySelector("#coloring-scene");
const regions = [...scene.querySelectorAll(".region")];
const swatches = [...document.querySelectorAll(".swatch")];
const historyStack = [];
const undoButton = document.querySelector("#undo");
const eraserButton = document.querySelector("#eraser");
const progressText = document.querySelector("#progress-text");
let selectedColor = "#ff7a3d";
let eraseMode = false;

regions.forEach((shape, index) => {
  shape.setAttribute("tabindex", "0");
  shape.setAttribute("role", "button");
  shape.setAttribute("aria-label", `Color ${shape.dataset.name || "area " + (index + 1)}`);
});
function updateProgress() {
  const colored = regions.filter(shape => shape.dataset.color).length;
  progressText.textContent = `${colored} of ${regions.length} areas colored`;
  undoButton.disabled = historyStack.length === 0;
}
function applyColor(shape, value) {
  if (!shape || !shape.classList.contains("region")) return;
  const previous = shape.dataset.color || "";
  if (previous === value) return;
  historyStack.push([{shape, previous}]);
  shape.dataset.color = value;
  shape.style.fill = value || "";
  updateProgress();
}
scene.addEventListener("click", event => applyColor(event.target, eraseMode ? "" : selectedColor));
scene.addEventListener("keydown", event => {
  if ((event.key === "Enter" || event.key === " ") && event.target.classList.contains("region")) {
    event.preventDefault(); applyColor(event.target, eraseMode ? "" : selectedColor);
  }
});
swatches.forEach(button => button.addEventListener("click", () => {
  selectedColor = button.dataset.color;
  eraseMode = false;
  eraserButton.setAttribute("aria-pressed", "false");
  swatches.forEach(item => { const on = item === button; item.classList.toggle("selected", on); item.setAttribute("aria-pressed", String(on)); });
}));
eraserButton.addEventListener("click", () => {
  eraseMode = !eraseMode;
  eraserButton.setAttribute("aria-pressed", String(eraseMode));
  swatches.forEach(item => { item.classList.remove("selected"); item.setAttribute("aria-pressed", "false"); });
  if (!eraseMode) {
    const active = swatches.find(item => item.dataset.color === selectedColor);
    active?.classList.add("selected"); active?.setAttribute("aria-pressed", "true");
  }
});
undoButton.addEventListener("click", () => {
  const changes = historyStack.pop();
  if (!changes) return;
  changes.forEach(({shape, previous}) => { shape.dataset.color = previous; shape.style.fill = previous || ""; });
  updateProgress();
});
document.querySelector("#reset").addEventListener("click", () => {
  const changes = regions.filter(shape => shape.dataset.color).map(shape => ({shape, previous:shape.dataset.color}));
  if (!changes.length) return;
  historyStack.push(changes);
  changes.forEach(({shape}) => { shape.dataset.color = ""; shape.style.fill = ""; });
  updateProgress();
});
document.querySelector("#save-art").addEventListener("click", () => {
  const copy = scene.cloneNode(true);
  copy.querySelectorAll(".region").forEach(shape => {
    shape.removeAttribute("tabindex"); shape.removeAttribute("role"); shape.removeAttribute("aria-label");
    shape.setAttribute("fill", shape.dataset.color || "#ffffff");
    shape.removeAttribute("style"); shape.removeAttribute("data-color");
  });
  copy.removeAttribute("id"); copy.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  // The downloaded SVG must be self-contained; the page stylesheet is not saved with it.
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = ".region{stroke:#1f2a44;stroke-width:2.4;stroke-linejoin:round;stroke-linecap:round}.scene-line{fill:none;stroke:#1f2a44;stroke-width:2.4;stroke-linecap:round}.scene-frame{fill:none;stroke:#1f2a44;stroke-width:3}";
  copy.insertBefore(style, copy.firstChild);
  const blob = new Blob([new XMLSerializer().serializeToString(copy)], {type:"image/svg+xml"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a"); link.href = url; link.download = "my-nile-coloring.svg"; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
updateProgress();

// v1.2 — short intro: hides after ~1.4s, on click, or at once for reduced motion.
(function(){
  const intro = document.querySelector("#intro");
  if (!intro) return;
  const hide = () => { intro.classList.add("intro-hide"); setTimeout(() => intro.remove(), 450); };
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { intro.remove(); return; }
  const timer = setTimeout(hide, 1400);
  intro.addEventListener("click", () => { clearTimeout(timer); hide(); });
})();
