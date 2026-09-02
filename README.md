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

| Area | Old module | Spec | Done |
| --- | --- | --- | --- |
| Auth / login / logout | `auth_registration_tests.py` | `auth.spec.ts` | scaffold |
| Footer navigation | part of `browse_search_tests.py` | `footer-nav.spec.ts` | 6/7 |
| Registration | `misc_tests.py` | `registration.spec.ts` | — |
| Topics | `topic_tests.py` | `topic.spec.ts` | — |
| Camps | `camp_tests.py` | `camp.spec.ts` | — |
| Statements | `statement_tests.py` | `statement.spec.ts` | — |
| Forum & News | `forum_news_tests.py` | `forum-news.spec.ts` | — |
| Browse & Search | `browse_search_tests.py` | `browse-search.spec.ts` | — |
| Profile & Upload | `profile_upload_access_tests.py` | `profile-upload.spec.ts` | — |
| Backlog (xfail) | `backlog_tests.py` | `backlog.spec.ts` (`test.fixme`) | — |

Cases that could not be confirmed against ux-dev during the port are marked
`test.fixme(...)` with a note, so the count stays at parity while the selector
or flow is sorted out.

## CI

[`.github/workflows/e2e.yml`](.github/workflows/e2e.yml) — 4-way sharded matrix
on push / PR. Set repo **secrets** `CANONIZER_USERNAME`, `CANONIZER_PASSWORD`
and **variable** `CANONIZER_BASE_URL`.
