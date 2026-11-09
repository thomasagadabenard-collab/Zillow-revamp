# Zillow Elite React client

This React/Vite client uses the Express API in `../Server`. See the [project setup guide](../README.md) for complete Neon, admin, email, and crypto configuration.

## Run locally

From this folder, copy `.env.example` to `.env`, confirm `VITE_API_URL=http://localhost:4000`, then run:

```powershell
npm install
npm run dev
```

The Vite terminal prints the local site URL, normally `http://localhost:5173`. The Express API must also be running in `../Server`.
