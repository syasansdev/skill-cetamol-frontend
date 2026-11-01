import { Department, Course, Subject, User, Student, Faculty, Question, Exam, ExamResult } from '../types';

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 'dept-1', name: 'Computer Science & Engineering', code: 'CSE' },
  { id: 'dept-2', name: 'Management Studies', code: 'MGT' },
  { id: 'dept-3', name: 'Natural Sciences', code: 'SCI' }
];

export const INITIAL_COURSES: Course[] = [
  { id: 'course-1', name: 'Bachelor of Technology in CSE', code: 'BTECH-CSE', departmentId: 'dept-1', durationYears: 4 },
  { id: 'course-2', name: 'Master of Business Administration', code: 'MBA', departmentId: 'dept-2', durationYears: 2 },
  { id: 'course-3', name: 'Bachelor of Science in Physics', code: 'BSC-PHY', departmentId: 'dept-3', durationYears: 3 }
];

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 'sub-1', name: 'Data Structures and Algorithms', code: 'CSE-201', courseId: 'course-1' },
  { id: 'sub-2', name: 'Web Development Technologies', code: 'CSE-302', courseId: 'course-1' },
  { id: 'sub-3', name: 'Financial Management', code: 'MGT-102', courseId: 'course-2' },
  { id: 'sub-4', name: 'Quantum Mechanics', code: 'PHY-301', courseId: 'course-3' }
];

export const INITIAL_USERS: (User | Student | Faculty)[] = [
  // Admins
  {
    id: 'usr-admin-1',
    name: 'Sarah Jenkins (Admin)',
    email: 'admin@exam.com',
    role: 'admin',
    status: 'active',
    createdAt: '2026-01-10T10:00:00Z'
  },
  // Faculty
  {
    id: 'usr-fac-1',
    name: 'Dr. Robert Carter',
    email: 'faculty@exam.com',
    role: 'faculty',
    status: 'active',
    departmentId: 'dept-1',
    createdAt: '2026-01-15T11:30:00Z',
    facultyId: 'FAC-001',
    subjects: ['sub-1', 'sub-2']
  } as Faculty,
  {
    id: 'usr-fac-2',
    name: 'Prof. Helen Myers',
    email: 'helen.myers@exam.com',
    role: 'faculty',
    status: 'active',
    departmentId: 'dept-2',
    createdAt: '2026-02-01T09:00:00Z',
    facultyId: 'FAC-002',
    subjects: ['sub-3']
  } as Faculty,
  // Active Students
  {
    id: 'usr-std-1',
    name: 'Alex Rivera',
    email: 'student@exam.com',
    role: 'student',
    status: 'active',
    departmentId: 'dept-1',
    courseId: 'course-1',
    createdAt: '2026-03-01T14:00:00Z',
    studentId: 'STU-2026-001',
    semester: 4
  } as Student,
  {
    id: 'usr-std-2',
    name: 'Jane Doe',
    email: 'jane.doe@exam.com',
    role: 'student',
    status: 'active',
    departmentId: 'dept-1',
    courseId: 'course-1',
    createdAt: '2026-03-02T10:00:00Z',
    studentId: 'STU-2026-002',
    semester: 4
  } as Student,
  {
    id: 'usr-std-3',
    name: 'Marcus Aurelius',
    email: 'marcus.aurelius@exam.com',
    role: 'student',
    status: 'active',
    departmentId: 'dept-2',
    courseId: 'course-2',
    createdAt: '2026-03-05T08:30:00Z',
    studentId: 'STU-2026-003',
    semester: 2
  } as Student,
  // Pending Students for Admin approvals
  {
    id: 'usr-std-4',
    name: 'David Smith',
    email: 'david.smith@exam.com',
    role: 'student',
    status: 'pending',
    departmentId: 'dept-3',
    courseId: 'course-3',
    createdAt: '2026-07-28T12:00:00Z',
    studentId: 'STU-2026-004',
    semester: 1
  } as Student,
  {
    id: 'usr-std-5',
    name: 'Emily Watson',
    email: 'emily.watson@exam.com',
    role: 'student',
    status: 'pending',
    departmentId: 'dept-1',
    courseId: 'course-1',
    createdAt: '2026-07-29T02:00:00Z',
    studentId: 'STU-2026-005',
    semester: 1
  } as Student
];

