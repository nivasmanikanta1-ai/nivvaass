const $ = (s) => document.querySelector(s);

let token = localStorage.getItem("token") || "";
let currentUser = null;
let allInstitutes = [];
let allCourses = [];

// =========================
// API HELPER
// =========================
async function api(url, options = {}) {
  const headers = options.headers || {};

  if (token) {
    headers.Authorization = "Bearer " + token;
  }

  if (options.body && typeof options.body === "object") {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

// =========================
// ESCAPE HTML
// =========================
function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// =========================
// LOAD COURSES
// =========================
async function loadCourses() {
  try {
    allCourses = await api("/api/courses");

    const select = $("#courseFilter");

    if (select) {
      select.innerHTML =
        `<option value="">All Courses</option>` +
        allCourses
          .map(
            c =>
              `<option value="${esc(c.name)}">${esc(c.name)}</option>`
          )
          .join("");
    }
  } catch (e) {
    console.error("Courses loading error:", e);
  }
}

// =========================
// INSTITUTE CARD
// ONLY NAME + VIEW DETAILS
// =========================
function card(i) {
  return `
    <article class="card">
      <div class="cardbody">
        <h3>${esc(i.name)}</h3>

        <div class="actions">
          <button
            type="button"
            class="btn primary"
            onclick="details(${i.id})">
            View Details
          </button>
        </div>
      </div>
    </article>
  `;
}

// =========================
// LOAD INSTITUTES
// =========================
async function loadInstitutes() {
  try {
    const city = $("#city")?.value || "";
    const course = $("#courseFilter")?.value || "";
    const search = $("#search")?.value || "";

    let url = "/api/institutes?";

    if (city) {
      url += `city=${encodeURIComponent(city)}&`;
    }

    if (course) {
      url += `course=${encodeURIComponent(course)}&`;
    }

    if (search) {
      url += `search=${encodeURIComponent(search)}&`;
    }

    allInstitutes = await api(url);

    const container = $("#results");

    if (!container) return;

    if (!allInstitutes.length) {
      container.innerHTML = `
        <p class="muted">
          No institutes found.
        </p>
      `;
      return;
    }

    container.innerHTML = allInstitutes
      .map(card)
      .join("");

  } catch (e) {
    console.error("Institute loading error:", e);

    const container = $("#results");

    if (container) {
      container.innerHTML = `
        <p class="muted">
          Unable to load institutes.
        </p>
      `;
    }
  }
}

// =========================
// VIEW DETAILS
// =========================
async function details(id) {
  try {
    const i = await api("/api/institutes/" + id);

    const maps =
      "https://www.google.com/maps/search/?api=1&query=" +
      encodeURIComponent(i.address || i.name);

    $("#modalContent").innerHTML = `
      <h2>${esc(i.name)}</h2>

      <p class="rating">
        ★ ${i.rating || "New"}
      </p>

      <p class="muted">
        📍 ${esc(i.address || "Address not provided")}
      </p>

      <p>
        ${esc(i.description || "No description available.")}
      </p>

      <p class="muted">
        📞 ${esc(i.phone || "Not provided")}<br>
        ✉️ ${esc(i.email || "Not provided")}
      </p>

      ${
        i.courses
          ? `
            <div class="tags">
              ${String(i.courses)
                .split(",")
                .map(
                  c =>
                    `<span class="tag">${esc(c.trim())}</span>`
                )
                .join("")}
            </div>
          `
          : ""
      }

      <div class="actions" style="margin-top:20px;">

        <a
          class="btn primary"
          target="_blank"
          rel="noopener noreferrer"
          href="${maps}">
          📍 Open in Google Maps
        </a>

        ${
          token
            ? `
              <button
                type="button"
                class="btn"
                onclick="save(${i.id})">
                ❤️ Save
              </button>
            `
            : ""
        }

      </div>
    `;

    $("#modal").classList.remove("hidden");

  } catch (e) {
    console.error(e);

    alert(
      "Unable to load institute details: " +
      e.message
    );
  }
}

// =========================
// CLOSE MODAL
// =========================
function closeModal() {
  $("#modal").classList.add("hidden");
}

// =========================
// SAVE INSTITUTE
// =========================
async function save(id) {
  if (!token) {
    alert("Please login to save institutes.");
    return;
  }

  try {
    await api("/api/favorites", {
      method: "POST",
      body: {
        institute_id: id
      }
    });

    alert("Institute saved successfully.");

  } catch (e) {
    alert("Unable to save institute: " + e.message);
  }
}

// =========================
// LOGIN
// =========================
async function login(email, password) {
  try {
    const data = await api("/api/login", {
      method: "POST",
      body: {
        email,
        password
      }
    });

    token = data.token;
    localStorage.setItem("token", token);

    currentUser = data.user || null;

    alert("Login successful.");

    closeModal();

    await loadInstitutes();

  } catch (e) {
    alert("Login failed: " + e.message);
  }
}

// =========================
// REGISTER
// =========================
async function register(name, email, password) {
  try {
    await api("/api/register", {
      method: "POST",
      body: {
        name,
        email,
        password
      }
    });

    alert("Registration successful. Please login.");

  } catch (e) {
    alert("Registration failed: " + e.message);
  }
}

// =========================
// LOGOUT
// =========================
function logout() {
  token = "";
  currentUser = null;

  localStorage.removeItem("token");

  alert("Logged out successfully.");

  loadInstitutes();
}

// =========================
// SEARCH
// =========================
function searchInstitutes() {
  loadInstitutes();
}

// =========================
// INITIALIZE
// =========================
async function init() {
  await loadCourses();
  await loadInstitutes();
}

// =========================
// EVENT LISTENERS
// =========================
document.addEventListener("DOMContentLoaded", () => {

  const searchBtn = $("#searchBtn");

  if (searchBtn) {
    searchBtn.addEventListener(
      "click",
      searchInstitutes
    );
  }

  const search = $("#search");

  if (search) {
    search.addEventListener("keyup", e => {
      if (e.key === "Enter") {
        searchInstitutes();
      }
    });
  }

  const courseFilter = $("#courseFilter");

  if (courseFilter) {
    courseFilter.addEventListener(
      "change",
      loadInstitutes
    );
  }

  const city = $("#city");

  if (city) {
    city.addEventListener(
      "change",
      loadInstitutes
    );
  }

  const modal = $("#modal");

  if (modal) {
    modal.addEventListener("click", e => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  init();
});
