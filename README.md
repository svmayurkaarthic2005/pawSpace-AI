# PawSpace 🐾

> The ultimate social network for pets and their owners. Connect, discover, and chat with a vibrant community of pet lovers in your area.

---

## 📖 What is PawSpace?

**PawSpace** is a full-stack, cross-platform mobile application designed exclusively for pet owners. It solves the problem of finding local pet communities, organizing pet playdates, and discovering pet-friendly events. 

By combining real-time communication, robust privacy controls, and advanced location-based discovery, PawSpace provides a seamless social experience. Whether you want to find a walking buddy for your Golden Retriever, arrange a cat cafe meetup, or simply share adorable photos of your pets on a dedicated feed, PawSpace is the hub for it all.

---

## 🛠️ How it Works

PawSpace operates on a modern decoupled architecture:

### 1. Client-Server Architecture
- **Mobile Client (`apps/mobile`)**: Built with React Native, it provides a native-feeling UX across both iOS and Android. It handles UI rendering, local state management (via Redux Toolkit), remote state caching (via React Query), and background device tasks (like location tracking).
- **REST API Backend (`apps/backend`)**: A robust Node.js/Express server that acts as the single source of truth. It interfaces with MongoDB to store user profiles, posts, events, and spatial data. It also interfaces with external APIs (like Google Maps & Cloudinary).

### 2. Live Location Engine
PawSpace utilizes `@transistorsoft/react-native-background-geolocation` to track user movements in the background securely. 
- When a user moves >50 meters, the app silently pings the `POST /map/location` backend endpoint.
- The backend stores this as a GeoJSON Point in MongoDB.
- When other users open the "Discover" map, the backend uses MongoDB's powerful `$geoNear` aggregation pipeline to query users and events within a dynamic radius (e.g., 25km), calculating the exact distance instantly.

### 3. Real-Time Communication (Socket.IO)
Chat features aren't built on standard polling. Instead, when a user logs in, the mobile app establishes a persistent WebSocket connection to the Node.js backend using `socket.io`.
- When a user sends a message, it is emitted over the socket.
- The server receives it, saves it to MongoDB, and instantly broadcasts the `receive_message` event to the recipient's active socket.
- If the recipient is offline, the backend falls back to **Firebase Cloud Messaging (FCM)** to send a push notification to their device.

### 4. Robust Privacy (Block/Unblock System)
Privacy is paramount. PawSpace implements a global block architecture. When User A blocks User B, a `Block` document is created in the database. Every critical backend query (fetching the social feed, discovering users on the map, loading events, starting chats) applies a `$nin` (not in) filter using an aggregated list of blocked IDs, ensuring a perfectly sanitized experience.

---

## 🗂️ Detailed File Structure

The project is structured as a **Monorepo**, keeping both backend and frontend code tightly organized in a single repository.

```text
pawspace/
├── apps/
│   ├── backend/                  # Node.js Express REST API Server
│   │   ├── src/
│   │   │   ├── config/           # Environment variables, DB connection, Redis setup
│   │   │   ├── controllers/      # Request handlers (User, Map, Chat, Post, Block logic)
│   │   │   ├── middleware/       # Express middlewares (JWT Auth, Error handling)
│   │   │   ├── models/           # Mongoose Database Schemas (User, Event, Message, etc.)
│   │   │   ├── routes/           # Express Route definitions mapping to controllers
│   │   │   ├── services/         # Complex business logic separated from controllers
│   │   │   ├── socket/           # Socket.IO event handlers for real-time chat
│   │   │   └── utils/            # Helper functions (Google Maps geocoding, Cloudinary)
│   │   ├── .env.example          # Backend environment variables template
│   │   └── package.json          # Backend dependencies
│   │
│   └── mobile/                   # React Native Mobile Application
│       ├── android/              # Native Android code (Java/Kotlin, Gradle, Manifest)
│       ├── ios/                  # Native iOS code (Objective-C/Swift, Pods)
│       ├── src/
│       │   ├── components/       # Reusable UI components (Buttons, Map Markers, Bottom Sheets)
│       │   ├── constants/        # Theme colors, styling spacing, layout constants
│       │   ├── hooks/            # Custom React Hooks (e.g., useLocation for background tracking)
│       │   ├── navigation/       # React Navigation setup (MainStack, TabNavigator, AuthStack)
│       │   ├── screens/          # Full-page UI views (organized by feature: map, profile, chat)
│       │   ├── services/         # API client functions (Axios setup to hit backend endpoints)
│       │   ├── store/            # Global State management (Zustand or Redux)
│       │   └── types/            # TypeScript interfaces for Props and API responses
│       ├── .env.example          # Mobile environment variables template
│       └── package.json          # Mobile dependencies
│
├── package.json                  # Root monorepo workspace configurations
└── README.md                     # You are here!
```

