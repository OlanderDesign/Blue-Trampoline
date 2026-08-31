/* =========================================
   INSIGHTS NAVBAR
========================================= */

function initInsightNavbar() {
  const navbar = document.querySelector(".insight-navbar")

  if (!navbar || navbar.dataset.initialized === "true") {
    return
  }

  const logo = navbar.querySelector(".insight-logo")

  if (!logo) {
    return
  }

  navbar.dataset.initialized = "true"

  function updateInsightNavbar() {
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

    /* Navbar: 90 -> 140 px */
    const navProgress = Math.min(
      Math.max((scroll - 90) / 50, 0),
      1
    )

    /* Blue #163A5F -> Soft white #FBFAF8 */
    const bgR = Math.round(22 + (251 - 22) * navProgress)
    const bgG = Math.round(58 + (250 - 58) * navProgress)
    const bgB = Math.round(95 + (248 - 95) * navProgress)

    /* Soft white #FBFAF8 -> Blue #163A5F */
    const textR = Math.round(251 + (22 - 251) * navProgress)
    const textG = Math.round(250 + (58 - 250) * navProgress)
    const textB = Math.round(248 + (95 - 248) * navProgress)

    navbar.style.backgroundColor =
      `rgb(${bgR}, ${bgG}, ${bgB})`

    navbar.style.setProperty(
      "--insight-nav-color",
      `rgb(${textR}, ${textG}, ${textB})`
    )

    navbar.style.borderBottomColor =
      `rgba(46,49,53,${0.08 * navProgress})`

    navbar.style.boxShadow =
      `0 4px 18px rgba(46,49,53,${0.06 * navProgress})`
  }

  window.addEventListener(
    "scroll",
    updateInsightNavbar,
    { passive: true }
  )

  updateInsightNavbar()
}

/*
  Gør funktionen tilgængelig for insights/index.html,
  fordi navbar.html bliver hentet efter insights.js.
*/
window.initInsightNavbar = initInsightNavbar

/*
  På genererede artikler findes navbaren allerede
  i HTML'en, så vi forsøger at initialisere med det samme.
*/
initInsightNavbar()


/* =========================================
   INSIGHTS OVERVIEW
========================================= */

let allInsights = []

const insightsContainer =
  document.getElementById("insightsContainer")

/*
  Kører kun på /insights/.
  På individuelle artikler findes insightsContainer ikke,
  og resten bliver derfor ikke aktiveret.
*/
if (insightsContainer) {
  fetch("/insights.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `Unable to load insights: ${response.status}`
        )
      }

      return response.json()
    })

    .then((data) => {
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error(
          "Invalid insights response format"
        )
      }

      allInsights = data.results.filter(
        (item) => item.published === true
      )

      populateFilter(
        "topicFilter",
        allInsights,
        "topic"
      )

      populateFilter(
        "focusFilter",
        allInsights,
        "focus"
      )

      renderInsights()
      attachFilterEvents()
    })

    .catch((error) => {
      console.error(
        "Error loading insights:",
        error
      )

      insightsContainer.innerHTML = `
        <div class="col-12">
          <p class="body-text">
            Unable to load insights right now.
          </p>
        </div>
      `
    })
}


/* =========================================
   FILTER EVENTS
========================================= */

function attachFilterEvents() {
  const topicFilter =
    document.getElementById("topicFilter")

  const focusFilter =
    document.getElementById("focusFilter")

  const searchInput =
    document.getElementById("searchInput")

  if (topicFilter) {
    topicFilter.addEventListener(
      "change",
      renderInsights
    )
  }

  if (focusFilter) {
    focusFilter.addEventListener(
      "change",
      renderInsights
    )
  }

  if (searchInput) {
    searchInput.addEventListener(
      "input",
      renderInsights
    )
  }
}


/* =========================================
   FILTER OPTIONS
========================================= */

function populateFilter(
  selectId,
  items,
  propertyName
) {
  const select =
    document.getElementById(selectId)

  if (!select) {
    return
  }

  const valueSet = new Set()

  items.forEach((item) => {
    const values =
      item[propertyName] || []

    values.forEach(
      (value) => valueSet.add(value)
    )
  })

  Array.from(valueSet)
    .sort()
    .forEach((valueName) => {
      const option =
        document.createElement("option")

      option.value = valueName
      option.textContent = valueName

      select.appendChild(option)
    })
}


/* =========================================
   RENDER INSIGHTS
========================================= */

