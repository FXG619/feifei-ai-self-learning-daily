import fs from "node:fs";
import path from "node:path";
import { parse, stringify } from "yaml";

type SourceItem = {
  id?: string;
  day_number?: number;
  title: string;
  category: string;
  english_focus: string;
  one_action: string;
  student_action: string;
  parent_question: string;
  ai_prompt: string;
  risk_note: string;
};

const root = process.cwd();
const dailyDir = path.join(root, "src/content/daily");

const slugMap: Record<string, string> = {
  "不要问 AI 要答案，要让 AI 追问你": "dont-ask-ai-for-answer",
  "阅读题先找原文依据，再看选项": "find-evidence-before-options",
  "错题不是抄答案，而是找错因": "find-the-reason-of-mistake",
  "背单词不是背中文，而是造场景句": "word-scenes-not-translation",
  "作文不是让 AI 代写，而是让 AI 追问表达": "writing-ai-asks-detail",
  "听力不是盲听，而是先预测关键词": "listening-predict-keywords",
  "一周复盘：我最常见的错因是什么": "weekly-common-mistake-review",
};

function readYaml<T>(relativePath: string): T {
  return parse(fs.readFileSync(path.join(root, relativePath), "utf8")) as T;
}

function readText(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function todayInShanghai() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function getExistingTitles() {
  if (!fs.existsSync(dailyDir)) return new Set<string>();
  const titles = fs
    .readdirSync(dailyDir)
    .filter((file: string) => file.endsWith(".md"))
    .map((file: string) =>
      fs.readFileSync(path.join(dailyDir, file), "utf8").match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1],
    )
    .filter(Boolean) as string[];
  return new Set(titles);
}

function selectSourceItem(startupPlan: SourceItem[], actions: SourceItem[]) {
  const existingTitles = getExistingTitles();
  const startupCandidate = startupPlan.find((item) => !existingTitles.has(item.title));
  if (startupCandidate) return { item: startupCandidate, sourceLabel: `startup-plan day ${startupCandidate.day_number}` };

  const actionCandidate = actions.find((item) => !existingTitles.has(item.title)) ?? actions[0];
  return { item: actionCandidate, sourceLabel: `actions.yaml ${actionCandidate.id ?? actionCandidate.title}` };
}

function slugify(item: SourceItem) {
  if (item.id) return item.id;
  if (slugMap[item.title]) return slugMap[item.title];
  const ascii = item.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return ascii || `day-${item.day_number ?? "draft"}`;
}

function uniqueFilePath(date: string, slug: string) {
  let candidate = path.join(dailyDir, `${date}-${slug}.md`);
  let index = 2;
  while (fs.existsSync(candidate)) {
    candidate = path.join(dailyDir, `${date}-${slug}-${index}.md`);
    index += 1;
  }
  return candidate;
}

function buildBody(item: SourceItem) {
  return `## 今天只做一件事

${item.one_action}

今天只练这一个小动作，不多加任务，也不追求一次学很多。孩子先把自己的想法说出来，再用 AI 做陪练和检查。

## 今日主题

${item.title}

这个主题的重点不是让 AI 替孩子完成学习，而是让孩子借助 AI 看清自己的思路。AI 可以追问、提醒、检查，但第一步必须由孩子自己启动。

## 为什么重要

中考英语学习里，很多问题不是孩子完全不会，而是不知道自己卡在哪里。只看答案，孩子容易觉得“我懂了”；但下次换一道题，又会在同样的地方犹豫。

把任务缩小成一个可执行动作，可以让孩子少一点压力，多一点掌控感。今天只需要把一个动作做完整：先表达自己的判断，再让 AI 帮忙检查思路。

## 今日中考英语自学动作

${item.student_action}

做的时候不用追求完美。孩子只要能说出“我现在这样想”，再根据 AI 的追问回到题目、原文或自己的句子里检查一次，就已经是在练自学能力。

## 今日 AI 陪练提示词

${item.ai_prompt}

## 家长今天可以问

${item.parent_question}

## 不要误用 AI

${item.risk_note}

今天不要让 AI 直接给答案，也不要把 AI 生成的内容当成孩子自己的作业。AI 的角色是陪孩子追问和检查，不是替孩子完成。

## 今日小结

今天只做一件事：${item.one_action}

如果孩子愿意先说出自己的想法，再让 AI 追问或检查，他就在练习自学力。这个动作很小，但它会帮助孩子从“等答案”慢慢转向“会思考、会提问、会复盘”。`;
}

function buildFrontmatter(item: SourceItem, sourceLabel: string, date: string) {
  return {
    title: item.title,
    date,
    status: "draft",
    day_number: item.day_number ?? 1,
    category: item.category,
    focus: "中考英语",
    tags: Array.from(new Set([item.category, item.english_focus, "AI自学"])),
    summary: `今天只做一件事：${item.one_action}`,
    source_type: "action_library",
    risk_level: "low",
    editorial_notes: [
      `本篇来自 ${sourceLabel}。`,
      `学习力分类：${item.category}。`,
      "风险等级为 low，因为内容来自动作库，只提供低压力学习动作，不涉及政策、考试承诺、心理判断或工具推荐。",
      "仍需飞飞人工审核语言是否足够具体、温和，确认 AI 提示词没有引导孩子直接要答案。",
      "生成内容默认 draft，不能自动发布；审核通过后才可手动改为 published。",
    ],
  };
}

function stringifyFrontmatter(frontmatter: Record<string, unknown>) {
  return stringify(frontmatter)
    .trim()
    .replace(/^date: (\d{4}-\d{2}-\d{2})$/m, 'date: "$1"')
    .replace(/^status: (draft|published)$/m, 'status: "$1"')
    .replace(/^source_type: (action_library|source_digest|mixed)$/m, 'source_type: "$1"')
    .replace(/^risk_level: (low|medium|high)$/m, 'risk_level: "$1"');
}

function main() {
  fs.mkdirSync(dailyDir, { recursive: true });
  readText("prompts/editorial_rules.md");
  readText("prompts/style_guide.md");

  const startupPlan = readYaml<SourceItem[]>("src/data/startup-plan.yaml");
  const actions = readYaml<SourceItem[]>("src/data/actions.yaml");
  const { item, sourceLabel } = selectSourceItem(startupPlan, actions);
  const date = todayInShanghai();
  const filePath = uniqueFilePath(date, slugify(item));
  const frontmatter = buildFrontmatter(item, sourceLabel, date);
  const markdown = `---\n${stringifyFrontmatter(frontmatter)}\n---\n\n${buildBody(item)}\n`;

  fs.writeFileSync(filePath, markdown, "utf8");
  console.log(`Generated draft: ${path.relative(root, filePath)}`);
}

main();
