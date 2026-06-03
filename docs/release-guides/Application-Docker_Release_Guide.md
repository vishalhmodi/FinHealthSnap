# FinHealthSnap: Developer Release Guide

This guide is for **you** (the developer) to prepare a secure release of your application **without** distributing your source code. 

Instead of giving the user the full project folder, you will package the application into a single compiled Docker Image `.tar` file, along with a production-ready `docker-compose.yml` file.

## Step 1: Run the Automated Release Script

We have automated the process of building the image, exporting it, generating the `docker-compose.yml`, and placing it in a dedicated folder. 

Open your terminal in your project root (`/Users/vicky/Projects/FinHealthSnap`) and execute the release script:

```bash
./scripts/build-docker-release.sh
```

**What this script does automatically:**
1. Generates a folder under `releases/FinHealthSnap_App-<YYYYMMDD>` (with sequential numbering if you run it multiple times a day).
2. Builds an AMD64 Docker image (guaranteeing cross-platform compatibility).
3. Exports the image to `finhealthsnap-release.tar` inside the release folder.
4. Generates the appropriate production `docker-compose.yml` pre-configured to use this specific image.

## Step 2: Package and Send

Inside your new `releases/FinHealthSnap_App-<DATE>` folder, you will find exactly two files:
1. `finhealthsnap-release.tar`
2. `docker-compose.yml`

*(Optional: If you want to provide the user with existing data, simply create a folder named `prisma` next to the `docker-compose.yml` file and place your `dev.db` inside it before zipping!)*

Zip this folder and send it to the user! Provide them with the `SETUP_MAC.md` or `SETUP_WINDOWS.md` guide.
