
/* =========================================================
   CERITA & KITA - GALLERY SCRIPT
   Cloudflare R2 gallery + existing website functions
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  /* MOBILE MENU */
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    document.querySelectorAll(".nav-links a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* PORTFOLIO FILTER */
  const filterButtons = document.querySelectorAll(".filter-btn");
  const portfolioItems = document.querySelectorAll(".portfolio-item");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const filter = button.dataset.filter;

      portfolioItems.forEach((item) => {
        const category = item.dataset.category;
        item.style.display =
          filter === "all" || category === filter ? "block" : "none";
      });
    });
  });

  /* WHATSAPP FORM */
  const contactForm = document.getElementById("contactForm");

  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const name = document.getElementById("name")?.value.trim() || "";
      const phone = document.getElementById("phone")?.value.trim() || "";
      const service = document.getElementById("service")?.value || "";
      const date = document.getElementById("date")?.value || "";
      const message = document.getElementById("message")?.value.trim() || "";

      const whatsappNumber = "6282277667681";

      const text = [
        "Halo Cerita & Kita,",
        "",
        `Nama: ${name}`,
        `Nomor WhatsApp: ${phone}`,
        `Layanan: ${service}`,
        `Tanggal acara: ${date || "-"}`,
        `Detail kebutuhan: ${message || "-"}`,
        "",
        "Mohon informasi lebih lanjut mengenai paket dan ketersediaannya."
      ].join("\n");

      const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
      window.open(url, "_blank", "noopener");
    });
  }

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* =========================================================
     CLOUDFLARE R2 GALLERY CONFIG
     ========================================================= */

  const GALLERY_CONFIG = {
    R2_PUBLIC_BASE_URL: "PASTE_R2_PUBLIC_URL_DI_SINI",
    ALBUM_PATH: "HUT MUSISABE ke-37/Sabtu, 26 Sept. 2026",
    MANIFEST_FILE: "gallery.json",
    PER_PAGE: 30,
    TITLE: "HUT MUSISABE ke-37",
    SUBTITLE: "Sabtu, 26 September 2026"
  };

  const FALLBACK_PHOTOS = [
    "DSC07548.JPG",
    "DSC07555.JPG",
    "DSC07564.JPG",
    "DSC07565.JPG",
    "DSC07566.JPG",
    "DSC07567.JPG",
    "DSC07568.JPG",
    "DSC07569.JPG",
    "DSC07570.JPG",
    "DSC07571.JPG",
    "DSC07572.JPG",
    "DSC07574.JPG"
  ];

  const cleanBase = (value) => String(value || "").replace(/\/+$/, "");
  const cleanPath = (value) => String(value || "")
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");

  const baseUrl = cleanBase(GALLERY_CONFIG.R2_PUBLIC_BASE_URL);
  const albumPath = cleanPath(GALLERY_CONFIG.ALBUM_PATH);

  function fileUrl(fileName) {
    return `${baseUrl}/${albumPath}/${encodeURIComponent(fileName)}`;
  }

  function injectGalleryStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .client-gallery-section{padding:100px 0;background:#fffdfb}
      .client-gallery-head{display:flex;justify-content:space-between;align-items:end;gap:24px;margin-bottom:32px}
      .client-gallery-head p{margin-top:10px}
      .gallery-count{font-size:.9rem;color:#736b65;white-space:nowrap}
      .client-gallery-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
      .client-gallery-card{position:relative;aspect-ratio:1/1;border:0;padding:0;overflow:hidden;border-radius:16px;background:#f7f1eb;cursor:zoom-in}
      .client-gallery-card img{width:100%;height:100%;display:block;object-fit:cover;transition:transform .3s ease}
      .client-gallery-card:hover img{transform:scale(1.035)}
      .gallery-actions{display:flex;justify-content:center;margin-top:28px}
      .gallery-load-more{border:1px solid #9f7657;background:#9f7657;color:#fff;padding:12px 22px;border-radius:999px;font-weight:700}
      .gallery-load-more:hover{background:#6f4f39;border-color:#6f4f39}
      .gallery-message{grid-column:1/-1;padding:34px;border:1px dashed #d6b89d;border-radius:18px;text-align:center;color:#736b65;background:#fff}
      .gallery-lightbox{position:fixed;inset:0;z-index:9999;display:none;background:rgba(15,13,12,.96)}
      .gallery-lightbox.open{display:grid;grid-template-rows:auto 1fr auto}
      .gallery-lightbox-top,.gallery-lightbox-bottom{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;color:#fff}
      .gallery-lightbox-top{border-bottom:1px solid rgba(255,255,255,.12)}
      .gallery-lightbox-bottom{border-top:1px solid rgba(255,255,255,.12)}
      .gallery-lightbox-stage{position:relative;display:grid;place-items:center;min-height:0;padding:16px 72px}
      .gallery-lightbox-img{max-width:100%;max-height:calc(100vh - 150px);object-fit:contain;user-select:none}
      .gallery-close,.gallery-nav,.gallery-download{border:0;color:#fff;background:rgba(255,255,255,.12);border-radius:999px;min-height:42px}
      .gallery-close{width:42px;font-size:24px}
      .gallery-nav{position:absolute;top:50%;transform:translateY(-50%);width:46px;height:46px;font-size:26px}
      .gallery-prev{left:14px}.gallery-next{right:14px}
      .gallery-download{display:inline-flex;align-items:center;justify-content:center;padding:10px 18px;font-weight:700}
      .gallery-photo-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:60vw}
      body.gallery-lock{overflow:hidden}
      @media(max-width:900px){.client-gallery-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
      @media(max-width:620px){
        .client-gallery-section{padding:74px 0}
        .client-gallery-head{align-items:start;flex-direction:column}
        .client-gallery-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
        .client-gallery-card{border-radius:11px}
        .gallery-lightbox-stage{padding:10px 44px}
        .gallery-nav{width:38px;height:38px;font-size:21px}
        .gallery-lightbox-top,.gallery-lightbox-bottom{padding:11px}
        .gallery-photo-name{max-width:50vw;font-size:.8rem}
        .gallery-download{padding:9px 13px;font-size:.82rem}
      }
    `;
    document.head.appendChild(style);
  }

  function injectGalleryHTML() {
    const portfolio = document.getElementById("portofolio");
    if (!portfolio) return null;

    const section = document.createElement("section");
    section.className = "client-gallery-section";
    section.id = "galeri-client";

    section.innerHTML = `
      <div class="container">
        <div class="client-gallery-head">
          <div>
            <span class="eyebrow">Client Gallery</span>
            <h2>${GALLERY_CONFIG.TITLE}</h2>
            <p>${GALLERY_CONFIG.SUBTITLE}</p>
          </div>
          <div class="gallery-count" id="galleryCount">Memuat foto...</div>
        </div>

        <div class="client-gallery-grid" id="clientGalleryGrid"></div>

        <div class="gallery-actions">
          <button class="gallery-load-more" id="galleryLoadMore" type="button" hidden>
            Muat Foto Lainnya
          </button>
        </div>
      </div>

      <div class="gallery-lightbox" id="galleryLightbox" aria-hidden="true">
        <div class="gallery-lightbox-top">
          <div class="gallery-photo-name" id="galleryPhotoName"></div>
          <button class="gallery-close" id="galleryClose" type="button" aria-label="Tutup">×</button>
        </div>

        <div class="gallery-lightbox-stage">
          <button class="gallery-nav gallery-prev" id="galleryPrev" type="button" aria-label="Foto sebelumnya">‹</button>
          <img class="gallery-lightbox-img" id="galleryLightboxImg" alt="Preview foto" />
          <button class="gallery-nav gallery-next" id="galleryNext" type="button" aria-label="Foto berikutnya">›</button>
        </div>

        <div class="gallery-lightbox-bottom">
          <div id="galleryPosition"></div>
          <a class="gallery-download" id="galleryDownload" href="#" download>
            Download Original
          </a>
        </div>
      </div>
    `;

    portfolio.insertAdjacentElement("afterend", section);
    return section;
  }

  async function loadPhotoList() {
    if (!baseUrl || GALLERY_CONFIG.R2_PUBLIC_BASE_URL.includes("PASTE_R2_PUBLIC_URL")) {
      return { photos: FALLBACK_PHOTOS, usingFallback: true };
    }

    const manifestUrl =
      `${baseUrl}/${albumPath}/${encodeURIComponent(GALLERY_CONFIG.MANIFEST_FILE)}?v=${Date.now()}`;

    try {
      const response = await fetch(manifestUrl, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      const photos = Array.isArray(data)
        ? data
        : Array.isArray(data.photos)
          ? data.photos
          : [];

      return {
        photos: photos.filter((name) =>
          /\.(jpe?g|png|webp|gif|avif)$/i.test(String(name))
        ),
        usingFallback: false
      };
    } catch (error) {
      console.warn("gallery.json belum bisa dibaca.", error);
      return { photos: FALLBACK_PHOTOS, usingFallback: true };
    }
  }

  injectGalleryStyles();
  const gallerySection = injectGalleryHTML();
  if (!gallerySection) return;

  const grid = document.getElementById("clientGalleryGrid");
  const loadMoreBtn = document.getElementById("galleryLoadMore");
  const countEl = document.getElementById("galleryCount");

  const lightbox = document.getElementById("galleryLightbox");
  const lightboxImg = document.getElementById("galleryLightboxImg");
  const photoNameEl = document.getElementById("galleryPhotoName");
  const positionEl = document.getElementById("galleryPosition");
  const downloadEl = document.getElementById("galleryDownload");
  const closeBtn = document.getElementById("galleryClose");
  const prevBtn = document.getElementById("galleryPrev");
  const nextBtn = document.getElementById("galleryNext");

  let photos = [];
  let rendered = 0;
  let currentIndex = 0;

  function renderMore() {
    const next = photos.slice(rendered, rendered + GALLERY_CONFIG.PER_PAGE);

    next.forEach((fileName, localIndex) => {
      const absoluteIndex = rendered + localIndex;

      const button = document.createElement("button");
      button.className = "client-gallery-card";
      button.type = "button";

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
      grid.appendChild(button);
    });

    rendered += next.length;
    loadMoreBtn.hidden = rendered >= photos.length;
    countEl.textContent = `${photos.length.toLocaleString("id-ID")} foto`;
  }

  function openLightbox(index) {
    if (!photos.length) return;

    currentIndex = (index + photos.length) % photos.length;
    const fileName = photos[currentIndex];
    const url = fileUrl(fileName);

    lightboxImg.src = url;
    photoNameEl.textContent = fileName;
    positionEl.textContent = `${currentIndex + 1} / ${photos.length}`;
    downloadEl.href = url;
    downloadEl.setAttribute("download", fileName);

    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("gallery-lock");
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImg.src = "";
    document.body.classList.remove("gallery-lock");
  }

  function previousPhoto() {
    openLightbox(currentIndex - 1);
  }

  function nextPhoto() {
    openLightbox(currentIndex + 1);
  }

  loadMoreBtn.addEventListener("click", renderMore);
  closeBtn.addEventListener("click", closeLightbox);
  prevBtn.addEventListener("click", previousPhoto);
  nextBtn.addEventListener("click", nextPhoto);

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("open")) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") previousPhoto();
    if (event.key === "ArrowRight") nextPhoto();
  });

  let touchStartX = 0;

  lightbox.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });

  lightbox.addEventListener("touchend", (event) => {
    const touchEndX = event.changedTouches[0].clientX;
    const distance = touchEndX - touchStartX;

    if (Math.abs(distance) < 45) return;
    if (distance > 0) previousPhoto();
    else nextPhoto();
  }, { passive: true });

  loadPhotoList().then(({ photos: result, usingFallback }) => {
    photos = result;

    if (!photos.length) {
      countEl.textContent = "0 foto";
      grid.innerHTML = `<div class="gallery-message">Belum ada foto di album ini.</div>`;
      return;
    }

    if (usingFallback) {
      const note = document.createElement("div");
      note.className = "gallery-message";
      note.style.marginBottom = "16px";
      note.innerHTML = `
        <strong>Mode contoh aktif.</strong><br>
        Isi <code>R2_PUBLIC_BASE_URL</code> dan upload <code>gallery.json</code>
        agar seluruh foto dari R2 tampil otomatis.
      `;
      grid.before(note);
    }

    renderMore();
  });

});
