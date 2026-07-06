# Deploy the Frontend to Vercel

The website (the part customers see) deploys to **Vercel** — free, connects to your
GitHub repo, and auto-updates every time you push. Verified: the production build
passes with zero errors.

> ⚠️ Heads-up: the frontend talks to the backend API. Until the **backend** is also
> deployed (next step), the live site will load and look correct, but products, login
> and checkout won't work yet. That's expected — we finish it when the backend goes up.

---

## Before you start
- Your code must be **pushed to GitHub** (commit + push today's changes in GitHub Desktop first).

## Step 1 — Create a Vercel account
1. Go to **vercel.com** → **Sign Up** → choose **Continue with GitHub** (easiest — links them automatically).
2. Approve the permissions Vercel asks for.

## Step 2 — Import your repository
1. On the Vercel dashboard click **Add New… → Project**.
2. Find **Kabul-Mandawi** in the list → click **Import**.

## Step 3 — Configure the project (important settings)
On the configuration screen:

1. **Root Directory** — click **Edit** and set it to **`apps/web`**
   *(This is critical — the website lives in that folder, not the repo root.)*
2. **Framework Preset** — should auto-detect **Next.js**. Leave it.
3. **Build & Output settings** — leave as default.

## Step 4 — Add Environment Variables
Still on the configuration screen, open **Environment Variables** and add these four
(Name → Value):

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:4000/api` *(temporary — we replace this with the live backend URL after the backend is deployed)* |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_placeholder` |
| `NEXT_PUBLIC_AFN_PER_USD` | `64.4` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | *(leave blank)* |

## Step 5 — Deploy
1. Click **Deploy**.
2. Wait ~2 minutes. When it finishes you get a live URL like
   **`kabul-mandawi.vercel.app`** 🎉
3. Open it — you'll see your homepage, in all three languages, live on the internet.

---

## After the backend is deployed (next step)
1. In Vercel: **Project → Settings → Environment Variables**.
2. Edit `NEXT_PUBLIC_API_BASE_URL` → change it to your live backend URL, e.g.
   `https://kabul-mandawi-api.up.railway.app/api`.
3. Go to **Deployments → ⋯ → Redeploy** so the change takes effect.

Then products, login, cart and checkout all work on the live site.

## Auto-deploys
From now on, every time you **push to GitHub** (via GitHub Desktop), Vercel
automatically rebuilds and updates your live site within a couple of minutes. No
extra steps.
