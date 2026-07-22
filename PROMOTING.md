# CMS Upstream Workflow

This repo (`snaptart/cms`) is the **upstream core** for all sites built on this
CMS. Sites are separate repos that carry this repo as a git remote named
`upstream`:

- `snaptart/snaptartPhotos` → snaptart.com
- `snaptart/gardensalacarte` → gardensalacarte.com

## What lives where

| CMS repo (here) | Site repos |
|---|---|
| Admin dashboard, APIs, Puck blocks, components | Content and DB data (each site has its own Neon DB) |
| Drizzle schema and migrations | `.env.local` (DB, Blob, auth secrets) |
| `src/lib/site.config.defaults.ts` | `src/lib/site.config.ts` overrides |
| Generic features and fixes | Site-specific design/branding commits |

## The `site.config` contract

- `site.config.defaults.ts` is **upstream-owned**. New config fields are added
  here with safe defaults. Sites never edit it.
- `site.config.ts` is **site-owned**. Upstream shipped it once as a stub and
  must never touch it again. Sites put branding/terminology/feature overrides
  in the `defineSiteConfig({...})` call.

This split is what keeps `git merge upstream/main` conflict-free.

## Developing a CMS feature

Features are usually built in the context of a real site (you need real
content to see them). The flow:

1. Build the feature on a branch in a site repo.
2. When it works and is generic (no hardcoded branding, config via
   `site.config.defaults.ts`), promote it upstream:
   ```
   # in a clone of this repo
   git remote add sitedev C:\path\to\site-repo   # once
   git fetch sitedev
   git cherry-pick <commit>...                   # the generic commits only
   git push origin main
   ```
3. Site-specific polish stays behind in the site repo.

## Pulling CMS updates into a site

```
# in the site repo
git fetch upstream
git merge upstream/main
npm install            # if dependencies changed
npm run db:push        # if the schema changed — each site has its own DB
```

**Schema changes propagate manually**: merging updates the schema *code*, but
each site must run `npm run db:push` against its own database. Commits that
change `src/lib/db/schema.ts` should say so in the commit message.
