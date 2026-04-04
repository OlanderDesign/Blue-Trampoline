let allInsights = []

fetch("/insights.json")
  .then((response) => response.json())
  .then((data) => {
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error("Invalid insights response format")
    }

    allInsights = data.results.filter((item) => item.published === true)

    populateFilter("topicFilter", allInsights, "topic")
    populateFilter("focusFilter", allInsights, "focus")
    renderInsights()
    attachFilterEvents()
  })
  .catch((error) => {
    console.error("Error loading insights:", error)

    const container = document.getElementById("insightsContainer")
    container.innerHTML = `
      <div class="col-12">
        <p class="body-text">Unable to load insights right now.</p>
      </div>
    `
  })

function attachFilterEvents() {
  const topicFilter = document.getElementById("topicFilter")
  const focusFilter = document.getElementById("focusFilter")
  const searchInput = document.getElementById("searchInput")

  topicFilter.addEventListener("change", renderInsights)
  focusFilter.addEventListener("change", renderInsights)
  searchInput.addEventListener("input", renderInsights)
}

function populateFilter(selectId, items, propertyName) {
  const select = document.getElementById(selectId)
  const valueSet = new Set()

  items.forEach((item) => {
    const values = item[propertyName] || []
    values.forEach((value) => valueSet.add(value))
  })

  Array.from(valueSet)
    .sort()
    .forEach((valueName) => {
      const option = document.createElement("option")
      option.value = valueName
      option.textContent = valueName
      select.appendChild(option)
    })
}

function renderInsights() {
  const container = document.getElementById("insightsContainer")
  const topicFilter = document.getElementById("topicFilter").value
  const focusFilter = document.getElementById("focusFilter").value
  const searchQuery = document.getElementById("searchInput").value.trim().toLowerCase()

  container.innerHTML = ""

  const filteredItems = allInsights
    .filter((item) => matchesArrayFilter(item.topic, topicFilter))
    .filter((item) => matchesArrayFilter(item.focus, focusFilter))
    .filter((item) => matchesSearch(item, searchQuery))
    .sort((a, b) => new Date(b.date || "") - new Date(a.date || ""))

  if (filteredItems.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <p class="body-text">No insights match this filter.</p>
      </div>
    `
    return
  }

  filteredItems.forEach((item, index) => {
    const formattedDate = formatRelativeDate(item.date)

    const topicHtml = item.topic?.length
      ? item.topic.map((value) => `<span class="badge text-bg-light me-2 mb-2">${value}</span>`).join("")
      : ""

    const focusHtml = item.focus?.length
      ? item.focus.map((value) => `<span class="badge text-bg-secondary me-2 mb-2">${value}</span>`).join("")
      : ""

    const card = document.createElement("div")
    card.className = "col-12 col-md-6 col-lg-4"

    card.innerHTML = `
      <a href="/insights/${item.slug}/" class="text-decoration-none">
        <div class="card h-100 border-0 shadow-sm">
          ${item.cover ? `<img src="${item.cover}" class="card-img-top image-soft" alt="${item.title}">` : ""}
          <div class="card-body">
            ${formattedDate ? `<p class="body-text small mb-2">${formattedDate}</p>` : ""}
            <h2 class="lead-text mb-3">${item.title || "Untitled"}</h2>
            ${item.summary ? `<p class="body-text mb-3">${item.summary}</p>` : ""}
            ${topicHtml ? `<div class="mb-1">${topicHtml}</div>` : ""}
            ${focusHtml ? `<div>${focusHtml}</div>` : ""}
          </div>
        </div>
      </a>
    `

    const link = card.querySelector("a")
    if (link) {
      link.setAttribute("data-aos", "fade-up")
      link.setAttribute("data-aos-delay", String(100 + index * 50))
    }

    container.appendChild(card)
  })

  if (typeof AOS !== "undefined") {
    AOS.refresh()
  }
}

function matchesArrayFilter(values, selectedValue) {
  if (selectedValue === "all") {
    return true
  }

  return (values || []).includes(selectedValue)
}

function matchesSearch(item, searchQuery) {
  if (!searchQuery) {
    return true
  }

  const haystack = `
    ${item.title || ""}
    ${item.summary || ""}
    ${(item.topic || []).join(" ")}
    ${(item.focus || []).join(" ")}
  `.toLowerCase()

  return haystack.includes(searchQuery)
}

function formatRelativeDate(dateString) {
  if (!dateString) {
    return ""
  }

  const itemDate = new Date(dateString)
  const now = new Date()

  const itemYear = itemDate.getFullYear()
  const nowYear = now.getFullYear()

  if (itemYear === nowYear) {
    const msPerDay = 1000 * 60 * 60 * 24
    const diffInDays = Math.floor((now - itemDate) / msPerDay)

    if (diffInDays <= 7) {
      if (diffInDays <= 0) {
        return "Today"
      }

      if (diffInDays === 1) {
        return "Yesterday"
      }

      return `${diffInDays} days ago`
    }

    return itemDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short"
    })
  }

  return itemDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  })
}