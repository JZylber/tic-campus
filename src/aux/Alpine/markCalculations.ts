import { round } from "../../entrypoint";
import {
  getAllActivities,
  getAllMarks,
  getStudents,
  getSubjectMarkingCriteria,
  getAllRedos,
  getAllCourses,
  getSubjectIds,
} from "../fetchData";

interface Activity {
  name: string;
  id: string;
  madeUp: boolean;
  comment: string;
}

interface ClassActivity extends Activity {
  done: boolean;
  compulsory: boolean;
}

interface MarkedActivity extends Activity {
  mark: number;
}

interface RedoActivity extends MarkedActivity {
  coveredActivities: string[];
}

interface MarkData {
  averageMark: number;
  classActivitiesContribution: number;
  markedActivitiesContribution: number;
  proportion: number;
  allMarkedActivitiesPassed: boolean;
  allCompulsoryClassActivitiesDone: boolean;
  finalMark: number;
}

class Student {
  name: string;
  surname: string;
  id: string;
  course: string;
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
    subjects: string[]
  ) {
    this.name = name;
    this.surname = surname;
    this.id = id;
    this.course = course;
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
  setRedo(subject: string, activity: RedoActivity) {
    this.subjectData[subject].redoActivities.push(activity);
    this.subjectData[subject].redos[activity.id] = activity.mark;
  }
  setProportion(subject: string, proportion: number) {
    this.subjectData[subject].finalMark.proportion = proportion;
  }
  private activitiesContribution(subject: string) {
    // 1 for each activity done, 1*mark/10 for each made up activity, compulsory activities are excluded
    // Filter out compulsory activities first
    const nonCompulsoryActivities = this.subjectData[
      subject
    ].classActivities.filter((activity) => !activity.compulsory);

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
    const markedActivities = this.subjectData[subject].markedActivities;
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
    const compulsoryActivities = this.subjectData[
      subject
    ].classActivities.filter((activity) => activity.compulsory);
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
}

export default () =>
  ({
    students: [],
    loading: true,
    async init() {
      console.log("Initializing mark calculations...");
      const sheetId = "1VZ_KPk4aZJFPlAgx188y0wW8p3psbbtZgix1L8a-5kE";
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
        await Promise.all([
          getSubjectMarkingCriteria("Tecnologías de la Información", sheetId),
          getSubjectMarkingCriteria(
            "Desarrollo de Aplicaciones Informáticas",
            sheetId
          ),
        ]),
        getSubjectIds(sheetId),
        getAllCourses(sheetId),
      ]);
      this.loading = false;
    },
  } as {
    students: Student[];
    loading: boolean;
    init: () => Promise<void>;
  });
