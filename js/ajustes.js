// Escala da interface conforme o tamanho da janela (telas menores / outras proporções)
function fitUI() { document.documentElement.style.setProperty("--ui", isMobileLayout() ? "1" : Math.max(0.68, Math.min(1, innerWidth / 1366, innerHeight / 760)).toFixed(3)); }
window.addEventListener("resize", () => { fitUI(); refreshRatioGuard(); }); fitUI();
document.getElementById("openSettings").addEventListener("click", refreshRatioGuard);
refreshRatioGuard();
if ("ResizeObserver" in window) new ResizeObserver(resizeCanvas).observe(canvas);
else window.addEventListener("resize", resizeCanvas);

resizeCanvas();
updateHistoryButtons();


// ---------- ligação dos sons ----------
(function () {
  const on = (id, ev, fn) => { const el = document.getElementById(id); if (el) el.addEventListener(ev, fn); };
  document.addEventListener("click", e => { const b = e.target.closest && e.target.closest("button"); if (b && !b.disabled) SFX.click(); }, true);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") SFX.unlock(); });
  document.querySelectorAll("[data-tool]").forEach(b => b.addEventListener("click", () => { if (!silentTool) SFX.tool(); }));
  document.querySelectorAll("[data-color]").forEach(b => b.addEventListener("click", () => SFX.tool()));
  on("undo", "click", () => SFX.undo()); on("redo", "click", () => SFX.redo());
  on("clear", "click", () => SFX.sweep());
  on("privacyToggle", "click", () => SFX.hide());
  on("turnOk", "click", () => SFX.go());
  ["save", "exportVideo", "exportGame", "applyCanvasBg", "confirmWords", "adjPlus", "adjMinus"].forEach(id => on(id, "click", () => SFX.ok()));
  on("closeSettings", "click", () => SFX.close());
  on("closeHistory", "click", () => SFX.close()); on("openHistory", "click", () => SFX.open());
  on("closeResults", "click", () => SFX.close());
  on("finalClose", "click", () => SFX.close()); on("finalNew", "click", () => SFX.ok());
  on("themeOptions", "change", () => SFX.tool());
  const sOn = document.getElementById("sfxOn"), sVol = document.getElementById("sfxVol");
  if (sOn && sVol) {
    sOn.checked = SFX.on; sVol.value = Math.round(SFX.vol * 100);
    sOn.addEventListener("change", () => { SFX.setOn(sOn.checked); if (sOn.checked) SFX.ok(); });
    sVol.addEventListener("input", () => SFX.setVol(sVol.value / 100));
    sVol.addEventListener("change", () => SFX.solve());
    on("sfxTest", "click", () => SFX.solve());
  }
})();
