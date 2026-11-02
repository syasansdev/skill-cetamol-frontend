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
  name?: string;
  code?: string;
  collegeIdNumber?: number;
  creationNumber?: number;
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

export type PerformanceCategory = 'Exceptional' | 'Good' | 'Average' | 'Needs Improvement';

export interface PerformanceThreshold {
  id?: string;
  category: PerformanceCategory;
  minScore: number;
  maxScore: number;
  color: string;
  description?: string;
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
  timeSpentSeconds?: number;
  questionNumber?: number;
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
  grade?: string;
  gradeLabel?: string;
  performanceCategory?: PerformanceCategory;
  answers: Record<string, string | string[]>;
  detailedQuestions?: DetailedQuestionReview[];
  timeTaken: number; // in seconds
  totalActiveTimeSeconds?: number;
  averageQuestionTimeSeconds?: number;
  longestQuestionTime?: number;
  shortestQuestionTime?: number;
  questionTimings?: Record<string, number>;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  submittedAt: string;
  rank?: number;
}

export interface TimeExtension {
  id: string;
  studentExamId: string;
  studentId: string;
  studentName?: string;
  registerNumber?: string;
  examId: string;
  examTitle?: string;
  extensionMinutes: number;
  originalDeadline?: string;
  newDeadline?: string;
  reason?: string;
  grantedById: string;
  grantedByName?: string;
  grantedByRole: string;
  createdAt: string;
}

export interface StudentMasterAnalytics {
  student: {
    id: string;
    name: string;
    registerNumber: string;
    college: string;
    department: string;
  };
  kpiCards: {
    totalTestsCompleted: number;
    averageScore: number;
    highestScore: number;
    overallPerformanceCategory: string;
    categoryColor: string;
    averageTimePerQuestion: number;
    performanceImprovement: number;
  };
  recentActivity: Array<{
    id: string;
    examId: string;
    examTitle: string;
    subjectName: string;
    percentage: number;
    category: string;
    color: string;
    date: string;
    timeTakenSeconds: number;
  }>;
  performanceTrend: Array<{
    date: string;
    timestamp: string;
    examTitle: string;
    Score: number;
    percentage: number;
    category: string;
    color: string;
  }>;
  assessmentComparison: Array<{
    examTitle: string;
    fullTitle: string;
    score: number;
    totalMarks: number;
    category: string;
    color: string;
  }>;
  categoryDistribution: Array<{
    name: string;
    count: number;
    color: string;
  }>;
  subjectPerformance: Array<{
    subjectName: string;
    averageScore: number;
    highestScore: number;
    testsTaken: number;
    category: string;
    color: string;
  }>;
  strongestSubjects: any[];
  weakestSubjects: any[];
  areasForPractice: Array<{
    subjectName: string;
    currentScore: number;
    category: string;
    recommendation: string;
  }>;
  timeManagementTrend: Array<{
    examTitle: string;
    fullTitle: string;
    avgSecondsPerQuestion: number;
    totalDurationMinutes: number;
  }>;
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