function renderInsights() {
  const container =
    document.getElementById("insightsContainer")

  const topicFilter =
    document.getElementById("topicFilter")

  const focusFilter =
    document.getElementById("focusFilter")

  const searchInput =
    document.getElementById("searchInput")

  if (
    !container ||
    !topicFilter ||
    !focusFilter ||
    !searchInput
  ) {
    return
  }

  const selectedTopic =
    topicFilter.value

  const selectedFocus =
    focusFilter.value

  const searchQuery =
    searchInput.value
      .trim()
      .toLowerCase()

  container.innerHTML = ""

  const filteredItems = allInsights
    .filter((item) =>
      matchesArrayFilter(
        item.topic,
        selectedTopic
      )
    )

    .filter((item) =>
      matchesArrayFilter(
        item.focus,
        selectedFocus
      )
    )

    .filter((item) =>
      matchesSearch(
        item,
        searchQuery
      )
    )

    .sort(
      (a, b) =>
        new Date(b.date || "") -
        new Date(a.date || "")
    )

  if (filteredItems.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <p class="body-text">
          No insights match this filter.
        </p>
      </div>
    `

    return
  }

  filteredItems.forEach(
    (item, index) => {
      const formattedDate =
        formatRelativeDate(item.date)

      const topicHtml =
        item.topic?.length
          ? item.topic
              .map(
                (value) =>
                  `<span class="badge text-bg-light me-2 mb-2">${value}</span>`
              )
              .join("")
          : ""

      const focusHtml =
        item.focus?.length
          ? item.focus
              .map(
                (value) =>
                  `<span class="badge text-bg-secondary me-2 mb-2">${value}</span>`
              )
              .join("")
          : ""

      const card =
        document.createElement("div")

      card.className =
        "col-12 col-md-6 col-lg-4"

      card.innerHTML = `
        <a
          href="/insights/${item.slug}/"
          class="text-decoration-none"
        >
          <div class="card h-100 border-0 shadow-sm">

            ${
              item.cover
                ? `<img
                    src="${item.cover}"
                    class="card-img-top image-soft"
                    alt="${item.title || ""}"
                  >`
                : ""
            }

            <div class="card-body">

              ${
                formattedDate
                  ? `<p class="body-text small mb-2">
                      ${formattedDate}
                    </p>`
                  : ""
              }

              <h2 class="lead-text mb-3">
                ${item.title || "Untitled"}
              </h2>

              ${
                item.summary
                  ? `<p class="body-text mb-3">
                      ${item.summary}
                    </p>`
                  : ""
              }

              ${
                topicHtml
                  ? `<div class="mb-1">
                      ${topicHtml}
                    </div>`
                  : ""
              }

              ${
                focusHtml
                  ? `<div>
                      ${focusHtml}
                    </div>`
                  : ""
              }

            </div>
          </div>
        </a>
      `

      const link =
        card.querySelector("a")

      if (link) {
        link.setAttribute(
          "data-aos",
          "fade-up"
        )

        link.setAttribute(
          "data-aos-delay",
          String(100 + index * 50)
        )
      }

      container.appendChild(card)
    }
  )

  if (typeof AOS !== "undefined") {
    AOS.refresh()
  }
}


/* =========================================
   FILTER HELPERS
========================================= */

function matchesArrayFilter(
  values,
  selectedValue
) {
  if (selectedValue === "all") {
    return true
  }

  return (values || []).includes(
    selectedValue
  )
}


function matchesSearch(
  item,
  searchQuery
) {
  if (!searchQuery) {
    return true
  }

  const haystack = `
    ${item.title || ""}
    ${item.summary || ""}
    ${(item.topic || []).join(" ")}
    ${(item.focus || []).join(" ")}
  `.toLowerCase()

  return haystack.includes(
    searchQuery
  )
}


/* =========================================
   DATE FORMAT
========================================= */

function formatRelativeDate(dateString) {
  if (!dateString) {
    return ""
  }

  const itemDate =
    new Date(dateString)

  const now =
    new Date()

  const itemYear =
    itemDate.getFullYear()

  const nowYear =
    now.getFullYear()

  if (itemYear === nowYear) {
    const msPerDay =
      1000 * 60 * 60 * 24

    const diffInDays =
      Math.floor(
        (now - itemDate) / msPerDay
      )

    if (diffInDays <= 7) {
      if (diffInDays <= 0) {
        return "Today"
      }

      if (diffInDays === 1) {
        return "Yesterday"
      }

      return `${diffInDays} days ago`
    }

    return itemDate.toLocaleDateString(
      "en-GB",
      {
        day: "numeric",
        month: "short"
      }
    )
  }

  return itemDate.toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  )
}