export const INITIAL_QUESTIONS: Question[] = [
  // DSA Questions
  {
    id: 'q-dsa-1',
    subjectId: 'sub-1',
    text: 'What is the worst-case time complexity of lookup in a hash table?',
    type: 'mcq',
    options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
    correctAnswer: '2', // O(n) due to collisions
    points: 5,
    difficulty: 'medium',
    createdAt: '2026-04-01T10:00:00Z'
  },
  {
    id: 'q-dsa-2',
    subjectId: 'sub-1',
    text: 'Which of the following data structures operates on a Last In First Out (LIFO) basis?',
    type: 'mcq',
    options: ['Queue', 'Stack', 'Heap', 'Binary Tree'],
    correctAnswer: '1', // Stack
    points: 5,
    difficulty: 'easy',
    createdAt: '2026-04-01T10:05:00Z'
  },
  {
    id: 'q-dsa-3',
    subjectId: 'sub-1',
    text: 'Which of the following are self-balancing binary search trees? (Select all that apply)',
    type: 'checkbox',
    options: ['AVL Tree', 'Red-Black Tree', 'Splay Tree', 'Binary Heap'],
    correctAnswer: ['0', '1', '2'], // AVL, RB, Splay
    points: 10,
    difficulty: 'hard',
    createdAt: '2026-04-01T10:10:00Z'
  },
  {
    id: 'q-dsa-4',
    subjectId: 'sub-1',
    text: 'Explain the difference between a Prim\'s algorithm and Kruskal\'s algorithm for finding Minimum Spanning Trees.',
    type: 'text',
    options: [],
    correctAnswer: 'Prim\'s algorithm grows the MST from a starting vertex by adding the cheapest edge from the tree to a non-tree vertex. Kruskal\'s algorithm sorts all edges by weight and adds edges one by one, avoiding cycles, using a disjoint-set data structure.',
    points: 15,
    difficulty: 'hard',
    createdAt: '2026-04-01T10:15:00Z'
  },
  {
    id: 'q-dsa-5',
    subjectId: 'sub-1',
    text: 'What is the time complexity of building a heap of size n from an arbitrary array?',
    type: 'mcq',
    options: ['O(n)', 'O(n log n)', 'O(log n)', 'O(n^2)'],
    correctAnswer: '0', // O(n)
    points: 5,
    difficulty: 'medium',
    createdAt: '2026-04-01T10:20:00Z'
  },
  // Web Dev Questions
  {
    id: 'q-web-1',
    subjectId: 'sub-2',
    text: 'Which HTML5 element is used to display scalable vector graphics?',
    type: 'mcq',
    options: ['<canvas>', '<svg>', '<vector>', '<graphics>'],
    correctAnswer: '1', // <svg>
    points: 5,
    difficulty: 'easy',
    createdAt: '2026-05-01T09:00:00Z'
  },
  {
    id: 'q-web-2',
    subjectId: 'sub-2',
    text: 'Which of the following properties is used to control the layout inside a CSS Flexbox container? (Select all that apply)',
    type: 'checkbox',
    options: ['justify-content', 'align-items', 'flex-direction', 'grid-template-areas'],
    correctAnswer: ['0', '1', '2'],
    points: 10,
    difficulty: 'medium',
    createdAt: '2026-05-01T09:05:00Z'
  },
  {
    id: 'q-web-3',
    subjectId: 'sub-2',
    text: 'What is the purpose of the useEffect hook in React?',
    type: 'mcq',
    options: [
      'To manage state variables directly',
      'To perform side effects in functional components (data fetching, subscriptions, etc.)',
      'To speed up rendering by bypassing the virtual DOM',
      'To handle user click events exclusively'
    ],
    correctAnswer: '1',
    points: 5,
    difficulty: 'medium',
    createdAt: '2026-05-01T09:10:00Z'
  },
  {
    id: 'q-web-4',
    subjectId: 'sub-2',
    text: 'What are the main differences between local storage and session storage in the browser?',
    type: 'text',
    options: [],
    correctAnswer: 'LocalStorage persists data with no expiration date. SessionStorage stores data for the duration of the page session (until the tab/browser is closed). LocalStorage shares data across tabs/windows of the same origin, while SessionStorage is unique to each tab.',
    points: 10,
    difficulty: 'easy',
    createdAt: '2026-05-01T09:15:00Z'
  }
];

