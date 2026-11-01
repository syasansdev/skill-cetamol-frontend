import { test, expect } from '@playwright/test';

test.describe('End-to-End Application Workflow, Buttons, Clicks & Alignment Audit', () => {

  // Global Mock Datasets
  const mockColleges = [
    { id: 'col-1', collegeName: 'Achariya College of Engineering Technology', code: 'ACET', facultyCount: 12, studentCount: 150 },
    { id: 'col-2', collegeName: 'Dwarka Doss Goverdhan Doss Vaishnav College', code: 'DDGDVC', facultyCount: 8, studentCount: 95 }
  ];

  const mockDepartments = [
    { id: 'dept-1', name: 'Computer Science and Engineering', code: 'CSE', collegeId: 'col-1' },
    { id: 'dept-2', name: 'Information Technology', code: 'IT', collegeId: 'col-1' }
  ];

  const mockCourses = [
    { id: 'crs-1', name: 'B.Tech Information Technology', code: 'BTECH-IT', departmentId: 'dept-2', durationYears: 4 },
    { id: 'crs-2', name: 'B.E Computer Science', code: 'BE-CSE', departmentId: 'dept-1', durationYears: 4 }
  ];

  const mockSubjects = [
    { id: 'sub-1', name: 'Quantitative & Reasoning Aptitude', code: 'QRA', courseId: 'crs-1' },
    { id: 'sub-2', name: 'Verbal Ability', code: 'VA', courseId: 'crs-1' },
    { id: 'sub-3', name: 'Advanced Computing', code: 'AC', courseId: 'crs-2' }
  ];

  const mockQuestions = [
    {
      id: 'q-1',
      text: 'What is the runtime complexity of Quicksort in average case?',
      options: ['O(N)', 'O(N log N)', 'O(N^2)', 'O(1)'],
      correctAnswer: '1',
      points: 2,
      difficulty: 'medium',
      type: 'mcq',
      subjectId: 'sub-1'
    },
    {
      id: 'q-2',
      text: 'Which of the following are valid TCP/IP layers?',
      options: ['Application', 'Transport', 'Session Layer only', 'Network'],
      correctAnswer: ['0', '1', '3'],
      points: 3,
      difficulty: 'hard',
      type: 'checkbox',
      subjectId: 'sub-3'
    }
  ];

  const mockExams = [
    {
      id: 'exam-101',
      title: 'Statewide Engineering Placement Diagnostic 2026',
      description: 'Standardized assessment covering reasoning and fundamental computing concepts.',
      instructions: '1. Fullscreen monitored.\n2. Malpractice locks after 3 warnings.',
      subjectId: 'sub-1',
      subjectName: 'Quantitative & Reasoning Aptitude',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      duration: 45,
      totalMarks: 100,
      questionCount: 2,
      questionsCount: 2,
      status: 'active',
      publishedStatus: 'published',
      assignedInstitutions: [
        { id: 'ia-1', collegeId: 'col-1', collegeName: 'Achariya College of Engineering Technology', code: 'ACET', status: 'published' }
      ],
      questions: mockQuestions
    }
  ];

  const mockUsers = [
    {
      id: 'fac-user-1',
      name: 'Dr. Sarah Connor',
      email: 'sarah.connor@university.edu',
      role: 'faculty',
      status: 'active',
      facultyId: 'FAC-1001',
      collegeId: 'col-1',
      collegeName: 'Achariya College of Engineering Technology',
      departmentId: 'dept-1',
      departmentName: 'Computer Science and Engineering',
      createdAt: new Date().toISOString()
    },
    {
      id: 'stu-user-1',
      name: 'Sadhana',
      email: 'sadhanaramu15@gmail.com',
      role: 'student',
      status: 'active',
      studentId: '26ACET0318',
      collegeId: 'col-1',
      collegeName: 'Achariya College of Engineering Technology',
      departmentId: 'dept-1',
      departmentName: 'Computer Science and Engineering',
      year: 1,
      batch: '2026-2030',
      createdAt: new Date().toISOString()
    }
  ];

  const mockAnalytics = {
    totalStudents: 631,
    totalAssessments: 24,
    completedAssessments: 629,
    averageStudentScore: 57.1,
    studentsNeedingImprovement: 238,
    categoryDistribution: [
      { category: 'Exceptional', count: 180, color: '#10b981' },
      { category: 'Good', count: 150, color: '#3b82f6' },
      { category: 'Average', count: 61, color: '#f59e0b' },
      { category: 'Needs Improvement', count: 238, color: '#ef4444' }
    ],
    subjectPerformance: [
      { subject: 'Quantitative & Reasoning Aptitude', averageScore: 62.4, testCount: 220 },
      { subject: 'Verbal Ability', averageScore: 58.1, testCount: 190 }
    ],
    studentRecords: [
      {
        id: 'stu-user-1',
        name: 'Sadhana',
        registerNumber: '26ACET0318',
        email: 'sadhanaramu15@gmail.com',
        collegeName: 'Achariya College of Engineering Technology',
        departmentName: 'Computer Science and Engineering',
        testsCompleted: 1,
        averageScore: 100,
        highestScore: 100,
        performanceCategory: 'Exceptional',
        lastActive: new Date().toISOString()
      }
    ]
  };

  test.beforeEach(async ({ page }) => {
    // Intercept common APIs
    await page.route('**/api/admin/colleges*', async (route) => route.fulfill({ json: mockColleges }));
    await page.route('**/api/admin/departments*', async (route) => route.fulfill({ json: mockDepartments }));
    await page.route('**/api/admin/courses*', async (route) => route.fulfill({ json: mockCourses }));
    await page.route('**/api/admin/subjects*', async (route) => route.fulfill({ json: mockSubjects }));
    await page.route('**/api/admin/questions*', async (route) => route.fulfill({ json: mockQuestions }));
    await page.route('**/api/admin/exams*', async (route) => route.fulfill({ json: mockExams }));
    await page.route('**/api/admin/central-exams*', async (route) => route.fulfill({ json: mockExams }));
    await page.route('**/api/admin/users*', async (route) => route.fulfill({ json: mockUsers }));
    await page.route('**/api/admin/users/search*', async (route) => route.fulfill({ json: { users: mockUsers, total: mockUsers.length, page: 1, totalPages: 1 } }));
    await page.route('**/api/admin/locked-exams*', async (route) => route.fulfill({ json: [] }));
    await page.route('**/api/admin/performance-thresholds*', async (route) => route.fulfill({ json: [] }));
    await page.route('**/api/admin/analytics/consolidated*', async (route) => route.fulfill({ json: mockAnalytics }));
    await page.route('**/api/faculty/exams*', async (route) => route.fulfill({ json: mockExams }));
    await page.route('**/api/faculty/questions*', async (route) => route.fulfill({ json: mockQuestions }));
    await page.route('**/api/faculty/results*', async (route) => route.fulfill({ json: [] }));
    await page.route('**/api/faculty/pending-students*', async (route) => route.fulfill({ json: [] }));
    await page.route('**/api/faculty/question-papers*', async (route) => route.fulfill({ json: [] }));
    await page.route('**/api/academic/departments*', async (route) => route.fulfill({ json: mockDepartments }));
    await page.route('**/api/academic/courses*', async (route) => route.fulfill({ json: mockCourses }));
    await page.route('**/api/notifications*', async (route) => route.fulfill({ json: [] }));

    await page.route('**/api/admin/analytics/student/*', async (route) => route.fulfill({
      json: {
        student: {
          id: 'stu-user-1',
          name: 'Sadhana',
          registerNumber: '26ACET0318',
          email: 'sadhanaramu15@gmail.com',
          college: 'Achariya College of Engineering Technology',
          department: 'Computer Science and Engineering'
        },
        metrics: {
          totalTests: 1,
          averageScore: 100,
          highestScore: 100,
          performanceCategory: 'Exceptional',
          averageTimePerQuestion: 45
        },
        assessments: [
          {
            resultId: 'res-101',
            examTitle: 'Statewide Engineering Placement Diagnostic 2026',
            subject: 'Quantitative & Reasoning Aptitude',
            score: 100,
            percentage: 100,
            category: 'Exceptional',
            date: '2026-10-07',
            timeSpentSeconds: 763
          }
        ],
        subjectBreakdown: [
          { subject: 'Quantitative & Reasoning Aptitude', testsTaken: 1, averageScore: 100 }
        ]
      }
    }));
  });

  // TEST 1: Login UI, Role Switching, Password Visibility & Mobile Alignment
  test('1. Login UI - Role switching, form controls & responsive alignment', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/login');
    await page.waitForTimeout(500);

    // Verify Tab Switching between Student and Faculty / Admin
    const studentTabBtn = page.locator('button:has-text("Student Portal")');
    const facultyTabBtn = page.locator('button:has-text("Faculty / Admin")');
    await expect(studentTabBtn).toBeVisible();
    await expect(facultyTabBtn).toBeVisible();

    await facultyTabBtn.click();
    await page.waitForTimeout(200);

    await studentTabBtn.click();
    await page.waitForTimeout(200);

    // Test form input typing
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('student@skillcetamol.online');
    await expect(emailInput).toHaveValue('student@skillcetamol.online');

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('Secret1234');

    // Test Password Visibility Toggle button
    const eyeBtn = page.locator('button[data-testid="toggle-password"]');
    if (await eyeBtn.isVisible()) {
      await eyeBtn.click();
      await expect(page.locator('input[value="Secret1234"][type="text"]')).toBeVisible();
      await eyeBtn.click();
      await expect(page.locator('input[value="Secret1234"][type="password"]')).toBeVisible();
    }

    // Verify No Horizontal Overflow on Desktop
    let hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow).toBe(false);

    // Verify No Horizontal Overflow on Mobile (375x667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow).toBe(false);
  });

  // TEST 2: Admin Dashboard - All Tabs & Buttons Workflow Audit
  test('2. Admin Dashboard - All tabs, buttons, modals & zero-overflow alignment', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Seed Admin Session
    await page.goto('/login');
    await page.evaluate(() => {
      const adminUser = {
        id: 'admin-1',
        name: 'Syasans Career Analytics Tech',
        email: 'admin@skillcetamol.online',
        role: 'admin',
        status: 'active'
      };
      localStorage.setItem('exam_token', 'mock_token');
      localStorage.setItem('exam_current_user', JSON.stringify(adminUser));
      localStorage.setItem('theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    const adminTabs = [
      'overview',
      'analytics',
      'central-exams',
      'academics',
      'faculty',
      'students',
      'proctoring',
      'questions',
      'qpapers',
      'uploads',
      'results',
      'settings'
    ];

    for (const tab of adminTabs) {
      await page.goto(`/admin/dashboard?tab=${tab}`);
      await page.waitForTimeout(400);

      // Verify no horizontal overflow on any tab
      const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(hasOverflow).toBe(false);

      // Tab specific interactive verification
      if (tab === 'analytics') {
        // Assert KPI stats cards are rendered
        await expect(page.locator('text=Consolidated Student Performance Dashboard')).toBeVisible();
        await expect(page.locator('text=631').first()).toBeVisible();

        // Click "View Profile" on Sadhana
        const viewProfileBtn = page.locator('button:has-text("View Profile")').first();
        if (await viewProfileBtn.isVisible()) {
          await viewProfileBtn.click();
          await page.waitForTimeout(400);
          // Modal should be open
          const modalText = page.locator('h3').filter({ hasText: 'Sadhana' }).first();
          await expect(modalText).toBeVisible();
          // Close modal
          const closeBtn = page.locator('button[title="Close Profile"], .modal-close').first();
          if (await closeBtn.isVisible()) await closeBtn.click();
        }
      }

      if (tab === 'central-exams') {
        // Click "Create Central Assessment"
        const createAssessmentBtn = page.locator('button:has-text("Create Central Assessment")');
        if (await createAssessmentBtn.isVisible()) {
          await createAssessmentBtn.click();
          await page.waitForTimeout(300);

          // Verify Subject Curriculum dropdown
          const subjectSelect = page.locator('select.form-control').filter({ hasText: 'Select Subject' });
          await expect(subjectSelect).toBeVisible();

          // Verify "+ Custom" button switches to text input
          const customToggleBtn = page.locator('button:has-text("+ Custom")');
          if (await customToggleBtn.isVisible()) {
            await customToggleBtn.click();
            await expect(page.locator('input[placeholder="e.g., Mathematics"]')).toBeVisible();
            // Switch back
            const selectToggleBtn = page.locator('button:has-text("← Select")');
            await selectToggleBtn.click();
            await expect(subjectSelect).toBeVisible();
          }

          // Click "Back to Assessments"
          const backBtn = page.locator('button:has-text("Back to Assessments")');
          await backBtn.click();
        }
      }

      if (tab === 'academics') {
        // Click "+ Add College"
        const addCollegeBtn = page.locator('button:has-text("Add College")').first();
        if (await addCollegeBtn.isVisible()) {
          await addCollegeBtn.click();
          await page.waitForTimeout(200);
          const closeBtn = page.locator('.modal-close, button:has-text("×"), button:has-text("Cancel")').first();
          if (await closeBtn.isVisible()) await closeBtn.click();
        }
      }

      if (tab === 'faculty') {
        // Click "Add Faculty Profile" / "Create User Profile"
        const addFacBtn = page.locator('button:has-text("Add Faculty"), button:has-text("Create Faculty")').first();
        if (await addFacBtn.isVisible()) {
          await addFacBtn.click();
          await page.waitForTimeout(200);
          const closeBtn = page.locator('.modal-close, button:has-text("×")').first();
          if (await closeBtn.isVisible()) await closeBtn.click();
        }
      }

      if (tab === 'questions') {
        // Verify filter selects exist
        const subFilter = page.locator('select.form-control').filter({ hasText: 'All Subjects' });
        await expect(subFilter).toBeVisible();
      }
    }
  });

  // TEST 3: Faculty Dashboard - Schedule Exam, Auto-Pick, Bank & Modals
  test('3. Faculty Dashboard - Exam scheduler with subject dropdown, question auto-pick & zero-overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Seed Faculty Session
    await page.goto('/login');
    await page.evaluate(() => {
      const facultyUser = {
        id: 'fac-user-1',
        name: 'Dr. Sarah Connor',
        email: 'sarah.connor@university.edu',
        role: 'faculty',
        status: 'active'
      };
      localStorage.setItem('exam_token', 'mock_token');
      localStorage.setItem('exam_current_user', JSON.stringify(facultyUser));
      localStorage.setItem('theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    const facultyTabs = ['overview', 'exams', 'questions', 'qpapers', 'results', 'academics', 'profile'];

    for (const tab of facultyTabs) {
      await page.goto(`/faculty/dashboard?tab=${tab}`);
      await page.waitForTimeout(400);

      const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(hasOverflow).toBe(false);

      if (tab === 'exams') {
        // Click "Schedule New Exam"
        const scheduleBtn = page.locator('button:has-text("Schedule New Exam")').first();
        await expect(scheduleBtn).toBeVisible();
        await scheduleBtn.click();

        // Verify modal opened
        const modal = page.locator('.modal-content').filter({ hasText: 'Schedule New Examination' });
        await expect(modal).toBeVisible();

        // Check Subject Curriculum Dropdown
        const subjectSelect = modal.locator('select.form-control').filter({ hasText: 'Select Subject Curriculum' });
        await expect(subjectSelect).toBeVisible();
        await subjectSelect.selectOption({ label: 'Quantitative & Reasoning Aptitude (QRA)' });

        // Test Auto-Pick button
        const autoPickBtn = modal.locator('button:has-text("Auto-Pick")');
        if (await autoPickBtn.isVisible()) {
          await autoPickBtn.click();
        }

        // Close modal
        const closeBtn = modal.locator('.modal-close, button:has-text("×")');
        await closeBtn.click();
      }
    }
  });

  // TEST 4: Student Dashboard & Examination Console Interactive Audit
  test('4. Student Dashboard & Exam Console - Question navigation, selection, review & submit', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.route('**/api/student/exams*', async (route) => route.fulfill({ json: mockExams }));
    await page.route('**/api/student/results*', async (route) => route.fulfill({ json: [] }));
    await page.route('**/api/student/analytics/master-summary*', async (route) => route.fulfill({
      json: {
        summary: { totalAttempts: 1, averageScore: 100, passRate: 100 },
        subjectPerformance: [{ subjectName: 'Quantitative & Reasoning Aptitude', score: 100 }]
      }
    }));
    await page.route('**/api/student/exams/exam-101', async (route) => route.fulfill({ json: mockExams[0] }));
    await page.route('**/api/student/exams/exam-101/auto-save', async (route) => route.fulfill({ json: { success: true } }));
    await page.route('**/api/student/exams/exam-101/submit', async (route) => route.fulfill({
      json: {
        id: 'res-101',
        examId: 'exam-101',
        examTitle: 'Statewide Engineering Placement Diagnostic 2026',
        score: 100,
        totalPoints: 100,
        percentage: 100,
        status: 'pass',
        performanceCategory: 'Exceptional',
        submittedAt: new Date().toISOString()
      }
    }));

    // Seed Student Session
    await page.goto('/login');
    await page.evaluate(() => {
      const studentUser = {
        id: 'stu-user-1',
        name: 'Sadhana',
        email: 'sadhanaramu15@gmail.com',
        role: 'student',
        status: 'active'
      };
      localStorage.setItem('exam_token', 'mock_token');
      localStorage.setItem('exam_current_user', JSON.stringify(studentUser));
      localStorage.setItem('theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    // 1. Audit Student Dashboard Tabs
    const studentTabs = ['overview', 'exams', 'history', 'analytics', 'profile'];
    for (const tab of studentTabs) {
      await page.goto(`/student/dashboard?tab=${tab}`);
      await page.waitForTimeout(300);
      const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(hasOverflow).toBe(false);
    }

    // 2. Audit Exam Interface Console
    await page.evaluate(() => {
      const activeExamData = {
        id: 'exam-101',
        title: 'Statewide Engineering Placement Diagnostic 2026',
        duration: 45,
        totalMarks: 100,
        questions: [
          {
            id: 'q-1',
            question: 'What is the runtime complexity of Quicksort in average case?',
            text: 'What is the runtime complexity of Quicksort in average case?',
            options: ['O(N)', 'O(N log N)', 'O(N^2)', 'O(1)'],
            correctAnswer: '1',
            points: 2,
            type: 'mcq',
            difficulty: 'medium',
            subjectId: 'sub-1'
          },
          {
            id: 'q-2',
            question: 'Which of the following are valid TCP/IP layers?',
            text: 'Which of the following are valid TCP/IP layers?',
            options: ['Application', 'Transport', 'Session Layer only', 'Network'],
            correctAnswer: ['0', '1', '3'],
            points: 3,
            type: 'checkbox',
            difficulty: 'hard',
            subjectId: 'sub-1'
          }
        ]
      };
      sessionStorage.setItem('skill_active_exam_session', JSON.stringify({
        activeExam: activeExamData,
        currentQuestionIndex: 0,
        answers: {},
        questionTimings: {},
        markedForReview: [],
        timeRemaining: 2700,
        isExamActive: true
      }));
    });

    await page.goto('/exam/exam-101');
    await page.waitForTimeout(600);

    // Assert Question Text is visible
    const q1Text = page.locator('text=What is the runtime complexity of Quicksort');
    await expect(q1Text).toBeVisible();

    // Click Option B: O(N log N)
    const optionB = page.locator('label, div').filter({ hasText: 'O(N log N)' }).first();
    await optionB.click();

    // Click "Next"
    const nextBtn = page.locator('button:has-text("Next")').first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(300);

      // Verify Question 2 loaded
      const q2Text = page.locator('text=TCP/IP layers');
      await expect(q2Text).toBeVisible();
    }

    // Verify Exam Console has zero horizontal overflow
    const examOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(examOverflow).toBe(false);

    // Test Final Submit Button (visible in sidebar on any question, or bottom bar on last question)
    const submitExamBtn = page.locator('button:has-text("Final Submit"), button:has-text("Submit Exam")').first();
    await expect(submitExamBtn).toBeVisible();
    await submitExamBtn.click();

    // Verify confirmation modal
    const confirmModal = page.locator('.modal-content, [role="dialog"]').filter({ hasText: 'Submit' });
    await expect(confirmModal).toBeVisible();

    // Test Close Confirmation Modal via "Go Back to Exam"
    const cancelSubmitBtn = confirmModal.locator('button:has-text("Go Back to Exam")');
    await cancelSubmitBtn.click();
    await page.waitForTimeout(200);
  });

  // TEST 5: Theme Switcher - Dark / Light Contrast and Variable Persistence
  test('5. Theme Switcher - Dynamic dark/light toggle and persistent contrast', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto('/login');
    await page.evaluate(() => {
      const adminUser = {
        id: 'admin-1',
        name: 'Super Admin',
        email: 'admin@skillcetamol.online',
        role: 'admin',
        status: 'active'
      };
      localStorage.setItem('exam_token', 'mock_token');
      localStorage.setItem('exam_current_user', JSON.stringify(adminUser));
    });

    await page.goto('/admin/dashboard?tab=overview');
    await page.waitForTimeout(500);

    // Find Theme Toggle button in Top Nav
    const themeBtn = page.locator('button').filter({ has: page.locator('svg.lucide-sun, svg.lucide-moon') }).first();
    if (await themeBtn.isVisible()) {
      const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      await themeBtn.click();
      await page.waitForTimeout(300);
      const newTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      expect(newTheme).not.toBe(initialTheme);

      // Verify no overflow in the switched theme
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow).toBe(false);
    }
  });

});
