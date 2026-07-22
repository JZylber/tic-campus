import { fetchSubjects } from "./APIcalls/dashboard";

// Derives valid (year, level) pairs for the Proyecto pages from whatever
// "Proyecto" offerings actually exist in the catalog, instead of hardcoding
// which levels currently have one — Proyecto is offered per-level (every
// division shares the same offering), so this collapses the per-course rows
// fetchSubjects() returns down to their unique (year, level) pairs.
export async function getProyectoLevelPaths(): Promise<
  Array<{ params: { year: string; level: string } }>
> {
  const subjects = await fetchSubjects();
  const pairs = new Set(
    subjects
      .filter((s) => s.name === "Proyecto")
      .map((s) => `${s.year}-${s.level}`),
  );
  return [...pairs].map((pair) => {
    const [year, level] = pair.split("-");
    return { params: { year, level } };
  });
}