export const INITIAL_EXAMS: Exam[] = [
  {
    id: 'exam-1',
    title: 'Data Structures Mid-Term Exam',
    description: 'Covers core concepts of Trees, Balanced Trees, Hash Tables, and Heap structures. Answer all questions carefully.',
    subjectId: 'sub-1',
    subjectName: 'Data Structures and Algorithms',
    duration: 30, // 30 mins
    startTime: '2026-07-29T09:00:00.000Z', // Today
    endTime: '2026-07-29T21:00:00.000Z',
    questions: [
      INITIAL_QUESTIONS[0],
      INITIAL_QUESTIONS[1],
      INITIAL_QUESTIONS[2],
      INITIAL_QUESTIONS[4]
    ],
    createdBy: 'usr-fac-1',
    createdByName: 'Dr. Robert Carter',
    status: 'active',
    createdAt: '2026-07-20T10:00:00Z'
  },
  {
    id: 'exam-2',
    title: 'Modern Web Architectures Final',
    description: 'Final examination on HTML5, CSS Flexbox/Grid, and React state management & component lifecycle.',
    subjectId: 'sub-2',
    subjectName: 'Web Development Technologies',
    duration: 60,
    startTime: '2026-08-05T10:00:00.000Z', // Next week
    endTime: '2026-08-05T18:00:00.000Z',
    questions: [
      INITIAL_QUESTIONS[5],
      INITIAL_QUESTIONS[6],
      INITIAL_QUESTIONS[7]
    ],
    createdBy: 'usr-fac-1',
    createdByName: 'Dr. Robert Carter',
    status: 'scheduled',
    createdAt: '2026-07-25T11:00:00Z'
  },
  {
    id: 'exam-3',
    title: 'Data Structures Diagnostic Test',
    description: 'A pre-term evaluation of stack, queue, and complexity concepts.',
    subjectId: 'sub-1',
    subjectName: 'Data Structures and Algorithms',
    duration: 15,
    startTime: '2026-07-15T09:00:00.000Z', // Completed
    endTime: '2026-07-15T12:00:00.000Z',
    questions: [
      INITIAL_QUESTIONS[1],
      INITIAL_QUESTIONS[0]
    ],
    createdBy: 'usr-fac-1',
    createdByName: 'Dr. Robert Carter',
    status: 'completed',
    createdAt: '2026-07-10T08:00:00Z'
  }
];

export const INITIAL_RESULTS: ExamResult[] = [
  {
    id: 'res-1',
    examId: 'exam-3',
    examTitle: 'Data Structures Diagnostic Test',
    subjectName: 'Data Structures and Algorithms',
    studentId: 'usr-std-1',
    studentName: 'Alex Rivera',
    studentRollNo: 'STU-2026-001',
    score: 10,
    totalPoints: 10,
    percentage: 100,
    status: 'pass',
    answers: {
      'q-dsa-2': '1', // Stack
      'q-dsa-1': '2'  // O(n)
    },
    timeTaken: 450, // 7.5 mins
    correctCount: 2,
    wrongCount: 0,
    skippedCount: 0,
    submittedAt: '2026-07-15T10:15:00Z',
    rank: 1
  },
  {
    id: 'res-2',
    examId: 'exam-3',
    examTitle: 'Data Structures Diagnostic Test',
    subjectName: 'Data Structures and Algorithms',
    studentId: 'usr-std-2',
    studentName: 'Jane Doe',
    studentRollNo: 'STU-2026-002',
    score: 5,
    totalPoints: 10,
    percentage: 50,
    status: 'fail',
    answers: {
      'q-dsa-2': '1', // Stack
      'q-dsa-1': '0'  // O(1) (incorrect)
    },
    timeTaken: 600, // 10 mins
    correctCount: 1,
    wrongCount: 1,
    skippedCount: 0,
    submittedAt: '2026-07-15T11:00:00Z',
    rank: 2
  }
];
