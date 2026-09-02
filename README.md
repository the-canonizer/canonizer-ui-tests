# canonizer-ui-tests

End-to-end UI tests for Canonizer, built with **Playwright + TypeScript**.

Replacement for the Selenium/pytest suite in `Canonizer_UX-UI_Automated_TestCase`.
Goal: 1:1 parity with the ~263 cases there, but fast — log in once, run in
parallel, auto-wait instead of hand-tuned `implicitly_wait`.

## Requirements

- Node.js (version in [`.nvmrc`](.nvmrc)). This machine uses `nvm`:
  ```sh
  export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
  nvm use
  ```

## Setup

```sh
npm ci
npx playwright install chromium
cp .env.example .env      # then fill in credentials
```

`.env`:

| Var | Meaning |
| --- | --- |
| `CANONIZER_BASE_URL` | Target environment, e.g. `https://ux-dev.canonizer.com` |
| `CANONIZER_USERNAME` | Login email for the shared test account |
| `CANONIZER_PASSWORD` | Password |

## Run

```sh
npm test                       # all tests, headless, parallel
npm run test:headed            # watch the browser
npm run test:ui                # Playwright UI mode (watch + time-travel)
npx playwright test auth       # one file
npx playwright test -g "footer" # by title
npm run report                 # open the last HTML report
```

## How it works

- **`tests/auth.setup.ts`** runs first (the `setup` project). It logs in through
  the UI once and writes the session to `.auth/user.json`.
- Every other project loads that via `storageState`, so no spec logs in again.
- **`pages/`** — page objects: locators + actions only, no assertions.
- **`fixtures/test.ts`** — extends the base `test` with one page object per area;
  `import { test, expect } from '../fixtures/test'` in every spec.
- **`tests/`** — specs split by feature area, mirroring the old suite's modules.
- Config in [`playwright.config.ts`](playwright.config.ts): base URL from `.env`,
  `fullyParallel`, retries + trace only in CI, screenshots/video on failure.

## Porting status

| Area | Old module | Spec | Pass | `test.fixme` |
| --- | --- | --- | --- | --- |
| Auth / login / logout | `auth_registration_tests.py` | `auth.spec.ts` | 17 | 7 |
| Registration | `misc_tests.py` | `registration.spec.ts` | 13 | 3 |
| Topics | `topic_tests.py` | `topic.spec.ts` | 25 | 15 |
| Camps | `camp_tests.py` | `camp.spec.ts` | 15 | 19 |
| Statements | `statement_tests.py` | `statement.spec.ts` | 9 | 12 |
| Forum & News | `forum_news_tests.py` | `forum-news.spec.ts` | 19 | 15 |
| Browse & Search | `browse_search_tests.py` | `browse-search.spec.ts` | 40 | 7 |
| Profile & Upload | `profile_upload_access_tests.py` | `profile-upload.spec.ts` | 26 | 23 |
| Backlog (xfail) | `backlog_tests.py` | `backlog.spec.ts` | 0 | 7 |

Cases that could not be confirmed against ux-dev during the port are marked
`test.fixme(...)` with a note, so the count stays at parity while the selector
or flow is sorted out. Common `fixme` reasons: a feature was removed in the
UI redesign (topic/camp preview modals, footer Jobs/Sitemap), a flow needs a
seeded multi-version fixture (compare pages), a deep edit page still needs a
live-DOM pass (thread/news/statement edit), or the old assertion pinned stale
data / another account.

### Running the create-heavy specs

`statement.spec.ts` and `forum-news.spec.ts` (and the create half of
`camp.spec.ts`) each chain topic → camp → statement/thread. ux-dev throttles
under parallel entity creation, so run them at low concurrency:

```sh
npx playwright test statement forum-news --workers=2
```

They carry `retries: 1`; bump to `--retries=2` on a slow day.

## CI

[`.github/workflows/e2e.yml`](.github/workflows/e2e.yml) — 4-way sharded matrix
on push / PR. Set repo **secrets** `CANONIZER_USERNAME`, `CANONIZER_PASSWORD`
and **variable** `CANONIZER_BASE_URL`.
