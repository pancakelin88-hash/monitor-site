# Models

Place production glTF 2.0 models here. Use `.glb` for a single deployable
file, or `.gltf` with colocated `.bin` and textures. Keep hero, LOD, and mobile
variants under the same stable asset id and register each deployed file in
`../manifest.json`.

Required metadata: scale/pivot, exporter version, license, source URL, and a
preview in `../previews/`. Use `fallback: "procedural:<ship-id>"` while a model
is still being authored.

## Installed CC0 packs

- `kenney-space-kit/`: 153 local GLB files; craft, hangars, gates, repair machinery, platforms, rockets, rovers, weapons and base modules.
- `kenney-space-station/`: 97 local GLB files; consoles, airlocks, gantries, floors, walls, pipes, storage and interior props.
- Curated runtime entries live in `model-index.json`; multi-model facility compositions live in `facility-index.json`.
