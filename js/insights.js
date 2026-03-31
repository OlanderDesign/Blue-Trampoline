let allInsights = []

fetch("/insights.json")
  .then((response) => response.json())
  .then((data) => {
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error("Invalid Notion response format")
    }

    allInsights = data.results.filter((item) => item.properties?.Published?.checkbox === true)

    populateFilter("topicFilter", allInsights, "Topic")
    populateFilter("focusFilter", allInsights, "Focus")
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
    const values = item.properties?.[propertyName]?.multi_select || []
    values.forEach((value) => valueSet.add(value.name))
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
    .filter((item) => matchesMultiSelectFilter(item, "Topic", topicFilter))
    .filter((item) => matchesMultiSelectFilter(item, "Focus", focusFilter))
    .filter((item) => matchesSearch(item, searchQuery))
    .sort((a, b) => {
      const dateA = a.properties?.Dato?.date?.start || ""
      const dateB = b.properties?.Dato?.date?.start || ""
      return new Date(dateB) - new Date(dateA)
    })

  if (filteredItems.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <p class="body-text">No insights match this filter.</p>
      </div>
    `
    return
  }

  filteredItems.forEach((item, index) => {
    const title = item.properties?.Title?.title?.[0]?.plain_text || "Untitled"
    const slug = item.properties?.Slug?.rich_text?.[0]?.plain_text || ""
    const date = item.properties?.Dato?.date?.start || ""
    const topic = item.properties?.Topic?.multi_select || []
    const focus = item.properties?.Focus?.multi_select || []
    const coverFile = item.properties?.Cover?.files?.[0]
    const cover = coverFile?.file?.url || coverFile?.external?.url || null

    const formattedDate = formatRelativeDate(date)

    const topicHtml = topic.length
      ? topic.map((item) => `<span class="badge text-bg-light me-2 mb-2">${item.name}</span>`).join("")
      : ""

    const focusHtml = focus.length
      ? focus.map((item) => `<span class="badge text-bg-secondary me-2 mb-2">${item.name}</span>`).join("")
      : ""

    const card = document.createElement("div")
    card.className = "col-12 col-md-6 col-lg-4"

    card.innerHTML = `
      <a href="insight.html?slug=${slug}" class="text-decoration-none">
        <div class="card h-100 border-0 shadow-sm">
          ${cover ? `<img src="${cover}" class="card-img-top image-soft" alt="${title}">` : ""}
          <div class="card-body">
            ${formattedDate ? `<p class="body-text small mb-2">${formattedDate}</p>` : ""}
            <h2 class="lead-text mb-3">${title}</h2>
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

function matchesMultiSelectFilter(item, propertyName, selectedValue) {
  if (selectedValue === "all") {
    return true
  }

  const values = item.properties?.[propertyName]?.multi_select || []
  return values.some((value) => value.name === selectedValue)
}

function matchesSearch(item, searchQuery) {
  if (!searchQuery) {
    return true
  }

  const title = item.properties?.Title?.title?.[0]?.plain_text?.toLowerCase() || ""
  const topic = (item.properties?.Topic?.multi_select || []).map((item) => item.name.toLowerCase()).join(" ")
  const focus = (item.properties?.Focus?.multi_select || []).map((item) => item.name.toLowerCase()).join(" ")

  const haystack = `${title} ${topic} ${focus}`
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