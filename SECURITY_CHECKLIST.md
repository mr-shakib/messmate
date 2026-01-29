# Security Checklist - Prevent Secret Leaks

## ✅ .gitignore Files Updated

I've updated all `.gitignore` files to protect your secrets:

- ✅ Root `.gitignore` (new)
- ✅ `backend/.gitignore` (enhanced)
- ✅ `frontend/.gitignore` (enhanced)

## 🔒 What's Protected

### Environment Variables (CRITICAL)
```
✅ .env
✅ .env.local
✅ .env.development
✅ .env.production
✅ .env.test
✅ .env.*.local
```

**Allowed** (example files only):
```
✅ .env.example
✅ .env.production.example
```

### Secrets and Keys
```
✅ *.pem
✅ *.key
✅ *.cert
✅ *.crt
✅ *.p12
✅ *.pfx
✅ secrets/
✅ private/
✅ credentials/
```

### Vercel Files
```
✅ .vercel/
✅ .vercel.json.backup
```

### Build Outputs
```
✅ dist/
✅ build/
✅ node_modules/
```

### Logs and Temporary Files
```
✅ *.log
✅ logs/
✅ *.tmp
✅ *.temp
✅ .cache/
```

## 🚨 Before You Commit - Checklist

### Every Time Before `git add`:

- [ ] Check for `.env` files
- [ ] Check for API keys in code
- [ ] Check for passwords in code
- [ ] Check for MongoDB URIs in code
- [ ] Check for JWT secrets in code
- [ ] Review `git status` output
- [ ] Use `git diff` to review changes

### Commands to Run:

```bash
# 1. Check what will be committed
git status

# 2. Review actual changes
git diff

# 3. Search for potential secrets (run these before commit)
git grep -i "password"
git grep -i "secret"
git grep -i "api_key"
git grep -i "mongodb://"
git grep -i "jwt"
```

## 🔍 Verify No Secrets in Git

### Check Current Repository

Run this command to search for potential secrets:

```bash
# Search for common secret patterns
git grep -E "(password|secret|api_key|mongodb://|JWT_|MONGO)" -- ':!*.md' ':!*.example'
```

If this returns results in actual code files (not .md or .example files), review them!

### Check Git History

```bash
# Check if .env was ever committed
git log --all --full-history -- "**/.env"

# Check if secrets were committed
git log --all --full-history -S "mongodb+srv://"
```

If you find secrets in history, see "Emergency: Secrets Already Committed" below.

## 📝 Safe Files to Commit

### ✅ These are SAFE to commit:

```
✅ .env.example
✅ .env.production.example
✅ backend/.env.example
✅ frontend/.env.example
✅ README.md
✅ Documentation files (*.md)
✅ Source code (*.ts, *.tsx, *.js, *.jsx)
✅ Configuration files (tsconfig.json, package.json)
✅ .gitignore files
```

### ❌ These should NEVER be committed:

```
❌ .env
❌ .env.local
❌ .env.production (with real values)
❌ Any file with actual passwords
❌ Any file with actual API keys
❌ Any file with actual MongoDB URIs
❌ Any file with actual JWT secrets
❌ node_modules/
❌ dist/
❌ .vercel/
```

## 🛡️ Environment Variable Best Practices

### 1. Use Example Files

**Good** - `.env.example`:
```bash
# MongoDB Connection
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>

# JWT Secrets
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-secret-here
```

**Bad** - `.env` (never commit):
```bash
MONGODB_URI=mongodb+srv://<actual-user>:<actual-password>@<actual-cluster>.mongodb.net/messmate
JWT_ACCESS_SECRET=<actual-secret-key>
```

### 2. Never Hardcode Secrets

**Bad** ❌:
```typescript
const mongoUri = "mongodb+srv://<user>:<password>@<cluster>.mongodb.net/messmate";
const jwtSecret = "<hardcoded-secret>";
```

**Good** ✅:
```typescript
const mongoUri = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_ACCESS_SECRET;
```

### 3. Use Environment Variables Everywhere

**Backend** (`backend/src/config/env.ts`):
```typescript
export const env = {
  mongoUri: process.env.MONGODB_URI || '',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || '',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || '',
};
```

**Frontend** (`frontend/src/services/api.ts`):
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

## 🚨 Emergency: Secrets Already Committed

If you accidentally committed secrets to Git:

### Option 1: Remove from Latest Commit (if not pushed)

```bash
# Remove the file from Git but keep it locally
git rm --cached .env

# Amend the commit
git commit --amend -m "Remove .env file"
```

