export type UserRole = 'admin' | 'faculty' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'pending' | 'active';
  collegeId?: string;
  collegeName?: string;
  category?: 'Engineering' | 'Arts & Science';
  departmentId?: string;
  departmentName?: string;
  courseId?: string;
  photoUrl?: string;
  createdAt: string;
}

export interface Student extends User {
  studentId: string; // Roll number / Registration number
  courseId?: string;
  semester?: number;
  year?: number;
  academicYear?: number;
  batch?: string;
  startYear?: number;
  endYear?: number;
}

export interface Faculty extends User {
  facultyId: string; // Employee ID
  collegeId?: string;
  collegeName?: string;
  subjects?: string[]; // Subject IDs
}

export interface College {
  id: string;
  collegeName: string;
  code?: string;
  createdAt?: string;
  departments?: Department[];
  facultyAssigned?: string | null;
  facultyEmail?: string | null;
  facultyCount?: number;
  studentCount?: number;
  departmentCount?: number;
}

export interface Department {
  id: string;
  name: string;
  departmentName?: string;
  category?: 'Engineering' | 'Arts & Science';
  code: string;
  collegeId?: string;
  collegeName?: string;
  facultyCount?: number;
  studentCount?: number;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  durationYears: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  courseId: string;
}

export type QuestionType = 'mcq' | 'checkbox' | 'text';

export interface Question {
  id: string;
  subjectId: string;
  text: string;
  question?: string;
  type: QuestionType;
  options: string[]; // For MCQ/Checkbox
  correctAnswer: string | string[]; // Single option index or array of option indices, or text
  points: number;
  marks?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  uploadedDocumentId?: string;
  createdAt?: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectName?: string;
  collegeId?: string;
  collegeName?: string;
  category?: 'Engineering' | 'Arts & Science';
  departmentId?: string;
  departmentName?: string;
  duration: number; // in minutes
  startTime: string; // ISO string or simple date+time
  endTime: string;
  questions: Question[];
  questionCount?: number;
  targetYears?: string[];
  targetYear?: number | string;
  negativeMarking?: boolean;
  marksPerQuestion?: number;
  negativeMarks?: number;
  totalMarks?: number;
  createdBy: string; // Faculty ID
  createdByName?: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  createdAt: string;
}

export interface ExamAttempt {
  examId: string;
  answers: Record<string, string | string[]>; // questionId -> answer index/text
  startedAt: string;
  lastSavedAt: string;
  timeRemaining: number; // in seconds
  markedForReview: string[]; // array of questionIds
}

export interface DetailedQuestionReview {
  id: string;
  text: string;
  type: QuestionType;
  options: string[];
  correctAnswer: string | string[];
  studentOption: string | string[] | null;
  isCorrect: boolean;
  marksAwarded: number;
  points?: number;
  difficulty?: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  examTitle: string;
  subjectName: string;
  collegeName?: string;
  studentId: string;
  studentName: string;
  studentRollNo: string;
  departmentName?: string;
  studentDepartment?: string;
  score: number;
  totalPoints: number;
  percentage: number;
  status: 'pass' | 'fail';
  answers: Record<string, string | string[]>;
  detailedQuestions?: DetailedQuestionReview[];
  timeTaken: number; // in seconds
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  submittedAt: string;
  rank?: number;
}

export interface DashboardStats {
  admin: {
    totalStudents: number;
    pendingStudents: number;
    totalFaculty: number;
    totalExams: number;
    activeSessions: number;
  };
  faculty: {
    assignedSubjects: number;
    totalExamsCreated: number;
    activeExams: number;
    pendingGrading: number;
  };
  student: {
    upcomingExams: number;
    completedExams: number;
    averageScore: number;
    rank: number;
  };
}

export interface Portion {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  subjectName?: string;
  facultyId: string;
  createdAt: string;
}

export interface Note {
  id: string;
  title: string;
  content?: string;
  fileUrl?: string;
  fileName?: string;
  studentId: string;
  studentName?: string;
  studentRollNo?: string;
  subjectId: string;
  subjectName?: string;
  createdAt: string;
}

export interface UploadedDocument {
  id: string;
  name: string;
  fileUrl: string;
  fileType: 'pdf' | 'docx' | 'csv';
  facultyId: string;
  subjectId: string;
  createdAt: string;
  questionCount?: number;
  subjectName?: string;
}

