# CivicPulse - Community Hero

## The Problem: Hyperlocal Problem Solver
Urban citizens frequently encounter civic issues—potholes, broken streetlights, illegal dumping, and water leaks—but reporting them is often tedious, bureaucratic, and unrewarding. Existing municipal apps are poorly designed, lack transparency, and provide no feedback loop to the citizen. As a result, critical infrastructure problems go unreported, and communities suffer.

## The Solution: CivicPulse
CivicPulse is a stunning, AI-powered, and highly gamified civic issue reporting platform designed to transform every citizen into a "Community Hero". 

We've completely overhauled the reporting experience with a "zero-friction" approach:
1. **AI Auto-Reporting**: A citizen simply uploads a photo of an issue. CivicPulse leverages **Gemini 1.5 Flash (Vision API)** to instantly categorize the issue, assess the severity (1-10), estimate a resolution timeline, determine the correct municipal department, and even auto-draft an official filing letter.
2. **Predictive Analytics & Duplicate Detection**: Using **Gemini** and geolocation, we predict area-wide hazards (e.g. if 5 potholes are reported on one street, we forecast rapid road degradation) and prevent duplicate reports by auto-suggesting existing nearby issues.
3. **Gamification & Verification**: Users earn XP for reporting, upvoting, and physically verifying issues in their neighborhood. Earning XP unlocks badges on the global Citizen Leaderboard.

## Technologies Used
- **Google Gemini API (1.5 Flash Vision)**: Used as the core intelligence engine. It analyzes uploaded photos to auto-fill the entire report, extracts metadata (severity, category), and generates formal complaint letters.
- **Google Maps API**: Powers the interactive heatmap and cluster-based visualization of city-wide issues, allowing citizens to explore problems in their specific wards.
- **Firebase / Cloud Firestore**: Real-time NoSQL database used to sync issue statuses, upvotes, verifications, and comments instantly across all clients.
- **Vite + React + TailwindCSS**: For a lightning-fast, highly aesthetic frontend. We built a custom design system inspired by top-tier consumer apps (e.g. Apple, Linear) with 0-shadow, high-contrast, monochrome aesthetics.

## Impact
CivicPulse reduces the time it takes to file a comprehensive civic report from 10 minutes to **10 seconds**. By turning a bureaucratic chore into a gamified, beautiful, and transparent social experience, we incentivize citizens to actively care for their neighborhoods, providing municipal governments with real-time, high-quality, AI-triaged infrastructure data.
