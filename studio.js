/* Nile Coloring Books studio v2. Pure browser canvas; no libraries or network calls. */
(() => {
  "use strict";
  const root = document.querySelector("#ncb-studio");
  if (!root) return;
  const paint = root.querySelector("#ncb-paint");
  const ctx = paint.getContext("2d", {willReadFrequently:true});
  const lines = root.querySelector("#ncb-lines");
  const feedback = root.querySelector("#ncb-feedback");
  const feedbackCtx = feedback.getContext("2d");
  const loading = root.querySelector("#ncb-loading");
  const status = root.querySelector("#ncb-count");
  const cursor = root.querySelector("#ncb-cursor");
  const palette = [...root.querySelectorAll("#ncb-palette button")];
  const finishes = [...root.querySelectorAll("#ncb-modes button")];
  const buttons = {
    erase:root.querySelector("#ncb-erase"), undo:root.querySelector("#ncb-undo"),
    redo:root.querySelector("#ncb-redo"), reset:root.querySelector("#ncb-reset"),
    save:root.querySelector("#ncb-save")
  };
  const W = 1087, H = 1536, STORAGE = "ncb-beach-studio-v2";
  const validColors = new Set(palette.map(b => b.dataset.color));
  const validModes = new Set(["solid", "dots", "rings", "stripes"]);
  const selections = new Map(), undo = [], redo = [];
  let ids, bounds, ready = false, color = palette[0].dataset.color;
  let finish = "solid", erasing = false, cursorX = 550, cursorY = 950;
  let highlightedId = 0, feedbackTimer;
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);

  function report() {
    const count = selections.size;
    status.textContent = `${count} ${count === 1 ? "area" : "areas"} colored`;
    buttons.undo.disabled = !undo.length;
    buttons.redo.disabled = !redo.length;
    buttons.reset.disabled = count === 0;
  }
  function remember() {
    try { localStorage.setItem(STORAGE, JSON.stringify([...selections])); } catch (_) { /* private mode or storage full */ }
  }
  function restore() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE) || "[]");
      if (!Array.isArray(data) || data.length > 925) return;
      for (const row of data) {
        if (!Array.isArray(row) || row.length !== 2) continue;
        const [id, style] = row;
        if (Number.isInteger(id) && id > 0 && id < bounds.length && bounds[id] &&
            style && validColors.has(style.color) && validModes.has(style.finish)) {
          selections.set(id, {color:style.color, finish:style.finish});
          renderRegion(id, selections.get(id));
        }
      }
    } catch (_) { /* ignore corrupted local state */ }
    report();
  }
  function rgb(hex) { return [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)); }
  function useBase(finish, x, y) {
    if (finish === "solid") return true;
    if (finish === "dots") {
      const dx = ((x+7)%16)-8, dy = ((y+7)%16)-8;
      return dx*dx + dy*dy < 14;
    }
    if (finish === "rings") {
      const dx = ((x+9)%18)-9, dy = ((y+9)%18)-9, d = dx*dx+dy*dy;
      return d > 19 && d < 39;
    }
    return ((x+y*2)%18)<5;
  }
  function renderRegion(id, style) {
    const b = bounds[id]; if (!b) return;
    const width = b.maxX-b.minX+1, height=b.maxY-b.minY+1;
    const pixels = ctx.getImageData(b.minX,b.minY,width,height);
    const data = pixels.data;
    const base = style ? rgb(style.color) : [255,255,255];
    const light = style ? base.map(v => Math.round(v*.24+255*.76)) : base;
    for (let y=b.minY; y<=b.maxY; y++) {
      for (let x=b.minX; x<=b.maxX; x++) {
        if (ids[y*W+x] !== id) continue;
        const offset=((y-b.minY)*width+(x-b.minX))*4;
        const c = style && !useBase(style.finish,x,y) ? light : base;
        data[offset]=c[0]; data[offset+1]=c[1]; data[offset+2]=c[2]; data[offset+3]=255;
      }
    }
    ctx.putImageData(pixels,b.minX,b.minY);
  }
  function setRegion(id, style) {
    if (style) selections.set(id, style); else selections.delete(id);
    renderRegion(id,style); report(); remember();
  }
  function apply(id) {
    if (!ready || !id || !bounds[id]) return;
    const before = selections.get(id) || null;
    const after = erasing ? null : {color,finish};
    if (JSON.stringify(before) === JSON.stringify(after)) return;
    undo.push({type:"one",id,before,after}); if (undo.length > 80) undo.shift();
    redo.length = 0; setRegion(id,after);
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
    const [x,y]=pointerCoords(e);highlight(idAt(x,y));
  });
  paint.addEventListener("pointerleave", () => {
    clearTimeout(feedbackTimer);highlight(0);
  });
  paint.addEventListener("click", e => {
    const [x,y]=pointerCoords(e), id=idAt(x,y);
    apply(id);highlight(id,true);
    clearTimeout(feedbackTimer);
    feedbackTimer=setTimeout(()=>highlight(0),650);
  });
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
  palette.forEach(b => b.addEventListener("click", () => {
    color=b.dataset.color; erasing=false;
    buttons.erase.setAttribute("aria-pressed","false");
    palette.forEach(p => p.setAttribute("aria-pressed",String(p===b)));
  }));
  finishes.forEach(b => b.addEventListener("click", () => {
    finish=b.dataset.mode;
    finishes.forEach(p => p.setAttribute("aria-pressed",String(p===b)));
  }));
  buttons.erase.addEventListener("click", () => {
    erasing=!erasing;
    buttons.erase.setAttribute("aria-pressed",String(erasing));
    palette.forEach(p => p.setAttribute("aria-pressed",String(!erasing && p.dataset.color===color)));
  });
  function replay(action, backwards) {
    if (action.type === "one") setRegion(action.id,backwards?action.before:action.after);
    else for (const [id,style] of action.entries) setRegion(id,backwards?style:null);
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
    if (!selections.size) return;
    const entries=[...selections]; undo.push({type:"reset",entries}); redo.length=0;
    for (const [id] of entries) renderRegion(id,null);
    selections.clear(); report(); remember();
  });
  buttons.save.addEventListener("click", () => {
    if (!ready) return;
    buttons.save.disabled=true;
    try {
      const out=document.createElement("canvas"); out.width=W; out.height=H+92;
      const o=out.getContext("2d");
      o.fillStyle="#fff"; o.fillRect(0,0,out.width,out.height);
      o.drawImage(paint,0,0);
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
      out.toBlob(blob => {
        buttons.save.disabled=false;
        if (!blob) { status.textContent="Save failed — please try again"; return; }
        const url=URL.createObjectURL(blob), link=document.createElement("a");
        link.href=url; link.download="my-beach-coloring-nilecoloringbooks.png";
        document.body.append(link); link.click(); link.remove();
        setTimeout(() => URL.revokeObjectURL(url),60000);
      },"image/png");
    } catch (_) { buttons.save.disabled=false; status.textContent="Save failed — please try again"; }
  });

  async function initialize() {
    if (ready) return;
    const mapImage=new Image(); mapImage.src="assets/studio/region-map.png";
    try {
      await Promise.all([lines.decode(),mapImage.decode()]);
      if (lines.naturalWidth!==W || lines.naturalHeight!==H || mapImage.naturalWidth!==W || mapImage.naturalHeight!==H) throw Error("asset dimensions");
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
