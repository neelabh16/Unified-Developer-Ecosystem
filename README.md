# 🌐 DevVerse — Unified Developer Ecosystem

> **A production-grade, full-stack developer platform connecting builders, hackathons, engineering squads, technical knowledge, and project showcases in a single unified ecosystem.**

<p align="center">
  <a href="https://devverse-t5cg.onrender.com/" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Platform-devverse--t5cg.onrender.com-7c6fff?style=for-the-badge&logo=render&logoColor=white" alt="Live Platform">
  </a>
  <img src="https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/MongoDB%20Atlas-Cloud%20Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB Atlas">
  <img src="https://img.shields.io/badge/OAuth%202.0-Google%20%26%20GitHub-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="OAuth 2.0">
  <img src="https://img.shields.io/badge/Jest-54%20Tests%20Passing-C21325?style=for-the-badge&logo=jest&logoColor=white" alt="Jest Tests">
</p>

---

## 🚀 Live Deployment

* **Production URL:** [https://devverse-t5cg.onrender.com/](https://devverse-t5cg.onrender.com/)
* **API Base:** `https://devverse-t5cg.onrender.com/api/v1`
* **Status:** 🟢 **Live & Operational** (Unified Full-Stack Deployment on Render)

---

## 📖 Overview

Modern developers are forced to fragment their online journey across multiple isolated tools:
* **GitHub** for repositories
* **Devpost** for hackathon submissions
* **Discord / Slack** for developer communities
* **LinkedIn** for professional resumes & portfolios
* **Medium / Dev.to** for technical posts

**DevVerse unifies these experiences into one connected, high-performance ecosystem.** From finding hackathon teammates and competing in live events to publishing open-source projects, writing architectural post-mortems in the Codex, and tracking reputation on global leaderboards — everything happens seamlessly in one place.

---

## 🏗️ Full-Stack System Architecture

```text
                           ┌───────────────────────────┐
                           │   Modern Web Client (SPA) │
                           │  Vanilla ES6+ / Responsive │
                           └─────────────┬─────────────┘
                                         │
                   HTTPS / WSS / REST APIs │ Cookie / Bearer Auth
                                         ▼
                     ┌───────────────────────────────────────┐
                     │         Express 4 REST Server         │
                     │  (Reverse Proxy Trusted / Rate Limiter│
                     │   Helmet CSP / Mongo Sanitize / CSRF) │
                     └───────────────────┬───────────────────┘
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        │                                │                                │
        ▼                                ▼                                ▼
┌─────────────────┐            ┌──────────────────┐             ┌──────────────────┐
│  Authentication │            │ Domain Modules   │             │ Gamification     │
│  - Bcrypt (12)  │            │ - Projects CRUD  │             │ - Activity Ledger│
│  - JWT Engine   │            │ - Hackathons     │             │ - Atomic $inc    │
│  - Google OAuth │            │ - Squad Matcher  │             │ - Tier Milestones│
│  - GitHub OAuth │            │ - Community Hubs │             │ - Global Ranks   │
│  - Multer Avatars            │ - Codex Hub      │             │                  │
└────────┬────────┘            └────────┬─────────┘             └────────┬─────────┘
         │                              │                                │
         └──────────────────────────────┼────────────────────────────────┘
                                        │ Mongoose ODM (Pooled Connections)
                                        ▼
                         ┌─────────────────────────────┐
                         │    MongoDB Atlas Cluster    │
                         │ (Encrypted / Scalable Cloud)│
                         └─────────────────────────────┘
```

---

## ✨ Key Features & Capabilities

### 1. 🔐 Hybrid Authentication & Identity Management
* **Dual-Transport Auth:** Stateless JWT authentication delivered via secure, `HttpOnly`, `SameSite: lax` cookies, with automatic fallback support for `Authorization: Bearer <token>` headers.
* **OAuth 2.0 Integration:** Native single-sign-on (SSO) via **Google** and **GitHub** with state-token validation for CSRF mitigation and reverse-proxy protocol detection (`x-forwarded-proto`).
* **Cryptographic Password Security:** Salted hashes generated with Bcrypt (12 rounds) and constant-time password matching.
* **Custom Avatar Processing:** Sandboxed Multer file-upload pipeline with MIME-type sniffing (`image/jpeg`, `image/png`, `image/webp`) and strict payload limits.

### 2. 🛡️ Enterprise-Grade Security Hardening
* **Helmet CSP:** Customized Content Security Policy allowing verified avatar CDNs (`api.dicebear.com`, `avatars.githubusercontent.com`, `lh3.googleusercontent.com`) while blocking cross-site scripting (XSS).
* **CSRF & Origin Guard:** Inbound mutating requests (`POST`, `PUT`, `DELETE`) are strictly validated against whitelisted client origins.
* **NoSQL Injection Sanitization:** Payload keys starting with `$` or containing `.` are stripped via `express-mongo-sanitize`.
* **Brute-Force Protection:** Rate-limiting middleware dynamically throttles repeat authentication requests by IP.

### 3. 🏆 Centralized Gamification Engine & Audit Ledger
* **Atomic Points Tracking:** Points are updated at the database level using MongoDB's `$inc` operator, preventing race conditions.
* **Immutable Activity Ledger:** Every point transaction (e.g., submitting a project `+25`, registering for a hackathon `+20`, forming a squad `+20`, commenting `+15`, joining community `+5`) writes an auditable record to the `Activity` collection.
* **Milestone Privileges:**
  * **Codex Contributor Gate:** Developers must accrue $\ge 200$ points to author documentation guides.
  * **Legend Tier Handle:** Developers must reach $\ge 600$ points to claim custom vanity usernames.

### 4. 🤝 Hackathon Hub & Squad Formations
* **Live Hackathon Registry:** Real-time participant counter, prize pool breakdowns, submission rules, and integrated bookmarking.
* **Squad Builder:** Role-based team formation matching frontend, backend, UI/UX, and AI developers.
* **Atomic Team Registration:** Squad leaders can enroll their entire team in a hackathon in a single transaction.

### 5. ⭐ Project Showcase & Codex Knowledge Base
* **Project Directory:** Filter by category, difficulty, and tech stack; view interactive previews, GitHub repositories, and live demos with built-in upvoting and discussion threads.
* **The Codex:** A developer-curated knowledge base focusing on production post-mortems, architectural decisions, and debugging stories.

### 6. 👥 Tech Communities & Portfolio Builder
* **Community Hubs:** Domain-specific channels (Web3, AI/ML, DevOps, UI/UX, Cloud) with interactive discussion boards.
* **Dynamic Portfolio:** Live visual editor allowing developers to customize bio, tech stack, featured repositories, and theme preferences.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+), Glassmorphism UI, Responsive Design |
| **Backend** | Node.js (v20+), Express 4.x REST API |
| **Database** | MongoDB Atlas (Cloud) via Mongoose ODM |
| **Authentication** | JSON Web Tokens (JWT), Bcrypt.js (12 rounds), Google OAuth 2.0, GitHub OAuth 2.0 |
| **Security** | Helmet (CSP), express-mongo-sanitize, express-rate-limit, CORS, CSRF Protection |
| **Media & Uploads** | Multer (Multipart Form Data with MIME validation) |
| **Testing** | Jest, Supertest (54 automated tests across 10 suites) |
| **Hosting & CI/CD** | Render (Web Service), GitHub Actions / Git Version Control |

