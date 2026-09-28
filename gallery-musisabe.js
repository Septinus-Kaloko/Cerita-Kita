const R2_BASE = "https://pub-52a26396ab53445e894e45f34beba90e.r2.dev";
const PREVIEW_LIMIT = 8;

const DAYS = {
  sabtu: {
    path: "HUT MUSISABE ke-37/Sabtu, 26 Sept. 2026",
    grid: "previewSabtu",
    count: "countSabtu"
  },
  minggu: {
    path: "HUT MUSISABE ke-37/Minggu, 27 Sept. 2026",
    grid: "previewMinggu",
    count: "countMinggu"
  }
};

function encodePath(path) {
  return path.split("/").filter(Boolean).map(encodeURIComponent).join("/");
}
function fileUrl(path, fileName) {
  return `${R2_BASE}/${encodePath(path)}/${encodeURIComponent(fileName)}`;
}
async function loadManifest(path) {
  const url = `${R2_BASE}/${encodePath(path)}/gallery.json?v=${Date.now()}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const photos = Array.isArray(data) ? data : data.photos;
  if (!Array.isArray(photos)) throw new Error("gallery.json tidak valid");
  return photos.filter(name => /\.(jpe?g|png|webp|gif|avif)$/i.test(String(name)));
}
async function renderDay(dayKey) {
  const config = DAYS[dayKey];
  const grid = document.getElementById(config.grid);
  const count = document.getElementById(config.count);

  try {
    const photos = await loadManifest(config.path);
    count.textContent = `${photos.length.toLocaleString("id-ID")} foto`;

    if (!photos.length) {
      grid.innerHTML = '<div class="preview-empty">Belum ada foto untuk hari ini.</div>';
      return;
    }

    photos.slice(0, PREVIEW_LIMIT).forEach((fileName) => {
      const card = document.createElement("div");
      card.className = "preview-card";
      const img = document.createElement("img");
      img.src = fileUrl(config.path, fileName);
      img.alt = fileName;
      img.loading = "lazy";
      img.decoding = "async";
      card.appendChild(img);
      grid.appendChild(card);
    });
  } catch (error) {
    console.warn(`${dayKey} belum dapat dimuat`, error);
    count.textContent = "Belum tersedia";
    grid.innerHTML = '<div class="preview-empty">Galeri hari ini belum tersedia. Upload foto dan gallery.json ke folder R2 ini.</div>';
  }
}
renderDay("sabtu");
renderDay("minggu");
