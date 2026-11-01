import { test, expect } from '@playwright/test';

test('Capture screenshots of Assessment Studio and Performance Analytics', async ({ page }) => {
  // Mock API routes so they return rich data for visual verification
  await page.route('**/api/admin/colleges', async (route) => {
    const mockColleges = Array.from({ length: 49 }, (_, i) => ({
      id: `col-${i + 1}`,
      collegeName: i === 0 ? 'Jeppiaar Institute of Technology' :
                   i === 1 ? 'Achariya College of Engineering Technology' :
                   i === 2 ? 'Kings College of Engineering' :
                   `Skill Cetamol Engineering Campus ${i + 1}`,
      name: i === 0 ? 'Jeppiaar Institute of Technology' :
            i === 1 ? 'Achariya College of Engineering Technology' :
            i === 2 ? 'Kings College of Engineering' :
            `Skill Cetamol Engineering Campus ${i + 1}`,
      code: `SC-${100 + i}`
    }));
    await route.fulfill({ json: mockColleges });
  });

  await page.route('**/api/admin/central-exams', async (route) => {
    await route.fulfill({ json: [] });
  });

  await page.route('**/api/admin/questions', async (route) => {
    await route.fulfill({ json: [] });
  });

  await page.route('**/api/admin/analytics/consolidated*', async (route) => {
    await route.fulfill({
      json: {
        totalStudents: 628,
        totalAssessments: 24,
        completedAssessments: 628,
        averageStudentScore: 57.1,
        studentsNeedingImprovement: 48,
        categoryDistribution: [
          { category: 'Exceptional', count: 112, color: '#10b981' },
          { category: 'Good', count: 240, color: '#3b82f6' },
          { category: 'Average', count: 228, color: '#f59e0b' },
          { category: 'Needs Improvement', count: 48, color: '#ef4444' }
        ],
        subjectPerformance: [
          { subject: 'Quantitative Aptitude', averageScore: 62.4, testCount: 220 },
          { subject: 'Verbal Ability', averageScore: 58.1, testCount: 190 },
          { subject: 'Programming & Logic', averageScore: 51.3, testCount: 218 }
        ],
        studentRecords: [
          {
            id: 'stu-1',
            name: 'Praveen Kumar',
            registerNumber: '312320104055',
            email: 'praveen@jeppiaar.ac.in',
            collegeName: 'Jeppiaar Institute of Technology',
            departmentName: 'Computer Science & Engineering',
            testsCompleted: 4,
            averageScore: 92.5,
            highestScore: 98.0,
            performanceCategory: 'Exceptional',
            lastActive: new Date().toISOString()
          },
          {
            id: 'stu-2',
            name: 'Divya Bharathi',
            registerNumber: '312320104018',
            email: 'divya@achariya.org',
            collegeName: 'Achariya College of Engineering',
            departmentName: 'Information Technology',
            testsCompleted: 3,
            averageScore: 78.0,
            highestScore: 84.0,
            performanceCategory: 'Good',
            lastActive: new Date().toISOString()
          }
        ]
      }
    });
  });

  await page.goto('/login');
  
  await page.evaluate(() => {
    const adminUser = {
      id: 'admin-visual-test',
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

  // 1. Navigate to Assessment Studio
  await page.goto('/admin/dashboard?tab=central-exams');
  await page.waitForTimeout(800);

  // Click "Create Central Assessment"
  const createBtn = page.locator('button:has-text("Create Central Assessment")');
  if (await createBtn.isVisible()) {
    await createBtn.click();
    await page.waitForTimeout(600);
  }

  await page.screenshot({ path: 'test-results/assessment-studio.png', fullPage: true });

  // 2. Navigate to Performance Analytics
  await page.goto('/admin/dashboard?tab=analytics');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'test-results/performance-analytics.png', fullPage: true });

  // 3. Navigate to Q-Papers Extractor
  await page.goto('/admin/dashboard?tab=qpapers');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'test-results/qpapers.png', fullPage: true });

  // 4. Navigate to Exam Results & Export
  await page.goto('/admin/dashboard?tab=results');
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'test-results/exam-results.png', fullPage: true });
});
