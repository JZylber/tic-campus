import { WEEKDAY_TO_DAY, type TimetableBySubject } from "./timetableLayout";
import type { OfferingWithSlots } from "./APIcalls/offeringTimeSlots";

type ResolvableEntry = {
  offering: OfferingWithSlots;
  day: string;
  block: number;
  room: string;
};

// Term-specific offerings (FIRST/SECOND) beat annual ones (BOTH) for the
// selected cuatrimestre; among equally term-specific offerings, an OPTIONAL
// one the student chose beats an inherited MANDATORY one.
function overlapScore(offering: OfferingWithSlots): number {
  return (offering.semester !== "BOTH" ? 2 : 0) + (offering.kind === "OPTIONAL" ? 1 : 0);
}

// Steps overlapping offerings at the same grid position down to the
// highest-scoring one(s) per overlapScore, flagging ties as `conflict`
// instead of silently dropping them. Shared by the student's own ("Propios")
// timetable and the Docentes/Tutores per-student lookup so both resolve
// overlaps identically. Callers must pre-filter `offerings` by semester and
// by whichever student/course scoping applies to them.
export function resolveOfferingsTimetable(offerings: OfferingWithSlots[]): TimetableBySubject {
  const entries: ResolvableEntry[] = offerings.flatMap((offering) =>
    offering.timeSlots.map((slot) => ({
      offering,
      day: WEEKDAY_TO_DAY[slot.day],
      block: slot.slot,
      room: slot.classroom ?? "",
    })),
  );

  const byPosition = new Map<string, ResolvableEntry[]>();
  for (const entry of entries) {
    const key = `${entry.day}-${entry.block}`;
    const group = byPosition.get(key);
    if (group) group.push(entry);
    else byPosition.set(key, [entry]);
  }

  const timetable: TimetableBySubject = {};
  for (const group of byPosition.values()) {
    const maxScore = Math.max(...group.map((e) => overlapScore(e.offering)));
    const winners = group.filter((e) => overlapScore(e.offering) === maxScore);
    const conflict = winners.length > 1;
    for (const entry of winners) {
      const list = (timetable[entry.offering.displayName] ??= []);
      list.push({
        day: entry.day,
        block: entry.block,
        room: entry.room,
        teacher: "",
        conflict,
      });
    }
  }
  return timetable;
}
