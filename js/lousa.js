const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const colorInput = document.getElementById("color");
colorInput.value = "#000000";
const sizeInput = document.getElementById("size");
const sizeValue = document.getElementById("sizeValue");
const toolName = document.getElementById("status");
const colorPreview = document.getElementById("colorPreview");

const names = {
  pen: "Lápis", eraser: "Borracha", bucket: "Balde",
  line: "Linha", rect: "Retângulo", circle: "Círculo", select: "Mover forma", picker: "Seletor de cores"
};

let tool = "pen";
let drawing = false;
let start = null;
let currentCommand = null;
let preview = null;
let dpr = 1;
let commands = [];
let redoCommands = [];
let selectedShape = null;
let movingShape = false;
let moveOffset = { x: 0, y: 0 };
let moveOriginal = null;
let movePointerStart = null;

function resizeCanvas() {
  const old = document.createElement("canvas");
  old.width = canvas.width;
  old.height = canvas.height;
  if (old.width && old.height) old.getContext("2d").drawImage(canvas, 0, 0);
  const rect = canvas.getBoundingClientRect();
  dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = currentBoardColor();
  ctx.fillRect(0, 0, rect.width, rect.height);
  if (old.width && old.height) ctx.drawImage(old, 0, 0, old.width, old.height, 0, 0, rect.width, rect.height);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // Re-render vector objects at the current canvas size.
  render();
}

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function configureBrush(command) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = command.size;
  ctx.strokeStyle = command.color;
  ctx.fillStyle = command.color;
}

