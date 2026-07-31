# LinYH Motion Asset Library

`manifest.json` 是素材索引。新增背景、战机皮肤、装备掉落或动效预设时，先登记 `id`、文件和效果，再在机库/视觉宇宙页面挂载。

- `backgrounds`: 可替换的沉浸式底图与视差策略
- `ships`: 战机型号、角色和皮肤索引
- `equipment`: 掉落装备、颜色和属性修改
- `motionPresets`: Beams / Particles / Lightfall / Liquid Chrome 等动态预设

## 可追踪资产目录

`manifest.json` 的 `assets` 数组是部署文件的可追踪索引；每条记录都包含
版本、来源/许可证、SHA-256、预览、加载分组、回退策略和移动端变体。

- `models/`：glTF/GLB 战机与 LOD
- `materials/`：PBR 材质贴图
- `backgrounds/`：场景底图与 HDRI
- `vfx/`：爆炸、尾焰、掉落和转场特效
- `audio/`：音乐与音效
- `scenes/`：场景组合清单
- `previews/`：素材库缩略图

新增文件时，先在对应目录登记来源和授权，再计算
`shasum -a 256 <file>` 并把结果写入索引。完整的导出、加载和发布门槛见
[`../WORKFLOW.md`](../WORKFLOW.md)。
