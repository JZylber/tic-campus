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

export interface UnitData {
  name: string;
  order: number;
  contents: Array<Content>;
}

export interface ActivityData {
  id: number;
  name: string;
  done: boolean;
  comment: string;
}

export interface MarkedActivityData {
  id: number;
  name: string;
  mark: number;
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
