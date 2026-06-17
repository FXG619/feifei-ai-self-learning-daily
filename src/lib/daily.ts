import { getCollection } from "astro:content";

export type DailyEntry = Awaited<ReturnType<typeof getPublishedDaily>>[number];

export async function getPublishedDaily() {
  const entries = await getCollection("daily", ({ data }) => data.status === "published");
  return entries.sort((a, b) => b.data.date.localeCompare(a.data.date));
}

export async function getLatestPublishedDaily() {
  const entries = await getPublishedDaily();
  return entries[0] ?? null;
}

export async function getPublishedTags() {
  const entries = await getPublishedDaily();
  return Array.from(new Set(entries.flatMap((entry) => entry.data.tags))).sort((a, b) =>
    a.localeCompare(b, "zh-CN"),
  );
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(`${date}T00:00:00`));
}

export function getSlug(entry: { slug: string }) {
  return entry.slug;
}
