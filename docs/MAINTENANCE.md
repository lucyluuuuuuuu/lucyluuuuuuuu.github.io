# 维护指南

## 1. 修改一个章节

例如修改 Conch.AI 的项目概述，打开 `src/content/conch-ai/02-i-project-overview.json`。

`heading` 是大标题，`eyebrow` 是标题上方的小标签，`blocks` 按页面显示顺序排列。

```json
{
  "id": "project-overview",
  "heading": "A clear section heading",
  "eyebrow": "Project overview",
  "blocks": [
    { "type": "richText", "html": "<p>正文。<strong>重点内容。</strong></p>" },
    { "type": "image", "src": "/assets/images/my-project/overview.png", "alt": "描述这张图的内容", "width": 1600, "height": 900 }
  ]
}
```

正文使用基础 HTML，支持段落、粗体、列表、链接。文件中的 `html` 是可信编辑内容，不用于直接接收访客提交的数据。

新增章节：创建新的章节 JSON，把文件名加入本目录 `index.json` 的 `sections` 数组。章节文件名决定定位方式，数组顺序决定展示顺序。

删除章节：先从数组移除文件名，再删除文件。修改后运行检查，确认没有其他章节仍指向它的 `#id`。

## 2. 新增一个作品

1. 在 `src/data/projects.json` 添加作品记录。`id` 使用小写英文和短横线；`path` 必须唯一，以 `/work/` 开头、以 `/` 结尾。
2. 创建 `src/content/<id>/`，参考现有项目复制 `index.json` 和章节文件。
3. 第一章是项目头部：`heading` 为案例标题；`blocks` 先列标签文字，再放一张封面图，随后是 Team、Tools、Duration、Status、My Responsibility 等信息。
4. 后面的章节为案例正文。所有章节的 `id` 必须在本页唯一。
5. 图片放到 `public/assets/images/<id>/`，内容中的路径写 `/assets/images/<id>/文件名`，不要包含 `public`。

```json
{
  "id": "new-project",
  "path": "/work/New-Project/",
  "name": "NEW PROJECT",
  "published": true,
  "summary": "一句话描述项目",
  "status": "Concept project",
  "tags": ["Product Design", "B2B"],
  "cover": "/assets/images/new-project/cover.png",
  "accent": "#8056cf"
}
```

首页和详情页底部的前后作品跳转自动生成，不需要逐页更改。

## 3. 新增普通页面

在 `src/data/pages.json` 添加：

```json
{
  "id": "notes",
  "path": "/notes/",
  "template": "content",
  "published": true,
  "title": "Notes — Lucy Lu",
  "heading": "Notes & experiments",
  "description": "Thoughts on design and the things I am learning."
}
```

创建 `src/content/notes/index.json` 和对应章节文件，格式与案例章节相同。普通内容页不需要特殊的第一章结构。

要把新页面放进顶部导航，在 `src/data/site.json` 的 `navigation` 中添加 `{ "label": "Notes", "href": "/notes/" }`。

## 4. 隐藏、删除、改名

临时下线优先设置 `published: false`，保留文件便于恢复。作品的首页入口和前后跳转会自动移除；普通页面的共用导航入口也会移除。

永久删除时，先移除配置记录，再删除内容目录与不再使用的图片。正文里手写的跨页链接仍需检查；链接检查程序会报出缺失目标。

标题改名不必修改路径。改变 `path` 会改变网址；已经分享的旧网址会变成 404。需要保留旧链接时，给旧路径增加静态跳转页，或在调整路由前单独处理重定向。

## 5. 跳转规则

- 同页章节：`#project-overview`。
- 其他页面：`/About-lucy-lu/`。
- 指定作品章节：`/work/Conch.AI/#i-project-overview`。
- 所有页面内的章节 `id` 都应长期稳定。
- 模板中的链接通过 `url()` 生成，支持 GitHub 项目仓库路径前缀。不要手写 `lucy-lu.com` 作为站内跳转地址。

## 6. 连接 lucy-lu.com

先确认 GitHub Pages 的默认地址可用，再切换域名。

1. 在 GitHub 仓库的 Pages 设置中添加自定义域名 `lucy-lu.com`。
2. 按 GitHub 当前官方文档，在域名服务商设置相应 DNS；等验证完成再启用 HTTPS。
3. 在仓库 **Settings → Secrets and variables → Actions → Variables** 添加 `SITE_URL`，值为 `https://lucy-lu.com`。工作流会采用根路径生成网页。
4. 同时把 `src/data/site.json` 中的 `url` 更新为 `https://lucy-lu.com`，让本地构建也生成正确的规范网址和站点地图。
5. 验证首页、About、三个作品详情页、图片和 HTTPS，再处理旧 Framer 订阅。

迁移代码不自动修改 DNS，也不自动取消 Framer 服务。

参考：[GitHub 自定义域名配置](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)。