---

## ✨ Key Features

### 🗺️ Live Location & Discovery
- **Interactive Google Maps**: Real-time map displaying nearby pets, users, and events.
- **Live Tracking**: True background live location updates with auto-recentering map behavior.
- **Walking Directions**: Built-in walking routes between your live location and community events.
- **Location Search**: Integrated Google Places Autocomplete for seamless landmark and city search.
- **Privacy Controls**: Robust block/unblock system that seamlessly filters users out of your map, events, and chats.

### 💬 Social & Real-Time Communication
- **Real-Time Chat**: End-to-end Socket.IO integration for instant direct messaging.
- **Social Feed**: A complete social timeline to share updates, photos, and milestones of your pets.
- **Communities & Events**: Join breed-specific or local interest groups, RSVP to meetups, and engage in community discussions.
- **Push Notifications**: Firebase Cloud Messaging (FCM) ensures you never miss a message or event reminder.

### 🎨 Premium UI/UX
- **Interactive Onboarding**: Swipeable, animated onboarding flow to guide new users.
- **Haptic Feedback**: Meaningful tactile feedback (vibrations) across interactions for a native feel.
- **Responsive Animations**: Built with `react-native-reanimated` and `react-native-gesture-handler` for buttery smooth 60fps transitions.
- **Custom Branding**: Features custom app icons for all iOS and Android densities.

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your development machine:
- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **Docker & Docker Compose** (for easily running Redis and MongoDB locally)
- **React Native Environment**: 
  - Xcode (for iOS)
  - Android Studio & Emulator (for Android)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url> pawspace
   cd pawspace
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create `.env` files based on the provided examples.
   
   **`apps/backend/.env`**
   ```env
   # Database & Cache
   MONGODB_URI=mongodb+srv://...
   REDIS_URL=redis://localhost:6379

   # Services
   CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   GOOGLE_MAPS_API_KEY=...

   # Authentication
   JWT_SECRET=...
   FIREBASE_PROJECT_ID=...
   ```

   **`apps/mobile/.env`**
   ```env
   API_BASE_URL=http://10.0.2.2:5000/api/v1 # Use localhost for iOS, 10.0.2.2 for Android Emulator
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

### Running the App

1. **Start the Backend:**
   ```bash
   cd apps/backend
   npm run dev
   ```

2. **Start the Mobile Packager (Metro):**
   ```bash
   cd apps/mobile
   npm run start --reset-cache
   ```

3. **Launch the App:**
   ```bash
   # In a new terminal window
   cd apps/mobile
   npm run android  # For Android Emulator
   # OR
   npm run ios      # For iOS Simulator
   ```

---

## 📦 Tech Stack

### Frontend (Mobile App)
- **Framework**: React Native 0.73
- **Language**: TypeScript
- **State Management**: Redux Toolkit & React Query (`@tanstack/react-query`)
- **Navigation**: React Navigation v7 (`@react-navigation/native-stack`)
- **Maps**: `react-native-maps`, `@transistorsoft/react-native-background-geolocation`, & `@react-native-community/geolocation`
- **Animations**: Reanimated v3

### Backend (API Server)
- **Framework**: Node.js & Express.js
- **Database**: MongoDB (Mongoose)
- **Caching**: Redis
- **Real-Time**: Socket.IO
- **Cloud Storage**: Cloudinary (Image uploads)
- **Authentication**: JWT & Firebase Admin

---

## 🐛 Troubleshooting

### Common Mobile Issues

- **Blank Map on Android**: Ensure your `GOOGLE_MAPS_API_KEY` is properly injected into `AndroidManifest.xml` via the `.env` file, and that your API key has "Maps SDK for Android" enabled in the Google Cloud Console.
- **Location Timeout**: Android Emulators do not broadcast a GPS location by default. Use `adb emu geo fix -122.084 37.422` or the emulator's extended controls to mock a GPS signal.
- **Metro Bundler Errors**: If you encounter `TypeError` crashes or stale code execution, always reset the Metro cache: `npx react-native start --reset-cache`.

### Common Backend Issues

- **Redis Connection Failed**: Ensure your local Redis server or Docker container is actively running on port 6379.

---

## 📄 License & Support

This project is licensed under the MIT License. For issues, feature requests, or contributions, please contact the development team or open a pull request!
