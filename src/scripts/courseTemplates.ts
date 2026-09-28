// Which sections each subject template (Subject.templateId) shows, in nav
// and slide order. Every key here gets course pages built for it by
// pages/[year]/[subject]/[course]/index.astro.
export type CourseSection =
  | "home"
  | "actividades"
  | "reentregas"
  | "programa"
  | "material"
  | "consultas"
  | "notas";

export interface CourseTemplate {
  presentation: boolean;
  // Swaps the Home section for InfoHome.
  infoHome?: boolean;
  // Empty = placeholder page, template not built yet.
  sections: CourseSection[];
}

const BASIC: CourseSection[] = ["home", "actividades", "programa", "material"];
const FULL: CourseSection[] = [
  "home",
  "actividades",
  "reentregas",
  "programa",
  "material",
  "consultas",
  "notas",
];

export const COURSE_TEMPLATES: Record<string, CourseTemplate> = {
  "CA-1": { presentation: false, sections: [] },
  "CA-2": { presentation: false, sections: BASIC },
  "CH-1": { presentation: false, sections: BASIC },
  "PO-1": { presentation: false, sections: BASIC },
  "LE-1": { presentation: true, sections: BASIC },
  "EZ-1": { presentation: true, infoHome: true, sections: BASIC },
  "SH-1": { presentation: true, sections: FULL },
  "SH-2": { presentation: true, sections: FULL },
  "SH-3": { presentation: false, sections: FULL },
  "SO-1": {
    presentation: false,
    sections: ["home", "actividades", "programa", "material", "consultas"],
  },
  "LU-1": { presentation: false, sections: ["home", "actividades", "material"] },
};
