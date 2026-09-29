const R2_BASE = "https://ceritadankita-photos.septinushaloho.workers.dev";
const PREVIEW_LIMIT = 8;

const DAYS = {
  sabtu: {
    path: "HUT MUSISABE ke-37/Sabtu, 26 Sept. 2026",
    gridId: "previewSabtu",
    countId: "countSabtu",
    fallback: ["DSC07548.JPG","DSC07555.JPG","DSC07564.JPG","DSC07565.JPG","DSC07566.JPG","DSC07567.JPG","DSC07568.JPG","DSC07569.JPG","DSC07570.JPG","DSC07571.JPG","DSC07572.JPG","DSC07574.JPG"]
  },
  minggu: {
    path: "HUT MUSISABE ke-37/Minggu, 27 Sept. 2026",
    gridId: "previewMinggu",
    countId: "countMinggu",
    fallback: ["DSC02058.JPG","DSC02077.JPG","DSC02195.JPG","DSC02197.JPG"]
  }
};

function encodePath(path) {
  return path.split("/").filter(Boolean).map(encodeURIComponent).join("/");
}
function originalUrl(path, fileName) {
  return `${R2_BASE}/${encodePath(path)}/${encodeURIComponent(fileName)}`;
}
function previewUrl(path, fileName) {
  return `${R2_BASE}/${encodePath(path)}/preview/${encodeURIComponent(fileName)}`;
}
async function loadManifest(path) {
  const url = `${R2_BASE}/${encodePath(path)}/gallery.json?v=${Date.now()}`;
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const photos = Array.isArray(data) ? data : data.photos;
    if (!Array.isArray(photos)) throw new Error("gallery.json tidak valid");
    return photos.filter(name => /\.(jpe?g|png|webp|gif|avif)$/i.test(String(name)));
  } catch (error) {
    console.warn("Manifest gagal dibaca; memakai daftar cadangan:", path, error);
    return null;
  }
}
function setPreviewWithFallback(img, path, fileName) {
  img.src = previewUrl(path, fileName);
  img.onerror = () => {
    img.onerror = null;
    img.src = originalUrl(path, fileName);
  };
}
async function renderDay(dayKey) {
  const config = DAYS[dayKey];
  const grid = document.getElementById(config.gridId);
  const count = document.getElementById(config.countId);
  if (!grid || !count) return;

  grid.innerHTML = "";
  count.textContent = "Memuat...";

  const manifestPhotos = await loadManifest(config.path);
  const photos = manifestPhotos && manifestPhotos.length ? manifestPhotos : config.fallback;
  count.textContent = `${photos.length.toLocaleString("id-ID")} foto`;

  if (!photos.length) {
    grid.innerHTML = '<div class="preview-empty">Belum ada foto untuk hari ini.</div>';
    return;
  }

  photos.slice(0, PREVIEW_LIMIT).forEach(fileName => {
    const card = document.createElement("div");
    card.className = "preview-card";
    const img = document.createElement("img");
    img.alt = fileName;
    img.loading = "lazy";
    img.decoding = "async";
    setPreviewWithFallback(img, config.path, fileName);
    card.appendChild(img);
    grid.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderDay("sabtu");
  renderDay("minggu");
});
