/* ============================================================================
 * ncb-gate.js — Nile Coloring Books email-capture gate (reusable snippet)
 * ----------------------------------------------------------------------------
 * One modal, used at both gating points:
 *   (a) coloring-studio Save / Download buttons
 *   (b) free printable pages' PDF download buttons
 *
 * Behaviour: an unregistered click on a [data-ncb-gate] element is stopped
 * in the CAPTURE phase (before the element's own handler runs), the modal
 * opens, and NOTHING downloads. After a successful registration the
 * original action is re-dispatched at once — no second click needed.
 * A registered visitor (localStorage key ncb-registered-v1) is never
 * shown the form again for a gated action.
 *
 * Backend: Web3Forms — existing form "Nile Coloring Books Guestbook"
 * (created 8 Nov 2026, website nilecoloringbooks.com, Free plan,
 * 250 submissions/month, sole recipient sherif.in.26@gmail.com).
 * The access key below is embedded in this public frontend code BY DESIGN:
 * Web3Forms keys are public frontend keys, not passwords — that is how
 * Web3Forms is meant to be used. Never treat it as a secret credential,
 * and never put any other credential in this file.
 *
 * Test override: before loading this script, a test page may set
 *   window.NCB_GATE_ENDPOINT = "/mock-web3forms";
 * or window.NCB_GATE_CONFIG = { endpoint: "...", accessKey: "..." }.
 * Dependency-free, plain JS, no frameworks.
 * ========================================================================== */
