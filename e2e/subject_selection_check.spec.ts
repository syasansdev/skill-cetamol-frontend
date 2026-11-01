import { test, expect } from '@playwright/test';

test.describe('Subject Selection Verification in Exam Scheduling', () => {

  test('Verify Subject dropdown in Super Admin Assessment Studio and Faculty Schedule Exam modal', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    const mockSubjects = [
      { id: 'sub-1', name: 'Quantitative & Reasoning Aptitude', code: 'QRA', courseId: 'crs-1' },
      { id: 'sub-2', name: 'Verbal Ability', code: 'VA', courseId: 'crs-1' },
      { id: 'sub-3', name: 'Advanced Computing', code: 'AC', courseId: 'crs-1' }
    ];

    const mockColleges = [
      { id: 'col-1', collegeName: 'Dwarka Doss Goverdhan Doss Vaishnav College, Chennai', code: 'DDGDVC' },
      { id: 'col-2', collegeName: 'Achariya College of Engineering Technology', code: 'ACET' }
    ];

    await page.route('**/api/admin/subjects*', async (route) => {
      await route.fulfill({ json: mockSubjects });
    });

    await page.route('**/api/admin/colleges*', async (route) => {
      await route.fulfill({ json: mockColleges });
    });

    await page.route('**/api/admin/questions*', async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.route('**/api/admin/central-exams*', async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.route('**/api/admin/departments*', async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.route('**/api/admin/courses*', async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.route('**/api/notifications*', async (route) => {
      await route.fulfill({ json: [] });
    });

    // 1. Super Admin Centralized Assessment Studio
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
      localStorage.setItem('theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    await page.goto('/admin/dashboard?tab=central-exams');
    await page.waitForTimeout(600);

    // Click "Create Central Assessment"
    const createBtn = page.locator('button:has-text("Create Central Assessment")');
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    // Assert that Subject Curriculum dropdown is visible
    const subjectLabel = page.locator('label:has-text("Subject Curriculum")');
    await expect(subjectLabel).toBeVisible();

    const subjectSelect = page.locator('select.form-control').filter({ hasText: 'Select Subject' });
    await expect(subjectSelect).toBeVisible();
    await subjectSelect.selectOption({ label: 'Quantitative & Reasoning Aptitude (QRA)' });

    await page.screenshot({
      path: 'C:/Users/gaswi/.gemini/antigravity/brain/2238139d-389b-4ba7-9e33-d7261ce0c2bb/admin-assessment-studio-subject-dropdown.png',
      fullPage: true
    });

    // 2. Faculty Schedule Exam Modal
    await page.route('**/api/faculty/questions*', async (route) => {
      await route.fulfill({
        json: [
          {
            id: 'q-1',
            text: 'Sample Q1',
            type: 'mcq',
            points: 1,
            difficulty: 'easy',
            subjectId: 'sub-1',
            options: ['A', 'B', 'C', 'D'],
            correctAnswer: '0'
          }
        ]
      });
    });

    await page.route('**/api/faculty/exams*', async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.route('**/api/faculty/results*', async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.route('**/api/faculty/pending-students*', async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.route('**/api/faculty/question-papers*', async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.route('**/api/academic/departments*', async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.route('**/api/academic/courses*', async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.evaluate(() => {
      const facultyUser = {
        id: 'faculty-1',
        name: 'Prof. Faculty User',
        email: 'faculty@skillcetamol.online',
        role: 'faculty',
        status: 'active'
      };
      localStorage.setItem('exam_token', 'mock_token');
      localStorage.setItem('exam_current_user', JSON.stringify(facultyUser));
      localStorage.setItem('theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    await page.goto('/faculty/dashboard?tab=exams');
    await page.waitForTimeout(600);

    // Click "Schedule New Exam"
    const scheduleExamBtn = page.locator('button:has-text("Schedule New Exam")').first();
    await expect(scheduleExamBtn).toBeVisible();
    await scheduleExamBtn.click();

    // Verify modal opened
    const modalHeader = page.locator('h3.modal-title:has-text("Schedule New Examination")');
    await expect(modalHeader).toBeVisible();

    // Verify subject dropdown in faculty modal
    const facultySubSelect = page.locator('select.form-control').filter({ hasText: 'Select Subject Curriculum' });
    await expect(facultySubSelect).toBeVisible();
    await facultySubSelect.selectOption({ label: 'Quantitative & Reasoning Aptitude (QRA)' });

    await page.screenshot({
      path: 'C:/Users/gaswi/.gemini/antigravity/brain/2238139d-389b-4ba7-9e33-d7261ce0c2bb/faculty-schedule-exam-subject-dropdown.png',
      fullPage: true
    });
  });

});
