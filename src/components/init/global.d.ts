import { Alpine as AlpineType } from "alpinejs";
import { Course, Material, UnitData } from "./types";

declare global {
  var Alpine: AlpineType;
  var getSubjectData: (subject: string, course: string) => Promise<UnitData[]>;
  var getSubjectProgram: (subject: string) => Promise<string>;
  var getSubjectPresentation: (subject: string) => Promise<string>;
  var getSubjectRedoLinks: (
    subject: string
  ) => Promise<{ activitiesRedo: string; markedActivitiesRedo: string }>;
  var getSubjectMaterial: (subject: string) => Promise<Material[]>;
  var cloneTemplate: (id: string) => HTMLElement | undefined;
  var Prism: any;
}