---

## 📂 Repository Structure

```text
Unified-Developer-Ecosystem/
├── DevVerse2/                         # Main Production Application
│   ├── assets/                        # Static images, avatars, and media
│   ├── css/                           # Core styles, themes, and animations
│   │   └── pages/                     # Page-specific stylesheets
│   ├── js/                            # Client-side JavaScript
│   │   ├── api.js                     # Centralized API bridge (Local vs Production auto-detect)
│   │   ├── app.js                     # Global state, auth synchronization, navigation
│   │   ├── data.js                    # Core constants and fallback catalog
│   │   └── pages/                     # Page controllers (projects, squads, codex, etc.)
│   ├── server/                        # Node.js & Express REST Backend
│   │   ├── src/
│   │   │   ├── config/                # Database connection & env validation
│   │   │   ├── controllers/           # Auth, Projects, Hackathons, Squads, Codex, Uploads
│   │   │   ├── middleware/            # JWT protect, CSRF guard, Helmet CSP, Error handler
│   │   │   ├── models/                # User, Project, Hackathon, Squad, Codex, Activity
│   │   │   ├── routes/                # Modular Express routers
│   │   │   └── app.js                 # Express server configuration
│   │   ├── tests/                     # 10 Jest test suites (54 automated tests)
│   │   ├── seed/                      # MongoDB Atlas seed scripts
│   │   ├── package.json               # Backend dependencies and scripts
│   │   └── server.js                  # HTTP entry point
│   ├── index.html                     # Home dashboard
│   ├── explore.html                   # Project discovery
│   ├── project.html                   # Project details & discussion
│   ├── submit-project.html            # Project creation & GitHub import
│   ├── hackathons.html                # Hackathon discovery
│   ├── hackathon.html                 # Hackathon details & registration
│   ├── squads.html                    # Teammate finder & squad management
│   ├── codex.html                     # Developer knowledge base
│   ├── communities.html               # Tech communities list
│   ├── community.html                 # Discussion channel
│   ├── leaderboard.html               # Global developer rankings & activity feed
│   ├── portfolio.html                 # Live portfolio builder
│   ├── profile.html                   # User profile view
│   ├── settings.html                  # Appearance & account preferences
│   ├── login.html                     # Sign in with email, Google, or GitHub
│   └── signup.html                    # Register new account
└── README.md                          # Repository documentation
```

