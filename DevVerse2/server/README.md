# DevVerse Backend Server (Node.js + Express + MongoDB Atlas)

Production-minded backend foundation, database schemas, and authentication for **DevVerse**.

---

## 1. Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ (verified on v22)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) Account

### Installation
```bash
cd server
npm install
```

### Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Fill in your configuration values:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/devverse?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5500
COOKIE_SECURE=false
```

---

## 2. MongoDB Atlas Setup Guide

### Step 1: Create a Free MongoDB Cluster
1. Sign up / Log in to [MongoDB Atlas](https://cloud.mongodb.com).
2. Create a new project named `DevVerse`.
3. Create a cluster (the **M0 Free** cluster is sufficient).
4. Choose a cloud provider and region closest to you.

### Step 2: Configure Database User (Database Access)
1. In the Atlas sidebar, navigate to **Security** → **Database Access**.
2. Click **Add New Database User**.
3. Choose **Password** Authentication.
4. Set a username (e.g. `devverse_admin`).
5. Set a secure password. **Never share this password or commit it to Git.**
6. Assign the user role: **Read and write to any database** (or target `devverse` specifically).
7. Click **Add User**.

### Step 3: Configure Network Access (IP Whitelist)
1. In the Atlas sidebar, navigate to **Security** → **Network Access**.
2. Click **Add IP Address**.
3. For local development, either:
   - Click **Add Current IP Address** (best security), or
   - Add `0.0.0.0/0` (Allow Access from Anywhere - convenient for dynamic IPs / mobile hotspots).
4. Click **Confirm**.

### Step 4: Obtain Connection String
1. In the Atlas sidebar, navigate to **Deployment** → **Database**.
2. Click **Connect** next to your cluster.
3. Select **Drivers** (Node.js).
4. Copy the connection string format:
   ```text
   mongodb+srv://<username>:<password>@<cluster-url>/devverse?retryWrites=true&w=majority
   ```
5. Replace `<username>` and `<password>` with the database user credentials created in Step 2.
6. Replace database name with `devverse`.
7. Paste this string into your `.env` file as `MONGODB_URI`.

---

## 3. Running the Server

### Development Mode (with hot-reload via Nodemon)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Automated Testing
```bash
npm test
```

---

## 4. API Endpoints (Part 1: Foundation & Authentication)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/health` | Health status and DB readiness check | No |
| `POST` | `/api/v1/auth/register` | User registration (creates account & sets HttpOnly cookie) | No |
| `POST` | `/api/v1/auth/signup` | Alias for register | No |
| `POST` | `/api/v1/auth/login` | User login (verifies bcrypt hash & sets HttpOnly cookie) | No |
| `POST` | `/api/v1/auth/logout` | User logout (clears HttpOnly cookie) | No |
| `GET` | `/api/v1/auth/me` | Retrieve currently authenticated user profile | Yes (JWT Cookie) |
| `PUT` | `/api/v1/auth/change-password` | Update account password | Yes (JWT Cookie) |
| `GET` | `/api/v1/users/:username` | Public profile retrieval by username | No |
| `PUT` | `/api/v1/users/profile` | Update user profile (name, bio, avatar, settings) | Yes (JWT Cookie) |
| `PUT` | `/api/v1/users/username` | One-time username change (Legend tier >= 600 pts) | Yes (JWT Cookie) |

---

## 5. Security Architecture

1. **Password Security**: Passwords hashed using `bcryptjs` with salt work factor 12.
2. **JWT Storage**: Tokens stored exclusively in secure, `HttpOnly`, `SameSite=Lax/None` cookies (never exposed to `localStorage` to eliminate XSS token theft).
3. **Sensitive Field Redaction**: `password` and `__v` automatically stripped via schema transforms on document serialization.
4. **CSRF & Origin Protection**: Unsafe HTTP methods (`POST`, `PUT`, `DELETE`, `PATCH`) validate the client `Origin` / `Referer` against `CLIENT_ORIGIN`.
5. **No Blind Trust**: User identity and roles are verified server-side from JWT claims; browser inputs cannot elevate permissions.
