import { Department, Course, Subject, User, Student, Faculty, Question, Exam, ExamResult } from '../types';
import * as seed from '../constants/initialData';

const KEYS = {
  DEPARTMENTS: 'exam_dept',
  COURSES: 'exam_courses',
  SUBJECTS: 'exam_subjects',
  USERS: 'exam_users',
  QUESTIONS: 'exam_questions',
  EXAMS: 'exam_exams',
  RESULTS: 'exam_results'
};

export const initDb = (): void => {
  if (!localStorage.getItem(KEYS.DEPARTMENTS)) {
    localStorage.setItem(KEYS.DEPARTMENTS, JSON.stringify(seed.INITIAL_DEPARTMENTS));
  }
  if (!localStorage.getItem(KEYS.COURSES)) {
    localStorage.setItem(KEYS.COURSES, JSON.stringify(seed.INITIAL_COURSES));
  }
  if (!localStorage.getItem(KEYS.SUBJECTS)) {
    localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(seed.INITIAL_SUBJECTS));
  }
  if (!localStorage.getItem(KEYS.USERS)) {
    localStorage.setItem(KEYS.USERS, JSON.stringify(seed.INITIAL_USERS));
  }
  if (!localStorage.getItem(KEYS.QUESTIONS)) {
    localStorage.setItem(KEYS.QUESTIONS, JSON.stringify(seed.INITIAL_QUESTIONS));
  }
  if (!localStorage.getItem(KEYS.EXAMS)) {
    localStorage.setItem(KEYS.EXAMS, JSON.stringify(seed.INITIAL_EXAMS));
  }
  if (!localStorage.getItem(KEYS.RESULTS)) {
    localStorage.setItem(KEYS.RESULTS, JSON.stringify(seed.INITIAL_RESULTS));
  }
};

// Generic Helpers
const getList = <T>(key: string): T[] => {
  initDb();
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
};

const saveList = <T>(key: string, list: T[]): void => {
  localStorage.setItem(key, JSON.stringify(list));
};

export const mockDb = {
  // Departments
  getDepartments: (): Department[] => getList<Department>(KEYS.DEPARTMENTS),
  saveDepartment: (dept: Department): void => {
    const list = getList<Department>(KEYS.DEPARTMENTS);
    const index = list.findIndex(d => d.id === dept.id);
    if (index >= 0) list[index] = dept;
    else list.push(dept);
    saveList(KEYS.DEPARTMENTS, list);
  },

  // Courses
  getCourses: (): Course[] => getList<Course>(KEYS.COURSES),
  saveCourse: (course: Course): void => {
    const list = getList<Course>(KEYS.COURSES);
    const index = list.findIndex(c => c.id === course.id);
    if (index >= 0) list[index] = course;
    else list.push(course);
    saveList(KEYS.COURSES, list);
  },

  // Subjects
  getSubjects: (): Subject[] => getList<Subject>(KEYS.SUBJECTS),
  saveSubject: (subject: Subject): void => {
    const list = getList<Subject>(KEYS.SUBJECTS);
    const index = list.findIndex(s => s.id === subject.id);
    if (index >= 0) list[index] = subject;
    else list.push(subject);
    saveList(KEYS.SUBJECTS, list);
  },

  // Users (includes Students and Faculty)
  getUsers: (): (User | Student | Faculty)[] => getList<User | Student | Faculty>(KEYS.USERS),
  
  saveUser: (user: User | Student | Faculty): void => {
    const list = getList<User | Student | Faculty>(KEYS.USERS);
    const index = list.findIndex(u => u.id === user.id);
    if (index >= 0) list[index] = user;
    else list.push(user);
    saveList(KEYS.USERS, list);
  },

  deleteUser: (userId: string): void => {
    const list = getList<User | Student | Faculty>(KEYS.USERS);
    const filtered = list.filter(u => u.id !== userId);
    saveList(KEYS.USERS, filtered);
  },

  getStudents: (): Student[] => {
    return getList<any>(KEYS.USERS).filter(u => u.role === 'student') as Student[];
  },

  getFaculty: (): Faculty[] => {
    return getList<any>(KEYS.USERS).filter(u => u.role === 'faculty') as Faculty[];
  },

  // Questions
  getQuestions: (): Question[] => getList<Question>(KEYS.QUESTIONS),
  saveQuestion: (question: Question): void => {
    const list = getList<Question>(KEYS.QUESTIONS);
    const index = list.findIndex(q => q.id === question.id);
    if (index >= 0) list[index] = question;
    else list.push(question);
    saveList(KEYS.QUESTIONS, list);
  },

  saveQuestionsBulk: (questions: Question[]): void => {
    const list = getList<Question>(KEYS.QUESTIONS);
    questions.forEach(q => {
      const idx = list.findIndex(x => x.id === q.id);
      if (idx >= 0) list[idx] = q;
      else list.push(q);
    });
    saveList(KEYS.QUESTIONS, list);
  },

  // Exams
  getExams: (): Exam[] => {
    const exams = getList<Exam>(KEYS.EXAMS);
    const subjects = getList<Subject>(KEYS.SUBJECTS);
    const users = getList<User>(KEYS.USERS);
    
    // Enrich with names
    return exams.map(exam => {
      const subject = subjects.find(s => s.id === exam.subjectId);
      const creator = users.find(u => u.id === exam.createdBy);
      return {
        ...exam,
        subjectName: subject ? `${subject.name} (${subject.code})` : 'Unknown Subject',
        createdByName: creator ? creator.name : 'Unknown Faculty'
      };
    });
  },
  
  saveExam: (exam: Exam): void => {
    const list = getList<Exam>(KEYS.EXAMS);
    const index = list.findIndex(e => e.id === exam.id);
    if (index >= 0) list[index] = exam;
    else list.push(exam);
    saveList(KEYS.EXAMS, list);
  },

  // Results
  getResults: (): ExamResult[] => getList<ExamResult>(KEYS.RESULTS),
  
  saveResult: (result: ExamResult): void => {
    const list = getList<ExamResult>(KEYS.RESULTS);
    const index = list.findIndex(r => r.id === result.id);
    if (index >= 0) list[index] = result;
    else list.push(result);
    
    // Sort results of the same exam to calculate rank
    const examResults = list.filter(r => r.examId === result.examId);
    examResults.sort((a, b) => b.score - a.score || a.timeTaken - b.timeTaken); // Higher score, then lower time
    
    // Assign ranks
    examResults.forEach((r, idx) => {
      const dbItem = list.find(item => item.id === r.id);
      if (dbItem) dbItem.rank = idx + 1;
    });

    saveList(KEYS.RESULTS, list);
  }
};
