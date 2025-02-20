import { Course, Material, UnitData } from "./types";
import { Alpine as AlpineType } from "alpinejs";

declare global {
  var Alpine: AlpineType;
  var getSubjectData: (subject: string, course: string) => Promise<UnitData[]>;
  var getSubjectProgram: (subject: string) => Promise<string>;
  var getSubjectPresentation: (subject: string) => Promise<string>;
  var getSubjectRedoLinks: (
    subject: string
  ) => Promise<{ activitiesRedo: string; markedActivitiesRedo: string }>;
  var getSubjectMaterial: (subject: string) => Promise<Material[]>;
  var getCourseLink: (course: string) => Promise<string>;
  var fetchHTMLData: (url: string) => Promise<string>;
  var prepareCrumbs: () => {
    crumbs: Array<{ text: string; link: string }>;
    menu: Array<string>;
  };
}
