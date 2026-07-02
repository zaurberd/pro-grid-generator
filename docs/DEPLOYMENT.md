# Deployment Guide

This document describes how the app is deployed to a VPS with Docker, GitHub Actions, Release Please, and how to add a domain with HTTPS.

---

## Overview

- **Trunk branch:** `trunk` (all work is merged here via PRs).
- **Release Please:** Creates a Release PR from conventional commits (`feat:`, `fix:`, `chore:`). When you **merge that Release PR**, a GitHub Release (tag) is created.
- **Deploy:** Runs **only when a release is published** (i.e. after you merge the Release PR). Builds a Docker image, pushes to GitHub Container Registry (GHCR), then SSHs to the VPS and runs the container.
- **No deploy on every push:** Pushing or merging normal PRs into `trunk` does **not** deploy; only merging the Release PR triggers deploy.

---

## 1. GitHub repository setup

### Branch

- Default branch must be **`trunk`** (Settings → General → Default branch).

### Secrets (Settings → Secrets and variables → Actions)

| Secret | Purpose |
|--------|---------|
| **VPS_HOST** | VPS IP or hostname (e.g. `123.45.67.89`). |
| **VPS_USER** | SSH user on the VPS (e.g. `github-runner`). |
| **VPS_SSH_KEY** | **Private** SSH key content (starts with `-----BEGIN ... KEY-----`). The matching **public** key must be in the VPS user's `~/.ssh/authorized_keys`. |
| **GHCR_TOKEN** | Personal Access Token with **read:packages** so the VPS can `docker pull` the image from GHCR. Optional if the GHCR package is public. |
| **RELEASE_PLEASE_TOKEN** | Personal Access Token with **repo** scope so Release Please can create/update the Release PR. |
| **NEXT_PUBLIC_AMPLITUDE_API_KEY** | Amplitude API key baked into the Next.js client bundle during Docker build. Leave unset to disable analytics. |

To use one token for both GHCR and Release Please: create a classic PAT with **repo** and **read:packages**, then add it as both **GHCR_TOKEN** and **RELEASE_PLEASE_TOKEN**.

---

## 2. VPS one-time setup

### 2.1 Install Docker

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 2.2 Create deploy user (e.g. `github-runner`)

```bash
sudo adduser --system --group --shell /bin/bash --home /home/github-runner github-runner
```

### 2.3 SSH access for the deploy user

```bash
sudo mkdir -p /home/github-runner/.ssh
sudo touch /home/github-runner/.ssh/authorized_keys
sudo chmod 700 /home/github-runner/.ssh
sudo chmod 600 /home/github-runner/.ssh/authorized_keys
sudo chown -R github-runner:github-runner /home/github-runner/.ssh
```

Add the **public** key (the one whose private key is in **VPS_SSH_KEY**):

```bash
# Paste the public key into authorized_keys
sudo nano /home/github-runner/.ssh/authorized_keys
```

### 2.4 Allow the user to run Docker without sudo

```bash
sudo usermod -aG docker github-runner
```

Log out and back in (or start a new SSH session) for the group to apply.

### 2.5 Verify

From your local machine (using the same key as in **VPS_SSH_KEY**):

```bash
ssh github-runner@YOUR_VPS_IP
docker ps
exit
```

---

## 3. How to release and deploy

1. **Develop on a branch** (e.g. `dev`), use **conventional commits**: `feat: add X`, `fix: Y`, `chore: Z`. For a breaking change use `feat!:` or `BREAKING CHANGE:` in the body.
2. **Open a PR** into `trunk` and merge it.
3. **Release Please** runs on push to `trunk` and opens or updates a **Release PR** (updates version in `package.json`, CHANGELOG, etc.).
4. **Merge the Release PR** when you want to cut a release. Release Please creates the tag and GitHub Release.
5. **Deploy to VPS** runs automatically on **release published**: it builds the image from the release tag, passes `NEXT_PUBLIC_AMPLITUDE_API_KEY` into `next build`, pushes to GHCR, SSHs to the VPS, pulls the image, and runs the container.

Manual deploy: **Actions → Deploy to VPS → Run workflow**.

---

## 4. Accessing the app

After a successful deploy, the app listens on the VPS on **port 3002**:

```
http://YOUR_VPS_IP:3002
```

There is **no project folder** on the VPS; the app runs inside a Docker container. To inspect:

```bash
docker ps
docker exec -it pro-grid-generator sh
# e.g. ls /app
```

---

## 5. Adding a domain (e.g. pro-grid-generator.online)

### 5.1 DNS

At your domain registrar, add:

- **A record:** name `@` (or `pro-grid-generator.online`), value = **your VPS public IP**.
- **A or CNAME for www:** name `www`, value = same IP or `pro-grid-generator.online`.

Wait until the domain resolves (e.g. `dig pro-grid-generator.online +short` shows your IP).

### 5.2 Nginx and Certbot on the VPS

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

Create the site config:

```bash
sudo nano /etc/nginx/sites-available/pro-grid-generator.online.conf
```

Paste (replace the domain if you use another):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name pro-grid-generator.online www.pro-grid-generator.online;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/pro-grid-generator.online.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Get an HTTPS certificate:

```bash
sudo certbot --nginx -d pro-grid-generator.online -d www.pro-grid-generator.online
```

Follow the prompts (email, agree to terms). Certbot will configure HTTPS and redirect HTTP to HTTPS. Renewal is automatic.

### 5.3 Reference config in the repo

A copy of the Nginx config is in the repo: **`docs/nginx-pro-grid-generator.online.conf`**. You can copy it to the VPS instead of typing it.

---

## 6. Summary

| Step | Where |
|------|--------|
| Repo default branch | `trunk` |
| Secrets | VPS_HOST, VPS_USER, VPS_SSH_KEY, GHCR_TOKEN, RELEASE_PLEASE_TOKEN |
| VPS | Docker, deploy user, SSH key in `authorized_keys`, user in `docker` group |
| Release | Conventional commits → merge to trunk → merge Release PR → tag + GitHub Release |
| Deploy | Automatically on release published; or manually via Actions |
| App URL | `http://VPS_IP:3002` or `https://pro-grid-generator.online` after domain + Nginx + Certbot |
