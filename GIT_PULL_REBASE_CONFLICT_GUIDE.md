# Resolving Divergent Branches and Rebase Conflicts

This guide explains how to solve the following Git error:

```text
fatal: Need to specify how to reconcile divergent branches.
```

It also explains what to do if `git pull --rebase` produces merge conflicts.

## Why the error happens

Your local branch and remote branch both contain commits that the other branch
does not have. Git calls this a **divergent branch**.

For example:

```text
Remote: A---B---C
             \
Local:       D
```

Git needs to know whether it should merge, rebase, or only allow a
fast-forward update.

## Recommended workflow: rebase

### 1. Check your working tree

```bash
git status
```

This shows:

- Your active branch.
- Modified or deleted files.
- Untracked files.
- Whether a merge or rebase is already in progress.

### 2. Save uncommitted work

If `git status` shows changes that are not committed, save them temporarily:

```bash
git stash push -u -m "WIP before pull rebase"
```

Meaning:

- `git stash push` temporarily stores working-tree changes.
- `-u` includes untracked files.
- `-m` adds a description to the stash.
- `WIP` means "work in progress."

Be careful when using `-u` if the repository contains large untracked files,
such as build archives. To stash only tracked changes, omit `-u`:

```bash
git stash push -m "WIP before pull rebase"
```

### 3. Pull and rebase

For this repository and remote branch, run:

```bash
git pull --rebase --tags personal my-superset-custom
```

Meaning:

- `git pull` downloads remote commits and integrates them.
- `--rebase` places your local commits on top of the downloaded commits.
- `--tags` also downloads tags from the remote.
- `personal` is the Git remote name.
- `my-superset-custom` is the remote branch name.

A successful rebase produces history similar to this:

```text
A---B---C---D'
```

`D'` contains the changes from local commit `D`, replayed on top of remote
commit `C`. Because the commit was recreated, it has a new commit hash.

## Resolving conflicts during a rebase

Git pauses when the same part of a file was changed by both branches. Check the
conflicted files:

```bash
git status
```

You can also list only unresolved files:

```bash
git diff --name-only --diff-filter=U
```

Conflict sections look like this:

```text
<<<<<<< HEAD
content from the remote branch
=======
content from the local commit being replayed
>>>>>>> local commit
```

Edit each conflicted file. Keep the correct content, combine both sides when
necessary, and remove the `<<<<<<<`, `=======`, and `>>>>>>>` marker lines.

During a rebase:

- `HEAD` or `ours` usually refers to the remote/upstream version onto which
  your work is being replayed.
- `theirs` usually refers to your local commit being replayed.

This naming can feel reversed compared with a normal merge, so inspect both
versions before choosing one.

### Resolving a generated `package-lock.json`

For a generated lockfile, use the upstream lockfile as the base and regenerate
it after resolving source and workspace changes:

```bash
git checkout --ours superset-frontend/package-lock.json
cd superset-frontend
npm install --package-lock-only --ignore-scripts
cd ..
```

Meaning:

- `git checkout --ours <file>` selects the upstream version during this
  rebase.
- `npm install --package-lock-only` updates only the lockfile.
- `--ignore-scripts` prevents dependency lifecycle scripts from running.

Do not use this approach if the incoming lockfile contains intentional manual
changes that cannot be reproduced from the workspace `package.json` files.

### Mark files as resolved

After editing or regenerating every conflicted file:

```bash
git add <resolved-file-1> <resolved-file-2>
```

For the conflict in this example:

```bash
git add superset-frontend/package-lock.json
git add superset-frontend/src/visualizations/presets/MainPreset.ts
```

`git add` tells Git that you have resolved the file. It does not push anything
to the remote.

### Continue the rebase

```bash
git rebase --continue
```

Git may pause again if another commit conflicts. Repeat the conflict-resolution
steps until Git reports that the rebase completed successfully.

If Git opens an editor, save the existing commit message and close the editor.

## Restore stashed work

Only restore your stash **after the rebase finishes successfully**:

```bash
git stash pop
```

Meaning:

- Applies the most recent stash to the working tree.
- Removes that stash if it applies successfully.
- Keeps the stash if conflicts prevent a successful application.

If you run `git stash pop` while the rebase still has unresolved conflicts, Git
will normally refuse to apply it and report that files "need merge." Resolve
and finish the rebase first, then run `git stash pop` again.

Inspect available stashes with:

```bash
git stash list
```

## Verify the result

```bash
git status
git log --oneline --graph --decorate -10
```

Meaning:

- `git status` confirms whether the rebase finished and shows remaining local
  changes.
- `git log --oneline` displays compact commit history.
- `--graph` draws the branch structure.
- `--decorate` displays branch and tag names.
- `-10` limits the output to ten commits.

Search resolved files for accidentally retained conflict markers:

```bash
rg -n '<<<<<<<|=======|>>>>>>>' superset-frontend/package-lock.json \
  superset-frontend/src/visualizations/presets/MainPreset.ts
```

No output means those files contain no conflict markers.

## Cancel or skip during a rebase

To cancel the entire rebase and return to the state from before it began:

```bash
git rebase --abort
```

To discard the local commit that Git is trying to replay:

```bash
git rebase --skip
```

Use `--skip` only when you intentionally want to discard that commit's changes.

## Configure future pulls

Use rebase as the default pull strategy for this repository:

```bash
git config pull.rebase true
```

This modifies only the current repository's Git configuration. To set the same
preference for every repository owned by your user account, use:

```bash
git config --global pull.rebase true
```

Other available strategies are:

```bash
git config pull.rebase false
```

This uses merge commits when branches diverge.

```bash
git config pull.ff only
```

This permits only fast-forward pulls and stops whenever branches diverge.

## Validate before pushing

Review what will be committed before staging files, especially large archives
or generated files:

```bash
git status
git diff
```

This repository requires the pre-commit checks before pushing. Stage only the
files you intend to commit, then run:

```bash
git add <files-you-want-to-commit>
pre-commit run --all-files
```

If a hook modifies files, review and stage those changes, then run the checks
again.

After the checks pass, push the rebased branch:

```bash
git push personal my-superset-custom
```

A normal push should work because the remote commit is an ancestor of the
rebased local branch. Do not use `--force` unless you have confirmed that the
remote branch itself was rewritten and a force push is necessary.

## Complete command sequence

When there are no conflicts:

```bash
git status
git stash push -u -m "WIP before pull rebase"
git pull --rebase --tags personal my-superset-custom
git stash pop
git status
```

When Git reports conflicts:

```bash
git status
# Edit each conflicted file and remove its conflict markers.
git add <resolved-files>
git rebase --continue
# Repeat the previous three steps if Git finds more conflicts.
git stash pop
git status
```

