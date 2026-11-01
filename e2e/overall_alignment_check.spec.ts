import { test, expect } from '@playwright/test';

test.describe('Overall Application Alignment & Compatibility Audit', () => {

  test('Check Admin Dashboard, Faculty Dashboard, and Student Portal for alignment & overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Mock common endpoints
    await page.route('**/api/admin/colleges', async (route) => {
      await route.fulfill({
        json: [
          { id: 'col-1', collegeName: 'Jeppiaar Institute of Technology', code: 'JIT-01' },
          { id: 'col-2', collegeName: 'Achariya College of Engineering Technology', code: 'ACET-02' }
        ]
      });
    });

    await page.route('**/api/admin/departments*', async (route) => {
      await route.fulfill({
        json: [
          { id: 'dept-1', name: 'Computer Science and Engineering', code: 'CSE' },
          { id: 'dept-2', name: 'Information Technology', code: 'IT' }
        ]
      });
    });

    await page.route('**/api/admin/courses*', async (route) => {
      await route.fulfill({
        json: [
          { id: 'crs-1', name: 'B.Tech Information Technology', code: 'BTECH-IT' },
          { id: 'crs-2', name: 'B.E Computer Science', code: 'BE-CSE' }
        ]
      });
    });

    await page.route('**/api/admin/subjects*', async (route) => {
      await route.fulfill({
        json: [
          { id: 'sub-1', name: 'Quantitative & Reasoning Aptitude', code: 'QRA' },
          { id: 'sub-2', name: 'Verbal Ability', code: 'VA' }
        ]
      });
    });

    await page.route('**/api/admin/questions*', async (route) => {
      await route.fulfill({
        json: [
          {
            id: 'q-1',
            text: 'What is the time complexity of binary search on a sorted array of size N?',
            options: ['O(1)', 'O(log N)', 'O(N)', 'O(N^2)'],
            correctAnswer: '1',
            points: 2,
            difficulty: 'easy',
            type: 'mcq',
            subjectId: 'sub-1'
          }
        ]
      });
    });

    await page.route('**/api/admin/central-exams*', async (route) => {
      await route.fulfill({
        json: [
          {
            id: 'exam-1',
            title: 'Statewide Engineering Diagnostic Assessment 2026',
            subject: 'Quantitative & Reasoning Aptitude',
            duration: 60,
            totalMarks: 100,
            publishedStatus: 'published',
            assignedInstitutions: ['col-1', 'col-2'],
            questionsCount: 25
          }
        ]
      });
    });

    await page.route('**/api/admin/analytics/consolidated*', async (route) => {
      await route.fulfill({
        json: {
          totalStudents: 631,
          totalAssessments: 24,
          completedAssessments: 629,
          averageStudentScore: 57.1,
          studentsNeedingImprovement: 238,
          categoryDistribution: [
            { category: 'Exceptional', count: 112, color: '#10b981' },
            { category: 'Good', count: 240, color: '#3b82f6' },
            { category: 'Average', count: 228, color: '#f59e0b' },
            { category: 'Needs Improvement', count: 48, color: '#ef4444' }
          ],
          subjectPerformance: [
            { subject: 'Quantitative Aptitude', averageScore: 62.4, testCount: 220 },
            { subject: 'Verbal Ability', averageScore: 58.1, testCount: 190 }
          ],
          studentRecords: [
            {
              id: 'stu-1',
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
        }
      });
    });

    await page.route('**/api/notifications*', async (route) => {
      await route.fulfill({ json: [] });
    });

    // 1. Audit Login Screen (Desktop & Mobile)
    await page.goto('/login');
    await page.waitForTimeout(500);
    const loginHasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(loginHasOverflow).toBe(false);

    // Mobile Viewport Check
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(400);
    const mobileLoginOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(mobileLoginOverflow).toBe(false);

    // 2. Set Admin Auth State & Return to Desktop
    await page.setViewportSize({ width: 1440, height: 900 });
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

    // Verify Admin Overview
    await page.goto('/admin/dashboard?tab=overview');
    await page.waitForTimeout(600);
    let overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);

    // Verify Admin Performance Analytics
    await page.goto('/admin/dashboard?tab=analytics');
    await page.waitForTimeout(600);
    overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);

    // Verify Admin Assessment Studio
    await page.goto('/admin/dashboard?tab=central-exams');
    await page.waitForTimeout(600);
    overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);

    // Verify Admin Question Bank
    await page.goto('/admin/dashboard?tab=questions');
    await page.waitForTimeout(600);
    overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);

    // Verify Admin Q-Papers Extractor
    await page.goto('/admin/dashboard?tab=qpapers');
    await page.waitForTimeout(600);
    overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);

    // 3. Verify Faculty Dashboard
    await page.evaluate(() => {
      const facUser = {
        id: 'fac-1',
        name: 'Dr. Sarah Carter',
        email: 'faculty@skillcetamol.online',
        role: 'faculty',
        status: 'active'
      };
      localStorage.setItem('exam_current_user', JSON.stringify(facUser));
    });

    await page.goto('/faculty/dashboard?tab=overview');
    await page.waitForTimeout(600);
    overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);

    // 4. Verify Student Dashboard
    await page.route('**/api/student/exams*', async (route) => {
      await route.fulfill({ json: [] });
    });
    await page.route('**/api/student/history*', async (route) => {
      await route.fulfill({ json: [] });
    });
    await page.route('**/api/student/analytics*', async (route) => {
      await route.fulfill({
        json: {
          kpiCards: {
            averageScore: 92.5,
            highestScore: 98,
            overallPerformanceCategory: 'Exceptional',
            categoryColor: '#10b981',
            averageTimePerQuestion: 38
          },
          performanceTrend: [],
          assessmentComparison: []
        }
      });
    });

    await page.evaluate(() => {
      const studentUser = {
        id: 'stu-1',
        name: 'Sadhana',
        email: 'sadhana@skillcetamol.online',
        role: 'student',
        status: 'active'
      };
      localStorage.setItem('exam_current_user', JSON.stringify(studentUser));
    });

    await page.goto('/student/dashboard?tab=overview');
    await page.waitForTimeout(600);
    overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);

    await page.goto('/student/dashboard?tab=analytics');
    await page.waitForTimeout(600);
    overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });
});
