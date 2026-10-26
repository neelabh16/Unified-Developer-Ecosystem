# DevVerse — Full-Stack Developer Ecosystem

DevVerse is a unified developer ecosystem featuring project discovery, community forums, developer leaderboards, a curated knowledge archive (The Codex), hackathon discovery and registration, squad-matching, portfolio builders, and persistent direct messaging.

This repository contains the complete frontend client and production-grade Node.js / Express / MongoDB Atlas REST backend.

---

## 1. Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ (tested on v20 & v22)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or local MongoDB instance

### Installation
```bash
# Navigate to the backend server
cd DevVerse2/server

# Install dependencies
npm install
```

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your environment variables:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/devverse?retryWrites=true&w=majority
JWT_SECRET=super_secret_jwt_key_with_at_least_32_characters
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7
CLIENT_ORIGIN=http://localhost:5500
COOKIE_SECURE=false
```

### Database Seeding
Pre-populate catalog projects, community forums, hackathons, and demo builders:
```bash
npm run seed
```

### Start Server
```bash
# Development mode with hot-reload
npm run dev

# Production mode
npm start
```

### Run Automated Tests
```bash
npm test
```

---

## 2. Architecture & Directory Structure

```text
DevVerse2/
├── assets/                     # Static styling assets, SVG icons, images
├── css/                        # Frontend CSS stylesheets (preserved 100%)
├── js/                         # Vanilla JS application scripts
│   ├── api.js                  # Centralized client REST API helper (DVApi)
│   ├── app.js                  # Core application shell, auth session, global events
│   ├── data.js                 # Seed catalog reference data
│   └── pages/                  # Page-specific client controllers
│       ├── codex.js            # Codex entries & points gating
│       ├── communities.js      # Community catalog
│       ├── community.js        # Community forum threads & replies
│       ├── explore.js          # Project grid & faceted search
│       ├── hackathons.js       # Hackathon listing
│       ├── leaderboard.js      # Developer & project rankings
│       ├── login.js            # User authentication
│       ├── portfolio.js        # Portfolio builder & avatar uploads
│       ├── profile.js          # User profiles & library
│       ├── project.js          # Project details & feedback
│       ├── signup.js           # Account registration
│       ├── squads.js           # Squad match recommendations & creation
│       └── submit-project.js   # Project publication
├── server/                     # Express & MongoDB Atlas REST Backend
│   ├── src/
│   │   ├── app.js              # Express app, security middleware & route mounting
│   │   ├── server.js           # HTTP listener, lifecycle & graceful shutdown
│   │   ├── config/
│   │   │   ├── database.js     # Mongoose connection & disconnect handlers
│   │   │   └── envValidator.js # Startup environment variable validator
│   │   ├── controllers/        # Business logic & request handlers
│   │   │   ├── activityController.js
│   │   │   ├── authController.js
│   │   │   ├── bookmarkController.js
│   │   │   ├── codexController.js
│   │   │   ├── communityController.js
│   │   │   ├── discussionController.js
│   │   │   ├── hackathonController.js
│   │   │   ├── leaderboardController.js
│   │   │   ├── messageController.js
│   │   │   ├── portfolioController.js
│   │   │   ├── projectController.js
│   │   │   ├── squadController.js
│   │   │   ├── uploadController.js
│   │   │   └── userController.js
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT verification, protect & optionalAuth
│   │   │   ├── csrf.js         # CSRF & origin validation middleware
│   │   │   ├── errorHandler.js # Centralized sanitized error handler
│   │   │   ├── upload.js       # Multer multipart validation & file filters
│   │   │   └── validateObjectId.js # NoSQL parameter sanitization
│   │   ├── models/             # Mongoose database models
│   │   │   ├── Activity.js
│   │   │   ├── CodexEntry.js
│   │   │   ├── Comment.js
│   │   │   ├── Community.js
│   │   │   ├── Discussion.js
│   │   │   ├── Engagement.js
│   │   │   ├── Hackathon.js
│   │   │   ├── HackathonRegistration.js
│   │   │   ├── Message.js
│   │   │   ├── Portfolio.js
│   │   │   ├── Project.js
│   │   │   ├── Squad.js
│   │   │   └── User.js
│   │   ├── routes/             # Route group definitions under /api/v1
│   │   └── utils/
│   │       ├── AppError.js
│   │       ├── response.js     # Standardized JSON response envelope
│   │       └── seeder.js       # Catalog database seeder
│   ├── tests/                  # Jest & Supertest automated test suites
│   ├── uploads/                # Local storage path for uploaded assets
│   ├── .env.example            # Environment template
│   └── postman_collection.json # Automated API test collection
└── postman_collection.json     # Root copy of Postman collection
```

---

## 3. Database Models & Schema Design

| Model | Collection | Primary Fields & Constraints | Purpose |
|---|---|---|---|
| `User` | `users` | `name`, `username` (unique), `email` (unique), `password` (hashed with bcrypt), `points`, `role` (`member`/`moderator`/`admin`), `tier`, `bio`, `skills` | User accounts, authentication & reputation |
| `Project` | `projects` | `title`, `desc`, `category`, `difficulty`, `tags`, `author` (User ref), `likesCount`, `viewsCount`, `githubUrl`, `features`, `timeline` | Project catalog and showcases |
| `Comment` | `comments` | `project` (Project ref), `author` (User ref), `text`, `createdAt` | Feedback on published projects |
| `Community` | `communities` | `id` (slug), `name`, `desc`, `membersCount`, `onlineCount`, `gradient` | Discussion forums |
| `Discussion` | `discussions`| `community` (Community ref), `title`, `body`, `author` (User ref), `replies` (subdocs) | Public forum threads |
| `CodexEntry` | `codexentries`| `title`, `category`, `problem`, `tried`, `fix`, `lesson`, `author` (User ref) | Curated developer knowledge archive (requires >= 200 pts) |
| `Hackathon` | `hackathons` | `id` (slug), `title`, `desc`, `prize`, `start`, `end`, `tags`, `participantsCount` | Competitions and hackathons |
| `HackathonRegistration` | `hackathonregistrations` | `user`, `hackathon`, `squad`, unique compound index | User & squad event registration |
| `Squad` | `squads` | `name`, `description`, `creator` (User ref), `members` (User refs), `registeredHackathons` | Builder squads and hackathon teams |
| `Portfolio` | `portfolios` | `user` (User ref, unique), `name`, `title`, `bio`, `accent`, `skills`, `links`, `projects` | Portfolio builder profiles |
| `Message` | `messages` | `sender`, `recipient`, `text`, `read`, timestamps | Direct messaging |
| `Engagement` | `engagements`| `user`, `targetType`, `targetId`, `type` (`like`/`bookmark`/`follow`/`join`), compound unique index | Prevents duplicate likes/bookmarks/joins |
| `Activity` | `activities` | `user`, `action`, `pointsEarned`, `metadata`, `createdAt` | Points ledger and global activity stream |

---

## 4. API Endpoints Reference

All endpoints are prefixed with `/api/v1`:

### Health & System
- `GET /health` — Service readiness & MongoDB connection check

### Authentication (`/auth`)
- `POST /auth/register` — Create new account (validates password strength & unique email/username)
- `POST /auth/login` — Sign in and receive HttpOnly JWT cookie
- `POST /auth/logout` — Clear auth cookie
- `GET /auth/me` — Retrieve current authenticated user profile
- `PUT /auth/change-password` — Update user password

### Users & Profiles (`/users`)
- `GET /users/:username` — Fetch public user profile
- `PUT /users/profile` — Update bio, skills, avatar seed, and custom links (whitelisted fields only)
- `PUT /users/username` — One-time username change (requires Legend tier >= 600 pts)
- `POST /users/:username/follow` — Toggle follow developer

### Projects (`/projects`)
- `GET /projects` — Filter, search, paginate, and sort project catalog
- `GET /projects/:id` — Get single project details
- `POST /projects` — Create and publish new project (+25 pts)
- `PUT /projects/:id` — Update project (author or admin only)
- `DELETE /projects/:id` — Delete project (author or admin only)
- `POST /projects/:id/like` — Toggle like (+2 pts)
- `POST /projects/:id/bookmark` — Toggle bookmark (+3 pts)
- `POST /projects/:id/view` — Increment view count
- `GET /projects/:id/comments` — Fetch project comments
- `POST /projects/:id/comments` — Add comment (+15 pts)
- `DELETE /projects/:id/comments/:commentId` — Delete comment (author only)

### Communities & Discussions (`/communities` & `/discussions`)
- `GET /communities` — List all community hubs
- `GET /communities/:id` — Get community details
- `POST /communities/:id/join` — Toggle community membership (+5 pts)
- `GET /communities/:id/discussions` — List forum threads in a community
- `POST /communities/:id/discussions` — Start discussion thread (members only, +25 pts)
- `GET /discussions/:id` — Fetch discussion thread
- `PUT /discussions/:id` — Update discussion (author only)
- `DELETE /discussions/:id` — Delete discussion (author or admin only)
- `POST /discussions/:id/replies` — Post reply (+10 pts)
- `DELETE /discussions/:id/replies/:replyId` — Delete reply (author only)

### The Codex (`/codex`)
- `GET /codex` — List knowledge entries
- `GET /codex/:id` — Get entry details
- `POST /codex` — Add entry (server-enforced requirement: user points >= 200, +25 pts)
- `PUT /codex/:id` — Edit entry (author only)
- `DELETE /codex/:id` — Delete entry (author or admin only)

### Hackathons (`/hackathons`)
- `GET /hackathons` — List hackathons
- `GET /hackathons/:id` — Get hackathon details
- `POST /hackathons/:id/register` — Toggle participation registration (+20 pts)
- `POST /hackathons/:id/bookmark` — Toggle bookmark (+3 pts)

### Portfolios (`/portfolios`)
- `GET /portfolios/me` — Get authenticated user's portfolio data
- `GET /portfolios/:handle` — Get public portfolio by developer handle
- `PUT /portfolios` — Save/update portfolio content

### Squad Finder (`/squads`)
- `GET /squads/my` — Get squads the current user belongs to
- `POST /squads` — Create new squad (+20 pts)
- `POST /squads/:id/members` — Add member to squad
- `POST /squads/:id/register` — Register squad for a hackathon (+20 pts)
- `POST /squads/:id/leave` — Leave squad
- `GET /squads/matches` — Get algorithmic squad partner recommendations

### Messaging (`/messages`)
- `GET /messages/:handle` — Retrieve direct message conversation
- `POST /messages/:handle` — Send message (+2 pts; triggers canned reply for mock devs)
- `DELETE /messages/:handle/:messageId` — Delete own message

### Bookmarks & Activity (`/bookmarks` & `/activity`)
- `GET /bookmarks` — Get current user's bookmarked projects and hackathons
- `GET /activity/me` — Get user points audit ledger
- `GET /activity/feed` — Get global live event stream

### Leaderboard (`/leaderboard`)
- `GET /leaderboard?mode=devs|projects&range=weekly|monthly|all` — Live calculated rankings

### File Uploads (`/uploads`)
- `POST /uploads/avatar` — Upload avatar image (multipart/form-data, max 2MB, allowed: JPEG/PNG/WebP/GIF)

---

## 5. Security Hardening Measures

1. **Password Hashing**: Passwords hashed using `bcryptjs` with salt work factor of 10 during pre-save hooks. Passwords are excluded from JSON serialization.
2. **JWT via HttpOnly Cookies**: Tokens are issued with `httpOnly: true`, `sameSite: 'lax'`, and conditional `secure: true` in production to eliminate XSS token theft.
3. **CSRF & Origin Protection**: Mutation requests (`POST`, `PUT`, `DELETE`, `PATCH`) validate origin/referer against allowed domain whitelists.
4. **Strict CORS Allowlists**: Configured to accept requests only from trusted client origins.
5. **NoSQL Query Injection Prevention**: `express-mongo-sanitize` strips forbidden operator characters (`$`, `.`) from request bodies, query params, and parameters.
6. **Object & Parameter Validation**: Route parameters validate 24-hex ObjectIds or safe alphanumeric slugs before query execution.
7. **Rate Limiting**:
   - General API limiter: 500 requests per 15 minutes.
   - Authentication limiter: 30 attempts per 15 minutes per IP.
8. **Request Size Capping**: JSON payloads capped at 1 MB to prevent Denial-of-Service (DoS) buffer exhaustion.
9. **Safe Error Handling**: Centralized error middleware ensures stack traces, database internals, and credentials are never leaked in client error responses.
10. **Environment Variable Validation**: `validateEnv()` runs before startup to enforce strong JWT secrets (min 16 chars) and required database credentials in production.

---

## 6. File Uploads

- **Storage Mode**: Controlled local disk storage located in `DevVerse2/server/uploads/`.
- **File Limit**: Maximum 1 file per request, capped at 2 MB.
- **Allowed Types**: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
- **Randomized Naming**: Generates unguessable 32-character crypto random hex strings with sanitized extensions.
- **Path Traversal Shield**: Paths resolved strictly with `path.resolve` and `path.basename`.
- **Hosting Note**: Ephemeral container platforms (e.g. Heroku, Render free tier) do not guarantee persistent disk storage between dyno restarts. For permanent production uploads on ephemeral hosting, a cloud bucket (e.g., AWS S3, Cloudinary, GCP Storage) should be configured.

---

## 7. Postman Collection

A complete Postman Collection v2.1.0 is located at:
- `DevVerse2/server/postman_collection.json`
- `DevVerse2/postman_collection.json`

### Usage:
1. Open Postman and click **Import**.
2. Select `DevVerse2/server/postman_collection.json`.
3. Set the collection variable `baseUrl` (default: `http://localhost:5000/api/v1`).
4. Execute the **Register User** or **Login User** request to automatically set `{{authToken}}` in collection variables for all protected requests.

