# Timesync Employee Portal

React + TypeScript + Vite front-end for the Timesync employee portal (company
calendar, timesheet, attendance and monthly reports).

This README is the **setup / onboarding guide**. Follow it in order: install the
packages listed in section 2 **before** you try to start the dev server,
otherwise Vite exits with `Failed to resolve import ...` / `Cannot find module
...` errors.

---

## 1. Prerequisites

| Tool | Required version | Why it matters |
| --- | --- | --- |
| Node.js | `^20.19.0` or `>=22.12.0` (LTS 22 recommended) | this is the `engines` requirement of Vite 8 |
| npm | 10 or newer | ships with Node 22+ |

Check what you have installed:

```powershell
node -v
npm -v
```

If `node -v` prints `18.x` or lower, upgrade **before** running any npm script.
An old Node build is the most common cause of `ERR_OSSL_EVP_UNSUPPORTED`,
`crypto.hash is not a function` and `EBADENGINE` errors.

Example with nvm-windows:

```powershell
nvm install 22
nvm use 22
node -v
```

---

## 2. Install the packages first (required before starting the server)

Run every command from the project root (`C:\Users\Admin\Desktop\Timesyncfn`).

### 2.1 One-shot install (recommended)

```powershell
npm install
```

`npm install` installs everything declared in `package.json`; the exact resolved
versions are pinned in `package-lock.json`. Use `npm ci` instead when you want
the lockfile installed byte-for-byte (CI pipelines, or any time your
`node_modules` is in a broken state).

Always install from the project root and never mix package managers
(npm / pnpm / yarn) inside the same `node_modules` folder.

### 2.2 Explicit install commands

Use these when you are setting the project up by hand or when a single package
is reported as missing:

```powershell
# Runtime dependencies
npm install react react-dom react-router-dom @mui/material @mui/icons-material @emotion/react @emotion/styled

# Development dependencies
npm install -D vite @vitejs/plugin-react typescript @types/node @types/react @types/react-dom oxlint
```

### 2.3 What each package is for

| Package | Type | Required by |
| --- | --- | --- |
| `react`, `react-dom` | runtime | app entry point (`src/main.tsx`) |
| `react-router-dom` | runtime | routing (`src/App.tsx`, `src/routes/route.tsx`) |
| `@mui/material` | runtime | every UI component (`Box`, `Drawer`, `Dialog`, `Menu`, ...) |
| `@mui/icons-material` | runtime | every icon (`CalendarMonthOutlinedIcon`, ...) |
| `@emotion/react`, `@emotion/styled` | runtime | MUI peer dependencies - the styled engine; MUI will not render without them |
| `vite` | dev | dev server and bundler |
| `@vitejs/plugin-react` | dev | JSX transform / Fast Refresh used in `vite.config.ts` |
| `typescript` | dev | type checking (`npm run build` runs `tsc -b`) |
| `@types/node`, `@types/react`, `@types/react-dom` | dev | TypeScript types (React 19 needs `@types/react@19`) |
| `oxlint` | dev | linter (`npm run lint`) |

### 2.4 Optional install check

```powershell
npm ls --depth=0
```

The command must exit with code `0` and list all packages from section 2.3. Any
`UNMET DEPENDENCY` line means the install did not finish - run `npm install`
again before starting the server.

---

## 3. Start the dev server

```powershell
npm run dev
```

Vite prints a local URL - by default <http://localhost:5173/>. Open it in the
browser; the root route redirects to `/calendar` (Company Calendar page).
Stop the server with `Ctrl + C`.

Do **not** open `index.html` directly from the file system and do not serve the
`dist/` folder by hand: the entry point is `/src/main.tsx`, which only works
through the Vite dev server (or `npm run preview` after a build).

---

## 4. Other scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | start the Vite dev server with HMR (port 5173) |
| `npm run build` | type check (`tsc -b`) and bundle to `dist/` |
| `npm run preview` | serve the already built `dist/` folder locally |
| `npm run lint` | run oxlint over the project |

Notes:

- `npm run build` runs `tsc -b` first. It fails on unused imports and unused
  locals because `noUnusedLocals` and `noUnusedParameters` are enabled in
  `tsconfig.app.json` - remove unused code instead of skipping the check.
- This project is front-end only. There is no separate back-end node server to
  start; the data currently comes from the mock arrays in `src/data/users.ts`
  and `src/Pages/Admin/Companycalendar.tsx`.

---

## 5. Verified environment

Versions confirmed working on this checkout (`node -v` = `v24.20.0`,
`npm -v` = `11.19.0`):

| Package | Installed version |
| --- | --- |
| `react` | 19.3.0 |
| `react-dom` | 19.3.0 |
| `react-router-dom` | 7.18.4 |
| `@mui/material` | 9.4.0 |
| `@mui/icons-material` | 9.4.0 |
| `@emotion/react` | 11.14.0 |
| `@emotion/styled` | 11.14.1 |
| `vite` | 8.3.0 |
| `@vitejs/plugin-react` | 6.1.1 |
| `typescript` | 6.0.3 |
| `oxlint` | 1.83.0 |
| `@types/react`, `@types/react-dom` | 19.3.0 |
| `@types/node` | 24.13.5 |

