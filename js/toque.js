// ---------- Aparelhos de toque ----------
["gesturestart", "gesturechange", "gestureend"].forEach(t => document.addEventListener(t, e => e.preventDefault()));
if (matchMedia("(pointer:coarse)").matches) document.addEventListener("contextmenu", e => e.preventDefault());
canvas.addEventListener("touchmove", e => e.preventDefault(), { passive: false });
let wakeLock = null;
async function keepAwake() {
  try { if ("wakeLock" in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request("screen"); wakeLock.addEventListener("release", () => { wakeLock = null; }); } } catch (err) { wakeLock = null; }
}
document.addEventListener("pointerdown", keepAwake, { passive: true });
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") keepAwake(); });
// avisa o jogo quando a tela muda de tamanho/orientação
matchMedia(MQ_MOBILE).addEventListener && matchMedia(MQ_MOBILE).addEventListener("change", () => { fitUI(); renderTeams(); setTimeout(() => { resizeCanvas(); fitWordInputs(); }, 60); });
