# TurfX Mobile App

React Native (Expo) mobile app for iOS & Android.

## Project Structure

```
turfx-mobile/
├── App.js                        # Root entry point
├── app.json                      # Expo config
├── src/
│   ├── config/api.js             # API base URL config
│   ├── context/AuthContext.js    # Auth state (SecureStore)
│   ├── theme/colors.js           # Color & font constants
│   ├── navigation/AppNavigator.js # Stack + Tab navigation
│   ├── components/
│   │   ├── TurfCard.js
│   │   ├── ReviewCard.js
│   │   ├── LoadingScreen.js
│   │   └── EmptyState.js
│   └── screens/
│       ├── auth/
│       │   ├── LoginScreen.js
│       │   └── ForgotPasswordScreen.js
│       └── main/
│           ├── HomeScreen.js
│           ├── ExploreScreen.js
│           ├── TurfDetailScreen.js
│           ├── CheckoutScreen.js
│           ├── BookingConfirmedScreen.js
│           ├── MyBookingsScreen.js
│           └── ProfileScreen.js
```

## Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (iOS/Android)

## Setup

### 1. Configure API URL

Edit `src/config/api.js`:

```js
// For Android emulator:
export const API_URL = 'http://10.0.2.2:5000/api';

// For iOS simulator:
export const API_URL = 'http://localhost:5000/api';

// For physical device (replace with your machine's local IP):
export const API_URL = 'http://192.168.1.XXX:5000/api';
```

### 2. Add placeholder assets

Place these files in the `assets/` folder:
- `icon.png` — 1024×1024 app icon
- `splash.png` — 1242×2436 splash screen
- `adaptive-icon.png` — 1024×1024 adaptive icon (Android)
- `favicon.png` — 48×48 favicon (web)

### 3. Install dependencies

```bash
npm install
```

### 4. Start the backend

In a separate terminal:
```bash
cd turfx-backend
uvicorn main:app --host 0.0.0.0 --port 5000 --reload
```

### 5. Run the app

```bash
# Start Expo dev server
npx expo start

# Then scan the QR code with Expo Go app on your phone
# Or press 'a' for Android emulator, 'i' for iOS simulator
```

## Screens

| Screen | Description |
|--------|-------------|
| Login / Register | Phone + password auth, auto-navigate to MainApp |
| Forgot Password | Email OTP flow |
| Home | Hero, sport filters, featured turfs |
| Explore | Search, sport filter, all venues |
| Turf Detail | Images, amenities, reviews, book button |
| Checkout | Date strip, hourly slot picker, price breakdown, pay |
| Booking Confirmed | Success screen with booking details |
| My Bookings | Upcoming / Completed / Cancelled tabs |
| Profile | Edit name, quick links, logout |

## Production Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for both platforms
eas build --platform all
```

## Notes

- Razorpay is in **demo mode** — bookings are created directly without payment gateway.
- For production, install `react-native-razorpay` and wire it in `CheckoutScreen.js`.
- Minimum ₹800 per slot is enforced on the backend.
