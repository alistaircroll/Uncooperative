# Uncooperative - Multiplayer Game

A real-time multiplayer game built with Next.js and Firebase, exploring the tragedy of the commons.

## Setup Instructions

### 1. Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable **Realtime Database**:
   - In the Firebase console, go to "Build" → "Realtime Database"
   - Click "Create Database"
   - Choose a location
   - Start in **test mode** (for development)
4. Get your Firebase config:
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click the web icon (`</>`) to add a web app
   - Copy the `firebaseConfig` object
5. Update `src/lib/firebase.js` with your config values

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Deploy!

Alternatively, use the Vercel CLI:

```bash
npm install -g vercel
vercel
```

## How to Play

1. **Host**: Click "Create New Game" to start a new game session
2. **Players**: Scan the QR code or visit the join URL on mobile devices
3. **Gameplay**: 
   - Each turn, players extract money from the treasury
   - The treasury earns interest after each turn
   - Win by having the most money at the end
   - But if the treasury runs out, everyone loses!

## Project Structure

```
src/
├── app/
│   ├── host/          # Main display (game host view)
│   ├── play/          # Mobile display (player view)
│   ├── globals.css    # Design system & styles
│   └── page.tsx       # Landing page
└── lib/
    └── firebase.js    # Firebase configuration
```

## Tech Stack

- **Next.js 15** - React framework
- **Firebase Realtime Database** - Real-time state synchronization
- **Vercel** - Deployment platform
- **CSS Modules** - Styling

## Firebase Database Structure

```json
{
  "games": {
    "gameId": {
      "treasury": 100000000,
      "turn": 1,
      "maxTurns": 10,
      "maxExtraction": 5000000,
      "interestRate": 0.10,
      "status": "playing",
      "turnPhase": "extracting",
      "players": {
        "playerId": {
          "name": "Player Name",
          "wealth": 5000000,
          "currentTurnExtraction": 2000000
        }
      }
    }
  }
}
```

## License

MIT
