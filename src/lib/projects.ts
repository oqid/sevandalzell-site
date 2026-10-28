import { getCollection, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;
type LooseDate = Project['data']['start'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtDate(d: LooseDate) {
  return d.month ? `${MONTHS[d.month - 1]} ${d.year}` : String(d.year);
}

/** "2024–now", "Mar–Jun 2026", "2025" */
export function formatPeriod({ start, end, ongoing }: Project['data']) {
  if (ongoing) return `${fmtDate(start)}–now`;
  if (!end) return fmtDate(start);
  if (start.year === end.year && start.month && end.month) {
    return `${MONTHS[start.month - 1]}–${fmtDate(end)}`;
  }
  return `${fmtDate(start)}–${fmtDate(end)}`;
}

/** Published projects, in portfolio order (then newest first). */
export async function getProjects() {
  const all = await getCollection('projects', (p) => import.meta.env.DEV || !p.data.draft);
  return all.sort(
    (a, b) => a.data.order - b.data.order || b.data.start.year - a.data.start.year,
  );
}
