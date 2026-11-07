# AI Workspace

## Development

Install dependencies in both packages:

```powershell
npm install
npm --prefix server install
```

Set `GROQ_API_KEY` in `server/.env`. Keep this key on the server; do not add it to a `VITE_` variable.

Run the frontend and backend in separate terminals:

```powershell
npm run dev
```

```powershell
npm --prefix server run dev
```

Open the Vite URL shown in the frontend terminal. During development, Vite proxies `/api` requests to the backend on port 3001.

## Production

Build the frontend and compile the backend:

```powershell
npm run build
```

Set `GROQ_API_KEY` in the hosting provider's server-side environment, then start the Express server:

```powershell
npm start
```

Express serves the built frontend and API from the same origin. The server listens on `PORT` when provided by the host, or port 3001 otherwise. The `/health` endpoint can be used for health checks.
