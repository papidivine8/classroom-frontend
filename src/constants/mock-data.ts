import { Subject } from "../types"

export const MOCK_SUBJECTS: Subject[] = [
     {
        id: 1,
        code: "CSC101",
        name: "Introduction to Computer Science",
        department: "Computer Science",
        description:
        "An introduction to computing fundamentals, computer systems, programming concepts, and the history of computer science.",
        createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    code: "MTH301",
    name: "Linear Algebra",
    department: "Mathematics",
    description:
      "Explores vectors, matrices, systems of linear equations, vector spaces, and linear transformations.",
    createdAt: new Date().toISOString(),
  },

  {
    id: 3,
    code: "ENG101",
    name: "Communication Skills",
    department: "English",
    description:
      "Develops effective written and verbal communication skills, academic writing, reading comprehension, and presentation techniques.",
    createdAt: new Date().toISOString(),
  },
]