function drawCommand(command) {
  if (command.type === "raster") {
    let temp = command._cv;
    if (!temp) {
      temp = document.createElement("canvas");
      temp.width = command.imageData.width;
      temp.height = command.imageData.height;
      temp.getContext("2d").putImageData(command.imageData, 0, 0);
      command._cv = temp;
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(temp, 0, 0, canvas.width / dpr, canvas.height / dpr);
    return;
  }
  configureBrush(command);
  ctx.globalCompositeOperation = command.type === "eraser" ? "destination-out" : "source-over";
  if (command.type === "pen" || command.type === "eraser") {
    if (!command.points || !command.points.length) return;
    ctx.beginPath();
    ctx.moveTo(command.points[0].x, command.points[0].y);
    for (let i = 1; i < command.points.length; i++) ctx.lineTo(command.points[i].x, command.points[i].y);
    if (command.points.length === 1) {
      ctx.lineTo(command.points[0].x + 0.01, command.points[0].y + 0.01);
    }
    ctx.stroke();
    return;
  }
  if (["line", "rect", "circle"].includes(command.type)) {
    const a = command.a, b = command.b;
    ctx.beginPath();
    if (command.type === "line") {
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    } else if (command.type === "rect") {
      ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
    } else {
      // Treat the start and current pointer positions as opposite corners,
      // matching the rectangle tool's drag direction (top-left to bottom-right).
      const left = Math.min(a.x, b.x);
      const top = Math.min(a.y, b.y);
      const rx = Math.abs(b.x - a.x) / 2;
      const ry = Math.abs(b.y - a.y) / 2;
      ctx.ellipse(left + rx, top + ry, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function currentBoardColor() { return document.getElementById("canvasBgColor")?.value || "#ffffff"; }
function render() {
  renderTick++;
  const rect = canvas.getBoundingClientRect();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = currentBoardColor();
  ctx.fillRect(0, 0, rect.width, rect.height);
  for (const command of commands) drawCommand(command);
  // Render the active stroke on every pointer move, not only on pointer release.
  if (currentCommand && !commands.includes(currentCommand)) drawCommand(currentCommand);
  else if (preview) drawCommand(preview);
  ctx.globalCompositeOperation = "source-over";
  if (selectedShape && commands.includes(selectedShape)) {
    const bounds = getShapeBounds(selectedShape);
    if (bounds) {
      ctx.save();
      ctx.strokeStyle = "#27a9ff";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(bounds.x - 5, bounds.y - 5, bounds.w + 10, bounds.h + 10);
      ctx.restore();
    }
  }
}

function getShapeBounds(command) {
  if (!command || !["line", "rect", "circle"].includes(command.type)) return null;
  const a = command.a, b = command.b;
  if (command.type === "circle") {
    return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y),
      w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) };
  }
  return { x: Math.min(a.x, b.x), y: Math.min(a.y, b.y),
    w: Math.abs(b.x - a.x), h: Math.abs(b.y - a.y) };
}

function hitShape(point) {
  // Search from newest to oldest so the topmost shape is selected first.
  for (let i = commands.length - 1; i >= 0; i--) {
    const c = commands[i];
    if (!["line", "rect", "circle"].includes(c.type)) continue;
    const b = getShapeBounds(c);
    const pad = Math.max(8, c.size + 4);
    if (point.x >= b.x - pad && point.x <= b.x + b.w + pad &&
        point.y >= b.y - pad && point.y <= b.y + b.h + pad) return c;
  }
  return null;
}

function updateHistoryButtons() {
  document.getElementById("undo").disabled = commands.length === 0;
  document.getElementById("redo").disabled = redoCommands.length === 0;
}
function commitCommand(command) {
  commands.push(command);
  redoCommands = [];
  selectedShape = null;
  updateHistoryButtons();
  render();
}

function floodFill(pos) {
  // Work in physical canvas pixels so high-DPI displays are handled correctly.
  render();
  const width = canvas.width, height = canvas.height;
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;
  const sx = Math.max(0, Math.min(width - 1, Math.floor(pos.x * dpr)));
  const sy = Math.max(0, Math.min(height - 1, Math.floor(pos.y * dpr)));
  const startIndex = (sy * width + sx) * 4;
  const target = [data[startIndex], data[startIndex + 1], data[startIndex + 2], data[startIndex + 3]];
  const hex = colorInput.value;
  const replacement = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16), 255];
  if (target[0] === replacement[0] && target[1] === replacement[1] && target[2] === replacement[2] && target[3] === 255) return;
  const tolerance = 24;
  const matches = (i) => Math.abs(data[i] - target[0]) <= tolerance &&
    Math.abs(data[i + 1] - target[1]) <= tolerance &&
    Math.abs(data[i + 2] - target[2]) <= tolerance && Math.abs(data[i + 3] - target[3]) <= tolerance;
  const stack = [sy * width + sx];
  const seen = new Uint8Array(width * height);
  while (stack.length) {
    const pixel = stack.pop();
    if (seen[pixel]) continue;
    seen[pixel] = 1;
    const i = pixel * 4;
    if (!matches(i)) continue;
    data[i] = replacement[0]; data[i + 1] = replacement[1]; data[i + 2] = replacement[2]; data[i + 3] = replacement[3];
    const x = pixel % width, y = Math.floor(pixel / width);
    if (x > 0) stack.push(pixel - 1);
    if (x < width - 1) stack.push(pixel + 1);
    if (y > 0) stack.push(pixel - width);
    if (y < height - 1) stack.push(pixel + width);
  }
  // Store the filled canvas as a raster command so undo/redo and later drawing preserve it.
  const rasterCanvas = document.createElement("canvas");
  rasterCanvas.width = width; rasterCanvas.height = height;
  rasterCanvas.getContext("2d").putImageData(image, 0, 0);
  const rasterImage = rasterCanvas.getContext("2d").getImageData(0, 0, width, height);
  commitCommand({ type: "raster", imageData: rasterImage });
}

