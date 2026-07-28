import './style.css'

const API_KEY = import.meta.env.VITE_NASA_API_KEY;

const app = document.querySelector("#app");
const today = new Date().toISOString().split("T")[0];

app.innerHTML = `
  <main>
    <header class="site-header">
      <p class="eyebrow">NASA Astronomy Picture of the Day</p>
      <h1>Explore the universe</h1>

      <form id="date-form">
        <label for="date">Choose a day</label>

        <div class="date-controls">
          <input
            id="date"
            name="date"
            type="date"
            min="1995-06-16"
            max="${today}"
            value="${today}"
          />

          <button type="submit">View picture</button>
        </div>
      </form>
    </header>

    <section id="content" aria-live="polite">
      <p class="status">Loading...</p>
    </section>
  </main>
`;

const form = document.querySelector("#date-form");
const dateInput = document.querySelector("#date");
const content = document.querySelector("#content");

function loadPicture(date)
{
  content.innerHTML = `<p class="status">Loading...</p>`

fetch(
    `https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&date=${date}`,
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch NASA data");
      }

      return response.json();
    })
    .then((data) => {
      let media;

      if (data.media_type === "image") {
        media = `
          <img
            src="${data.url}"
            alt="${data.title}"
          />
        `;
      } else {
        media = `
          <iframe
            src="${data.url}"
            title="${data.title}"
            allowfullscreen
          ></iframe>
        `;
      }

      content.innerHTML = `
        <article>
          <p class="picture-date">${data.date}</p>
          <h2>${data.title}</h2>

          ${media}

          <p class="explanation">${data.explanation}</p>
        </article>
      `;
    })
    .catch((error) => {
      content.innerHTML = `
        <p class="status error">Error: ${error.message}</p>
      `;
    });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  loadPicture(dateInput.value);
});

loadPicture(today);