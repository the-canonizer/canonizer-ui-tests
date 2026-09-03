# canonizer-ui-tests

End-to-end UI tests for **Canonizer**, built with **Playwright + TypeScript**.

This is the replacement for the Selenium/pytest suite in
`Canonizer_UX-UI_Automated_TestCase`. It aims for 1:1 case parity (~270 tests)
but runs in minutes instead of hours: it logs in **once**, runs **in parallel**,
and relies on Playwright's **auto-waiting** instead of hand-tuned
`implicitly_wait` calls.

---

## Table of contents

1. [Quick start](#1-quick-start)
2. [Prerequisites](#2-prerequisites)
3. [Installation](#3-installation)
4. [Configuration](#4-configuration)
5. [Running tests](#5-running-tests)
6. [How it works (architecture)](#6-how-it-works-architecture)
7. [Project structure](#7-project-structure)
8. [The create-heavy specs](#8-the-create-heavy-specs)
9. [Debugging failures](#9-debugging-failures)
10. [Writing / adding tests](#10-writing--adding-tests)
11. [Porting status](#11-porting-status)
12. [Continuous integration](#12-continuous-integration)
13. [Other browsers](#13-other-browsers)
14. [Troubleshooting](#14-troubleshooting)
15. [Differences from the Selenium suite](#15-differences-from-the-selenium-suite)

---

## 1. Quick start

```bash
# one-time
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"   # load nvm
nvm install                                          # installs the Node in .nvmrc
npm ci                                               # install deps
npx playwright install chromium                      # download the browser
cp .env.example .env && $EDITOR .env                 # add test-account credentials

# run
npm test                                             # whole suite, headless, parallel
npm run report                                       # open the HTML report
```

If a run is flaky because the target environment is slow, drop concurrency:

```bash
npx playwright test --workers=2
```

---

## 2. Prerequisites

| Requirement | Notes |
| --- | --- |
| **Node.js** | Version is pinned in [`.nvmrc`](.nvmrc) (`lts/*`). This machine uses **nvm** — see below. |
| **A Canonizer test account** | Email + password with normal user rights on the target environment. Used once per run to create the shared session. |
| **Network access** to the target environment | Default `https://ux-dev.canonizer.com`. |

### Installing Node with nvm

`nvm` is not on the `PATH` by default here. In every new shell:

```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
```

(Add that line to `~/.zshrc` to make it automatic.) Then:

```bash
nvm install      # reads .nvmrc, installs + selects that Node
nvm use          # in later shells, just select it
node --version   # sanity check
```

---

## 3. Installation

```bash
npm ci                            # exact deps from package-lock.json
npx playwright install chromium   # ~150 MB browser download, cached in ~/Library/Caches/ms-playwright
```

`npm install` also works; `npm ci` is preferred for a clean, lockfile-exact tree.

### npm scripts

| Script | What it does |
| --- | --- |
| `npm test` | `playwright test` — whole suite |
| `npm run test:light` | everything **except** the `@create` groups — full parallel, safe on a slow environment |
| `npm run test:create` | only the `@create` groups (topic→camp→statement / thread / news chains) — `--workers=1 --retries=2` |
| `npm run test:headed` | whole suite, visible browser |
| `npm run test:ui` | Playwright **UI mode** — watch mode + time-travel debugger |
| `npm run test:chromium` | only the `chromium` project |
| `npm run report` | open the last HTML report |
| `npm run codegen` | `playwright codegen $CANONIZER_BASE_URL` — record a new test by clicking |
| `npm run trace` | `playwright show-trace` — open a saved `trace.zip` |

> **On a loaded/slow environment**, run `npm run test:light` then `npm run test:create`
> instead of `npm test`. The `@create` groups each POST a topic + camp + statement
> in sequence; ux-dev frequently can't sustain several of those in parallel and the
> creates time out. Serialising them (one worker, extra retries) is the reliable
> path. CI's 4-way shard already keeps per-shard concurrency low.

---

## 4. Configuration

All configuration is environment variables, loaded from a git-ignored **`.env`**
file at the repo root (via `dotenv` in [`playwright.config.ts`](playwright.config.ts)).

```bash
cp .env.example .env
```

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `CANONIZER_BASE_URL` | no | `https://ux-dev.canonizer.com` | Target environment. Becomes Playwright's `baseURL`, so specs use relative paths (`page.goto('/browse')`). |
| `CANONIZER_USERNAME` | **yes** | — | Test-account email. Used by `tests/auth.setup.ts` to create the shared session. |
| `CANONIZER_PASSWORD` | **yes** | — | Test-account password. |

`.env` is in [`.gitignore`](.gitignore) and must never be committed. In CI the
same three values come from repo secrets/variables (see
[Continuous integration](#12-continuous-integration)).

### Config knobs (in `playwright.config.ts`)

| Setting | Value | Why |
| --- | --- | --- |
| `testDir` | `./tests` | |
| `fullyParallel` | `true` | Every test file's tests run in parallel across workers. |
| `retries` | `0` local, `2` in CI (`process.env.CI`) | The target env can be slow under load. |
| `workers` | auto local, `4` in CI | |
| `timeout` | `60_000` | Per-test cap. Creation flows are slow. |
| `expect.timeout` | `15_000` | Per-assertion cap. |
| `use.trace` | `on-first-retry` | Trace only when something failed once. |
| `use.screenshot` | `only-on-failure` | |
| `use.video` | `retain-on-failure` | |
| `use.navigationTimeout` | `45_000` | The app's `load` event is slow/unreliable. |

---

## 5. Running tests

```bash
npm test                                   # everything, headless, parallel
npm run test:headed                        # watch the browser
npm run test:ui                            # UI mode (best for local dev)

npx playwright test auth                    # one file (substring match on path)
npx playwright test tests/topic.spec.ts    # one file (exact)
npx playwright test -g "blank email"        # by test title (substring)
npx playwright test --workers=2             # lower concurrency (slow environment)
npx playwright test --retries=2             # extra retries on a bad day
npx playwright test --project=chromium      # only chromium (default is setup + chromium)
npx playwright test --headed --project=chromium tests/camp.spec.ts

npm run report                             # open the HTML report from the last run
```

### First run / session refresh

The first project to run is **`setup`** ([`tests/auth.setup.ts`](tests/auth.setup.ts)).
It:

1. checks for an existing `.auth/user.json` and probes a protected route
   (`/create/topic`); if that still authenticates, it **skips** and reuses it;
2. otherwise logs in through the UI once and saves the browser storage state to
   `.auth/user.json`.

Every other test loads that state via `storageState`, so **no test logs in
again**. `.auth/` is git-ignored. Delete `.auth/user.json` to force a fresh
login.

---

## 6. How it works (architecture)

### Projects (in `playwright.config.ts`)

```
setup   ──►  chromium
(login once)  (all specs, storageState: .auth/user.json)
```

`chromium` `dependencies: ['setup']`, so `setup` always runs first. `firefox`
and `webkit` projects are present but commented out (see
[Other browsers](#13-other-browsers)).

### One login, reused everywhere

`tests/auth.setup.ts` writes `.auth/user.json`; the `chromium` project sets
`storageState: STORAGE_STATE`. A signed-in test starts already authenticated —
no per-test UI login, which is where the old suite lost most of its time.

For the handful of tests that must be **signed out** (redirect checks,
registration, forgot-password), the spec opts a `describe` block out of the
saved session:

```ts
import { test, SIGNED_OUT } from '../fixtures/test';

test.describe('...', () => {
  test.use(SIGNED_OUT);   // { storageState: { cookies: [], origins: [] } }
  // ...
});
```

### Fixtures

[`fixtures/test.ts`](fixtures/test.ts) extends Playwright's base `test` with one
**page object per area** plus helpers:

```ts
import { test, expect, uid, SIGNED_OUT } from '../fixtures/test';

test('...', async ({ page, loginPage, topicPage, campPage /* ... */ }) => { ... });
```

| Fixture | Page object |
| --- | --- |
| `loginPage` | `pages/LoginPage.ts` |
| `registrationPage` | `pages/RegistrationPage.ts` |
| `forgotPasswordPage` | `pages/ForgotPasswordPage.ts` |
| `topicPage` | `pages/TopicPage.ts` |
| `campPage` | `pages/CampPage.ts` |
| `statementPage` | `pages/StatementPage.ts` |
| `forumPage` | `pages/ForumPage.ts` |
| `newsPage` | `pages/NewsPage.ts` |
| `homePage` | `pages/HomePage.ts` |

Helpers exported from the same module:

- `uid(prefix?)` — short unique suffix so data-creating tests never collide or
  depend on order (`` `PW Topic ${uid()}` ``).
- `SIGNED_OUT` — the empty-storage-state object for `test.use(...)`.

### Page objects

`pages/*.ts` hold **locators + actions only** — no assertions (those live in the
specs). All extend `pages/BasePage.ts`, which provides `page`, a
`goto(path)` that waits for `domcontentloaded` (the app's `load` event never
settles), and `browseMore()` / `expectLoggedIn()`.

Locators favour **role/text** (`getByRole('button', { name: /create camp/i })`)
over CSS/XPath, with a few stable ids that survived the UI redesign
(`#create_new_topic_topic_name`, `#create-topic-btn`, `#create_new_camp_camp_name`,
`#create-camp-btn`, `#publish-button`, `#create-thread-button`, `#submit-btn`,
`#login_form_username` / `#login_form_password` / `#login-submit-btn`).

### Navigation waits

Every `page.waitForURL(...)` passes **`waitUntil: 'commit'`**. The Canonizer app
never fires a settled `load` event, so the default (`'load'`) times out even when
the URL already changed. Use `'commit'` for any new `waitForURL` you add.

---

## 7. Project structure

```
canonizer-ui-tests/
├── playwright.config.ts        # projects, timeouts, reporters, baseURL from .env
├── package.json                # scripts + devDeps
├── tsconfig.json
├── .nvmrc                       # Node version
├── .env.example                # copy to .env
├── .env                        # (git-ignored) real credentials
├── .auth/                       # (git-ignored) saved login session
│   └── user.json
│
├── fixtures/
│   └── test.ts                 # extended `test`, page-object fixtures, uid(), SIGNED_OUT
│
├── data/
│   └── testData.ts             # constants + generators (uniqueEmail, REG, LOGIN, credentials)
│
├── pages/                      # page objects: locators + actions, NO assertions
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   ├── RegistrationPage.ts
│   ├── ForgotPasswordPage.ts
│   ├── TopicPage.ts
│   ├── CampPage.ts
│   ├── StatementPage.ts
│   ├── ForumPage.ts
│   ├── NewsPage.ts
│   └── HomePage.ts
│
├── tests/
│   ├── auth.setup.ts           # the `setup` project — logs in once → .auth/user.json
│   ├── auth.spec.ts            # login / logout / forgot-password / social / access guards
│   ├── registration.spec.ts   # /registration field validation + happy paths
│   ├── topic.spec.ts          # create / history / update / browse / auth
│   ├── camp.spec.ts           # create from topic / update / support / profile / legacy
│   ├── statement.spec.ts      # camp-statement editor / publish / preview / edit
│   ├── forum-news.spec.ts     # forum threads + news-feed add/validate
│   ├── browse-search.spec.ts  # browse, footer/header nav, advanced search, public pages
│   ├── profile-upload.spec.ts # settings tabs, notifications, uploads, access control
│   └── backlog.spec.ts        # 7 placeholders (parity with backlog_tests.py)
│
└── .github/workflows/e2e.yml  # CI: 4-way sharded matrix on push / PR
```

---

## 8. The create-heavy specs

`statement.spec.ts`, `forum-news.spec.ts`, and the create half of
`camp.spec.ts` each chain **topic → camp → statement / thread**. The target
environment throttles parallel entity creation, so those describes carry
`test.describe.configure({ retries: 1 })` (threads: `retries: 2`) and 45–60 s
`waitForURL` timeouts.

Run them at low concurrency:

```bash
npx playwright test statement forum-news --workers=2
# or the create half of camp too:
npx playwright test camp statement forum-news --workers=2 --retries=2
```

A full `npm test` still works; it's just more prone to timeout flakes on those
specs when the environment is loaded. CI shards 4 ways which keeps per-shard
concurrency low.

---

## 9. Debugging failures

| Tool | Command | Use when |
| --- | --- | --- |
| **HTML report** | `npm run report` | See every test, its steps, screenshots, and attached trace/video. |
| **Trace viewer** | `npm run trace test-results/<dir>/trace.zip` | Step-by-step DOM snapshots + network + console for a failed test. Traces are captured `on-first-retry`. |
| **UI mode** | `npm run test:ui` | Local development: pick tests, watch them run, time-travel through steps, edit-and-rerun. |
| **Headed** | `npx playwright test --headed -g "my test"` | Watch a specific test in a real browser. |
| **Debug** | `npx playwright test --debug -g "my test"` | Playwright Inspector, step through with the picker. |
| **Codegen** | `npm run codegen` | Record clicks into a starting script / grab a locator. |

On failure Playwright writes to `test-results/<test-name>/`: `test-failed-*.png`,
`video.webm`, `error-context.md` (a page snapshot + the failing line), and
`trace.zip` (on retry). All of `test-results/` and `playwright-report/` are
git-ignored.

---

## 10. Writing / adding tests

**Conventions**

- Import from the local fixtures, never `@playwright/test` directly:
  ```ts
  import { test, expect, uid, SIGNED_OUT } from '../fixtures/test';
  ```
- Assertions go in the spec. Locators + multi-step actions go in a page object
  under `pages/`. Add a new page object to `fixtures/test.ts` to expose it as a
  fixture.
- Prefer `getByRole` / `getByText` / `getByLabel`. Reach for a CSS id only if
  it's stable and there's no good role/text handle.
- Any data-creating test names its entities with `` `... ${uid()}` `` so it's
  independent and order-free.
- New `page.waitForURL(...)` calls **must** pass `{ waitUntil: 'commit' }`.
- If a case can't be made green against the environment yet, keep it as
  `test('name', async () => { test.fixme(true, 'reason'); })` so the case count
  stays at parity and the reason is recorded.

**Type-check without running:**

```bash
npx tsc --noEmit
```

---

## 11. Porting status

Roughly **270 tests / 10 files**. "Pass" = verified green against
`ux-dev.canonizer.com`; "fixme" = present as `test.fixme` with an inline reason
so the count stays at parity. Numbers are from the last full green run and will
drift as fixmes are resolved — `npm test` is the source of truth.

| Area | Old module | Spec | Pass | `test.fixme` |
| --- | --- | --- | --- | --- |
| Auth / login / logout | `auth_registration_tests.py` | `auth.spec.ts` | ~17 | ~7 |
| Registration | `misc_tests.py` (registration half) | `registration.spec.ts` | ~13 | ~3 |
| Topics | `topic_tests.py` | `topic.spec.ts` | ~25 | ~15 |
| Camps | `camp_tests.py` | `camp.spec.ts` | ~15 | ~19 |
| Statements | `statement_tests.py` | `statement.spec.ts` | ~9 | ~11 |
| Forum & News | `forum_news_tests.py` | `forum-news.spec.ts` | ~19 | ~15 |
| Browse & Search | `browse_search_tests.py` | `browse-search.spec.ts` | ~40 | ~7 |
| Profile & Upload | `profile_upload_access_tests.py` | `profile-upload.spec.ts` | ~26 | ~24 |
| Backlog | `backlog_tests.py` | `backlog.spec.ts` | 0 | 7 |

### Why cases are `test.fixme`

- **Feature removed in the UI redesign** — topic & camp *preview* modals, footer
  *Jobs* and *Sitemap* links.
- **Needs a seeded multi-version fixture** — the *compare* pages (topic / camp /
  statement) require an entity with 2+ live versions; a freshly created one has
  one.
- **Deep edit page still needs a live-DOM pass** — thread edit, news edit, and
  statement edit. A freshly published statement is *Pending* for a ~1 h grace
  period, so its history page shows **Commit Changes**, not **Edit Based on
  This**.
- **Bot protection** — the `/registration` submit is gated by reCAPTCHA, so the
  "sends an OTP" happy paths can't complete headless (these were already failing
  in the Selenium suite).
- **Stale assertion** — the old test pinned a literal count / another account's
  data (e.g. avatar initials `"AR"`, search count `"1121"`).
- **Generated assets required** — upload-file-manager size-limit tests need a
  >5 MB / <5 MB image generated at runtime.

Resolving them is the follow-up work: seed one fixture topic with multiple
versions, do a DOM pass on the three edit pages, and add asset generation for
the upload tests.

---

## 12. Continuous integration

[`.github/workflows/e2e.yml`](.github/workflows/e2e.yml) is **manual only** —
trigger it from the repo's **Actions** tab → *e2e* → **Run workflow**. It does
not run automatically on push or PR (the suite exercises the shared ux-dev
environment and is noisy there). Re-add a `push:` / `pull_request:` trigger to
the workflow if you want that later.

- Node from `.nvmrc`, `npm ci`, `npx playwright install --with-deps chromium`.
- **4-way sharded matrix** (`--shard=1/4 … 4/4`), `fail-fast: false`.
- `retries: 2` and `workers: 4` are switched on automatically by
  `process.env.CI` in `playwright.config.ts`.
- Each shard uploads its `playwright-report/` as an artifact (14-day retention).

### Required repo settings

GitHub repo → **Settings → Secrets and variables → Actions**:

| Kind | Name | Value |
| --- | --- | --- |
| Secret | `CANONIZER_USERNAME` | test-account email |
| Secret | `CANONIZER_PASSWORD` | test-account password |
| Variable | `CANONIZER_BASE_URL` | `https://ux-dev.canonizer.com` |

Without these the `setup` (login) step fails and every shard errors.

---

## 13. Other browsers

Firefox and WebKit projects exist in `playwright.config.ts` but are
**commented out** — every locator has only been exercised against Chromium.
To enable one:

1. Uncomment its `projects` entry in `playwright.config.ts`.
2. `npx playwright install firefox` (or `webkit`).
3. `npx playwright test --project=firefox` and fix the fallout.
4. Add it to the CI matrix.

---

## 14. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `command not found: node` / `npx` | nvm not loaded. `export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"` then `nvm use`. |
| `CANONIZER_USERNAME not set` | No `.env`, or the var is blank. `cp .env.example .env` and fill it in. |
| Every test redirects to `/login` | Saved session expired and `setup` didn't refresh it. Delete `.auth/user.json` and re-run. |
| `waitForURL: Timeout ... waiting for navigation until "load"` | A `waitForURL` without `{ waitUntil: 'commit' }`. The app's `load` event never settles. |
| Create-flow tests time out under `npm test` | Environment throttling parallel creation. Re-run with `--workers=2` (and `--retries=2`). |
| Ant dropdown / menu click "element is not stable / detached" | Ant re-mounts menus during their open animation. Pattern used here: `expect(async () => { await trigger.click(); await item.dispatchEvent('click'); await expect(...).toHaveURL(...); }).toPass()`. |
| `git push` → "Password authentication is not supported" | Use a Personal Access Token as the password, or switch the remote to SSH: `git remote set-url origin git@github.com:the-canonizer/canonizer-ui-tests.git`. |
| Browser download blocked / missing | `npx playwright install chromium` (cache: `~/Library/Caches/ms-playwright`). |

---

## 15. Differences from the Selenium suite

The Canonizer UI was substantially **redesigned** since
`Canonizer_UX-UI_Automated_TestCase` was written, so most of that suite's 719
locators (mostly absolute XPath) are dead. This port targets the current DOM and
corrects assertions that were wrong or stale:

- **Login is once, not per test** — ~200 old tests each did a full UI login
  (30–70 s each). Here it's a single `setup` project.
- **No implicit waits** — Playwright auto-waits on every action and assertion;
  there is no `implicitly_wait` equivalent and none is needed.
- **Parallel + isolated** — `fullyParallel`, fresh browser context per test. The
  shared-data problem that blocked `pytest-xdist` is gone because every
  data-creating test uses a `uid()`-suffixed name.
- **Corrected assertions** — several old `test_authentication_*` cases asserted a
  `/login` redirect for a *signed-in* user visiting a *public* page (`/videos`,
  `/help`, `/browse`) or a settings tab; those are ported to assert the real
  behaviour (signed-in → loads; signed-out → `/login`). Stale literals
  (`"1121"`, `"AR"`, `"Akashing"`) are replaced with structural checks.
- **Namespace/Canon** now defaults to *General*, so topic creation is just a
  name — the old 100-iteration keyboard-scroll to find "sandbox testing" is gone.
- **Topic history** is reachable directly at `/topic/history/<slug>` — no 3-dot
  "Manage Topic" menu dance.
