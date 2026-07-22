// Known seminar subjects keep their existing colors; anything else falls
// back to a deterministic pick from the palette so new/whole-level subjects
// still render consistently without editing this map.
const SUBJECT_COLORS: Record<string, string> = {
  Hardware: "bg-sh-medium-red",
  Frontend: "bg-sh-medium-blue",
  Backend: "bg-sh-medium-green",
  TIMI: "bg-sh-medium-yellow",
  Proyecto: "bg-gray-200",
  IA: "bg-tic-ia",
  "Desarrollo de Videojuegos": "bg-tic-juegos",
  IOT: "bg-tic-iot",
  "UX/UI": "bg-tic-impacto-social",
  "Arte de Videojuegos": "bg-tic-rv",
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

// Offering display names may append "-<offering name>" (see
// composeSubjectName in the backend) to disambiguate variants of the same
// subject, e.g. "Hardware-Turno Tarde", and/or " (<divisions>)" (see
// buildDisplayName in the backend) to disambiguate which courses a subject
// is offered to, e.g. "IA (Z)". Colors should key off the subject alone so
// every variant of a subject renders consistently.
const getBaseSubjectName = (subject: string): string =>
  subject.split("-")[0].replace(/\s*\([^)]*\)\s*$/, "").trim();

export const getSubjectColorClass = (subject: string): string => {
  const base = getBaseSubjectName(subject);
  return SUBJECT_COLORS[base] ?? FALLBACK_PALETTE[hashString(base) % FALLBACK_PALETTE.length];
};

export const getSlotClasses = (
  subject: string,
  personalized: boolean,
  isProjectSlot: boolean
): string => {
  const isProyecto = getBaseSubjectName(subject) === "Proyecto";
  const dimmed = personalized && isProyecto !== isProjectSlot;
  return dimmed
    ? `${getSubjectColorClass(subject)} opacity-10`
    : getSubjectColorClass(subject);
};
