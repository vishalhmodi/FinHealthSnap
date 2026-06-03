# FinHealthSnap Deployment Plan

Because this application uses **Next.js** and **SQLite**, launching it to the live internet requires choosing how to handle the database. Standard serverless platforms (like Vercel) destroy local files (like our `dev.db` SQLite file) every time the app goes to sleep, meaning your data would be erased. 

Here are the two best **free/cheap** strategies for launching this project.

---

## Option 1: The Modern Serverless Stack (100% Free & Recommended)
Instead of keeping the database in a local SQLite file, we migrate the database to a free cloud PostgreSQL provider, and host the website on Vercel.

* **Frontend Hosting:** Vercel (Free Tier)
* **Database Hosting:** Neon.tech or Supabase (Free Tier for PostgreSQL)
* **Cost:** $0/month

**Steps to Implement:**
1. Create a free account on [Neon.tech](https://neon.tech/) and get a Database URL.
2. Change our `schema.prisma` file to use `provider = "postgresql"` instead of `"sqlite"`.
3. Push the code to GitHub.
4. Log into [Vercel](https://vercel.com/) and deploy the GitHub repository, pasting your Neon Database URL into the Environment Variables.

*Pros:* Infinite scalability, zero maintenance, completely free.
*Cons:* We have to do a one-time migration of the Prisma schema to Postgres (very easy).

---

## Option 2: The Persistent Container Approach (Free to ~$5/mo)
If you want to keep using SQLite exactly as it is now (with the `dev.db` file), you must host the app on a traditional server that has a persistent hard drive.

* **Hosting Provider:** Fly.io (Has a small free tier) or Render.com ($7/mo) or a DigitalOcean Droplet ($4/mo).
* **Cost:** $0 to $7/month depending on traffic and provider.

**Steps to Implement (Fly.io example):**
1. Create a `Dockerfile` for our Next.js app.
2. Install the `flyctl` command-line tool.
3. Run `fly launch` and provision a **Persistent Volume** (a virtual hard drive) to store the `dev.db` file.
4. Deploy the app.

*Pros:* No changes to the database code.
*Cons:* Slightly more complex to set up (requires Docker and volume management).

---

## Option 3: Local Home Server (Free + High Privacy)
Since this is a financial app, if you don't want your data on the cloud, you can host it securely from your own home using a tool like Cloudflare Tunnels.

* **Hosting Provider:** Your own Mac or a cheap Raspberry Pi.
* **Network:** Cloudflare Tunnels (Free)
* **Cost:** $0

**Steps to Implement:**
1. Keep the app running via `npm run start` on your computer.
2. Install Cloudflare `cloudflared`.
3. Create a tunnel that securely exposes `localhost:3000` to a custom domain (like `finance.yourname.com`).

*Pros:* Total data privacy (the `.db` file never leaves your house).
*Cons:* Your computer must remain powered on to access the website.

---

## Recommendation
If you want the easiest, most reliable cloud setup, **Option 1 (Vercel + Neon)** is the gold standard for Next.js apps. If you want maximum privacy for your financial data, **Option 3** is fantastic.

Let me know which option appeals to you, and we can begin executing those steps!