function pointerDown(e) {
  e.preventDefault();
  if (e.isPrimary === false) return;
  if (!timerStarted || roundFinished) { blockedDrawHint(); return; } // só desenha com a rodada em andamento
  const pos = getPos(e);
  if (tool === "picker") {
    const px = Math.max(0, Math.min(canvas.width - 1, Math.floor(pos.x * dpr)));
    const py = Math.max(0, Math.min(canvas.height - 1, Math.floor(pos.y * dpr)));
    const rgba = ctx.getImageData(px, py, 1, 1).data;
    colorInput.value = "#" + [rgba[0], rgba[1], rgba[2]].map(v => v.toString(16).padStart(2, "0")).join("");
    colorPreview.style.background = colorInput.value;
    document.querySelectorAll("[data-color]").forEach(b => b.classList.toggle("selected", b.dataset.color.toLowerCase() === colorInput.value.toLowerCase()));
    document.querySelector('[data-tool="bucket"]').click();
    return;
  }
  if (tool === "bucket") {
    floodFill(pos);
    return;
  }
  if (tool === "select") {
    selectedShape = hitShape(pos);
    movingShape = !!selectedShape;
    if (movingShape) {
      moveOffset = { x: pos.x - selectedShape.a.x, y: pos.y - selectedShape.a.y };
      moveOriginal = JSON.parse(JSON.stringify(selectedShape));
      movePointerStart = { ...pos };
      canvas.style.cursor = "grabbing";
    } else {
      canvas.style.cursor = "default";
    }
    render();
    canvas.setPointerCapture(e.pointerId);
    return;
  }

  drawing = true;
  start = pos;
  const type = tool;
  currentCommand = {
    type, color: colorInput.value,
    size: type === "eraser" ? Math.max(12, Number(sizeInput.value) * 3) : Number(sizeInput.value),
    points: type === "pen" || type === "eraser" ? [pos] : undefined,
    a: ["line", "rect", "circle"].includes(type) ? { ...pos } : undefined,
    b: ["line", "rect", "circle"].includes(type) ? { ...pos } : undefined
  };
  canvas.setPointerCapture(e.pointerId);
  if (["line", "rect", "circle"].includes(type)) {
    preview = currentCommand;
    render();
  } else {
    render();
  }
}

function pointerMove(e) {
  if (e.isPrimary === false) return;
  const pos = getPos(e);
  if (tool === "select" && movingShape && selectedShape && moveOriginal) {
    // Translate the selected shape relative to where the drag began.
    const tx = pos.x - movePointerStart.x;
    const ty = pos.y - movePointerStart.y;
    selectedShape.a = { x: moveOriginal.a.x + tx, y: moveOriginal.a.y + ty };
    selectedShape.b = { x: moveOriginal.b.x + tx, y: moveOriginal.b.y + ty };
    render();
    return;
  }
  if (!drawing || !currentCommand) return;
  e.preventDefault();
  if (currentCommand.type === "pen" || currentCommand.type === "eraser") {
    const group = (e.getCoalescedEvents && e.getCoalescedEvents()) || [];
    if (group.length > 1) group.forEach(ev => currentCommand.points.push(getPos(ev)));
    else currentCommand.points.push(pos);
    render();
  } else {
    currentCommand.b = pos;
    preview = currentCommand;
    render();
  }
}

function finishPointer(e) {
  if (e.isPrimary === false) return;
  if (tool === "select" && movingShape && selectedShape) {
    movingShape = false;
    moveOriginal = null;
    movePointerStart = null;
    canvas.style.cursor = "default";
    return;
  }
  if (!drawing || !currentCommand) return;
  if (["line", "rect", "circle"].includes(currentCommand.type)) {
    currentCommand.b = getPos(e);
    preview = null;
  } else if (currentCommand.type === "pen" && currentCommand.points && currentCommand.points.length >= 8) {
    const pts = currentCommand.points;
    const first = pts[0], last = pts[pts.length - 1];
    const dx = last.x - first.x, dy = last.y - first.y;
    const length = Math.hypot(dx, dy);
    const minX = Math.min(...pts.map(p => p.x)), maxX = Math.max(...pts.map(p => p.x));
    const minY = Math.min(...pts.map(p => p.y)), maxY = Math.max(...pts.map(p => p.y));
    const width = maxX - minX, height = maxY - minY;
    // Convert near-straight pencil strokes into editable line shapes.
    if (length > 18) {
      const maxDeviation = Math.max(...pts.map(p => Math.abs((p.x-first.x)*dy - (p.y-first.y)*dx) / length));
      if (maxDeviation <= Math.max(5, length * 0.035)) {
        currentCommand.type = "line"; currentCommand.a = {x:first.x,y:first.y}; currentCommand.b = {x:last.x,y:last.y}; delete currentCommand.points;
      }
    }
  }
  commands.push(currentCommand);
  currentCommand = null;
  drawing = false;
  redoCommands = [];
  ctx.globalCompositeOperation = "source-over";
  updateHistoryButtons();
  render();
}

canvas.addEventListener("pointerdown", pointerDown);
canvas.addEventListener("pointermove", pointerMove);
canvas.addEventListener("pointerup", finishPointer);
canvas.addEventListener("pointercancel", finishPointer);

