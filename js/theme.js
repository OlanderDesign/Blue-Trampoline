AOS.init({
  duration: 700,
  once: true,
  offset: 40
});

const navbar = document.querySelector('.navbar-blur');
const hero = document.querySelector('.hero-image');

function updateNavbar() {
  if (!navbar) return;

  if (window.scrollY > 20) {
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