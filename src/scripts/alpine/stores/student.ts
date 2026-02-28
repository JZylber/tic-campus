import type { Alpine } from "alpinejs";
import { courseRegex } from "./course";
import type { PageDataStore } from "./pageData";
import { fetchStudentData } from "../../APIcalls/studentData";

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
  id: Alpine.$persist("")
    .using(sessionStorage)
    .as("student_id") as unknown as string,
  loading: false,
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
  setStudent(name: string, surname: string, course: string, id: string) {
    /*if (!courseRegex.test(course)) {
      throw new Error(`Invalid course name: ${course}`);
    }*/
    this.name = name as string;
    this.surname = surname as string;
    this.course = course as string;
    this.id = id as string;
  },
  setSubject(subject: string) {
    this.subject = subject as string;
  },
  async getStudentData(subject: string, year: number) {
    this.setSubject(subject);
    this.loading = true;
    let studentName = null;
    const isOnCampus = (Alpine.store("pageData") as PageDataStore).onCampus;
    if (isOnCampus) {
      const data = await fetch(
        "https://campus.ort.edu.ar/ajaxactions/GetLoggedInData",
        {
          headers: {
            accept: "application/json",
          },
        },
      ).then((res) => res.json());
      const studentData = data.nombre.split("<br/>");
      studentName = {
        name: studentData[0],
        surname: studentData[1],
      };
    }
    let student = null;
    if (studentName) {
      const { course, id } = await fetchStudentData(
        studentName.name,
        studentName.surname,
        year,
      );
      if (id && course) {
        student = {
          name: studentName.name,
          surname: studentName.surname,
          course,
          id: id,
        };
      } else {
        student = {
          name: "",
          surname: "",
          course: "",
          id: "",
        };
      }
    }
    if (student) {
      this.setStudent(
        student.name,
        student.surname,
        student.course,
        student.id,
      );
    }
    this.loading = false;
  },
  isLoading() {
    return this.loading;
  },
});

export type AlpineStudentStore = ReturnType<typeof studentStore>;
export default studentStore;
