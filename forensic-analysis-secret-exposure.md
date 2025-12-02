# Forensic Analysis: API Key Exposure Incident

**Project:** Uncooperative  
**Repository:** https://github.com/alistaircroll/Uncooperative  
**Date of Incident:** December 2, 2025  
**Commit:** 6e851e53  
**Affected File:** `src/lib/firebase.js` (line 6)  
**Severity:** Low (Firebase web API keys are public by design, but the process failure is significant)

---

## 1. Executive Summary

A Google/Firebase API key was committed to a public GitHub repository and flagged by GitHub's secret scanning feature. While this specific key (a Firebase web API key) is designed to be public and poses minimal direct risk, the incident reveals a **fundamental process failure** in how code is being pushed to the repository. The current workflow has no safeguards against committing sensitive data, meaning a genuinely dangerous secret (database credentials, service account keys, private API keys) could be exposed in the future.

This document explains exactly what went wrong, why, and the specific changes required to prevent future incidents.

---

## 2. Incident Timeline and Symptoms

### 2.1 What Happened

1. During development, the Firebase configuration was written directly into `src/lib/firebase.js` with hardcoded values, including the `apiKey` field.
2. The developer (or AI coding assistant) ran the `ship` alias command.
3. The command executed: `git add . && git commit -m "Update" && git push`
4. This staged **all files** in the working directory, committed them, and pushed to the public GitHub repository.
5. GitHub's secret scanning detected the API key pattern and generated an alert.

### 2.2 The Alert

GitHub's alert stated:
> "Anyone with read access can view exposed secrets. Consider rotating and revoking each valid secret to avoid any irreversible damage."

This alert appears at: `https://github.com/alistaircroll/Uncooperative/security/secret-scanning`

---

## 3. Root Cause Analysis

The incident has **three contributing causes**, all of which must be addressed:

### 3.1 Primary Cause: No `.gitignore` Protection for Secrets

The project either lacks a `.gitignore` file or has one that does not exclude environment variable files. This means any file containing secrets can be staged and committed.

**Expected state:** A properly configured `.gitignore` should exclude:
- `.env`
- `.env.local`
- `.env.development`
- `.env.production`
- `.env*.local`
- Any file containing credentials

### 3.2 Secondary Cause: Hardcoded Secrets in Source Code

The Firebase configuration was written directly into a JavaScript source file rather than being loaded from environment variables. This is a common pattern when AI coding assistants generate boilerplate code—they often inline configuration values for simplicity.

**The problematic pattern (in `src/lib/firebase.js`):**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",  // ← Hardcoded secret
  authDomain: "project.firebaseapp.com",
  projectId: "project-id",
  // ...
};
```

**The correct pattern:**
```javascript
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
```

**Note on Next.js environment variables:** In Next.js, environment variables that need to be exposed to the browser must be prefixed with `NEXT_PUBLIC_`. Variables without this prefix are only available server-side. Since Firebase client SDK runs in the browser, these variables need the prefix.

Reference: https://nextjs.org/docs/app/building-your-application/configuring/environment-variables

### 3.3 Tertiary Cause: The `ship` Alias is Dangerously Permissive

The current alias:
```bash
alias ship="git add . && git commit -m 'Update' && git push"
```

This command is problematic because:

1. **`git add .` stages everything.** It doesn't discriminate between source code and secrets. Any file in the working directory that isn't explicitly ignored gets staged.

2. **No review step.** The command chains `add`, `commit`, and `push` in a single operation. There's no opportunity to review what's being committed before it's pushed to a public repository.

3. **Generic commit message.** The hardcoded "Update" message provides no traceability and suggests the command is designed for speed over safety.

4. **Immediate push to remote.** Once pushed to a public repository, the secret is in the git history permanently (unless the history is rewritten, which is disruptive).

---

## 4. Why This Matters (Even for "Public" Keys)

While Firebase web API keys are designed to be public (security is enforced by Firebase Security Rules, not key secrecy), this incident matters for three reasons:

### 4.1 Process Failure Indication

If a "safe" secret was exposed, unsafe secrets will be too. The same workflow would expose:
- Firebase Admin SDK service account keys (full database access)
- Stripe secret keys (financial access)
- AWS credentials
- Database connection strings
- JWT signing secrets
- Any third-party API key with elevated permissions

### 4.2 AI-Generated Code Risk

AI coding assistants (including Gemini, Claude, and others) frequently generate code with inline configuration. They optimize for "working code" not "secure code." Without guardrails, every AI-assisted coding session is a potential secret exposure event.

### 4.3 Git History Permanence

Once a secret is pushed to a remote repository, it exists in the git history even if the file is later modified. The only ways to remove it are:
- History rewriting (disruptive, especially with collaborators)
- Repository deletion and recreation
- Assuming compromise and rotating the secret

---

## 5. Required Remediation Steps

### 5.1 Immediate Actions (Do Now)

#### Step 1: Create or Update `.gitignore`

Create a `.gitignore` file in the project root (`/Users/acroll/.gemini/antigravity/scratch/uncooperative/.gitignore`) with the following contents:

```gitignore
# Dependencies
node_modules/

