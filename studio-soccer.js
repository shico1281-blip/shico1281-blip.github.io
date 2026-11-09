/* Nile Coloring Books studio v3 — soccer sample (My School Day Boy p18). v1.2.9: 12-color
   palette + custom color, 4 fill styles (solid, linear gradient, radial gradient, 10 patterns),
   pen, stamps, eraser tool, zoom, random fill, PNG + SVG export. The toolset is ported from the
   "تجارب الرسمة التفاعلية" experiments page; the drawing itself is unchanged: the real P18 page
   from the book (120 regions from the region map), so the "See it after coloring" toggle and the
   colored example still show the same page. Pure browser canvas; no libraries or network calls. */
(() => {
  "use strict";
  const root = document.querySelector("#soc-studio");
  if (!root) return;
  const paint = root.querySelector("#soc-paint");
  const ctx = paint.getContext("2d", {willReadFrequently:true});
  const lines = root.querySelector("#soc-lines");
  const ink = root.querySelector("#soc-ink");
  const inkCtx = ink.getContext("2d");
  const feedback = root.querySelector("#soc-feedback");
  const feedbackCtx = feedback.getContext("2d");
  const loading = root.querySelector("#soc-loading");
  const status = root.querySelector("#soc-count");
  const cursor = root.querySelector("#soc-cursor");
  const art = root.querySelector("#soc-art");
  const artPanel = root.querySelector(".soc-art-panel");
  const palette = [...root.querySelectorAll("#soc-palette button")];
  const customColor = root.querySelector("#soc-custom-color");
  const currentColorLabel = root.querySelector("#soc-current-color");
  const styleBtns = [...root.querySelectorAll("#soc-styles button")];
  const patternBtns = [...root.querySelectorAll("#soc-patterns button")];
  const patternGrid = root.querySelector("#soc-patterns");
  const toolBtns = [...root.querySelectorAll("#soc-tools button")];
  const stampBtns = [...root.querySelectorAll("#soc-stamps button")];
  const stampRow = root.querySelector("#soc-stamps");
  const sizeRow = root.querySelector("#soc-size");
  const sizeRange = root.querySelector("#soc-size-range");
  const sizeVal = root.querySelector("#soc-size-val");
  const zoomOutBtn = root.querySelector("#soc-zoom-out");
  const zoomInBtn = root.querySelector("#soc-zoom-in");
  const zoomLabel = root.querySelector("#soc-zoom-label");
  const buttons = {
    undo:root.querySelector("#soc-undo"), redo:root.querySelector("#soc-redo"),
    reset:root.querySelector("#soc-reset"), random:root.querySelector("#soc-random"),
    save:root.querySelector("#soc-save"), saveSvg:root.querySelector("#soc-save-svg")
  };
  const W = 1087, H = 1536, STORAGE = "ncb-soccer-studio-v1";
  const PALETTE_COLORS = palette.map(b => b.dataset.color.toUpperCase());
  const STYLES = new Set(["solid", "gradLin", "gradRad", "pattern"]);
  const PATTERNS = ["hlines", "vlines", "diag", "dots", "waves", "zigzag", "stars", "hearts", "checker", "rings"];
  const PATTERN_SET = new Set(PATTERNS);
  const HEX = /^#[0-9a-fA-F]{6}$/;
  const selections = new Map(), undo = [], redo = [];
  let inkItems = [];
  let ids, bounds, ready = false, color = palette[0].dataset.color, colorName = palette[0].getAttribute("aria-label") || "Red";
  let style = "solid", patternKey = "dots", tool = "fill", stampKey = "star", brushSize = 7, zoom = 1;
  let highlightedId = 0, feedbackTimer, drawingStroke = null, erasingDrag = false;
  let cursorX = 550, cursorY = 950;
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);

  function report() {
    const count = selections.size;
    status.textContent = `${count} ${count === 1 ? "area" : "areas"} colored`;
    buttons.undo.disabled = !undo.length;
    buttons.redo.disabled = !redo.length;
    buttons.reset.disabled = count === 0 && inkItems.length === 0;
  }
  function remember() {
    try {
      localStorage.setItem(STORAGE, JSON.stringify({v:2, s:[...selections], i:inkItems}));
    } catch (_) { /* private mode or storage full */ }
  }
  /* Normalize one stored region style. Old (v1.2.8) format was {color, finish} with
     finish in solid/dots/rings/stripes; new format is {color, style, pattern}. */
  function normalizeStyle(raw) {
    if (!raw || typeof raw.color !== "string" || !HEX.test(raw.color)) return null;
    if (raw.style && STYLES.has(raw.style)) {
      const pattern = raw.style === "pattern" && PATTERN_SET.has(raw.pattern) ? raw.pattern : "dots";
      return {color:raw.color.toUpperCase(), style:raw.style, pattern};
    }
    if (raw.finish === "solid") return {color:raw.color.toUpperCase(), style:"solid", pattern:"dots"};
    if (["dots", "rings", "stripes"].includes(raw.finish)) {
      return {color:raw.color.toUpperCase(), style:"pattern", pattern: raw.finish === "stripes" ? "diag" : raw.finish};
    }
    return null;
  }
  function validInkItem(it) {
    if (!it || typeof it !== "object") return false;
    if (typeof it.color !== "string" || !HEX.test(it.color)) return false;
    if (!Number.isFinite(it.size) || it.size < 2 || it.size > 22) return false;
    if (it.kind === "pen") {
      return Array.isArray(it.pts) && it.pts.length > 0 && it.pts.length <= 2000 &&
        it.pts.every(p => Array.isArray(p) && p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]));
    }
    if (it.kind === "stamp") {
      return ["star", "heart", "flower", "sun"].includes(it.stamp) &&
        Number.isFinite(it.x) && Number.isFinite(it.y);
    }
    return false;
  }
  function restore() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE) || "null");
      let rows = [], inkRows = [];
      if (Array.isArray(raw)) { rows = raw; } /* v1.2.8 plain array */
      else if (raw && Array.isArray(raw.s)) { rows = raw.s; inkRows = Array.isArray(raw.i) ? raw.i : []; }
      else return;
      if (rows.length > 925) return;
      for (const row of rows) {
        if (!Array.isArray(row) || row.length !== 2) continue;
        const [id, st] = row;
        const norm = normalizeStyle(st);
        if (Number.isInteger(id) && id > 0 && id < bounds.length && bounds[id] && norm) {
          selections.set(id, norm);
          renderRegion(id, norm);
        }
      }
      inkItems = inkRows.filter(validInkItem).slice(0, 200);
      renderInk();
    } catch (_) { /* ignore corrupted local state */ }
    report();
  }
  function rgb(hex) { return [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)); }
  function mix(a, b, t) { return a.map((v, i) => Math.round(v + (b[i]-v)*t)); }
  function patternOn(k, x, y) {
    switch (k) {
      case "hlines": return (y % 18) < 6;
      case "vlines": return (x % 18) < 6;
      case "diag": return (((x + y) % 18) + 18) % 18 < 6;
      case "dots": { const dx = ((x+7)%16)-8, dy = ((y+7)%16)-8; return dx*dx + dy*dy < 14; }
      case "waves": { const wx = x + Math.round(4*Math.sin(y/7)); return (((wx % 18) + 18) % 18) < 5; }
      case "zigzag": { const tx = ((x % 16) + 16) % 16, zz = tx < 8 ? tx : 16 - tx; return (((y + zz) % 18) + 18) % 18 < 5; }
      case "stars": { const dx = (((x % 26) + 26) % 26) - 13, dy = (((y % 26) + 26) % 26) - 13; return Math.abs(dx) + Math.abs(dy) < 6; }
      case "hearts": {
        const dx = ((x % 26) + 26) % 26, dy = ((y % 26) + 26) % 26;
        const l = (dx-8)*(dx-8) + (dy-9)*(dy-9) < 17, r = (dx-18)*(dx-18) + (dy-9)*(dy-9) < 17;
        const t = dy >= 9 && dy <= 21 && Math.abs(dx-13) < (dy-8)*0.85;
        return l || r || t;
      }
      case "checker": return ((Math.floor(x/13) + Math.floor(y/13)) % 2) === 0;
      case "rings": { const dx = ((x+9)%18)-9, dy = ((y+9)%18)-9, d = dx*dx+dy*dy; return d > 19 && d < 39; }
    }
    return true;
  }
  /* Pixel color for one region pixel. Solid = full color; gradients blend light→color;
     patterns paint the color where the pattern is "on" and a light tint elsewhere. */
  function pixelColor(st, x, y, b) {
    const base = rgb(st.color);
    const light = base.map(v => Math.round(v*.24+255*.76));
    if (st.style === "gradLin") {
      const t = Math.min(1, Math.max(0, (y - b.minY) / Math.max(1, b.maxY - b.minY)));
      return mix(light, base, t);
    }
    if (st.style === "gradRad") {
      const cx = (b.minX + b.maxX)/2, cy = b.minY + (b.maxY - b.minY)*0.38;
      const maxR = Math.max(1, Math.hypot((b.maxX-b.minX)/2, (b.maxY-b.minY)/2));
      const t = Math.min(1, Math.hypot(x-cx, y-cy) / maxR);
      return mix(light, base, t);
    }
    if (st.style === "pattern") return patternOn(st.pattern, x, y) ? base : light;
    return base;
  }
  function renderRegion(id, st) {
    const b = bounds[id]; if (!b) return;
    const width = b.maxX-b.minX+1, height=b.maxY-b.minY+1;
    const pixels = ctx.getImageData(b.minX,b.minY,width,height);
    const data = pixels.data;
    for (let y=b.minY; y<=b.maxY; y++) {
      for (let x=b.minX; x<=b.maxX; x++) {
        if (ids[y*W+x] !== id) continue;
        const offset=((y-b.minY)*width+(x-b.minX))*4;
        const c = st ? pixelColor(st, x, y, b) : [255,255,255];
        data[offset]=c[0]; data[offset+1]=c[1]; data[offset+2]=c[2]; data[offset+3]=255;
      }
    }
    ctx.putImageData(pixels,b.minX,b.minY);
  }
  function setRegion(id, st) {
    if (st) selections.set(id, st); else selections.delete(id);
    renderRegion(id,st); report(); remember();
  }
  function currentStyle() { return {color, style, pattern:patternKey}; }
  function apply(id) {
    if (!ready || !id || !bounds[id]) return;
    const before = selections.get(id) || null;
    const after = tool === "eraser" ? null : currentStyle();
    if (JSON.stringify(before) === JSON.stringify(after)) return;
    undo.push({type:"one",id,before,after}); if (undo.length > 80) undo.shift();
    redo.length = 0; setRegion(id,after);
  }
  /* ---- Freehand ink (pen + stamps): drawn on the #soc-ink canvas, above the lines ---- */
  function drawStamp(g, key, x, y, size, col) {
    const s = size/9;
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = col; g.strokeStyle = "#2f3b43"; g.lineWidth = 1.6; g.lineJoin = "round";
    if (key === "star") {
      g.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 16 : 6.5, a = -Math.PI/2 + i*Math.PI/5;
        const px = Math.cos(a)*r, py = Math.sin(a)*r;
        i === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
      }
      g.closePath(); g.fill(); g.stroke();
    } else if (key === "heart") {
      g.beginPath();
      g.moveTo(0, 13);
      g.bezierCurveTo(-14, 4, -16, -4, -10, -9); g.bezierCurveTo(-5, -13, 0, -9, 0, -4);
      g.bezierCurveTo(0, -9, 5, -13, 10, -9); g.bezierCurveTo(16, -4, 14, 4, 0, 13);
      g.closePath(); g.fill(); g.stroke();
    } else if (key === "flower") {
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI/2 + i*2*Math.PI/5;
        g.beginPath(); g.arc(Math.cos(a)*8, Math.sin(a)*8, 5.5, 0, Math.PI*2); g.fill(); g.stroke();
      }
      g.beginPath(); g.arc(0, 0, 4, 0, Math.PI*2); g.fillStyle = "#fff"; g.fill(); g.stroke();
    } else if (key === "sun") {
      g.beginPath(); g.arc(0, 0, 7, 0, Math.PI*2); g.fill(); g.stroke();
      g.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = i*Math.PI/4;
        g.moveTo(Math.cos(a)*10, Math.sin(a)*10); g.lineTo(Math.cos(a)*15, Math.sin(a)*15);
      }
      g.strokeStyle = col; g.lineWidth = 2.6; g.lineCap = "round"; g.stroke();
    }
    g.restore();
  }
  function drawInkItem(g, item) {
    if (item.kind === "pen") {
      g.save(); g.strokeStyle = item.color; g.lineWidth = item.size;
      g.lineCap = "round"; g.lineJoin = "round";
      g.beginPath();
      item.pts.forEach((p, i) => { i === 0 ? g.moveTo(p[0], p[1]) : g.lineTo(p[0], p[1]); });
      g.stroke(); g.restore();
    } else if (item.kind === "stamp") {
      drawStamp(g, item.stamp, item.x, item.y, item.size, item.color);
    }
  }
  function renderInk() {
    inkCtx.clearRect(0, 0, W, H);
    for (const item of inkItems) drawInkItem(inkCtx, item);
  }
  function inkHit(x, y, radius) {
    for (let i = inkItems.length - 1; i >= 0; i--) {
      const item = inkItems[i];
      if (item.kind === "stamp") {
        if (Math.hypot(item.x - x, item.y - y) < item.size*2 + radius) return i;
      } else {
        for (const p of item.pts) if (Math.hypot(p[0]-x, p[1]-y) < item.size/2 + radius) return i;
      }
    }
    return -1;
  }
  function eraseAt(x, y) {
    const id = idAt(x, y);
    if (id && bounds[id] && selections.has(id)) { apply(id); return; }
    const hit = inkHit(x, y, 6);
    if (hit >= 0) {
      const item = inkItems[hit];
      undo.push({type:"ink-remove", item, index:hit}); if (undo.length > 80) undo.shift();
      redo.length = 0;
      inkItems.splice(hit, 1); renderInk(); report(); remember();
    }
  }
  function highlight(id, temporary=false) {
    if (!ready || (id === highlightedId && !temporary)) return;
    highlightedId=id;
    feedbackCtx.clearRect(0,0,W,H);
    const b=bounds[id]; if (!b) return;
    const w=b.maxX-b.minX+1, h=b.maxY-b.minY+1;
    const pixels=feedbackCtx.createImageData(w,h), d=pixels.data;
    for(let y=b.minY;y<=b.maxY;y++) for(let x=b.minX;x<=b.maxX;x++) {
      if(ids[y*W+x]!==id) continue;
      const k=((y-b.minY)*w+(x-b.minX))*4;
      d[k]=255;d[k+1]=200;d[k+2]=61;d[k+3]=temporary?73:48;
    }
    feedbackCtx.putImageData(pixels,b.minX,b.minY);
  }
  function pointerCoords(e) {
    const r=paint.getBoundingClientRect();
    return [(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height];
  }
  function idAt(x,y) {
    const ix=Math.max(0,Math.min(W-1,Math.floor(x))), iy=Math.max(0,Math.min(H-1,Math.floor(y)));
    return ids[iy*W+ix];
  }
  paint.addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    const [x,y]=pointerCoords(e);
    if (drawingStroke) {
      const last = drawingStroke.pts[drawingStroke.pts.length-1];
      if (Math.hypot(x-last[0], y-last[1]) < 2.5) return;
      drawingStroke.pts.push([Math.round(x), Math.round(y)]);
      drawInkItem(inkCtx, drawingStroke);
      return;
    }
    if (erasingDrag) { eraseAt(x, y); return; }
    if (tool === "fill" || tool === "eraser") highlight(idAt(x,y));
  });
  paint.addEventListener("pointerleave", () => {
    clearTimeout(feedbackTimer);highlight(0);
  });
  paint.addEventListener("pointerdown", e => {
    if (!ready) return;
    const [x,y]=pointerCoords(e);
    if (tool === "fill") { apply(idAt(x,y)); highlight(idAt(x,y),true); clearTimeout(feedbackTimer); feedbackTimer=setTimeout(()=>highlight(0),650); return; }
    if (tool === "eraser") { erasingDrag = true; eraseAt(x, y); return; }
    if (tool === "stamp") {
      const item = {kind:"stamp", stamp:stampKey, color, size:brushSize, x:Math.round(x), y:Math.round(y)};
      undo.push({type:"ink-add", item}); if (undo.length > 80) undo.shift();
      redo.length = 0;
      inkItems.push(item); renderInk(); report(); remember();
      return;
    }
    if (tool === "pen") {
      drawingStroke = {kind:"pen", color, size:brushSize, pts:[[Math.round(x), Math.round(y)]]};
      inkItems.push(drawingStroke);
      try { paint.setPointerCapture(e.pointerId); } catch (_) {}
    }
  });
  function endStroke() {
    if (drawingStroke) {
      undo.push({type:"ink-add", item:drawingStroke}); if (undo.length > 80) undo.shift();
      redo.length = 0;
      drawingStroke = null; report(); remember();
    }
    erasingDrag = false;
  }
  paint.addEventListener("pointerup", endStroke);
  paint.addEventListener("pointercancel", endStroke);
  function showCursor() { cursor.style.left=`${cursorX/W*100}%`; cursor.style.top=`${cursorY/H*100}%`; }
  paint.addEventListener("keydown", e => {
    const step=e.shiftKey?10:35;
    if (["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)) {
      e.preventDefault();
      cursorX=Math.max(0,Math.min(W-1,cursorX+(e.key==="ArrowLeft"?-step:e.key==="ArrowRight"?step:0)));
      cursorY=Math.max(0,Math.min(H-1,cursorY+(e.key==="ArrowUp"?-step:e.key==="ArrowDown"?step:0)));
      showCursor(); highlight(idAt(cursorX,cursorY));
    } else if (e.key==="Enter" || e.key===" ") {
      e.preventDefault(); apply(idAt(cursorX,cursorY));
    }
  });
  showCursor();
  function selectColor(c, name) {
    color = c.toUpperCase(); colorName = name || "Custom color";
    if (currentColorLabel) currentColorLabel.textContent = "Current: " + colorName;
    palette.forEach(p => p.setAttribute("aria-pressed", String(p.dataset.color.toUpperCase() === color)));
  }
  palette.forEach(b => b.addEventListener("click", () => selectColor(b.dataset.color, b.getAttribute("aria-label"))));
  if (customColor) customColor.addEventListener("input", () => selectColor(customColor.value, "Custom color"));
  function selectStyle(s) {
    style = s;
    styleBtns.forEach(p => p.setAttribute("aria-pressed", String(p.dataset.style === s)));
    if (patternGrid) patternGrid.hidden = s !== "pattern";
  }
  styleBtns.forEach(b => b.addEventListener("click", () => selectStyle(b.dataset.style)));
  patternBtns.forEach(b => b.addEventListener("click", () => {
    patternKey = b.dataset.pattern;
    patternBtns.forEach(p => p.setAttribute("aria-pressed", String(p === b)));
  }));
  function setTool(t) {
    tool = t;
    toolBtns.forEach(p => p.setAttribute("aria-pressed", String(p.dataset.tool === t)));
    if (stampRow) stampRow.hidden = t !== "stamp";
    if (sizeRow) sizeRow.hidden = !(t === "pen" || t === "stamp");
  }
  toolBtns.forEach(b => b.addEventListener("click", () => setTool(b.dataset.tool)));
  stampBtns.forEach(b => b.addEventListener("click", () => {
    stampKey = b.dataset.stamp;
    stampBtns.forEach(p => p.setAttribute("aria-pressed", String(p === b)));
  }));
  if (sizeRange) sizeRange.addEventListener("input", () => {
    brushSize = +sizeRange.value;
    if (sizeVal) sizeVal.textContent = String(brushSize);
  });
  function applyZoom() {
    art.style.width = zoom > 1 ? (zoom*100) + "%" : "";
    art.style.maxWidth = zoom > 1 ? "none" : "";
    if (artPanel) artPanel.style.overflow = zoom > 1 ? "auto" : "";
    if (zoomLabel) zoomLabel.textContent = Math.round(zoom*100) + "%";
  }
  if (zoomInBtn) zoomInBtn.addEventListener("click", () => { zoom = Math.min(2.5, +(zoom + 0.25).toFixed(2)); applyZoom(); });
  if (zoomOutBtn) zoomOutBtn.addEventListener("click", () => { zoom = Math.max(1, +(zoom - 0.25).toFixed(2)); applyZoom(); });
  function replay(action, backwards) {
    if (action.type === "one") setRegion(action.id, backwards ? action.before : action.after);
    else if (action.type === "bulk") {
      const rows = backwards ? action.before : action.after;
      const current = new Map(selections);
      for (const [id] of current) if (!rows.some(r => r[0] === id)) setRegion(id, null);
      for (const [id, st] of rows) setRegion(id, st);
      inkItems = (backwards ? action.inkBefore : action.inkAfter).slice();
      renderInk(); report(); remember();
    }
    else if (action.type === "ink-add") {
      if (backwards) { const i = inkItems.indexOf(action.item); if (i >= 0) inkItems.splice(i, 1); }
      else inkItems.push(action.item);
      renderInk(); report(); remember();
    }
    else if (action.type === "ink-remove") {
      if (backwards) inkItems.splice(Math.min(action.index, inkItems.length), 0, action.item);
      else { const i = inkItems.indexOf(action.item); if (i >= 0) inkItems.splice(i, 1); }
      renderInk(); report(); remember();
    }
  }
  buttons.undo.addEventListener("click", () => {
    const action=undo.pop(); if (!action) return;
    replay(action,true); redo.push(action); report();
  });
  buttons.redo.addEventListener("click", () => {
    const action=redo.pop(); if (!action) return;
    replay(action,false); undo.push(action); report();
  });
  buttons.reset.addEventListener("click", () => {
    if (!selections.size && !inkItems.length) return;
    undo.push({type:"bulk", before:[...selections], after:[], inkBefore:inkItems.slice(), inkAfter:[]});
    if (undo.length > 80) undo.shift();
    redo.length=0;
    for (const [id] of selections) renderRegion(id,null);
    selections.clear(); inkItems = []; renderInk(); report(); remember();
  });
  buttons.random.addEventListener("click", () => {
    if (!ready || !bounds.length) return;
    const before = [...selections];
    const after = [];
    const regionIds = [];
    for (let id = 1; id < bounds.length; id++) if (bounds[id]) regionIds.push(id);
    for (const id of regionIds) {
      const c = PALETTE_COLORS[Math.floor(Math.random()*PALETTE_COLORS.length)];
      const roll = Math.random();
      let st;
      if (roll < 0.62) st = {color:c, style:"solid", pattern:"dots"};
      else if (roll < 0.85) st = {color:c, style:"pattern", pattern:PATTERNS[Math.floor(Math.random()*PATTERNS.length)]};
      else st = {color:c, style:Math.random() < 0.5 ? "gradLin" : "gradRad", pattern:"dots"};
      after.push([id, st]);
      selections.set(id, st); renderRegion(id, st);
    }
    undo.push({type:"bulk", before, after, inkBefore:inkItems.slice(), inkAfter:inkItems.slice()});
    if (undo.length > 80) undo.shift();
    redo.length = 0; report(); remember();
  });
  /* Compose the finished artwork: paint + freehand ink + line art, then the footer strip. */
  function compose() {
    const out=document.createElement("canvas"); out.width=W; out.height=H+92;
    const o=out.getContext("2d");
    o.fillStyle="#fff"; o.fillRect(0,0,out.width,out.height);
    o.drawImage(paint,0,0);
    o.drawImage(ink,0,0);
    o.globalCompositeOperation="multiply"; o.drawImage(lines,0,0,W,H);
    o.globalCompositeOperation="source-over";
    o.fillStyle="#fff9f0"; o.fillRect(0,H,W,92);
    o.fillStyle="#1f2a44"; o.fillRect(0,H,W,3);
    o.textBaseline="middle";
    o.font="bold 28px Arial, sans-serif";
    o.fillText("nilecoloringbooks.com",32,H+32);
    o.font="18px Arial, sans-serif";
    o.fillText("sherif.in.26@gmail.com",32,H+64);
    o.fillStyle="#ff7a3d"; o.beginPath(); o.arc(W-48,H+45,17,0,Math.PI*2); o.fill();
    return out;
  }
  function downloadBlob(blob, name) {
    const url=URL.createObjectURL(blob), link=document.createElement("a");
    link.href=url; link.download=name;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url),60000);
  }
  buttons.save.addEventListener("click", () => {
    if (!ready) return;
    buttons.save.disabled=true;
    try {
      compose().toBlob(blob => {
        buttons.save.disabled=false;
        if (!blob) { status.textContent="Save failed — please try again"; return; }
        downloadBlob(blob, "my-soccer-coloring-nilecoloringbooks.png");
      },"image/png");
    } catch (_) { buttons.save.disabled=false; status.textContent="Save failed — please try again"; }
  });
  /* SVG export: the studio is canvas-based (regions live in a pixel map, not vectors), so the
     SVG wraps the same finished raster artwork — it opens everywhere an SVG opens. */
  buttons.saveSvg.addEventListener("click", () => {
    if (!ready) return;
    buttons.saveSvg.disabled=true;
    try {
      compose().toBlob(blob => {
        buttons.saveSvg.disabled=false;
        if (!blob) { status.textContent="Save failed — please try again"; return; }
        const reader = new FileReader();
        reader.onload = () => {
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H+92}" viewBox="0 0 ${W} ${H+92}"><image href="${reader.result}" width="${W}" height="${H+92}"/></svg>`;
          downloadBlob(new Blob([svg], {type:"image/svg+xml;charset=utf-8"}), "my-soccer-coloring-nilecoloringbooks.svg");
        };
        reader.readAsDataURL(blob);
      },"image/png");
    } catch (_) { buttons.saveSvg.disabled=false; status.textContent="Save failed — please try again"; }
  });

  async function initialize() {
    if (ready) return;
    const mapImage=new Image(); mapImage.src="assets/studio/soccer-region-map.png";
    try {
      await Promise.all([lines.decode(),mapImage.decode()]);
      /* The region map defines the 120 regions and must match the canvas exactly.
         The line-art image may be a smaller (resized) file — it is drawn scaled to
         the canvas, so only the map dimensions are checked. */
      if (mapImage.naturalWidth!==W || mapImage.naturalHeight!==H) throw Error("asset dimensions");
      const off=document.createElement("canvas");off.width=W;off.height=H;
      const m=off.getContext("2d",{willReadFrequently:true});m.drawImage(mapImage,0,0);
      const raw=m.getImageData(0,0,W,H).data;
      ids=new Uint16Array(W*H); bounds=[];
      for (let y=0;y<H;y++) for (let x=0;x<W;x++) {
        const i=y*W+x,k=i*4,id=raw[k]+raw[k+1]*256;
        ids[i]=id; if (!id) continue;
        const b=bounds[id];
        if (!b) bounds[id]={minX:x,minY:y,maxX:x,maxY:y};
        else { if (x<b.minX)b.minX=x; if(y<b.minY)b.minY=y; if(x>b.maxX)b.maxX=x; if(y>b.maxY)b.maxY=y; }
      }
      ready=true; loading.hidden=true; restore();
    } catch (_) {
      loading.textContent="The coloring page could not load. Please refresh and try again.";
      status.textContent="Page unavailable";
    }
  }
  if ("IntersectionObserver" in window) {
    const observer=new IntersectionObserver(entries => {
      if (entries.some(e=>e.isIntersecting)) { observer.disconnect(); initialize(); }
    },{rootMargin:"400px"}); observer.observe(root);
  } else initialize();
})();
