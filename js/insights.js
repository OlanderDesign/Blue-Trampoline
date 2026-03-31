fetch("/insights.json")
  .then((response) => response.json())
  .then((data) => {
    const container = document.getElementById("insightsContainer")

    if (!data.results || !Array.isArray(data.results)) {
      throw new Error("Invalid Notion response format")
    }

    const publishedItems = data.results
      .filter((item) => item.properties?.Published?.checkbox === true)
      .sort((a, b) => {
        const dateA = a.properties?.Dato?.date?.start || ""
        const dateB = b.properties?.Dato?.date?.start || ""
        return new Date(dateB) - new Date(dateA)
      })

    if (publishedItems.length === 0) {
      container.innerHTML = `
        <div class="col-12">
          <p class="body-text">No insights published yet.</p>
        </div>
      `
      return
    }

    publishedItems.forEach((item, index) => {
      const title = item.properties?.Title?.title?.[0]?.plain_text || "Untitled"
      const slug = item.properties?.Slug?.rich_text?.[0]?.plain_text || ""
      const date = item.properties?.Dato?.date?.start || ""
      const tags = item.properties?.Tags?.multi_select || []
      const coverFile = item.properties?.Cover?.files?.[0]
      const cover = coverFile?.file?.url || coverFile?.external?.url || null

      const formattedDate = date
        ? new Date(date).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric"
          })
        : ""

      const tagsHtml = tags.length
        ? tags.map((tag) => `<span class="badge text-bg-light me-2">${tag.name}</span>`).join("")
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
              ${tagsHtml ? `<div class="mb-2">${tagsHtml}</div>` : ""}
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