let blockedHintTimer = null;
function blockedDrawHint() {
  let el = document.getElementById("drawToast");
  if (!el) { el = document.createElement("div"); el.id = "drawToast"; el.className = "draw-toast"; document.body.appendChild(el); }
  el.textContent = "✋ Inicie a rodada para desenhar";
  el.classList.add("show");
  clearTimeout(blockedHintTimer);
  blockedHintTimer = setTimeout(() => el.classList.remove("show"), 1600);
}
let silentTool = false;
function forcePen() { const b = document.querySelector('[data-tool="pen"]'); if (!b || tool === "pen") return; silentTool = true; b.click(); silentTool = false; }
document.querySelectorAll("[data-tool]").forEach(button => {
  button.addEventListener("click", () => {
    tool = button.dataset.tool;
    document.querySelectorAll("[data-tool]").forEach(b => b.classList.toggle("active", b === button));
    toolName.textContent = "Ferramenta: " + names[tool];
    canvas.style.cursor = tool === "bucket" ? "cell" : tool === "select" ? "default" : tool === "picker" ? "copy" : "crosshair";
    selectedShape = null;
    render();
  });
});

document.querySelectorAll("[data-color]").forEach(button => {
  button.addEventListener("click", () => {
    colorInput.value = button.dataset.color;
    colorPreview.style.background = colorInput.value;
    document.querySelectorAll("[data-color]").forEach(b => b.classList.toggle("selected", b === button));
    render();
  });
});
colorInput.addEventListener("input", () => {
  colorPreview.style.background = colorInput.value;
  document.querySelectorAll("[data-color]").forEach(b => b.classList.toggle("selected", b.dataset.color.toLowerCase() === colorInput.value.toLowerCase()));
});

sizeInput.addEventListener("input", () => { sizeValue.textContent = sizeInput.value + " px"; });

document.getElementById("undo").addEventListener("click", () => {
  if (!commands.length) return;
  redoCommands.push(commands.pop());
  selectedShape = null;
  updateHistoryButtons(); render();
});
document.getElementById("redo").addEventListener("click", () => {
  if (!redoCommands.length) return;
  commands.push(redoCommands.pop());
  updateHistoryButtons(); render();
});

// drawingArchive guarda os desenhos limpos automaticamente (para o vídeo); lastDrawingPNG, a última imagem (para o PNG).
const drawingArchive = [];
let lastDrawingPNG = null;
function clearBoard(archive = false, info = null) {
  if (archive) { autoInk(); forcePen(); }
  if (archive && commands.length) {
    drawingArchive.push(commands.slice());
    try { lastDrawingPNG = canvas.toDataURL("image/png"); } catch (err) { lastDrawingPNG = null; }
    if (info) gameDrawings.push(Object.assign({ png: lastDrawingPNG, cmds: commands.slice(), at: new Date() }, info));
  }
  drawing = false;
  commands = [];
  redoCommands = [];
  selectedShape = null;
  preview = null;
  currentCommand = null;
  const rect = canvas.getBoundingClientRect();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = currentBoardColor();
  ctx.fillRect(0, 0, rect.width, rect.height);
  updateHistoryButtons();
  render();
}
document.getElementById("clear").addEventListener("click", () => {
  if (currentRound && timerStarted && !roundFinished) {
    currentRound.clearEvents = currentRound.clearEvents || [];
    currentRound.clearEvents.push({ at: new Date(), commandCount: commands.length });
  }
  clearBoard(false);
});

document.getElementById("save").addEventListener("click", () => {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  const exportCtx = exportCanvas.getContext("2d");
  exportCtx.fillStyle = currentBoardColor();
  exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  exportCtx.drawImage(canvas, 0, 0);
  const link = document.createElement("a");
  const dataUrl = (!commands.length && lastDrawingPNG) ? lastDrawingPNG : exportCanvas.toDataURL("image/png");
  if (matchMedia("(pointer:coarse)").matches) { fetch(dataUrl).then(r => r.blob()).then(b => saveBlob(b, "minha-lousa.png")); return; }
  link.download = "minha-lousa.png";
  link.href = dataUrl;
  link.click();
});

// Exporta a sequência de construção em vídeo WebM, usando o histórico de comandos.
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
