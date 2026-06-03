# FinHealthSnap: Windows Setup Guide

Follow these instructions to launch FinHealthSnap on your Windows PC.

## Prerequisites
1. Download and install **Docker Desktop for Windows**: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
2. During installation, make sure **WSL 2** (Windows Subsystem for Linux) is enabled if prompted.
3. Open Docker Desktop and ensure it is running (you should see the Docker icon in your system tray on the bottom right).

## Step 1: Unzip the Application
1. Right-click the `FinHealthSnap_App.zip` file and select **Extract All...**
2. Move the extracted `FinHealthSnap_App` folder to your `Documents` or `Desktop` for easy access.

## Step 2: Load the Application Image
1. Open **PowerShell** or **Command Prompt** (Press `Win`, type "PowerShell", and hit Enter).
2. Type `cd ` (with a space at the end) and drag the `FinHealthSnap_App` folder from File Explorer into the PowerShell window, then press Enter.
3. Run the following command to load the application into Docker:
   ```cmd
   docker load -i finhealthsnap-release.tar
   ```
   *Wait for it to say "Loaded image: finhealthsnap-release:latest".*

## Step 3: Database Configuration

You have two options for your data:

### Option A: Start Fresh (Recommended for new users)
You don't need to do anything. The default `docker-compose.yml` file is already set up to create a brand new, permanent database for you. It will automatically populate the new database with sample demo accounts (`demoUSA@snapshot.local` and `demoCA@snapshot.local`) so you can explore the app immediately!

### Option B: Use an Existing Database
If you received an existing `dev.db` file containing old data:
1. Place your `dev.db` file inside the existing `prisma` folder.
2. Open `docker-compose.yml` in Notepad.
3. Update your secrets: Ensure `NEXTAUTH_SECRET` and `JWT_SECRET` in `docker-compose.yml` match the values from your original `.env` file. If they do not match, you will get an "invalid credential" error when logging in.
4. Find the `volumes:` section and change it to look exactly like this:
   ```yaml
       volumes:
         - ./prisma/dev.db:/app/prisma/dev.db
   ```
5. Delete the bottom two lines (`volumes:` and `  finhealth-db:`).
6. Save the file.

## Step 4: Update Database Schema (If Upgrading)
If you are upgrading from an older version of FinHealthSnap and brought over your old `dev.db` file, you must update the database schema to support new features.
In your PowerShell/Command Prompt window (inside the `FinHealthSnap_App` folder), run:
```cmd
.\update-db-schema.bat
```
*(Note: If you are starting fresh with Option A, you can skip this step.)*

## Step 5: Launch the Application
> [!WARNING]
> **NEVER** click "Run" on the image directly inside the Docker Desktop app. Doing so creates a rogue container that ignores your configuration and will cause port conflicts. Always use the terminal commands below.

In your PowerShell window (still inside the `FinHealthSnap_App` folder), run:
```cmd
docker compose up -d
```

## Step 6: Access the App
> [!NOTE]
> The terminal logs might say the app is running at `http://localhost:3000`, but because of our Docker mapping, you must use port 3005.

1. Open your web browser (Chrome, Edge, Firefox) and go to: **[http://localhost:3005](http://localhost:3005)**
2. If you chose Option A (Fresh Start), click "Register" or "Sign Up" to create your new account.
3. If you chose Option B, log in with your existing credentials.

**To stop the app:** Run `docker compose down` in your PowerShell window.

## How to Restart the App Later
If you have stopped the app or restarted your computer, follow these steps to bring it back up:
1. Open **PowerShell** and ensure Docker Desktop is running.
2. Type `cd ` (with a space at the end) and drag the `FinHealthSnap_App` folder into the PowerShell window, then press Enter.
3. Run the following command:
   ```cmd
   docker compose up -d
   ```
4. Access the app at **[http://localhost:3005](http://localhost:3005)**
