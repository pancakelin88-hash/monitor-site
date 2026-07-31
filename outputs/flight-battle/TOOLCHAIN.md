# LinYH · Visual Toolchain

这套工作流把高质量素材和动态效果分成三层：

1. **素材层**：NASA / Wikimedia Commons 公版图、Poly Haven CC0 环境、Kenney CC0 UI、Khronos glTF 与 OpenGameArt 的逐项授权素材。
2. **制作层**：Blender 负责战机与 GLB，Krita 负责贴图和序列帧，glTF-Transform 负责压缩和移动端变体。
3. **运行层**：Canvas 2D 负责低延迟弹幕战斗，Three.js / React Three Fiber 用于机库、模型展示和后处理 Bloom。

## 快速接入

```bash
npm i three @react-three/fiber @react-three/drei
npm i -g @gltf-transform/cli
gltf-transform optimize input.glb output.glb --texture-compress webp
node tools/validate-assets.mjs
```

## 素材规则

- 每个资源先写入 `assets/manifest.json`，注明来源、授权、fallback 和移动端变体。
- 公版/CC0 资源保留来源链接；逐项授权素材不混入默认商用包。
- 大图只在展示页加载；局内优先使用 WebP、精灵图和程序化 fallback。
- 任何新背景都要同时登记 motion preset 和低动态模式下的静态表现。
