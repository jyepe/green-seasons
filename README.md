# Green Seasons - Restaurant Produce Ordering App

A modern, sleek React Native app that allows local restaurants to order fresh produce from Green Seasons company.

## Features

### ✅ Authentication

- **Login Screen**: Clean, modern login interface with email/password authentication
- **Signup Screen**: Comprehensive registration form for restaurant owners
- **Smooth Animations**: Micro-interactions and transitions using React Native Reanimated
- **Form Validation**: Real-time validation with user-friendly error messages

### ✅ Dashboard

- **Restaurant Overview**: Personalized dashboard showing restaurant information
- **Quick Actions**: Easy access to common tasks (New Order, Order History, etc.)
- **Recent Orders**: Display of recent order history with status indicators
- **Monthly Statistics**: Key metrics including order count, spending, and delivery performance

### ✅ Product Catalog

- **Product Browsing**: Beautiful grid layout showcasing fresh produce
- **Category Filtering**: Filter by vegetables, fruits, herbs, organic products
- **Search Functionality**: Real-time search across product names and descriptions
- **Stock Management**: Visual indicators for in-stock/out-of-stock items
- **Add to Cart**: Quick add buttons for easy ordering

## Design System

### Colors

- **Primary Greens**: #2E7D32 (500), #256628 (600), #1F5522 (700)
- **Accent Mango**: #FFB300 for CTAs and highlights
- **Surface**: Light #FAFBF7, Dark #0B0F12
- **Neutrals**: Slate/stone scale for text hierarchy
- **Status Colors**: Success, warning, error, and info states

### Typography

- **Font Family**: Inter (UI) with multiple weights
- **Headings**: Bold (700) for titles, SemiBold (600) for subtitles
- **Body Text**: Regular (400) for content

### Motion & Interactions

- **Tap Animations**: 150-220ms ease-out for button presses
- **Modal Transitions**: 250-300ms ease-in-out for screen changes
- **Micro-interactions**: Scale and opacity animations for enhanced UX

## Technical Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router for file-based routing
- **Animations**: React Native Reanimated 3
- **Icons**: Expo Vector Icons (Ionicons)
- **Fonts**: Inter from Google Fonts
- **State Management**: React Hooks (useState)
- **Styling**: StyleSheet with dynamic theming

## Project Structure

```
app/
├── auth/
│   ├── _layout.tsx          # Auth stack navigator
│   ├── login.tsx            # Login screen
│   └── signup.tsx           # Registration screen
├── (tabs)/
│   ├── _layout.tsx          # Tab navigator
│   ├── index.tsx            # Dashboard screen
│   └── explore.tsx          # Products catalog
├── _layout.tsx              # Root layout with fonts
└── index.tsx                # App entry point

constants/
└── Colors.ts                # Theme colors and design tokens
```

## Getting Started

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Start Development Server**

   ```bash
   npm start
   ```

3. **Run on Device/Simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app

## Next Steps

The foundation is set for building out the complete restaurant ordering system:

1. **Cart System**: Implement shopping cart functionality
2. **Checkout Flow**: Create order confirmation and payment screens
3. **Order Management**: Build order tracking and history features
4. **User Roles**: Implement different user types (restaurant owner, staff, etc.)
5. **Backend Integration**: Connect to real API endpoints
6. **Push Notifications**: Add order status updates
7. **Offline Support**: Cache data for offline usage

## Design Philosophy

The app follows a **fresh, trustworthy, minimal** design philosophy that's perfect for restaurant ordering. Every interaction is designed to feel smooth and professional, building trust with restaurant owners who rely on consistent, high-quality produce for their businesses.

The color palette emphasizes freshness and growth (greens) while using warm accents (mango) to highlight important actions and create visual interest.
