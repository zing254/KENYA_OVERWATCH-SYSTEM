# Git Multi-Account Setup for Kenya Overwatch

## WARNING: Security Notice

The tokens you shared have been exposed publicly. **Immediately revoke them** and generate new ones:
1. Go to GitHub Settings → Developer Settings → Personal access tokens
2. Revoke the compromised tokens
3. Generate new tokens

## Setting Up Multiple Git Accounts

### Option 1: Git Config (Recommended)

Create a file `~/.gitconfig-multi`:

```ini
[user]
    name = Your Name
    email = your-email@example.com

[includeIf "gitdir:~/Desktop/HACKATHON/kenya-overwatch-production/"]
    path = ~/.gitconfig-zing254
```

Create `~/.gitconfig-zing254`:

```ini
[user]
    name = Your Name
    email = zing254@users.noreply.github.com
```

### Option 2: Per-Repository Configuration

```bash
cd kenya-overwatch-production

# Set your identity for this repo only
git config user.name "Your Name"
git config user.email "zing254@users.noreply.github.com"

# Verify
git config --list --local
```

## Team Workflow Setup

### Account 1 (zing254)
```bash
git config user.name "Your Name"
git config user.email "zing254@users.noreply.github.com"
git config user.token "ghp_xxxxxxxxxxxxxxxxxxxx"
```

### Account 2 (Teammate)
```bash
git config user.name "Teammate Name"
git config user.email "nathanielkings705@users.noreply.github.com"
git config user.token "ghp_xxxxxxxxxxxxxxxxxxxx"
```

## Switching Accounts

```bash
# Check current config
git config user.email

# Switch account
git config user.email "other-email@users.noreply.github.com"
```

## Authentication

Instead of passwords, use Personal Access Tokens (PAT):

```bash
# Clone with token authentication
git clone https://ghp_xxxxxxxxxxxxxxxxxxxx@github.com/username/repo.git
```

Or use GitHub CLI:
```bash
gh auth login
```
