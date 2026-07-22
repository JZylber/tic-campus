import { fetchSubjectLevels } from "./APIcalls/offeringTimeSlots";

// Derives valid (year, level) pairs for the Proyecto pages from whatever
// "Proyecto" MANDATORY offerings actually exist in the catalog, instead of
// hardcoding which levels currently have one. Deliberately uses the
// templateId-agnostic /offerings/:subject/levels endpoint rather than
// /subjects — Proyecto pages aren't template-driven, and a level can be
// split across multiple offerings (e.g. level 4's AC/BD rotation groups)
// that never got a shared templateId.
export async function getProyectoLevelPaths(): Promise<
  Array<{ params: { year: string; level: string } }>
> {
  const pairs = await fetchSubjectLevels("Proyecto");
  return pairs.map(({ year, level }) => ({
    params: { year: String(year), level: String(level) },
  }));
}
