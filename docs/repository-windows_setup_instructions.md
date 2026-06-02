# Setting up FinHealthSnap on Windows

Welcome to FinHealthSnap! This guide is designed for anyone (no programming experience required) to get the application running on their Windows PC.

## Step 1: Install Node.js
Node.js is the engine that runs this application on your computer.
1. Go to the official Node.js website: [nodejs.org](https://nodejs.org/)
2. Download the **LTS (Long Term Support)** version for Windows.
3. Open the downloaded `.msi` file and follow the standard installation prompts (just click "Next" and "Accept" until it is installed).

## Step 2: Download the Project
1. Go to the GitHub repository page in your browser.
2. Click the green **Code** button.
3. Select **Download ZIP**.
4. Once downloaded, open your `Downloads` folder, right-click the ZIP file, and select **Extract All...**. Choose a location (like your Documents folder) and click Extract.

## Step 3: Open Command Prompt
1. Press the `Windows` key on your keyboard.
2. Type `cmd` and press Enter to open the Command Prompt.

## Step 4: Navigate to the Folder
You need to tell the Command Prompt to look inside the folder you just extracted.
1. Type `cd ` (make sure there is a space after "cd").
2. Find the extracted `FinHealthSnap-main` folder in your File Explorer. 
3. Drag and drop the folder icon from the address bar (or the folder itself) into the Command Prompt window. This will paste the folder path.
   *(Alternatively, you can manually type the path, for example: `cd C:\Users\YourName\Documents\FinHealthSnap-main`)*
4. Press **Enter**.

## Step 5: Install Dependencies
Now that you are inside the folder, tell Node.js to install the required background files.
1. In the Command Prompt, type:
   ```cmd
   npm install
   ```
2. Press **Enter** and wait a minute for it to finish.

## Step 6: Set up the Environment & Database
The application needs a database and some default settings to run. Run these commands one after the other in the Command Prompt (pressing **Enter** after each):

1. **Copy the default settings:**
   ```cmd
   copy .env.example .env
   ```
2. **Generate the database client:**
   ```cmd
   npx prisma generate
   ```
3. **Create the local database:**
   ```cmd
   npx prisma db push
   ```
4. **Seed the database with a starter account:**
   ```cmd
   npm run seed
   ```

## Step 7: Start the App!
You're almost there! To start the app, type this into the Command Prompt and press **Enter**:
```cmd
npm run dev
```

The window will show a few lines of text. This means the app is running in the background!
Leave this Command Prompt window open.

## Step 8: View the App
1. Open your favorite web browser (Edge, Chrome, Firefox, etc.).
2. Go to the following address:
   **http://localhost:3000**
3. You should see the login screen!

### Default Login
Use this account to log in (created in Step 6):
- **Email:** `user@example.com`
- **Password:** `password123`

*(When you are done using the app, you can go back to the Command Prompt window and press `Ctrl + C`, then type `Y` and press Enter to shut it down).*

## Upgrading an Existing Installation
If you previously set up the application and have downloaded the latest code from GitHub to update your existing setup, you must ensure your database schema is upgraded.
To easily upgrade the database, open Command Prompt, navigate to your project folder, and run the included batch script:
```cmd
releases\update-db-schema.bat
```
This script will safely migrate your local `dev.db` schema to support the newest features without data loss.
