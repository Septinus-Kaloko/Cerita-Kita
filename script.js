const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", isOpen);
});

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

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

const contactForm = document.getElementById("contactForm");

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const service = document.getElementById("service").value;
  const date = document.getElementById("date").value;
  const message = document.getElementById("message").value.trim();

  const whatsappNumber = "6281234567890";

  const text = [
    "Halo Lensa & Cerita,",
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
  window.open(url, "_blank");
});

document.getElementById("year").textContent = new Date().getFullYear();
