IDEARE - Items previews and popup stacking

1. Copy the contents of this ZIP into your existing IDEARE CREATION root.
2. Run apply-popup-update.bat (or php ideare-popup-update/apply.php from the root).
3. Ctrl+F5 to reload.

Requires the cabinet startup fix already present in GitHub main (designer.js
Git blob 8afc9174237da611b93b98f38df34819673e711f at review).
The installer checks exact source anchors, preserves unrelated changes and
backs up designer.js and header.php in the system temporary directory.
It is safe to run again. No database changes. Do not rerun older installers
unnecessarily.

The Items list uses cached, on-demand images rendered from the actual cabinet,
appliance and backsplash scene meshes with their current finishes. Original
row selection handlers remain. If a thumbnail cannot be rendered, a neutral
category icon appears instead. The extra preview renderer is initialized only
when opening the list. It does not modify or dispose live scene meshes.

Fixed popups use the native browser top layer when supported. Dialogs and
alerts remain above non-modal popups; CSS stacking is used as a fallback.
WhatsApp and canvas controls sit below open popup content on studio routes.

Validation: exact patch anchors checked against GitHub main; PHP and JS syntax
checks; CLI installer idempotence; Chromium fixture checks for list rendering
with a simulated renderer, selection, count, closing, responsive width, palette
and popup layering. Actual Three.js WebGL thumbnails and XAMPP integration
have not been tested in this environment.
