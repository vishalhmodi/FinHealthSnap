# FinHealthSnap: Developer Release Guide

This guide is for **you** (the developer) to prepare a secure release of your application **without** distributing your source code. 

Instead of giving the user the full project folder, you will package the application into a single compiled Docker Image `.tar` file, along with a production-ready `docker-compose.yml` file.

## Step 1: Build the Production Image

Open your terminal in your project root (`/Users/vicky/Projects/FinHealthSnap`) and build the final Docker image.

```bash
docker build -t finhealthsnap-release:latest .
```
*(This uses the `Dockerfile` to compile the app and securely bundle it into an image).*

## Step 2: Export the Image

Now, compress that Docker image into a single portable `.tar` file. This might take a minute and the file will be a few hundred megabytes.

```bash
docker save -o finhealthsnap-release.tar finhealthsnap-release:latest
```

## Step 3: Create the Distribution Folder

Create a brand new folder on your Desktop (e.g., `FinHealthSnap_App`). 
Move the `finhealthsnap-release.tar` file into this new folder.

## Step 4: Create the Production `docker-compose.yml`

Inside that new `FinHealthSnap_App` folder, create a file named `docker-compose.yml`. 

**Do NOT use your development compose file!** Paste the following code into it. Notice that it uses `image:` instead of `build: .` so that it doesn't require the source code.

```yaml
version: '3.8'
services:
  finhealthsnap:
    image: finhealthsnap-release:latest
    container_name: finhealthsnap
    ports:
      - "3005:3000"
    environment:
      - DATABASE_URL=file:/app/prisma/dev.db
      - NEXTAUTH_SECRET=your-secure-secret-key-change-me
      - JWT_SECRET=your-secure-jwt-key-change-me
      - NEXTAUTH_URL=http://localhost:3005
    volumes:
      # Option 1: Permanent isolated database inside Docker (Blank Start)
      # Recommended for new users who don't have existing data.
      - finhealth-db:/app/prisma
      
      # Option 2: Share an existing dev.db file
      # If the user already has a dev.db file, they should place it in a 'prisma' folder next to this file.
      # To use Option 2: comment out Option 1 above, uncomment Option 2 below, and DELETE the entire 'volumes:' section at the very bottom of this file.
      # - ./prisma:/app/prisma
    restart: unless-stopped

volumes:
  finhealth-db:
```

## Step 5: Package and Send

Your `FinHealthSnap_App` folder should now contain exactly two files:
1. `finhealthsnap-release.tar`
2. `docker-compose.yml`

*(Optional: If you want to provide the user with existing data, create a folder named `prisma` in here and paste your `dev.db` inside it, then instruct them to use Option 2 in the compose file).*

Zip this folder and send it to the user! Provide them with the `SETUP_MAC.md` or `SETUP_WINDOWS.md` guide.
