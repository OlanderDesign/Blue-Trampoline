function initInsightNavbar() {
  const navbar = document.querySelector(".insight-navbar");
  if (!navbar || navbar.dataset.initialized === "true") return;

  navbar.dataset.initialized = "true";

  const logo = navbar.querySelector(".insight-logo");
  if (!logo) return;

  function updateInsightNavbar() {
    const scroll = window.scrollY;

    /* Logo: 0 -> 90 px */
    const logoProgress = Math.min(Math.max(scroll / 90, 0), 1);

    const scale = 2.45 - (1.45 * logoProgress);
    const x = -15 + (15 * logoProgress);
    const y = 15 - (15 * logoProgress);

    logo.style.transform =
      `scale(${scale}) translate(${x}%, ${y}%)`;

    /* Navbar: 90 -> 140 px */
    const navProgress =
      Math.min(Math.max((scroll - 90) / 50, 0), 1);

    const bgR = Math.round(22 + (251 - 22) * navProgress);
    const bgG = Math.round(58 + (250 - 58) * navProgress);
    const bgB = Math.round(95 + (248 - 95) * navProgress);

    const textR = Math.round(251 + (22 - 251) * navProgress);
    const textG = Math.round(250 + (58 - 250) * navProgress);
    const textB = Math.round(248 + (95 - 248) * navProgress);

    navbar.style.backgroundColor =
      `rgb(${bgR}, ${bgG}, ${bgB})`;

    navbar.style.setProperty(
      "--insight-nav-color",
      `rgb(${textR}, ${textG}, ${textB})`
    );

    navbar.style.borderBottomColor =
      `rgba(46,49,53,${0.08 * navProgress})`;

    navbar.style.boxShadow =
      `0 4px 18px rgba(46,49,53,${0.06 * navProgress})`;
  }

  window.addEventListener("scroll", updateInsightNavbar, {
    passive: true
  });

  updateInsightNavbar();
}

window.initInsightNavbar = initInsightNavbar;

/* Virker automatisk, når navbaren allerede findes i HTML */
initInsightNavbar();