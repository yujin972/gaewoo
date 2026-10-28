const SITE_BASE =
  location.pathname === "/gaewoo" || location.pathname.startsWith("/gaewoo/") ? "/gaewoo" : "";

function fromRoot(path) {
  return SITE_BASE + path;
}

function applySiteBase(root) {
  if (!SITE_BASE) return;

  root.querySelectorAll("[href], [src]").forEach((el) => {
    ["href", "src"].forEach((attr) => {
      const value = el.getAttribute(attr);
      if (!value || !value.startsWith("/") || value.startsWith("//")) return;
      el.setAttribute(attr, SITE_BASE + value);
    });
  });
}

function mount(slotId, url) {
  const slot = document.getElementById(slotId);
  if (!slot) return Promise.resolve();

  return fetch(url)
    .then((response) => response.text())
    .then((html) => {
      const doc = new DOMParser().parseFromString(html, "text/html");
      applySiteBase(doc);

      doc.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
        const href = link.getAttribute("href");
        if (!href || document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) return;
        document.head.appendChild(document.importNode(link, true));
      });

      const content = doc.body.firstElementChild;
      if (content) slot.replaceWith(content);
    });
}

function markCurrentPage() {
  const current = location.pathname;

  document.querySelectorAll(".nav a").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("http")) return;

    const path = new URL(href, location.origin).pathname;
    const atSiteRoot =
      current === "/" ||
      current === SITE_BASE ||
      current === `${SITE_BASE}/` ||
      current.endsWith("/index.html");
    const isHome = atSiteRoot && path.endsWith("/index.html");
    const isSame = path === current;

    if (isHome || isSame) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  });
}

mount("header", fromRoot("/includes/header.html")).then(() => {
  markCurrentPage();
  initHeaderScroll();
});
mount("footer", fromRoot("/includes/footer.html"));

function initHeaderScroll() {
  const header = document.getElementById("header");
  if (!header) return;

  let lastY = window.scrollY;
  let ticking = false;

  const update = () => {
    const y = window.scrollY;
    const delta = y - lastY;

    if (y <= 10) {
      header.classList.remove("is-hidden");
    } else if (delta > 6) {
      header.classList.add("is-hidden");
    } else if (delta < -6) {
      header.classList.remove("is-hidden");
    }

    lastY = y;
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true }
  );
}

function initAquariumModal(swiper) {
  const modal = document.querySelector(".img-modal");
  if (!modal) return;

  const image = modal.querySelector(".img-modal-photo");
  const closeButton = modal.querySelector(".img-modal-close");
  const prevButton = modal.querySelector(".img-modal-prev");
  const nextButton = modal.querySelector(".img-modal-next");
  let index = 0;
  let lastFocus = null;

  const slides = () =>
    Array.from(swiper.el.querySelectorAll(".swiper-slide:not(.swiper-slide-duplicate)")).sort(
      (a, b) =>
        Number(a.getAttribute("data-swiper-slide-index")) -
        Number(b.getAttribute("data-swiper-slide-index"))
    );

  const show = (i) => {
    const items = slides();
    if (!items.length) return;
    index = (i + items.length) % items.length;
    const img = items[index].querySelector("img");
    if (!img) return;
    image.src = img.currentSrc || img.src;
    image.alt = img.alt || "";
  };

  const open = (i) => {
    show(i);
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    swiper.autoplay?.stop();
    swiper.keyboard?.disable();
    closeButton.focus();
  };

  const close = () => {
    if (modal.hidden) return;
    modal.hidden = true;
    image.removeAttribute("src");
    document.body.style.overflow = "";
    swiper.autoplay?.start();
    swiper.keyboard?.enable();
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  };

  swiper.on("click", () => {
    const slide = swiper.clickedSlide;
    if (!slide?.querySelector("img")) return;
    const raw = slide.getAttribute("data-swiper-slide-index");
    open(raw === null ? swiper.realIndex : Number(raw));
  });

  prevButton.addEventListener("click", () => show(index - 1));
  nextButton.addEventListener("click", () => show(index + 1));
  closeButton.addEventListener("click", close);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) close();
  });
  document.addEventListener("keydown", (event) => {
    if (modal.hidden) return;
    if (event.key === "Escape") close();
    if (event.key === "ArrowLeft") show(index - 1);
    if (event.key === "ArrowRight") show(index + 1);
  });
}

function initAquariumSwiper() {
  const el = document.querySelector(".aquarium-swiper");
  if (!el || typeof Swiper === "undefined") return;

  const swiper = new Swiper(el, {
    slidesPerView: 1.15,
    spaceBetween: 7,
    loop: true,
    speed: 700,
    grabCursor: true,
    autoplay: {
      delay: 3500,
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
    },
    keyboard: {
      enabled: true,
      onlyInViewport: true,
    },
    navigation: {
      prevEl: ".sec04-prev",
      nextEl: ".sec04-next",
    },
    breakpoints: {
      769: { slidesPerView: 2.15, spaceBetween: 10 },
      1025: { slidesPerView: 3, spaceBetween: 14 },
      1201: { slidesPerView: 4, spaceBetween: 14 },
      1441: { slidesPerView: 4, spaceBetween: 20 },
    },
  });

  initAquariumModal(swiper);
}

initAquariumSwiper();

document.addEventListener("click", (event) => {
  const button = event.target.closest(".menu-btn");
  if (!button) return;

  const nav = document.querySelector(".nav");
  if (!nav) return;

  const open = nav.classList.toggle("is-open");
  button.setAttribute("aria-expanded", String(open));
  button.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
});
