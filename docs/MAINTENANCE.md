# 维护指南

## 修改现有页面

当前五个页面使用还原后的布局，不再读取首次迁移的扁平章节内容。旧内容已移到 `examples/initial-migration-content/`。

1. 在 `src/content/design-copy.json` 搜索页面上的原句，修改对应值。同一段文字被桌面、平板和手机共享。
2. 修改图片时，打开 `src/design/pages/<页面>/<断点>/` 中对应章节文件，修改 `image.src`、`image.alt`。图片放在 `public/assets/images/`。
3. 修改布局时，先看该页面 `index.json`。章节按显示顺序排列，断点为 desktop（1440px 起）、tablet（810–1439px）、phone（809px 以下）。
4. 章节内的 `label` 来自原图层名，`class` 对应 `src/styles/design/<页面>.css`，`children` 表示嵌套布局。`text` 引用正文文件的键；`include` 引用共用组件。
5. 原图层名相同或不清楚时，可以直接搜索页面原句、正文键或图片文件名定位。`docs/design-class-map.json` 保留原样式名与可读样式名的对应关系，便于继续核对原版。

例如 Conch.AI 的概述在 `src/design/pages/conch-ai/desktop/05-project-overview.json`；手机、平板的对应章节位于各自目录。字号、宽度、间距的调整应检查三个断点。

### 增删章节

添加一个章节文件，并在该页面 `index.json` 的三个断点列表中加入它；删除时从对应列表移除。章节的 `anchor` 是稳定跳转名，不随标题变化。通过 `#anchor` 或 `/work/Conch.AI/#anchor` 跳转。浏览器会将锚点绑定到当前可见的布局。

### 共用样式和动画

- `src/styles/design/work-card.css`：作品卡片尺寸、圆角、各断点布局和悬停状态。
- `src/styles/design/button.css`、`social.css`：按钮和社交图标。
- `src/styles/design.css`：基础排版、字体、滚动组件、键盘焦点、减少动态效果和共用过渡。
- `src/scripts/design.js`：连续滚动、滚动入场、菜单、锚点与轮播。
- `src/pages/design.mjs`：将布局、正文、路线组合成静态 HTML。

每个 `appear` 存储入场起止状态及时间参数；`motion` 描述 ticker 或 slideshow。首页职业标签 speed=55，图片 ticker speed=100，单位为像素/秒。轮播默认手动切换，可用箭头、圆点或拖动。减少动态效果偏好会关闭连续滚动和入场动画。

## 修改作品、导航和跳转

`src/data/projects.json` 决定首页作品的顺序、标题、说明、标签、封面、路径和发布状态。新增记录会生成首页入口；设为 `published: false` 会隐藏入口与已还原页面中的相关跳转。保持 `id` 稳定，修改 `path` 后站内原始链接也会解析到新路径。

`src/data/site.json` 管理导航名称、简历、邮箱和 Instagram。在 `navigation` 增加项目可添加顶部导航和手机菜单入口。新增导航对应的页面也必须发布。

## 新增案例

1. 在 `src/data/projects.json` 添加记录：

```json
{
  "id": "new-project",
  "path": "/work/New-Project/",
  "name": "NEW PROJECT",
  "published": true,
  "summary": "一句话描述项目",
  "status": "Concept project",
  "tags": ["Product Design", "B2B", "0 to 1", "Mobile"],
  "cover": "/assets/images/new-project/cover.png",
  "accent": "#8056cf"
}
```

2. 要延续某个案例的精确版式，复制 `src/design/pages/<已有案例>/` 为 `src/design/pages/new-project/`。复制需要修改的正文键并更新引用，避免改动旧案例共享文字。页面路径由项目记录提供。
3. 要使用简洁通用模板，创建 `src/content/new-project/index.json`，其 `sections` 为章节文件名数组。可参考 `examples/initial-migration-content/conch-ai/`。第一章节需包含 `heading` 和 `blocks`，其中一项为封面 image。没有 design 布局的项目会采用这个模板。
4. 新图片放在 `public/assets/images/new-project/`。检查图片、内容和链接后构建。

首页卡片沿用原版样式。原版卡片设计为四个主要标签；若要增加标签数量，需要同时调整卡片结构和各断点尺寸。案例底部的相关作品来自该案例的章节布局，可按需增加或改选；下线的目标会自动移除。

## 新增普通页面

在 `src/data/pages.json` 添加：

```json
{
  "id": "notes",
  "path": "/notes/",
  "template": "content",
  "published": true,
  "title": "Notes — Lucy Lu",
  "description": "Thoughts on design"
}
```

创建 `src/content/notes/index.json`：

```json
{ "sections": ["01-introduction.json"] }
```

创建 `01-introduction.json`：

```json
{
  "id": "introduction",
  "heading": "Notes & experiments",
  "blocks": [{ "type": "richText", "html": "<p>正文。</p>" }]
}
```

然后在 `site.json` 的 navigation 中添加 `{ "label": "Notes", "href": "/notes/" }`。这类新页面使用 `src/styles/site.css` 的通用样式；需要原版版式时可复制设计布局。

## 隐藏、删除和发布

临时隐藏优先用 `published: false`。永久删除前先移除配置记录，再删除对应内容、布局和不再使用的图片。首页必须保持发布。改网址后，已分享的旧网址不会自动重定向；需要时另加重定向页。

发布前运行 `npm run build` 与 `npm run check`，并预览桌面、平板和手机。向 main 提交后，GitHub Actions 自动发布。不要修改构建目录 dist。

## 后续连接 lucy-lu.com

当前域名仍由 Framer 提供。需要切换时，在 GitHub Pages 添加自定义域名、按域名服务商配置 DNS，再启用 HTTPS；同时更新 `site.json` 的 url 和 GitHub Actions 的 SITE_URL 变量。参考 [GitHub 自定义域名文档](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)。
