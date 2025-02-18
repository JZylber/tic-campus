import { Course, Material, UnitData } from "./types";

declare global {
  var getSubjectData: (subject: string, course: string) => Promise<UnitData[]>;
  var getSubjectProgram: (subject: string) => Promise<string>;
  var getSubjectPresentation: (subject: string) => Promise<string>;
  var getSubjectRedoLinks: (
    subject: string
  ) => Promise<{ activitiesRedo: string; markedActivitiesRedo: string }>;
  var getSubjectMaterial: (subject: string) => Promise<Material[]>;
  var getCourseLink: (course: string) => Promise<string>;
  var htmx: any;
}
