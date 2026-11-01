import * as XLSX from 'xlsx';
import { ExamResult } from '../types';

interface ExportOptions {
  fileNamePrefix?: string;
  examTitle?: string;
  subjectName?: string;
}

/**
 * Format seconds into a human-readable duration (e.g., "15m 30s")
 */
const formatDuration = (seconds?: number): string => {
  if (seconds === undefined || seconds === null || isNaN(seconds)) return 'N/A';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

/**
 * Robustly resolve correct, wrong, and skipped question counts, score, percentage and status
 */
const resolveCounts = (r: ExamResult) => {
  const totalPts = r.totalPoints && r.totalPoints > 0 ? r.totalPoints : 100;
  let correct = r.correctCount;
  let wrong = r.wrongCount;
  let skipped = r.skippedCount;

  if (typeof correct !== 'number' || isNaN(correct)) {
    const rawScore = Math.max(0, r.score ?? 0);
    correct = Math.min(totalPts, Math.round(rawScore));
    wrong = Math.max(0, totalPts - correct);
    skipped = 0;
  }
  if (typeof wrong !== 'number' || isNaN(wrong)) {
    wrong = Math.max(0, totalPts - (correct ?? 0));
  }
  if (typeof skipped !== 'number' || isNaN(skipped)) {
    skipped = 0;
  }

  // Mathematical integrity validation:
  let score = typeof r.score === 'number' ? Math.max(0, r.score) : 0;
  
  // If student got 0 correct answers, score cannot be positive!
  if (correct === 0) {
    score = 0;
  }

  const percentageNum = totalPts > 0
    ? Math.min(100, Math.max(0, Math.round((score / totalPts) * 100)))
    : 0;

  // Status is strictly PASS only if score > 0 and percentage >= 40%
  const status = (percentageNum >= 40 && score > 0) ? 'PASS' : 'FAIL';

  return { correct, wrong, skipped, score, totalPts, percentage: percentageNum, status };
};

/**
 * Exports a list of student ExamResult objects to an Excel (.xlsx) file
 */
export const exportStudentResultsToExcel = (
  results: ExamResult[],
  options?: ExportOptions
) => {
  if (!results || results.length === 0) {
    return false;
  }

  // 1. Structure the dataset for clean tabular presentation
  const excelData = results.map((r, index) => {
    const { correct, wrong, skipped, score, totalPts, percentage, status } = resolveCounts(r);
    return {
      'S.No': index + 1,
      'Roll Number': r.studentRollNo || 'N/A',
      'Student Name': r.studentName || 'N/A',
      'College': r.collegeName || 'N/A',
      'Department': r.departmentName || r.studentDepartment || 'General',
      'Exam Title': r.examTitle || options?.examTitle || 'N/A',
      'Subject': r.subjectName || options?.subjectName || 'General',
      'Score Secured': score,
      'Total Points': totalPts,
      'Percentage': `${percentage}%`,
      'Correct Answers': correct,
      'Wrong Answers': wrong,
      'Skipped Questions': skipped,
      'Status': status,
      'Time Taken': formatDuration(r.timeTaken),
      'Submission Date & Time': r.submittedAt
        ? new Date(r.submittedAt).toLocaleString()
        : 'N/A'
    };
  });

  // 2. Create SheetJS worksheet and workbook
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // 3. Set custom column widths for pristine Excel presentation
  worksheet['!cols'] = [
    { wch: 6 },  // S.No
    { wch: 18 }, // Roll Number
    { wch: 25 }, // Student Name
    { wch: 32 }, // College
    { wch: 24 }, // Department
    { wch: 30 }, // Exam Title
    { wch: 22 }, // Subject
    { wch: 15 }, // Score Secured
    { wch: 14 }, // Total Points
    { wch: 14 }, // Percentage
    { wch: 16 }, // Correct Answers
    { wch: 16 }, // Wrong Answers
    { wch: 18 }, // Skipped Questions
    { wch: 12 }, // Status
    { wch: 14 }, // Time Taken
    { wch: 24 }  // Submission Date & Time
  ];

  // 4. Enable auto-filter across all columns
  if (excelData.length > 0) {
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:P1');
    worksheet['!autofilter'] = { ref: XLSX.utils.encode_range(range) };
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Results');

  // 5. Generate descriptive filename
  const rawPrefix = options?.examTitle
    ? `Results_${options.examTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}`
    : (options?.fileNamePrefix || 'Student_Examination_Results');
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `${rawPrefix}_${dateStr}.xlsx`;

  // 6. Trigger download
  XLSX.writeFile(workbook, fileName);
  return true;
};

/**
 * Fallback / Alternative: Exports student results to a standard CSV file
 */
export const exportStudentResultsToCSV = (
  results: ExamResult[],
  options?: ExportOptions
) => {
  if (!results || results.length === 0) {
    return false;
  }

  const headers = [
    'S.No',
    'Roll Number',
    'Student Name',
    'College',
    'Department',
    'Exam Title',
    'Subject',
    'Score Secured',
    'Total Points',
    'Percentage',
    'Correct Answers',
    'Wrong Answers',
    'Skipped Questions',
    'Status',
    'Time Taken',
    'Submission Date'
  ];

  const rows = results.map((r, index) => {
    const { correct, wrong, skipped, score, totalPts, percentage, status } = resolveCounts(r);
    return [
      index + 1,
      `"${(r.studentRollNo || '').replace(/"/g, '""')}"`,
      `"${(r.studentName || '').replace(/"/g, '""')}"`,
      `"${(r.collegeName || '').replace(/"/g, '""')}"`,
      `"${(r.departmentName || r.studentDepartment || 'General').replace(/"/g, '""')}"`,
      `"${(r.examTitle || options?.examTitle || '').replace(/"/g, '""')}"`,
      `"${(r.subjectName || options?.subjectName || '').replace(/"/g, '""')}"`,
      score,
      totalPts,
      `"${percentage}%"`,
      correct,
      wrong,
      skipped,
      `"${status}"`,
      `"${formatDuration(r.timeTaken)}"`,
      `"${r.submittedAt ? new Date(r.submittedAt).toLocaleString().replace(/"/g, '""') : ''}"`
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  const rawPrefix = options?.examTitle
    ? `Results_${options.examTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}`
    : (options?.fileNamePrefix || 'Student_Examination_Results');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.download = `${rawPrefix}_${dateStr}.csv`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
};
