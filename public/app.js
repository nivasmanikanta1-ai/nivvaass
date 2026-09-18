// Training Institute Finder
// Frontend JavaScript
// Login / Register removed

const $ = (selector) => document.querySelector(selector);

let allInstitutes = [];
let allCourses = [];

// ===============================
// API Helper
// ===============================
async function api(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || "Something went wrong");
  }

  return data;
}

// ===============================
// Escape HTML
// ===============================
function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ===============================
// Load Courses
// ===============================
async function loadCourses() {
  try {
    allCourses = await api("/api/courses");

    const courseSelect = $("#course");

    if (courseSelect) {
      courseSelect.innerHTML =
        '<option value="">All Courses</option>';

      allCourses.forEach((course) => {
        const option = document.createElement("option");

        option.value = course.id;
        option.textContent = course.name;

        courseSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Error loading courses:", error);
  }
}

// ===============================
// Load Institutes
// ===============================
async function loadInstitutes() {
  try {
    const searchInput = $("#search");
    const citySelect = $("#city");
    const courseSelect = $("#course");

    const search =
      searchInput?.value.trim() || "";

    const city =
      citySelect?.value || "";

    const course =
      courseSelect?.value || "";

    const params = new URLSearchParams();

    if (search) {
      params.append("search", search);
    }

    if (city) {
      params.append("city", city);
    }

    if (course) {
      params.append("course", course);
    }

    const url =
      "/api/institutes" +
      (params.toString()
        ? "?" + params.toString()
        : "");

    allInstitutes = await api(url);

    displayInstitutes(allInstitutes);
  } catch (error) {
    console.error("Error loading institutes:", error);

    const container = $("#institutes");

    if (container) {
      container.innerHTML = `
        <div class="notice">
          Unable to load institutes.
          Please make sure the server and database are running.
        </div>
      `;
    }
  }
}

// ===============================
// Display Institutes
// ===============================
function displayInstitutes(institutes) {
  const container = $("#institutes");

  if (!container) {
    console.error("Institutes container not found.");
    return;
  }

  if (!institutes || institutes.length === 0) {
    container.innerHTML = `
      <div class="notice">
        No training institutes found.
      </div>
    `;
    return;
  }

  container.innerHTML = institutes
    .map((institute) => {
      return `
        <div class="institute-card">

          <h3>${esc(institute.name)}</h3>

          <p>
            <strong>City:</strong>
            ${esc(institute.city)}
          </p>

          <p>
            <strong>Address:</strong>
            ${esc(institute.address || "Not available")}
          </p>

          <p>
            <strong>Phone:</strong>
            ${esc(institute.phone || "Not available")}
          </p>

          <p>
            <strong>Description:</strong>
            ${esc(institute.description || "No description available")}
          </p>

          <button
            class="btn"
            onclick="viewInstitute(${Number(institute.id)})">
            View Location
          </button>

        </div>
      `;
    })
    .join("");
}

// ===============================
// View Institute Location
// ===============================
function viewInstitute(id) {
  const institute = allInstitutes.find(
    (item) => Number(item.id) === Number(id)
  );

  if (!institute) {
    alert("Institute details not found.");
    return;
  }

  const address = [
    institute.name,
    institute.address,
    institute.city
  ]
    .filter(Boolean)
    .join(", ");

  const mapsUrl =
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(address);

  window.open(mapsUrl, "_blank");
}

// ===============================
// Search Button
// ===============================
function setupSearch() {
  const searchButton = $("#searchBtn");

  if (searchButton) {
    searchButton.addEventListener(
      "click",
      loadInstitutes
    );
  }

  const searchInput = $("#search");

  if (searchInput) {
    searchInput.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Enter") {
          loadInstitutes();
        }
      }
    );
  }

  const citySelect = $("#city");

  if (citySelect) {
    citySelect.addEventListener(
      "change",
      loadInstitutes
    );
  }

  const courseSelect = $("#course");

  if (courseSelect) {
    courseSelect.addEventListener(
      "change",
      loadInstitutes
    );
  }
}

// ===============================
// Page Start
// ===============================
document.addEventListener(
  "DOMContentLoaded",
  async () => {
    setupSearch();

    await loadCourses();

    await loadInstitutes();
  }
);
