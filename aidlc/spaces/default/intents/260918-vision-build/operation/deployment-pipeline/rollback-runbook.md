# Rollback Runbook — Reading Queue CLI

## When to roll back

Roll back when the post-install smoke test fails, or the newly installed
`reading-queue` misbehaves in normal use (crashes, wrong output, exit-code
regressions). Because this is a local single-user tool, "roll back" means
reinstalling a known-good build — there is no traffic to reroute.

## Rollback procedure

1. Identify the last known-good release tag:
   ```
   git tag --list 'v*' --sort=-v:refname | head
   ```
2. Check it out and rebuild from clean state:
   ```
   git checkout <previous-tag>
   npm ci
   npm run build
   ```
3. Reinstall the prior binary globally:
   ```
   npm install -g .
   ```
4. Re-run the smoke test from `cd-config.md` to confirm the prior version is
   healthy.
5. Return the working tree to the intended branch (`git checkout main`) once the
   rollback binary is installed.

## Full uninstall (fallback)

If reinstalling a prior version is not enough, remove the binary entirely:

```
npm uninstall -g reading-queue   # or: npm unlink -g if installed via npm link
```

## Data safety

The data file (`~/.reading-queue/queue.json`, or the `READING_QUEUE_FILE`
override) is **not** touched by install, reinstall, or uninstall. The JSON shape
is stable and additive, so an older binary reads a file written by a newer one
without migration. No backup step is required before rollback; if paranoid,
copy the data file aside first:

```
cp ~/.reading-queue/queue.json ~/.reading-queue/queue.json.bak
```

## Post-rollback follow-up

Record what failed and why in the intent's notes, and do not re-attempt the
failed release until the root cause is fixed and re-verified through the full
`cd-config.md` release gate.
