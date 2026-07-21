// Known seminar subjects keep their existing colors; anything else falls
// back to a deterministic pick from the palette so new/whole-level subjects
// still render consistently without editing this map.
const SUBJECT_COLORS: Record<string, string> = {
  Hardware: "bg-sh-medium-red",
  Frontend: "bg-sh-medium-blue",
  Backend: "bg-sh-medium-green",
  TIMI: "bg-sh-medium-yellow",
  Proyecto: "bg-gray-200",
};

const FALLBACK_PALETTE = [
  "bg-sh-medium-red",
  "bg-sh-medium-blue",
  "bg-sh-medium-green",
  "bg-sh-medium-yellow",
  "bg-sh-light-purple",
];

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
};

export const getSubjectColorClass = (subject: string): string =>
  SUBJECT_COLORS[subject] ??
  FALLBACK_PALETTE[hashString(subject) % FALLBACK_PALETTE.length];

export const getSlotClasses = (
  subject: string,
  personalized: boolean,
  isProjectSlot: boolean
): string => {
  const isProyecto = subject === "Proyecto";
  const dimmed = personalized && isProyecto !== isProjectSlot;
  return dimmed
    ? `${getSubjectColorClass(subject)} opacity-10`
    : getSubjectColorClass(subject);
};
