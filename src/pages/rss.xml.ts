import { getPublishedDaily } from "../lib/daily";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET({ site }: { site?: URL }) {
  const baseUrl = site ?? new URL("https://example.com");
  const entries = await getPublishedDaily();
  const items = entries
    .map((entry) => {
      const url = new URL(`/daily/${entry.slug}`, baseUrl).toString();
      return `<item>
  <title>${escapeXml(entry.data.title)}</title>
  <link>${escapeXml(url)}</link>
  <guid>${escapeXml(url)}</guid>
  <pubDate>${new Date(`${entry.data.date}T00:00:00+08:00`).toUTCString()}</pubDate>
  <description>${escapeXml(entry.data.summary)}</description>
</item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>飞飞的 AI 自学力日报</title>
  <link>${escapeXml(baseUrl.toString())}</link>
  <description>每天 3 分钟，学会用 AI 真正把英语学进去。</description>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
