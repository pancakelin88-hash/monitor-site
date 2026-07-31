# LinYH · Flight Battle asset workflow

This document is the small, reproducible asset pipeline for the static game in
this directory. It is intentionally compatible with the way larger teams
separate authoring, runtime loading, QA, and publishing. The game can still be
opened directly from `index.html`; the pipeline only adds traceability and
safe fallbacks.

## Pipeline at a glance

```text
brief / reference
      ↓
author (Blender, Krita, audio tool)
      ↓ export
models · materials · backgrounds · vfx · audio · scenes
      ↓ validate (dimensions, format, license, checksum)
previews + manifest.json
      ↓ QA (desktop, touch, reduced motion, low bandwidth)
publish (static files / Vercel)
```

Every shipped file receives one stable `id` and a semantic `version`. The
`assets/manifest.json` `assets` array is the source of truth for runtime and
release checks. The older `backgrounds`, `ships`, `equipment`, and motion arrays
remain in the manifest as compatibility fields for the existing UI.

The current catalog already contains a local generated starfield/painterly
backplate, a ship atlas, scene composition data in `assets/scenes/`, PBR
material presets in `assets/materials/`, and combat VFX timing data in
`assets/vfx/`. The 3D workshop also probes the Khronos FlightHelmet sample
(CC0-1.0) and falls back to the LinYH procedural fighter when the network is
unavailable.

## Folder contract

| Folder | Contents | Preferred formats |
| --- | --- | --- |
| `assets/models/` | glTF/GLB ships, props, and LOD variants | `.glb`, `.gltf` + `.bin` |
| `assets/materials/` | tileable PBR textures and material manifests | `.webp`, `.png`, `.jpg`, `.json` |
| `assets/backgrounds/` | large scene plates, HDRI references, and animated backplates | `.webp`, `.avif`, `.exr` |
| `assets/vfx/` | sprite sheets, masks, and effect metadata | `.webp`, `.png`, `.json` |
| `assets/audio/` | music, one-shots, and loops | `.ogg`, `.mp3`, `.wav` |
| `assets/scenes/` | scene compositions that bind models, materials, and VFX | `.json` |
| `assets/previews/` | small thumbnails used by the library and QA | `.webp`, `.png` |

Keep source files outside the deployed folder when they are too large for the
web build. A preview is always checked in so the catalog remains useful even
when a remote asset is unavailable.

## Runtime loading rules

1. Read `manifest.json` and select assets by `loadGroup` (for example,
   `backgrounds.core` or `models.hangar`).
2. Load GLB files with Three.js `GLTFLoader`; use Draco or Meshopt decoding when
   the file is compressed. Apply the declared mobile variant below 900 CSS px
   or when `prefers-reduced-data` is enabled.
3. If a request fails, use its `fallback` immediately. A missing decorative
   asset must never block the game loop or input handling.
4. Cache successful loads by `id + version`; a version bump is the explicit
   signal to invalidate a browser cache.
5. Respect `prefers-reduced-motion`: keep static composition and disable heavy
   post-processing, camera shake, and long particle trails.

This follows the same separation used by Unity Addressables (address/label
based asynchronous loading and release), Unreal's Asset Manager (primary vs
secondary assets and audit-friendly bundles), and Three.js `GLTFLoader` (lazy
GLB loading with an explicit decoder path).

## Authoring and export checklist

### Models

- Model the hero silhouette first; keep pivots and forward axis consistent
  (`+Z` forward, meters as units).
- Use a named collection for each ship and export glTF 2.0 with PBR metallic
  roughness materials. Include a lighter LOD for mobile.
- Apply transforms, remove hidden cameras/lights, and pack or colocate images
  before export. Record the Blender version and exporter options in the scene
  metadata.
- Run a local `GLTFLoader` smoke test before adding the entry to the manifest.

### Textures and backgrounds

- Prefer WebP/AVIF for web delivery; retain source masters separately.
- Use sRGB for color maps and linear data for normal/roughness/metallic maps.
- Provide a 1x preview and a mobile variant at roughly 50% of the desktop
  dimensions. Never stretch a preview into a runtime texture.
- For painterly or photographic references, record the source and license;
  only use assets that allow redistribution in this repository.

### VFX and audio

- Keep effect timing in metadata (duration, loop, blend mode, tint channels)
  instead of hard-coding it in the page.
- Sprite sheets should declare `frameWidth`, `frameHeight`, and `fps`.
- Normalize one-shots, trim silence, and provide an OGG/MP3 web version. Do not
  autoplay audio until the user has interacted with the page.

## Manifest entry

Each entry in `manifest.json.assets` must include the following fields:

```json
{
  "id": "ship-aether-glb",
  "version": "1.0.0",
  "type": "model",
  "file": "models/ship-aether-v1.glb",
  "license": "CC0-1.0",
  "source": "https://…",
  "sha256": "…",
  "preview": "previews/ship-aether-v1.webp",
  "loadGroup": "models.hangar",
  "fallback": "procedural:aether",
  "mobileVariant": "models/ship-aether-v1-mobile.glb"
}
```

`sha256` is calculated over the deployed file bytes (`shasum -a 256 FILE`).
Use `null` for a genuinely absent optional variant, rather than omitting the
field. `license` and `source` are release-blocking metadata: unknown or
non-redistributable sources stay out of the deployed catalog.

## QA and release gate

Before publishing a change:

1. Confirm every `file`, `preview`, `fallback`, and `mobileVariant` path either
   exists or is explicitly a procedural/runtime identifier.
2. Recompute SHA-256 values for changed files and verify the manifest is valid
   JSON.
3. Open the game at desktop and touch widths; exercise a cold load with the
   network throttled and with reduced motion enabled.
4. Verify no asset error prevents boot, pause, input, or scene switching.
5. Build/deploy the same tree that was QA'd. Keep the manifest version and
   changelog entry in the commit that publishes the asset.

Useful reference implementations:

- [Unity Addressables](https://docs.unity.cn/Packages/com.unity.addressables%401.17/manual/index.html)
- [Unreal Engine Asset Management](https://dev.epicgames.com/documentation/en-us/unreal-engine/asset-management-in-unreal-engine)
- [Blender glTF 2.0 exporter](https://docs.blender.org/manual/en/3.3/addons/import_export/scene_gltf2.html)
- [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)
- [Khronos glTF Sample Assets](https://github.khronos.org/glTF-Assets/about)
- [Poly Haven CC0 license](https://polyhaven.com/license)
