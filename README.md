# Smart Training Centre Finder — Render Ready

Single-unit full-stack app: Express backend serves the HTML/CSS/JS frontend. Production database is PostgreSQL.

## Render
1. Push this folder to GitHub.
2. In Render choose **New → Blueprint** and select the repo. `render.yaml` creates the web service and Postgres database.
3. Or create a Node Web Service manually: Build `npm install`, Start `npm start`.
4. Connect Render Postgres and set `DATABASE_URL`; set a strong `JWT_SECRET`.
5. Open the generated `onrender.com` URL.

## Features
Register/login, Kakinada centre search, course filtering, View Details, course list, phone/address, Google Maps Directions links, browser current-location endpoint, PostgreSQL persistence.

## Important
The Google Maps button opens Google Maps; the app does not recreate a map. Current-location nearest sorting requires centre latitude/longitude. The supplied seed data leaves coordinates empty rather than inventing them, so normal area search works immediately; add verified coordinates to enable nearest-distance sorting.

Do not commit `.env` or database credentials.
