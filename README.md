# SafeRoute

**Crowd-sourced emergency monitoring and safe route recommendation for Phagwara, Jalandhar and Ludhiana.**

SafeRoute lets people report road hazards such as floods, blocked roads, accidents and fires. The community confirms or disputes each report, and the app recommends the safest route between two places by taking the verified hazards near each route into account.

**Live demo:**  https://safe-route-0cmm.onrender.com/
---

## Table of contents

1. [Why SafeRoute](#why-saferoute)
2. [Features](#features)
3. [Dashboards](#dashboards)
4. [Tech stack](#tech-stack)
5. [How it works](#how-it-works)
6. [Project structure](#project-structure)
7. [API overview](#api-overview)
8. [Getting started](#getting-started)
9. [Environment variables](#environment-variables)
10. [Seeding demo data](#seeding-demo-data)
11. [Deployment](#deployment)
12. [Screenshots](#screenshots)
13. [Limitations](#limitations)
14. [License](#license)

---

## Why SafeRoute

During monsoon floods and other local emergencies, general map apps choose routes by speed, not safety. They do not know that a bridge is damaged or an underpass is under water. SafeRoute fills that gap with community-reported, community-verified hazard data, so a driver can pick a route that avoids the dangerous spots.

> SafeRoute is advisory only. In a real emergency, call **112**.

## Features

- **Accounts and roles**: register, log in, and use separate user and admin access (JWT sessions, bcrypt-hashed passwords, live password-rule checklist).
- **Incident reporting**: report waterlogging, road blocks, accidents, fires, unsafe areas, traffic jams, ambulance-access problems and shelter status changes, each with a severity level and a map location.
- **Duplicate protection**: a report of the same type within 150 m in the last 6 hours is rejected, and coordinates are validated.
- **Live map**: all active incidents and shelters on an interactive Leaflet map with a dark theme.
- **Community verification**: users confirm a report or flag it as false, one vote per user per incident.
- **Safe route recommendation**: alternative routes come from OSRM and each is scored by the incidents near it; the lowest-risk route is recommended with a risk level (Low, Medium, High, Critical).
- **Place search**: search by place name instead of typing latitude and longitude (Nominatim through the `/api/geocode` endpoint).
- **Shelters**: relief camps with capacity, occupancy, facilities and contact details.
- **Notifications**: users are told when their reports are confirmed.
- **Automatic expiry**: old incidents expire, so the map shows current conditions.
- **Responsive design**: works from phones to desktops.

## Dashboards

SafeRoute has two dashboards.

### User dashboard (`/dashboard`)

For logged-in citizens. It gives a personal overview of the situation and their own activity:

- Summary counts of active incidents and shelters.
- Quick links to report an incident, open the live map, find a safe route and view shelters.
- The user's recent reports and notifications.
- The profile page (`/profile`) shows reputation and report history.

### Admin dashboard (`/admin`)

For administrators only (the API checks the admin role, so ordinary users get a 403).

- System statistics: total users, incidents by type and status, and verifications.
- A "Last 7 days" chart of reports.
- Incident moderation: review incidents and remove false or resolved reports.
- User overview.

Log in as an admin to open it. See [Demo accounts](#demo-accounts).

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose (GeoJSON points for locations) |
| Authentication | JSON Web Tokens, bcryptjs |
| Frontend | Plain HTML, CSS and JavaScript |
| Maps | Leaflet with OpenStreetMap tiles |
| Routing | OSRM (Open Source Routing Machine) |
| Place search | Nominatim (OpenStreetMap geocoder) |
| Hosting | Render (app) and MongoDB Atlas (database) |

## How it works

1. A user logs in and reports a hazard at a point on the map.
2. The server validates it, blocks duplicates, saves it with an expiry time, and shows it on the live map.
3. Other users confirm it or mark it as a false report, which updates its verification count.
4. When someone asks for a route, the server gets alternative routes from OSRM, counts the active incidents near each route (weighted by type, severity and verification), computes a risk score, and returns the lowest-risk option with its risk level.

## Project structure

```
SafeRoute/
├── public/                  Frontend pages, styles and scripts
│   ├── index.html           Home page
│   ├── login.html, register.html
│   ├── dashboard.html       User dashboard
│   ├── report.html          Report an incident
│   ├── route.html           Safe route finder
│   ├── shelters.html        Shelters list and map
│   ├── profile.html         User profile
│   ├── admin.html           Admin dashboard
│   └── theme.css            Dark theme and animations
├── server/
│   ├── server.js            Express app entry point
│   ├── seed.js              Demo data seeder
│   ├── resetPassword.js     Sets a hashed password for an account
│   ├── config/db.js         MongoDB connection
│   ├── controllers/         Request handlers
│   ├── middleware/          auth.js, admin.js
│   ├── models/              User, Incident, Shelter, Verification, Notification
│   ├── routes/              API route definitions
│   └── services/
│       └── routeRiskService.js   Route risk scoring
├── .env.example             Example environment settings
├── package.json
└── README.md
```

## API overview

All endpoints return JSON. Protected endpoints need an `Authorization: Bearer <token>` header.

| Area | Base path | Purpose |
|---|---|---|
| Health | `/api/health` | Check that the API is running |
| Auth | `/api/auth` | Register and log in |
| Incidents | `/api/incidents` | List, create and verify incidents |
| Shelters | `/api/shelters` | List shelters |
| Routes | `/api/routes` | Safe route recommendation with risk level |
| Users | `/api/users` | Profile and notifications |
| Admin | `/api/admin` | Statistics and moderation (admin only) |
| Geocode | `/api/geocode?q=` | Place name to coordinates |
| Stats | `/api/stats` | Summary counts for the home page |

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) 18 or newer
- [MongoDB](https://www.mongodb.com/try/download/community) running locally, or a MongoDB Atlas connection string
- Git

### Run it locally

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/saferoute.git
cd saferoute

# 2. Install dependencies
npm install

# 3. Create your settings file
cp .env.example .env        # on Windows PowerShell: copy .env.example .env
# then edit .env (see "Environment variables" below)

# 4. Load demo data
npm run seed

# 5. Start the server
npm run dev                  # development, restarts on changes
# or: npm start
```

Open **http://localhost:5000**. Always open the pages through this address and not by double-clicking the HTML files, otherwise the maps and API calls are blocked.

### npm scripts

| Command | What it does |
|---|---|
| `npm start` | Starts the server |
| `npm run dev` | Starts the server with nodemon (auto-restart) |
| `npm run seed` | Wipes the database and loads demo data |

## Environment variables

Create a `.env` file in the project root. **Never commit it.**

| Variable | Purpose | Example |
|---|---|---|
| `MONGODB_URI` | Database connection string | `mongodb://127.0.0.1:27017/saferoute` |
| `JWT_SECRET` | Long random secret used to sign login tokens | output of `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | How long a login lasts | `7d` |
| `NODE_ENV` | `development` or `production` | `production` |
| `OSRM_BASE_URL` | Routing service address | `https://router.project-osrm.org` |
| `INCIDENT_TTL_HOURS` | Hours before a new incident expires | `720` |
| `PORT` | Server port (hosting platforms set this for you) | `5000` |

## Seeding demo data

`npm run seed` **deletes** all users, incidents, shelters, verifications and notifications, then inserts 12 users, 8 shelters, 30 incidents, 15 verifications and a few notifications around Phagwara, Jalandhar and Ludhiana. Seeded incidents stay active for 90 days.

Optional settings before seeding (PowerShell shown):

```powershell
$env:MONGODB_URI='your-connection-string'      # seed a specific database
$env:SEED_ADMIN_PASSWORD='ChooseAPassword1'    # password for admin@saferoute.com
$env:SEED_USER_PASSWORD='ChooseAnother1'       # password for user@saferoute.com
npm run seed
```

If the two password variables are not set, the seed uses simple local-only defaults, so always set them for a public database. The other ten users get random passwords.

To change a password later:

```bash
node server/resetPassword.js admin@saferoute.com 'NewPassword1' admin
```

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Admin | `admin@saferoute.com` | `<provided to faculty>` |
| User | `user@saferoute.com` | `<provided to faculty>` |

## Deployment

SafeRoute runs on free tiers of **Render** (web service) and **MongoDB Atlas** (database).

1. Create a free MongoDB Atlas cluster, add a database user, and allow `0.0.0.0/0` under Network Access.
2. Seed the Atlas database with the commands above.
3. Push the code to GitHub.
4. On Render, create a **Web Service** from the repository: build command `npm install`, start command `npm start`, health check path `/api/health`.
5. Add the environment variables from the table above (do not add `PORT`).

Free Render services sleep after 15 minutes without traffic, so the first visit can take about a minute. A free uptime monitor pinging `/api/health` every 5 minutes keeps it awake.

## Screenshots

Add your images to a `docs/screenshots/` folder and the links below will show them.

| Home | Live map |
|---|---|
| ![Home](docs/screenshots/home.png) | ![Live map](docs/screenshots/live-map.png) |

| Safe route | User dashboard |
|---|---|
| ![Safe route](docs/screenshots/route.png) | ![User dashboard](docs/screenshots/dashboard.png) |

| Admin dashboard | Report an incident |
|---|---|
| ![Admin dashboard](docs/screenshots/admin.png) | ![Report](docs/screenshots/report.png) |

## Limitations

- Route and place search use the free public OSRM and Nominatim servers, which allow about one request per second and offer no uptime guarantee. Heavy use needs self-hosted instances.
- The safety value depends on enough users reporting and verifying incidents.
- Incidents expire automatically, so the map reflects recent reports only.
- There is no live traffic data, voice navigation or native mobile app.

## License

MIT
