// A subject's background color also fixes its text colors: dark
// backgrounds pair with white/light-gray text, light backgrounds with
// black/medium-gray text, so the two never drift out of sync.
interface SubjectColor {
  bg: string;
  text: "text-sh-black" | "text-white";
}

// Known seminar subjects keep their existing colors; anything else falls
// back to a deterministic pick from the palette so new/whole-level subjects
// still render consistently without editing this map.
const SUBJECT_COLORS: Record<string, SubjectColor> = {
  Hardware: { bg: "bg-tic-iot", text: "text-white" },
  Frontend: { bg: "bg-tic-3d", text: "text-white" },
  Backend: { bg: "bg-tic-app", text: "text-sh-black" },
  TIMI: { bg: "bg-tic-arte", text: "text-sh-black" },
  Proyecto: { bg: "bg-gray-200", text: "text-sh-black" },
  IA: { bg: "bg-tic-ia", text: "text-sh-black" },
  "Desarrollo de Videojuegos": { bg: "bg-tic-juegos", text: "text-sh-black" },
  IOT: { bg: "bg-tic-iot", text: "text-white" },
  "UX/UI": { bg: "bg-tic-impacto-social", text: "text-white" },
  "Arte de Videojuegos": { bg: "bg-tic-rv", text: "text-sh-black" },
};

const FALLBACK_PALETTE: SubjectColor[] = [
  { bg: "bg-sh-medium-red", text: "text-sh-black" },
  { bg: "bg-sh-medium-blue", text: "text-sh-black" },
  { bg: "bg-sh-medium-green", text: "text-sh-black" },
  { bg: "bg-sh-medium-yellow", text: "text-sh-black" },
  { bg: "bg-sh-light-purple", text: "text-sh-black" },
];

// Secondary text (room/teacher) is a step lower in contrast than the
// primary subject label, per background: gray-600 reads fine on light
// backgrounds; the dark-background pairing needs a light gray instead.
const SECONDARY_TEXT_BY_PRIMARY: Record<SubjectColor["text"], string> = {
  "text-sh-black": "text-gray-600",
  "text-white": "text-gray-200",
};

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
  subject
    .split("-")[0]
    .replace(/\s*\([^)]*\)\s*$/, "")
    .trim();

const getSubjectColor = (subject: string): SubjectColor => {
  const base = getBaseSubjectName(subject);
  return (
    SUBJECT_COLORS[base] ??
    FALLBACK_PALETTE[hashString(base) % FALLBACK_PALETTE.length]
  );
};

export const getSubjectColorClass = (subject: string): string => {
  const { bg, text } = getSubjectColor(subject);
  return `${bg} ${text}`;
};

export const getSubjectSecondaryTextClass = (subject: string): string =>
  SECONDARY_TEXT_BY_PRIMARY[getSubjectColor(subject).text];
