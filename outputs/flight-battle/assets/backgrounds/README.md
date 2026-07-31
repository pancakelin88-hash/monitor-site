# Backgrounds

Use this folder for cinematic plates, nebulae, HDRI references, and animated
backplates. Keep the original aspect ratio, add a compressed web variant, and
declare a procedural fallback such as `procedural:starfield` so a cold load
never blocks gameplay. Large imagery should have a smaller mobile variant.

当前已加入两套真实公版原作皮肤：`starry-night-3840.webp` 与
`monet-waterlilies.webp`。页面只在运行时叠加视差、星流、光晕和水面呼吸
层，原画母版位于 `backgrounds/originals/`，来源与授权记录见其中的 README。

本轮又加入六套高分辨率开放背景（统一裁切到 2400×1350 WebP，母版位于
`backgrounds/originals/open/`）：

- `aurora-space.webp` — NASA《Aurora Seen From Space》，Public Domain。
- `crab-nebula.webp` — NASA/ESA/STScI《Crab Nebula》，Public Domain；使用时保留 NASA、STScI、ESA 署名。
- `jupiter-aurora.webp` — NASA Hubble《Jupiter Aurora》，Public Domain。
- `moon-surface.webp` — `Moon surface 10k`，CC0 1.0。
- `omega-nebula.webp` — NASA/ESA Hubble《Omega Nebula》，Public Domain；使用时保留 NASA、STScI、ESA 署名。
- `sombrero-galaxy.webp` — NASA/ESA Hubble《Sombrero Galaxy》，Public Domain；使用时保留 NASA、STScI、ESA 署名。

这些图不是静态铺底：页面会按背景配置叠加 drift、grain、星尘、扫描线、光带、
玻璃雨幕和指针视差；`motion-backgrounds.json` 保存每张图的来源、裁切与动态层。