---

## ⚡ Quick Start & Local Setup

### 1. Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher)
* [Git](https://git-scm.com/)
* A free [MongoDB Atlas Cluster](https://www.mongodb.com/cloud/atlas) (or local MongoDB daemon)

### 2. Clone the Repository
```bash
git clone https://github.com/neelabh16/Unified-Developer-Ecosystem.git
cd Unified-Developer-Ecosystem
```

### 3. Backend Setup
```bash
cd DevVerse2/server

# Install backend dependencies
npm install

# Create environment configuration
cp .env.example .env
```

Configure your `.env` file:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_super_secret_key_minimum_32_characters
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7
CLIENT_ORIGIN=http://localhost:5000
COOKIE_SECURE=false

# Optional: OAuth 2.0 Credentials
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### 4. Seed the Database
```bash
npm run seed
```

### 5. Launch the Server
```bash
# Start backend server with nodemon
npm run dev

# Or standard production start
npm start
```
The server will boot at `http://localhost:5000`. In development, Express automatically serves the static frontend directly from `DevVerse2/`, making the full application immediately accessible at `http://localhost:5000`.

---

## 🧪 Automated Testing

The backend includes a comprehensive test suite covering all authentication flows, access control, gamification transactions, and security policies.

```bash
cd DevVerse2/server
npm test
```

### Test Results
```text
Test Suites: 10 passed, 10 total
Tests:       54 passed, 54 total
Snapshots:   0 total
Time:        ~5.5s
```
Covered test suites:
- `auth.test.js`: User model logic, password hashing, registration, login, profile updates
- `security.test.js`: JWT token validation, role authorization, CSRF & Origin filtering
- `projects.test.js`: CRUD operations, author ownership checks, upvotes, comments
- `hackathons.test.js`: Event registration, participation increments, point awards
- `squads.test.js`: Squad formation, member assignments, point awards
- `communities.test.js`: Join/leave mechanics, member discussions
- `codex.test.js`: Gated publishing privileges (200+ pts verification)
- `bookmarks_activity.test.js`: Ledger queries, global feeds, developer rankings
- `uploads_security.test.js`: Multer file filtering, parameter injection sanitization
- `health.test.js`: Health-check status and standardized error responses

---

## 📡 API Reference Overview

| Module | Method | Endpoint | Description | Access |
|---|---|---|---|---|
| **Auth** | `POST` | `/api/v1/auth/register` | Register new user account (+20 pts) | Public |
| **Auth** | `POST` | `/api/v1/auth/login` | Authenticate user & issue JWT | Public |
| **Auth** | `POST` | `/api/v1/auth/logout` | Clear session cookie | Authenticated |
| **Auth** | `GET` | `/api/v1/auth/me` | Retrieve current authenticated user | Authenticated |
| **Auth** | `GET` | `/api/v1/auth/google` | Initiate Google OAuth 2.0 flow | Public |
| **Auth** | `GET` | `/api/v1/auth/github` | Initiate GitHub OAuth 2.0 flow | Public |
| **Projects** | `GET` | `/api/v1/projects` | List projects with search & filtering | Public |
| **Projects** | `POST` | `/api/v1/projects` | Publish a new project (+25 pts) | Authenticated |
| **Projects** | `POST` | `/api/v1/projects/:id/upvote` | Toggle atomic project upvote | Authenticated |
| **Projects** | `POST` | `/api/v1/projects/:id/comments` | Add comment to project (+15 pts) | Authenticated |
| **Hackathons**| `GET` | `/api/v1/hackathons` | List upcoming and active hackathons | Public |
| **Hackathons**| `POST` | `/api/v1/hackathons/:id/register`| Register for hackathon (+20 pts) | Authenticated |
| **Squads** | `GET` | `/api/v1/squads` | Discover open squads & team matches | Public |
| **Squads** | `POST` | `/api/v1/squads` | Create a new squad (+20 pts) | Authenticated |
| **Communities**|`GET`| `/api/v1/communities` | List all tech communities | Public |
| **Communities**|`POST`| `/api/v1/communities/:id/join` | Join or leave a community (+5 pts) | Authenticated |
| **Codex** | `GET` | `/api/v1/codex` | Retrieve documentation entries | Public |
| **Codex** | `POST` | `/api/v1/codex` | Publish guide (Requires $\ge 200$ pts) | Gated |
| **Leaderboard**|`GET`| `/api/v1/leaderboard` | Get ranked developers by total points | Public |
| **Uploads** | `POST` | `/api/v1/uploads/avatar` | Upload custom profile avatar image | Authenticated |

---

## 👥 Contributors

* **Neelabh** — [@neelabh16](https://github.com/neelabh16)
* **Aryan Verma** — [@Aryan-verma-ai](https://github.com/Aryan-verma-ai)
* **Nitin Kataria**

---

<p align="center">
  <b>DevVerse</b> — Built for developers, by developers.
</p>
