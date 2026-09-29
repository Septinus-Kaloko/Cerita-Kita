const R2_BASE = "https://ceritadankita-photos.septinushaloho.workers.dev";
const BATCH_SIZE = 8;

const DAY_CONFIG = {
  sabtu: {
    path: "HUT MUSISABE ke-37/Sabtu, 26 Sept. 2026",
    date: "Sabtu, 26 September 2026"
  },
  minggu: {
    path: "HUT MUSISABE ke-37/Minggu, 27 Sept. 2026",
    date: "Minggu, 27 September 2026"
  }
};

const params = new URLSearchParams(location.search);
const requestedDay = params.get("day");
const dayKey = DAY_CONFIG[requestedDay] ? requestedDay : "sabtu";
const config = DAY_CONFIG[dayKey];

function encodePath(path) {
  return path
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
}

function originalUrl(fileName) {
  return `${R2_BASE}/${encodePath(config.path)}/${encodeURIComponent(fileName)}`;
}

function previewUrl(fileName) {
  return `${R2_BASE}/${encodePath(config.path)}/preview/${encodeURIComponent(fileName)}`;
}

function extractDirectImageNames(keys, path) {
  const prefix = `${path}/`;

  return [...new Set(
    keys
      .filter(key => typeof key === "string" && key.startsWith(prefix))
      .map(key => key.slice(prefix.length))
      // Hanya original di root folder hari.
      // preview/... tidak ikut dihitung sebagai foto tambahan.
      .filter(relative =>
        relative &&
        !relative.includes("/") &&
        /\.(jpe?g|png|webp|gif|avif)$/i.test(relative)
      )
  )].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
  );
}

async function loadFromR2List() {
  const prefix = `${config.path}/`;
  const url = `${R2_BASE}/list?prefix=${encodeURIComponent(prefix)}&v=${Date.now()}`;

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`List R2 gagal: HTTP ${response.status}`);
  }

  const keys = await response.json();

  if (!Array.isArray(keys)) {
    throw new Error("Respons /list bukan array");
  }

  return extractDirectImageNames(keys, config.path);
}

async function loadFromManifest() {
  const url = `${R2_BASE}/${encodePath(config.path)}/gallery.json?v=${Date.now()}`;
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

async function loadPhotoNames() {
  try {
    const photos = await loadFromR2List();

    if (photos.length) {
      return photos;
    }

    throw new Error("List R2 kosong");
  } catch (error) {
    console.warn("List R2 gagal, mencoba gallery.json:", error);
    return loadFromManifest();
  }
}

const grid = document.getElementById("galleryGrid");
const statusEl = document.getElementById("galleryStatus");
const sentinel = document.getElementById("gallerySentinel");
const countEl = document.getElementById("galleryCount");
const dateEl = document.getElementById("galleryDate");

const lightbox = document.getElementById("lightbox");
const lbImage = document.getElementById("lbImage");
const lbName = document.getElementById("lbName");
const lbPosition = document.getElementById("lbPosition");
const lbClose = document.getElementById("lbClose");
const lbPrev = document.getElementById("lbPrev");
const lbNext = document.getElementById("lbNext");
const lbDownload = document.getElementById("lbDownload");

dateEl.textContent = config.date;

let photos = [];
let rendered = 0;
let currentIndex = 0;
let rendering = false;

function setPreviewWithFallback(img, fileName) {
  img.src = previewUrl(fileName);

  img.onerror = () => {
    img.onerror = null;
    img.src = originalUrl(fileName);
  };
}

function renderBatch() {
  if (rendering || rendered >= photos.length) return;

  rendering = true;

  const batch = photos.slice(rendered, rendered + BATCH_SIZE);
  const fragment = document.createDocumentFragment();

  batch.forEach((fileName, localIndex) => {
    const index = rendered + localIndex;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "g-card";

    const img = document.createElement("img");
    img.alt = fileName;
    img.loading = "lazy";
    img.decoding = "async";

    setPreviewWithFallback(img, fileName);

    button.appendChild(img);
    button.addEventListener("click", () => openLightbox(index));

    fragment.appendChild(button);
  });

  grid.appendChild(fragment);

  rendered += batch.length;
  rendering = false;

  if (rendered >= photos.length) {
    statusEl.textContent = "Semua foto sudah ditampilkan.";
    observer.disconnect();
  } else {
    statusEl.textContent =
      `Menampilkan ${rendered.toLocaleString("id-ID")} dari ${photos.length.toLocaleString("id-ID")} foto...`;
  }
}

function openLightbox(index) {
  if (!photos.length) return;

  currentIndex = (index + photos.length) % photos.length;
  const fileName = photos[currentIndex];

  lbImage.onerror = () => {
    lbImage.onerror = null;
    lbImage.src = originalUrl(fileName);
  };

  // Preview ringan untuk melihat foto besar.
  // Jika preview tidak ada, otomatis pakai original.
  lbImage.src = previewUrl(fileName);

  lbName.textContent = fileName;
  lbPosition.textContent =
    `${(currentIndex + 1).toLocaleString("id-ID")} / ${photos.length.toLocaleString("id-ID")}`;

  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lb-lock");
}

function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  lbImage.src = "";
  document.body.classList.remove("lb-lock");
}

function previousPhoto() {
  openLightbox(currentIndex - 1);
}

function nextPhoto() {
  openLightbox(currentIndex + 1);
}

async function downloadCurrentPhoto() {
  if (!photos.length) return;

  const fileName = photos[currentIndex];
  const url = originalUrl(fileName);

  lbDownload.disabled = true;
  lbDownload.textContent = "Downloading...";

  try {
    const response = await fetch(url, {
      mode: "cors",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
  } catch (error) {
    console.error("Download gagal:", error);
    alert("Download gagal. Silakan coba lagi.");
  } finally {
    lbDownload.disabled = false;
    lbDownload.textContent = "Download Original";
  }
}

lbClose.addEventListener("click", closeLightbox);
lbPrev.addEventListener("click", previousPhoto);
lbNext.addEventListener("click", nextPhoto);
lbDownload.addEventListener("click", downloadCurrentPhoto);

document.addEventListener("keydown", event => {
  if (!lightbox.classList.contains("open")) return;

  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") previousPhoto();
  if (event.key === "ArrowRight") nextPhoto();
});

let touchStartX = 0;

lightbox.addEventListener(
  "touchstart",
  event => {
    touchStartX = event.changedTouches[0].clientX;
  },
  { passive: true }
);

lightbox.addEventListener(
  "touchend",
  event => {
    const distance =
      event.changedTouches[0].clientX - touchStartX;

    if (Math.abs(distance) < 45) return;

    if (distance > 0) previousPhoto();
    else nextPhoto();
  },
  { passive: true }
);

const observer = new IntersectionObserver(
  entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      renderBatch();
    }
  },
  { rootMargin: "500px 0px" }
);

async function init() {
  statusEl.textContent = "Memuat daftar foto...";

  try {
    photos = await loadPhotoNames();

    countEl.textContent =
      `${photos.length.toLocaleString("id-ID")} foto`;

    if (!photos.length) {
      statusEl.textContent = "Belum ada foto di album ini.";
      return;
    }

    renderBatch();
    observer.observe(sentinel);
  } catch (error) {
    console.error("Galeri gagal dimuat:", error);

    countEl.textContent = "0 foto";
    statusEl.textContent =
      "Galeri sedang tidak dapat dimuat. Silakan refresh halaman.";
  }
}

init();
