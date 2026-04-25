# What Cheese Are You? 🧀

A polished single-page React app that uses Gemini (`gemini-2.5-flash`) to turn any mood, situation, or life vibe into a dramatic cheese identity.

## Setup

1. **Get a Gemini API key**
   - Create/get your key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. **Add your key to environment variables**
   - Open `.env`
   - Replace:
     - `VITE_GEMINI_API_KEY=your_key_here`
   - With your real key:
     - `VITE_GEMINI_API_KEY=YOUR_REAL_KEY`
3. **Install dependencies**
   - `npm install`
4. **Run locally**
   - `npm run dev`
5. **Build for production (optional)**
   - `npm run build`

## Notes

- The app calls Gemini directly from the frontend (no backend required).
- If the key is missing, the UI shows: `Add your Gemini API key in .env`.
- Raw Gemini responses are logged in the browser console for debugging.
