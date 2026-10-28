# Running this at dev.sevandalzell.com

The old site keeps serving `sevandalzell.com` the whole time. This new site
gets its own repo and its own subdomain until you're happy with it.

## 1. Try it locally first

```bash
npm install
npm run dev
```

Open http://localhost:4321.

## 2. Make a new GitHub repo

1. On github.com: **+ → New repository**, name it e.g. `sevandalzell-site`,
   **Public** (free GitHub Pages needs a public repo). Don't add a README.
2. In this folder:

```bash
git init
git add .
git commit -m "New Astro site"
git branch -M main
git remote add origin https://github.com/oqid/sevandalzell-site.git
git push -u origin main
```

This repo starts with a clean history, so none of the old site's deleted
files or old CV versions come with it.

## 3. Set the repo up for Pages

In the new repo on github.com:

1. **Settings → Pages → Build and deployment → Source:** choose
   **GitHub Actions**.
2. **Settings → Secrets and variables → Actions → Variables tab → New
   repository variable**, twice:
   - `SITE_URL` = `https://dev.sevandalzell.com`
   - `DEPLOY_ENV` = `dev`
3. **Actions tab → Deploy to GitHub Pages → Run workflow** (or push any
   commit). Wait for the green tick.
4. **Settings → Pages → Custom domain:** enter `dev.sevandalzell.com` and
   save.

## 4. Point the subdomain at it (Porkbun)

porkbun.com → your domain → **DNS**, add one record:

| Type  | Host | Answer          |
|-------|------|-----------------|
| CNAME | dev  | oqid.github.io  |

Leave the existing records (the four `A` records and `www`) alone; they're
what keeps the old site running.

Within a few minutes to an hour, GitHub's Pages settings will show the DNS
check passing. Tick **Enforce HTTPS**, and https://dev.sevandalzell.com
shows the new site.

## 5. Switching over when it's ready

1. **Old repo** (`oqid/sevandalzell.com`): Settings → Pages → remove the
   custom domain, then set Source to **None** to stop publishing it.
2. **New repo:** change the `SITE_URL` variable to `https://sevandalzell.com`
   and **delete** `DEPLOY_ENV`. Set Settings → Pages → Custom domain to
   `sevandalzell.com`. Re-run the workflow.
3. Porkbun DNS needs no changes: the `A` records and the `www` record point
   at GitHub, and GitHub routes `sevandalzell.com` to whichever repo claims it.
   You can delete the `dev` record, or keep it for future test copies.
4. Once the new site is live, make the old repo **private** (Settings →
   General → Danger Zone → Change visibility). That takes its history,
   including old CV versions and deleted files, off public view.

Expect a few minutes of the site being unavailable between steps 1 and 2.
