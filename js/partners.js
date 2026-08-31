/* =========================================
   PARTNERS NAVBAR
========================================= */

function initPartnerNavbar() {
  const navbar = document.querySelector(".partner-navbar")

  if (!navbar || navbar.dataset.initialized === "true") {
    return
  }

  const logo = navbar.querySelector(".partner-logo")

  if (!logo) {
    return
  }

  navbar.dataset.initialized = "true"

  function updatePartnerNavbar() {
    const scroll = window.scrollY

    /* Logo: 0 -> 90 px */
    const logoProgress = Math.min(
      Math.max(scroll / 90, 0),
      1
    )

    const scale = 2.45 - (1.45 * logoProgress)
    const x = -15 + (15 * logoProgress)
    const y = 15 - (15 * logoProgress)

    logo.style.transform =
      `scale(${scale}) translate(${x}%, ${y}%)`
      
    const logoFrame = navbar.querySelector(".partner-logo-frame")

logoFrame.style.borderRadius =
  `${50 - (50 * logoProgress)}%` 

    /* Navbar: 90 -> 140 px */
    const navProgress = Math.min(
      Math.max((scroll - 90) / 50, 0),
      1
    )

    /* Red #FF5A5F -> Soft white #FBFAF8 */
    const bgR = Math.round(255 + (251 - 255) * navProgress)
    const bgG = Math.round(90 + (250 - 90) * navProgress)
    const bgB = Math.round(95 + (248 - 95) * navProgress)

    /* White -> Blue #163A5F */
    const textR = Math.round(251 + (22 - 251) * navProgress)
    const textG = Math.round(250 + (58 - 250) * navProgress)
    const textB = Math.round(248 + (95 - 248) * navProgress)

    navbar.style.backgroundColor =
      `rgb(${bgR}, ${bgG}, ${bgB})`

    navbar.style.setProperty(
      "--partner-nav-color",
      `rgb(${textR}, ${textG}, ${textB})`
    )

    navbar.style.borderBottomColor =
      `rgba(46,49,53,${0.08 * navProgress})`

    navbar.style.boxShadow =
      `0 4px 18px rgba(46,49,53,${0.06 * navProgress})`
  }

  window.addEventListener(
    "scroll",
    updatePartnerNavbar,
    { passive: true }
  )

  updatePartnerNavbar()
}

window.initPartnerNavbar = initPartnerNavbar

initPartnerNavbar()