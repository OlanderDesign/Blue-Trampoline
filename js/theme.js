AOS.init({
  duration: 700,
  once: true,
  offset: 40
});

const navbar = document.querySelector(".navbar-blur");
const navbarCollapse = document.getElementById("mainNav");

function updateNavbar() {
  if (!navbar) return;

  const menuOpen =
    navbarCollapse &&
    navbarCollapse.classList.contains("show");

  navbar.classList.toggle(
    "navbar-scrolled",
    window.scrollY > 20 || menuOpen
  );
}

window.addEventListener("scroll", updateNavbar, {
  passive: true
});

window.addEventListener("load", updateNavbar);

if (navbarCollapse) {
  navbarCollapse.addEventListener("show.bs.collapse", () => {
    navbar.classList.add("navbar-scrolled");
  });

  navbarCollapse.addEventListener("hidden.bs.collapse", () => {
    updateNavbar();
  });
}

const insightsCarousel = document.getElementById("insightsCarousel");

if (insightsCarousel) {
  fetch("/insights.json")
    .then(response => response.json())
    .then(data => {
      const insights = data.results
        .filter(item => item.published === true)
        .sort((a, b) => new Date(b.date || "") - new Date(a.date || ""))
        .slice(0, 6);

      insightsCarousel.innerHTML = insights
        .map(insight => `
          <a class="insight-card" href="/insights/${insight.slug}/">
            ${insight.cover ? `<img src="${insight.cover}" alt="${insight.title}">` : ""}
            <div class="insight-card-content">
              <h3>${insight.title}</h3>
              <p>${insight.summary || ""}</p>
            </div>
          </a>
        `)
        .join("");
    })
    .catch(error => console.error("Error loading homepage insights:", error));
}