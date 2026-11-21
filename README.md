# TidalBYTE


# Sign Language MediaPipe Base Starter

Drop-in React + MediaPipe Holistic starter components that automatically fetch Google's pre-trained Holistic Landmarker model and WASM runtime at runtime—no manual model downloads required for anyone cloning the repo.

## Quick Setup

1. Place `package.json`, `mediapipeService.js`, `signDatabase.js`, and `SignTracker.jsx` into your project.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Import and render `<SignTracker />` in your app entry point.

## How It Works

- **`mediapipeService.js`**: Automatically loads `@mediapipe/tasks-vision` WASM files and the `holistic_landmarker.task` model from Google's official CDN, then flattens 21 left-hand, 21 right-hand, and 33 pose landmarks into a 225-float feature vector.
- **`signDatabase.js`**: Provides a starter sign dictionary, stores recorded landmark sequences in `localStorage`, and computes cosine similarity scores between live frames and stored sign references.
- **`SignTracker.jsx`**: Captures webcam video, renders real-time skeletal overlays on a `<canvas>`, lets users record new reference signs, and displays live match confidence.
