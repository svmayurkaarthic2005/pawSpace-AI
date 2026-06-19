# PawSpace 🐾

> The ultimate social network for pets and their owners. Connect, discover, and chat with a vibrant community of pet lovers in your area.

---

## Overview

PawSpace is a full-stack pet-owner social discovery app — find nearby pet owners on a live map, chat in real-time, initiate 1-on-1 video calls, and connect with the local pet community.

---

## Tech Stack

### Frontend (Mobile)
* **Framework**: React Native 0.73.2 (CLI)
* **Language**: TypeScript
* **State Management**: Zustand
* **Data Fetching**: TanStack Query
* **Navigation**: React Navigation v7 (`@react-navigation/native-stack`, `@react-navigation/bottom-tabs`)
* **Real-time**: Socket.IO Client
* **Authentication**: Firebase Auth (Google Sign-In)
* **Maps & Location**: `react-native-maps` (PROVIDER_GOOGLE), `@transistorsoft/react-native-background-geolocation`
* **Animations & UI**: React Native Reanimated v3, FlashList, `@gorhom/bottom-sheet`
* **Integrations**: Gemini API (AI chat assistant), Cloudinary (media upload), `react-native-agora` (video calling)

### Backend
* **Environment**: Node.js, Express
* **Language**: TypeScript
* **Database**: MongoDB (Mongoose) with powerful `$geoNear` geospatial queries
* **Real-time**: Socket.IO server
* **Integrations**: Firebase Admin (Push Notifications), Agora Token Generation (`agora-token`), Cloudinary API

---

## Features

* **🔐 Authentication** — Firebase Auth (Google Sign-In), secure session persistence.
* **🗺️ Nearby Pet Owner Discovery** — Live map using MongoDB `$geoNear`, featuring dynamic radius + species filtering, and real-time GPS via `watchPosition`.
* **📍 Live Location Tracking** — Foreground tracking active; fully implemented background tracking (even when the app is minimized or killed) using `react-native-background-geolocation`.
* **🎯 Auto-Recentering Map** — Follow-me mode accurately tracks the user's location, with manual override upon pan/drag.
* **💬 Real-time Chat** — Socket.IO powered instant messaging, online/offline presence indicators, and an AI chat assistant powered by Gemini.
* **📹 Video Calling** — Integrated `react-native-agora` for 1-on-1 video calls, featuring a dedicated incoming call screen, and full in-call controls (mute, camera toggle, switch camera).
* **👥 Follow System** — Follow/unfollow nearby users and manage your followers list.
* **🐾 Pet Profiles** — Detailed pet profiles (name, breed, species) with image uploads handled via Cloudinary.

---

## Project Structure

The project is structured as a Monorepo containing both the React Native mobile app and the Node.js backend API:

```text
myapp/
├── apps/
│   ├── mobile/             # React Native app
│   │   ├── android/
│   │   ├── ios/
│   │   └── src/
│   │       ├── components/ # Reusable UI components
│   │       ├── hooks/      # Custom React hooks (e.g., useLocation)
│   │       ├── navigation/ # React Navigation stacks
│   │       ├── screens/    # Full-page UI views
│   │       ├── services/   # API and Socket.IO clients
│   │       ├── store/      # Zustand state management
│   │       ├── types/      # TypeScript interfaces
│   │       └── utils/      # Helper functions
│   │
│   └── backend/            # Express API
│       └── src/
│           ├── config/     # Environment & DB configurations
│           ├── controllers/# Express route handlers
│           ├── middleware/ # Auth, Validation, Error handling
│           ├── models/     # Mongoose schemas
│           ├── routes/     # API route definitions
│           ├── services/   # Core business logic
│           ├── socket/     # Socket.IO connection & event handlers
│           └── utils/      # Shared utilities
```

---

## Prerequisites

* **Node.js**: v20.x or higher recommended
* **React Native Development Environment**: Android Studio (for Android) and/or Xcode (for iOS)
* **MongoDB**: A local instance or MongoDB Atlas cluster
* **Redis**: Local or Docker instance (port 6379)
* **Firebase Project**: Configured for Authentication and Cloud Messaging (FCM)
* **Google Cloud Project**: Maps SDK for Android/iOS, Places API, and Geocoding API enabled
* **Agora Account**: App ID + Primary Certificate (for video calling)
* **Gemini API Key**: For the AI chat assistant
* **Cloudinary Account**: For handling image uploads

---

## Environment Variables

Create `.env` files in both the `apps/mobile` and `apps/backend` directories based on these templates:

### Mobile (`apps/mobile/.env`)

```env
# IMPORTANT: Use your machine's local IP address for physical device testing.
# Use 10.0.2.2 only if testing strictly on an Android emulator.
API_BASE_URL=http://192.168.1.xxx:5000/api/v1

EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_api_key

AGORA_APP_ID=your_agora_app_id

NODE_ENV=development
```

### Backend (`apps/backend/.env`)

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/pawspace
REDIS_URL=redis://localhost:6379

FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_firebase_client_email

AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate # Never expose this to the client

GEMINI_API_KEY=your_gemini_api_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

GOOGLE_MAPS_API_KEY=your_google_maps_api_key

JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

---

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone <repository-url> pawspace
   cd pawspace
   ```

2. **Install dependencies:**
   Install for both applications.
   ```bash
   cd apps/backend && npm install
   cd ../mobile && npm install
   ```

3. **Set up `.env` files:**
   Configure the environment variables exactly as outlined in the section above.

4. **Start the backend server:**
   Ensure MongoDB and Redis are running locally or accessible.
   ```bash
   cd apps/backend
   npm run dev
   ```

5. **Start the Metro bundler:**
   Open a new terminal window.
   ```bash
   cd apps/mobile
   npx react-native start --reset-cache
   ```

6. **Run the mobile app:**
   Open a third terminal window.
   ```bash
   cd apps/mobile
   
   # For Android
   npx react-native run-android
   
   # For iOS
   npx react-native run-ios
   ```

---

## Important Notes for Physical Device Testing

* **`API_BASE_URL`**: Must be your development machine's local WiFi IP (e.g., `http://192.168.1.50:5000/api/v1`), not `localhost` or `10.0.2.2`.
* **Server Binding**: The backend Express server must listen on `0.0.0.0` (which it is currently configured to do in `server.ts`) to accept incoming LAN connections.
* **Firewall Rules**: Windows/Mac Firewall may need an inbound rule to allow traffic on port `5000`.
* **Network Context**: The physical phone and the development machine **must be connected to the exact same WiFi network**.

---

## Known Issues / Roadmap

While the core functionality of PawSpace is complete, the following areas are currently under development or marked for improvement:

* **Post Detail View**: The full post detail screen (`PostDetailScreen`) is currently a placeholder and needs a complete UI implementation.
* **Community Detail View**: The community details and member management view (`CommunityDetailScreen`) requires further UI polishing.
* **Post Action Menus**: The action sheet menu on individual post cards (e.g., for reporting or deleting a post) is pending implementation.
* **Auth Store Cleanup**: Some dead code regarding former Clerk syncing in the `authStore` needs to be removed as the app has fully migrated to Firebase Auth.

---

## License & Support

This project is licensed under the MIT License. For issues, feature requests, or contributions, please contact the development team or open a pull request!
