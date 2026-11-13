IDEARE CREATION - Cabinet Designer Compact Layout + Dark Mode Fix
Source reviewed: https://github.com/ferhan02/IDEARE-CREATION (main, 13 Nov 2026)

INSTALL (Windows / XAMPP)
1. Back up your project folder.
2. Extract this ZIP directly into C:\xampp\htdocs\IDEARE CREATION\
   (the assets, designer and installer should all be in that directory).
3. Double-click INSTALL-DESIGNER-FIX.bat in that folder.
   Alternatively: C:\xampp\php\php.exe APPLY-DESIGNER-FIX.php
4. Open designer/index.php and press Ctrl+F5 to refresh your cached stylesheet.
5. Test all four stages with the theme toggle in both modes.

The installer changes exactly one line in designer/index.php to load
assets/css/designer-3d-compact-theme.css AFTER the existing designer-3d.css.
It creates designer/index.php.before-compact-theme.bak before editing.
The CSS is scoped to html[data-ideare-page="designer"] so the homepage,
materials, staff pages, and other customer pages are not affected.
No JavaScript, database or 3D geometry files are changed.

Targets:
- Comfortable, compact appearance at 100% desktop browser zoom, without
  trying to force an entire detailed workflow into one screen.
- Much less unused vertical padding and smaller shape/room/viewport panels.
- Dark controls, selected states, messages and floor-plan SVG in dark mode.
- Responsive stacking for tablet and phone widths.

ROLLBACK:
Replace designer/index.php with the .before-compact-theme.bak backup,
then delete assets/css/designer-3d-compact-theme.css. Refresh Ctrl+F5.

Note: Visual browser/XAMPP testing was not possible in this environment;
please verify the actual 3D viewer with your local app.
