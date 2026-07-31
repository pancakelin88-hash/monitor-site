# Materials

Store tileable PBR maps and small material manifests here. Color maps use sRGB;
normal, roughness, and metallic maps use linear interpretation. Prefer WebP
for runtime delivery and keep large source masters outside the deployed tree.

Every material needs a preview, a license/source record, and a mobile-sized
variant or an explicit `null` in `manifest.json`.
