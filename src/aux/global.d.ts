import { Course, Material, UnitData, type FixedMarks } from "./types";
import { Alpine as AlpineType } from "alpinejs";

declare global {
  var Alpine: AlpineType;
  var getSubjectData: (
    subject: string,
    course: string,
    dataSheetId: string
  ) => Promise<UnitData[]>;
  var getSubjectProgram: (
    subject: string,
    dataSheetId: string
  ) => Promise<string>;
  var getSubjectPresentation: (
    subject: string,
    dataSheetId: string
  ) => Promise<string>;
  var getSubjectRedoLinks: (
    subject: string,
    dataSheetId: string
  ) => Promise<{ activitiesRedo: string; markedActivitiesRedo: string }>;
  var getSubjectMaterial: (
    subject: string,
    dataSheetId: string
  ) => Promise<Material[]>;
  var getCourseLink: (
    course: string,
    dataSheetId: string,
    subject: string | null
  ) => Promise<string>;
  var fetchHTMLData: (url: string) => Promise<string>;
  var prepareCrumbs: () => {
    crumbs: Array<{ text: string; link: string }>;
    menu: Array<string>;
  };
  var getFixedMarks: (
    studentId: number,
    dataSheetId: string
  ) => Promise<FixedMarks>;
  var getStudents: (dataSheetId: string) => Promise<
    Array<{
      DNI: number;
      name: string;
      surname: string;
      course: string;
    }>
  >;
}
