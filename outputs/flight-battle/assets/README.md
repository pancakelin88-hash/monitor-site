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
- `sprites/`：统一 PBR 元素 atlas；局内弹体、掉落和敌机优先使用真实图像，程序化绘制只作回退
- `audio/`：音乐与音效
- `scenes/`：场景组合清单
- `previews/`：素材库缩略图

新增文件时，先在对应目录登记来源和授权，再计算
`shasum -a 256 <file>` 并把结果写入索引。完整的导出、加载和发布门槛见
[`../WORKFLOW.md`](../WORKFLOW.md)。

## 局内元素包

`sprites/linyh-elements-v1.svg` 是 1024×1024 的 16 格 atlas：8 种弹体、4 种掉落核心和 4 种敌机基型。每格使用倒角金属、镜面高光、发光核心和体积光，不依赖手绘几何；Canvas 按 cell 加载，移动端自动缩放。
