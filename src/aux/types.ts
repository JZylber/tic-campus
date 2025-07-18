export enum ContentType {
  activity = "Actividad",
  material = "Material",
  finalActivity = "Trabajo Práctico",
  survey = "Encuesta",
  makeup = "Recuperatorio",
}

export interface Content {
  id: number;
  name: string;
  topic: string;
  type: ContentType;
  unit: string;
  imgURL: string;
  textURL: string;
  handInURL: string;
  repositoryURL: string;
  latest: boolean;
  optional: boolean;
}

export interface Unit {
  name: string;
  order: number;
  contents: Array<Content>;
}

export interface Activity {
  id: number;
  name: string;
  done: boolean;
  inRevision: boolean;
  special: boolean;
  comment: string;
}

export interface MarkedActivity {
  id: number;
  name: string;
  mark: number;
  inRevision: boolean;
  comment: string;
}

export interface Redo {
  ids: Array<number>;
  name: string;
  mark: number;
  comment: string;
}

export interface Course {
  name: string;
  subject: string;
  grade: number;
  division: string;
  year: number;
}

export interface Material {
  name: string;
  link: string;
  image: string;
  description: string;
  type: string;
}

export enum Term {
  "1B" = "1B",
  "1C" = "1C",
  "3B" = "3B",
}

export interface FixedMark {
  mark: string;
  observation?: string;
  suggestion?: string;
}

export type FixedMarks = Record<Term, FixedMark | undefined>;
