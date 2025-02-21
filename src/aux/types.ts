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

export interface Course {
  name: string;
  subject: string;
  id: string;
  groupLink: string;
}

export interface Material {
  name: string;
  link: string;
  image: string;
  description: string;
  type: string;
}
