import './style.css'

const API_KEY = import.meta.env.VITE_NASA_API_KEY;

const app = document.querySelector("#app");

app.innerHTML = "<p>Loading...</p>";

fetch(`https://api.nasa.gov/planetary/apod?api_key=${API_KEY}`)
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

    app.innerHTML = `
      <main>
        <h1>${data.title}</h1>

        ${media}

        <p>${data.explanation}</p>
      </main>
    `;
  })
  .catch((error) => {
    app.innerHTML = `
      <p>Error: ${error.message}</p>
    `;
  });