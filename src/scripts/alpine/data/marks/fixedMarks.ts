import type { AlpineComponent } from "alpinejs";
import type { PageDataStore } from "../../stores/pageData";
import type { AlpineStudentStore } from "../../stores/student";
import type { FixedMarks } from "../../../types";
import { fetchFixedMarks } from "../../../APIcalls/studentData";

const fixedMarksData = (subject: string, course: string, year: number) =>
  ({
    marks: undefined,
    loading: true,
    async getMarks() {
      const studentId = (Alpine.store("student") as AlpineStudentStore).id;
      const dataSheetId = (Alpine.store("pageData") as PageDataStore)
        .dataSheetId;
      if (studentId !== "") {
        this.marks = await fetchFixedMarks(
          subject,
          course,
          year,
          studentId,
          dataSheetId
        );
        console.log("Fixed marks fetched:", this.marks);
        this.loading = false;
      }
    },
    async init() {
      await this.getMarks();
      this.$watch("$store.student.id", async (id: string) => {
        this.loading = true;
        await this.getMarks();
      });
    },
  } as AlpineComponent<{
    marks: FixedMarks | undefined;
    loading: boolean;
    getMarks: () => Promise<void>;
  }>);
export default fixedMarksData;
