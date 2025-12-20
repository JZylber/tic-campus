import type { Alpine } from "alpinejs";
import { courseRegex } from "./course";
import type { PageDataStore } from "./pageData";
import { getStudentData } from "../../fetchData";

const studentStore = (Alpine: Alpine) => ({
  name: Alpine.$persist("")
    .using(sessionStorage)
    .as("student_name") as unknown as string,
  surname: Alpine.$persist("")
    .using(sessionStorage)
    .as("student_surname") as unknown as string,
  course: Alpine.$persist("")
    .using(sessionStorage)
    .as("student_course") as unknown as string,
  subject: Alpine.$persist("")
    .using(sessionStorage)
    .as("student_subject") as unknown as string,
  id: Alpine.$persist(-1)
    .using(sessionStorage)
    .as("student_id") as unknown as number,
  activities: [],
  marks: [],
  markData: {
    finalMark: null,
    averageMark: 0,
    proportion: 1,
    activities: {
      markContribution: 0,
      total: 0,
      done: 0,
    },
    markedActivities: {
      markContribution: 0,
      total: 0,
      passed: 0,
    },
  },
  dataSheetId: "",
  setStudent(name: string, surname: string, course: string, id: number) {
    if (!courseRegex.test(course)) {
      throw new Error(`Invalid course name: ${course}`);
    }
    this.name = name as string;
    this.surname = surname as string;
    this.course = course as string;
    this.id = id as number;
  },
  setSubject(subject: string) {
    this.subject = subject as string;
  },
  setDataSheetId(dataSheetId: string) {
    this.dataSheetId = dataSheetId as string;
  },
  async getStudentData(subject: string, course: string, dataSheetId: string) {
    this.setSubject(subject);
    this.setDataSheetId(dataSheetId);
    let studentName = null;
    const isOnCampus = (Alpine.store("pageData") as PageDataStore).onCampus;
    if (isOnCampus) {
      const data = await fetch(
        "https://campus.ort.edu.ar/ajaxactions/GetLoggedInData",
        {
          headers: {
            accept: "application/json",
          },
        }
      ).then((res) => res.json());
      const studentData = data.nombre.split("<br/>");
      studentName = {
        name: studentData[0],
        surname: studentData[1],
      };
    }
    let student = null;
    if (studentName) {
      student = await getStudentData(
        studentName.name,
        studentName.surname,
        course,
        dataSheetId
      );
    }
    if (student) {
      this.setStudent(
        student.name,
        student.surname,
        student.course,
        student.DNI
      );
    }
  },
});

export type AlpineStudentStore = ReturnType<typeof studentStore>;
export default studentStore;