### Option 2: Remove from History (if already pushed)

**WARNING**: This rewrites history. Coordinate with your team!

```bash
# Install BFG Repo-Cleaner
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Remove .env from entire history
bfg --delete-files .env

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (WARNING: Destructive!)
git push --force
```

### Option 3: Rotate All Secrets (REQUIRED if pushed to public repo)

If secrets were pushed to a public repository:

1. **Immediately rotate all secrets**:
   - [ ] Generate new JWT secrets
   - [ ] Change MongoDB password
   - [ ] Update all API keys
   - [ ] Update all passwords

2. **Update Vercel environment variables**:
   - [ ] Update backend env vars
   - [ ] Update frontend env vars
   - [ ] Redeploy both projects

3. **Clean Git history** (use Option 2 above)

## 🔐 Additional Security Measures

### 1. Enable Git Hooks (Pre-commit Check)

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash

# Check for .env files
if git diff --cached --name-only | grep -E "\.env$"; then
    echo "❌ ERROR: Attempting to commit .env file!"
    echo "Please remove .env from staging area:"
    echo "  git reset HEAD .env"
    exit 1
fi

# Check for potential secrets in code
if git diff --cached | grep -E "(mongodb\+srv://.*:.*@|JWT_.*SECRET.*=.*[a-zA-Z0-9]{20})"; then
    echo "⚠️  WARNING: Potential secret detected in code!"
    echo "Please review your changes carefully."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "✅ Pre-commit checks passed"
```

Make it executable:
```bash
chmod +x .git/hooks/pre-commit
```

### 2. Use git-secrets (Recommended)

Install git-secrets to prevent committing secrets:

```bash
# Install git-secrets
# Mac: brew install git-secrets
# Windows: Download from GitHub

# Set up in your repo
git secrets --install
git secrets --register-aws

# Add custom patterns
git secrets --add 'mongodb\+srv://[^:]+:[^@]+@'
git secrets --add 'JWT_[A-Z_]+_SECRET.*=.*[a-zA-Z0-9]{20,}'
```

### 3. Enable GitHub Secret Scanning

If using GitHub:
1. Go to repository Settings
2. Security & analysis
3. Enable "Secret scanning"
4. Enable "Push protection"

### 4. Use .env.vault (Optional)

For team environments, consider using dotenv-vault:

```bash
npm install dotenv-vault
npx dotenv-vault new
```

## 📋 Pre-Deployment Security Checklist

Before deploying to Vercel:

- [ ] All `.gitignore` files are updated
- [ ] No `.env` files in Git
- [ ] No secrets in code
- [ ] All secrets in Vercel environment variables
- [ ] `.env.example` files are up to date
- [ ] Git history is clean (no secrets)
- [ ] Pre-commit hooks installed (optional)
- [ ] Team members aware of security practices

## 🔍 Regular Security Audits

### Weekly:
- [ ] Review recent commits for secrets
- [ ] Check Vercel environment variables
- [ ] Verify `.gitignore` is working

### Monthly:
- [ ] Rotate JWT secrets
- [ ] Review MongoDB access logs
- [ ] Update dependencies (`npm audit`)
- [ ] Check for exposed secrets on GitHub

### After Team Changes:
- [ ] Review new team member commits
- [ ] Ensure everyone has `.gitignore` set up
- [ ] Share security best practices

## 📚 Resources

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [git-secrets](https://github.com/awslabs/git-secrets)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

## ✅ Current Status

After running this security update:

- ✅ Root `.gitignore` created
- ✅ Backend `.gitignore` enhanced
- ✅ Frontend `.gitignore` enhanced
- ✅ All environment files protected
- ✅ All secret patterns excluded
- ✅ Vercel files excluded
- ✅ Build outputs excluded

**Your repository is now protected!** 🛡️

## 🚀 Next Steps

1. **Verify protection**:
   ```bash
   # Try to add .env (should be ignored)
   touch .env
   git status  # Should not show .env
   ```

2. **Commit the .gitignore updates**:
   ```bash
   git add .gitignore backend/.gitignore frontend/.gitignore
   git commit -m "Security: Update .gitignore to prevent secret leaks"
   git push
   ```

3. **Review existing commits** (if any):
   ```bash
   git log --all --full-history -- "**/.env"
   ```

4. **Set up pre-commit hooks** (optional but recommended)

5. **Deploy to Vercel** with confidence! 🎉

---

**Remember**: Secrets in environment variables (Vercel Dashboard) are safe. Secrets in Git are NOT safe!
