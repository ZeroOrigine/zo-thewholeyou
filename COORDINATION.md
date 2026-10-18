# COORDINATION

Newest first. One entry per session that changed the product.

## 2026-10-18  Adoption into ZeroOrigine (Cowork session)

- Game "The Whole You" (by Advik) adopted as slug `thewholeyou`. Live at https://thewholeyou.zeroorigine.com (Netlify dc3d6abb-caf7-4770-b860-9bda2a5f2b4a, repo main:/docs).
- Data: `thewholeyou_completions` (append-only, RLS, zero policies). Edge Function `thewholeyou-api` v2 (verify_jwt false). Cron `thewholeyou_night` 03:00 UTC, returns skipped.
- Registry: zo_projects launched, zo_products live, core action declared measurable=false (child-directed, no identifiers).
- Drills: 13 ok, 0 fail, 0 unknown, 6 n/a. Full report in notes/ADOPTION-2026-10-18.md.
- Open founder actions: delete consumed `zo_adoption_grant` in the SQL editor; first human play.
- Game source of truth stays the founder's claude.ai artifact XPgCoLRyfoQNSFzuuiizU7. docs/index.html is that file plus head, footer, privacy link, beacon and the /complete call. Re-sync by re-running the site patch, not by hand edits.
