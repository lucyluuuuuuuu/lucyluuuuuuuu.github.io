# Lucy Lu Portfolio

从 Framer 迁移重建的作品集。页面、案例章节、导航和图片分开管理；使用 Node.js 生成普通静态 HTML，部署到 GitHub Pages，无第三方运行时依赖。

## 页面与内容位置

| 页面 | 保留的网址路径 | 编辑位置 |
| --- | --- | --- |
| 首页 | `/` | `src/content/home.json` |
| About | `/About-lucy-lu/` | `src/content/about/` |
| Espoirer | `/work/Espoirer/` | `src/content/espoirer/` |
| Conch.AI | `/work/Conch.AI/` | `src/content/conch-ai/` |
| Fleet.AI | `/work/Fleet.AI/` | `src/content/fleet-ai/` |

每个内容目录里的 `index.json` 决定章节顺序；编号和语义文件名帮助定位具体段落。每个章节有固定 `id`，用于页面目录和锚点跳转。修改标题时保留 `id`，已有章节链接就不会改变。

```text
src/
  data/
    site.json          # 姓名、简历、邮箱、导航、页脚
    pages.json         # 普通页面的路径、模板、发布状态
    projects.json      # 作品排序、卡片、路径、发布状态
  content/
    home.json
    about/             # About 的正文与图片
    conch-ai/           # 一个 JSON 文件对应一个案例章节
    fleet-ai/
    espoirer/
  components/          # 导航、页脚、卡片、内容块
  layouts/site.mjs      # 所有页面共用的 HTML 外壳和搜索元信息
  pages/               # 首页、About、作品详情、普通内容页模板
  styles/site.css      # 全站颜色、字号、布局和移动端规则
  scripts/site.js      # 手机菜单、轮播、图片放大
public/assets/
  images/<作品名>/     # 已本地化的原站图片和 GIF
  fonts/               # 原站字体
scripts/               # 构建、本地预览、链接检查
.github/workflows/     # GitHub Pages 自动发布
docs/                  # 维护、迁移记录
```

## 本地预览

需要 Node.js 20 或更新版本。不需要安装 npm 依赖。

```sh
npm run dev
```

打开终端显示的地址。修改内容后停止并重新运行预览命令。发布前检查：

```sh
npm run build
npm run check
```

生成的 `dist/` 不需手工编辑，也不提交到仓库。检查程序会验证页面路径、图片、章节锚点和是否仍引用 Framer 运行时。

## 发布到 GitHub Pages

建议仓库名为 `lucyluuuuuuuu.github.io`。上传源码后，在仓库的 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。以后向 `main` 提交更新，会先构建和检查，再自动发布。

目标 GitHub Pages 地址为 `https://lucyluuuuuuuu.github.io/`；这只是部署目标，是否已上线以 GitHub Actions 的部署结果为准。

普通项目仓库名也支持：工作流会自动添加相应路径前缀。

## 常见修改

- 修改首页介绍：`src/content/home.json`。
- 修改项目卡片或排序：`src/data/projects.json`。
- 修改简历、邮箱、Instagram：`src/data/site.json`。
- 修改案例某一段：找到对应 `src/content/<项目>/NN-章节名.json`。
- 隐藏作品：把 `projects.json` 中对应作品的 `published` 改为 `false`。首页卡片和相邻作品跳转会一起更新。
- 隐藏普通页面：把 `pages.json` 中相应页面的 `published` 改为 `false`，共用导航也会移除其入口。首页必须保留。
- 详细增删页面步骤见 [维护指南](docs/MAINTENANCE.md)。

## 迁移范围

保留五个原页面的 URL、正文、案例图片、GIF、原有外部简历与社交链接；重建共享布局和交互，并将素材放到本仓库。不是 Framer 编辑器工程，也不依赖 Framer 的托管和压缩运行时代码。布局与动画采用可维护的实现，未声称逐像素复制原站。

原站项目状态和数据保持原内容，例如 2023/2024 年的项目时间与状态，没有据此推断项目现在的进展。迁移记录与验证边界见 [迁移说明](docs/MIGRATION.md)。

作品、文字、图片与字体的权利仍归原权利人所有；本仓库未添加将这些素材重新授权为开源的许可证。