(function () {
  "use strict";

  /* --- Single configuration point (edit here, nowhere else) --- */
  var NCB_GATE_CONFIG = {
    endpoint: "https://api.web3forms.com/submit",
    /* Access key of the existing "Nile Coloring Books Guestbook" form.
     * Public frontend key by design (see header comment). */
    accessKey: "9c71472c-0f6c-4ac8-97aa-65b3fc18069a",
    storageKey: "ncb-registered-v1"
  };
  if (window.NCB_GATE_CONFIG) {
    if (window.NCB_GATE_CONFIG.endpoint) NCB_GATE_CONFIG.endpoint = window.NCB_GATE_CONFIG.endpoint;
    if (window.NCB_GATE_CONFIG.accessKey) NCB_GATE_CONFIG.accessKey = window.NCB_GATE_CONFIG.accessKey;
    if (window.NCB_GATE_CONFIG.storageKey) NCB_GATE_CONFIG.storageKey = window.NCB_GATE_CONFIG.storageKey;
  }
  if (window.NCB_GATE_ENDPOINT) NCB_GATE_CONFIG.endpoint = window.NCB_GATE_ENDPOINT;

  var STORAGE_KEY = NCB_GATE_CONFIG.storageKey;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* --- Storage: localStorage, sessionStorage fallback, never crash --- */
  function readStore() {
    var raw = null;
    try { raw = window.localStorage.getItem(STORAGE_KEY); } catch (_) { /* unavailable */ }
    if (raw) return { store: "local", raw: raw };
    try { raw = window.sessionStorage.getItem(STORAGE_KEY); } catch (_) { /* unavailable */ }
    if (raw) return { store: "session", raw: raw };
    return null;
  }
  function writeStore(value) {
    var json = JSON.stringify(value);
    try { window.localStorage.setItem(STORAGE_KEY, json); return; } catch (_) { /* fall through */ }
    try { window.sessionStorage.setItem(STORAGE_KEY, json); } catch (_) { /* storage unavailable: registration lasts for this page only */ }
  }
  function clearStore() {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch (_) { /* ignore */ }
    try { window.sessionStorage.removeItem(STORAGE_KEY); } catch (_) { /* ignore */ }
  }
  function getRegistration() {
    var found = readStore();
    if (!found) return null;
    try {
      var parsed = JSON.parse(found.raw);
      if (parsed && typeof parsed.email === "string" && EMAIL_RE.test(parsed.email)) return parsed;
    } catch (_) { /* corrupt value counts as not registered */ }
    return null;
  }
  function isRegistered() { return !!getRegistration(); }

  /* --- Modal markup (used if the page did not already include
   *     gate/gate-modal.html). Identical fields in both cases. --- */
  var MODAL_HTML =
    '<div class="ncb-gate-backdrop" data-ncb-gate-close></div>' +
    '<div class="ncb-gate-dialog" role="dialog" aria-modal="true" aria-labelledby="ncb-gate-title">' +
    '  <button type="button" class="ncb-gate-x" data-ncb-gate-close aria-label="Close">&times;</button>' +
    '  <h2 id="ncb-gate-title">Get your free download</h2>' +
    '  <p class="ncb-gate-intro">A parent or guardian registers once with a name and email — then downloads and saves are open. No account, no password.</p>' +
    '  <form id="ncb-gate-form" novalidate>' +
    '    <label class="ncb-gate-field" for="ncb-gate-name">Parent or guardian name' +
    '      <input type="text" id="ncb-gate-name" name="name" autocomplete="name" required>' +
    '    </label>' +
    '    <p class="ncb-gate-error" id="ncb-gate-name-error" hidden>Please enter the parent or guardian&rsquo;s name.</p>' +
    '    <label class="ncb-gate-field" for="ncb-gate-email">Parent or guardian email' +
    '      <input type="email" id="ncb-gate-email" name="email" autocomplete="email" inputmode="email" required>' +
    '    </label>' +
    '    <p class="ncb-gate-error" id="ncb-gate-email-error" hidden>Please enter a valid email address.</p>' +
    '    <label class="ncb-gate-consent">' +
    '      <input type="checkbox" id="ncb-gate-consent" name="consent" required>' +
    '      <span class="ncb-gate-consent-text">By entering your email, you agree to receive promotional emails and offers from Nile Coloring Books.' +
    '        <span class="ncb-gate-unsubscribe">You can unsubscribe at any time by emailing sherif.in.26@gmail.com and asking to be removed from our email list &mdash; we will remove you and stop sending you promotional emails.</span>' +
    '      </span>' +
    '    </label>' +
    '    <p class="ncb-gate-error" id="ncb-gate-consent-error" hidden>Please tick the consent box to continue.</p>' +
    '    <label class="ncb-gate-waitlist">' +
    '      <input type="checkbox" id="ncb-gate-waitlist" name="waitlist_personalized">' +
    '      <span>I&rsquo;m interested in a personalized book starring my child</span>' +
    '    </label>' +
    '    <p class="ncb-gate-error" id="ncb-gate-error" role="alert" hidden>Something went wrong &mdash; please try again.</p>' +
    '    <button type="submit" class="ncb-gate-submit" id="ncb-gate-submit">Get my free download</button>' +
    '    <p class="ncb-gate-fineprint">We never ask for the child&rsquo;s name or any children&rsquo;s data. See our <a href="/privacy/">privacy page</a>.</p>' +
    '  </form>' +
    '</div>';

  var modal = null;          /* the #ncb-gate-modal element */
  var pendingEl = null;      /* gated element whose action resumes after registration */
  var pendingSource = "";    /* source label for the pending submission */
  var pendingOnSuccess = null;
  var lastFocus = null;

  function ensureModal() {
    modal = document.getElementById("ncb-gate-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "ncb-gate-modal";
      modal.className = "ncb-gate-modal";
      modal.hidden = true;
      modal.innerHTML = MODAL_HTML;
      document.body.appendChild(modal);
    }
    /* Wire in BOTH branches: a static fragment (included by the page) must
     * get the same submit/close/Escape handlers as a JS-injected one.
     * The dataset guard keeps repeated openGate() calls from double-binding.
     * (Fix 20 Nov 01:44 EET — the early return above used to skip wiring
     * for static modals, leaving the form to do a native GET reload.) */
    if (!modal.dataset.ncbWired) {
      wireModal(modal);
      modal.dataset.ncbWired = "1";
    }
    return modal;
  }

  function showError(id, show) {
    var el = document.getElementById(id);
    if (el) el.hidden = !show;
  }

  function openGate(opts) {
    opts = opts || {};
    ensureModal();
    pendingEl = opts.element || null;
    pendingSource = opts.source || (pendingEl && pendingEl.getAttribute("data-ncb-source")) || document.title || "website";
    pendingOnSuccess = opts.onSuccess || null;
    var submit = document.getElementById("ncb-gate-submit");
    if (submit) submit.textContent = opts.submitLabel || (pendingEl && pendingEl.getAttribute("data-ncb-submit-label")) || "Get my free download";
    showError("ncb-gate-error", false);
    showError("ncb-gate-name-error", false);
    showError("ncb-gate-email-error", false);
    showError("ncb-gate-consent-error", false);
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.classList.add("ncb-gate-open");
    var nameInput = document.getElementById("ncb-gate-name");
    if (nameInput) nameInput.focus();
  }

  function closeGate() {
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("ncb-gate-open");
    pendingEl = null;
    pendingOnSuccess = null;
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (_) { /* ignore */ } }
  }

  /* POST one registration. Resolves with the registration record on
   * success; rejects on any failure (network, non-2xx, success:false).
   * The download/save is NEVER granted on a failed submit. */
  function submitRegistration(data) {
    var payload = {
      access_key: NCB_GATE_CONFIG.accessKey,
      name: data.name,
      email: data.email,
      consent: "yes",
      source: data.source || document.title || "website",
      waitlist_personalized: data.waitlist ? "yes" : "no",
      subject: "Nile Coloring Books — free download registration (" + (data.source || "website") + ")"
    };
    return fetch(NCB_GATE_CONFIG.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (resp) {
      if (!resp.ok) throw new Error("submit failed: HTTP " + resp.status);
      return resp.json().catch(function () { return {}; });
    }).then(function (json) {
      if (json && json.success === false) throw new Error("submit rejected by server");
      var record = { name: data.name, email: data.email, at: new Date().toISOString() };
      writeStore(record);
      document.dispatchEvent(new CustomEvent("ncb-gate:registered", {
        detail: { name: record.name, email: record.email, source: payload.source, justRegistered: true }
      }));
      return record;
    });
  }

  /* Validate + submit the modal form. Returns a promise. */
  function submitModalForm() {
    var nameInput = document.getElementById("ncb-gate-name");
    var emailInput = document.getElementById("ncb-gate-email");
    var consentInput = document.getElementById("ncb-gate-consent");
    var waitlistInput = document.getElementById("ncb-gate-waitlist");
    var submitBtn = document.getElementById("ncb-gate-submit");
    var name = nameInput ? nameInput.value.trim() : "";
    var email = emailInput ? emailInput.value.trim() : "";
    var consent = consentInput ? consentInput.checked : false;

    var nameBad = name.length === 0;
    var emailBad = !EMAIL_RE.test(email);
    var consentBad = !consent;
    showError("ncb-gate-name-error", nameBad);
    showError("ncb-gate-email-error", emailBad);
    showError("ncb-gate-consent-error", consentBad);
    showError("ncb-gate-error", false);
    if (nameBad || emailBad || consentBad) return Promise.reject(new Error("validation"));

    var originalLabel = submitBtn ? submitBtn.textContent : "";
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Sending…"; }
    return submitRegistration({
      name: name, email: email, waitlist: !!(waitlistInput && waitlistInput.checked), source: pendingSource
    }).then(function (record) {
      var el = pendingEl, cb = pendingOnSuccess;
      closeGate();
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
      if (cb) { try { cb(record); } catch (_) { /* callback errors must not block the download */ } }
      /* Re-dispatch the original action at once — no second click.
       * The gate now sees a registered visitor, so it lets it through. */
      if (el) { try { el.click(); } catch (_) { /* ignore */ } }
      return record;
    }).catch(function (err) {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
      if (err && err.message === "validation") throw err;
      showError("ncb-gate-error", true);   /* gate stays closed; retry allowed */
      throw err;
    });
  }

  function wireModal(root) {
    var form = root.querySelector("#ncb-gate-form");
    if (form) form.addEventListener("submit", function (e) {
      e.preventDefault();
      submitModalForm().catch(function () { /* inline error already shown */ });
    });
    root.querySelectorAll("[data-ncb-gate-close]").forEach(function (el) {
      el.addEventListener("click", function () { closeGate(); });
    });
    root.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeGate();
    });
  }

  /* --- Gating: CAPTURE phase, so we run before the element's own
   *     handler (e.g. the studio's save handler) and before any
   *     default action (e.g. a PDF download). --- */
  function onDocumentClick(e) {
    var target = e.target && e.target.closest ? e.target.closest("[data-ncb-gate]") : null;
    if (!target) return;
    if (isRegistered()) return; /* registered: let the action run untouched */
    e.preventDefault();
    e.stopPropagation();
    openGate({ element: target });
  }

  /* Footer / settings link: "Update my email" — clears the stored
   * registration and re-opens the modal (no pending action). */
  function onUpdateEmailClick(e) {
    var target = e.target && e.target.closest ? e.target.closest("[data-ncb-update-email]") : null;
    if (!target) return;
    e.preventDefault();
    clearStore();
    openGate({ submitLabel: "Save my email" });
  }

  /* Inline (non-modal) newsletter form, e.g. the site-wide footer signup.
   * Markup contract: <form data-ncb-gate-form data-ncb-source="...">
   * with inputs named name / email / consent / waitlist_personalized and an
   * element [data-ncb-gate-form-message] for the result text. */
  function onGateFormSubmit(e) {
    var form = e.target && e.target.closest ? e.target.closest("[data-ncb-gate-form]") : null;
    if (!form) return;
    e.preventDefault();
    var name = (form.querySelector('[name="name"]') || {}).value || "";
    var email = (form.querySelector('[name="email"]') || {}).value || "";
    var consent = (form.querySelector('[name="consent"]') || {}).checked || false;
    var waitlist = (form.querySelector('[name="waitlist_personalized"]') || {}).checked || false;
    var message = form.querySelector("[data-ncb-gate-form-message]");
    var submitBtn = form.querySelector('[type="submit"]');
    function say(text, isError) {
      if (!message) return;
      message.hidden = false;
      message.textContent = text;
      message.setAttribute("data-error", isError ? "true" : "false");
    }
    name = name.trim(); email = email.trim();
    if (!name) { say("Please enter the parent or guardian\u2019s name.", true); return; }
    if (!EMAIL_RE.test(email)) { say("Please enter a valid email address.", true); return; }
    if (!consent) { say("Please tick the consent box to continue.", true); return; }
    if (submitBtn) submitBtn.disabled = true;
    submitRegistration({
      name: name, email: email, waitlist: waitlist,
      source: form.getAttribute("data-ncb-source") || "footer-newsletter"
    }).then(function () {
      if (submitBtn) submitBtn.disabled = false;
      say("You\u2019re in! We\u2019ll send free pages and offers to " + email + ".", false);
      form.reset();
    }).catch(function () {
      if (submitBtn) submitBtn.disabled = false;
      say("Something went wrong \u2014 please try again.", true);
    });
  }

  function init() {
    ensureModal();
    /* Capture = true: this runs before target/bubble handlers. */
    document.addEventListener("click", onDocumentClick, true);
    document.addEventListener("click", onUpdateEmailClick, false);
    document.addEventListener("submit", onGateFormSubmit, true);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal && !modal.hidden) closeGate();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.NCBGate = {
    config: NCB_GATE_CONFIG,
    isRegistered: isRegistered,
    getRegistration: getRegistration,
    clearRegistration: clearStore,
    openGate: openGate,
    closeGate: closeGate,
    submitRegistration: submitRegistration
  };
})();
