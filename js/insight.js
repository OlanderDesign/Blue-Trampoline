const params = new URLSearchParams(window.location.search)
const slug = params.get("slug")
const container = document.getElementById("insightContainer")

if (!slug) {
  container.innerHTML = `
    <p class="body-text">No insight selected.</p>
    <p class="body-text"><a href="insights.html" class="link-brand">Back to insights</a></p>
  `
} else {
  fetch("/insights.json")
    .then((response) => response.json())
    .then((data) => {
      if (!data.results || !Array.isArray(data.results)) {
        throw new Error("Invalid insights response format")
      }

      const item = data.results.find((entry) => entry.slug === slug)

      if (!item) {
        container.innerHTML = `
          <p class="body-text">Insight not found.</p>
          <p class="body-text"><a href="insights.html" class="link-brand">Back to insights</a></p>
        `
        return
      }

      document.title = `Blue Trampoline – ${item.title}`

      const formattedDate = formatDate(item.date)

      const topicHtml = item.topic?.length
        ? item.topic.map((value) => `<span class="badge text-bg-light me-2 mb-2">${value}</span>`).join("")
        : ""

      const focusHtml = item.focus?.length
        ? item.focus.map((value) => `<span class="badge text-bg-secondary me-2 mb-2">${value}</span>`).join("")
        : ""

      container.innerHTML = `
        <div class="row">
          <div class="col-12 col-lg-10">

            <p class="body-text mb-4" data-aos="fade-up">
              <a href="insights.html" class="link-brand">← Back to insights</a>
            </p>

            ${item.cover ? `
              <div class="mb-4" data-aos="fade-up" data-aos-delay="50">
                <img src="${item.cover}" class="image-soft w-100" alt="${item.title}">
              </div>
            ` : ""}

            <p class="body-text small mb-2" data-aos="fade-up" data-aos-delay="100">${formattedDate}</p>

            <h1 class="title mb-3" data-aos="fade-up" data-aos-delay="150">${item.title || "Untitled"}</h1>

            ${item.summary ? `
              <p class="body-text mb-4" data-aos="fade-up" data-aos-delay="200">${item.summary}</p>
            ` : ""}

            ${topicHtml ? `
              <div class="mb-1" data-aos="fade-up" data-aos-delay="250">
                ${topicHtml}
              </div>
            ` : ""}

            ${focusHtml ? `
              <div class="mb-4" data-aos="fade-up" data-aos-delay="300">
                ${focusHtml}
              </div>
            ` : ""}

            <div class="insight-content" data-aos="fade-up" data-aos-delay="350">
              ${item.content_html || "<p class='body-text'>No content yet.</p>"}
            </div>

          </div>
        </div>
      `

      if (typeof AOS !== "undefined") {
        AOS.refresh()
      }
    })
    .catch((error) => {
      console.error("Error loading insight:", error)

      container.innerHTML = `
        <p class="body-text">Unable to load this insight right now.</p>
        <p class="body-text"><a href="insights.html" class="link-brand">Back to insights</a></p>
      `
    })
}

function formatDate(dateString) {
  if (!dateString) {
    return ""
  }

  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  })
}