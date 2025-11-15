import {
  getAllActivities,
  getAllMarks,
  getStudents,
  getSubjectMarkingCriteria,
  getAllRedos,
  getAllCourses,
  getSubjectIds,
} from "../../fetchData";
import type { ClassActivity, MarkedActivity, RedoActivity } from "../../types";

export interface MarkData {
  averageMark: number;
  classActivitiesContribution: number;
  markedActivitiesContribution: number;
  proportion: number;
  allMarkedActivitiesPassed: boolean;
  allCompulsoryClassActivitiesDone: boolean;
  finalMark: number;
}

export class Student {
  name: string;
  surname: string;
  id: string;
  course: string;
  withRevisions: boolean;
  private subjectData: Record<
    string,
    {
      classActivities: ClassActivity[];
      markedActivities: MarkedActivity[];
      redoActivities: RedoActivity[];
      redos: Record<string, number>;
      finalMark: MarkData;
    }
  >;

  constructor(
    name: string,
    surname: string,
    id: string,
    course: string,
    subjects: string[],
    withRevisions: boolean = false
  ) {
    this.name = name;
    this.surname = surname;
    this.id = id;
    this.course = course;
    this.withRevisions = withRevisions;
    this.subjectData = subjects.reduce((acc, subject) => {
      acc[subject] = {
        classActivities: [],
        markedActivities: [],
        redoActivities: [],
        redos: {},
        finalMark: {
          averageMark: 0,
          classActivitiesContribution: 0,
          markedActivitiesContribution: 0,
          proportion: 0.7,
          allMarkedActivitiesPassed: true,
          allCompulsoryClassActivitiesDone: true,
          finalMark: 0,
        },
      };
      return acc;
    }, {} as Student["subjectData"]);
  }
  setClassActivity(subject: string, activity: ClassActivity) {
    this.subjectData[subject].classActivities.push(activity);
  }
  setClassActivityAsCompulsory(
    subject: string,
    activityId: string,
    compulsory: boolean
  ) {
    const activity = this.subjectData[subject].classActivities.find(
      (a) => a.id === activityId
    );
    if (activity) activity.compulsory = compulsory;
  }
  setMarkedActivity(subject: string, activity: MarkedActivity) {
    this.subjectData[subject].markedActivities.push(activity);
  }
  setInRevision(subject: string, activityId: string) {
    const classActivity = this.subjectData[subject].classActivities.find(
      (a) => a.id === activityId
    );
    if (classActivity) classActivity.inRevision = true;
    const markedActivity = this.subjectData[subject].markedActivities.find(
      (a) => a.id === activityId
    );
    if (markedActivity) markedActivity.inRevision = true;
  }
  setRedo(subject: string, activity: RedoActivity) {
    this.subjectData[subject].redoActivities.push(activity);
    const coveredActivities = activity.coveredActivities;
    // For each covered activity, find in markedActivities and classActivities and set madeUp to true
    coveredActivities.forEach((activityId) => {
      this.subjectData[subject].redos[activityId] = activity.mark;
      const markedActivity = this.subjectData[subject].markedActivities.find(
        (a) => a.id === activityId
      );
      if (markedActivity) markedActivity.madeUp = true;
      const classActivity = this.subjectData[subject].classActivities.find(
        (a) => a.id === activityId
      );
      if (classActivity) classActivity.madeUp = true;
    });
  }
  setProportion(subject: string, proportion: number) {
    this.subjectData[subject].finalMark.proportion = proportion;
  }
  private activitiesContribution(subject: string) {
    // 1 for each activity done, 1*mark/10 for each made up activity, compulsory activities are excluded
    // Filter out compulsory activities first
    // If withRevisions is true, also filter out activities in revision
    const nonCompulsoryActivities = this.subjectData[
      subject
    ].classActivities.filter(
      (activity) =>
        !activity.compulsory && (!this.withRevisions || !activity.inRevision)
    );

    const classActivitiesTotalContribution = nonCompulsoryActivities.reduce(
      (acc, activity) => {
        const madeUp = this.subjectData[subject].redos[activity.id];
        if (madeUp !== undefined) {
          acc += madeUp / 10;
          return acc;
        }
        if (activity.done) acc += 1;
        return acc;
      },
      0
    );
    // Count ALL non-compulsory activities, even if not done
    const amountOfClassActivities = nonCompulsoryActivities.length;
    const proportion = this.subjectData[subject].finalMark.proportion;
    // Return (1 - proportion) * 10 if there are no activities
    if (amountOfClassActivities === 0) return (1 - proportion) * 10;
    // Return contribution out of 10 multiplied by (1 - proportion)
    return (
      (classActivitiesTotalContribution / amountOfClassActivities) *
      10 *
      (1 - proportion)
    );
  }
  private markedActivitiesContribution(subject: string) {
    // Average of all marked activities, each out of 10, multiplied by proportion. Made up activities count as their mark.
    // If withRevisions is true, filter out activities in revision
    const markedActivities = this.subjectData[subject].markedActivities.filter(
      (activity) => !this.withRevisions || !activity.inRevision
    );
    if (markedActivities.length === 0) return 0;
    const totalMarks = markedActivities.reduce((acc, activity) => {
      const madeUp = this.subjectData[subject].redos[activity.id];
      if (madeUp !== undefined) {
        acc += madeUp;
        return acc;
      }
      // If not made up, and mark is below 6, set allMarkedActivitiesPassed to false
      if (activity.mark < 6)
        this.subjectData[subject].finalMark.allMarkedActivitiesPassed = false;
      acc += activity.mark;
      return acc;
    }, 0);
    const averageMark = totalMarks / markedActivities.length;
    const proportion = this.subjectData[subject].finalMark.proportion;
    return averageMark * proportion;
  }
  calculateFinalMark(subject: string) {
    const classActivitiesContribution = this.activitiesContribution(subject);
    const markedActivitiesContribution =
      this.markedActivitiesContribution(subject);
    // Set contributions in finalMark rounded to 2 decimal places
    this.subjectData[subject].finalMark.markedActivitiesContribution = round(
      markedActivitiesContribution,
      2
    );
    this.subjectData[subject].finalMark.classActivitiesContribution = round(
      classActivitiesContribution,
      2
    );
    // Calculate averageMark adding classActivitiesContribution and markedActivitiesContribution and rounding to 2 decimal places
    const averageMark =
      classActivitiesContribution + markedActivitiesContribution;
    this.subjectData[subject].finalMark.averageMark = round(averageMark, 2);
    // Check if all compulsory activities are done
    // If withRevisions is true, ignore activities in revision
    const compulsoryActivities = this.subjectData[
      subject
    ].classActivities.filter(
      (activity) =>
        activity.compulsory && (!this.withRevisions || !activity.inRevision)
    );
    const allCompulsoryDone = compulsoryActivities.every((activity) => {
      const madeUp = this.subjectData[subject].redos[activity.id];
      if (madeUp !== undefined) return true;
      return activity.done;
    });
    // Set allCompulsoryClassActivitiesDone to the result
    this.subjectData[subject].finalMark.allCompulsoryClassActivitiesDone =
      allCompulsoryDone;
    // The final mark is rounded to the nearest integer.
    let finalMark = round(averageMark, 0);
    // Final mark cannot be below 1
    finalMark = Math.max(finalMark, 1);
    //If not all compulsory activities are done or not all marked activities are passed, final mark capped at 4
    if (
      !allCompulsoryDone ||
      !this.subjectData[subject].finalMark.allMarkedActivitiesPassed
    ) {
      finalMark = Math.min(finalMark, 4);
    }
    this.subjectData[subject].finalMark.finalMark = finalMark;
  }
  getFinalMarkData(subject: string) {
    return this.subjectData[subject].finalMark;
  }
  getActivities(subject: string) {
    return this.subjectData[subject].classActivities;
  }
  getMarkedActivities(subject: string) {
    return this.subjectData[subject].markedActivities;
  }
  getRedoActivities(subject: string) {
    return this.subjectData[subject].redoActivities;
  }
  getSubjects() {
    return Object.keys(this.subjectData);
  }
}

