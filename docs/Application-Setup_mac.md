# FinHealthSnap: Mac Setup Guide

Follow these instructions to launch FinHealthSnap on your Mac.

## Prerequisites
1. Download and install **Docker Desktop for Mac**: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
2. Open Docker Desktop and ensure it is running (look for the whale icon in your top menu bar).

## Step 1: Unzip the Application
1. Unzip the `FinHealthSnap_App` folder you received.
2. Move the folder to your `Documents` or `Desktop` for easy access.

## Step 2: Load the Application Image
1. Open the **Terminal** app on your Mac (Press `Cmd + Space`, type "Terminal", and hit Enter).
2. Type `cd ` (with a space at the end) and drag the `FinHealthSnap_App` folder from Finder into the Terminal window, then press Enter.
3. Run the following command to load the application into Docker:
   ```bash
   docker load -i finhealthsnap-release.tar
   ```
   *Wait for it to say "Loaded image: finhealthsnap-release:latest".*

## Step 3: Database Configuration

You have two options for your data:

### Option A: Start Fresh (Recommended for new users)
You don't need to do anything. The default `docker-compose.yml` file is already set up to create a brand new, permanent database for you.

### Option B: Use an Existing Database
If you received an existing `dev.db` file containing old data:
1. Create a folder named `prisma` inside the `FinHealthSnap_App` folder.
2. Place the `dev.db` file inside that `prisma` folder.
3. Open `docker-compose.yml` in a text editor (like TextEdit).
4. Find the `volumes:` section and change it to look exactly like this:
   ```yaml
       volumes:
         - ./prisma:/app/prisma
   ```
5. Delete the bottom two lines (`volumes:` and `  finhealth-db:`).

## Step 4: Update Database Schema (If Upgrading)
If you are upgrading from an older version of FinHealthSnap and brought over your old `dev.db` file, you must update the database schema to support new features.
In your Terminal (inside the `FinHealthSnap_App` folder), run:
```bash
./update-db-add-category.sh
```
*(Note: If you are starting fresh with Option A, you can skip this step.)*

## Step 5: Launch the Application
In your Terminal (still inside the `FinHealthSnap_App` folder), run:
```bash
docker compose up -d
```

## Step 6: Access the App
1. Open your web browser and go to: **[http://localhost:3005](http://localhost:3005)**
2. If you chose Option A (Fresh Start), click "Register" or "Sign Up" to create your new account.
3. If you chose Option B, log in with your existing credentials.

**To stop the app:** Run `docker compose down` in your Terminal.

## How to Restart the App Later
If you have stopped the app or restarted your computer, follow these steps to bring it back up:
1. Open **Terminal** and ensure Docker Desktop is running.
2. Type `cd ` (with a space at the end) and drag the `FinHealthSnap_App` folder into the Terminal window, then press Enter.
3. Run the following command:
   ```bash
   docker compose up -d
   ```
4. Access the app at **[http://localhost:3005](http://localhost:3005)**
