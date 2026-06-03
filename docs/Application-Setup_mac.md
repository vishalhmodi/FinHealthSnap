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

### Option A: Start Fresh with Docker Storage (Default)
You don't need to do anything. The default `docker-compose.yml` file is already set up to create a brand new, permanent database for you inside Docker's hidden internal storage. It will automatically populate the new database with sample demo accounts (`demoUSA@snapshot.local` and `demoCA@snapshot.local`) so you can explore the app immediately!

> [!WARNING]
> **Consequence of Option A:** Because the database is hidden inside Docker, if you download a new version of the app later and unzip it into a *new folder*, Docker will create a brand new, empty database for that new folder. Your old data won't automatically carry over unless you unzip the new version over the *exact same folder*.

### Option B: Use a Visible Database File (Best for easy upgrades)
If you prefer to have your database file visible right in your folder (so you can easily back it up or copy it to a new version folder later):

1. **If you have an existing database:** Place your old `dev.db` file inside the existing `prisma` folder.
   **If you are starting fresh:** Open your Terminal, navigate into the `prisma` folder, and create an empty file by running `touch dev.db`.
2. Open `docker-compose.yml` in a text editor (like TextEdit).
3. Update your secrets: Ensure `NEXTAUTH_SECRET` and `JWT_SECRET` in `docker-compose.yml` match the values from your original `.env` file. If they do not match, you will get an "invalid credential" error when logging in.
4. Find the `volumes:` section and change it to look exactly like this:
   ```yaml
       volumes:
         - ./prisma/dev.db:/app/prisma/dev.db
   ```
5. Delete the bottom two lines (`volumes:` and `  finhealth-db:`).

## Step 4: Update Database Schema (If Upgrading)
If you are upgrading from an older version of FinHealthSnap and brought over your old `dev.db` file, you must update the database schema to support new features.
In your Terminal (inside the `FinHealthSnap_App` folder), run:
```bash
./update-db-schema.sh
```
*(Note: If you are starting fresh with Option A, you can skip this step.)*

## Step 5: Launch the Application
> [!WARNING]
> **NEVER** click "Run" on the image directly inside the Docker Desktop app. Doing so creates a rogue container that ignores your configuration and will cause port conflicts. Always use the terminal commands below.

In your Terminal (still inside the `FinHealthSnap_App` folder), run the start script:
```bash
./manage-docker.sh
```
This script will automatically detect if the app is already running. If it's not, it will start it for you!
*(Note: If you are on an M-series Mac, you may see a warning about the platform `linux/amd64` not matching `linux/arm64/v8`. You can safely ignore this warning.)*

## Step 6: Access the App
> [!NOTE]
> The terminal logs might say the app is running at `http://localhost:3000`, but because of our Docker mapping, you must use port 3005.

1. Open your web browser and go to: **[http://localhost:3005](http://localhost:3005)**
2. If you chose Option A (Fresh Start), click "Register" or "Sign Up" to create your new account.
3. If you chose Option B, log in with your existing credentials.

**To stop the app:** Run `./manage-docker.sh` in your Terminal again. It will detect the app is running and ask if you want to stop it.

## How to Restart the App Later
If you have stopped the app or restarted your computer, follow these steps to bring it back up:
1. Open **Terminal** and ensure Docker Desktop is running.
2. Type `cd ` (with a space at the end) and drag the `FinHealthSnap_App` folder into the Terminal window, then press Enter.
3. Run the helper script:
   ```bash
   ./manage-docker.sh
   ```
4. Access the app at **[http://localhost:3005](http://localhost:3005)**
