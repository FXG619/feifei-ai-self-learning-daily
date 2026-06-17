import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";

type ValidationError = string;

const root = process.cwd();
const dailyDir = path.join(root, "src/content/daily");
const requiredFrontmatter = [
  "title",
  "date",
  "status",
  "day_number",
  "category",
  "focus",
  "tags",
  "summary",
  "source_type",
  "risk_level",
];
const requiredHeadings = [
  "今天只做一件事",
  "今日主题",
  "为什么重要",
  "今日中考英语自学动作",
  "今日 AI 陪练提示词",
  "家长今天可以问",
  "不要误用 AI",
  "今日小结",
];
const actionFields = ["one_action", "student_action", "parent_question", "ai_prompt", "risk_note"];
const prohibitedPhrases = [
  "保证提分",
  "一定提分",
  "直接复制答案",
  "让 AI 帮你完成作业",
  "不用自己思考",
  "直接问 AI 要答案",
];

function readYaml<T>(relativePath: string): T {
  return parse(fs.readFileSync(path.join(root, relativePath), "utf8")) as T;
}

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function extractFrontmatter(filePath: string) {
  const raw = fs.readFileSync(filePath, "utf8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { data: null, body: raw };
  return { data: parse(match[1]) as Record<string, unknown>, body: match[2] };
}

function sectionText(body: string, heading: string) {
  const match = body.match(new RegExp(`^## ${heading}\\n([\\s\\S]*?)(?=^## |\\z)`, "m"));
  return match?.[1]?.trim() ?? "";
}

function validateDailyFiles(errors: ValidationError[]) {
  const files = fs.readdirSync(dailyDir).filter((file: string) => file.endsWith(".md"));
  for (const file of files) {
    const relativePath = `src/content/daily/${file}`;
    const { data, body } = extractFrontmatter(path.join(dailyDir, file));
    if (!data) {
      errors.push(`${relativePath}: missing frontmatter`);
      continue;
    }

    for (const field of requiredFrontmatter) {
      if (data[field] === undefined || data[field] === null || data[field] === "") {
        errors.push(`${relativePath}: missing frontmatter field ${field}`);
      }
    }

    if (!["draft", "published"].includes(String(data.status))) {
      errors.push(`${relativePath}: status must be draft or published`);
    }

    if (data.status === "published") {
      for (const field of ["title", "date", "category", "summary"]) {
        if (!data[field]) errors.push(`${relativePath}: published content missing ${field}`);
      }
    }

    for (const heading of requiredHeadings) {
      if (!new RegExp(`^## ${heading}$`, "m").test(body)) {
        errors.push(`${relativePath}: missing heading ${heading}`);
      }
    }

    if (!sectionText(body, "今日 AI 陪练提示词")) {
      errors.push(`${relativePath}: missing AI prompt body`);
    }
    if (!sectionText(body, "家长今天可以问")) {
      errors.push(`${relativePath}: missing parent question body`);
    }
    if (!sectionText(body, "不要误用 AI")) {
      errors.push(`${relativePath}: missing risk reminder body`);
    }

    for (const phrase of prohibitedPhrases) {
      if (body.includes(phrase)) {
        errors.push(`${relativePath}: contains prohibited phrase ${phrase}`);
      }
    }
  }
}

function validateDataFiles(errors: ValidationError[]) {
  const startupPlan = readYaml<Record<string, unknown>[]>("src/data/startup-plan.yaml");
  const actions = readYaml<Record<string, unknown>[]>("src/data/actions.yaml");

  if (!Array.isArray(startupPlan) || startupPlan.length !== 7) {
    errors.push("src/data/startup-plan.yaml: must contain exactly 7 days");
  }

  if (!Array.isArray(actions) || actions.length < 30) {
    errors.push("src/data/actions.yaml: must contain at least 30 actions");
  }

  actions.forEach((action, index) => {
    for (const field of actionFields) {
      if (!action[field] || String(action[field]).trim() === "") {
        errors.push(`src/data/actions.yaml: action ${index + 1} missing ${field}`);
      }
    }
  });

  const combinedText = [
    read("src/data/startup-plan.yaml"),
    read("src/data/actions.yaml"),
    read("src/data/sources.yaml"),
  ].join("\n");
  for (const phrase of prohibitedPhrases) {
    if (combinedText.includes(phrase)) {
      errors.push(`src/data: contains prohibited phrase ${phrase}`);
    }
  }
}

function validatePublishedFilters(errors: ValidationError[]) {
  const checks = [
    ["src/pages/index.astro", "getLatestPublishedDaily"],
    ["src/pages/daily/index.astro", "getPublishedDaily"],
    ["src/pages/daily/[slug].astro", "getPublishedDaily"],
    ["src/pages/tags/[tag].astro", "getPublishedDaily"],
    ["src/pages/rss.xml.ts", "getPublishedDaily"],
  ];

  for (const [file, token] of checks) {
    if (!read(file).includes(token)) {
      errors.push(`${file}: expected ${token} so draft content stays hidden`);
    }
  }
}

function main() {
  const errors: ValidationError[] = [];
  validateDailyFiles(errors);
  validateDataFiles(errors);
  validatePublishedFilters(errors);

  if (errors.length > 0) {
    console.error(`validate-content failed with ${errors.length} error(s):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log("validate-content passed with 0 errors.");
}

main();
