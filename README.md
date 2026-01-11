# Backpressure - AI Assistant Game

A fast-paced, interactive web game inspired by Overcooked, where you play as an AI assistant managing multiple requests under time pressure.

## Quick Start

```bash
npm install
npm run dev
```

The game will be available at `http://localhost:5173`

## How to Play

- **Requests** appear continuously as cards on the screen
- Each request has a **countdown timer** - respond before it expires!
- Use **number keys [1-9]** to quickly respond to requests
- Press **[S]** to skip the first request
- **5 failures** (expired requests) = Game Over
- Requests spawn **faster** as difficulty increases
- Score points by responding quickly and handling difficult requests

## Controls

- **Number Keys [1-9]**: Respond to the corresponding request card
- **S Key**: Skip the first request
- **Mouse**: Click "Respond" or "Skip" buttons on cards

## Game Features

- ⚡ Real-time request spawning with increasing difficulty
- 🎯 Visual urgency indicators (color changes, pulse, shake animations)
- ⌨️ Keyboard shortcuts for fast gameplay
- 📊 Score tracking based on difficulty and time remaining
- 🎮 Progressive difficulty system

## Tech Stack

- React + TypeScript
- Tailwind CSS
- Vite

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```
