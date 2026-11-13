# IDEARE Cabinet Inspiration photo folders

Cabinet Inspirations are managed through the existing `inspiration_designs` database table. Publish a design there and it will appear in the gallery automatically. **No SQL migration is required for this update.**

Additional photos are found by the published inspiration's numeric `id`:

```text
assets/images/inspiration/
  12/
    cover.jpg
    01-front-view.jpg
    02-open-drawers.jpg
    03-interior-detail.jpg
    details.json
  13/
    cover.webp
    01-door-profile.webp
```

The existing staff-managed `cover_image` is preferred as the thumbnail / first gallery image. If the staff cover is blank, `cover.jpg` (or `cover.png`, `cover.webp`, `cover.avif`, `cover.jpeg`) is preferred, followed by the first supported photograph alphabetically. The remaining photos appear in the design detail popup. Supported formats are `.jpg`, `.jpeg`, `.png`, `.webp`, and `.avif`.

You can optionally add `details.json` within an inspiration folder to describe the design without creating new database columns:

```json
{
  "finishes": ["Warm walnut", "Matte ivory", "Quartz-look worktop"],
  "features": ["Soft-close drawers", "Pull-out pantry", "Integrated lighting"],
  "note": "Finishes are concepts and subject to material availability and staff review."
}
```

Only include truthful details corresponding to the displayed concept. Do not use photo names to promise finishes or accessories not actually shown or available.

Each published inspiration can have an optional `base_design_id` linked to the Cabinet Designer. If populated, visitors open that particular starting design via `designer/index.php?design_id=...`; otherwise they can still start a blank custom cabinet design.
