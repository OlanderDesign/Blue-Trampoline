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