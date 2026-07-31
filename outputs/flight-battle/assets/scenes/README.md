# Scenes

Scene manifests bind models, materials, backgrounds, VFX, and audio into a
loadable composition. Keep them as small JSON files with stable ids and list
all dependencies explicitly. A scene must define a lightweight fallback so
the game can still render when an optional dependency is unavailable.
