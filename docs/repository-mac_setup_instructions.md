# Setting up FinHealthSnap on Mac

Welcome to FinHealthSnap! This guide is designed for anyone (no programming experience required) to get the application running on their Mac.

## Step 1: Install Node.js
Node.js is the engine that runs this application on your computer.
1. Go to the official Node.js website: [nodejs.org](https://nodejs.org/)
2. Download the **LTS (Long Term Support)** version for macOS.
3. Open the downloaded `.pkg` file and follow the standard installation prompts (just click "Continue" and "Agree" until it is installed).

## Step 2: Download the Project
1. Go to the GitHub repository page in your browser.
2. Click the green **Code** button.
3. Select **Download ZIP**.
4. Once downloaded, open your `Downloads` folder and double-click the ZIP file to extract it. This will create a folder (e.g., `FinHealthSnap-main`).

## Step 3: Open Terminal
1. Press `Command + Spacebar` to open Spotlight Search.
2. Type `Terminal` and press Enter.

## Step 4: Navigate to the Folder
You need to tell the Terminal to look inside the folder you just downloaded.
1. Type `cd ` (make sure there is a space after "cd").
2. Drag and drop the extracted `FinHealthSnap-main` folder from your Downloads into the Terminal window.
3. Press **Enter**.

## Step 5: Install Dependencies
Now that you are inside the folder, tell Node.js to install the required background files.
1. In the Terminal, type:
   ```bash
   npm install
   ```
2. Press **Enter** and wait a minute for it to finish.

## Step 6: Set up the Environment & Database
The application needs a database and some default settings to run. Run these three commands one after the other in the Terminal (pressing **Enter** after each):

1. **Copy the default settings:**
   ```bash
   cp .env.example .env
   ```
2. **Create the local database:**
   ```bash
   npx prisma db push
   ```
3. **Seed the database with a starter account:**
   ```bash
   npm run seed
   ```

## Step 7: Start the App!
You're almost there! To start the app, type this into the Terminal and press **Enter**:
```bash
npm run dev
```

The Terminal will show a few lines of text. This means the app is running in the background!
Leave this Terminal window open.

## Step 8: View the App
1. Open your favorite web browser (Safari, Chrome, etc.).
2. Go to the following address:
   **http://localhost:3000**
3. You should see the login screen!

### Default Login
Use this account to log in (created in Step 6):
- **Email:** `user@example.com`
- **Password:** `password123`

*(When you are done using the app, you can go back to the Terminal window and press `Control + C` to shut it down).*

## Upgrading an Existing Installation
If you previously set up the application and have downloaded the latest code from GitHub to update your existing setup, you must ensure your database schema is upgraded.
To easily upgrade the database, open Terminal, navigate to your project folder, and run the included script:
```bash
sh releases/update-db-add-category.sh
```
This script will safely migrate your local `dev.db` schema to support the newest features without data loss.
