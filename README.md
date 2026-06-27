# CivicPulse 🌐

**CivicPulse** is a complete, hyperlocal civic problem-solver web application built for the **Vibe2Ship Hackathon (Problem Statement 2: Community Hero)**. 

It empowers citizens to report local infrastructure issues (potholes, water leaks, streetlights, waste, etc.), analyzes reports instantly using AI (Google Vision + Gemini 1.5 Flash), displays live incident density on interactive maps (Google Maps/OSM), and gamifies citizen participation with a points, levels, and badge achievements leaderboard.

---

## 🚀 Key Features

1. **Agentic AI Processing Engine**:
   - **Object Recognition**: Calls Google Vision API to extract labels/objects from uploaded incident images.
   - **Categorization & Parsing**: Calls Gemini 1.5 Flash to classify the issue category, estimate resolution times, and recommend the correct government department.
   - **Duplicate Inspector**: AI checks existing active reports within a 2km radius to flag potential duplicates before filing.
   - **Complaint Auto-Writer**: Generates a formal, copyable complaint letter addressed to local municipal authorities.
2. **Resolution Lifecycle**:
   - Status pipeline: `Reported` ➔ `Community Verified` ➔ `In Progress` ➔ `Resolved`.
   - Stepper timeline audit logs showing who modified the report and when.
   - Live comments section where citizens collaborate.
3. **Heatmap & Interactive Map**:
   - Renders a responsive map marking active issues with color-coded categories.
   - Toggleable Heatmap layer showing concentration grids of issues based on severity weights.
4. **Gamification & Rewards**:
   - Citizens earn Experience Points (XP) for actions: reporting (+10 XP), verifying (+5 XP), commenting (+2 XP), and resolving (+50 XP bonus).
   - Dynamic user dashboard displaying charts, average resolution speeds, and a regional leaderboard.
   - Unlockable badges rack (`First Reporter`, `First Verification`, `Verified 10 Issues`, `Local Legend`).
5. **Predictive Insights Tab**:
   - Gemini parses reports filed in the last 30 days to forecast escalating risks (e.g. "Water leak softening road sub-base, pothole collapse predicted in 2 weeks") and issues actionable priorities.
6. **Cinematic Scroll Story Landing Page (`/` / `landing.html`)**:
   - **Ultra-Smooth Scroll Experience**: Integrated Lenis.js for 160fps smooth kinetic scroll interpolation.
   - **GreenSock (GSAP) Motion Design**: Fully responsive scroll storytelling with horizontal sliding, counter rollups, map simulations, and layout fades.
   - **Luxury / Editorial Design System**: Styled with a curated palette of Warm Alabaster (`#F9F8F6`), Rich Charcoal (`#1A1A1A`), and Metallic Gold (`#D4AF37`) accents. Uses commanding Playfair Display headings, strict `0px` sharp card borders, grayscale-to-color transitions on image hovers, vertical architectural grids, and a tactile paper noise overlay.

---

## ⚡ Out-of-the-Box Simulation Mode

CivicPulse includes a **dual API execution engine**. If Google Cloud API keys or Firebase configurations are missing from your `.env` file, **the server and client automatically activate Simulation Mode**:
- **Maps Fallback**: Attempts to load Google Maps. If keys are missing, it dynamically loads **Leaflet** using premium light/dark CartoDB map tile styling.
- **Vision Fallback**: Inspects uploaded file structures and parses tags based on local heuristics (e.g. detecting "road" keywords).
- **Gemini Fallback**: Generates realistic civic reports, categorizations, and formal letters using local rules.
- **Firestore Emulator**: Emulates Firestore with an in-memory/JSON-file database stored at `server/data/db.json` which persists local modifications across restarts.

This guarantees the project is **fully testable and runnable locally with zero setup!**

---

## ⚙️ Environment Variables

Create a `.env` file in the root workspace folder using this template:

```env
PORT=5000

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Google Cloud Vision REST Key
GOOGLE_CLOUD_VISION_KEY=your_google_cloud_vision_key_here

# Client Maps key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Firebase Admin SDK credentials (JSON string format)
FIREBASE_ADMIN_SDK={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
```

---

## 💻 Local Setup & Execution

### Option A: Standard Dev Servers (Recommended for local dev)

Ensure you have [Node.js](https://nodejs.org) (v18+) installed.

1. **Install dependencies** across both workspaces:
   ```bash
   npm run install:all
   ```
2. **Start Dev Servers** (Runs Express API on `5000` and Vite App on `5173` concurrently):
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

### Option B: Local Docker Containers

Run client and server containers together:
```bash
docker-compose up --build
```
- Open `http://localhost:5173` to interact with the Vite client.
- The backend API runs containerized on `http://localhost:5000`.

---

## 🐳 Cloud Deployment (Google Cloud Run)

The codebase includes a multi-stage `Dockerfile` which compiles the static React files and packs them into the Express server, enabling single-container deployment.

Deploy directly using GCP Cloud Build:
```bash
gcloud builds submit --config cloudbuild.yaml
```
Or build and deploy manually:
```bash
docker build -t gcr.io/[PROJECT_ID]/civicpulse .
docker push gcr.io/[PROJECT_ID]/civicpulse
gcloud run deploy civicpulse --image gcr.io/[PROJECT_ID]/civicpulse --platform managed --allow-unauthenticated
```

---

## 📁 Folder Structure

```
/client
  /src
    /components  # MapView, Navbar
    /context     # AuthContext, IssueContext
    /pages       # Home, Report, Issues, IssueDetail, Dashboard, Profile
    /index.css   # Foundation design styles
/server
  /config        # Firebase admin and db selectors
  /services      # Vision API, Gemini AI integration
  /routes        # REST API endpoints (issues, analytics)
  /server.js     # Entrypoint
```
