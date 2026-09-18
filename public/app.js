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
// LOGIN BUTTON
// =========================
document.addEventListener("DOMContentLoaded", () => {

    const loginBtn = $("#loginBtn");

    if (loginBtn) {
        loginBtn.addEventListener("click", () => {

            if (token && currentUser) {
                logoutUser();
            } else {
                openLogin();
            }

        });
    }

    updateLoginButton();

    loadCourses();
    loadInstitutes();

    // Close modal when clicking outside
    const modal = $("#modal");

    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
});

// =========================
// UPDATE LOGIN BUTTON
// =========================
function updateLoginButton() {

    const btn = $("#loginBtn");

    if (!btn) return;

    if (token && currentUser) {
        btn.textContent = "Logout";
    } else {
        btn.textContent = "Login";
    }
}

// =========================
// OPEN LOGIN
// =========================
function openLogin() {

    const modal = $("#modal");
    const content = $("#modalContent");

    if (!modal || !content) {
        alert("Login modal not found. Check index.html");
        return;
    }

    content.innerHTML = `
        <h2>Login</h2>

        <form id="loginForm" class="form">

            <label>Email</label>
            <input
                type="email"
                id="loginEmail"
                placeholder="Enter your email"
                required
            >

            <label>Password</label>
            <input
                type="password"
                id="loginPassword"
                placeholder="Enter your password"
                required
            >

            <button type="submit" class="btn primary">
                Login
            </button>

            <p id="loginMessage" class="notice"></p>

            <p>
                Don't have an account?
                <button
                    type="button"
                    class="btn ghost"
                    onclick="openRegister()"
                >
                    Register
                </button>
            </p>

        </form>
    `;

    modal.classList.remove("hidden");

    const form = $("#loginForm");

    if (form) {
        form.addEventListener("submit", loginUser);
    }
}

// =========================
// LOGIN USER
// =========================
async function loginUser(e) {

    e.preventDefault();

    const email = $("#loginEmail").value.trim();
    const password = $("#loginPassword").value;

    const message = $("#loginMessage");

    try {

        message.textContent = "Logging in...";

        const data = await api("/api/login", {
            method: "POST",
            body: {
                email: email,
                password: password
            }
        });

        token = data.token;
        currentUser = data.user;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(currentUser));

        updateLoginButton();

        message.textContent = "Login successful!";

        setTimeout(() => {
            closeModal();
            loadInstitutes();
        }, 500);

    } catch (error) {

        message.textContent = error.message || "Login failed";
    }
}

// =========================
// OPEN REGISTER
// =========================
function openRegister() {

    const modal = $("#modal");
    const content = $("#modalContent");

    if (!modal || !content) return;

    content.innerHTML = `
        <h2>Create Account</h2>

        <form id="registerForm" class="form">

            <label>Name</label>
            <input
                type="text"
                id="registerName"
                placeholder="Enter your name"
                required
            >

            <label>Email</label>
            <input
                type="email"
                id="registerEmail"
                placeholder="Enter your email"
                required
            >

            <label>Password</label>
            <input
                type="password"
                id="registerPassword"
                placeholder="Enter password"
                required
            >

            <button type="submit" class="btn primary">
                Register
            </button>

            <p id="registerMessage" class="notice"></p>

            <p>
                Already have an account?
                <button
                    type="button"
                    class="btn ghost"
                    onclick="openLogin()"
                >
                    Login
                </button>
            </p>

        </form>
    `;

    modal.classList.remove("hidden");

    const form = $("#registerForm");

    if (form) {
        form.addEventListener("submit", registerUser);
    }
}

// =========================
// REGISTER USER
// =========================
async function registerUser(e) {

    e.preventDefault();

    const name = $("#registerName").value.trim();
    const email = $("#registerEmail").value.trim();
    const password = $("#registerPassword").value;

    const message = $("#registerMessage");

    try {

        message.textContent = "Creating account...";

        await api("/api/register", {
            method: "POST",
            body: {
                name: name,
                email: email,
                password: password
            }
        });

        message.textContent = "Registration successful!";

        setTimeout(() => {
            openLogin();
        }, 700);

    } catch (error) {

        message.textContent =
            error.message || "Registration failed";
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

    alert("Logged out successfully");
}

// =========================
// CLOSE MODAL
// =========================
function closeModal() {

    const modal = $("#modal");

    if (modal) {
        modal.classList.add("hidden");
    }
}

// =========================
// LOAD COURSES
// =========================
async function loadCourses() {

    try {

        allCourses = await api("/api/courses");

        const select = $("#course");

        if (!select) return;

        select.innerHTML = `
            <option value="">All courses</option>
        `;

        allCourses.forEach(course => {

            select.innerHTML += `
                <option value="${esc(course.id)}">
                    ${esc(course.name)}
                </option>
            `;

        });

    } catch (error) {

        console.error("Courses error:", error);
    }
}

// =========================
// LOAD INSTITUTES
// =========================
async function loadInstitutes() {

    try {

        const q = $("#q")?.value.trim() || "";
        const city = $("#city")?.value || "";
        const course = $("#course")?.value || "";

        let url = "/api/institutes?";

        const params = new URLSearchParams();

        if (q) {
            params.append("q", q);
        }

        if (city) {
            params.append("city", city);
        }

        if (course) {
            params.append("course", course);
        }

        url += params.toString();

        allInstitutes = await api(url);

        displayInstitutes(allInstitutes);

    } catch (error) {

        console.error("Institutes error:", error);

        const cards = $("#cards");

        if (cards) {
            cards.innerHTML = `
                <p class="notice">
                    Unable to load institutes.
                </p>
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

    if (count) {
        count.textContent =
            `${institutes.length} institutes`;
    }

    if (!institutes.length) {

        cards.innerHTML = `
            <p class="notice">
                No institutes found.
            </p>
        `;

        return;
    }

    cards.innerHTML = institutes.map(institute => {

        return `
            <div class="card">

                <h3>${esc(institute.name)}</h3>

                <p>
                    📍 ${esc(institute.city || "")}
                </p>

                <p>
                    ${esc(institute.address || "")}
                </p>

                <button
                    class="btn primary"
                    onclick="viewInstitute(${institute.id})"
                >
                    View Details
                </button>

            </div>
        `;

    }).join("");
}

// =========================
// VIEW INSTITUTE
// =========================
function viewInstitute(id) {

    const institute = allInstitutes.find(
        item => Number(item.id) === Number(id)
    );

    if (!institute) {
        alert("Institute not found");
        return;
    }

    const modal = $("#modal");
    const content = $("#modalContent");

    if (!modal || !content) return;

    const mapQuery =
        encodeURIComponent(
            `${institute.name}, ${institute.address || institute.city}`
        );

    content.innerHTML = `
        <h2>${esc(institute.name)}</h2>

        <p>
            📍 ${esc(institute.address || "")}
        </p>

        <p>
            🏙️ ${esc(institute.city || "")}
        </p>

        <a
            href="https://www.google.com/maps/search/?api=1&query=${mapQuery}"
            target="_blank"
            class="btn primary"
        >
            Open in Google Maps
        </a>
    `;

    modal.classList.remove("hidden");
}

// =========================
// MAKE FUNCTIONS GLOBAL
// =========================
window.openLogin = openLogin;
window.openRegister = openRegister;
window.loginUser = loginUser;
window.registerUser = registerUser;
window.logoutUser = logoutUser;
window.closeModal = closeModal;
window.loadInstitutes = loadInstitutes;
window.viewInstitute = viewInstitute;

After replacing it, restart "npm start" and refresh the browser. Then click Login.