export const round = (num: number, decimals: number) => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};
export default () =>
  ({
    students: [],
    loading: true,
    async init() {
      const sheetId = "1VZ_KPk4aZJFPlAgx188y0wW8p3psbbtZgix1L8a-5kE";
      const subjects = [
        "Tecnologías de la Información",
        "Desarrollo de Aplicaciones Informáticas",
      ];
      const [
        students,
        classActivities,
        markedActivities,
        redoActivities,
        subjectData,
        unitData,
        coursesData,
      ] = await Promise.all([
        getStudents(sheetId),
        getAllActivities(sheetId),
        getAllMarks(sheetId),
        getAllRedos(sheetId),
        await Promise.all(
          subjects.map((subject) => getSubjectMarkingCriteria(subject, sheetId))
        ),
        getSubjectIds(sheetId),
        getAllCourses(sheetId),
      ]);
      // Map subjectData to an object with subject name as key
      const subjectDataMap = subjects.reduce((acc, subject, index) => {
        acc[subject] = subjectData[index];
        return acc;
      }, {} as Record<string, Awaited<ReturnType<typeof getSubjectMarkingCriteria>>>);
      // Create students and map them by student DNI
      const studentMap = students.reduce((acc, student) => {
        acc[student.DNI] = new Student(
          student.name,
          student.surname,
          student.DNI.toString(),
          student.course,
          [coursesData.find((c) => c.id === student.course)?.subject || ""]
        );
        return acc;
      }, {} as Record<string, Student>);
      // Cast all activities to ClassActivity and add them to the corresponding student
      classActivities.forEach((activity) => {
        // Find if activity is compulsory if is in some special activities list of subjectData
        const activitySubject = unitData[activity.id];
        const isSpecialActivity = subjectDataMap[
          activitySubject
        ].specialActivities.includes(activity.id);
        const classActivity: ClassActivity = {
          id: activity.id.toString(),
          name: activity.name,
          madeUp: false,
          comment: activity.comment || "",
          done: activity.done,
          compulsory: isSpecialActivity || false,
          inRevision: false,
        };
        studentMap[activity.studentId].setClassActivity(
          activitySubject,
          classActivity
        );
      });
      // Cast all marked activities to MarkedActivity and add them to the corresponding student
      markedActivities.forEach((activity) => {
        const activitySubject = unitData[activity.id];
        const markedActivity: MarkedActivity = {
          id: activity.id.toString(),
          name: activity.name,
          madeUp: false,
          comment: activity.comment || "",
          mark: activity.mark,
          inRevision: false,
        };
        studentMap[activity.studentId].setMarkedActivity(
          activitySubject,
          markedActivity
        );
      });
      // Cast all redo activities to RedoActivity and add them to the corresponding student
      redoActivities.forEach((activity) => {
        // Get first covered activity to determine subject
        const coveredActivity = activity.coveredActivities[0];
        const activitySubject = unitData[coveredActivity];
        const redoActivity: RedoActivity = {
          id: "0",
          name: activity.name,
          madeUp: false,
          comment: activity.comment || "",
          mark: activity.mark,
          coveredActivities: activity.coveredActivities.map((id) =>
            id.toString()
          ),
          inRevision: false,
        };
        studentMap[activity.studentId].setRedo(activitySubject, redoActivity);
      });
      // Set proportion for each student and subject
      Object.values(studentMap).forEach((student) => {
        student.getSubjects().forEach((subject) => {
          const proportion = subjectDataMap[subject].proportion;
          student.setProportion(subject, proportion);
          // Calculate final mark
          student.calculateFinalMark(subject);
        });
      });
      this.students = Object.values(studentMap);
      // Sort students by course, surname, name
      this.students.sort((a, b) => {
        if (a.course < b.course) return -1;
        if (a.course > b.course) return 1;
        if (a.surname < b.surname) return -1;
        if (a.surname > b.surname) return 1;
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      });
      this.loading = false;
    },
  } as {
    students: Student[];
    loading: boolean;
    init: () => Promise<void>;
  });
