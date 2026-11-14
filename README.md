<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Qwen Agent Studio

This app contains the local development setup for the Qwen Agent Studio interface.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Copy [.env.example](.env.example) to `.env.local` and set `GEMINI_API_KEY` to your Gemini API key.
3. Set `MODEL_DEVICE=cpu` in `.env.local` if you are running on a CPU-only machine; otherwise leave it as `cuda` or unset.
4. Run the app:
   `npm run dev`

The app starts the Express + Vite development server and serves the local frontend on the configured port.
