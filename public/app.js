const $ = (s) => document.querySelector(s);

let allInstitutes = [];

// =========================
// API HELPER
// =========================
async function api(url, options = {}) {
  const headers = options.headers || {};

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
// LOAD INSTITUTES
// =========================
async function loadInstitutes() {
  try {
    const search = $("#q")?.value.trim() || "";
    const city = $("#city")?.value || "";

    const params = new URLSearchParams();

    if (search) {
      params.append("q", search);
    }

    if (city) {
      params.append("city", city);
    }

    const query = params.toString();

    const url = query
      ? `/api/institutes?${query}`
      : "/api/institutes";

    allInstitutes = await api(url);

    displayInstitutes(allInstitutes);

  } catch (error) {
    console.error("Error loading institutes:", error);

    const cards = $("#cards");

    if (cards) {
      cards.innerHTML = `
        <div class="notice">
          Unable to load institutes.
          Please check the server and database.
        </div>
      `;
    }
  }
}

// =========================
// DISPLAY INSTITUTES
// =========================
function displayInstitutes(institutes) {
  const cards = $("#cards");
  const count = $("#count");

  if (!cards) return;

  if (!institutes || institutes.length === 0) {
    cards.innerHTML = `
      <div class="notice">
        No training institutes found.
      </div>
    `;

    if (count) {
      count.textContent = "0 institutes";
    }

    return;
  }

  if (count) {
    count.textContent =
      `${institutes.length} institute${institutes.length !== 1 ? "s" : ""}`;
  }

  cards.innerHTML = institutes.map((institute) => `
    <div class="institute-card">

      <h3>${esc(institute.name)}</h3>

      <p>
        <strong>City:</strong>
        ${esc(institute.city || "")}
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
        ${esc(institute.description || "")}
      </p>

      <button
        class="btn primary"
        onclick="viewInstitute(${Number(institute.id)})">
        View Location
      </button>

    </div>
  `).join("");
}

// =========================
// VIEW INSTITUTE LOCATION
// =========================
function viewInstitute(id) {
  const institute = allInstitutes.find(
    (item) => Number(item.id) === Number(id)
  );

  if (!institute) {
    alert("Institute not found.");
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

// =========================
// PAGE LOAD
// =========================
document.addEventListener("DOMContentLoaded", () => {
  loadInstitutes();
});
