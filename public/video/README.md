# Background videos

The two Home background videos stream from `video.wixstatic.com` on the live
site, so "Save Page As → Webpage, Complete" did not capture them — only their
poster frames, which are in `src/assets/home/`.

Drop the two files here and they play automatically. Until then each `<video>`
falls back to its poster, which is the video's own first frame.

| File            | Used by                          | Source clip (from the saved markup) |
| --------------- | -------------------------------- | ----------------------------------- |
| `hero.mp4`      | Home — full-viewport hero        | `Khalyani & Aseem Insta 4k render .M4V` |
| `cinematic.mp4` | Home — "Cinematic Journeys" band | `Satyam & Sweksha Wedding First Cut Updated.m4v` |

Both are muted, looped and autoplaying, matching the original.
