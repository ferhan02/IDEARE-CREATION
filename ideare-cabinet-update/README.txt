IDEARE Cabinet Designer refinement — startup repair v2

1. Extract this ZIP directly into your IDEARE CREATION root folder.
2. Replace files when prompted. Double-click apply-cabinet-update.bat.
3. Wait for “Cabinet startup repaired; all refinement features retained.”
4. Refresh the Cabinet Designer with Ctrl+F5.

Works over the previous installed update or the checked pre-update source.
The installer now moves visibility, grid preferences and the 50 mm grid
constant out of the old Studio IIFE to the designer module scope. This fixes
“wallsVisible is not defined” and the same hidden-scope issue for grid helpers.
All original refinement hooks are checked before files are written. The script
also creates backups in the system temporary folder and bumps cache versions.
No SQL changes. No saved designs are deleted. Home Configurator is untouched.

Repository reference: ferhan02/IDEARE-CREATION main, designer.js blob
712d3e6f1ade2aa029941b4285d3576a5b9cf00f (already refined).

Grid is 50 mm and snap is on when grid is visible; wall and collision rules
still take precedence. Suspended cabinets are intentionally not given floor
legs. Freestanding fridges rest on the floor, side pantry storage gets legs.
Floor textures are procedural previews.
