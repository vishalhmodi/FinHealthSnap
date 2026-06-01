# Automation Scripts

This folder contains helper scripts to automate manual tasks and standardize processes for the FinHealthSnap project. 

As new scripts are added, they should be documented in this file so that you always know which command to run and when.

---

## `build-docker-release.sh`

**Purpose**: Automates the entire process of building and exporting a production Docker image for distribution.

**What it does**:
1. Creates a release directory inside `releases/` (e.g., `releases/FinHealthSnap_App-YYYYMMDD`).
2. If multiple releases are created on the same day, it automatically appends a sequence number (e.g., `-01`, `-02`).
3. Tags the docker image identically to the folder suffix.
4. Builds the production image specifically for `linux/amd64` architecture (ensuring cross-platform compatibility).
5. Exports the compiled image as a `.tar` file into the release folder.
6. Automatically generates a matching `docker-compose.yml` file pointing to that exact image tag.

**How to run**:
From the root of the project (or inside the scripts folder), run:
```bash
./scripts/build-docker-release.sh
```

**Output**:
A fully prepared release folder under `releases/` that you can immediately zip and distribute to end-users.
