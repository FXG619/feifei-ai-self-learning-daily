import { defineCollection, z } from "astro:content";

const daily = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    status: z.enum(["draft", "published"]),
    day_number: z.number().int().positive(),
    category: z.enum(["目标力", "提问力", "判断力", "执行力", "复盘力", "产出力"]),
    focus: z.string().min(1),
    tags: z.array(z.string()),
    summary: z.string().min(1),
    source_type: z.enum(["action_library", "source_digest", "mixed"]),
    risk_level: z.enum(["low", "medium", "high"]),
  }),
});

export const collections = { daily };
