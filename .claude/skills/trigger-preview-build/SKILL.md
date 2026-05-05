---
name: trigger-preview-build
description: Use when the user wants to trigger an EAS preview build for the green-seasons project by pushing a preview tag from the preview branch.
---

# Trigger Preview Build

Pushes a new preview tag from the `preview` branch to trigger the EAS preview build workflow (`.github/workflows/main.yml`).

Tag format: `v{app_version}-preview-{n}` where `n` auto-increments from the latest existing preview tag for that version.

## Steps

### 1. Confirm on preview branch

```powershell
git branch --show-current
```

If not on `preview`, switch:

```powershell
git checkout preview
```

### 2. Check for uncommitted changes

```powershell
git status --porcelain
```

If any output is returned, **stop**. Tell the user there are uncommitted changes and ask them to commit or stash before continuing.

### 3. Push any unpushed commits

```powershell
git log origin/preview..HEAD --oneline
```

If output is returned, push first:

```powershell
git push origin preview
```

### 4. Determine the next tag

Read the app version from `app.json`:

```powershell
(Get-Content app.json | ConvertFrom-Json).expo.version
```

Find the highest existing `n` for that version:

```powershell
git tag --list "v{version}-preview-*" --sort=-version:refname | Select-Object -First 1
```

Extract the number from the tag (e.g. `v1.1.0-preview-3` → `3`), add 1. If no tags exist for this version, start at `1`.

The new tag is: `v{version}-preview-{n+1}`

### 5. Create and push the tag

```powershell
git tag v{version}-preview-{n}
git push origin v{version}-preview-{n}
```

Confirm success and tell the user the tag name and that the EAS build has been triggered. Remind them they can monitor it at https://expo.dev.

## Error cases

| Situation                 | Action                                                                 |
| ------------------------- | ---------------------------------------------------------------------- |
| Not on `preview` branch   | Switch to `preview`, then re-check status                              |
| Uncommitted changes exist | Stop, tell user to commit or stash first                               |
| Push fails (rejected)     | Tell user — do not force push                                          |
| Tag already exists        | This shouldn't happen with auto-increment; if it does, increment again |