# Environment variables - CRITICAL
.env
.env.local
.env.development
.env.development.local
.env.test
.env.test.local
.env.production
.env.production.local

# Next.js
.next/
out/

# Debug logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Vercel
.vercel

# TypeScript
*.tsbuildinfo

# OS files
.DS_Store
Thumbs.db

# IDE
.idea/
.vscode/
*.swp
*.swo

# Secrets (belt and suspenders)
*.pem
*.key
secrets/
credentials/
```

Reference: https://github.com/github/gitignore/blob/main/Node.gitignore

#### Step 2: Create Environment Variable Files

Create a `.env.local` file for local development:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Add any other secrets here
```

**Verify it's ignored:** After creating the file, run:
```bash
git status
```

The `.env.local` file should NOT appear in the list of untracked files if `.gitignore` is working.

#### Step 3: Refactor `src/lib/firebase.js`

Update the file to use environment variables:

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate that required env vars are present
if (!firebaseConfig.apiKey) {
  throw new Error('Missing NEXT_PUBLIC_FIREBASE_API_KEY environment variable');
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
```

#### Step 4: Configure Vercel Environment Variables

Since Vercel is your production host, you must add these environment variables there:

1. Go to https://vercel.com/dashboard
2. Select your project
3. Navigate to Settings → Environment Variables
4. Add each `NEXT_PUBLIC_FIREBASE_*` variable
5. Set them for Production, Preview, and Development environments as needed

Reference: https://vercel.com/docs/projects/environment-variables

#### Step 5: Create an Environment Variable Template

Create a file called `.env.example` (this file IS committed to git) to document required variables:

```bash
# Copy this file to .env.local and fill in values
# DO NOT commit .env.local to git

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

---

### 5.2 Process Changes (Do Before Next Push)

#### Step 6: Replace the `ship` Alias

Edit your `~/.zshrc` file and replace the dangerous alias with a safer version:

**Option A: Two-step process with review**
```bash
alias stage="git add -p"  # Interactive staging
alias ship="git status && echo '\n--- Review above. Press Enter to commit and push, Ctrl+C to cancel ---' && read && git commit && git push"
```

**Option B: Single command with safety checks**
```bash
ship() {
  # Check for .env files that might be staged
  if git diff --cached --name-only | grep -E '\.env'; then
    echo "ERROR: .env file detected in staged changes. Aborting."
    return 1
  fi
  
  # Show what will be committed
  echo "=== Files to be committed ==="
  git status --short
  echo ""
  
  # Prompt for confirmation
  read "response?Commit and push these changes? (y/n) "
  if [[ "$response" =~ ^[Yy]$ ]]; then
    read "msg?Commit message: "
    git add . && git commit -m "$msg" && git push
  else
    echo "Aborted."
  fi
}
```

**Option C: Minimal change—just add a review step**
```bash
alias ship="git status && git diff --cached --stat && echo '---' && read -p 'Push? (y/n) ' confirm && [[ \$confirm == 'y' ]] && git add . && git commit -m 'Update' && git push"
```

After editing `~/.zshrc`, reload it:
```bash
source ~/.zshrc
```

#### Step 7: Install a Pre-Commit Hook for Secret Detection

Use `git-secrets` or `gitleaks` to scan for secrets before every commit.

**Using gitleaks (recommended):**

```bash
# Install gitleaks
brew install gitleaks

# Create pre-commit hook
cat > /Users/acroll/.gemini/antigravity/scratch/uncooperative/.git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "Scanning for secrets..."
gitleaks protect --staged --verbose
if [ $? -ne 0 ]; then
  echo "ERROR: Secrets detected. Commit aborted."
  exit 1
fi
EOF

chmod +x /Users/acroll/.gemini/antigravity/scratch/uncooperative/.git/hooks/pre-commit
```

Reference: https://github.com/gitleaks/gitleaks

**Using git-secrets (AWS-focused but extensible):**

```bash
brew install git-secrets
cd /Users/acroll/.gemini/antigravity/scratch/uncooperative
git secrets --install
git secrets --register-aws  # Adds AWS patterns
# Add custom patterns for Firebase/Google keys:
git secrets --add 'AIza[0-9A-Za-z\-_]{35}'
```

Reference: https://github.com/awslabs/git-secrets

---

### 5.3 AI Coding Assistant Instructions

Include the following instructions in any prompt or system context when using AI coding assistants:

---

**CRITICAL SECURITY REQUIREMENTS FOR CODE GENERATION:**

1. **Never hardcode secrets, API keys, or credentials in source files.** Always use environment variables.

2. **For Next.js projects:** Use `process.env.NEXT_PUBLIC_*` for client-side variables and `process.env.*` for server-side only.

3. **When generating Firebase configuration:** Always structure it as:
   ```javascript
   const firebaseConfig = {
     apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
     // ... other fields from env vars
   };
   ```

4. **When creating new files that might contain secrets:** Remind the developer to:
   - Add the file pattern to `.gitignore`
   - Create a `.example` template file
   - Configure the production environment (Vercel, etc.)

5. **Never include actual key values in code suggestions.** Use placeholder text like `YOUR_API_KEY_HERE` or environment variable references.

---

### 5.4 Optional: Clean Git History

If you want to remove the exposed key from git history (not strictly necessary since it's a Firebase web key, but good practice):

**Using BFG Repo-Cleaner:**

```bash
# Install BFG
brew install bfg

# Clone a fresh copy
cd /tmp
git clone --mirror https://github.com/alistaircroll/Uncooperative.git

# Create a file with the secret to remove
echo "AIzaSy..." > secrets.txt  # Replace with actual key

# Run BFG
bfg --replace-text secrets.txt Uncooperative.git

# Clean up and push
cd Uncooperative.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

Reference: https://rtyley.github.io/bfg-repo-cleaner/

**Warning:** Force-pushing rewrites history. If anyone else has cloned the repo, they'll need to re-clone.

---

## 6. Verification Checklist

After completing remediation, verify each item:

- [ ] `.gitignore` exists and includes `.env*` patterns
- [ ] `.env.local` exists with actual values and does NOT appear in `git status`
- [ ] `.env.example` exists with empty placeholders and IS tracked by git
- [ ] `src/lib/firebase.js` uses `process.env.NEXT_PUBLIC_*` variables
- [ ] Local development works (`npm run dev` loads Firebase correctly)
- [ ] Vercel environment variables are configured
- [ ] Vercel deployment works
- [ ] Pre-commit hook is installed and blocks secrets
- [ ] `ship` alias has been replaced with a safer version
- [ ] Running `ship` shows a review step before pushing

---

## 7. References and Further Reading

- **GitHub Secret Scanning:** https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning
- **Next.js Environment Variables:** https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
- **Vercel Environment Variables:** https://vercel.com/docs/projects/environment-variables
- **Firebase Web Setup:** https://firebase.google.com/docs/web/setup
- **gitleaks (Secret Scanner):** https://github.com/gitleaks/gitleaks
- **git-secrets (AWS):** https://github.com/awslabs/git-secrets
- **BFG Repo-Cleaner:** https://rtyley.github.io/bfg-repo-cleaner/
- **Node.gitignore Template:** https://github.com/github/gitignore/blob/main/Node.gitignore
- **12-Factor App (Config):** https://12factor.net/config

---

## 8. Summary of Key Changes Required

| What | Current State | Required State |
|------|---------------|----------------|
| `.gitignore` | Missing or incomplete | Must exclude `.env*` files |
| Firebase config | Hardcoded in source | Loaded from `process.env` |
| Environment variables | None | `.env.local` for dev, Vercel for prod |
| `ship` alias | `git add . && commit && push` | Must include review step |
| Pre-commit hook | None | gitleaks or git-secrets installed |
| AI assistant instructions | None | Explicit "no hardcoded secrets" rule |

---

**Document prepared for:** Gemini AI Coding Assistant  
**Prepared by:** Claude (Anthropic)  
**Date:** December 2, 2025
