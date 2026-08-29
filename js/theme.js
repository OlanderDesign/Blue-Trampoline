AOS.init({
  duration: 700,
  once: true,
  offset: 40
});

const html = document.documentElement;
const toggle = document.getElementById("themeToggle");
const icon = toggle.querySelector("i");

function setTheme(theme) {
  html.setAttribute("data-bs-theme", theme);
  localStorage.setItem("theme", theme);

  if (theme === "dark") {
    icon.className = "bi bi-sun-fill";
  } else {
    icon.className = "bi bi-moon-stars-fill";
  }
}

const savedTheme = localStorage.getItem("theme");
setTheme(savedTheme || "light");
toggle.addEventListener("click", () => {
  const currentTheme = html.getAttribute("data-bs-theme");
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  setTheme(nextTheme);
});

const navbar = document.querySelector('.navbar-blur');
const hero = document.querySelector('.hero-image');

function updateNavbar() {
  if (!navbar || !hero) return;

  const heroBottom = hero.getBoundingClientRect().bottom;

  if (heroBottom <= navbar.offsetHeight) {
    navbar.classList.add('navbar-scrolled');
  } else {
    navbar.classList.remove('navbar-scrolled');
  }
}

window.addEventListener('scroll', updateNavbar);
window.addEventListener('load', updateNavbar);

const insightsCarousel = document.getElementById("insightsCarousel");

if (insightsCarousel) {
  fetch("/insights.json")
    .then(response => response.json())
    .then(insights => {
      insightsCarousel.innerHTML = insights
        .slice(0, 6)
        .map(insight => `
          <a class="insight-card" href="/insights/${insight.slug}/">
            <img src="${insight.cover}" alt="">
            <div class="insight-card-content">
              <h3>${insight.title}</h3>
              <p>${insight.summary || ""}</p>
            </div>
          </a>
        `)
        .join("");
    });
}