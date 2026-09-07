# DeviceCare Dashboard

Built and tested locally — `npm run build` succeeds with Vite, no errors.

## Deploy to Vercel (same account you already have, free, no card)

1. Create a new GitHub repo (e.g. `devicecare-dashboard`) and upload these
   files, keeping the folder structure:
   ```
   package.json
   vite.config.js
   index.html
   .gitignore
   src/main.jsx
   src/DeviceCareDashboard.jsx
   ```
   (`node_modules` and `dist` are not needed — Vercel builds those itself.)

2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import
   this repo.

3. Vercel auto-detects **Vite** as the framework — leave all build settings
   on their defaults.

4. Click **Deploy**. In about a minute you get a URL like
   `https://devicecare-dashboard.vercel.app`.

## Using it

Open the URL, click the **"Preview data"** badge in the top bar to open the
Connect panel, paste in your backend URL (already pre-filled to
`https://devicecare-backend.vercel.app`) and your `ADMIN_KEY`, then Connect.
The Fleet tab will show real companies/machines from your backend. The
Billing/Alerts/Reports tabs are still preview/mock data — no backend exists
for those yet.
