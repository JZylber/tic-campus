import type { AlpineComponent } from "alpinejs";
import { getFixedMarks } from "../../../fetchData";
import type { PageDataStore } from "../../stores/pageData";
import type { AlpineStudentStore } from "../../stores/student";
import type { FixedMarks } from "../../../types";

const fixedMarksData = () =>
  ({
    marks: undefined,
    loading: true,
    async getMarks() {
      const studentId = (Alpine.store("student") as AlpineStudentStore).id;
      const dataSheetId = (Alpine.store("pageData") as PageDataStore)
        .dataSheetId;
      if (studentId !== -1) {
        this.marks = await getFixedMarks(studentId, dataSheetId);
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
