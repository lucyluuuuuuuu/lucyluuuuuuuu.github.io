# Lucy Lu Portfolio

从 Framer 迁移到 GitHub Pages 的作品集，使用本地图片、字体、普通 HTML/CSS/JavaScript，不依赖 Framer 运行时。

网站：https://lucyluuuuuuuu.github.io/

## 找到要修改的位置

| 内容 | 编辑位置 |
| --- | --- |
| 首页布局 | `src/design/pages/home/` |
| About 布局 | `src/design/pages/about/` |
| 三个案例布局 | `src/design/pages/espoirer/`、`conch-ai/`、`fleet-ai/` |
| 各页正文 | `src/content/design-copy.json`，搜索页面上的原句 |
| 首页作品顺序、标题、封面、上下线 | `src/data/projects.json` |
| 页面地址、上下线 | `src/data/pages.json`、`projects.json` |
| 导航、简历、邮箱、Instagram | `src/data/site.json` |
| 某页的样式 | `src/styles/design/<页面名>.css` |
| 卡片、按钮、导航的共用样式 | `src/styles/design/work-card.css`、`button.css`、`navigation.css` 等 |
| 滚动、轮播、菜单交互 | `src/scripts/design.js` |

每页 `index.json` 按 desktop / tablet / phone 列出章节文件。文件中保留嵌套布局、可读的图层名称和本地图片路径。正文独立存储，三种布局引用同一份文字，避免改三遍。共用组件位于 `src/design/components/`。

2026-10-19 的还原更新恢复了原站浅色作品区、多列案例布局、各断点的字号与间距、原字体、卡片收起封面后露出按钮的悬停效果、滚动标签、连续图片组和手动轮播。还原依据是原站发布源文件中的布局、状态和动画数值。浏览器已检查主要页面与交互，但没有完成原站与新版每个像素、每一帧的全量对比。

## 本地预览与发布

需要 Node.js 20 或更新版本，无需安装 npm 依赖。

```sh
npm run dev
```

编辑后重新运行预览，或运行构建后刷新已打开的预览页面。

```sh
npm run build
npm run check
```

`main` 的提交会通过 GitHub Actions 自动构建、检查并发布到 GitHub Pages。`dist/` 是构建产物，不手工修改，也不提交。链接检查包括页面、锚点、图片、样式和字体。

新增页面、章节、隐藏作品与修改跳转见 [维护指南](docs/MAINTENANCE.md)。还原细节及验证边界见 [迁移说明](docs/MIGRATION.md)。

首次迁移的简化内容保存在 `examples/initial-migration-content/`，供新页面模板参考；这份归档不驱动当前五个页面。新的普通内容页和案例可继续使用 `src/content/<id>/index.json` 与现有通用模板，也可以复制已还原页面的布局。

原有 2023/2024 项目状态和文案保持原样。文字、图片、字体的权利仍归原权利人所有，本仓库没有添加重新授权这些素材的开源许可证。
