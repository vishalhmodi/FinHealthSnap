# Git Workflow Helper

This guide contains the exact commands required to contribute to this repository following our Pull Request (PR) based workflow. 

**Rule:** Do not push code directly to the `main` branch. Always create a new branch and open a PR.

---

## 1. Create a New Branch
Before making any changes to the code, create a new branch and switch to it. Replace `feature/my-new-update` with a descriptive name for your change:
```bash
git checkout -b feature/my-new-update
```

## 2. Stage Your Changes
Once you have modified your files and are ready to save them, stage all the changed files:
```bash
git add .
```

## 3. Commit Your Changes
Save your changes locally with a descriptive message explaining what you did:
```bash
git commit -m "Added a new feature or fixed a bug"
```

## 4. Push Your Branch to GitHub
Push your local branch up to the remote GitHub repository. Make sure the branch name matches the one you created in step 1:
```bash
git push -u origin feature/my-new-update
```

## 5. Create a Pull Request (PR)
Finally, create a Pull Request so your changes can be reviewed and merged into `main`.

### Option A: Fully from the Terminal
If you know what you want to write for the title and description, you can create the PR directly:
```bash
gh pr create --title "Brief summary of changes" --body "Detailed explanation of what this PR does."
```

### Option B: Using the Web Browser (Recommended)
If you prefer a visual interface to fill out your PR details, run this command to automatically open GitHub in your web browser:
```bash
gh pr create --web
```
