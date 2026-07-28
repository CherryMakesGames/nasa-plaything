import "./style.css";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";

const API_KEY = import.meta.env.VITE_NASA_API_KEY;
const APOD_START_DATE = "1995-06-16";

const app = document.querySelector("#app");
const today = formatDate(new Date());

let selectedDate = today;
let activeRequestController = null;

app.innerHTML = `
  <main class="page-shell">
    <header class="site-header">
      <div class="header-copy">
        <p class="eyebrow">NASA Astronomy Picture of the Day</p>
        <h1>Explore the universe</h1>

        <p class="intro">
          Discover a new photograph, illustration, or video from NASA's
          astronomical archive.
        </p>
      </div>

      <form id="date-form" class="date-toolbar">
        <div class="date-navigation">
          <button
            id="previous-button"
            class="toolbar-button icon-button"
            type="button"
            aria-label="View previous day"
            title="Previous day"
          >
            ←
          </button>

          <div class="date-field">
            <label for="date">Observation date</label>

            <input
              id="date"
              name="date"
              type="text"
              value="${today}"
              autocomplete="off"
              readonly
            />
          </div>

          <button
            id="next-button"
            class="toolbar-button icon-button"
            type="button"
            aria-label="View next day"
            title="Next day"
            disabled
          >
            →
          </button>
        </div>

        <div class="toolbar-actions">
          <button class="primary-button" type="submit">
            View
          </button>

          <button
            id="random-button"
            class="toolbar-button"
            type="button"
          >
            Random
          </button>
        </div>
      </form>
    </header>

    <section
      id="content"
      class="content"
      aria-live="polite"
      aria-busy="true"
    >
      ${createLoadingMarkup()}
    </section>

    <footer class="site-footer">
      <p>
        Content supplied by NASA's Astronomy Picture of the Day API.
      </p>
    </footer>
  </main>
`;

const form = document.querySelector("#date-form");
const dateInput = document.querySelector("#date");
const content = document.querySelector("#content");
const previousButton = document.querySelector("#previous-button");
const nextButton = document.querySelector("#next-button");
const randomButton = document.querySelector("#random-button");
const calendar = flatpickr(dateInput, {
  dateFormat: "Y-m-d",
  defaultDate: today,
  minDate: APOD_START_DATE,
  maxDate: today,
  disableMobile: true,
  monthSelectorType: "static",
  animate: true,

  onChange: ([date]) => {
    if (!date) {
      return;
    }

    setSelectedDate(formatDate(date));
  },
});

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDate(dateString) {
  return new Date(`${dateString}T12:00:00`);
}

function shiftDate(dateString, numberOfDays) {
  const date = parseDate(dateString);
  date.setDate(date.getDate() + numberOfDays);

  return formatDate(date);
}

function getRandomDate() {
  const start = parseDate(APOD_START_DATE).getTime();
  const end = parseDate(today).getTime();
  const randomTime = start + Math.random() * (end - start);

  return formatDate(new Date(randomTime));
}

function formatReadableDate(dateString) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseDate(dateString));
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function createLoadingMarkup() {
  return `
    <div class="loading-card" role="status">
      <div class="loading-orbit" aria-hidden="true"></div>
      <p>Contacting the cosmos…</p>
    </div>
  `;
}

function createErrorMarkup(message) {
  return `
    <div class="message-card error-card" role="alert">
      <p class="message-label">Mission interrupted</p>
      <h2>We could not load this picture</h2>
      <p>${escapeHtml(message)}</p>

      <button id="retry-button" class="primary-button" type="button">
        Try again
      </button>
    </div>
  `;
}

function createImageMarkup(data) {
  const imageUrl = isValidHttpUrl(data.url) ? data.url : "";
  const hdUrl = isValidHttpUrl(data.hdurl) ? data.hdurl : "";

  if (!imageUrl) {
    return `
      <div class="media-unavailable">
        <p>The image URL supplied by NASA is unavailable.</p>
      </div>
    `;
  }

  return `
    <figure class="media-frame">
      <img
        id="apod-image"
        src="${escapeHtml(imageUrl)}"
        data-hd-src="${escapeHtml(hdUrl)}"
        alt="${escapeHtml(data.title)}"
        decoding="async"
      />

      ${hdUrl
      ? `
            <button
              id="hd-button"
              class="media-action"
              type="button"
            >
              Load high resolution
            </button>
          `
      : ""
    }
    </figure>
  `;
}

