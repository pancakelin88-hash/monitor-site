# VFX

Store sprite sheets, masks, and effect metadata for muzzle flashes, impacts,
loot drops, trails, and scene transitions. Metadata should declare frame size,
fps, duration, blend mode, and tint channels. Keep effects additive and
bounded; reduced-motion mode must have a static fallback.

`motion-prompts.json` stores the reusable prompt language for starfield
crossing, twin moons, original-art flow, carrier fly-ins, chrome portals and
other Motion Site-style scenes. The page exposes a compact subset; the JSON is
the full prompt archive for future workstations.