---

## 8. Automated Testing

Run the test suite inside `DevVerse2/server`:
```bash
npm test
```
The test suite executes 52 automated tests across 10 test suites covering:
- Unit tests for data models, validation, and bcrypt hashing
- Integration tests for auth, registration, login, logout, and token verification
- Role-based access control and ownership authorization
- Security middleware (CSRF, CORS, NoSQL injection, rate limits)
- File upload restrictions and type verification
- Engagement idempotency and duplicate operation prevention
- Points calculation, activity logs, and Codex threshold gates

---

## 9. Deployment Guide (MongoDB Atlas + Node.js)

1. **MongoDB Atlas**:
   - Create a cluster on MongoDB Atlas.
   - In **Database Access**, create a user with read/write access.
   - In **Network Access**, add the public IP of your server (or `0.0.0.0/0` if on dynamic cloud hosting).
   - Retrieve connection string (`mongodb+srv://...`).
2. **Server Deployment** (e.g. Render, Railway, AWS EC2):
   - Set environment variables from `.env.example`.
   - Set `NODE_ENV=production`.
   - Set `COOKIE_SECURE=true` (requires HTTPS).
   - Run `npm install` and `npm start`.
3. **Frontend Configuration**:
   - Point the frontend to your backend API URL by defining `window.DV_API_URL = "https://your-api-domain.com/api/v1";` before `api.js` loads.