`npm ls --depth=0`, `npx tsc -b` and `npm run build` all exit with code `0` on
this setup.

---

## 6. Project structure

```
src/
  main.tsx                     app entry (mounts <App /> inside <UserProvider>)
  App.tsx                      sets up <RouterProvider>
  routes/route.tsx             route table
  layout/Mainlayout.tsx        shell: sidebar + header + page content
  Components/Sidebar/          left navigation
  Components/ProfileDropdown/  role switcher in the header
  context/UserContext.ts       user context + useCurrentUser hook
  context/UserProvider.tsx     provider that holds the signed-in user
  data/users.ts                mock users and role permissions
  Pages/Admin/Companycalendar.tsx   company calendar page
public/                        static assets (favicon, icons)
```

---

## 7. Troubleshooting the errors we keep seeing

### 7.1 Common error messages and fixes

| Error message | Cause | Fix |
| --- | --- | --- |
| `Failed to resolve import "@mui/material" from "src/..."` / `Cannot find module '@mui/material'` | dependencies were never installed (or `node_modules` is incomplete) | `npm install` from the project root |
| `Failed to resolve import "@mui/icons-material/..."` / `Could not resolve "@mui/icons-material/CalendarMonthOutlined"` | `@mui/icons-material` missing, or the icon name does not exist in MUI v9 | `npm install @mui/icons-material`; if it persists, confirm the icon is exported by the installed version |
| `Module not found: Can't resolve '@emotion/react'` or a MUI peer warning that `@mui/styled-engine` requires `@emotion/react` and `@emotion/styled` | MUI peer dependencies missing | `npm install @emotion/react @emotion/styled` |
| `Cannot find module 'react-router-dom'` / `Failed to resolve import "react-router-dom"` | router package missing | `npm install react-router-dom` |
| `Cannot find module 'react-dom/client'` | `react` / `react-dom` missing or mismatched | `npm install react react-dom @types/react @types/react-dom` |
| `You are using Node.js 18.x. Vite requires Node.js version 20.19+ or 22.12+.` | Node too old for Vite 8 | upgrade Node (section 1) |
| `npm ERR! code EBADENGINE` | Node too old for one of the packages | upgrade Node, then `npm install` again |
| `ERR_OSSL_EVP_UNSUPPORTED` / `crypto.hash is not a function` | old Node / OpenSSL build | upgrade Node |
| `npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system.` | PowerShell execution policy blocks `npm.ps1` | run `npm.cmd install` (and `npm.cmd run dev`) instead of `npm`, or `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` in an elevated PowerShell |
| `node.exe : [plugin builtin:vite-reporter] ... + CategoryInfo ... NativeCommandError` | **not a failure**: PowerShell shows Vite's informational stderr log as red "error" text while the command still exits `0` | confirm with `$LASTEXITCODE` / "built in Xms" line; run via `cmd /c npm run build` if the red text is confusing |
| `(!) Some chunks are larger than 500 kB after minification` | bundle-size warning only | no action needed for development; code-split later if required |
| `TS6133: 'X' is declared but its value is never read.` during `npm run build` | unused import / local (`noUnusedLocals` + `noUnusedParameters` are on) | delete the unused import or variable |
| `TS2339: Property 'children' does not exist on type ...` or other JSX typing errors | wrong `@types/react` major version | `npm install -D @types/react@19 @types/react-dom@19` |
| `useCurrentUser must be used inside a <UserProvider>` | component rendered without the provider | keep `src/main.tsx` wrapping `<App />` in `<UserProvider>` |
| `Invalid hook call` / two copies of React | mixed installs (npm + pnpm/yarn) or duplicate `react` folders | remove `node_modules` and reinstall with npm only (section 7.2) |
| `Port 5173 is in use` / `EADDRINUSE` | another dev server is already running | stop it, or `npm run dev -- --port 5174` |
| `'vite' is not recognized as an internal or external command` / `Cannot find module ...\vite\bin\vite.js` | command run from the wrong folder, or install incomplete | `cd C:\Users\Admin\Desktop\Timesyncfn` then `npm install` |
| Stale HMR errors after upgrading a dependency | outdated Vite cache | delete the `node_modules\.vite` folder and restart `npm run dev` |

### 7.2 Clean reinstall (use when the errors do not stop)

```powershell
cd C:\Users\Admin\Desktop\Timesyncfn
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json     # optional: only if you want fresh resolution
npm cache clean --force
npm install
npm run dev
```

To reproduce the exact versions committed in `package-lock.json` without
deleting it, use `npm ci` instead of `npm install`.

### 7.3 Onboarding checklist

1. `node -v` prints `v20.19+` or `v22.12+`.
2. `npm install` inside `C:\Users\Admin\Desktop\Timesyncfn` completes with exit code `0`.
3. `npm ls --depth=0` shows no `UNMET DEPENDENCY`.
4. `npm run build` prints `built in ...ms` (the red `NativeCommandError` block can be ignored).
5. `npm run dev` starts, and <http://localhost:5173/calendar> renders the Company Calendar.

Do not run the app before steps 1-3 pass - that is exactly the state that
produces the `Failed to resolve import` / `Cannot find module` errors.