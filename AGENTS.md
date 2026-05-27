<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Git Workflow Rules
**CRITICAL RULE:** For any future changes or feature implementations, you MUST NOT push code directly to the `main` branch. 
Instead, you must:
1. Create a new branch with a descriptive name (e.g., `git checkout -b feature/your-feature-name`).
2. Make your commits on that branch.
3. Push the branch to the remote repository.
4. Create a Pull Request (PR) via the GitHub CLI (`gh pr create`) so the changes can be reviewed before merging into `main`.
