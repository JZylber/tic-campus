import { backendURL } from "./shared";

export async function fetchStudentData(
  name: string,
  surname: string,
  year: number
): Promise<{
  course: string;
  id: string;
}> {
  try {
    // POST request with name, surname, and year in the body
    const response = await fetch(`${backendURL}/student`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, surname, year }),
    });
    if (!response.ok) {
      throw new Error(`Error fetching student data: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("No student data found");
    return { course: "", id: "" };
  }
}
