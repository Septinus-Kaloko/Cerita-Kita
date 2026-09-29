const R2_BASE = "https://ceritadankita-photos.septinushaloho.workers.dev";
const PREVIEW_LIMIT = 8;

const DAYS = {
  sabtu: {
    path: "HUT MUSISABE ke-37/Sabtu, 26 Sept. 2026",
    gridId: "previewSabtu",
    countId: "countSabtu"
  },
  minggu: {
    path: "HUT MUSISABE ke-37/Minggu, 27 Sept. 2026",
    gridId: "previewMinggu",
    countId: "countMinggu"
  }
};

function encodePath(path) {
  return path
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
}

function originalUrl(path, fileName) {
  return `${R2_BASE}/${encodePath(path)}/${encodeURIComponent(fileName)}`;
}

function previewUrl(path, fileName) {
  return `${R2_BASE}/${encodePath(path)}/preview/${encodeURIComponent(fileName)}`;
}

function extractDirectImageNames(keys, path) {
  const prefix = `${path}/`;

  return [...new Set(
    keys
      .filter(key => typeof key === "string" && key.startsWith(prefix))
      .map(key => key.slice(prefix.length))
      // Hanya file original yang langsung berada di folder hari.
      // Isi folder preview/ otomatis tidak ikut dihitung.
      .filter(relative =>
        relative &&
        !relative.includes("/") &&
        /\.(jpe?g|png|webp|gif|avif)$/i.test(relative)
      )
  )].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  );
}

async function loadFromR2List(path) {
  const prefix = `${path}/`;
  const url = `${R2_BASE}/list?prefix=${encodeURIComponent(prefix)}&v=${Date.now()}`;

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`List R2 gagal: HTTP ${response.status}`);
  }

  const keys = await response.json();

  if (!Array.isArray(keys)) {
    throw new Error("Respons /list bukan array");
  }

  return extractDirectImageNames(keys, path);
}

async function loadFromManifest(path) {
  const url = `${R2_BASE}/${encodePath(path)}/gallery.json?v=${Date.now()}`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Manifest gagal: HTTP ${response.status}`);
  }

  const data = await response.json();
  const photos = Array.isArray(data) ? data : data.photos;

  if (!Array.isArray(photos)) {
    throw new Error("gallery.json tidak valid");
  }

  return [...new Set(
    photos.filter(name =>
      /\.(jpe?g|png|webp|gif|avif)$/i.test(String(name))
    )
  )];
}

async function loadPhotoNames(path) {
  try {
    const photos = await loadFromR2List(path);

    if (photos.length) {
      return photos;
    }

    throw new Error("List R2 kosong");
  } catch (error) {
    console.warn("List R2 gagal, mencoba gallery.json:", error);
    return loadFromManifest(path);
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

  try {
    const photos = await loadPhotoNames(config.path);

    count.textContent = `${photos.length.toLocaleString("id-ID")} foto`;

    if (!photos.length) {
      grid.innerHTML =
        '<div class="preview-empty">Belum ada foto untuk hari ini.</div>';
      return;
    }

    const fragment = document.createDocumentFragment();

    photos.slice(0, PREVIEW_LIMIT).forEach(fileName => {
      const card = document.createElement("div");
      card.className = "preview-card";

      const img = document.createElement("img");
      img.alt = fileName;
      img.loading = "lazy";
      img.decoding = "async";

      setPreviewWithFallback(img, config.path, fileName);

      card.appendChild(img);
      fragment.appendChild(card);
    });

    grid.appendChild(fragment);
  } catch (error) {
    console.error(`Gagal memuat ${dayKey}:`, error);
    count.textContent = "Tidak tersedia";
    grid.innerHTML =
      '<div class="preview-empty">Galeri sedang tidak dapat dimuat. Silakan refresh halaman.</div>';
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderDay("sabtu");
  renderDay("minggu");
});
