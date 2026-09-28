const R2_BASE = "https://pub-52a26396ab53445e894e45f34beba90e.r2.dev";
const BATCH_SIZE = 40;

const DAY_CONFIG = {
  sabtu: { path: "HUT MUSISABE ke-37/Sabtu, 26 Sept. 2026", date: "Sabtu, 26 September 2026" },
  minggu: { path: "HUT MUSISABE ke-37/Minggu, 27 Sept. 2026", date: "Minggu, 27 September 2026" }
};

const params = new URLSearchParams(location.search);
const dayKey = DAY_CONFIG[params.get("day")] ? params.get("day") : "sabtu";
const config = DAY_CONFIG[dayKey];

function encodePath(path) { return path.split("/").filter(Boolean).map(encodeURIComponent).join("/"); }
function fileUrl(fileName) { return `${R2_BASE}/${encodePath(config.path)}/${encodeURIComponent(fileName)}`; }

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
let photos = [], rendered = 0, currentIndex = 0, rendering = false;

async function loadManifest() {
  const url = `${R2_BASE}/${encodePath(config.path)}/gallery.json?v=${Date.now()}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const result = Array.isArray(data) ? data : data.photos;
  if (!Array.isArray(result)) throw new Error("gallery.json tidak valid");
  return result.filter(name => /\.(jpe?g|png|webp|gif|avif)$/i.test(String(name)));
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
    img.src = fileUrl(fileName);
    img.alt = fileName;
    img.loading = "lazy";
    img.decoding = "async";
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
    statusEl.textContent = `Menampilkan ${rendered} dari ${photos.length} foto...`;
  }
}

function openLightbox(index) {
  currentIndex = (index + photos.length) % photos.length;
  const fileName = photos[currentIndex];
  lbImage.src = fileUrl(fileName);
  lbName.textContent = fileName;
  lbPosition.textContent = `${currentIndex + 1} / ${photos.length}`;
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
function previousPhoto(){ openLightbox(currentIndex - 1); }
function nextPhoto(){ openLightbox(currentIndex + 1); }

async function downloadCurrentPhoto() {
  const fileName = photos[currentIndex];
  const url = fileUrl(fileName);
  lbDownload.disabled = true;
  lbDownload.textContent = "Downloading...";

  try {
    const response = await fetch(url, { mode: "cors", cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
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

document.addEventListener("keydown", (event) => {
  if (!lightbox.classList.contains("open")) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") previousPhoto();
  if (event.key === "ArrowRight") nextPhoto();
});

let touchStartX = 0;
lightbox.addEventListener("touchstart", (event) => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
lightbox.addEventListener("touchend", (event) => {
  const distance = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(distance) < 45) return;
  if (distance > 0) previousPhoto();
  else nextPhoto();
}, { passive: true });

const observer = new IntersectionObserver((entries) => {
  if (entries.some(entry => entry.isIntersecting)) renderBatch();
}, { rootMargin: "700px 0px" });

async function init() {
  try {
    photos = await loadManifest();
    countEl.textContent = `${photos.length.toLocaleString("id-ID")} foto`;

    if (!photos.length) {
      statusEl.textContent = "Belum ada foto di album ini.";
      return;
    }

    renderBatch();
    observer.observe(sentinel);
  } catch (error) {
    console.error(error);
    countEl.textContent = "0 foto";
    statusEl.textContent = "Galeri belum tersedia. Pastikan foto dan gallery.json sudah ada di folder R2.";
  }
}
init();
