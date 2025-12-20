import Fuse from "fuse.js";
import type {
  ClassActivity,
  Content,
  FixedMark,
  FixedMarks,
  MarkedActivity,
  Material,
  RedoActivity,
  Term,
  Unit,
} from "./types";

const getSheetData = async ({
  sheetID,
  sheetName,
  query,
}: {
  sheetID: string;
  sheetName: string;
  query: string;
}) => {
  const base = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?`;
  const url = `${base}&sheet=${encodeURIComponent(
    sheetName
  )}&tq=${encodeURIComponent(query)}&headers=1`;

  const response = await fetch(url).then((res) => res.text());

  function responseToObjects(res: string) {
    // credit to Laurence Svekis https://www.udemy.com/course/sheet-data-ajax/
    const jsData = JSON.parse(res.substring(47).slice(0, -2));
    let data = [];
    const columns = jsData.table.cols;
    const rows = jsData.table.rows;
    let rowObject: Record<string, string | Date | number | boolean>;
    let cellData;
    let propName;
    for (let r = 0, rowMax = rows.length; r < rowMax; r++) {
      rowObject = {};
      for (let c = 0, colMax = columns.length; c < colMax; c++) {
        cellData = rows[r]["c"][c];
        propName = columns[c].label;
        if (cellData === null) {
          rowObject[propName] = "";
        } else if (
          typeof cellData["v"] == "string" &&
          cellData["v"].startsWith("Date")
        ) {
          rowObject[propName] = new Date(cellData["f"]);
        } else {
          rowObject[propName] = cellData["v"];
        }
      }
      data.push(rowObject);
    }
    return data;
  }
  return responseToObjects(response);
};

export const getAllCourses = async (dataSheetId: string) => {
  const sheetID = dataSheetId;
  let coursesQuery = getSheetData({
    sheetID,
    sheetName: "Curso",
    query: `SELECT *`,
  });
  const courses = (await coursesQuery) as Array<Record<string, string>>;
  return courses.map((course) => {
    return {
      name: course["Nombre"],
      id: course["Id"],
      subject: course["Materia"],
      groupLink: course["Link Grupo"],
    };
  });
};

export const getSubjectData = async (
  course: string,
  subject: string,
  dataSheetId: string
) => {
  const sheetID = dataSheetId;
  let unitsQuery = getSheetData({
    sheetID,
    sheetName: "Unidades",
    query: `SELECT * WHERE C = "${subject}"`,
  });
  let contentsQuery = getSheetData({
    sheetID,
    sheetName: "Contenidos",
    query: `SELECT *`,
  });
  let contentsPerCourseQuery = getSheetData({
    sheetID,
    sheetName: "ContenidosXCurso",
    query: `SELECT *`,
  });
  const [units, contents, unfilteredContentsPerCourse] = (await Promise.all([
    unitsQuery,
    contentsQuery,
    contentsPerCourseQuery,
  ])) as Array<Array<Record<string, string>>>;
  let contentsPerCourse = unfilteredContentsPerCourse.filter((content) => {
    let isVisible = content["Visible"];
    let isCourse = false;
    if (content["CursoXMateria"]) {
      isCourse = content["Curso"] === course && content["Materia"] === subject;
    } else {
      isCourse = content["Curso"] === course;
    }
    return isVisible && isCourse;
  });
  let availableContents: Array<Content> = contentsPerCourse.map((content) => {
    let contentData = contents.find(
      (c) => c["Id"] === content["Id Contenido"]
    ) as Record<string, string>;
    return {
      id: contentData["Id"].toString(),
      name: contentData["Nombre"],
      imgURL: contentData["Imagen"],
      topic: contentData["Tema"],
      type: contentData["Tipo"],
      textURL: contentData["Texto"],
      unit: contentData["Unidad"],
      handInURL: content["Entrega"],
      repositoryURL: content["Repositorio"],
      latest: content["En curso"].toString() === "true",
      optional: content["Opcional"]
        ? content["Opcional"].toString() === "true"
        : false,
    } as Content;
  });
  let contentsByUnit = availableContents.reduce(
    (acc: Record<string, Unit>, content) => {
      let unitName = content.unit;
      if (acc[unitName]) {
        acc[unitName].contents.push(content);
      } else {
        acc[unitName] = {
          name: unitName,
          order: parseInt(
            units.find((u) => u["Nombre"] === unitName)!["Orden"]
          ),
          contents: [content],
        };
      }
      return acc;
    },
    {}
  );
  let unitsData = Object.values(contentsByUnit).sort(
    (a, b) => a.order - b.order
  );
  return unitsData;
};

export const getSubjectPresentation = async (
  subject: string,
  dataSheetId: string
) => {
  const sheetID = dataSheetId;
  let programQuery = getSheetData({
    sheetID,
    sheetName: "Materia",
    query: `SELECT D WHERE B = "${subject}"`,
  });
  const programs = (await programQuery) as Array<Record<string, string>>;
  const program = programs[0]["Presentación"];
  return program;
};

export const getSubjectProgram = async (
  subject: string,
  dataSheetId: string
) => {
  const sheetID = dataSheetId;
  let programQuery = getSheetData({
    sheetID,
    sheetName: "Materia",
    query: `SELECT C WHERE B = "${subject}"`,
  });
  const programs = (await programQuery) as Array<Record<string, string>>;
  const program = programs[0]["Programa"];
  return program;
};

export const getSubjectMarkingCriteria = async (
  subject: string,
  dataSheetId: string
) => {
  const sheetID = dataSheetId;
  let programQuery = getSheetData({
    sheetID,
    sheetName: "Materia",
    query: `SELECT G,H WHERE B = "${subject}"`,
  });
  const criteriaTable = (await programQuery) as Array<
    Record<string, string | number>
  >;
  const criteria = {
    proportion: criteriaTable[0]["Proporción TPS/Nota"] as number,
    specialActivities: criteriaTable[0]["Actividades Especiales"]
      ? (criteriaTable[0]["Actividades Especiales"] as string)
          .split(",")
          .map((el) => el.trim())
      : [],
  };
  return criteria;
};

export const getSubjectRedoLinks = async (
  subject: string,
  dataSheetId: string
) => {
  const sheetID = dataSheetId;
  let redoLinksQuery = getSheetData({
    sheetID,
    sheetName: "Materia",
    query: `SELECT E,F WHERE B = "${subject}"`,
  });
  const redoLinks = (await redoLinksQuery) as Array<Record<string, string>>;
  return {
    activitiesRedo: redoLinks[0]["Reentrega Actividades"]
      ? redoLinks[0]["Reentrega Actividades"]
      : "",
    markedActivitiesRedo: redoLinks[0]["Reentrega TPs"]
      ? redoLinks[0]["Reentrega TPs"]
      : "",
  };
};

export const getSubjectMaterial = async (
  subject: string,
  dataSheetId: string
) => {
  const sheetID = dataSheetId;
  let materialQuery = getSheetData({
    sheetID,
    sheetName: "Material",
    query: `SELECT * WHERE B = "${subject}" AND H = TRUE`,
  });
  const materials = (await materialQuery) as Array<Record<string, string>>;
  return materials.map((material) => {
    return {
      name: material["Nombre"],
      link: material["Link"],
      image: material["Imagen"],
      description: material["Descripción"],
      type: material["Tipo"],
    } as Material;
  });
};

export const getCourseGroupLink = async (
  group: string,
  dataSheetId: string,
  subject: string | null = null
) => {
  if (subject) {
    const sheetID = dataSheetId;
    let groupLinkQuery = getSheetData({
      sheetID,
      sheetName: "MateriaXCurso",
      query: `SELECT C WHERE B = "${group}" AND D = "${subject}"`,
    });
    const groupLink = (await groupLinkQuery) as Array<Record<string, string>>;
    return groupLink[0]["Link Grupo"];
  } else {
    const sheetID = dataSheetId;
    let groupLinkQuery = getSheetData({
      sheetID,
      sheetName: "Curso",
      query: `SELECT C WHERE A = "${group}"`,
    });

    const groupLink = (await groupLinkQuery) as Array<Record<string, string>>;
    return groupLink[0]["Link Grupo"];
  }
};

export const getStudents = async (dataSheetId: string) => {
  const allStudents = (
    await getSheetData({
      sheetID: dataSheetId,
      sheetName: "Estudiante",
      query: `SELECT *`,
    })
  ).map((student) => {
    return {
      name: student["Nombre"] as string,
      surname: student["Apellido"] as string,
      course: student["Curso"] as string,
      DNI: student["DNI"] as number,
    };
  });
  return allStudents;
};

export const getStudentData = async (
  name: string,
  surname: string,
  course: string,
  dataSheetId: string
) => {
  const allStudents = await getSheetData({
    sheetID: dataSheetId,
    sheetName: "Estudiante",
    query: `SELECT * WHERE E = "${course}"`,
  });
  const fuse = new Fuse(allStudents, {
    keys: ["Nombre", "Apellido"],
    threshold: 0.4,
  });
  const students = fuse.search({ Nombre: name, Apellido: surname });
  const found = students.length > 0;
  if (found) {
    let student = students[0].item as Record<string, string | number>;
    return {
      name: student["Nombre"] as string,
      surname: student["Apellido"] as string,
      course: student["Curso"] as string,
      DNI: student["DNI"] as number,
    };
  } else {
    return null;
  }
};

const getStudentActivities = async (studentId: number, dataSheetId: string) => {
  const allActivities = await getSheetData({
    sheetID: dataSheetId,
    sheetName: "Actividad",
    query: `SELECT * WHERE B = ${studentId} AND J = TRUE`,
  });
  return allActivities.map(
    (activity) =>
      ({
        id: activity["Id Actividad"].toString(),
        name: activity["Nombre Actividad"] as string,
        done: activity["Realizada"] as boolean,
        comment: activity["Aclaración"] as string,
        compulsory: false,
        madeUp: false,
      } as ClassActivity)
  );
};

const getStudentMarks = async (studentId: number, dataSheetId: string) => {
  const allMarks = await getSheetData({
    sheetID: dataSheetId,
    sheetName: "Nota",
    query: `SELECT * WHERE B = ${studentId} AND J = TRUE`,
  });
  return allMarks.map(
    (mark) =>
      ({
        id: mark["Id Actividad"].toString(),
        name: mark["Nombre Actividad"] as string,
        mark: mark["Nota"] as number,
        comment: mark["Aclaración"] as string,
        madeUp: false,
      } as MarkedActivity)
  );
};

const getStudentRedos = async (studentId: number, dataSheetId: string) => {
  const allRedos = await getSheetData({
    sheetID: dataSheetId,
    sheetName: "Recuperatorio",
    query: `SELECT * WHERE B = ${studentId} AND J = TRUE`,
  });
  return allRedos.map(
    (redo) =>
      ({
        id: redo["Id Recuperatorio"] as string,
        coveredActivities: (redo["Id Actividad"] as string)
          .split(",")
          .map((id) => id.trim()),
        name: redo["Nombre Recuperatorio"] as string,
        mark: parseInt(redo["Nota"] as string),
        comment: redo["Aclaración"] as string,
        madeUp: false,
      } as RedoActivity)
  );
};

export const getActivitiesAndMarks = async (
  studentId: number,
  dataSheetId: string
) => {
  const activitiesPromise = getStudentActivities(studentId, dataSheetId);
  const marksPromise = getStudentMarks(studentId, dataSheetId);
  const redosPromise = getStudentRedos(studentId, dataSheetId);
  const [activities, marks, redos] = await Promise.all([
    activitiesPromise,
    marksPromise,
    redosPromise,
  ]);
  return {
    activities: activities as Array<ClassActivity>,
    marks: marks as Array<MarkedActivity>,
    studentRedos: redos as Array<RedoActivity>,
  };
};

export const getRedos = async (
  year: number,
  studentName: string,
  studentSurname: string,
  dataSheetId: string
) => {
  const activitiesRedoQuery = getSheetData({
    sheetID: dataSheetId,
    sheetName: `Reentrega A${year}`,
    query: `SELECT A,F WHERE B != TRUE`,
  });
  const marksRedoQuery = getSheetData({
    sheetID: dataSheetId,
    sheetName: `Reentrega N${year}`,
    query: `SELECT A,F WHERE B != TRUE`,
  });
  const [activitiesRedo, marksRedo] = await Promise.all([
    activitiesRedoQuery,
    marksRedoQuery,
  ]);
  const studentActivitiesRedo = activitiesRedo
    .filter((activity) =>
      (activity.Integrantes as string)
        .split(", ")
        .includes(`${studentSurname} - ${studentName}`)
    )
    .map((activity) => activity["Id Actividad"].toString());
  const studentMarksRedo = marksRedo
    .filter((mark) =>
      (mark.Integrantes as string)
        .split(", ")
        .includes(`${studentSurname} - ${studentName}`)
    )
    .map((mark) => mark["Id Actividad"].toString());
  const redos = studentActivitiesRedo.concat(studentMarksRedo) as Array<string>;
  return redos;
};

export const getFixedMarks = async (studentId: number, dataSheetId: string) => {
  const marks = (await getSheetData({
    sheetID: dataSheetId,
    sheetName: `Notas Fijas`,
    query: `SELECT F,G WHERE B = ${studentId} AND H = TRUE`,
  })) as { Tipo: Term; Valor: string }[];
  let termMarks = {} as FixedMarks;
  marks.forEach((mark) => {
    let newMark = {} as FixedMark;
    let splitValue = mark["Valor"].split("-");
    if (splitValue.length === 1) {
      newMark.mark = splitValue[0];
    } else if (splitValue.length === 3) {
      newMark.mark = splitValue[0];
      newMark.observation = splitValue[1];
      newMark.suggestion = splitValue[2];
    }
    termMarks[mark["Tipo"]] = newMark;
  });
  return termMarks;
};

export const getTimetable = async (dataSheetId: string) => {
  const cleanTimetable = await getSheetData({
    sheetID: dataSheetId,
    sheetName: `Horario`,
    query: `SELECT *`,
  });
  let timetable = {} as {
    [key: string]: Array<{
      day: string;
      block: number;
      room: string;
      teacher: string;
    }>;
  };
  // La rotación es la key solo mayúsculas
  const rotation = Object.keys(cleanTimetable[0]).find(
    (key) => key === key.toUpperCase()
  );
  if (rotation) {
    try {
      let currentBlock = 0;
      cleanTimetable.forEach((row) => {
        currentBlock = row[rotation]
          ? parseInt(row[rotation] as string)
          : currentBlock;
        for (const [day, assignedBlock] of Object.entries(row)) {
          if (
            assignedBlock !== null &&
            assignedBlock !== "" &&
            day !== rotation
          ) {
            const [subject, teacher, room] = (assignedBlock as string).split(
              "\n"
            );
            if (timetable.hasOwnProperty(subject)) {
              timetable[subject].push({
                day,
                teacher,
                room,
                block: currentBlock,
              });
            } else {
              timetable[subject] = [
                { day, teacher, room, block: currentBlock },
              ];
            }
          }
        }
      });
    } catch (error) {
      console.error("Error fetching timetable:", error);
    }
  }
  return timetable;
};

export const getStudentSeminars = async (
  studentId: number,
  dataSheetId: string
) => {
  try {
    const seminars = await getSheetData({
      sheetID: dataSheetId,
      sheetName: `Seminarios por Estudiante`,
      query: `SELECT F,G WHERE A = ${studentId}`,
    });
    return seminars.map(
      (seminar) => Object.values(seminar) as Array<string>
    )[0];
  } catch (error) {
    return [];
  }
};

export const getAllActivities = async (dataSheetId: string) => {
  const allActivities = await getSheetData({
    sheetID: dataSheetId,
    sheetName: "Actividad",
    query: `SELECT * WHERE J = TRUE`,
  });
  return allActivities.map((activity) => ({
    studentId: activity["DNI Estudiante"] as string,
    id: activity["Id Actividad"].toString() as string,
    name: activity["Nombre Actividad"] as string,
    done: activity["Realizada"] as boolean,
    comment: activity["Aclaración"] as string,
  }));
};

export const getAllMarks = async (dataSheetId: string) => {
  const allMarks = await getSheetData({
    sheetID: dataSheetId,
    sheetName: "Nota",
    query: `SELECT * WHERE J = TRUE`,
  });
  return allMarks.map((mark) => ({
    studentId: mark["DNI Estudiante"] as string,
    id: mark["Id Actividad"] as number,
    name: mark["Nombre Actividad"] as string,
    mark: mark["Nota"] as number,
    comment: mark["Aclaración"] as string,
  }));
};

export const getAllRedos = async (dataSheetId: string) => {
  const allRedos = await getSheetData({
    sheetID: dataSheetId,
    sheetName: "Recuperatorio",
    query: `SELECT * WHERE J = TRUE`,
  });
  return allRedos.map((redo) => ({
    coveredActivities: (redo["Id Actividad"] as string)
      .split(",")
      .map((id) => id.trim()),
    name: redo["Nombre Recuperatorio"] as string,
    mark: parseInt(redo["Nota"] as string),
    comment: redo["Aclaración"] as string,
    studentId: redo["DNI Estudiante"] as string,
  }));
};

export const getSubjectIds = async (dataSheetId: string) => {
  let unitsQuery = getSheetData({
    sheetID: dataSheetId,
    sheetName: "Unidades",
    query: `SELECT *`,
  });
  let contentsQuery = getSheetData({
    sheetID: dataSheetId,
    sheetName: "Contenidos",
    query: `SELECT *`,
  });
  const [units, contents] = (await Promise.all([
    unitsQuery,
    contentsQuery,
  ])) as Array<Array<Record<string, string>>>;
  // Construct a units per subject mapping
  let unitsPerSubject = units.reduce(
    (acc: Record<string, Array<string>>, unit) => {
      let subject = unit["Id Materia"];
      if (acc[subject]) {
        acc[subject].push(unit["Nombre"]);
      } else {
        acc[subject] = [unit["Nombre"]];
      }
      return acc;
    },
    {}
  );
  // Construct an activity per subject mapping
  let activitiesPerSubject = contents.reduce(
    (acc: Record<string, Array<number>>, content) => {
      let unit = content["Unidad"];
      let subject = Object.keys(unitsPerSubject).find((subject) =>
        unitsPerSubject[subject].includes(unit)
      );
      if (subject) {
        if (acc[subject]) {
          acc[subject].push(parseInt(content["Id"]));
        } else {
          acc[subject] = [parseInt(content["Id"])];
        }
      }
      return acc;
    },
    {}
  );
  // Construct an activity to subject mapping
  let subjectIds = Object.entries(activitiesPerSubject).reduce(
    (acc: Record<string, string>, [subject, activities]) => {
      activities.forEach((activityId) => {
        acc[activityId] = subject;
      });
      return acc;
    },
    {}
  );
  return subjectIds;
};
