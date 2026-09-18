const $ = (s) => document.querySelector(s);

let token = localStorage.getItem("token") || "";
let currentUser = JSON.parse(localStorage.getItem("user") || "null");

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

        const select = $("#course");

        if (!select) return;

        select.innerHTML =
            '<option value="">All courses</option>';

        allCourses.forEach(course => {
            const option = document.createElement("option");
            option.value = course.name;
            option.textContent = course.name;
            select.appendChild(option);
        });

    } catch (error) {
        console.error("Course loading error:", error);
    }
}

// =========================
// LOAD INSTITUTES
// =========================
async function loadInstitutes() {
    try {
        const q = $("#q")?.value || "";
        const city = $("#city")?.value || "";
        const course = $("#course")?.value || "";

        const params = new URLSearchParams();

        if (q) params.append("q", q);
        if (city) params.append("city", city);
        if (course) params.append("course", course);

        const institutes =
            await api("/api/institutes?" + params.toString());

        allInstitutes = institutes;

        const cards = $("#cards");

        if (!cards) return;

        $("#count").textContent =
            `${institutes.length} institute${institutes.length !== 1 ? "s" : ""}`;

        if (!institutes.length) {
            cards.innerHTML = `
                <div class="notice">
                    No institutes found.
                </div>
            `;
            return;
        }

        cards.innerHTML = institutes.map(i => {

            const maps =
                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    i.latitude && i.longitude
                        ? `${i.latitude},${i.longitude}`
                        : i.address
                )}`;

            return `
                <div class="card">

                    <div class="photo">
                        🎓
                    </div>

                    <div class="cardbody">

                        <h3>${esc(i.name)}</h3>

                        <div class="rating">
                            ⭐ ${esc(i.rating || "0")}
                        </div>

                        <p class="muted">
                            📍 ${esc(i.address)}
                        </p>

                        <p class="muted">
                            ${esc(i.city)}
                        </p>

                        <div class="tags">
                            ${(i.courses || "")
                                .split(", ")
                                .filter(Boolean)
                                .map(c =>
                                    `<span class="tag">${esc(c)}</span>`
                                )
                                .join("")}
                        </div>

                        <div class="actions">

                            <button
                                class="btn primary"
                                onclick="viewInstitute(${i.id})">
                                View
                            </button>

                            <a
                                class="btn ghost"
                                href="${maps}"
                                target="_blank">
                                Maps
                            </a>

                        </div>

                    </div>
                </div>
            `;
        }).join("");

    } catch (error) {
        console.error(error);

        const cards = $("#cards");

        if (cards) {
            cards.innerHTML = `
                <div class="notice">
                    ${esc(error.message)}
                </div>
            `;
        }
    }
}

// =========================
// LOGIN MODAL
// =========================
function openLogin() {

    $("#modal").classList.remove("hidden");

    $("#modalContent").innerHTML = `
        <h2>Login</h2>

        <p class="muted">
            Login to save your favourite institutes.
        </p>

        <form id="loginForm" class="form">

            <input
                type="email"
                id="loginEmail"
                placeholder="Email"
                required
            >

            <input
                type="password"
                id="loginPassword"
                placeholder="Password"
                required
            >

            <button class="btn primary" type="submit">
                Login
            </button>

            <div id="loginMessage"></div>

        </form>

        <p style="margin-top:15px">
            Don't have an account?
            <button
                class="btn ghost"
                onclick="openRegister()">
                Register
            </button>
        </p>
    `;

    $("#loginForm").addEventListener("submit", loginUser);
}

// =========================
// LOGIN
// =========================
async function loginUser(event) {

    event.preventDefault();

    const email = $("#loginEmail").value.trim();
    const password = $("#loginPassword").value;

    const message = $("#loginMessage");

    message.innerHTML = `
        <div class="notice">
            Logging in...
        </div>
    `;

    try {

        const data = await api("/api/login", {
            method: "POST",
            body: {
                email,
                password
            }
        });

        token = data.token;
        currentUser = data.user;

        localStorage.setItem("token", token);
        localStorage.setItem(
            "user",
            JSON.stringify(currentUser)
        );

        closeModal();

        updateLoginButton();

        alert(
            "Login successful! Welcome " +
            currentUser.name
        );

        loadInstitutes();

    } catch (error) {

        message.innerHTML = `
            <div class="notice">
                ❌ ${esc(error.message)}
            </div>
        `;
    }
}

// =========================
// REGISTER
// =========================
function openRegister() {

    $("#modal").classList.remove("hidden");

    $("#modalContent").innerHTML = `
        <h2>Create Account</h2>

        <form id="registerForm" class="form">

            <input
                type="text"
                id="registerName"
                placeholder="Full name"
                required
            >

            <input
                type="email"
                id="registerEmail"
                placeholder="Email"
                required
            >

            <input
                type="text"
                id="registerMobile"
                placeholder="Mobile number"
            >

            <input
                type="password"
                id="registerPassword"
                placeholder="Password"
                minlength="6"
                required
            >

            <button class="btn primary" type="submit">
                Register
            </button>

            <div id="registerMessage"></div>

        </form>

        <p style="margin-top:15px">
            Already have an account?
            <button
                class="btn ghost"
                onclick="openLogin()">
                Login
            </button>
        </p>
    `;

    $("#registerForm").addEventListener(
        "submit",
        registerUser
    );
}

// =========================
// REGISTER USER
// =========================
async function registerUser(event) {

    event.preventDefault();

    const name = $("#registerName").value.trim();
    const email = $("#registerEmail").value.trim();
    const mobile = $("#registerMobile").value.trim();
    const password = $("#registerPassword").value;

    const message = $("#registerMessage");

    try {

        await api("/api/register", {
            method: "POST",
            body: {
                name,
                email,
                mobile,
                password
            }
        });

        message.innerHTML = `
            <div class="notice">
                ✅ Registration successful!
                Please login.
            </div>
        `;

        setTimeout(() => {
            openLogin();
        }, 1000);

    } catch (error) {

        message.innerHTML = `
            <div class="notice">
                ❌ ${esc(error.message)}
            </div>
        `;
    }
}

// =========================
// LOGOUT
// =========================
function logoutUser() {

    token = "";
    currentUser = null;

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    updateLoginButton();

    alert("Logged out successfully.");
}

// =========================
// UPDATE LOGIN BUTTON
// =========================
function updateLoginButton() {

    const button = $("#loginBtn");

    if (!button) return;

    if (currentUser) {

        button.textContent =
            "Logout (" + currentUser.name + ")";

        button.onclick = logoutUser;

    } else {

        button.textContent = "Login";

        button.onclick = openLogin;
    }
}

// =========================
// CLOSE MODAL
// =========================
function closeModal() {

    $("#modal").classList.add("hidden");
}

// =========================
// VIEW INSTITUTE
// =========================
async function viewInstitute(id) {

    try {

        const i =
            await api("/api/institutes/" + id);

        const maps =
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                i.latitude && i.longitude
                    ? `${i.latitude},${i.longitude}`
                    : i.address
            )}`;

        $("#modal").classList.remove("hidden");

        $("#modalContent").innerHTML = `
            <h2>${esc(i.name)}</h2>

            <div class="rating">
                ⭐ ${esc(i.rating || "0")}
            </div>

            <p>
                📍 ${esc(i.address)}
            </p>

            <p>
                🏙️ ${esc(i.city)}
            </p>

            <p>
                📞 ${esc(i.phone || "Not available")}
            </p>

            <p>
                📧 ${esc(i.email || "Not available")}
            </p>

            <p>
                ${esc(i.description || "")}
            </p>

            <div class="tags">
                ${(i.courses || "")
                    .split(", ")
                    .filter(Boolean)
                    .map(c =>
                        `<span class="tag">${esc(c)}</span>`
                    )
                    .join("")}
            </div>

            <a
                href="${maps}"
                target="_blank"
                class="btn primary">
                📍 Open in Google Maps
            </a>
        `;

    } catch (error) {

        alert(error.message);
    }
}

// =========================
// PAGE START
// =========================
document.addEventListener("DOMContentLoaded", () => {

    updateLoginButton();

    loadCourses();

    loadInstitutes();

    $("#modal").addEventListener("click", (event) => {

        if (event.target.id === "modal") {
            closeModal();
        }

    });

});
