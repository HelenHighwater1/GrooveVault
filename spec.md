Overview
Groove Vault is a vinyl record collection app. The MVP lets a user input their whole collection, then view and reorganize it. Two other pillars are planned but out of scope for this MVP:
• Checking whether you already own a record while standing in a store
• A future social layer (friends, wishlists you keep or share) — well after the MVP
MVP Scope
In (v1):
• Add a record via text search, barcode scan, or cover-photo OCR, with a manual-entry fallback
• "Already in your collection?" check when adding
• View the collection as a list/grid
• Sort/organize by: alphabetical (artist, title), year, format, genre, style
• Cover images shown per record
Explicitly deferred:
• v2: custom sort/tags (user-defined genre groupings) and physical shelf order
• v3: AI-suggested mood tagging, shown as an editable suggestion
• Later: friends, wishlists, sharing
Adding a Record
Three ways in, all backed by the Discogs API for metadata (artist, title, year, genre, style, format, cover images):

1. Text search — type artist/title, get a results list with cover thumbnails, tap to select and pull full metadata. Show enough distinguishing info (year, country, format) per result so the user picks the right pressing, since popular albums have many.
2. Barcode scan — on-device barcode reader (no cost, works offline) reads the UPC, then a Discogs barcode lookup returns the exact pressing.
3. Cover photo → OCR — on-device or cloud OCR pulls text off the cover, pre-fills the text search box for the user to confirm.
   Fallback: if none of the above finds a match (bootlegs, private presses, damaged sleeves), the user can manually enter artist/title/year themselves with no Discogs match — this needs to feel like a normal path, not a broken one.
   Any field pulled in from Discogs stays editable by the user afterward.
   "Do I Already Own This?"
   Core in-store use case, in the MVP.
   • Match on the album (Discogs master ID), not the exact pressing — this is what a shopper actually cares about in the moment.
   • If matched, show a clear "you already have this" flag, and surface which pressing(s) the user owns.
   • Let the user confirm this new copy is a different pressing/year and add it as its own, separate entry rather than blocking the add or merging it into the existing one.
   Organize & Sort
   MVP (easy, comes free from stored metadata):
   • Alphabetical (artist, title)
   • Year
   • Format
   • Genre and/or Style (Discogs' own controlled vocabulary — decide whether to browse by the broad Genre field or the more granular Style field)
   Build one flexible, composable "view" (filter + sort + group) rather than a separate screen per organization type — saves rebuilding the list UI as more axes get added later.
   Deferred to v2: custom sort where the user defines their own genre groupings/tags, plus a physical shelf order the user sets via drag-and-drop to mirror their actual shelf.
   Deferred to v3: AI-suggested mood, inferred from metadata (genre, style, year, tracklist) rather than audio analysis. Always shown as an editable suggestion the user can accept or change — never an automatic, final verdict.
   Album Cover Images
   MVP approach: hotlink directly to Discogs' image URLs. Every release response already includes ready-to-use CDN image URLs at multiple sizes — no separate image search needed. Requires an authenticated Discogs request (personal token or key/secret) for image URLs to be returned at all.
   • Use the small (150px) thumbnail in list/grid views.
   • Load the full-size image only in the record's detail view.
   • No local image storage needed for now — just save the URL string with the record.
   Revisit later: once the social feed exists and many users' thumbnails are loading at once, move to downloading and hosting a cached copy (own storage/CDN) for reliability and speed. Check Discogs' API Terms of Use on image caching/redistribution before building that.
   Data Notes
   • Discogs API is the metadata backbone: text search, barcode lookup, and release detail (genre, style, year, format, tracklist, cover images).
   • Store both master_id (the album) and release_id (the exact pressing) per collection entry — needed for the ownership check and for showing which specific pressing a user owns.
   • The same album can appear as multiple, separate entries (different pressings/years) — sorting and filtering should handle this without treating it as a duplicate/error.
   • Every field pulled from Discogs (genre, year, format, etc.) must remain user-editable, since source data isn't always right.
   • Records with no Discogs match need full support as manually-entered entries, not a degraded state.
   Roadmap — V2
   • Custom sort/tags: user-defined genre groupings and freeform tags (e.g. "Sunday morning," "for parties")
   • Physical shelf order: a per-user, drag-to-reorder sequence that mirrors how records actually sit on the shelf
   Roadmap — V3
   • AI-suggested mood: an LLM reads each record's metadata (genre, style, year, tracklist) and suggests a mood tag from a fixed taxonomy
   • Always presented as a pre-filled suggestion, editable by the user — never an automatic, final label
   • Run once per record and cached, not computed live on every view
   Open Questions / Risks
   [ ] Confirm Discogs API Terms of Use on caching/re-hosting cover images before building any own-storage image pipeline
   [ ] Watch Discogs rate limits (60/min authenticated, 25/min unauthenticated) once barcode/OCR flows are adding more lookups per session
   [ ] Decide when search/sort/filter needs to move from client-side to a proper indexed query as real collections grow
   [ ] Design the empty/first-run state — the first thing a new user sees, and the natural place to prompt "add your first record"
