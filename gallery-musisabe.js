const CONFIG = {
  R2_PUBLIC_BASE_URL: "https://pub-52a26396ab53445e894e45f34beba90e.r2.dev",
  ALBUM_PATH: "HUT MUSISABE ke-37/Sabtu, 26 Sept. 2026",
  MANIFEST_FILE: "gallery.json",
  BATCH_SIZE: 40
};

const cleanBase = (value) => String(value || "").replace(/\/+$/, "");

const cleanPath = (value) =>
  String(value || "")
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");

const baseUrl = cleanBase(CONFIG.R2_PUBLIC_BASE_URL);
const albumPath = cleanPath(CONFIG.ALBUM_PATH);

const fileUrl = (fileName) =>
  `${baseUrl}/${albumPath}/${encodeURIComponent(fileName)}`;

const grid = document.getElementById("photoGrid");
const loadingText = document.getElementById("loadingText");
const loadSentinel = document.getElementById("loadSentinel");
const albumCount = document.getElementById("albumCount");
const albumCountTop = document.getElementById("albumCountTop");

const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxName = document.getElementById("lightboxName");
const lightboxPosition = document.getElementById("lightboxPosition");
const lightboxClose = document.getElementById("lightboxClose");
const lightboxPrev = document.getElementById("lightboxPrev");
const lightboxNext = document.getElementById("lightboxNext");
const downloadOriginal = document.getElementById("downloadOriginal");

let photos = [];
let rendered = 0;
let currentIndex = 0;
let rendering = false;

async function loadManifest() {
  const manifestUrl =
    `${baseUrl}/${albumPath}/${encodeURIComponent(CONFIG.MANIFEST_FILE)}?v=${Date.now()}`;

  const response = await fetch(manifestUrl, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`gallery.json tidak bisa dibaca (HTTP ${response.status})`);
  }

  const data = await response.json();
  const result = Array.isArray(data) ? data : data.photos;

  if (!Array.isArray(result)) {
    throw new Error("Format gallery.json tidak valid.");
  }

  return result.filter((name) =>
    /\.(jpe?g|png|webp|gif|avif)$/i.test(String(name))
  );
}

function renderBatch() {
  if (rendering || rendered >= photos.length) return;
  rendering = true;

  const batch = photos.slice(rendered, rendered + CONFIG.BATCH_SIZE);
  const fragment = document.createDocumentFragment();

  batch.forEach((fileName, localIndex) => {
    const absoluteIndex = rendered + localIndex;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "photo-card";
    button.setAttribute("aria-label", `Buka ${fileName}`);

    const img = document.createElement("img");
    img.src = fileUrl(fileName);
    img.alt = fileName;
    img.loading = "lazy";
    img.decoding = "async";

    img.addEventListener("error", () => {
      button.style.display = "none";
    });

    button.appendChild(img);
    button.addEventListener("click", () => openLightbox(absoluteIndex));
    fragment.appendChild(button);
  });

  grid.appendChild(fragment);
  rendered += batch.length;
  rendering = false;

  if (rendered >= photos.length) {
    loadingText.textContent = "Semua foto sudah ditampilkan.";
    observer.disconnect();
  } else {
    loadingText.textContent = `Menampilkan ${rendered} dari ${photos.length} foto...`;
  }
}

function openLightbox(index) {
  if (!photos.length) return;

  currentIndex = (index + photos.length) % photos.length;

  const fileName = photos[currentIndex];
  const url = fileUrl(fileName);

  lightboxImage.src = url;
  lightboxName.textContent = fileName;
  lightboxPosition.textContent = `${currentIndex + 1} / ${photos.length}`;

  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lightbox-lock");
}

function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImage.src = "";
  document.body.classList.remove("lightbox-lock");
}

function previousPhoto() {
  openLightbox(currentIndex - 1);
}

function nextPhoto() {
  openLightbox(currentIndex + 1);
}

async function downloadCurrentPhoto() {
  const fileName = photos[currentIndex];
  const url = fileUrl(fileName);

  downloadOriginal.disabled = true;
  downloadOriginal.textContent = "Downloading...";

  try {
    const response = await fetch(url, {
      mode: "cors",
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Download gagal: ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    a.style.display = "none";

    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 3000);

  } catch (error) {
    console.error("Download error:", error);
    alert("Download gagal. Silakan coba lagi.");
  } finally {
    downloadOriginal.disabled = false;
    downloadOriginal.textContent = "Download Original";
  }
}
  
lightboxClose.addEventListener("click", closeLightbox);
lightboxPrev.addEventListener("click", previousPhoto);
lightboxNext.addEventListener("click", nextPhoto);
downloadOriginal.addEventListener("click", downloadCurrentPhoto);

document.addEventListener("keydown", (event) => {
  if (!lightbox.classList.contains("open")) return;

  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") previousPhoto();
  if (event.key === "ArrowRight") nextPhoto();
});

let touchStartX = 0;

lightbox.addEventListener(
  "touchstart",
  (event) => {
    touchStartX = event.changedTouches[0].clientX;
  },
  { passive: true }
);

lightbox.addEventListener(
  "touchend",
  (event) => {
    const touchEndX = event.changedTouches[0].clientX;
    const distance = touchEndX - touchStartX;

    if (Math.abs(distance) < 45) return;
    if (distance > 0) previousPhoto();
    else nextPhoto();
  },
  { passive: true }
);

const observer = new IntersectionObserver(
  (entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      renderBatch();
    }
  },
  { rootMargin: "700px 0px" }
);

async function init() {
  try {
    photos = await loadManifest();

    albumCount.textContent = `${photos.length.toLocaleString("id-ID")} foto`;
    albumCountTop.textContent = `${photos.length.toLocaleString("id-ID")} foto`;

    if (!photos.length) {
      loadingText.textContent = "Belum ada foto di album ini.";
      return;
    }

    renderBatch();
    observer.observe(loadSentinel);
  } catch (error) {
    console.error(error);
    loadingText.className = "gallery-error";
    loadingText.textContent =
      "Galeri belum dapat dimuat. Periksa gallery.json, Public URL R2, dan CORS.";
  }
}

init();
