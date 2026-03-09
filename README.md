# Signly — ASL Learning App

An interactive American Sign Language (ASL) learning web app
built with React, Vite, TailwindCSS, and MediaPipe Hands.

## Features
- **Dictionary** — Browse all 26 ASL alphabet letters with
  reference images, hand shape descriptions, and pro tips
- **Visual Quiz** — Identify signs from images with a timer
  and point scoring system
- **Camera Quiz** — Sign the correct letter into your webcam
  and get real-time AI feedback
- **Letter Practice** — Practice any letter with live hand
  landmark tracking
- **Word Spelling** — Spell full words letter by letter using
  fingerspelling

## Tech Stack
- React 18 + Vite 5
- TailwindCSS
- Framer Motion
- MediaPipe Hands (hand landmark detection)
- Zustand (state management)
- React Router v6
- FastAPI + Python (backend gesture prediction server)

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+

### Frontend Setup
npm install
npm run dev
Open http://localhost:5173

### Backend Setup
cd backend (or wherever main.py is)
pip install fastapi uvicorn
uvicorn main:app --reload
Backend runs on http://localhost:8000

## How to Use
1. Go to Dictionary to browse all signs
2. Go to Webcam → Letter Practice to practice signing
3. Go to Quiz → Visual Quiz to test your knowledge
4. Go to Quiz → Sign It to use your webcam for the quiz

## Adding New Signs
In src/data/signs.js add a new object:
{
  id: 27,
  word: "HELLO",
  category: "greetings",
  mediaType: "gif",
  src: "/assets/signs/hello.gif",
  handShape: "Open hand, palm out",
  description: "Wave open hand near forehead",
  tip: "Keep your wrist relaxed"
}
Then add the corresponding image to public/assets/signs/

## Camera Notes
- Works best with good lighting
- Hold your hand clearly in frame
- Currently optimized for LEFT hand users
- Camera automatically releases when navigating away

## Project Structure
src/
  components/    — Reusable UI components
  pages/         — Route-level page components
  hooks/         — Custom React hooks (MediaPipe, classifier)
  data/          — Sign dictionary data
  utils/         — Landmark classification logic
  store/         — Zustand state stores
public/
  assets/signs/  — Sign reference GIF/image files
  models/        — ML model files (if any)