function createVideoMarkup(data) {
  const videoUrl = isValidHttpUrl(data.url) ? data.url : "";

  if (!videoUrl) {
    return `
      <div class="media-unavailable">
        <p>The video URL supplied by NASA is unavailable.</p>
      </div>
    `;
  }

  return `
    <div class="media-frame video-frame">
      <iframe
        src="${escapeHtml(videoUrl)}"
        title="${escapeHtml(data.title)}"
        loading="lazy"
        allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
        referrerpolicy="strict-origin-when-cross-origin"
        allowfullscreen
      ></iframe>
    </div>
  `;
}

function createArticleMarkup(data) {
  const title = escapeHtml(data.title || "Untitled");
  const explanation = escapeHtml(
    data.explanation || "No explanation is available.",
  );
  const copyright = data.copyright
    ? `<p class="copyright">Credit: ${escapeHtml(data.copyright)}</p>`
    : "";

  const media =
    data.media_type === "image"
      ? createImageMarkup(data)
      : createVideoMarkup(data);

  return `
    <article class="apod-card">
      <header class="picture-header">
        <p class="picture-date">
          ${escapeHtml(formatReadableDate(data.date))}
        </p>

        <h2>${title}</h2>

        ${copyright}
      </header>

      ${media}

      <div class="explanation-card">
        <p class="explanation-label">About this image</p>
        <p>${explanation}</p>
      </div>
    </article>
  `;
}

function updateNavigationButtons() {
  previousButton.disabled = selectedDate <= APOD_START_DATE;
  nextButton.disabled = selectedDate >= today;
}

function setSelectedDate(date) {
  selectedDate = date;

  if (calendar.selectedDates.length === 0 || dateInput.value !== date) {
    calendar.setDate(date, false);
  }

  updateNavigationButtons();
}
async function loadPicture(date) {
  if (!API_KEY) {
    content.innerHTML = createErrorMarkup(
      "The NASA API key is missing. Add VITE_NASA_API_KEY to your environment file.",
    );
    content.setAttribute("aria-busy", "false");
    attachRetryHandler();
    return;
  }

  activeRequestController?.abort();
  activeRequestController = new AbortController();

  setSelectedDate(date);

  content.setAttribute("aria-busy", "true");
  content.innerHTML = createLoadingMarkup();

  const parameters = new URLSearchParams({
    api_key: API_KEY,
    date,
    thumbs: "true",
  });

  try {
    const response = await fetch(
      `https://api.nasa.gov/planetary/apod?${parameters}`,
      {
        signal: activeRequestController.signal,
      },
    );

    if (!response.ok) {
      let message = `NASA returned an error (${response.status}).`;

      try {
        const errorData = await response.json();
        message = errorData?.msg || errorData?.error?.message || message;
      } catch {
        // Keep the fallback error message.
      }

      throw new Error(message);
    }

    const data = await response.json();

    content.innerHTML = createArticleMarkup(data);
    content.setAttribute("aria-busy", "false");

    attachMediaHandlers();

    document.title = `${data.title} — Cosmic Archive`;
  } catch (error) {
    if (error.name === "AbortError") {
      return;
    }

    const message =
      error instanceof TypeError
        ? "A network problem prevented the request. Check your connection and try again."
        : error.message;

    content.innerHTML = createErrorMarkup(message);
    content.setAttribute("aria-busy", "false");

    attachRetryHandler();
  }
}

function attachRetryHandler() {
  document
    .querySelector("#retry-button")
    ?.addEventListener("click", () => loadPicture(selectedDate));
}

function attachMediaHandlers() {
  const image = document.querySelector("#apod-image");
  const hdButton = document.querySelector("#hd-button");

  if (!image || !hdButton) {
    return;
  }

  const loadHighResolution = () => {
    const hdUrl = image.dataset.hdSrc;

    if (!hdUrl || image.src === hdUrl) {
      return;
    }

    const highResolutionImage = new Image();

    hdButton.disabled = true;
    hdButton.textContent = "Loading HD…";

    highResolutionImage.addEventListener("load", () => {
      image.src = hdUrl;
      hdButton.textContent = "High resolution loaded";
      hdButton.classList.add("loaded");
    });

    highResolutionImage.addEventListener("error", () => {
      hdButton.disabled = false;
      hdButton.textContent = "Try loading HD again";
    });

    highResolutionImage.src = hdUrl;
  };

  hdButton.addEventListener("click", loadHighResolution);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!dateInput.value) {
    return;
  }

  loadPicture(dateInput.value);
});

previousButton.addEventListener("click", () => {
  loadPicture(shiftDate(selectedDate, -1));
});

nextButton.addEventListener("click", () => {
  loadPicture(shiftDate(selectedDate, 1));
});

randomButton.addEventListener("click", () => {
  loadPicture(getRandomDate());
});

loadPicture(today);