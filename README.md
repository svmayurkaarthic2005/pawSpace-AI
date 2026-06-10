# PawSpace 🐾

AI-powered pet social networking app that connects pet owners and their furry friends.

## 🏗️ Project Structure

This is a monorepo containing:

- **`apps/backend`** - Node.js/Express backend API with Socket.IO for real-time features
- **`apps/mobile`** - React Native mobile application (iOS & Android)
- **`packages/*`** - Shared packages and utilities

## ✨ Features

- 🤖 AI-powered pet assistant and smart search
- 📱 Social feed for pets with posts, comments, and likes
- 💬 Real-time chat messaging with Socket.IO
- 🗺️ Map-based discovery of nearby pets and events
- 👥 Communities for pet owners
- 📅 Pet events and meetups
- 🔔 Real-time push notifications
- 👤 User profiles and pet profiles
- 🔍 AI-enhanced explore and search functionality
- 📸 Swipeable onboarding with custom app logo

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20.0.0
- **npm** >= 10.0.0
- **Docker** and Docker Compose (for backend services)
- **React Native development environment** (for mobile)
  - Xcode (for iOS development)
  - Android Studio (for Android development)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pawspace
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in the root directory
   - Copy `apps/backend/.env.example` to `apps/backend/.env`
   - Copy `apps/mobile/.env.example` to `apps/mobile/.env`

### Running the Project

#### Backend
```bash
cd apps/backend
npm run dev
```

#### Mobile (iOS)
```bash
cd apps/mobile
npm run ios
```

#### Mobile (Android)
```bash
cd apps/mobile
npm run android
```

## 📱 Mobile App Features

### Authentication Flow
- Firebase Authentication
- Email/Password signup
- Social login support
- Onboarding screens with swipe navigation

### User Experience
- **Swipeable Onboarding**: Users can swipe left/right through 3 onboarding slides with animated transitions
- **Custom App Logo**: App icon generated from EasyAppIcon with support for multiple resolutions
- **Real-time Chat**: Socket.IO integration for instant messaging
- **Location Services**: Map-based discovery of nearby pets and events
- **Push Notifications**: Firebase Cloud Messaging (FCM) for real-time alerts

### Navigation Structure
- Auth Stack (Authentication, Onboarding, Registration)
- Main Stack (Feed, Communities, Chat, Explore, Profile)
- Tab-based navigation for main features

## 🔧 Backend Architecture

### API Endpoints
- `/api/auth` - Authentication
- `/api/users` - User management
- `/api/pets` - Pet profiles
- `/api/posts` - Social feed
- `/api/chat` - Messaging
- `/api/communities` - Community management
- `/api/events` - Event management
- `/api/explore` - Discovery features
- `/api/ai` - AI services

### Services
- **AI Services**: Pet assistant, recommendations, caption generation, smart search
- **Auth Service**: Firebase integration, JWT tokens
- **Cache Service**: Redis caching layer
- **Chat Service**: Real-time messaging
- **Notification Service**: Push notifications via FCM
- **Event Service**: Event management and RSVPs

### Database
- MongoDB for primary data storage
- Redis for caching and sessions
- Firebase for authentication

### Real-time Features
- Socket.IO for chat, notifications, and presence updates
- Handlers for chat, community, notifications, and user presence

## 📦 Tech Stack

### Frontend (Mobile)
- React Native with TypeScript
- React Navigation
- Reanimated (animations)
- Redux for state management
- React Query for data fetching

### Backend
- Node.js / Express
- TypeScript
- MongoDB
- Redis
- Socket.IO
- Firebase (Auth, Cloud Messaging)

### Hosting & Services
- Docker & Docker Compose for containerization
- Cloudinary for image management
- Google Maps API
- Google Places API

## 🎨 App Icons

Custom app logos have been integrated from EasyAppIcon:
- Android: Multiple density support (ldpi, mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
- iOS: All required sizes via AppIcon.appiconset

Located in: `apps/mobile/android/app/src/main/res/` and `apps/mobile/ios/myapp/Images.xcassets/`

## 🔌 Environment Variables

### Backend
```
MONGODB_URI=mongodb://...
REDIS_URL=redis://...
FIREBASE_SERVICE_ACCOUNT_KEY=...
CLOUDINARY_API_KEY=...
GOOGLE_MAPS_API_KEY=...
```

### Mobile
```
FIREBASE_PROJECT_ID=...
GOOGLE_MAPS_API_KEY=...
API_URL=http://...
```

## 📝 Scripts

### Development
```bash
npm run dev        # Start development servers
npm run build      # Build for production
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
```

### Mobile
```bash
npm run ios        # Run on iOS simulator
npm run android    # Run on Android emulator
npm run mobile     # Run mobile app
```

### Testing
```bash
npm run test       # Run tests
npm run test:watch # Run tests in watch mode
```

## 🐛 Troubleshooting

### Common Issues

**Maps not working on Android:**
- Ensure Google Maps API key is configured in `AndroidManifest.xml`
- Rebuild the app: `npm run android`

**Build errors:**
- Clear cache: `npm run clean` or `npm run clean-and-rebuild`
- Rebuild: `npm run android` or `npm run ios`

**Firebase issues:**
- Verify Firebase configuration in `.env`
- Check Firebase project settings in Console

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For issues and questions, please open an issue on GitHub or contact the development team.
