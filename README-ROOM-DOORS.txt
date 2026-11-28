IDEARE - Door and room measurement update

Reviewed GitHub blobs:
assets/js/designer.js db47fde0ebcc9356f933dc842ddcae149522eafe
assets/css/designer.css d0ed7240fb0cbc200ebacd17a916cfee8e2ef574
api/designer3d/save.php 1fb151355487dcc18f033fb14939e30d38315621

Extract to C:\xampp\htdocs\IDEARE CREATION and double-click UPDATE-ROOM-DOORS.bat.
The installer checks all three files before writing. If it reports version mismatch,
do not force the patch; it has not modified the existing files.
A backup is created beside (not inside) the site folder. Restore the three files
from that folder to roll back. No SQL schema changes needed.

Open Define Space. Click Add door; select a solid wall, enter left and right
clearances (facing wall from inside), or enter frame width and let the right
clearance recalculate. Choose height, hinge and inward/outward. Apply.
Click an existing door row to edit; use x to remove; Undo restores it.
Door openings and a 90-degree swing are shown in both previews. Outward swing
outside the measured room is illustrative only. Existing room feature data is retained.
Door offsets stay fixed from the start of their wall if room dimensions change;
right clearance changes accordingly. Existing invalid doors must be adjusted.

Click mm beside ceiling height to switch to decimal feet (1 ft = 304.8 mm).
Storage remains in millimetres. All wall/edge length boxes accept exact mm values;
connected wall directions are preserved, invalid geometry or placements are rejected.
The other end of the selected wall may move if needed to keep the room valid.

Test in your browser: add a door on each wall of a rectangular room, all four
swing directions, a notched/angled room, edit lengths, switch units, undo/redo,
save/reopen, wall hiding and previous cabinet features. Keep the backup.
Delete the installer BAT, PHP and README only after testing.

Commit: Add doors and exact room measurements
