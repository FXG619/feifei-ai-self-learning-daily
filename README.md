# 飞飞的 AI 自学力日报

每天 3 分钟，学会用 AI 真正把英语学进去。

飞飞的 AI 自学力日报，是一个帮助中学生学习如何使用 AI 自学的免费内容站。第一版从中考英语切入，重点不是让 AI 替孩子学习，而是让孩子借助 AI 学会自学。

## 本地运行

安装依赖：

```bash
npm install
```

启动本地开发服务：

```bash
npm run dev
```

构建静态站点：

```bash
npm run build
```

校验内容和类型：

```bash
npm run validate:content
```

## 内容文件位置

日报内容放在：

```text
src/content/daily/
```

每篇日报一个 Markdown 文件，文件名建议使用：

```text
YYYY-MM-DD-title-slug.md
```

## 如何审核和发布

AI 生成或新写入的日报默认必须是：

```yaml
status: "draft"
```

飞飞人工审核通过后，再手动改成：

```yaml
status: "published"
```

只有 `published` 内容会出现在首页、`/daily` 和 `/rss.xml`。`draft` 内容不会公开展示，也不会进入 RSS。

## 页面入口

- 首页：`/`
- 往期日报：`/daily`
- 关于项目：`/about`
- RSS：`/rss.xml`

## 当前状态

当前还没有 AI 生成脚本。下一步会加入生成 draft 的本地流程，但不会自动发布内容。
