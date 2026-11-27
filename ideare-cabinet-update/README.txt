IDEARE Cabinet Designer refinement

1. Extract this ZIP directly to your IDEARE CREATION root folder.
2. Double-click apply-cabinet-update.bat once.
3. Refresh the website with Ctrl+F5.

The CLI-only installer checks all source anchors before modifying anything.
It patches assets/js/designer.js, assets/css/design-studio-spacing.css,
includes/customer/header.php and designer/index.php in place, and creates
backups in the OS temporary folder. It does not modify the Home Configurator.
No SQL changes. You can delete the installer folder and BAT after it succeeds.

Repository reference: ferhan02/IDEARE-CREATION main, designer.js blob
 db9354a8df574306a8d98d7663bdab2c1dedecee.

Notes: the visible grid is 50 mm; snap is enabled by default while the grid is
visible. Wall/object constraints take precedence when grid placement is invalid.
Wall-mounted cabinets are intentionally excluded from floor legs and plinths.
Fridges remain floor-mounted; surrounding pantry storage gets concealed legs.
Floor patterns remain procedural previews, not actual manufacturer material scans.
