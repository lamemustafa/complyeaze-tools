import { TOOLS, type ToolMeta } from "@complyeaze-tools/source-register";

export function getToolBySlug(slug: string): ToolMeta {
  const tool = TOOLS.find((candidate) => candidate.slug === slug);
  if (!tool) throw new Error(`Unknown tool slug: ${slug}`);
  return tool;
}

export function getLaunchTools(): ToolMeta[] {
  return TOOLS;
}
