(function(){
"use strict";
function $(s, el){ return (el || document).querySelector(s); }
function $$(s, el){ return Array.prototype.slice.call((el || document).querySelectorAll(s)); }
var btn = $("#menu-btn"), menu = $("#mobile-menu");
if (btn && menu){
  btn.addEventListener("click", function(){
    var open = menu.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    $(".menu-label", btn).textContent = open ? "Close" : "Menu";
  });
  document.addEventListener("keydown", function(e){
    if (e.key === "Escape" && menu.classList.contains("open")){ menu.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); $(".menu-label", btn).textContent = "Menu"; btn.focus(); }
  });
}
var bar = $(".progress"), tick = 0;
if (bar){
  window.addEventListener("scroll", function(){
    if (tick) return;
    tick = requestAnimationFrame(function(){
      tick = 0;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0).toFixed(4) + ")";
    });
  }, { passive: true });
}
var list = $("#hub-cards");
if (list){
  var cards = $$(".card", list), chips = $$(".chip"), input = $("#hub-q"), count = $("#hub-count"), empty = $("#hub-empty"), topic = "all";
  function apply(){
    var q = (input.value || "").trim().toLowerCase(), words = q ? q.split(/\s+/) : [], n = 0;
    cards.forEach(function(c){
      var okTopic = topic === "all" || c.dataset.topic === topic, hay = c.dataset.search, okQ = true;
      for (var i = 0; i < words.length; i++){ if (hay.indexOf(words[i]) === -1){ okQ = false; break; } }
      var show = okTopic && okQ; c.hidden = !show; if (show) n++;
    });
    count.textContent = n + (n === 1 ? " article" : " articles");
    empty.hidden = n !== 0;
  }
  chips.forEach(function(ch){
    ch.addEventListener("click", function(){
      topic = ch.dataset.topic;
      chips.forEach(function(o){ o.setAttribute("aria-pressed", o === ch ? "true" : "false"); });
      apply();
    });
  });
  input.addEventListener("input", apply);
  var m = (location.hash || "").slice(1);
  if (m){ chips.forEach(function(ch){ if (ch.dataset.topic === m) ch.click(); }); }
  apply();
}
})();
