(function(){
"use strict";
var html = document.documentElement;
var PAGE = html.getAttribute("data-page") || "";
var MODE = window.__rkMotion || "full";
function FULL(){ return MODE === "full"; }
var fine = window.matchMedia("(pointer: fine)").matches;
var NS = "http://www.w3.org/2000/svg";
function $(s, el){ return (el || document).querySelector(s); }
function $$(s, el){ return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
var dpr = Math.min(window.devicePixelRatio || 1, 2);
var machine = $("#machine"), hero = $(".hero"), THREAD = null;
function hx(h){ return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
function rampOf(stops, n){
  var out = [], seg = stops.length - 1;
  for (var i = 0; i < n; i++){
    var t = i / (n - 1) * seg, k = Math.min(seg - 1, Math.floor(t)), f = t - k, a = hx(stops[k]), b = hx(stops[k + 1]);
    out.push("rgb(" + Math.round(a[0] + (b[0] - a[0]) * f) + "," + Math.round(a[1] + (b[1] - a[1]) * f) + "," + Math.round(a[2] + (b[2] - a[2]) * f) + ")");
  }
  return out;
}
var RIB = ["#4ED2EC", "#58BEE3", "#4197CE", "#4376B2", "#5E5AA2", "#73429B", "#9146A4", "#A643A9"];
var LUT = rampOf(RIB.concat(RIB.slice(0, -1).reverse()), 64);
var DOTC = rampOf(["#18181B", "#18181B"], 100);
var RIBLITE = ["#4ED2EC", "#7FC3F0", "#9D86E8", "#D58BDA"];
var tasks = new Set(), raf = 0;
function loop(t){ raf = 0; tasks.forEach(function(fn){ fn(t); }); if (tasks.size) raf = requestAnimationFrame(loop); }
function addTask(fn){ tasks.add(fn); if (!raf) raf = requestAnimationFrame(loop); }
function removeTask(fn){ tasks.delete(fn); }
function rng(seed){ return function(){ seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
var seedN = 7;
function circlePath(w, h, seed){
  var r = rng(seed), cx = w / 2, cy = h / 2, rx = w / 2 + 9, ry = h / 2 + 7;
  var start = -2.2 + r() * 0.5, turns = Math.PI * 2 * 1.1, steps = 56, d = "";
  for (var i = 0; i <= steps; i++){
    var k = i / steps, t = start + turns * k;
    var wob = 1 + 0.03 * Math.sin(t * 3 + r() * 0.3) + k * 0.06;
    var x = cx + Math.cos(t) * rx * wob, y = cy + Math.sin(t) * ry * (wob + k * 0.04) - k * 3;
    d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1) + " ";
  }
  return d;
}
function drawCircle(el, animate, delay){
  if (el._ring) el._ring.remove();
  var w = el.offsetWidth, h = el.offsetHeight, pad = 18;
  if (!w || !h) return;
  var svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "ring");
  svg.setAttribute("viewBox", (-pad) + " " + (-pad) + " " + (w + pad * 2) + " " + (h + pad * 2));
  svg.setAttribute("aria-hidden", "true");
  svg.style.left = (-pad) + "px"; svg.style.top = (-pad) + "px";
  svg.style.width = (w + pad * 2) + "px"; svg.style.height = (h + pad * 2) + "px";
  var p = document.createElementNS(NS, "path");
  if (!el._seed) el._seed = (seedN = seedN * 31 % 9973 + 11);
  p.setAttribute("d", circlePath(w, h, el._seed));
  p.setAttribute("pathLength", "1");
  svg.appendChild(p); el.appendChild(svg); el._ring = svg;
  if (animate){
    p.style.strokeDashoffset = "1";
    p.getBoundingClientRect();
    p.style.transition = "stroke-dashoffset " + (FULL() ? ".8s" : "1.1s") + " cubic-bezier(.6,.05,.3,1) " + (delay || 0) + "ms";
    p.style.strokeDashoffset = "0";
  }
}
var circleIO = new IntersectionObserver(function(entries){
  entries.forEach(function(e){
    if (e.isIntersecting){ circleIO.unobserve(e.target); drawCircle(e.target, true, +(e.target.dataset.delay || 0)); }
  });
}, { threshold: 0.6 });
function armCircles(root){ $$("[data-circle]", root).forEach(function(el){ if (!el._ring) circleIO.observe(el); }); }
function splitWords(el){
  if (el._split) return true;
  if (el.children.length) return false;
  var words = el.textContent.trim().split(/\s+/);
  el.textContent = "";
  words.forEach(function(w, i){
    var s = document.createElement("span"); s.className = "w"; s.style.setProperty("--d", i); s.textContent = w;
    el.appendChild(s); el.appendChild(document.createTextNode(" "));
  });
  el._split = true; return true;
}
$$(".kin-line").forEach(splitWords);
var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+=/<>0123456789";
function scramble(el, delay){
  var fin = el.textContent, t0 = performance.now() + delay, dur = 380 + fin.length * 55;
  function step(now){
    if (now < t0){ requestAnimationFrame(step); return; }
    var k = clamp((now - t0) / dur, 0, 1), n = Math.floor(k * fin.length), s = fin.slice(0, n);
    for (var i = n; i < fin.length; i++) s += GLYPHS[(Math.random() * GLYPHS.length) | 0];
    el.textContent = k < 1 ? s : fin;
    if (k < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
function startHero(){ if (FULL()) $$(".kin-line .w").forEach(function(w, i){ scramble(w, 120 + i * 85); }); }
function gauss(){ return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5; }
var field = (function(){
  var c = $("#field"); if (!c || !hero) return null;
  var ctx = c.getContext("2d"), P = [], W = 0, H = 0, cx = 0, cy = 0, rx = 0, ry = 0, rot = -0.2, mx = -9999, my = -9999, t = 0, fade = 1, narrow = false;
  function geo(){
    var hr = hero.getBoundingClientRect(); W = hr.width; H = hr.height;
    c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var m = machine.getBoundingClientRect(); narrow = W <= 980;
    if (!narrow){ cx = m.left - hr.left + m.width / 2; cy = m.top - hr.top + m.height / 2; rx = Math.max(m.width * 0.8, 300); ry = rx * 0.68; }
    else { cx = W * 0.74; cy = Math.min(H * 0.2, 240); rx = W * 0.6; ry = rx * 0.62; }
    fade = narrow ? 0.5 : 1;
  }
  function build(){
    var full = FULL(), n = full ? (narrow ? 1400 : 3200) : (narrow ? 380 : 800); P = [];
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < n; i++){
      var red = Math.random() < 0.12, inner = Math.random() < 0.3;
      P.push({ th: Math.random() * 6.283, off: gauss() * (inner ? 18 : 42), w: (full ? 0.0012 + Math.random() * 0.003 : 0.0005 + Math.random() * 0.0012) * (inner ? -1.3 : 1),
        ring: inner ? 0.68 : 1, s: full ? Math.random() * 1.9 + 0.7 : Math.random() * 1.4 + 0.5,
        a: red ? 0.55 + Math.random() * 0.45 : (full ? 0.25 + Math.random() * 0.45 : 0.14 + Math.random() * 0.4), c: red ? null : (Math.random() < 0.5 ? "#EDEDEF" : "#A1A1AA"),
        x: cx + (Math.random() - 0.5) * W * 1.8, y: cy + (Math.random() - 0.5) * H * 1.8, vx: 0, vy: 0, snap: !full });
    }
  }
  function tick(){
    t += 0.016;
    var full = FULL();
    if (full){ ctx.globalCompositeOperation = "destination-out"; ctx.fillStyle = "rgba(0,0,0,0.26)"; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = "lighter"; }
    else ctx.clearRect(0, 0, W, H);
    var hr = hero.getBoundingClientRect(), sp = full ? clamp(-hr.top / (hr.height * 0.85), 0, 1) : 0, grow = 1 + sp * sp * 1.6, dim = 1 - sp * 0.65;
    var cr = Math.cos(rot + t * (full ? 0.02 : 0)), sr = Math.sin(rot + t * (full ? 0.02 : 0)), speed = full ? 1 : 0.45, k = full ? 0.02 : 0.05;
    for (var i = 0; i < P.length; i++){
      var p = P[i]; p.th += p.w * speed;
      var br = Math.sin(t * 0.9 + p.th * 3) * (full ? 1 : 0.4);
      var R1 = (rx * p.ring + p.off + br * 12) * grow, R2 = (ry * p.ring + p.off * 0.7 + br * 8) * grow;
      var ex = Math.cos(p.th) * R1, ey = Math.sin(p.th) * R2;
      var hx = cx + ex * cr - ey * sr, hy = cy + ex * sr + ey * cr;
      if (p.snap){ p.x = hx; p.y = hy; p.snap = false; }
      var ax = (hx - p.x) * k, ay = (hy - p.y) * k;
      if (full && mx > -9000){
        var dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
        if (d2 < 32400){ var d = Math.sqrt(d2) || 1, f = 1 - d / 180; ax += (dx / d) * f * 2.2 - (dy / d) * f * 3.4; ay += (dy / d) * f * 2.2 + (dx / d) * f * 3.4; }
      }
      p.vx = (p.vx + ax) * 0.88; p.vy = (p.vy + ay) * 0.88; p.x += p.vx; p.y += p.vy;
      ctx.globalAlpha = p.a * fade * dim; ctx.fillStyle = p.c || LUT[((((p.th % 6.2832) + 6.2832) % 6.2832) / 6.2832 * 63.99) | 0]; ctx.fillRect(p.x, p.y, p.s, p.s);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
  }
  hero.addEventListener("pointermove", function(e){ var r = hero.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }, { passive: true });
  hero.addEventListener("pointerleave", function(){ mx = my = -9999; });
  hero.addEventListener("pointerdown", function(e){
    if (!FULL() || e.target.closest("a,button,.machine")) return;
    var r = hero.getBoundingClientRect(), bx = e.clientX - r.left, by = e.clientY - r.top;
    P.forEach(function(p){ var dx = p.x - bx, dy = p.y - by, d = Math.sqrt(dx * dx + dy * dy) || 1, f = 9 + Math.random() * 14; p.vx += dx / d * f; p.vy += dy / d * f; });
  });
  geo(); build();
  var rt = 0; window.addEventListener("resize", function(){ clearTimeout(rt); rt = setTimeout(geo, 120); });
  new IntersectionObserver(function(es){ if (es[0].isIntersecting) addTask(tick); else removeTask(tick); }).observe(c);
  return { rebuild: function(){ geo(); build(); }, geo: geo };
})();
var TOOLS = [
  { names: ["Northgate Payroll Search", "Calder & Rowe", "Meridian Finance Talent"], you: "dissolve", srcs: ["2 directories", "1 “best of” list", "Competitor site"] },
  { names: ["Meridian Finance Talent", "Northgate Payroll Search", "Harbor Vale Executive"], you: "dissolve", srcs: ["No sources shown"] },
  { names: ["Calder & Rowe", "Northgate Payroll Search", "Meridian Finance Talent"], you: "hedge", srcs: ["Industry article", "Competitor pricing page"] },
  { names: ["Northgate Payroll Search", "Calder & Rowe", "Meridian Finance Talent"], you: "cited", srcs: ["yourfirm.com", "Directory", "Podcast transcript"] },
  { names: ["Northgate Payroll Search", "Meridian Finance Talent", "Calder & Rowe"], you: "dissolve", srcs: ["\u201cBest of\u201d list", "Directory", "Forum thread"] }
];
var ans = $("#ans"), srcs = $("#srcs"), tabs = $$(".tab"), fxC = $("#fx"), fx = fxC ? fxC.getContext("2d") : null;
var parts = [], cur = 0, timer = 0, playing = false, onScreen = false, named = {}, booted = false, rid = 0;
function sizeFx(){ var r = machine.getBoundingClientRect(); fxC.width = r.width * dpr; fxC.height = r.height * dpr; fx.setTransform(dpr, 0, 0, dpr, 0, 0); }
function fxTick(){
  var r = machine.getBoundingClientRect(); fx.clearRect(0, 0, r.width, r.height);
  for (var i = 0; i < parts.length; i++){
    var p = parts[i];
    if (p.mode === "out"){
      if (p.delay > 0){ p.delay--; fx.globalAlpha = 1; fx.fillStyle = p.c; fx.fillRect(p.x, p.y, 1.6, 1.6); continue; }
      p.vx += (Math.random() - 0.45) * 0.09; p.vy -= 0.012 + Math.random() * 0.01; p.x += p.vx; p.y += p.vy; p.life -= 0.011;
    } else {
      p.t = Math.min(1, p.t + 0.018 + p.s); var e = 1 - Math.pow(1 - p.t, 3);
      p.x = p.sx + (p.tx - p.sx) * e; p.y = p.sy + (p.ty - p.sy) * e; p.life = Math.min(1, p.t * 1.4);
      if (p.t >= 1 && p.done){ var d = p.done; p.done = null; d(); }
    }
    if (p.life > 0 && !p.finished){ fx.globalAlpha = Math.max(0, p.life); fx.fillStyle = p.c; fx.fillRect(p.x, p.y, 1.6, 1.6); }
  }
  fx.globalAlpha = 1;
  parts = parts.filter(function(p){ return p.life > 0 && !p.finished; });
  if (!parts.length){ fx.clearRect(0, 0, r.width, r.height); removeTask(fxTick); }
}
function sample(el){
  var mr = machine.getBoundingClientRect(), r = el.getBoundingClientRect(), cs = getComputedStyle(el);
  var w = Math.ceil(r.width), h = Math.ceil(r.height), off = document.createElement("canvas");
  if (!w || !h) return [];
  off.width = w * 2; off.height = h * 2; var o = off.getContext("2d");
  o.scale(2, 2); o.font = cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily; o.textBaseline = "middle"; o.fillStyle = "#fff";
  o.fillText(el.textContent, 0, h / 2 + 1);
  var data = o.getImageData(0, 0, off.width, off.height).data, pts = [], step = 3;
  for (var y = 0; y < off.height; y += step) for (var x = 0; x < off.width; x += step){
    if (data[(y * off.width + x) * 4 + 3] > 120) pts.push({ x: r.left - mr.left + x / 2, y: r.top - mr.top + y / 2, fx: x / off.width });
  }
  return pts;
}
function dissolve(el, done){ el.classList.add("strike"); setTimeout(function(){ if (done) done(); }, 620); }
function assemble(el, done){ el.style.visibility = "visible"; el.classList.add("arrive"); setTimeout(function(){ if (done) done(); }, 640); }
function esc(s){ return s.replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
function updateTally(){ var n = Object.keys(named).length, el = $("#tally-n"); el.textContent = n + " of " + TOOLS.length; el.className = n ? "hit" : ""; }
function render(i, animate){
  var T = TOOLS[i], my = ++rid;
  function later(fn, ms){ setTimeout(function(){ if (my === rid) fn(); }, ms); }
  tabs.forEach(function(t, k){ t.setAttribute("aria-selected", k === i ? "true" : "false"); });
  var tb = tabs[i], tc = tb.parentNode; if (tc.scrollWidth > tc.clientWidth) tc.scrollLeft = tb.offsetLeft - (tc.clientWidth - tb.offsetWidth) / 2;
  var pre = animate ? " pre" : "";
  var h = '<p class="intro ln' + pre + '">For that search, I\'d shortlist:</p><ol>';
  T.names.forEach(function(n, k){ h += '<li class="ln' + pre + '"><span class="rank">' + (k + 1) + '</span><span class="name">' + esc(n) + '</span></li>'; });
  h += '<li class="ln you' + pre + '"><span class="rank">' + (T.you === "cited" ? "4" : "—") + '</span><span class="name">Your firm</span><span class="tag"></span></li></ol>';
  ans.innerHTML = h;
  srcs.innerHTML = T.srcs.map(function(s){ return '<span class="chip' + (s === "yourfirm.com" ? " own" : "") + '">' + esc(s) + "</span>"; }).join("");
  var lines = $$(".ln", ans), youName = $(".you .name", ans), tag = $(".you .tag", ans);
  if (T.you === "cited") youName.style.visibility = "hidden";
  var gap = FULL() ? 260 : 200;
  if (animate) lines.forEach(function(l, k){ later(function(){ l.classList.remove("pre"); }, 120 + k * gap); });
  var namesIn = animate ? 120 + lines.length * gap : 0;
  var names = $$(".name", ans).slice(0, 2);
  later(function(){ names.forEach(function(n, k){ drawCircle(n, true, k * 260); }); }, namesIn + 100);
  later(function(){
    if (T.you === "dissolve"){ dissolve(youName, function(){ if (my !== rid) return; youName.style.visibility = "visible"; youName.classList.add("gone"); tag.textContent = "not mentioned"; tag.className = "tag bad"; }); }
    else if (T.you === "hedge"){ tag.textContent = "hedged"; tag.className = "tag ok"; var hd = document.createElement("span"); hd.className = "hedge"; hd.textContent = "“I couldn't verify their current terms or pricing, so ask them directly.”"; $(".you", ans).appendChild(hd); }
    else { assemble(youName, function(){ if (my !== rid) return; drawCircle(youName, true, 0); tag.textContent = "named · your site cited"; tag.className = "tag ok"; }); }
    if (T.you === "cited") named[i] = 1;
    updateTally();
  }, namesIn + 900);
}
function schedule(){ clearTimeout(timer); if (!playing) return; timer = setTimeout(function(){ cur = (cur + 1) % TOOLS.length; render(cur, true); schedule(); }, FULL() ? 7200 : 9000); }
tabs.forEach(function(t){ t.addEventListener("click", function(){ cur = +t.dataset.tool; render(cur, true); clearTimeout(timer); timer = setTimeout(schedule, 9000); }); });
function watchMachine(){
  new IntersectionObserver(function(es){ onScreen = es[0].isIntersecting; playing = onScreen && !document.hidden; if (playing) schedule(); else clearTimeout(timer); }, { threshold: 0.35 }).observe(machine);
  document.addEventListener("visibilitychange", function(){ playing = onScreen && !document.hidden; if (playing) schedule(); else clearTimeout(timer); });
}
function boot(){
  if (booted) return; booted = true; if (!machine || !fxC) return; sizeFx(); window.addEventListener("resize", sizeFx);
  if (FULL()){
    var qb = $(".q b"), full = qb.textContent, k = 0;
    qb.textContent = "";
    (function typeNext(){ k += 2; qb.textContent = full.slice(0, k); if (k < full.length) setTimeout(typeNext, 26); else { render(0, true); watchMachine(); } })();
  } else { render(0, true); watchMachine(); }
}
var boards = [], listMode = window.matchMedia("(max-width: 900px)");
function pinPos(doc, sr){ var p = $(".pin", doc).getBoundingClientRect(); return { x: p.left + p.width / 2 - sr.left, y: p.top + p.height / 2 - sr.top }; }
function setupBoard(stage){
  var svg = $(".strings", stage), center = $(".answer-doc", stage), docs = $$(".doc", stage).filter(function(d){ return d !== center; });
  var B = { stage: stage, svg: svg, center: center, docs: docs, lines: [], prog: 0, t: 0, w: 0, h: 0 };
  docs.forEach(function(d, i){
    var g = document.createElementNS(NS, "g"), sh = document.createElementNS(NS, "path"), st = document.createElementNS(NS, "path");
    var faint = d.hasAttribute("data-faint");
    sh.setAttribute("class", "sh"); st.setAttribute("class", "st" + (faint ? " faint" : ""));
    sh.setAttribute("pathLength", "1"); if (!faint) st.setAttribute("pathLength", "1"); else sh.style.display = "none";
    g.appendChild(sh); g.appendChild(st); svg.appendChild(g);
    B.lines.push({ doc: d, sh: sh, st: st, i: i, faint: faint });
    d._depth = 0.4 + Math.random() * 0.6;
    d.addEventListener("pointerenter", function(){ st.classList.add("hot"); });
    d.addEventListener("pointerleave", function(){ st.classList.remove("hot"); });
    d.addEventListener("focus", function(){ st.classList.add("hot"); });
    d.addEventListener("blur", function(){ st.classList.remove("hot"); });
  });
  center._depth = 0.25;
  stage.addEventListener("pointermove", function(e){
    if (!FULL() || !fine || listMode.matches) return;
    var r = stage.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
    $$(".doc", stage).forEach(function(d){ d.style.translate = (nx * d._depth * 22).toFixed(1) + "px " + (ny * d._depth * 16).toFixed(1) + "px"; });
  });
  stage.addEventListener("pointerleave", function(){ $$(".doc", stage).forEach(function(d){ d.style.translate = ""; }); });
  boards.push(B);
  var tick = function(){ drawBoard(B); };
  new IntersectionObserver(function(es){ if (es[0].isIntersecting) addTask(tick); else removeTask(tick); }).observe(stage);
}
function drawBoard(B){
  if (listMode.matches || !B.lines.length) return;
  var sr = B.stage.getBoundingClientRect(), vh = window.innerHeight;
  if (!sr.width) return;
  if (sr.width !== B.w || sr.height !== B.h){ B.w = sr.width; B.h = sr.height; B.svg.setAttribute("viewBox", "0 0 " + sr.width + " " + sr.height); }
  var c = pinPos(B.center, sr);
  B.t += 0.016;
  var tp = (THREAD && B.stage === THREAD.stage) ? THREAD.boardProg() : null;
  var target = tp != null ? tp : clamp((vh * 0.95 - sr.top) / (sr.height * 0.85), 0, 1);
  B.prog += (target - B.prog) * (FULL() ? 0.1 : 0.2);
  B.lines.forEach(function(L){
    var a = pinPos(L.doc, sr), b = c, dx = b.x - a.x, dy = b.y - a.y, dist = Math.sqrt(dx * dx + dy * dy);
    var sway = FULL() ? Math.sin(B.t * 1.1 + L.i * 1.7) * 6 : 0;
    var sag = 26 + dist * 0.1 + sway, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 + sag;
    var d = "M" + a.x.toFixed(1) + " " + a.y.toFixed(1) + " Q" + mx.toFixed(1) + " " + my.toFixed(1) + " " + b.x.toFixed(1) + " " + b.y.toFixed(1);
    L.sh.setAttribute("d", d); L.st.setAttribute("d", d); L.sh.setAttribute("transform", "translate(1.5 3)");
    var p = clamp(B.prog * 1.5 - L.i * 0.09, 0, 1);
    if (!L.faint){ L.st.style.strokeDasharray = "1"; L.st.style.strokeDashoffset = String(1 - p); L.sh.style.strokeDasharray = "1"; L.sh.style.strokeDashoffset = String(1 - p); }
    else L.st.style.opacity = String(p);
  });
}
function below(el){ var r = el.getBoundingClientRect(); return r.top > window.innerHeight * 0.92; }
var revealIO = new IntersectionObserver(function(es){
  es.forEach(function(e){
    if (!e.isIntersecting) return;
    revealIO.unobserve(e.target);
    var el = e.target, dl = parseFloat(el.style.getPropertyValue("--dl")) || 0;
    el.classList.add("in");
    setTimeout(function(){ el.classList.remove("rv", "in", "up", "rvw"); el.style.removeProperty("--dl"); }, dl + 1800);
  });
}, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
var REVEAL = [".track", ".res", ".journey li", ".mr-more", ".mr-tile", ".inv-card", ".ev-card", ".pkg", ".aud-card", ".deliv li", ".scene-head .eyebrow", ".scene-head .lede", ".hint", ".srcnote", ".diet", ".folder", ".step", ".lrow", ".nopromise > div", ".faq details", ".plate", ".founder > div", ".split", ".finding", ".facts", ".intake-grid > div", ".cover-grid > div"];
function prepReveal(root){
  $$("h2.display", root).forEach(function(h){
    if (h.dataset.rvp) return; h.dataset.rvp = "1";
    if (!below(h)) return;
    if (splitWords(h)){ h.classList.add("rvw"); revealIO.observe(h); }
  });
  REVEAL.forEach(function(sel){
    $$(sel, root).forEach(function(el, i){
      if (el.dataset.rvp) return; el.dataset.rvp = "1";
      if (!below(el)) return;
      el.classList.add("rv", "up"); el.style.setProperty("--dl", Math.min((i % 4) * 110, 440) + "ms"); revealIO.observe(el);
    });
  });
  $$(".stage .doc", root).forEach(function(d, i){
    if (d.dataset.rvp) return; d.dataset.rvp = "1";
    if (!below(d)) return;
    d.classList.add("rv"); d.style.setProperty("--dl", (d.classList.contains("answer-doc") ? 0 : 180 + i * 130) + "ms"); revealIO.observe(d);
  });
}
var countIO = new IntersectionObserver(function(es){
  es.forEach(function(e){
    if (!e.isIntersecting) return; countIO.unobserve(e.target);
    var el = e.target, n = +el.dataset.count, suf = el.dataset.suffix || "", t0 = performance.now(), dur = 1500;
    (function step(now){ var k = clamp((now - t0) / dur, 0, 1), v = k >= 1 ? n : Math.round(n * (1 - Math.pow(2, -10 * k))); el.textContent = v + suf; if (k < 1) requestAnimationFrame(step); })(t0);
  });
}, { threshold: 0.5 });
function prepCounts(root){
  $$("[data-count]", root).forEach(function(el){ if (el.dataset.cp) return; el.dataset.cp = "1"; if (!below(el)) return; el.textContent = "0" + (el.dataset.suffix || ""); countIO.observe(el); });
}
$$(".ticker .track").forEach(function(t){ var c = t.firstElementChild.cloneNode(true); c.setAttribute("aria-hidden", "true"); t.appendChild(c); });
$$(".dots").forEach(function(el){
  var n = +el.dataset.on, h = "";
  for (var i = 0; i < 100; i++) h += i < n ? '<i class="dot on" style="--i:' + i + ';background:' + DOTC[i] + ';border-color:' + DOTC[i] + '"></i>' : '<i class="dot" style="--i:' + i + '"></i>';
  el.innerHTML = h;
});
var dotIO = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting){ e.target.classList.add("lit"); dotIO.unobserve(e.target); } }); }, { threshold: 0.4 });
$$(".dots").forEach(function(el){ dotIO.observe(el); });
var curEl = $("#cur"), cdot = $("#cdot"), curLab = $("#cur span"), curOn = false;
function initCursor(){
  if (!fine || curOn || !FULL()) return; curOn = true;
  var x = -100, y = -100, rx = -100, ry = -100, seen = false;
  window.addEventListener("pointermove", function(e){ if (e.pointerType !== "mouse") return; x = e.clientX; y = e.clientY; seen = true; }, { passive: true });
  html.addEventListener("pointerleave", function(){ seen = false; });
  document.addEventListener("pointerover", function(e){
    var t = e.target.closest ? e.target.closest("a.folder,.doc,input,select,textarea,a,button,summary,[data-src]") : null;
    curEl.classList.remove("big", "link", "hide"); curLab.textContent = "";
    if (!t) return;
    if (t.matches("input,select,textarea")) curEl.classList.add("hide");
    else if (t.matches("a.folder")){ curLab.textContent = "OPEN"; curEl.classList.add("big"); }
    else if (t.matches(".doc")){ curLab.textContent = "FOLLOW"; curEl.classList.add("big"); }
    else if (t.matches("[data-src]")){ curLab.textContent = "SOURCE"; curEl.classList.add("big"); }
    else curEl.classList.add("link");
  });
  addTask(function(){
    var on = FULL() && seen;
    curEl.classList.toggle("on", on); cdot.classList.toggle("on", on);
    if (!on) return;
    rx += (x - rx) * 0.2; ry += (y - ry) * 0.2;
    curEl.style.transform = "translate3d(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px,0)";
    cdot.style.transform = "translate3d(" + x + "px," + y + "px,0)";
  });
}
$$(".btn").forEach(function(b){
  b.addEventListener("pointermove", function(e){ if (!FULL() || e.pointerType !== "mouse") return; var r = b.getBoundingClientRect(); b.style.translate = (((e.clientX - r.left) / r.width - 0.5) * 12).toFixed(1) + "px " + (((e.clientY - r.top) / r.height - 0.5) * 10).toFixed(1) + "px"; });
  b.addEventListener("pointerleave", function(){ b.style.translate = ""; });
});
$$(".folder").forEach(function(f){
  f.addEventListener("pointermove", function(e){ if (!FULL() || e.pointerType !== "mouse") return; var r = f.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5; f.style.transform = "perspective(900px) rotateX(" + (-ny * 8).toFixed(2) + "deg) rotateY(" + (nx * 10).toFixed(2) + "deg) translateY(-6px)"; });
  f.addEventListener("pointerleave", function(){ f.style.transform = ""; });
});
var bar = $(".nav .bar"), sp = 0;
window.addEventListener("scroll", function(){
  if (sp) return;
  sp = requestAnimationFrame(function(){ sp = 0; var h = html.scrollHeight - window.innerHeight; bar.style.transform = "scaleX(" + (h > 0 ? clamp(window.scrollY / h, 0, 1) : 0).toFixed(4) + ")"; });
}, { passive: true });
var tip = $("#tip");
function showTip(el, x, y){
  tip.textContent = el.dataset.src; tip.classList.add("on");
  var r = el.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
  var px = x != null ? x + 14 : r.left, py = y != null ? y + 18 : r.bottom + 8;
  px = clamp(px, 8, window.innerWidth - tw - 8); if (py + th > window.innerHeight - 8) py = (y != null ? y : r.top) - th - 12;
  tip.style.left = px + "px"; tip.style.top = py + "px";
}
function hideTip(){ tip.classList.remove("on"); }
$$("[data-src]").forEach(function(el){
  el.addEventListener("pointermove", function(e){ if (e.pointerType === "mouse") showTip(el, e.clientX, e.clientY); });
  el.addEventListener("pointerleave", hideTip);
  el.addEventListener("focus", function(){ showTip(el); });
  el.addEventListener("blur", hideTip);
  el.addEventListener("click", function(e){ if (e.pointerType !== "mouse"){ if (tip.classList.contains("on")) hideTip(); else showTip(el); } });
});
window.addEventListener("scroll", hideTip, { passive: true });
function drawPlate(){
  var c = $("#plate"); if (!c) return;
  var W = 400, H = 500, x = c.getContext("2d");
  var off = document.createElement("canvas"); off.width = W; off.height = H; var o = off.getContext("2d");
  var g = o.createRadialGradient(W * 0.42, H * 0.38, 20, W * 0.5, H * 0.55, H * 0.75);
  g.addColorStop(0, "#ffffff"); g.addColorStop(0.55, "#9a9a9a"); g.addColorStop(1, "#1a1a1a");
  o.fillStyle = g; o.fillRect(0, 0, W, H);
  o.fillStyle = "#000"; o.font = "900 300px " + getComputedStyle(document.body).getPropertyValue("--display");
  o.textAlign = "center"; o.textBaseline = "middle"; o.globalAlpha = 0.82; o.fillText("SK", W / 2, H * 0.52); o.globalAlpha = 1;
  var img = o.getImageData(0, 0, W, H).data;
  var bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  x.fillStyle = "#F4F4F5"; x.fillRect(0, 0, W, H); x.fillStyle = "#18181B";
  var s = 4;
  for (var yy = 0; yy < H; yy += s) for (var xx = 0; xx < W; xx += s){
    var i = (yy * W + xx) * 4, lum = (img[i] * 0.3 + img[i + 1] * 0.59 + img[i + 2] * 0.11) / 255;
    var th = (bayer[((yy / s) % 4) * 4 + ((xx / s) % 4)] + 0.5) / 16;
    if (lum < th) x.fillRect(xx, yy, s - 0.6, s - 0.6);
  }
  var rg = x.createLinearGradient(40, 0, 360, 0); rg.addColorStop(0, "#4376B2"); rg.addColorStop(0.55, "#563F92"); rg.addColorStop(1, "#A643A9"); x.strokeStyle = rg; x.lineWidth = 3.2; x.lineCap = "round"; x.beginPath();
  var r = rng(42);
  for (var k = 0; k <= 60; k++){ var t = -2 + (k / 60) * 6.283 * 1.08, wob = 1 + 0.03 * Math.sin(t * 3) + k / 60 * 0.05; var px = 200 + Math.cos(t) * 150 * wob, py = 262 + Math.sin(t) * 168 * wob - k / 60 * 4 + r() * 0.8; if (k) x.lineTo(px, py); else x.moveTo(px, py); }
  x.stroke();
}
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var intakeForm = $("#intake-form");
if (intakeForm) intakeForm.addEventListener("submit", function(e){
  e.preventDefault();
  var site = $("#f-site"), mail = $("#f-mail"), st = $("#f-status"), card = e.currentTarget, btn = $("#f-submit");
  if (!site.value.trim()){ st.textContent = "Add your website or a one-line idea so we know what to study."; site.focus(); return; }
  if (!EMAIL_RE.test(mail.value.trim())){ st.textContent = "Add the email address we should reply to."; mail.focus(); return; }
  var pg = $("#f-page"), rf = $("#f-ref");
  if (pg) pg.value = location.pathname;
  if (rf) rf.value = document.referrer || "";
  btn.disabled = true; st.textContent = "Sending\u2026";
  fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(new FormData(card)).toString() })
    .then(function(r){
      if (!r.ok) throw new Error("status " + r.status);
      card.classList.add("sent");
      st.textContent = "Received. You'll get the scope and the price by email within one working day.";
      try { if (window.gtag) window.gtag("event", "generate_lead", { form: "case-intake", need: $("#f-need").value }); } catch (err) {}
    })
    .catch(function(){
      btn.disabled = false;
      var f = new FormData(card), need = $("#f-need"), lines = [];
      if (need && need.selectedOptions[0]) lines.push("What I need: " + need.selectedOptions[0].textContent);
      [["site", "Website or idea"], ["email", "Reply to"], ["buyers", "Who I sell to"], ["comps", "Competitors"], ["market", "Main market"], ["notes", "Notes"]].forEach(function(row){
        var v = String(f.get(row[0]) || "").trim(); if (v) lines.push(row[1] + ": " + v);
      });
      var link = document.createElement("a");
      link.href = "mailto:contact@riseklix.com?subject=" + encodeURIComponent("Open my case") + "&body=" + encodeURIComponent(lines.join("\n"));
      link.textContent = "Send it by email instead";
      st.textContent = "That didn't send. ";
      st.appendChild(link);
      st.appendChild(document.createTextNode(". Your answers are already filled in."));
    });
});
var mbtns = $$(".motion-btn"), mnote = $("#mnote");
function paintToggle(){ mbtns.forEach(function(b){ b.setAttribute("aria-pressed", FULL() ? "true" : "false"); b.textContent = FULL() ? "Motion: full" : "Motion: calm"; }); }
function setMode(m){
  MODE = m;
  html.classList.remove("motion-full", "motion-gentle"); html.classList.add("motion-" + m);
  try { window.localStorage.setItem("rk-motion", m); } catch (err) {}
  paintToggle(); if (THREAD) THREAD.refresh(); if (FULL()) initCursor();
  mnote.hidden = true;
}
mbtns.forEach(function(b){ b.addEventListener("click", function(){ setMode(FULL() ? "gentle" : "full"); }); });
$("#mnote-go").addEventListener("click", function(){ setMode("full"); });
$("#mnote-x").addEventListener("click", function(){ mnote.hidden = true; });
paintToggle();
if (window.__rkOs && !window.__rkStored && !FULL()) mnote.hidden = false;
var views = { home: $("#view-home"), "case": $("#view-case"), mr: $("#view-mr") }, current = null;
if (PAGE && !views[PAGE]) views[PAGE] = $("main");
function wipe(cb){
  var w = $("#wipe"); w.classList.remove("out"); w.classList.add("in");
  setTimeout(function(){ cb(); w.classList.remove("in"); w.classList.add("out"); setTimeout(function(){ w.classList.remove("out"); }, 450); }, 320);
}
function route(initial){
  var h = location.hash.slice(1), target = PAGE || (h === "case-002" ? "case" : (h === "market-research" || h === "mr-sample" || h === "mr-partner") ? "mr" : "home");
  function go(){
    Object.keys(views).forEach(function(k){ if (views[k]) views[k].hidden = k !== target; });
    var changed = current !== target; current = target;
    if (!PAGE && (target === "case" || h === "market-research")) window.scrollTo(0, 0);
    else if (h && h !== "top"){ var el = document.getElementById(h); if (el) el.scrollIntoView({ behavior: changed || !FULL() ? "instant" : "smooth" }); }
    else if (!initial) window.scrollTo(0, 0);
    requestAnimationFrame(function(){ prepReveal(views[target]); prepCounts(views[target]); if (!html.classList.contains("intro-on")) armCircles(views[target]); if (THREAD) THREAD.onRoute(target); });
  }
  if (initial || !FULL() || current === target) go(); else wipe(go);
  requestAnimationFrame(function(){ if (typeof navUpdate === "function") navUpdate(); });
}
window.addEventListener("hashchange", function(){ route(false); });
THREAD = (function(){
  var home = views.home, heroEl = hero, tangle = $("#tangle");
  if (!home || !heroEl || !machine) return null;
  var tctx = tangle ? tangle.getContext("2d") : null;
  var svg = document.createElementNS(NS, "svg");
  svg.setAttribute("id", "thread"); svg.setAttribute("aria-hidden", "true"); svg.setAttribute("focusable", "false");
  home.insertBefore(svg, home.firstChild);
  var S = null, hl = 0, lastW = -1, lastH = -1, mxs = 0, mys = 0, mxt = 0, myt = 0, lastHp = -1, tangleBlank = false, calmDone = false;
  var stageEl = $("#board .stage"), TAU = 6.2832, buf = null, cnt = [0, 0, 0, 0];
  function mk(tag, attrs){ var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function pos(el){
    var x = 0, y = 0, w = el.offsetWidth, h = el.offsetHeight;
    while (el && el !== home){ x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
    return { x: x, y: y, w: w, h: h, r: x + w, b: y + h, cx: x + w / 2, cy: y + h / 2 };
  }
  function sampleRoute(pts){
    var X = [], Y = [];
    function push(x, y){ var n = X.length; if (n && Math.abs(X[n - 1] - x) < 0.01 && Math.abs(Y[n - 1] - y) < 0.01) return; X.push(x); Y.push(y); }
    function line(ax, ay, bx, by, m, seed){
      var dx = bx - ax, dy = by - ay, len = Math.sqrt(dx * dx + dy * dy);
      if (len < 0.5){ push(bx, by); return; }
      var n = Math.max(1, Math.ceil(len / 5)), nx = -dy / len, ny = dx / len, waves = Math.max(1, Math.round(len / 420));
      for (var k = 1; k <= n; k++){ var t = k / n, o = m ? m * Math.sin(Math.PI * t) * Math.sin(TAU * waves * t + seed) : 0; push(ax + dx * t + nx * o, ay + dy * t + ny * o); }
    }
    function quad(ax, ay, cx, cy, bx, by){
      var n = Math.max(4, Math.ceil((Math.abs(bx - ax) + Math.abs(by - ay)) / 5));
      for (var k = 1; k <= n; k++){ var t = k / n, u = 1 - t; push(u * u * ax + 2 * u * t * cx + t * t * bx, u * u * ay + 2 * u * t * cy + t * t * by); }
    }
    var px = pts[0].x, py = pts[0].y; push(px, py);
    for (var i = 1; i < pts.length; i++){
      var P = pts[i], N = pts[i + 1];
      if (!N || !P.r){ line(px, py, P.x, P.y, P.m, i * 1.7); px = P.x; py = P.y; continue; }
      var d1x = P.x - px, d1y = P.y - py, l1 = Math.sqrt(d1x * d1x + d1y * d1y), d2x = N.x - P.x, d2y = N.y - P.y, l2 = Math.sqrt(d2x * d2x + d2y * d2y);
      var r = Math.min(P.r, l1 / 2, l2 / 2);
      if (r < 1 || l1 < 1 || l2 < 1){ line(px, py, P.x, P.y, P.m, i * 1.7); px = P.x; py = P.y; continue; }
      var ax = P.x - d1x / l1 * r, ay = P.y - d1y / l1 * r, bx = P.x + d2x / l2 * r, by = P.y + d2y / l2 * r;
      line(px, py, ax, ay, P.m, i * 1.7); quad(ax, ay, P.x, P.y, bx, by); px = bx; py = by;
    }
    return [X, Y];
  }
  function lastLine(h2){
    var ws = $$(".w", h2), p;
    if (!ws.length){ p = pos(h2); return { x: p.x, r: p.r, b: p.b }; }
    var boxes = ws.map(pos), top = Math.max.apply(null, boxes.map(function(b){ return b.y; })), x = 1e9, r = -1e9, b = 0;
    boxes.forEach(function(q){ if (q.y >= top - 4){ x = Math.min(x, q.x); r = Math.max(r, q.r); b = Math.max(b, q.b); } });
    return { x: x, r: r, b: b };
  }
  function build(){
    if (home.hidden) return;
    var W = home.clientWidth, H = home.offsetHeight;
    if (!W || !H) return;
    lastW = W; lastH = H;
    try {
      var pts = [], nodeReq = [];
      function v(x, y, r, m){ pts.push({ x: x, y: y, r: r == null ? 44 : r, m: m || 0 }); }
      var heroP = pos(heroEl), mach = pos(machine), boardEl = $("#board"), board = pos(boardEl), sh = pos($(".scene-head", boardEl));
      var wrapEl = $(".wrap", boardEl), wp = pos(wrapEl), cs = getComputedStyle(wrapEl), wl = wp.x + parseFloat(cs.paddingLeft), wr = wp.r - parseFloat(cs.paddingRight);
      var mL = Math.max(7, wl / 2), mR = W - Math.max(7, (W - wr) / 2);
      var E0 = { x: mach.cx, y: mach.b + 8 }, y1 = (board.y + sh.y) / 2;
      var diets = $(".diets", home), stepsEl = $(".steps", home), tiles = $$(".mr-tile", home), numEl = $("#cases .folder .num"), aboutEl = $("#about"), intakeH = $("#h-intake");
      var fullMode = W > 980 && diets && stepsEl && tiles.length >= 6 && numEl && aboutEl && stageEl && !listMode.matches;
      var pinPt = null, ul = intakeH ? lastLine(intakeH) : null, yU = ul ? ul.b + 9 : H - 40;
      v(E0.x, E0.y, 0);
      if (fullMode){
        var ans = pos($(".answer-doc", stageEl)), stage = pos(stageEl), c1 = pos($(".scene-head", boardEl).firstElementChild), c2 = pos($(".scene-head", boardEl).lastElementChild);
        var gapX = c2.x > c1.r ? (c1.r + c2.x) / 2 : mL;
        var res = pos($("#research")), resHead = pos($("#research .scene-head")), y2 = (res.y + resHead.y) / 2, dp = pos(diets), yR = dp.y + 1;
        var yC = pos(numEl).cy, t1 = pos(tiles[0]), t4 = pos(tiles[3]), sp = pos(stepsEl), ab = pos(aboutEl), y3 = ab.y + parseFloat(getComputedStyle(aboutEl).paddingTop) / 2;
        v(E0.x, y1, 60);
        v(gapX, y1, 60);
        v(gapX, stage.y - 30, 44, 5);
        v(ans.cx, ans.y + 2, 0);
        pinPt = { x: ans.cx, y: ans.y + 2 };
        v(ans.cx, ans.b, 0);
        v(ans.cx, y2, 60, 5);
        v(mL, y2, 50);
        v(mL, yR, 34, 4);
        v(mR, yR, 34);
        $$(".diet", diets).forEach(function(d){ nodeReq.push({ x: pos(d).x, y: yR }); });
        v(mR, yC, 40, 5);
        v(mL, yC, 40);
        v(mL, t1.cy, 40, 6);
        v(mR, t1.cy, 40);
        v(mR, t4.cy, 40);
        v(mL, t4.cy, 40);
        v(mL, sp.y, 34, 5);
        v(mR, sp.y, 34);
        $$(".step", stepsEl).forEach(function(s){ nodeReq.push({ x: pos(s).x, y: sp.y }); });
        v(mR, y3, 50, 6);
        v(mL, y3, 50);
        $$("#faq details").forEach(function(d){ var q = pos(d); nodeReq.push({ x: mL, y: q.y + Math.min(q.h, 70) / 2 }); });
        v(mL, yU, 36, 6);
      } else {
        v(E0.x, y1, 40);
        v(mL, y1, 26);
        $$("section.scene", home).forEach(function(sec){ var q = pos(sec); if (q.y > y1 + 80 && q.y < yU - 80) nodeReq.push({ x: mL, y: q.y + 2, r: 3.4 }); });
        v(mL, yU, 14);
      }
      if (ul){ v(ul.r + 10, yU, 10); v(ul.r + 24, yU - 13, 0); }
      var XY = sampleRoute(pts), X = XY[0], Y = XY[1], n = X.length, LEN = new Float32Array(n), MAXY = new Float32Array(n), LIGHT = new Uint8Array(n);
      var ranges = $$("section.paper", home).map(function(s){ var q = pos(s); return [q.y, q.b]; }), mx = -1e9;
      for (var i = 0; i < n; i++){
        if (i) LEN[i] = LEN[i - 1] + Math.sqrt((X[i] - X[i - 1]) * (X[i] - X[i - 1]) + (Y[i] - Y[i - 1]) * (Y[i] - Y[i - 1]));
        if (Y[i] > mx) mx = Y[i];
        MAXY[i] = mx;
        for (var k = 0; k < ranges.length; k++) if (Y[i] >= ranges[k][0] && Y[i] < ranges[k][1]){ LIGHT[i] = 1; break; }
      }
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.setAttribute("width", W); svg.setAttribute("height", H); svg.setAttribute("viewBox", "0 0 " + W + " " + H);
      svg.style.width = W + "px"; svg.style.height = H + "px";
      var defs = mk("defs", {}), lg = mk("linearGradient", { id: "thr-g", gradientUnits: "userSpaceOnUse", x1: 0, y1: 0, x2: W, y2: 0 });
      [["0", "#4ED2EC"], ["0.5", "#9D86E8"], ["1", "#D58BDA"]].forEach(function(st){ lg.appendChild(mk("stop", { offset: st[0], "stop-color": st[1] })); });
      defs.appendChild(lg); svg.appendChild(defs);
      var runs = [], a = 0;
      for (var j = 1; j < n; j++){
        if (j === n - 1 || LIGHT[j] !== LIGHT[a]){
          var d = "M" + X[a].toFixed(1) + " " + Y[a].toFixed(1);
          for (var q = a + 1; q <= j; q++) d += "L" + X[q].toFixed(1) + " " + Y[q].toFixed(1);
          var L = LEN[j] - LEN[a], pe = mk("path", { d: d, "class": LIGHT[a] ? "t-l" : "t-d" }), ge = mk("path", { d: d, "class": "t-glow" });
          pe.style.strokeDasharray = (L + 2).toFixed(1); pe.style.strokeDashoffset = (L + 2).toFixed(1);
          svg.appendChild(pe); svg.appendChild(ge);
          runs.push({ l0: LEN[a], L: L, el: pe, g: ge, d: -1 });
          a = j;
        }
      }
      function nearest(x, y){ var bi = 0, bd = 1e15; for (var i2 = 0; i2 < n; i2++){ var dx = X[i2] - x, dy = Y[i2] - y, dd = dx * dx + dy * dy; if (dd < bd){ bd = dd; bi = i2; } } return bi; }
      var nodes = nodeReq.map(function(rq){
        var bi = nearest(rq.x, rq.y), c = mk("circle", { cx: X[bi].toFixed(1), cy: Y[bi].toFixed(1), r: rq.r || 4, "class": "node" + (LIGHT[bi] ? " l" : "") });
        svg.appendChild(c); return { len: LEN[bi], el: c, on: false };
      });
      var hg = mk("g", { "class": "t-head" });
      hg.appendChild(mk("circle", { r: 18, "class": "halo" })); hg.appendChild(mk("circle", { r: 3.2, "class": "core" }));
      svg.appendChild(hg);
      var two = W > 980, R = two ? mach.w * 0.66 : Math.min(mach.w * 0.6, 300);
      var ball = { cx: two ? mach.cx + mach.w * 0.06 : mach.cx, cy: two ? mach.cy - mach.h * 0.05 : mach.cy, R: R, n: 1500, turns: 27 };
      if (tangle){
        var tw = heroEl.clientWidth, th = heroEl.offsetHeight;
        tangle.width = Math.round(tw * dpr); tangle.height = Math.round(th * dpr); tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (!buf || buf[0].length < (ball.n + 2) * 4) buf = [0, 1, 2, 3].map(function(){ return new Float32Array((ball.n + 2) * 4); });
      }
      S = { X: X, Y: Y, LEN: LEN, MAXY: MAXY, LIGHT: LIGHT, n: n, total: LEN[n - 1], runs: runs, nodes: nodes, head: hg, act: null, E0: E0, heroB: heroP.b, ball: ball,
        tw: tangle ? heroEl.clientWidth : 0, th: tangle ? heroEl.offsetHeight : 0, pinLen: pinPt ? LEN[nearest(pinPt.x, pinPt.y)] : null };
      html.classList.toggle("thread-rules", !!fullMode);
      html.classList.add("thread-on");
      hl = Math.min(hl, S.total);
      calmDone = false; tangleBlank = false; lastHp = -1;
      frame(performance.now(), true);
    } catch (err) {
      S = null; html.classList.remove("thread-rules", "thread-on");
      if (window.console) console.warn("thread", err);
    }
  }
  function idxAtLen(l){ var a = 0, b = S.n - 1; while (a < b){ var m = (a + b) >> 1; if (S.LEN[m] < l) a = m + 1; else b = m; } return a; }
  function pointAtLen(l){
    var i = idxAtLen(l); if (i <= 0) return [S.X[0], S.Y[0], 0];
    var l0 = S.LEN[i - 1], l1 = S.LEN[i], f = l1 > l0 ? (l - l0) / (l1 - l0) : 0;
    return [S.X[i - 1] + (S.X[i] - S.X[i - 1]) * f, S.Y[i - 1] + (S.Y[i] - S.Y[i - 1]) * f, i];
  }
  function targetLen(ty){
    var a = 0, b = S.n - 1; if (S.MAXY[b] < ty) return S.total;
    while (a < b){ var m = (a + b) >> 1; if (S.MAXY[m] < ty) a = m + 1; else b = m; }
    return S.LEN[a];
  }
  function apply(full){
    var act = null, i, R, d;
    for (i = 0; i < S.runs.length; i++){
      R = S.runs[i]; d = clamp(hl - R.l0, 0, R.L);
      if (d !== R.d){ R.d = d; R.el.style.strokeDashoffset = (R.L + 2 - d).toFixed(1); }
      if (full && hl > R.l0 && hl <= R.l0 + R.L + 0.01) act = R;
    }
    if (act !== S.act){ if (S.act) S.act.g.classList.remove("on"); S.act = act; if (act) act.g.classList.add("on"); }
    if (act){ var g = Math.min(170, act.d); act.g.style.strokeDasharray = g.toFixed(1) + " " + (act.L + 600).toFixed(1); act.g.style.strokeDashoffset = (-(act.d - g)).toFixed(1); }
    for (i = 0; i < S.nodes.length; i++){ var N = S.nodes[i], on = hl >= N.len - 1; if (on !== N.on){ N.on = on; N.el.classList.toggle("on", on); } }
    var p = pointAtLen(hl);
    S.head.setAttribute("transform", "translate(" + p[0].toFixed(1) + " " + p[1].toFixed(1) + ")");
    S.head.setAttribute("class", "t-head" + (S.LIGHT[p[2]] ? " l" : "") + (full ? "" : " off") + (hl >= S.total - 0.5 ? " end" : ""));
  }
  function drawTangle(now, sy, full){
    if (!tctx || !S || !buf) return;
    if (sy > S.heroB + 60){ if (!tangleBlank){ tctx.clearRect(0, 0, S.tw, S.th); tangleBlank = true; } return; }
    tangleBlank = false;
    tctx.clearRect(0, 0, S.tw, S.th);
    var B = S.ball, p = full ? clamp(sy / (S.heroB * 0.7), 0, 1) : 0, u0 = Math.pow(p, 0.85);
    if (u0 > 0.995) return;
    var t = full ? now * 0.00011 : 0.9, ry = t + p * 2.4 + mxs * 0.5, rx = 0.5 + mys * 0.3;
    var cyR = Math.cos(ry), syR = Math.sin(ry), cxR = Math.cos(rx), sxR = Math.sin(rx);
    var N = B.n, i0 = Math.floor(u0 * N), R = B.R * (1 + p * 0.22), lx = 0, ly = 0;
    cnt[0] = cnt[1] = cnt[2] = cnt[3] = 0;
    for (var i = i0; i <= N; i++){
      var u = i / N, th = u * B.turns * TAU, a = u * 10.4 + 0.5, b = u * 16.1, rr = 1 - 0.09 * Math.sin(th * 0.31 + 1.3);
      var x0 = Math.cos(th) * rr, y0 = Math.sin(th) * rr, y1 = y0 * Math.cos(a), z1 = y0 * Math.sin(a);
      var x2 = x0 * Math.cos(b) + z1 * Math.sin(b), z2 = -x0 * Math.sin(b) + z1 * Math.cos(b);
      var x3 = x2 * cyR + z2 * syR, z3 = -x2 * syR + z2 * cyR, y4 = y1 * cxR - z3 * sxR, z4 = y1 * sxR + z3 * cxR;
      var ps = 1 / (1 - z4 * 0.16), px = B.cx + x3 * R * ps, py = B.cy + y4 * R * ps;
      if (u > 0.94){ var s = (u - 0.94) / 0.06; s = s * s * (3 - 2 * s); px += (S.E0.x - px) * s; py += (S.E0.y - py) * s; }
      if (i > i0){ var q = z4 > 0.45 ? 3 : z4 > 0 ? 2 : z4 > -0.45 ? 1 : 0, c = cnt[q], bq = buf[q]; bq[c] = lx; bq[c + 1] = ly; bq[c + 2] = px; bq[c + 3] = py; cnt[q] = c + 4; }
      lx = px; ly = py;
    }
    var al = [0.08, 0.16, 0.3, 0.52], fade = 1 - clamp((p - 0.82) / 0.18, 0, 1);
    tctx.lineWidth = 1.05; tctx.lineCap = "round";
    for (var k = 0; k < 4; k++){
      if (!cnt[k]) continue;
      var arr = buf[k]; tctx.beginPath();
      for (var j = 0; j < cnt[k]; j += 4){ tctx.moveTo(arr[j], arr[j + 1]); tctx.lineTo(arr[j + 2], arr[j + 3]); }
      tctx.strokeStyle = "rgba(237,237,239," + (al[k] * fade).toFixed(3) + ")"; tctx.stroke();
    }
  }
  function frame(now, force){
    if (!S || current !== "home") return;
    var sy = window.scrollY, vh = window.innerHeight, full = FULL(), changed = force;
    var hp = full ? clamp(sy / S.heroB, 0, 1) : 0;
    if (Math.abs(hp - lastHp) > 0.002){ lastHp = hp; heroEl.style.setProperty("--hp", hp.toFixed(3)); }
    if (full){
      var tl = targetLen(sy + vh * 0.62), d = tl - hl;
      if (Math.abs(d) > 0.4){ hl += d * 0.09; if (Math.abs(tl - hl) < 0.4) hl = tl; changed = true; }
      calmDone = false;
    } else if (!calmDone){ hl = S.total; changed = true; calmDone = true; }
    if (changed) apply(full);
    mxs += (mxt - mxs) * 0.05; mys += (myt - mys) * 0.05;
    if (full || changed) drawTangle(now, sy, full);
  }
  window.addEventListener("pointermove", function(e){ mxt = e.clientX / window.innerWidth - 0.5; myt = e.clientY / window.innerHeight - 0.5; }, { passive: true });
  var rt = 0;
  function queue(){ clearTimeout(rt); rt = setTimeout(function(){ if (home.hidden) return; if (home.clientWidth !== lastW || home.offsetHeight !== lastH) build(); }, 160); }
  if (window.ResizeObserver) new ResizeObserver(queue).observe(home);
  window.addEventListener("resize", queue);
  addTask(function(now){ frame(now, false); });
  return {
    build: build,
    stage: stageEl,
    refresh: function(){ calmDone = false; lastHp = -1; if (S) frame(performance.now(), true); },
    onRoute: function(target){ if (target === "home") requestAnimationFrame(build); },
    boardProg: function(){ if (!S || S.pinLen == null || !FULL()) return null; return clamp((hl - S.pinLen) / 560, 0, 1); }
  };
})();
var introRan = false;
function runIntro(){
  var el = $("#intro");
  if (!el) return Promise.resolve();
  if (!html.classList.contains("intro-on")){ el.parentNode.removeChild(el); return Promise.resolve(); }
  introRan = true;
  return new Promise(function(resolve){
    var ended = false, mark = $(".intro-mark", el), img = $("img", mark);
    function finish(){
      if (ended) return; ended = true;
      try { window.sessionStorage.setItem("rk-intro", "1"); } catch (e) {}
      el.classList.add("out"); html.classList.remove("intro-on"); resolve();
      setTimeout(function(){ if (el.parentNode) el.parentNode.removeChild(el); }, 900);
    }
    ["pointerdown", "keydown", "wheel", "touchstart"].forEach(function(ev){ window.addEventListener(ev, finish, { once: true, passive: true }); });
    function play(){
      el.classList.add("go");
      setTimeout(function(){ if (!ended) drawCircle(mark, true, 0); }, 380);
      setTimeout(function(){ el.classList.add("word"); }, 820);
      setTimeout(finish, 2200);
    }
    img.onload = function(){ requestAnimationFrame(play); };
    img.onerror = finish;
    img.src = $(".logo-mark").src;
    setTimeout(finish, 5200);
  });
}
var nav = $("#site-nav"), spyLinks = $$("[data-spy]"), lastY = window.scrollY, navTick = 0;
function setCurrent(id){ spyLinks.forEach(function(a){ if (a.dataset.spy === id) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current"); }); }
function navUpdate(){
  navTick = 0;
  var y = window.scrollY, dy = y - lastY; lastY = y;
  nav.classList.toggle("nav-solid", y > 24);
  var menuOpen = html.classList.contains("menu-open"), focusIn = nav.contains(document.activeElement) && document.activeElement !== document.body;
  if (FULL() && !menuOpen && !focusIn){ if (y > 320 && dy > 6) nav.classList.add("nav-hidden"); else if (dy < -6 || y < 120) nav.classList.remove("nav-hidden"); }
  else nav.classList.remove("nav-hidden");
  if (current === "case"){ setCurrent("cases"); return; }
  if (current === "mr"){ setCurrent("market"); return; }
  if (PAGE && PAGE !== "home"){ setCurrent(html.getAttribute("data-nav")); return; }
  var ids = ["board", "cases", "market", "how", "fees", "about"], pick = null, line = window.innerHeight * 0.42;
  ids.forEach(function(id){ var el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= line) pick = id; });
  var ab = document.getElementById("about"); if (pick === "about" && ab && ab.getBoundingClientRect().bottom < 0) pick = null;
  setCurrent(pick);
}
window.addEventListener("scroll", function(){ if (!navTick) navTick = requestAnimationFrame(navUpdate); }, { passive: true });
nav.addEventListener("focusin", function(){ nav.classList.remove("nav-hidden"); });
var menuBtn = $("#menu-btn"), menu = $("#mobile-menu"), menuLabel = $(".menu-label", menuBtn);
function menuFocusables(){ return [menuBtn].concat($$("a,button", menu)); }
function openMenu(){ menu.classList.add("open"); html.classList.add("menu-open"); menuBtn.setAttribute("aria-expanded", "true"); menuLabel.textContent = "Close"; nav.classList.remove("nav-hidden"); setTimeout(function(){ var f = $("nav a", menu); if (f) f.focus(); }, 60); }
function closeMenu(returnFocus){ if (!menu.classList.contains("open")) return; menu.classList.remove("open"); html.classList.remove("menu-open"); menuBtn.setAttribute("aria-expanded", "false"); menuLabel.textContent = "Menu"; if (returnFocus) menuBtn.focus(); }
menuBtn.addEventListener("click", function(){ if (menu.classList.contains("open")) closeMenu(true); else openMenu(); });
$$("a", menu).forEach(function(a){ a.addEventListener("click", function(){ closeMenu(false); }); });
document.addEventListener("keydown", function(e){
  if (!menu.classList.contains("open")) return;
  if (e.key === "Escape"){ e.preventDefault(); closeMenu(true); return; }
  if (e.key !== "Tab") return;
  var f = menuFocusables(), first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
});
window.matchMedia("(min-width: 1041px)").addEventListener("change", function(m){ if (m.matches) closeMenu(false); });
$$("[data-need]").forEach(function(a){ a.addEventListener("click", function(){ var sel = $("#f-need"); if (sel) sel.value = a.dataset.need; }); });
var needQ = /[?&]need=([a-z]+)/.exec(location.search), needSel = $("#f-need");
if (needQ && needSel && $('option[value="' + needQ[1] + '"]', needSel)) needSel.value = needQ[1];
$("#skip-link").addEventListener("click", function(e){ e.preventDefault(); var m = views[current] || views.home || $("main"); m.focus({ preventScroll: true }); m.scrollIntoView({ behavior: "auto" }); });
$("#copy-email").addEventListener("click", function(){
  var b = this, txt = $("#f-email").textContent;
  function ok(){ b.textContent = "Copied"; b.classList.add("done"); setTimeout(function(){ b.textContent = "Copy"; b.classList.remove("done"); }, 1800); }
  function fallback(){ var r = document.createRange(); r.selectNodeContents($("#f-email")); var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); b.textContent = "Selected"; setTimeout(function(){ b.textContent = "Copy"; }, 1800); }
  try { navigator.clipboard.writeText(txt).then(ok, fallback); } catch (err) { fallback(); }
});
$("#news-form").addEventListener("submit", function(e){
  e.preventDefault();
  var em = $("#f-news-email"), st = $("#f-news-status"), v = em.value.trim(), hp = $("#f-news-hp"), btn = $("button[type=submit]", e.currentTarget);
  if (!EMAIL_RE.test(v)){ st.textContent = "Enter a valid email address."; em.focus(); return; }
  btn.disabled = true; st.textContent = "Subscribing\u2026";
  function viaForm(){
    return fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ "form-name": "research-notes", email: v, "bot-field": hp ? hp.value : "", page: location.pathname }).toString() })
      .then(function(r){ if (!r.ok) throw new Error("failed"); });
  }
  fetch("/.netlify/functions/beehiiv-subscribe", { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: v, consent: true, company: hp ? hp.value : "", page_path: location.pathname, referrer: document.referrer || "" }) })
    .then(function(r){ return r.json().catch(function(){ return {}; }).then(function(d){ if (!r.ok || !d.ok) throw new Error("failed"); }); })
    .catch(viaForm)
    .then(function(){
      em.value = ""; st.textContent = "You're subscribed. Look out for the next research note.";
      try { if (window.gtag) window.gtag("event", "sign_up", { method: "research-notes" }); } catch (err) {}
    }, function(){ st.textContent = "That didn't go through. Please try again, or email contact@riseklix.com."; })
    .then(function(){ btn.disabled = false; });
});
$("#to-top").addEventListener("click", function(){ window.scrollTo({ top: 0, behavior: FULL() ? "smooth" : "auto" }); var lg = $(".nav .logo"); if (lg) lg.focus({ preventScroll: true }); });
$$("[data-board]").forEach(setupBoard);
route(true);
initCursor();
var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
var introP = runIntro();
if (PAGE && location.hash.length > 1){
  var moved = false;
  ["wheel", "touchstart", "keydown", "pointerdown"].forEach(function(ev){ window.addEventListener(ev, function(){ moved = true; }, { once: true, passive: true }); });
  Promise.all([fontsReady, introP]).then(function(){ setTimeout(function(){ var el = document.getElementById(location.hash.slice(1)); if (el && !moved) el.scrollIntoView({ behavior: "instant" }); }, 80); });
}
fontsReady.then(function(){ drawPlate(); if (THREAD) THREAD.build(); });
Promise.all([fontsReady, introP]).then(function(){ startHero(); if (THREAD) THREAD.build(); armCircles(document); boot(); });
setTimeout(function(){ if (!booted){ html.classList.remove("intro-on"); armCircles(document); drawPlate(); boot(); } }, 7000);
})();
