# Zen Tab Group Colors

A local Sine/Cosine JavaScript mod prototype for Zen Browser.

## Features

- Opens a color picker shortly after a new `zen-folder` appears in the sidebar.
- Offers preset swatches and a custom HTML color picker / HEX field.
- Saves one color per folder ID in a Firefox preference.
- Adds **Choose Group Color…** to the folder context menu for later edits.
- Reset removes the custom color for that folder.

## Important behavior note

This prototype opens the picker **immediately after Zen creates/inserts the folder**. It does not replace or modify Zen's native folder-creation dialog. The create dialog's internal event/API is not a documented stable extension point, so the picker is triggered by observing the newly inserted `zen-folder` element.

The script targets Zen's current sidebar DOM conventions (`zen-folder`, `#zenFolderActions`, `.tab-group-folder-icon`). Zen updates may change these selectors. It has not yet been tested against the user's exact Zen 1.23b + Flatpak + Cosine build; treat it as an experimental local mod and keep a backup / know how to disable it in Cosine.

## Install with Cosine

1. Put this whole folder in a public GitHub repository, preserving all four files.
2. In Zen, open **Settings → Cosine Mods**.
3. Use the **Add an unpublished mod** field and enter `OWNER/REPOSITORY` (or the repository URL if your Cosine build accepts it).
4. Install the mod, enable it, and restart the browser UI if prompted.
5. Create a new folder. The picker should appear shortly after the folder is added. Right-click an existing folder to change its color later.

Cosine's unpublished-mod workflow expects a GitHub repository containing `theme.json`, the `.uc.js` script, and the CSS file.

## Local development

Edit the JS/CSS, commit and push to GitHub, then use Cosine's update action and restart Zen.
# zen-tab-group-colors
