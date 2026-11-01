import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, GraduationCap, FileText, CheckCircle, Clock, 
  Trash2, Plus, Search, Settings, SlidersHorizontal, 
  BookOpen, AlertCircle, Sparkles, Server, Check, X, ShieldAlert, Upload, Edit,
  Eye, EyeOff, Copy, Mail, KeyRound, RefreshCw, FolderPlus, CheckSquare,
  FileSpreadsheet, Download, Award
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
  LineChart, Line
} from 'recharts';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { User, Student, Faculty, Department, Course, Subject, Exam, Question, UploadedDocument } from '../types';
import api from '../services/api';
import { cleanPhotoUrl } from '../utils/imageHelper';
import { getProgramsByCategory, filterValidColleges } from '../data/academicPrograms';
import { exportStudentResultsToExcel, exportStudentResultsToCSV } from '../utils/excelExport';

export const AdminDashboard: React.FC = () => {
  const { user, updateCurrentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get('tab') || 'overview';

  // DB States
  const [colleges, setColleges] = useState<any[]>([]);
  const [users, setUsers] = useState<(User | Student | Faculty)[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [lockedExams, setLockedExams] = useState<any[]>([]);

  // Results & Evaluation Filtering States
  const [resultsSearch, setResultsSearch] = useState<string>('');
  const [resultsExamFilter, setResultsExamFilter] = useState<string>('all');
  const [resultsCollegeFilter, setResultsCollegeFilter] = useState<string>('all');
  const [resultsStatusFilter, setResultsStatusFilter] = useState<string>('all');
  const [isRefreshingResults, setIsRefreshingResults] = useState<boolean>(false);
  
  // File Upload states
  const [uploadType, setUploadType] = useState<string>('students');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadSummary, setUploadSummary] = useState<any | null>(null);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);

  // Profile photo upload states
  const [profilePhotoUploading, setProfilePhotoUploading] = useState<boolean>(false);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>(user?.photoUrl || '');
  const [adminName, setAdminName] = useState<string>(user?.name || '');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [profileSaving, setProfileSaving] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      setAdminName(user.name);
    }
  }, [user]);

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Modals / Form States
  const [showFacultyModal, setShowFacultyModal] = useState<boolean>(false);
  const [facName, setFacName] = useState<string>('');
  const [facEmail, setFacEmail] = useState<string>('');
  const [facPassword, setFacPassword] = useState<string>('');
  const [facRole, setFacRole] = useState<string>('faculty');
  const [facId, setFacId] = useState<string>('');
  const [facCollegeId, setFacCollegeId] = useState<string>('');
  const [facDeptId, setFacDeptId] = useState<string>('');
  const [facSelectedSubjects, setFacSelectedSubjects] = useState<string[]>([]);
  const [facEmailError, setFacEmailError] = useState<string>('');
  const [facCollegeError, setFacCollegeError] = useState<string>('');
  const [showFacPassword, setShowFacPassword] = useState<boolean>(false);
  const [showCreatedFacultyModal, setShowCreatedFacultyModal] = useState<boolean>(false);
  const [createdFacultyData, setCreatedFacultyData] = useState<any>(null);
  const [copiedCredentials, setCopiedCredentials] = useState<boolean>(false);
  const [resendingFacultyId, setResendingFacultyId] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [resetTargetUser, setResetTargetUser] = useState<any>(null);
  const [resetNewPassword, setResetNewPassword] = useState<string>('faculty123');
  const [showResetNewPassword, setShowResetNewPassword] = useState<boolean>(false);

  const [showCollegeModal, setShowCollegeModal] = useState<boolean>(false);
  const [collegeNameInput, setCollegeNameInput] = useState<string>('');
  const [collegeCodeInput, setCollegeCodeInput] = useState<string>('');
  const [collegeCategoryInput, setCollegeCategoryInput] = useState<'Both' | 'Engineering' | 'Arts & Science'>('Both');
  const [collegeSearchFilter, setCollegeSearchFilter] = useState<string>('');

  const [showDeptModal, setShowDeptModal] = useState<boolean>(false);
  const [deptName, setDeptName] = useState<string>('');
  const [deptCode, setDeptCode] = useState<string>('');
  const [deptCollegeId, setDeptCollegeId] = useState<string>('');
  const [deptCategory, setDeptCategory] = useState<'Engineering' | 'Arts & Science'>('Engineering');
  const [deptFilterCollege, setDeptFilterCollege] = useState<string>('');
  const [deptFilterCategory, setDeptFilterCategory] = useState<string>('');
  const [deptFilterSearch, setDeptFilterSearch] = useState<string>('');

  const [showCourseModal, setShowCourseModal] = useState<boolean>(false);
  const [courseName, setCourseName] = useState<string>('');
  const [courseCode, setCourseCode] = useState<string>('');
  const [courseDeptId, setCourseDeptId] = useState<string>('');
  const [courseDuration, setCourseDuration] = useState<number>(3);

  const [showSubjectModal, setShowSubjectModal] = useState<boolean>(false);
  const [subName, setSubName] = useState<string>('');
  const [subCode, setSubCode] = useState<string>('');
  const [subCourseId, setSubCourseId] = useState<string>('');

  // ── Question Bank State ──────────────────────────────────────
  const [showQuestionModal, setShowQuestionModal] = useState<boolean>(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [qSubjectId, setQSubjectId] = useState<string>('');
  const [qText, setQText] = useState<string>('');
  const [qType, setQType] = useState<'mcq' | 'checkbox' | 'text'>('mcq');
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qCorrectAnswer, setQCorrectAnswer] = useState<string | string[]>('0');
  const [qPoints, setQPoints] = useState<number>(5);
  const [qDifficulty, setQDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('');
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('');
  const [questionPage, setQuestionPage] = useState<number>(1);
  const questionsPerPage = 50;

  // ── New Topic / Subject Creation State ────────────────────────
  const [showNewTopicModal, setShowNewTopicModal] = useState<boolean>(false);
  const [newTopicName, setNewTopicName] = useState<string>('');
  const [creatingTopicLoading, setCreatingTopicLoading] = useState<boolean>(false);
  const [showInlineTopicInput, setShowInlineTopicInput] = useState<boolean>(false);
  const [inlineTopicName, setInlineTopicName] = useState<string>('');

  // ── Delete Topic State ────────────────────────────────────────
  const [showDeleteTopicModal, setShowDeleteTopicModal] = useState<boolean>(false);
  const [topicToDelete, setTopicToDelete] = useState<Subject | null>(null);
  const [deletingTopicLoading, setDeletingTopicLoading] = useState<boolean>(false);

  // ── Question Selection & Delete State ─────────────────────────
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [showDeleteQuestionsModal, setShowDeleteQuestionsModal] = useState<boolean>(false);
  const [questionsToDelete, setQuestionsToDelete] = useState<Question[]>([]);
  const [deletingQuestionsLoading, setDeletingQuestionsLoading] = useState<boolean>(false);

  // ── Question Deletion Progress Tracking with Live Numbers ──────
  const [deleteProgress, setDeleteProgress] = useState<{
    current: number;
    total: number;
    percentage: number;
    statusText?: string;
  } | null>(null);
  const [deleteSubjectQuestionsOnly, setDeleteSubjectQuestionsOnly] = useState<boolean>(false);

  // ── Bulk Question Upload State ────────────────────────────────
  const [showBulkUploadModal, setShowBulkUploadModal] = useState<boolean>(false);
  const [bulkDocName, setBulkDocName] = useState<string>('');
  const [bulkSubjectId, setBulkSubjectId] = useState<string>('');
  const [bulkQFile, setBulkQFile] = useState<File | null>(null);
  const [bulkAnsFile, setBulkAnsFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState<boolean>(false);
  const [bulkQuestionType, setBulkQuestionType] = useState<'mcq' | 'checkbox' | 'auto'>('mcq');
  const [showBulkInlineTopic, setShowBulkInlineTopic] = useState<boolean>(false);
  const [bulkInlineTopicName, setBulkInlineTopicName] = useState<string>('');
  const [bulkCreatingTopic, setBulkCreatingTopic] = useState<boolean>(false);

  // ── Q-Papers / Document Extractor State for Admin ─────────────
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [loadingQPapers, setLoadingQPapers] = useState<boolean>(false);
  const [selectedDocForQuestions, setSelectedDocForQuestions] = useState<UploadedDocument | null>(null);
  const [docQuestions, setDocQuestions] = useState<Question[]>([]);
  const [loadingDocQuestions, setLoadingDocQuestions] = useState<boolean>(false);
  const [showDocQuestionsModal, setShowDocQuestionsModal] = useState<boolean>(false);
  const [qPaperName, setQPaperName] = useState<string>('');
  const [qPaperSubjectId, setQPaperSubjectId] = useState<string>('');
  const [qPaperFile, setQPaperFile] = useState<File | null>(null);
  const [qAnswerFile, setQAnswerFile] = useState<File | null>(null);
  const [qPaperQuestionType, setQPaperQuestionType] = useState<'mcq' | 'checkbox' | 'auto'>('mcq');
  const [uploadingQPaper, setUploadingQPaper] = useState<boolean>(false);

  // ── Global User Search state ─────────────────────────────────
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchTotal, setSearchTotal] = useState<number>(0);
  const [searchPage, setSearchPage] = useState<number>(1);
  const [searchPages, setSearchPages] = useState<number>(1);
  const [searchRole, setSearchRole] = useState<string>('');
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [searchDept, setSearchDept] = useState<string>('');
  const [searchSort, setSearchSort] = useState<string>('newest');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [drawerLoading, setDrawerLoading] = useState<boolean>(false);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Fetch data
  const fetchData = async () => {
    try {
      const colRes = await api.get('/admin/colleges');
      setColleges(filterValidColleges(colRes.data || []));

      const usersRes = await api.get('/admin/users');
      setUsers(usersRes.data);

      const deptRes = await api.get('/admin/departments');
      setDepartments(deptRes.data);

      const courseRes = await api.get('/admin/courses');
      setCourses(courseRes.data);

      const subRes = await api.get('/admin/subjects');
      setSubjects(subRes.data);

      const examRes = await api.get('/faculty/exams');
      setExams(examRes.data);

      const questRes = await api.get('/faculty/questions');
      setQuestions(questRes.data);

      let resultsData: any[] = [];
      try {
        const resRes = await api.get('/admin/results');
        resultsData = resRes.data || [];
      } catch {
        try {
          const resRes = await api.get('/faculty/results');
          resultsData = resRes.data || [];
        } catch {
          resultsData = [];
        }
      }
      const sanitizedResults = (resultsData || []).map((r: any) => {
        const isZero = (typeof r.correctCount === 'number' && r.correctCount === 0 && (r.totalPoints || 100) > 0);
        const score = isZero ? 0 : (r.score ?? 0);
        const totalPoints = r.totalPoints && r.totalPoints > 0 ? r.totalPoints : 100;
        const percentage = isZero ? 0 : (r.percentage ?? 0);
        const status = (score > 0 && percentage >= 40) ? 'pass' : 'fail';
        return { ...r, score, totalPoints, percentage, status };
      });
      setResults(sanitizedResults);

      const lockedRes = await api.get('/admin/locked-exams');
      setLockedExams(lockedRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/colleges', {
        collegeName: collegeNameInput,
        code: collegeCodeInput,
        category: collegeCategoryInput
      });
      showToast('College added successfully!', 'success');
      setShowCollegeModal(false);
      setCollegeNameInput('');
      setCollegeCodeInput('');
      setCollegeCategoryInput('Both');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error adding college.', 'error');
    }
  };

  const handleDeleteCollege = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this college?')) {
      try {
        await api.delete(`/admin/colleges/${id}`);
        showToast('College deleted successfully.', 'info');
        fetchData();
      } catch (err: any) {
        showToast('Failed to delete college.', 'error');
      }
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await api.delete(`/admin/departments/${id}`);
        showToast('Department deleted successfully.', 'info');
        fetchData();
      } catch (err: any) {
        showToast('Failed to delete department.', 'error');
      }
    }
  };

  const handleResetDatabase = async () => {
    if (!window.confirm('CRITICAL ACTION: Are you sure you want to reset the database? This will delete all current student and faculty accounts, exams, questions, and submission results for a clean restart.')) {
      return;
    }
    try {
      await api.post('/admin/reset-database');
      showToast('System database successfully reset to a fresh clean slate!', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error resetting database.', 'error');
    }
  };

  const handleUnlockExam = async (id: string, studentName?: string) => {
    try {
      await api.post(`/admin/locked-exams/${id}/unlock`);
      showToast(`Re-entry authorized for ${studentName || 'student'}. New random questions will be generated upon retake.`, 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error approving retake for student.', 'error');
    }
  };

  useEffect(() => {
    fetchData();
    if (activeTab === 'qpapers') {
      fetchUploadedQPapers();
    }
  }, [activeTab]);

  // Profile photo upload handler
  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const uploadRes = await api.post('/auth/upload-profile-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = uploadRes.data.url;
      await api.put('/auth/profile-photo', { photoUrl: url });
      setProfilePhotoPreview(url);
      if (user) {
        updateCurrentUser({ ...user, photoUrl: url });
      }
      showToast('Profile photo updated!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to upload photo.', 'error');
    } finally {
      setProfilePhotoUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await api.put('/auth/update-profile', {
        name: adminName,
        password: adminPassword || undefined
      });
      updateCurrentUser(res.data.user);
      setAdminPassword('');
      showToast('Profile details updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update profile settings.', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Global Search handlers ───────────────────────────────────
  const runSearch = async (q: string, role: string, status: string, dept: string, sort: string, page: number) => {
    setSearchLoading(true);
    try {
      const params = new URLSearchParams();
      if (q)      params.set('q', q);
      if (role)   params.set('role', role);
      if (status) params.set('status', status);
      if (dept)   params.set('departmentId', dept);
      params.set('sort', sort);
      params.set('page', String(page));
      params.set('limit', '15');
      const res = await api.get(`/admin/search-users?${params.toString()}`);
      setSearchResults(res.data.users);
      setSearchTotal(res.data.total);
      setSearchPages(res.data.totalPages);
      setSearchPage(res.data.page);
    } catch { /* handled silently */ }
    finally { setSearchLoading(false); }
  };

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
    const t = setTimeout(() => {
      runSearch(value, searchRole, searchStatus, searchDept, searchSort, 1);
    }, 300);
    setSearchDebounceTimer(t);
  };

  const openUserDrawer = async (userId: string) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const res = await api.get(`/admin/user/${userId}`);
      setSelectedUser(res.data);
    } catch { setSelectedUser(null); }
    finally { setDrawerLoading(false); }
  };

  const handleUpdateStatus = async (userId: string, status: string) => {
    try {
      await api.put(`/admin/user/${userId}/status`, { status });
      showToast(`Account ${status}.`, 'success');
      setSelectedUser((u: any) => u ? { ...u, status } : u);
      runSearch(searchQuery, searchRole, searchStatus, searchDept, searchSort, searchPage);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Status update failed.', 'error');
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!window.confirm('Reset this user\'s password and email it to them?')) return;
    try {
      await api.post(`/admin/user/${userId}/reset-password`);
      showToast('Password reset and emailed to user.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Reset failed.', 'error');
    }
  };

  // Actions
  const handleApproveStudent = async (id: string) => {
    try {
      await api.post(`/admin/users/${id}/approve`);
      showToast('Student account approved successfully.', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error approving student.', 'error');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        await api.delete(`/admin/users/${id}`);
        showToast('User account deleted.', 'info');
        fetchData();
      } catch (err) {
        showToast('Error deleting user.', 'error');
      }
    }
  };

  const handleResendFacultyWelcome = async (fac: any) => {
    setResendingFacultyId(fac.id);
    try {
      const res = await api.post(`/admin/faculty/${fac.id}/resend-welcome`, {
        password: 'faculty123'
      });
      if (res.data.emailSent) {
        showToast(`Welcome email with credentials sent to ${fac.email}!`, 'success');
      } else {
        showToast(`Password updated to "faculty123", but mail delivery failed: ${res.data.emailError}. Share password manually.`, 'warning');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to resend welcome email.', 'error');
    } finally {
      setResendingFacultyId(null);
    }
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;
    const pwd = resetNewPassword.trim() || 'faculty123';
    try {
      const res = await api.post(`/admin/faculty/${resetTargetUser.id}/reset-password`, {
        newPassword: pwd
      });
      if (res.data.emailSent) {
        showToast(`Password for ${resetTargetUser.name} reset to "${pwd}" and emailed successfully!`, 'success');
      } else {
        showToast(`Password reset to "${pwd}", but email failed: ${res.data.emailError}. Please share manually.`, 'warning');
      }
      setShowResetModal(false);
      setResetTargetUser(null);
      setResetNewPassword('faculty123');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Password reset failed.', 'error');
    }
  };

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setFacEmailError('');
    setFacCollegeError('');

    if (facRole === 'faculty' && !facCollegeId) {
      setFacCollegeError('Please select a college for the faculty member.');
      showToast('Please select a college for the faculty member.', 'warning');
      return;
    }

    const assignedPassword = facPassword && facPassword.trim() ? facPassword.trim() : 'faculty123';

    try {
      const res = await api.post('/admin/faculty', {
        name: facName,
        email: facEmail,
        password: assignedPassword,
        facultyId: facId,
        collegeId: facCollegeId || undefined,
        role: facRole
      });

      const assignedCollege = colleges.find(c => c.id === facCollegeId);
      const createdData = {
        id: res.data.id,
        name: res.data.name || facName,
        email: res.data.email || facEmail,
        facultyId: res.data.facultyId || facId,
        collegeName: res.data.collegeName || assignedCollege?.collegeName || 'N/A',
        password: res.data.password || assignedPassword,
        emailSent: res.data.emailSent,
        emailError: res.data.emailError
      };

      setCreatedFacultyData(createdData);
      setShowCreatedFacultyModal(true);
      setShowFacultyModal(false);

      if (res.data?.emailSent === false) {
        showToast(`Account for ${facName} created, but welcome email failed: ${res.data.emailError || 'Email delivery failed'}. Please share credentials manually.`, 'warning');
      } else {
        showToast(`Account for ${facName} created successfully! Welcome email sent.`, 'success');
      }

      // Reset form
      setFacName('');
      setFacEmail('');
      setFacPassword('');
      setFacRole('faculty');
      setFacId('');
      setFacCollegeId('');
      setFacDeptId('');
      setFacSelectedSubjects([]);
      setFacEmailError('');
      setFacCollegeError('');
      setShowFacPassword(false);
      fetchData();
    } catch (err: any) {
      const errData = err.response?.data;
      if (errData?.field === 'collegeId' || errData?.message?.includes('already exists for this college')) {
        setFacCollegeError(errData.message || 'A faculty account already exists for this college.');
        showToast(errData.message || 'A faculty account already exists for this college.', 'error');
      } else if (errData?.field === 'email') {
        setFacEmailError(errData.message);
        showToast(errData.message, 'error');
      } else if (errData?.errors && Array.isArray(errData.errors) && errData.errors.length > 0) {
        const errorList = errData.errors.map((e: any) => `${e.field}: ${e.message}`).join(' | ');
        showToast(errorList, 'error');
      } else {
        showToast(errData?.message || 'Error creating user account.', 'error');
      }
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/departments', {
        name: deptName,
        departmentName: deptName,
        code: deptCode,
        collegeId: deptCollegeId || undefined,
        category: deptCategory || 'Engineering'
      });
      showToast('Department added.', 'success');
      setShowDeptModal(false);
      setDeptName('');
      setDeptCode('');
      setDeptCollegeId('');
      setDeptCategory('Engineering');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error adding department.', 'error');
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/courses', {
        name: courseName,
        code: courseCode,
        departmentId: courseDeptId,
        durationYears: courseDuration
      });
      showToast('Course added.', 'success');
      setShowCourseModal(false);
      setCourseName('');
      setCourseCode('');
      setCourseDeptId('');
      setCourseDuration(3);
      fetchData();
    } catch (err) {
      showToast('Error adding course.', 'error');
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/subjects', {
        name: subName,
        code: subCode,
        courseId: subCourseId
      });
      showToast('Subject added.', 'success');
      setShowSubjectModal(false);
      setSubName('');
      setSubCode('');
      setSubCourseId('');
      fetchData();
    } catch (err) {
      showToast('Error adding subject.', 'error');
    }
  };

  const handleRevokeExam = async (id: string) => {
    if (window.confirm('Are you sure you want to revoke exam access for this student? This will submit their exam with current answers.')) {
      try {
        await api.put(`/admin/revoke-exam/${id}`);
        showToast('Exam access revoked and attempt final submitted.', 'info');
        fetchData();
      } catch (err: any) {
        showToast(err.response?.data?.message || 'Error revoking exam.', 'error');
      }
    }
  };

  const handleOpenAddQuestionModal = () => {
    setEditingQuestion(null);
    setQSubjectId(selectedSubjectFilter || (subjects.length > 0 ? subjects[0].id : ''));
    setQText('');
    setQType('mcq');
    setQOptions(['', '', '', '']);
    setQCorrectAnswer('0');
    setQPoints(5);
    setQDifficulty('medium');
    setShowInlineTopicInput(false);
    setInlineTopicName('');
    setShowQuestionModal(true);
  };

  const handleCreateNewTopic = async (addQuestionsAfter: boolean = false) => {
    const trimmed = newTopicName.trim();
    if (!trimmed) {
      showToast('Please enter a topic / subject name.', 'warning');
      return;
    }

    setCreatingTopicLoading(true);
    try {
      const res = await api.post('/admin/subjects', { name: trimmed });
      const createdSub: Subject = {
        id: res.data.id,
        name: res.data.name,
        code: res.data.code,
        courseId: res.data.courseId
      };

      setSubjects(prev => {
        if (prev.some(s => s.id === createdSub.id)) return prev;
        return [...prev, createdSub].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      });

      setSelectedSubjectFilter(createdSub.id);
      setNewTopicName('');
      setShowNewTopicModal(false);

      if (addQuestionsAfter) {
        setEditingQuestion(null);
        setQSubjectId(createdSub.id);
        setQText('');
        setQType('mcq');
        setQOptions(['', '', '', '']);
        setQCorrectAnswer('0');
        setQPoints(5);
        setQDifficulty('medium');
        setShowInlineTopicInput(false);
        setInlineTopicName('');
        setShowQuestionModal(true);
        showToast(`Topic "${createdSub.name}" created! Add your first question to it below.`, 'success');
      } else {
        showToast(`Topic "${createdSub.name}" created successfully.`, 'success');
      }
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error creating topic.', 'error');
    } finally {
      setCreatingTopicLoading(false);
    }
  };

  const handleCreateInlineTopic = async () => {
    const trimmed = inlineTopicName.trim();
    if (!trimmed) {
      showToast('Please enter a topic / subject name.', 'warning');
      return;
    }

    setCreatingTopicLoading(true);
    try {
      const res = await api.post('/admin/subjects', { name: trimmed });
      const createdSub: Subject = {
        id: res.data.id,
        name: res.data.name,
        code: res.data.code,
        courseId: res.data.courseId
      };

      setSubjects(prev => {
        if (prev.some(s => s.id === createdSub.id)) return prev;
        return [...prev, createdSub].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      });

      setQSubjectId(createdSub.id);
      setInlineTopicName('');
      setShowInlineTopicInput(false);
      showToast(`Topic "${createdSub.name}" created and selected!`, 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error creating topic.', 'error');
    } finally {
      setCreatingTopicLoading(false);
    }
  };

  const handleCreateBulkInlineTopic = async () => {
    const trimmed = bulkInlineTopicName.trim();
    if (!trimmed) {
      showToast('Please enter a topic / subject name.', 'warning');
      return;
    }

    setBulkCreatingTopic(true);
    try {
      const res = await api.post('/admin/subjects', { name: trimmed });
      const createdSub: Subject = {
        id: res.data.id,
        name: res.data.name,
        code: res.data.code,
        courseId: res.data.courseId
      };

      setSubjects(prev => {
        if (prev.some(s => s.id === createdSub.id)) return prev;
        return [...prev, createdSub].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      });

      setBulkSubjectId(createdSub.id);
      setBulkInlineTopicName('');
      setShowBulkInlineTopic(false);
      showToast(`Topic "${createdSub.name}" created and selected!`, 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error creating topic.', 'error');
    } finally {
      setBulkCreatingTopic(false);
    }
  };

  const handleOpenDeleteTopicModal = (subjectId?: string) => {
    setDeleteSubjectQuestionsOnly(false);
    const targetId = subjectId || selectedSubjectFilter;
    if (targetId) {
      const found = subjects.find(s => s.id === targetId);
      if (found) {
        setTopicToDelete(found);
        setShowDeleteTopicModal(true);
        return;
      }
    }
    if (subjects.length > 0) {
      setTopicToDelete(subjects[0]);
      setShowDeleteTopicModal(true);
    } else {
      showToast('No topics available to delete.', 'info');
    }
  };

  const handleOpenDeleteSubjectQuestions = (subjectId: string) => {
    const targetSub = subjects.find(s => s.id === subjectId);
    const subjectQuestions = questions.filter(q => q.subjectId === subjectId);
    if (subjectQuestions.length === 0) {
      showToast(`No questions found under "${targetSub?.name || 'this topic'}".`, 'info');
      return;
    }
    setQuestionsToDelete(subjectQuestions);
    setShowDeleteQuestionsModal(true);
  };

  const handleConfirmDeleteTopic = async () => {
    if (!topicToDelete) return;
    setDeletingTopicLoading(true);

    const topicQuestions = questions.filter(q => q.subjectId === topicToDelete.id);
    const totalQuestions = topicQuestions.length;

    try {
      // Step 1: If topic has questions, delete them in small batches with real-time live progress tracking
      if (totalQuestions > 0) {
        setDeleteProgress({
          current: 0,
          total: totalQuestions,
          percentage: 0,
          statusText: `Deleting questions: 0 / ${totalQuestions} (0%)`
        });

        const ids = topicQuestions.map(q => q.id);
        const CHUNK_SIZE = totalQuestions > 1000 ? 100 : (totalQuestions > 200 ? 50 : 25);
        let deletedCount = 0;

        for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
          const chunk = ids.slice(i, i + CHUNK_SIZE);
          await api.post('/admin/questions/bulk-delete', { ids: chunk });
          deletedCount += chunk.length;
          const pct = Math.round((deletedCount / totalQuestions) * 100);
          setDeleteProgress({
            current: deletedCount,
            total: totalQuestions,
            percentage: pct,
            statusText: `Deleting questions: ${deletedCount} / ${totalQuestions} (${pct}%)`
          });
          setQuestions(prev => prev.filter(q => !chunk.includes(q.id)));
          setSelectedQuestionIds(prev => prev.filter(id => !chunk.includes(id)));
        }
      }

      if (deleteSubjectQuestionsOnly) {
        showToast(`Successfully cleared all ${totalQuestions} question(s) from "${topicToDelete.name}".`, 'success');
        setShowDeleteTopicModal(false);
        setTopicToDelete(null);
        setDeleteSubjectQuestionsOnly(false);
        setQuestionPage(1);
        fetchData();
        return;
      }

      // Step 2: Delete the topic entity itself
      setDeleteProgress({
        current: totalQuestions,
        total: totalQuestions > 0 ? totalQuestions : 1,
        percentage: 100,
        statusText: `Finalizing deletion of topic "${topicToDelete.name}"...`
      });

      const res = await api.delete(`/admin/subjects/${topicToDelete.id}`);
      showToast(res.data?.message || `Topic "${topicToDelete.name}" and ${totalQuestions} question(s) removed successfully.`, 'success');

      // Instantly remove from local states
      setSubjects(prev => prev.filter(s => s.id !== topicToDelete.id));
      setQuestions(prev => prev.filter(q => q.subjectId !== topicToDelete.id));

      if (selectedSubjectFilter === topicToDelete.id) {
        setSelectedSubjectFilter('');
      }
      setShowDeleteTopicModal(false);
      setTopicToDelete(null);
      setQuestionPage(1);

      // Re-fetch all data to ensure complete synchronization
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete topic.', 'error');
    } finally {
      setDeletingTopicLoading(false);
      setDeleteProgress(null);
    }
  };

  const handleBulkUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkDocName.trim() || !bulkSubjectId || !bulkQFile) {
      showToast('Please provide a document title, select a topic, and pick a question file.', 'warning');
      return;
    }

    setBulkUploading(true);
    try {
      const formData = new FormData();
      formData.append('name', bulkDocName.trim());
      formData.append('subjectId', bulkSubjectId);
      formData.append('file', bulkQFile);
      formData.append('questionType', bulkQuestionType);
      if (bulkAnsFile) {
        formData.append('answerFile', bulkAnsFile);
      }

      const res = await api.post('/admin/upload-qpaper', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast(res.data.message || 'Questions extracted and added to question bank!', 'success');
      setShowBulkUploadModal(false);
      setBulkDocName('');
      setBulkQuestionType('mcq');
      setBulkQFile(null);
      setBulkAnsFile(null);
      const qInput = document.getElementById('admin-bulk-qfile') as HTMLInputElement;
      if (qInput) qInput.value = '';
      const ansInput = document.getElementById('admin-bulk-ansfile') as HTMLInputElement;
      if (ansInput) ansInput.value = '';
      await fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to upload and extract questions.', 'error');
    } finally {
      setBulkUploading(false);
    }
  };

  const handleOpenEditQuestionModal = (q: Question) => {
    setEditingQuestion(q);
    setQSubjectId(q.subjectId);
    setQText(q.text);
    setQType(q.type as any);
    setQOptions(q.options && q.options.length > 0 ? [...q.options] : ['', '', '', '']);
    const initCorrect = Array.isArray(q.correctAnswer)
      ? q.correctAnswer.map(String)
      : (q.correctAnswer !== undefined && q.correctAnswer !== null ? [String(q.correctAnswer)] : ['0']);
    setQCorrectAnswer(q.type === 'mcq' ? (initCorrect[0] || '0') : initCorrect);
    setQPoints(q.points || 5);
    setQDifficulty(q.difficulty as any);
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim() || !qSubjectId) {
      showToast('Please enter question text and select a subject.', 'error');
      return;
    }

    try {
      const finalCorrectAnswer = qType === 'mcq'
        ? (Array.isArray(qCorrectAnswer) ? qCorrectAnswer[0] || '0' : String(qCorrectAnswer || '0'))
        : (Array.isArray(qCorrectAnswer) ? qCorrectAnswer : [String(qCorrectAnswer || '0')]);

      if (editingQuestion) {
        await api.put(`/admin/questions/${editingQuestion.id}`, {
          subjectId: qSubjectId,
          text: qText,
          type: qType,
          options: qType !== 'text' ? qOptions : [],
          correctAnswer: finalCorrectAnswer,
          points: qPoints,
          difficulty: qDifficulty
        });
        showToast('Question updated in Question Bank.', 'success');
      } else {
        await api.post('/admin/questions', {
          subjectId: qSubjectId,
          text: qText,
          type: qType,
          options: qType !== 'text' ? qOptions : [],
          correctAnswer: finalCorrectAnswer,
          points: qPoints,
          difficulty: qDifficulty
        });
        showToast('New question added to Question Bank.', 'success');
      }

      setShowQuestionModal(false);
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error saving question.', 'error');
    }
  };

  const fetchUploadedQPapers = async () => {
    setLoadingQPapers(true);
    try {
      const res = await api.get('/admin/uploaded-qpapers');
      setUploadedDocuments(res.data || []);
    } catch (err: any) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoadingQPapers(false);
    }
  };

  const handleUploadQPaperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qPaperName || !qPaperSubjectId || !qPaperFile) {
      showToast('All fields and file are required.', 'warning');
      return;
    }
    setUploadingQPaper(true);
    try {
      const formData = new FormData();
      formData.append('name', qPaperName);
      formData.append('subjectId', qPaperSubjectId);
      formData.append('file', qPaperFile);
      formData.append('questionType', qPaperQuestionType);
      if (qAnswerFile) {
        formData.append('answerFile', qAnswerFile);
      }

      const res = await api.post('/admin/upload-qpaper', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast(res.data.message || 'Q-Paper uploaded and questions extracted!', 'success');

      setQPaperName('');
      setQPaperSubjectId('');
      setQPaperQuestionType('mcq');
      setQPaperFile(null);
      setQAnswerFile(null);
      const fileInput = document.getElementById('admin-qpaper-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      const ansFileInput = document.getElementById('admin-qpaper-ans-file-input') as HTMLInputElement;
      if (ansFileInput) ansFileInput.value = '';

      await fetchUploadedQPapers();
      await fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to upload and extract questions.', 'error');
    } finally {
      setUploadingQPaper(false);
    }
  };

  const handleDeleteQPaper = async (id: string) => {
    if (!window.confirm('Delete this uploaded question paper and all extracted questions?')) return;
    try {
      await api.delete(`/admin/uploaded-qpapers/${id}`);
      showToast('Question paper deleted.', 'info');
      await fetchUploadedQPapers();
      await fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete question paper.', 'error');
    }
  };

  const handleViewDocQuestionsClick = async (doc: UploadedDocument) => {
    setSelectedDocForQuestions(doc);
    setShowDocQuestionsModal(true);
    setLoadingDocQuestions(true);
    try {
      const res = await api.get(`/admin/uploaded-qpapers/${doc.id}/questions`);
      setDocQuestions(res.data || []);
    } catch (err: any) {
      showToast('Failed to fetch extracted questions.', 'error');
    } finally {
      setLoadingDocQuestions(false);
    }
  };

  const handleToggleSelectQuestion = (id: string) => {
    setSelectedQuestionIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllPage = (pageQuestions: Question[]) => {
    const pageIds = pageQuestions.map(q => q.id);
    const allSelected = pageIds.length > 0 && pageIds.every(id => selectedQuestionIds.includes(id));
    if (allSelected) {
      setSelectedQuestionIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedQuestionIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleSelectAllFiltered = (allFiltered: Question[]) => {
    setSelectedQuestionIds(allFiltered.map(q => q.id));
  };

  const handleClearSelection = () => {
    setSelectedQuestionIds([]);
  };

  const handleOpenDeleteSingleQuestion = (question: Question) => {
    setQuestionsToDelete([question]);
    setShowDeleteQuestionsModal(true);
  };

  const handleOpenDeleteSelectedQuestions = () => {
    if (selectedQuestionIds.length === 0) {
      showToast('Please select at least one question to delete.', 'warning');
      return;
    }
    const toDelete = questions.filter(q => selectedQuestionIds.includes(q.id));
    setQuestionsToDelete(toDelete);
    setShowDeleteQuestionsModal(true);
  };

  const handleConfirmDeleteQuestions = async () => {
    if (questionsToDelete.length === 0) return;
    setDeletingQuestionsLoading(true);
    const total = questionsToDelete.length;

    setDeleteProgress({
      current: 0,
      total,
      percentage: 0,
      statusText: `Starting deletion of ${total} question(s)...`
    });

    try {
      const ids = questionsToDelete.map(q => q.id);
      const CHUNK_SIZE = total > 1000 ? 100 : (total > 200 ? 50 : 25);
      let deletedCount = 0;

      for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
        const chunk = ids.slice(i, i + CHUNK_SIZE);
        if (chunk.length === 1 && ids.length === 1) {
          await api.delete(`/admin/questions/${chunk[0]}`);
        } else {
          await api.post('/admin/questions/bulk-delete', { ids: chunk });
        }
        deletedCount += chunk.length;
        const pct = Math.round((deletedCount / total) * 100);
        setDeleteProgress({
          current: deletedCount,
          total,
          percentage: pct,
          statusText: `Deleting questions: ${deletedCount} / ${total} (${pct}%)`
        });

        // Update local question lists progressively
        setQuestions(prev => prev.filter(q => !chunk.includes(q.id)));
        setSelectedQuestionIds(prev => prev.filter(id => !chunk.includes(id)));
      }

      showToast(`Successfully deleted ${total} question(s).`, 'success');
      setShowDeleteQuestionsModal(false);
      setQuestionsToDelete([]);
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error deleting question(s).', 'error');
    } finally {
      setDeletingQuestionsLoading(false);
      setDeleteProgress(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      showToast('Please select a file to upload.', 'warning');
      return;
    }

    setUploadLoading(true);
    setUploadSummary(null);

    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const response = await api.post(`/upload/${uploadType}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadSummary(response.data);
      showToast('File processed and imported.', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error processing file upload.', 'error');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDownloadErrorReport = () => {
    if (!uploadSummary || !uploadSummary.validationErrors || uploadSummary.validationErrors.length === 0) return;
    
    const reportText = uploadSummary.validationErrors.map((err: any) => {
      return `Row ${err.row}: ${err.errors.join(' | ')}`;
    }).join('\n');

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `error_report_${uploadType}_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchResults = async () => {
    setIsRefreshingResults(true);
    try {
      let resultsData: any[] = [];
      try {
        const resRes = await api.get('/admin/results');
        resultsData = resRes.data || [];
      } catch {
        try {
          const resRes = await api.get('/faculty/results');
          resultsData = resRes.data || [];
        } catch {
          resultsData = [];
        }
      }
      const sanitizedResults = (resultsData || []).map((r: any) => {
        const isZero = (typeof r.correctCount === 'number' && r.correctCount === 0 && (r.totalPoints || 100) > 0);
        const score = isZero ? 0 : (r.score ?? 0);
        const totalPoints = r.totalPoints && r.totalPoints > 0 ? r.totalPoints : 100;
        const percentage = isZero ? 0 : (r.percentage ?? 0);
        const status = (score > 0 && percentage >= 40) ? 'pass' : 'fail';
        return { ...r, score, totalPoints, percentage, status };
      });
      setResults(sanitizedResults);
      showToast('Exam results refreshed successfully.', 'success');
    } catch (err: any) {
      showToast('Failed to refresh exam results.', 'error');
    } finally {
      setIsRefreshingResults(false);
    }
  };

  // Filtered Results for Admin Results & Reports View
  const filteredResults = results.filter(r => {
    const q = resultsSearch.trim().toLowerCase();
    const matchesSearch = !q ||
      (r.studentName && r.studentName.toLowerCase().includes(q)) ||
      (r.studentRollNo && r.studentRollNo.toLowerCase().includes(q)) ||
      (r.examTitle && r.examTitle.toLowerCase().includes(q)) ||
      (r.collegeName && r.collegeName.toLowerCase().includes(q)) ||
      (r.departmentName && r.departmentName.toLowerCase().includes(q));

    const matchesExam = resultsExamFilter === 'all' || r.examId === resultsExamFilter;
    const matchesCollege = resultsCollegeFilter === 'all' || 
      (r.collegeName && r.collegeName.toLowerCase().includes(resultsCollegeFilter.toLowerCase()));
    const matchesStatus = resultsStatusFilter === 'all' || r.status?.toLowerCase() === resultsStatusFilter;

    return matchesSearch && matchesExam && matchesCollege && matchesStatus;
  });

  const handleExportResultsExcel = () => {
    if (filteredResults.length === 0) {
      showToast('No student result records matching the filter to export.', 'warning');
      return;
    }
    const currentExam = exams.find(e => e.id === resultsExamFilter);
    exportStudentResultsToExcel(filteredResults, {
      examTitle: currentExam?.title,
      subjectName: currentExam?.subjectName,
      fileNamePrefix: 'Attended_Students_Exam_Marks'
    });
    showToast(`Exported ${filteredResults.length} student marks to Excel (.xlsx) successfully!`, 'success');
  };

  const handleExportReportsCSV = () => {
    if (filteredResults.length === 0) {
      showToast('No report records to export.', 'warning');
      return;
    }
    const currentExam = exams.find(e => e.id === resultsExamFilter);
    exportStudentResultsToCSV(filteredResults, {
      examTitle: currentExam?.title,
      subjectName: currentExam?.subjectName,
      fileNamePrefix: 'Attended_Students_Exam_Marks'
    });
    showToast(`Exported ${filteredResults.length} student marks to CSV successfully!`, 'success');
  };

  // Filter lists
  const students = users.filter(u => u.role === 'student') as Student[];
  const faculties = users.filter(u => u.role === 'faculty') as Faculty[];
  const activeStudents = students.filter(s => s.status === 'active');
  const pendingStudents = students.filter(s => s.status === 'pending');

  // Chart Data calculations
  const deptStudentCounts = departments.map(d => {
    const count = students.filter(s => s.departmentId === d.id).length;
    return { name: d.code, Students: count };
  });

  const passFailData = [
    { name: 'Passed', value: results.filter(r => r.status === 'pass').length },
    { name: 'Failed', value: results.filter(r => r.status === 'fail').length }
  ];

  const studentGrowthData = (() => {
    const datesMap: Record<string, number> = {};
    const sortedStudents = [...students].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    
    let runningTotal = 0;
    sortedStudents.forEach(s => {
      const dateStr = new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      runningTotal += 1;
      datesMap[dateStr] = runningTotal;
    });

    return Object.keys(datesMap).map(date => ({
      date,
      'Total Enrolled': datesMap[date]
    }));
  })();

  const COLORS = ['#16a34a', '#dc2626'];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700 }}>Admin Workspace</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage system activities, approve applications, and review performance stats.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
        </div>
      </div>

      {/* ==========================================
          OVERVIEW SUB-VIEW
          ========================================== */}
      {activeTab === 'overview' && (
        <>
          {/* ── GLOBAL USER SEARCH ── */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 className="card-title" style={{ margin: 0 }}>Global User Search</h3>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {searchTotal > 0 ? `${searchTotal} result${searchTotal !== 1 ? 's' : ''} found` : ''}
              </span>
            </div>

            {/* Search bar */}
            <div className="search-bar-wrapper" style={{ marginBottom: '14px' }}>
              <Search size={16} className="search-bar-icon" />
              <input
                className="search-bar-input"
                type="text"
                placeholder="Search students, faculty, administrators, register no, email..."
                value={searchQuery}
                onChange={e => handleSearchInput(e.target.value)}
                id="global-user-search"
              />
            </div>

            {/* Filter row */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <select className="form-control" style={{ width: 'auto', fontSize: '13px' }}
                value={searchRole}
                onChange={e => { setSearchRole(e.target.value); runSearch(searchQuery, e.target.value, searchStatus, searchDept, searchSort, 1); }}>
                <option value="">All Roles</option>
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>

              <select className="form-control" style={{ width: 'auto', fontSize: '13px' }}
                value={searchStatus}
                onChange={e => { setSearchStatus(e.target.value); runSearch(searchQuery, searchRole, e.target.value, searchDept, searchSort, 1); }}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>

              <select className="form-control" style={{ width: 'auto', fontSize: '13px' }}
                value={searchDept}
                onChange={e => { setSearchDept(e.target.value); runSearch(searchQuery, searchRole, searchStatus, e.target.value, searchSort, 1); }}>
                <option value="">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>

              <select className="form-control" style={{ width: 'auto', fontSize: '13px' }}
                value={searchSort}
                onChange={e => { setSearchSort(e.target.value); runSearch(searchQuery, searchRole, searchStatus, searchDept, e.target.value, 1); }}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="alpha">A → Z</option>
              </select>
            </div>

            {/* Results table */}
            {searchLoading ? (
              <div>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                    <div className="skeleton skeleton-avatar" style={{ width: '36px', height: '36px' }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton skeleton-text" style={{ width: '40%', marginBottom: '6px' }} />
                      <div className="skeleton skeleton-text" style={{ width: '60%' }} />
                    </div>
                    <div className="skeleton skeleton-text" style={{ width: '80px', height: '24px' }} />
                  </div>
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'var(--hover)' }}>
                      {['', 'Name', 'Email', 'Role', 'Department', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((u: any) => (
                      <tr key={u.id}
                        style={{ borderTop: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
                        onClick={() => openUserDrawer(u.id)}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = '')}
                      >
                        <td style={{ padding: '10px 14px' }}>
                          {u.photoUrl ? (
                            <img src={cleanPhotoUrl(u.photoUrl)} alt={u.name} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
                          ) : (
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--selected)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', color: 'var(--primary)' }}>
                              {u.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: '14px' }}>{u.name}</td>
                        <td style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--text-muted)' }}>{u.email}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className={`badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'faculty' ? 'badge-info' : 'badge-success'}`} style={{ fontSize: '11px', textTransform: 'capitalize' }}>{u.role}</span>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: '13px' }}>{u.departmentName}</td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className={`badge ${u.status === 'active' ? 'badge-success' : u.status === 'pending' ? 'badge-warning' : 'badge-secondary'}`} style={{ fontSize: '11px', textTransform: 'capitalize' }}>{u.status}</span>
                        </td>
                        <td style={{ padding: '10px 14px' }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => openUserDrawer(u.id)}>View</button>
                            {u.status === 'pending' && (
                              <button className="btn btn-primary btn-sm" onClick={() => handleApproveStudent(u.id)}>Approve</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {searchPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
                    <button className="btn btn-secondary btn-sm" disabled={searchPage <= 1}
                      onClick={() => { const p = searchPage - 1; runSearch(searchQuery, searchRole, searchStatus, searchDept, searchSort, p); }}>
                      ← Prev
                    </button>
                    <span style={{ lineHeight: '32px', fontSize: '13px', color: 'var(--text-muted)' }}>Page {searchPage} of {searchPages}</span>
                    <button className="btn btn-secondary btn-sm" disabled={searchPage >= searchPages}
                      onClick={() => { const p = searchPage + 1; runSearch(searchQuery, searchRole, searchStatus, searchDept, searchSort, p); }}>
                      Next →
                    </button>
                  </div>
                )}
              </div>
            ) : searchQuery || searchRole || searchStatus || searchDept ? (
              <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)' }}>
                <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p>No users found matching your search.</p>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)' }}>
                <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p>Start typing above to search across all users, departments, courses, and more.</p>
              </div>
            )}
          </div>

          {/* ── STATS GRID (existing) ── */}
          <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="stat-card">
              <div className="stat-icon" style={{ color: 'var(--primary)', backgroundColor: 'var(--selected)' }}>
                <Users size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Total Students</span>
                <span className="stat-value">{activeStudents.length}</span>
              </div>
            </div>
            


            <div className="stat-card">
              <div className="stat-icon" style={{ color: '#16a34a', backgroundColor: '#dcfce7' }}>
                <GraduationCap size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Faculty Staff</span>
                <span className="stat-value">{faculties.length}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ color: '#9333ea', backgroundColor: '#f3e8ff' }}>
                <FileText size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Active Exams</span>
                <span className="stat-value">{exams.filter(e => e.status === 'active').length}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ color: '#ef4444', backgroundColor: '#fee2e2' }}>
                <ShieldAlert size={22} style={{ color: '#ef4444' }} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Locked Exams</span>
                <span className="stat-value">{lockedExams.length}</span>
              </div>
            </div>


            <div className="stat-card">
              <div className="stat-icon" style={{ color: '#0ea5e9', backgroundColor: '#e0f2fe' }}>
                <SlidersHorizontal size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Total Courses</span>
                <span className="stat-value">{courses.length}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ color: '#f59e0b', backgroundColor: '#fef3c7' }}>
                <SlidersHorizontal size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Subject Syllabus</span>
                <span className="stat-value">{subjects.length}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ color: '#10b981', backgroundColor: '#d1fae5' }}>
                <Clock size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-label">New Registrations</span>
                <span className="stat-value">
                  {students.filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString()).length}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px', marginBottom: '32px' }}>
            <div className="card">
              <h3 className="card-title">Students by Department</h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptStudentCounts}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip cursor={{ fill: 'var(--hover)' }} />
                    <Bar dataKey="Students" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title">Overall Exam Pass/Fail Ratio</h3>
              <div style={{ height: '300px', display: 'flex', flexDirection: 'column', justifyItems: 'center', alignItems: 'center' }}>
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={passFailData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {passFailData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#16a34a' }}></span>
                    Passed ({passFailData[0].value})
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#dc2626' }}></span>
                    Failed ({passFailData[1].value})
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '32px' }}>
            <h3 className="card-title">Student Enrollment Growth Trend</h3>
            <div style={{ height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={studentGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip />
                  <Line type="monotone" dataKey="Total Enrolled" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">Active Examination Sessions</h3>
            <div className="table-responsive">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Exam Title</th>
                    <th>Subject</th>
                    <th>Duration</th>
                    <th>Active Time Limit</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.filter(e => e.status === 'active').map(e => (
                    <tr key={e.id}>
                      <td style={{ fontWeight: 600 }}>{e.title}</td>
                      <td>{e.subjectName}</td>
                      <td>{e.duration} mins</td>
                      <td>{new Date(e.endTime).toLocaleTimeString()}</td>
                      <td><span className="badge badge-success">Active</span></td>
                    </tr>
                  ))}
                  {exams.filter(e => e.status === 'active').length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        No exams are currently active.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>Malpractice & Proctoring Approvals</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Students locked due to 3 malpractice warnings. Approve retake to generate new randomized questions.
                </p>
              </div>
              <span className="badge badge-warning">{lockedExams.length} Locked</span>
            </div>
            <div className="table-responsive">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Register No</th>
                    <th>Exam Title</th>
                    <th>Course & Department</th>
                    <th>Warnings</th>
                    <th>Reason</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lockedExams.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 600 }}>{item.studentName}</td>
                      <td><code>{item.registerNumber}</code></td>
                      <td>{item.examName}</td>
                      <td>{item.course} ({item.department})</td>
                      <td>
                        <span className="badge badge-danger">{item.warningCount} / 3 Warnings</span>
                      </td>
                      <td><span className="badge badge-warning">{item.lockReason || 'MALPRACTICE_EXCEEDED'}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleUnlockExam(item.id, item.studentName)}
                          style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
                        >
                          Approve Retake
                        </button>
                      </td>
                    </tr>
                  ))}
                  {lockedExams.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        No malpractice locks pending admin approval.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ==========================================
          STUDENT MANAGEMENT SUB-VIEW
          ========================================== */}
      {activeTab === 'students' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

          {/* Pending Student Registration Approvals */}
          <div className="card" style={{ border: pendingStudents.length > 0 ? '1px solid var(--warning)' : undefined }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>Pending Student Account Approvals</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Newly registered students awaiting administrator verification and portal activation.
                </p>
              </div>
              <span className="badge badge-warning">{pendingStudents.length} Pending</span>
            </div>

            <div className="table-responsive">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Email</th>
                    <th>Register Number</th>
                    <th>Batch</th>
                    <th>Academic Year</th>
                    <th>Department & Course</th>
                    <th>Registered Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingStudents.map(s => {
                    const dept = departments.find(d => d.id === s.departmentId);
                    const crs = courses.find(c => c.id === s.courseId);
                    return (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td>{s.email}</td>
                        <td><code>{s.studentId || 'N/A'}</code></td>
                        <td>
                          <span className="badge badge-info" style={{ fontSize: '11px' }}>
                            {s.batch || (s.year && s.year > 1000 ? `${s.year - 4}-${s.year}` : 'N/A')}
                          </span>
                        </td>
                        <td>
                          {s.academicYear || (s.year && s.year <= 4 ? s.year : null) ? (
                            <span style={{ fontWeight: 600 }}>Year {s.academicYear || s.year}</span>
                          ) : 'N/A'}
                        </td>
                        <td>{dept ? dept.code : 'General'} / {crs ? crs.code : 'General'}</td>
                        <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleApproveStudent(s.id)}
                              style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
                            >
                              Approve Student
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleDeleteUser(s.id)}
                              style={{ color: 'var(--danger)' }}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {pendingStudents.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        No pending student registration requests.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Student List */}
          <div className="card">
            <div className="table-header-controls">
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Student Registry</h3>
              <input
                type="text"
                placeholder="Search students..."
                className="form-control table-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="table-responsive">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Student ID</th>
                    <th>Batch</th>
                    <th>Academic Year & Semester</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeStudents
                    .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td>{s.email}</td>
                        <td><code>{s.studentId}</code></td>
                        <td>
                          <span className="badge badge-info" style={{ fontSize: '12px' }}>
                            {s.batch || (s.year && s.year > 1000 ? `${s.year - 4}-${s.year}` : 'N/A')}
                          </span>
                        </td>
                        <td>
                          {s.academicYear || (s.year && s.year <= 4 ? s.year : null) ? (
                            <span>Year {s.academicYear || s.year} · Sem {s.semester || ((s.academicYear || s.year!) * 2)}</span>
                          ) : (
                            <span>Sem {s.semester || 'N/A'}</span>
                          )}
                        </td>
                        <td><span className="badge badge-success">Active</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleDeleteUser(s.id)}>
                            <Trash2 size={13} style={{ color: 'var(--danger)' }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          FACULTY MANAGEMENT SUB-VIEW
          ========================================== */}
      {activeTab === 'faculty' && (
        <div className="card">
          <div className="table-header-controls">
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Faculty Members</h3>
            <button className="btn btn-primary" onClick={() => setShowFacultyModal(true)}>
              <Plus size={16} /> Add Faculty Account
            </button>
          </div>

          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Assigned College</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {faculties.map(f => {
                  const collegeName = f.collegeName || colleges.find(c => c.id === f.collegeId)?.collegeName || 'Unassigned / General';
                  const isResending = resendingFacultyId === f.id;
                  return (
                    <tr key={f.id}>
                      <td><code>{f.facultyId || 'N/A'}</code></td>
                      <td style={{ fontWeight: 600 }}>{f.name}</td>
                      <td>{f.email}</td>
                      <td style={{ fontWeight: 500 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <GraduationCap size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                          {collegeName}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${f.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                          {f.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Resend Welcome Email with Credentials"
                            disabled={isResending}
                            onClick={() => handleResendFacultyWelcome(f)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '5px 9px' }}
                          >
                            <Mail size={13} />
                            <span>{isResending ? 'Sending...' : 'Resend Mail'}</span>
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Reset Faculty Password"
                            onClick={() => {
                              setResetTargetUser(f);
                              setResetNewPassword('faculty123');
                              setShowResetModal(true);
                            }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '5px 9px' }}
                          >
                            <KeyRound size={13} />
                            <span>Reset Password</span>
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Delete Faculty Account"
                            onClick={() => handleDeleteUser(f.id)}
                            style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '5px 9px' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          ACADEMIC STRUCTURE SUB-VIEW
          ========================================== */}
      {activeTab === 'academics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Colleges */}
          <div className="card">
            <div className="table-header-controls">
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Colleges</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Colleges registered in the examination network
                </p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowCollegeModal(true)}>
                <Plus size={14} /> Add College
              </button>
            </div>

            {/* College Search Filter */}
            <div style={{ margin: '14px 0 6px', maxWidth: '360px' }}>
              <div className="search-bar-wrapper" style={{ margin: 0 }}>
                <Search size={14} className="search-bar-icon" />
                <input
                  type="text"
                  className="search-bar-input"
                  style={{ height: '34px', fontSize: '12px' }}
                  placeholder="Search colleges by name or code..."
                  value={collegeSearchFilter}
                  onChange={(e) => setCollegeSearchFilter(e.target.value)}
                />
              </div>
            </div>

            <div className="table-responsive">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>College Name</th>
                    <th>Faculty Assigned</th>
                    <th>Number of Students</th>
                    <th>Number of Departments/Courses</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {colleges
                    .filter(c => {
                      if (!collegeSearchFilter.trim()) return true;
                      const q = collegeSearchFilter.toLowerCase();
                      return (c.collegeName || '').toLowerCase().includes(q) || (c.code || '').toLowerCase().includes(q);
                    })
                    .map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>
                        {c.collegeName}
                        {c.code && <span style={{ marginLeft: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>({c.code})</span>}
                      </td>
                      <td>
                        {c.facultyAssigned ? (
                          <span className="badge badge-success" style={{ fontWeight: 500 }}>
                            {c.facultyAssigned}
                          </span>
                        ) : (
                          <span className="badge badge-warning" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 500 }}>
                            Not Assigned
                          </span>
                        )}
                      </td>
                      <td><strong>{c.studentCount ?? 0}</strong> students</td>
                      <td><strong>{c.departmentCount ?? (c.departments?.length ?? 0)}</strong> departments</td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleDeleteCollege(c.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Departments */}
          <div className="card">
            <div className="table-header-controls">
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Departments & Courses</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Filter departments by College, Category, or Department/Course Name
                </p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setShowDeptModal(true)}>
                <Plus size={14} /> Add Department
              </button>
            </div>

            {/* Department Filter Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1.5fr', gap: '12px', margin: '16px 0' }}>
              <div>
                <label className="form-label" style={{ fontSize: '12px' }}>Filter by College</label>
                <select
                  className="form-control"
                  value={deptFilterCollege}
                  onChange={(e) => setDeptFilterCollege(e.target.value)}
                >
                  <option value="">All Colleges</option>
                  {colleges.map(c => (
                    <option key={c.id} value={c.id}>{c.collegeName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '12px' }}>Filter by Category</label>
                <select
                  className="form-control"
                  value={deptFilterCategory}
                  onChange={(e) => setDeptFilterCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Arts & Science">Arts & Science</option>
                </select>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '12px' }}>Search Department / Course</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Type to search department..."
                  value={deptFilterSearch}
                  onChange={(e) => setDeptFilterSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="table-responsive">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>College</th>
                    <th>Category</th>
                    <th>Department / Course Name</th>
                    <th>Code</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments
                    .filter(d => {
                      if (deptFilterCollege && d.collegeId !== deptFilterCollege) return false;
                      if (deptFilterCategory && d.category !== deptFilterCategory) return false;
                      if (deptFilterSearch) {
                        const q = deptFilterSearch.toLowerCase();
                        const matchName = (d.departmentName || d.name || '').toLowerCase().includes(q);
                        const matchCollege = (d.collegeName || '').toLowerCase().includes(q);
                        if (!matchName && !matchCollege) return false;
                      }
                      return true;
                    })
                    .map(d => (
                      <tr key={d.id}>
                        <td style={{ fontWeight: 500 }}>{d.collegeName || 'N/A'}</td>
                        <td>
                          <span className={`badge ${d.category === 'Arts & Science' ? 'badge-warning' : 'badge-info'}`}>
                            {d.category || 'Engineering'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{d.departmentName || d.name}</td>
                        <td><code>{d.code}</code></td>
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleDeleteDepartment(d.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Courses */}
          <div className="card">
            <div className="table-header-controls">
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Courses</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setShowCourseModal(true)}>
                <Plus size={14} /> Add Course
              </button>
            </div>
            <div className="table-responsive">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Course Name</th>
                    <th>Department</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(c => {
                    const dept = departments.find(d => d.id === c.departmentId);
                    return (
                      <tr key={c.id}>
                        <td><strong>{c.code}</strong></td>
                        <td style={{ fontWeight: 600 }}>{c.name}</td>
                        <td>{dept ? dept.name : 'Unknown'}</td>
                        <td>{c.durationYears} Years</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subjects */}
          <div className="card">
            <div className="table-header-controls">
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Subjects</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setShowSubjectModal(true)}>
                <Plus size={14} /> Add Subject
              </button>
            </div>
            <div className="table-responsive">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Subject Code</th>
                    <th>Subject Name</th>
                    <th>Course Program</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subjects.map(s => {
                    const crs = courses.find(c => c.id === s.courseId);
                    return (
                      <tr key={s.id}>
                        <td><code>{s.code}</code></td>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td>{crs ? crs.name : 'Unknown'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ color: '#ef4444' }}
                            title={`Delete topic "${s.name}" and its questions`}
                            onClick={() => handleOpenDeleteTopicModal(s.id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          EXAM CONFIGURATION SUB-VIEW
          ========================================== */}
      {activeTab === 'exams' && (
        <div className="card">
          <h3 className="card-title">All Examinations</h3>
          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Exam Title</th>
                  <th>Subject</th>
                  <th>Date & Time Range</th>
                  <th>Questions</th>
                  <th>Faculty Organizer</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {exams.map(e => {
                  const statusColors = {
                    draft: 'badge-info',
                    scheduled: 'badge-warning',
                    active: 'badge-success',
                    completed: 'badge-danger'
                  };
                  return (
                    <tr key={e.id}>
                      <td style={{ fontWeight: 600 }}>{e.title}</td>
                      <td>{e.subjectName}</td>
                      <td>
                        <span style={{ fontSize: '13px' }}>
                          Start: {new Date(e.startTime).toLocaleString()}<br />
                          End: {new Date(e.endTime).toLocaleString()}
                        </span>
                      </td>
                      <td>{e.questions?.length || 0} items</td>
                      <td>{e.createdByName}</td>
                      <td><span className={`badge ${statusColors[e.status]}`}>{e.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          SYSTEM QUESTION BANK SUB-VIEW
          ========================================== */}
      {activeTab === 'questions' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>System Question Repository</h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                Global question bank repository across all subjects, departments, and course curricula.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  setNewTopicName('');
                  setShowNewTopicModal(true);
                }}
              >
                <FolderPlus size={16} /> Create New Topic
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  setBulkDocName('');
                  setBulkSubjectId(selectedSubjectFilter || (subjects[0]?.id || ''));
                  setBulkQuestionType('mcq');
                  setBulkQFile(null);
                  setBulkAnsFile(null);
                  setShowBulkInlineTopic(false);
                  setShowBulkUploadModal(true);
                }}
              >
                <Upload size={16} /> Bulk Upload (PDF / Word)
              </button>
              <button className="btn btn-primary" onClick={handleOpenAddQuestionModal}>
                <Plus size={16} /> + Add Question to Bank
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search question text..."
              className="form-control"
              style={{ flex: 1, minWidth: '220px' }}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setQuestionPage(1);
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <select
                className="form-control"
                style={{ width: 'auto', minWidth: '240px' }}
                value={selectedSubjectFilter}
                onChange={(e) => {
                  setSelectedSubjectFilter(e.target.value);
                  setQuestionPage(1);
                }}
              >
                <option value="">All Subjects ({questions.length} questions)</option>
                {subjects.map(s => {
                  const count = questions.filter(q => q.subjectId === s.id).length;
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name} ({count} questions)
                    </option>
                  );
                })}
              </select>

              <button
                type="button"
                className="btn"
                title={
                  selectedSubjectFilter
                    ? `Delete topic "${subjects.find(s => s.id === selectedSubjectFilter)?.name || ''}" and all its questions`
                    : "Delete a topic and its questions"
                }
                onClick={() => handleOpenDeleteTopicModal(selectedSubjectFilter)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: selectedSubjectFilter ? '#ef4444' : 'var(--border, #374151)',
                  color: selectedSubjectFilter ? '#ffffff' : 'var(--text-muted, #9ca3af)',
                  background: selectedSubjectFilter ? '#ef4444' : 'var(--card-bg, #1e293b)',
                  boxShadow: selectedSubjectFilter ? '0 2px 8px rgba(239, 68, 68, 0.35)' : 'none',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#ef4444';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.background = '#dc2626';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = selectedSubjectFilter ? '#ef4444' : 'var(--border, #374151)';
                  e.currentTarget.style.color = selectedSubjectFilter ? '#ffffff' : 'var(--text-muted, #9ca3af)';
                  e.currentTarget.style.background = selectedSubjectFilter ? '#ef4444' : 'var(--card-bg, #1e293b)';
                }}
              >
                <Trash2 size={16} />
              </button>

              {selectedSubjectFilter && (
                <button
                  type="button"
                  className="btn"
                  title={`Delete only the questions under "${subjects.find(s => s.id === selectedSubjectFilter)?.name || 'this topic'}"`}
                  onClick={() => handleOpenDeleteSubjectQuestions(selectedSubjectFilter)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    background: 'rgba(239, 68, 68, 0.12)',
                    color: '#ef4444',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#dc2626';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.borderColor = '#dc2626';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                  }}
                >
                  <Trash2 size={13} />
                  Delete Subject Questions ({questions.filter(q => q.subjectId === selectedSubjectFilter).length})
                </button>
              )}
            </div>
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={selectedDifficultyFilter}
              onChange={(e) => {
                setSelectedDifficultyFilter(e.target.value);
                setQuestionPage(1);
              }}
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={selectedTypeFilter}
              onChange={(e) => {
                setSelectedTypeFilter(e.target.value);
                setQuestionPage(1);
              }}
            >
              <option value="">All Types</option>
              <option value="mcq">Multiple Choice (MCQ)</option>
              <option value="checkbox">Multiple Select (Checkbox)</option>
              <option value="text">Descriptive</option>
            </select>

            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
              {selectedSubjectFilter ? (
                `Filtered: ${questions.filter(q => q.subjectId === selectedSubjectFilter).length} of ${questions.length} questions`
              ) : (
                `Total: ${questions.length} questions`
              )}
            </span>
          </div>

          {(() => {
            const filteredQuestions = questions.filter(q => {
              const matchText = q.text.toLowerCase().includes(searchTerm.toLowerCase());
              const matchSub = selectedSubjectFilter ? q.subjectId === selectedSubjectFilter : true;
              const matchDiff = selectedDifficultyFilter ? q.difficulty === selectedDifficultyFilter : true;
              const matchType = selectedTypeFilter ? q.type === selectedTypeFilter : true;
              return matchText && matchSub && matchDiff && matchType;
            });

            const totalQuestionPages = Math.ceil(filteredQuestions.length / questionsPerPage) || 1;
            const paginatedQuestions = filteredQuestions.slice(
              (questionPage - 1) * questionsPerPage,
              questionPage * questionsPerPage
            );

            return (
              <>
                {/* Bulk Selection Action Bar */}
                {selectedQuestionIds.length > 0 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 18px',
                    marginBottom: '16px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 700, color: '#ef4444', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckSquare size={16} /> {selectedQuestionIds.length} question{selectedQuestionIds.length > 1 ? 's' : ''} selected
                      </span>
                      {filteredQuestions.length > selectedQuestionIds.length && (
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          style={{ fontSize: '12px', padding: '3px 10px' }}
                          onClick={() => handleSelectAllFiltered(filteredQuestions)}
                        >
                          Select All {filteredQuestions.length} Filtered Questions
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={handleClearSelection}
                        style={{ fontSize: '13px' }}
                      >
                        Clear Selection
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        style={{
                          background: '#dc2626',
                          borderColor: '#dc2626',
                          color: '#ffffff',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '13px',
                          padding: '6px 14px',
                          boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)'
                        }}
                        onClick={handleOpenDeleteSelectedQuestions}
                      >
                        <Trash2 size={14} /> Delete Selected ({selectedQuestionIds.length})
                      </button>
                    </div>
                  </div>
                )}

                <div className="table-responsive">
                  <table className="enterprise-table">
                    <thead>
                      <tr>
                        <th style={{ width: '44px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                            checked={
                              paginatedQuestions.length > 0 &&
                              paginatedQuestions.every(q => selectedQuestionIds.includes(q.id))
                            }
                            onChange={() => handleToggleSelectAllPage(paginatedQuestions)}
                            title="Select all on this page"
                          />
                        </th>
                        <th>Question Content</th>
                        <th>Subject</th>
                        <th>Type</th>
                        <th>Difficulty</th>
                        <th>Points</th>
                        <th style={{ textAlign: 'right' }}>
                          {selectedQuestionIds.length > 0 ? (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              style={{
                                background: '#dc2626',
                                borderColor: '#dc2626',
                                color: '#fff',
                                fontSize: '11px',
                                padding: '2px 8px',
                                fontWeight: 600
                              }}
                              onClick={handleOpenDeleteSelectedQuestions}
                              title="Delete all selected questions"
                            >
                              <Trash2 size={11} /> Delete ({selectedQuestionIds.length})
                            </button>
                          ) : (
                            'Actions'
                          )}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedQuestions.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                            No questions found matching your filter criteria.
                          </td>
                        </tr>
                      ) : (
                        paginatedQuestions.map(q => {
                          const subObj = subjects.find(s => s.id === q.subjectId);
                          const isSelected = selectedQuestionIds.includes(q.id);
                          return (
                            <tr key={q.id} style={{ background: isSelected ? 'rgba(59, 130, 246, 0.08)' : undefined }}>
                              <td style={{ textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectQuestion(q.id)}
                                  title="Select question for deletion"
                                />
                              </td>
                              <td style={{ maxWidth: '400px' }}>
                                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>{q.text}</div>
                                {q.options && q.options.length > 0 && (
                                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {q.options.map((opt, oIdx) => {
                                      const isCorrectOpt = String(oIdx) === String(q.correctAnswer) || (Array.isArray(q.correctAnswer) && q.correctAnswer.includes(String(oIdx)));
                                      return (
                                        <span key={oIdx} style={{
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                          backgroundColor: isCorrectOpt ? '#dcfce7' : 'var(--hover)',
                                          color: isCorrectOpt ? '#16a34a' : 'var(--text-muted)',
                                          border: isCorrectOpt ? '1px solid #16a34a' : '1px solid var(--border)'
                                        }}>
                                          {String.fromCharCode(65 + oIdx)}: {opt}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                              </td>
                              <td>{subObj ? `${subObj.name} (${subObj.code})` : ((q as any).subjectName || 'General Pool')}</td>
                              <td><span className="badge badge-info" style={{ textTransform: 'uppercase' }}>{q.type}</span></td>
                              <td>
                                <span className={`badge ${q.difficulty === 'easy' ? 'badge-success' : q.difficulty === 'medium' ? 'badge-warning' : 'badge-danger'}`}>
                                  {q.difficulty}
                                </span>
                              </td>
                              <td><strong>{q.points} pt</strong></td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleOpenEditQuestionModal(q)}
                                    title="Edit question"
                                  >
                                    <Edit size={13} />
                                  </button>
                                  <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleOpenDeleteSingleQuestion(q)}
                                    style={{ color: 'var(--danger, #ef4444)' }}
                                    title="Delete question"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '16px',
                  flexWrap: 'wrap',
                  gap: '12px',
                  padding: '12px 16px',
                  background: 'var(--hover)',
                  borderRadius: '8px',
                  border: '1px solid var(--border)'
                }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Showing {filteredQuestions.length === 0 ? 0 : (questionPage - 1) * questionsPerPage + 1} - {Math.min(questionPage * questionsPerPage, filteredQuestions.length)} of {filteredQuestions.length} questions
                  </div>
                  {totalQuestionPages > 1 && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={questionPage <= 1}
                        onClick={() => setQuestionPage(1)}
                        title="First Page"
                      >
                        &laquo;
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={questionPage <= 1}
                        onClick={() => setQuestionPage(p => Math.max(1, p - 1))}
                        title="Previous Page"
                      >
                        &lsaquo; Prev
                      </button>
                      <span style={{ fontSize: '13px', padding: '0 8px' }}>
                        Page <strong>{questionPage}</strong> of <strong>{totalQuestionPages}</strong>
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={questionPage >= totalQuestionPages}
                        onClick={() => setQuestionPage(p => Math.min(totalQuestionPages, p + 1))}
                        title="Next Page"
                      >
                        Next &rsaquo;
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        disabled={questionPage >= totalQuestionPages}
                        onClick={() => setQuestionPage(totalQuestionPages)}
                        title="Last Page"
                      >
                        &raquo;
                      </button>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ==========================================
          EXAM RESULTS & EVALUATION REGISTRY SUB-VIEW
          ========================================== */}
      {(activeTab === 'results' || activeTab === 'reports') && (
        <div className="card">
          {/* Header & Export Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={22} style={{ color: 'var(--primary)' }} />
                <h3 className="card-title" style={{ margin: 0 }}>Exam Results & Attendance Marks Registry</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
                Official assessment grades, verified correct/wrong counts, and live score exports for all attended students.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                className="btn btn-primary"
                onClick={handleExportResultsExcel}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#107c41',
                  borderColor: '#107c41',
                  color: '#ffffff',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(16, 124, 65, 0.25)'
                }}
                title="Export complete marks sheet of attended students to Microsoft Excel (.xlsx)"
              >
                <FileSpreadsheet size={16} />
                <span>Download Excel (.xlsx)</span>
              </button>

              <button
                className="btn btn-secondary"
                onClick={handleExportReportsCSV}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                title="Download CSV format"
              >
                <Download size={15} />
                <span>Export CSV</span>
              </button>

              <button
                className="btn btn-secondary"
                onClick={fetchResults}
                disabled={isRefreshingResults}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                title="Refresh and reconcile results"
              >
                <RefreshCw size={14} className={isRefreshingResults ? 'spin' : ''} />
                <span>{isRefreshingResults ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics KPI Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            padding: '16px',
            backgroundColor: 'var(--hover)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            marginBottom: '20px'
          }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Attended Students</div>
              <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '2px' }}>
                {filteredResults.length} <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)' }}>/ {results.length}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Passed</div>
              <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '2px', color: 'var(--success, #10b981)' }}>
                {filteredResults.filter(r => r.status?.toLowerCase() === 'pass').length}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Failed / Zero</div>
              <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '2px', color: 'var(--danger, #ef4444)' }}>
                {filteredResults.filter(r => r.status?.toLowerCase() === 'fail').length}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Pass Rate</div>
              <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '2px', color: 'var(--primary)' }}>
                {filteredResults.length
                  ? Math.round((filteredResults.filter(r => r.status?.toLowerCase() === 'pass').length / filteredResults.length) * 100)
                  : 0}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Avg Score</div>
              <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '2px', color: 'var(--primary)' }}>
                {filteredResults.length
                  ? Math.round(filteredResults.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / filteredResults.length)
                  : 0}%
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by Roll No, Student Name, College, or Exam..."
                className="form-control"
                style={{ paddingLeft: '36px' }}
                value={resultsSearch}
                onChange={e => setResultsSearch(e.target.value)}
              />
            </div>

            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '220px' }}
              value={resultsExamFilter}
              onChange={e => setResultsExamFilter(e.target.value)}
            >
              <option value="all">All Examinations ({exams.length})</option>
              {exams.map(e => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>

            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '180px' }}
              value={resultsCollegeFilter}
              onChange={e => setResultsCollegeFilter(e.target.value)}
            >
              <option value="all">All Colleges ({colleges.length})</option>
              {colleges.map(c => (
                <option key={c.id} value={c.collegeName}>{c.collegeName}</option>
              ))}
            </select>

            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '130px' }}
              value={resultsStatusFilter}
              onChange={e => setResultsStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pass">Passed Only</option>
              <option value="fail">Failed Only</option>
            </select>

            {(resultsSearch || resultsExamFilter !== 'all' || resultsCollegeFilter !== 'all' || resultsStatusFilter !== 'all') && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setResultsSearch('');
                  setResultsExamFilter('all');
                  setResultsCollegeFilter('all');
                  setResultsStatusFilter('all');
                }}
                style={{ padding: '8px 12px' }}
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Results Registry Table */}
          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>College & Department</th>
                  <th>Exam Title</th>
                  <th>Score Secured</th>
                  <th>Percentage</th>
                  <th>Correct / Wrong</th>
                  <th>Time Taken</th>
                  <th>Status</th>
                  <th>Submission Date</th>
                  <th>Export</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map(r => {
                  const displayScore = (r.correctCount === 0 && (r.wrongCount || 0) > 0) ? 0 : (r.score ?? 0);
                  const displayPct = (r.correctCount === 0 && (r.wrongCount || 0) > 0) ? 0 : (r.percentage ?? 0);
                  const displayStatus = (displayScore === 0 || displayPct < 40) ? 'FAIL' : (r.status?.toUpperCase() || 'FAIL');

                  return (
                    <tr key={r.id}>
                      <td><code>{r.studentRollNo || 'N/A'}</code></td>
                      <td style={{ fontWeight: 600 }}>{r.studentName}</td>
                      <td>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{r.collegeName || 'N/A'}</div>
                        <span className="badge badge-info" style={{ fontWeight: 500, fontSize: '11px', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', border: '1px solid rgba(59, 130, 246, 0.2)', marginTop: '2px' }}>
                          {r.departmentName || r.studentDepartment || 'General'}
                        </span>
                      </td>
                      <td>{r.examTitle}</td>
                      <td style={{ fontWeight: 600 }}>{displayScore} / {r.totalPoints}</td>
                      <td><strong>{displayPct}%</strong></td>
                      <td>
                        <span style={{ color: '#10b981', fontWeight: 600 }}>✓ {r.correctCount ?? 0}</span>
                        {' '}/{' '}
                        <span style={{ color: '#ef4444', fontWeight: 600 }}>✗ {r.wrongCount ?? 0}</span>
                      </td>
                      <td>{Math.floor((r.timeTaken || 0) / 60)}m {(r.timeTaken || 0) % 60}s</td>
                      <td>
                        <span className={`badge ${displayStatus === 'PASS' ? 'badge-success' : 'badge-danger'}`}>
                          {displayStatus}
                        </span>
                      </td>
                      <td>{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => exportStudentResultsToExcel([r], { examTitle: r.examTitle, subjectName: r.subjectName })}
                          style={{ padding: '3px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#107c41', borderColor: '#107c41' }}
                          title="Download this student's result in Excel"
                        >
                          <FileSpreadsheet size={12} /> Excel
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredResults.length === 0 && (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '36px' }}>
                      {results.length === 0
                        ? 'No student attempts recorded across all scheduled examinations.'
                        : 'No student results match the active search or filter criteria.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          EXAM PROCTORING MONITOR SUB-VIEW
          ========================================== */}
      {activeTab === 'proctoring' && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <ShieldAlert size={22} style={{ color: 'var(--danger)' }} />
            <h3 className="card-title" style={{ margin: 0 }}>Proctor Monitoring: Locked Examinations</h3>
          </div>
          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Register Number</th>
                  <th>Exam Name</th>
                  <th>Course Program</th>
                  <th>Department</th>
                  <th>Warnings</th>
                  <th>Lock Reason</th>
                  <th>Locked Time</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lockedExams.map(item => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.studentName}</td>
                    <td><code>{item.registerNumber}</code></td>
                    <td>{item.examName}</td>
                    <td>{item.course}</td>
                    <td>{item.department}</td>
                    <td>
                      <span className="badge badge-warning" style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning)' }}>
                        {item.warningCount}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-danger" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}>
                        {item.lockReason}
                      </span>
                    </td>
                    <td>{new Date(item.lockedTime).toLocaleString()}</td>
                    <td>
                      <span className="badge badge-danger">LOCKED</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleUnlockExam(item.id)}
                          style={{ backgroundColor: 'var(--success)', borderColor: 'var(--success)' }}
                        >
                          Allow Re-entry
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleRevokeExam(item.id)}
                        >
                          Revoke Access
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {lockedExams.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                      No active locked examinations requiring review.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          UPLOAD & EXTRACT Q-PAPERS TAB (ADMIN)
          ========================================== */}
      {activeTab === 'qpapers' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
          {/* Upload Form Card */}
          <div className="card" style={{ height: 'fit-content' }}>
            <h3 className="card-title" style={{ marginBottom: '16px' }}>Upload Question Document</h3>
            <form onSubmit={handleUploadQPaperSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Document Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Placement Aptitude Set 1 2026"
                  className="form-control"
                  value={qPaperName}
                  onChange={e => setQPaperName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subject / Topic</label>
                <select
                  required
                  className="form-control"
                  value={qPaperSubjectId}
                  onChange={e => setQPaperSubjectId(e.target.value)}
                >
                  <option value="">Select a Subject / Topic</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name || (s as any).subjectName}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckSquare size={15} color="#3b82f6" /> Question Format / Answer Mode *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '6px' }}>
                  {/* MCQ Option */}
                  <div
                    onClick={() => setQPaperQuestionType('mcq')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: qPaperQuestionType === 'mcq' ? '2px solid #3b82f6' : '1px solid var(--border)',
                      background: qPaperQuestionType === 'mcq' ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-card, #ffffff)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: qPaperQuestionType === 'mcq' ? '#2563eb' : 'var(--text-main)' }}>
                        MCQ (Single)
                      </span>
                      <input
                        type="radio"
                        name="adminQPType"
                        checked={qPaperQuestionType === 'mcq'}
                        onChange={() => setQPaperQuestionType('mcq')}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                      Exactly 1 correct answer per question (radio selection).
                    </span>
                  </div>

                  {/* Multiples Option */}
                  <div
                    onClick={() => setQPaperQuestionType('checkbox')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: qPaperQuestionType === 'checkbox' ? '2px solid #10b981' : '1px solid var(--border)',
                      background: qPaperQuestionType === 'checkbox' ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-card, #ffffff)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: qPaperQuestionType === 'checkbox' ? '#059669' : 'var(--text-main)' }}>
                        Multiples
                      </span>
                      <input
                        type="radio"
                        name="adminQPType"
                        checked={qPaperQuestionType === 'checkbox'}
                        onChange={() => setQPaperQuestionType('checkbox')}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                      Multiple correct answers allowed (checkboxes).
                    </span>
                  </div>

                  {/* Auto Detect Option */}
                  <div
                    onClick={() => setQPaperQuestionType('auto')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: qPaperQuestionType === 'auto' ? '2px solid #8b5cf6' : '1px solid var(--border)',
                      background: qPaperQuestionType === 'auto' ? 'rgba(139, 92, 246, 0.08)' : 'var(--bg-card, #ffffff)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: qPaperQuestionType === 'auto' ? '#7c3aed' : 'var(--text-main)' }}>
                        Auto-Detect
                      </span>
                      <input
                        type="radio"
                        name="adminQPType"
                        checked={qPaperQuestionType === 'auto'}
                        onChange={() => setQPaperQuestionType('auto')}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                      Infer from answer key (single or multiple choices).
                    </span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Pick Question File (.pdf, .docx, .csv)</label>
                <input
                  id="admin-qpaper-file-input"
                  type="file"
                  required
                  accept=".pdf,.docx,.csv"
                  className="form-control"
                  onChange={e => setQPaperFile(e.target.files?.[0] || null)}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Supports PDF files, Microsoft Word (.docx), or comma-separated CSV spreadsheets.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Pick Answer Key File (Optional, .pdf, .docx, .csv, .txt)</label>
                <input
                  id="admin-qpaper-ans-file-input"
                  type="file"
                  accept=".pdf,.docx,.csv,.txt"
                  className="form-control"
                  onChange={e => setQAnswerFile(e.target.files?.[0] || null)}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Optional separate answer key document containing list of correct options (e.g., 1. A, 2. B).
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={uploadingQPaper}
                style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Upload size={16} />
                {uploadingQPaper ? 'Parsing & Extracting...' : 'Upload & Extract Questions'}
              </button>
            </form>
          </div>

          {/* List of uploaded documents */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '20px' }}>Extracted Question Papers Registry</h3>
            {loadingQPapers ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                Loading document registry...
              </div>
            ) : uploadedDocuments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <Upload size={40} style={{ margin: '0 auto 16px', color: 'var(--text-muted)' }} />
                <h4>No uploaded documents</h4>
                <p style={{ fontSize: '13px' }}>Upload a PDF, Word, or CSV file using the form on the left to extract questions.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {uploadedDocuments.map(doc => (
                  <div key={doc.id} style={{
                    padding: '16px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--bg-card)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <span className="badge badge-info" style={{ textTransform: 'uppercase', fontSize: '10px', marginBottom: '4px', display: 'inline-block' }}>
                          {doc.subjectName}
                        </span>
                        <h4 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{doc.name}</h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          File: <a href={cleanPhotoUrl(doc.fileUrl)} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>{doc.fileUrl.split('/uploads/')[1]}</a> ({doc.fileType.toUpperCase()})
                        </span>
                      </div>
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', border: 'none' }}
                        onClick={() => handleDeleteQPaper(doc.id)}
                      >
                        Delete
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>
                        <span style={{ color: 'var(--primary)' }}>{doc.questionCount}</span> questions extracted
                      </span>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleViewDocQuestionsClick(doc)}
                      >
                        View Extracted Questions
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          BULK DATA IMPORTS SUB-VIEW
          ========================================== */}
      {activeTab === 'uploads' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Server size={22} style={{ color: 'var(--primary)' }} />
              <h3 className="card-title" style={{ margin: 0 }}>Bulk Data CSV File Imports</h3>
            </div>
            
            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px' }}>
              <div className="form-group">
                <label className="form-label">Data Record Type</label>
                <select className="form-control" value={uploadType} onChange={e => { setUploadType(e.target.value); setUploadSummary(null); }}>
                  <option value="students">Students Registry (CSV)</option>
                  <option value="faculty">Faculty Registry (CSV)</option>
                  <option value="departments">Departments (CSV)</option>
                  <option value="courses">Course Programs (CSV)</option>
                  <option value="subjects">Subjects Registry (CSV)</option>
                  <option value="questions">Questions Registry (CSV)</option>
                </select>
                {uploadType === 'questions' && (
                  <div style={{ marginTop: '8px', padding: '10px 12px', background: 'var(--hover)', borderRadius: '6px', fontSize: '12px' }}>
                    <strong>CSV Required Headers:</strong>
                    <div style={{ color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>
                      subjectId, question, type, difficulty, marks, options, correctAnswer
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '2px' }}>
                      Separate options using | (e.g. Paris|London|Rome) and specify correct letter/index.
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Choose CSV File</label>
                <input
                  type="file"
                  accept=".csv"
                  className="form-control"
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                />
                <span className="form-helper" style={{ display: 'block', marginTop: '6px' }}>CSV must contain headers corresponding to columns.</span>
              </div>

              <button type="submit" className="btn btn-primary" disabled={uploadLoading || !uploadFile} style={{ alignSelf: 'flex-start' }}>
                {uploadLoading ? 'Uploading & Validating...' : 'Validate and Import Data'}
              </button>
            </form>
          </div>

          {/* Upload summary report & previews */}
          {uploadSummary && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
                <h3 className="card-title">Import Summary Report</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ padding: '16px', backgroundColor: 'var(--hover)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>Total Records</span>
                    <strong style={{ fontSize: '20px' }}>{uploadSummary.totalRecords}</strong>
                  </div>
                  <div style={{ padding: '16px', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '12px' }}>Successful Imports</span>
                    <strong style={{ fontSize: '20px' }}>{uploadSummary.successfulImports}</strong>
                  </div>
                  <div style={{ padding: '16px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '12px' }}>Failed / Invalid Records</span>
                    <strong style={{ fontSize: '20px' }}>{uploadSummary.failedImports}</strong>
                  </div>
                  <div style={{ padding: '16px', backgroundColor: '#ffedd5', color: '#ea580c', borderRadius: 'var(--radius)', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '12px' }}>Duplicate Records</span>
                    <strong style={{ fontSize: '20px' }}>{uploadSummary.duplicateRecords}</strong>
                  </div>
                </div>

                {uploadSummary.validationErrors.length > 0 && (
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '14px' }}>Row Validation Errors Identified</span>
                      <button className="btn btn-secondary btn-sm" onClick={handleDownloadErrorReport} style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
                        Download Error Report (.txt)
                      </button>
                    </div>
                    <div className="table-responsive" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      <table className="enterprise-table" style={{ fontSize: '13px' }}>
                        <thead>
                          <tr>
                            <th>CSV Row Number</th>
                            <th>Identified validation errors</th>
                          </tr>
                        </thead>
                        <tbody>
                          {uploadSummary.validationErrors.map((err: any, idx: number) => (
                            <tr key={idx} style={{ backgroundColor: '#fff5f5' }}>
                              <td><strong>Row {err.row}</strong></td>
                              <td style={{ color: 'var(--danger)' }}>
                                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                                  {err.errors.map((msg: string, mIdx: number) => <li key={mIdx}>{msg}</li>)}
                                </ul>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Data Preview */}
              <div className="card">
                <h3 className="card-title">Record Previews</h3>
                <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <table className="enterprise-table" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr>
                        {uploadSummary.preview.length > 0 && Object.keys(uploadSummary.preview[0]).map((k, i) => (
                          <th key={i}>{k.toUpperCase()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {uploadSummary.preview.map((row: any, rIdx: number) => (
                        <tr key={rIdx}>
                          {Object.values(row).map((val: any, cIdx: number) => (
                            <td key={cIdx}>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          SETTINGS SUB-VIEW
          ========================================== */}
      {activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>

          {/* Profile Photo Card */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '20px' }}>Administrator Profile</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ flexShrink: 0 }}>
                {profilePhotoPreview || user?.photoUrl ? (
                  <img
                    src={profilePhotoPreview || user?.photoUrl}
                    alt="Admin Profile"
                    style={{
                      width: '90px', height: '90px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid var(--primary)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '90px', height: '90px', borderRadius: '50%',
                    backgroundColor: 'var(--hover)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '28px', fontWeight: 700, color: 'var(--primary)',
                    border: '3px solid var(--border)'
                  }}>
                    {user?.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>{user?.name}</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>{user?.email}</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Leave blank to keep current password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ alignSelf: 'flex-start' }}
                disabled={profileSaving}
              >
                {profileSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>

          {/* System Settings Card */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '20px' }}>System Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 600 }}>Student Registration</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Allow students to register via the public login screen.</p>
              </div>
              <span className="badge badge-success">Open</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 600 }}>System Maintenance Mode</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Lock access to dashboards for database upgrades.</p>
              </div>
              <span className="badge badge-danger">Disabled</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 600 }}>Fullscreen Proctoring Enforcement</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Enforce proctor locks on all active student examination dashboards.</p>
              </div>
              <span className="badge badge-success">Enforced</span>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* ==========================================================
          MODALS SECTION
          ========================================================== */}

      {/* Faculty Add Modal */}
      {showFacultyModal && (
        <div className="modal-overlay" onClick={() => { setShowFacultyModal(false); setFacEmailError(''); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <form onSubmit={handleCreateFaculty} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              <div className="modal-header" style={{ flexShrink: 0 }}>
                <h3 className="modal-title">Create User Profile</h3>
                <button type="button" className="modal-close" onClick={() => { setShowFacultyModal(false); setFacEmailError(''); }}>&times;</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '55vh', paddingRight: '8px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" required className="form-control" placeholder="Dr. Sarah Carter" value={facName} onChange={e => setFacName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    required
                    className="form-control"
                    placeholder="sarah.carter@university.edu"
                    value={facEmail}
                    onChange={e => { setFacEmail(e.target.value); setFacEmailError(''); }}
                    style={facEmailError ? { borderColor: '#ef4444', boxShadow: '0 0 0 3px rgba(239,68,68,0.15)' } : {}}
                  />
                  {facEmailError && (
                    <div style={{ marginTop: '6px', padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '12.5px', lineHeight: '1.5' }}>
                      ⚠️ {facEmailError}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                    <button
                      type="button"
                      onClick={() => setFacPassword('faculty123')}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                    >
                      Use "faculty123"
                    </button>
                  </div>
                  <div style={{ position: 'relative', marginTop: '6px' }}>
                    <input
                      type={showFacPassword ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Default: faculty123"
                      value={facPassword}
                      onChange={e => setFacPassword(e.target.value)}
                      style={{ paddingRight: '38px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowFacPassword(!showFacPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px'
                      }}
                      title={showFacPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showFacPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Default is <code>faculty123</code> if left blank. Credentials will also be displayed after creation.
                  </span>
                </div>
                <div className="form-group">
                  <label className="form-label">Employee ID / Register Number</label>
                  <input type="text" required className="form-control" placeholder="FAC-4401" value={facId} onChange={e => setFacId(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-control" value={facRole} onChange={e => setFacRole(e.target.value)}>
                    <option value="faculty">Faculty Member</option>
                  </select>
                </div>
                {facRole === 'faculty' && (
                  <div className="form-group">
                    <label className="form-label">College Assignment (1 Faculty per College)</label>
                    <select
                      required
                      className="form-control"
                      value={facCollegeId}
                      onChange={(e) => {
                        setFacCollegeId(e.target.value);
                        setFacCollegeError('');
                      }}
                      style={facCollegeError ? { borderColor: '#ef4444', boxShadow: '0 0 0 3px rgba(239,68,68,0.15)' } : {}}
                    >
                      <option value="">Select College</option>
                      {colleges.map(c => {
                        const isAssigned = Boolean(c.facultyAssigned);
                        return (
                          <option key={c.id} value={c.id} disabled={isAssigned}>
                            {c.collegeName} {isAssigned ? `(Assigned: ${c.facultyAssigned})` : '(Available)'}
                          </option>
                        );
                      })}
                    </select>
                    {facCollegeError && (
                      <div style={{ marginTop: '6px', padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '12.5px', lineHeight: '1.5' }}>
                        ⚠️ {facCollegeError}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer" style={{ flexShrink: 0 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowFacultyModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Created Faculty Credentials Confirmation Modal */}
      {showCreatedFacultyModal && createdFacultyData && (
        <div className="modal-overlay" onClick={() => setShowCreatedFacultyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', width: '92%' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={20} style={{ color: '#10b981' }} />
                Faculty Account Provisioned
              </h3>
              <button type="button" className="modal-close" onClick={() => setShowCreatedFacultyModal(false)}>&times;</button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {createdFacultyData.emailSent ? (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <CheckCircle size={18} style={{ color: '#16a34a', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '13px', color: '#166534', lineHeight: 1.5 }}>
                    <strong>Welcome Email Delivered:</strong> An onboarding email containing login instructions and credentials was delivered to <strong>{createdFacultyData.email}</strong>.
                  </div>
                </div>
              ) : (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <AlertCircle size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '13px', color: '#92400e', lineHeight: 1.5 }}>
                    <strong>Email Delivery Notice:</strong> The account was successfully created, but the welcome email failed to dispatch ({createdFacultyData.emailError || 'SMTP connection timeout'}). You can copy the credentials below or click <strong>"Resend Email"</strong>.
                  </div>
                </div>
              )}

              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Faculty Name:</span>
                  <strong style={{ fontSize: '13px' }}>{createdFacultyData.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Login Email:</span>
                  <strong style={{ fontSize: '13px' }}><code>{createdFacultyData.email}</code></strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Password:</span>
                  <strong style={{ fontSize: '14px', color: 'var(--primary)' }}><code>{createdFacultyData.password}</code></strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Employee ID:</span>
                  <strong style={{ fontSize: '13px' }}><code>{createdFacultyData.facultyId}</code></strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Assigned College:</span>
                  <strong style={{ fontSize: '13px' }}>{createdFacultyData.collegeName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Portal Login URL:</span>
                  <span style={{ fontSize: '12px', color: 'var(--primary)' }}>
                    <code>{window.location.origin}/login</code> (Select "Faculty / Admin" tab)
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  const text = `SkillCetamol Portal - Faculty Login Credentials:\nName: ${createdFacultyData.name}\nEmail: ${createdFacultyData.email}\nPassword: ${createdFacultyData.password}\nEmployee ID: ${createdFacultyData.facultyId}\nCollege: ${createdFacultyData.collegeName}\nLogin URL: ${window.location.origin}/login (Faculty / Admin tab)`;
                  navigator.clipboard.writeText(text);
                  setCopiedCredentials(true);
                  showToast('Credentials copied to clipboard!', 'success');
                  setTimeout(() => setCopiedCredentials(false), 2500);
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {copiedCredentials ? <Check size={15} style={{ color: '#10b981' }} /> : <Copy size={15} />}
                <span>{copiedCredentials ? 'Copied!' : 'Copy Credentials'}</span>
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={resendingFacultyId === createdFacultyData.id}
                  onClick={async () => {
                    await handleResendFacultyWelcome(createdFacultyData);
                    setCreatedFacultyData({ ...createdFacultyData, emailSent: true, emailError: null });
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Mail size={14} />
                  <span>{resendingFacultyId === createdFacultyData.id ? 'Sending...' : 'Resend Email'}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowCreatedFacultyModal(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Faculty Password Modal */}
      {showResetModal && resetTargetUser && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', width: '92%' }}>
            <form onSubmit={handleConfirmResetPassword}>
              <div className="modal-header">
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <KeyRound size={18} style={{ color: 'var(--primary)' }} />
                  Reset Password: {resetTargetUser.name}
                </h3>
                <button type="button" className="modal-close" onClick={() => setShowResetModal(false)}>&times;</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                  Enter a new password for <strong>{resetTargetUser.email}</strong>. The new password will be stored and a welcome email containing login credentials will be dispatched.
                </p>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>New Password</label>
                    <button
                      type="button"
                      onClick={() => setResetNewPassword('faculty123')}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', cursor: 'pointer', fontWeight: 600, padding: 0 }}
                    >
                      Use "faculty123"
                    </button>
                  </div>
                  <div style={{ position: 'relative', marginTop: '6px' }}>
                    <input
                      type={showResetNewPassword ? 'text' : 'password'}
                      required
                      className="form-control"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      style={{ paddingRight: '38px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px'
                      }}
                    >
                      {showResetNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowResetModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Update & Email Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* College Add Modal */}
      {showCollegeModal && (
        <div className="modal-overlay" onClick={() => setShowCollegeModal(false)}>
          <div className="modal-content" style={{ maxWidth: '420px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleCreateCollege}>
              <div className="modal-header">
                <h3 className="modal-title">Add College</h3>
                <button type="button" className="modal-close" onClick={() => setShowCollegeModal(false)}>&times;</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">College Name</label>
                  <input type="text" required className="form-control" placeholder="SkillCetamol Engineering College" value={collegeNameInput} onChange={e => setCollegeNameInput(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">College Code</label>
                  <input type="text" required className="form-control" placeholder="SCEC" value={collegeCodeInput} onChange={e => setCollegeCodeInput(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Stream / Academic Category</label>
                  <select
                    className="form-control"
                    value={collegeCategoryInput}
                    onChange={e => setCollegeCategoryInput(e.target.value as any)}
                  >
                    <option value="Both">Both / All Streams (Engineering & Arts & Science)</option>
                    <option value="Engineering">Engineering Only</option>
                    <option value="Arts & Science">Arts & Science Only</option>
                  </select>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Ensures newly added colleges appear for students registering under the chosen stream(s).
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCollegeModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add College</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Department Add Modal */}
      {showDeptModal && (
        <div className="modal-overlay" onClick={() => setShowDeptModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleCreateDept}>
              <div className="modal-header">
                <h3 className="modal-title">Add Department</h3>
                <button type="button" className="modal-close" onClick={() => setShowDeptModal(false)}>&times;</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">College</label>
                  <select required className="form-control" value={deptCollegeId} onChange={e => setDeptCollegeId(e.target.value)}>
                    <option value="">Select College</option>
                    {colleges.map(c => (
                      <option key={c.id} value={c.id}>{c.collegeName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select required className="form-control" value={deptCategory} onChange={e => setDeptCategory(e.target.value as any)}>
                    <option value="Engineering">Engineering (240 standard courses)</option>
                    <option value="Arts & Science">Arts & Science (380 standard courses)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department / Course Name</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Aeronautical Engineering, B.Sc. Mathematics..."
                    value={deptName}
                    onChange={e => {
                      const val = e.target.value;
                      setDeptName(val);
                      if (!deptCode) {
                        const abbr = val.split(' ').map(w => w[0]).join('').slice(0, 6).toUpperCase();
                        setDeptCode(abbr);
                      }
                    }}
                    list="admin-dept-suggestions"
                  />
                  <datalist id="admin-dept-suggestions">
                    {getProgramsByCategory(deptCategory).map((prog, idx) => (
                      <option key={idx} value={prog} />
                    ))}
                  </datalist>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Choose from standard {getProgramsByCategory(deptCategory).length} {deptCategory} courses or enter a custom name.
                  </span>
                </div>
                <div className="form-group">
                  <label className="form-label">Code / Abbr</label>
                  <input type="text" required className="form-control" placeholder="MECH" value={deptCode} onChange={e => setDeptCode(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeptModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Department</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Course Add Modal */}
      {showCourseModal && (
        <div className="modal-overlay" onClick={() => setShowCourseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleCreateCourse}>
              <div className="modal-header">
                <h3 className="modal-title">Add Course Program</h3>
                <button type="button" className="modal-close" onClick={() => setShowCourseModal(false)}>&times;</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Course Title</label>
                  <input type="text" required className="form-control" placeholder="Master of Science in Math" value={courseName} onChange={e => setCourseName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Code / Abbr</label>
                  <input type="text" required className="form-control" placeholder="MSC-MATH" value={courseCode} onChange={e => setCourseCode(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select required className="form-control" value={courseDeptId} onChange={e => setCourseDeptId(e.target.value)}>
                    <option value="">Select Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (Years)</label>
                  <input type="number" min={1} max={5} required className="form-control" value={courseDuration} onChange={e => setCourseDuration(Number(e.target.value))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCourseModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Add Modal */}
      {showSubjectModal && (
        <div className="modal-overlay" onClick={() => setShowSubjectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleCreateSubject}>
              <div className="modal-header">
                <h3 className="modal-title">Add Subject Details</h3>
                <button type="button" className="modal-close" onClick={() => setShowSubjectModal(false)}>&times;</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Subject Name</label>
                  <input type="text" required className="form-control" placeholder="Theory of Computation" value={subName} onChange={e => setSubName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject Code</label>
                  <input type="text" required className="form-control" placeholder="CSE-301" value={subCode} onChange={e => setSubCode(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Associated Course Program</label>
                  <select required className="form-control" value={subCourseId} onChange={e => setSubCourseId(e.target.value)}>
                    <option value="">Select Course</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowSubjectModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Subject</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Bank Add/Edit Modal */}
      {showQuestionModal && (
        <div className="modal-overlay" onClick={() => setShowQuestionModal(false)}>
          <div className="modal-content" style={{ maxWidth: '650px' }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSaveQuestion}>
              <div className="modal-header">
                <h3 className="modal-title">{editingQuestion ? 'Edit Question' : 'Add Question to Question Bank'}</h3>
                <button type="button" className="modal-close" onClick={() => setShowQuestionModal(false)}>&times;</button>
              </div>

              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Topic / Subject *</label>
                    <button
                      type="button"
                      style={{
                        fontSize: '12px',
                        padding: '2px 8px',
                        color: 'var(--primary, #3b82f6)',
                        background: 'rgba(59, 130, 246, 0.08)',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      onClick={() => {
                        setShowInlineTopicInput(!showInlineTopicInput);
                        setInlineTopicName('');
                      }}
                    >
                      <Plus size={13} /> {showInlineTopicInput ? 'Cancel' : 'Create New Topic'}
                    </button>
                  </div>

                  {showInlineTopicInput && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', padding: '10px', background: 'var(--bg-subtle, #f8fafc)', borderRadius: '6px', border: '1px dashed #3b82f6' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter new topic name (e.g. Operating Systems)..."
                        value={inlineTopicName}
                        onChange={(e) => setInlineTopicName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateInlineTopic();
                          }
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ whiteSpace: 'nowrap', fontSize: '12px', padding: '6px 14px' }}
                        disabled={creatingTopicLoading || !inlineTopicName.trim()}
                        onClick={handleCreateInlineTopic}
                      >
                        {creatingTopicLoading ? 'Creating...' : 'Create & Select'}
                      </button>
                    </div>
                  )}

                  <select
                    required
                    className="form-control"
                    value={qSubjectId}
                    onChange={(e) => setQSubjectId(e.target.value)}
                  >
                    <option value="">Select Topic / Subject</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Question Text</label>
                  <textarea
                    required
                    rows={3}
                    className="form-control"
                    placeholder="Enter the question prompt or problem statement..."
                    value={qText}
                    onChange={(e) => setQText(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Question Type</label>
                    <select
                      className="form-control"
                      value={qType}
                      onChange={(e) => setQType(e.target.value as any)}
                    >
                      <option value="mcq">MCQ (Single Choice)</option>
                      <option value="checkbox">Checkbox (Multi Choice)</option>
                      <option value="text">Descriptive Answer</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Points / Marks</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      required
                      className="form-control"
                      value={qPoints}
                      onChange={(e) => setQPoints(Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Difficulty Level</label>
                    <select
                      className="form-control"
                      value={qDifficulty}
                      onChange={(e) => setQDifficulty(e.target.value as any)}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                {qType !== 'text' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Options & Correct Answer Selection</label>
                    {qOptions.map((opt, idx) => {
                      const isOptionChecked = qType === 'mcq'
                        ? String(idx) === String(qCorrectAnswer)
                        : (Array.isArray(qCorrectAnswer) ? qCorrectAnswer.includes(String(idx)) : String(idx) === String(qCorrectAnswer));

                      const handleOptionSelect = () => {
                        if (qType === 'mcq') {
                          setQCorrectAnswer(String(idx));
                        } else {
                          const current = Array.isArray(qCorrectAnswer)
                            ? [...qCorrectAnswer]
                            : (qCorrectAnswer !== undefined && qCorrectAnswer !== null ? [String(qCorrectAnswer)] : []);
                          const strIdx = String(idx);
                          if (current.includes(strIdx)) {
                            setQCorrectAnswer(current.filter(i => i !== strIdx));
                          } else {
                            setQCorrectAnswer([...current, strIdx]);
                          }
                        }
                      };

                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            type={qType === 'mcq' ? 'radio' : 'checkbox'}
                            name="correctOption"
                            checked={isOptionChecked}
                            onChange={handleOptionSelect}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          />
                          <span style={{ fontWeight: 600, fontSize: '13px', width: '20px' }}>{String.fromCharCode(65 + idx)}:</span>
                          <input
                            type="text"
                            required
                            className="form-control"
                            placeholder={`Option ${String.fromCharCode(65 + idx)} content`}
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...qOptions];
                              newOpts[idx] = e.target.value;
                              setQOptions(newOpts);
                            }}
                          />
                        </div>
                      );
                    })}
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {qType === 'mcq' 
                        ? 'Select the radio button next to Option A, B, C, or D to mark it as the single correct answer.' 
                        : 'Select the checkboxes next to all correct options (multiple allowed).'}
                    </span>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowQuestionModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingQuestion ? 'Save Question Changes' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create New Topic / Subject Modal */}
      {showNewTopicModal && (
        <div className="modal-overlay" onClick={() => setShowNewTopicModal(false)}>
          <div className="modal-content" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={(e) => { e.preventDefault(); handleCreateNewTopic(false); }}>
              <div className="modal-header">
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FolderPlus size={18} color="#3b82f6" /> Create New Topic / Subject
                </h3>
                <button type="button" className="modal-close" onClick={() => setShowNewTopicModal(false)}>&times;</button>
              </div>

              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                  Create a custom subject or topic area in the Question Bank. Once created, you can immediately author questions under this topic, and faculty members can browse and select questions from it for examinations.
                </p>

                <div className="form-group">
                  <label className="form-label">Topic / Subject Name *</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    className="form-control"
                    placeholder="e.g. Data Structures & Algorithms, Cloud Computing, Database Management..."
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowNewTopicModal(false)}
                >
                  Cancel
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="submit"
                    className="btn btn-secondary"
                    disabled={creatingTopicLoading || !newTopicName.trim()}
                  >
                    {creatingTopicLoading ? 'Creating...' : 'Create Topic'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={creatingTopicLoading || !newTopicName.trim()}
                    onClick={() => handleCreateNewTopic(true)}
                  >
                    {creatingTopicLoading ? 'Creating...' : 'Create & Add Questions'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Topic & Questions Confirmation Modal */}
      {showDeleteTopicModal && topicToDelete && (
        <div className="modal-overlay" onClick={() => !deletingTopicLoading && setShowDeleteTopicModal(false)}>
          <div className="modal-content" style={{ maxWidth: '520px', borderTop: '4px solid #ef4444' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                <Trash2 size={20} color="#ef4444" /> Delete Topic & Questions
              </h3>
              <button 
                type="button" 
                className="modal-close" 
                disabled={deletingTopicLoading}
                onClick={() => setShowDeleteTopicModal(false)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                padding: '14px 16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}>
                <AlertCircle size={22} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 600, color: '#ef4444', marginBottom: '4px', fontSize: '14px' }}>
                    Warning: Irreversible Action
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-color, #e5e7eb)', lineHeight: 1.5 }}>
                    Are you sure you want to permanently delete the topic <strong>"{topicToDelete.name}"</strong>?
                  </div>
                </div>
              </div>

              {subjects.length > 1 && (
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                    Selected Topic to Delete:
                  </label>
                  <select
                    className="form-control"
                    value={topicToDelete.id}
                    disabled={deletingTopicLoading}
                    onChange={(e) => {
                      const found = subjects.find(s => s.id === e.target.value);
                      if (found) setTopicToDelete(found);
                    }}
                  >
                    {subjects.map(s => {
                      const count = questions.filter(q => q.subjectId === s.id).length;
                      return (
                        <option key={s.id} value={s.id}>
                          {s.name} ({count} questions)
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* Deletion Mode Selector */}
              <div style={{
                display: 'flex',
                gap: '12px',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #374151)'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', flex: 1, color: 'var(--text-color, #f3f4f6)' }}>
                  <input
                    type="radio"
                    name="deleteTopicMode"
                    disabled={deletingTopicLoading}
                    checked={!deleteSubjectQuestionsOnly}
                    onChange={() => setDeleteSubjectQuestionsOnly(false)}
                    style={{ cursor: 'pointer', accentColor: '#ef4444' }}
                  />
                  <span>Delete Topic & All Questions</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', flex: 1, color: 'var(--text-color, #f3f4f6)' }}>
                  <input
                    type="radio"
                    name="deleteTopicMode"
                    disabled={deletingTopicLoading}
                    checked={deleteSubjectQuestionsOnly}
                    onChange={() => setDeleteSubjectQuestionsOnly(true)}
                    style={{ cursor: 'pointer', accentColor: '#ef4444' }}
                  />
                  <span>Clear Questions Only (Keep Topic)</span>
                </label>
              </div>

              {/* Live Deletion Progress Tracker with Numbers */}
              {deleteProgress && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '13px', color: '#ef4444' }}>
                      <RefreshCw size={15} className="spin" />
                      <span>{deleteProgress.statusText || 'Deleting in progress...'}</span>
                    </div>
                    <div style={{
                      background: '#ef4444',
                      color: '#ffffff',
                      padding: '3px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      letterSpacing: '0.5px'
                    }}>
                      {deleteProgress.current} / {deleteProgress.total} ({deleteProgress.percentage}%)
                    </div>
                  </div>

                  {/* Progress Bar Track */}
                  <div style={{
                    width: '100%',
                    height: '10px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '5px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${deleteProgress.percentage}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #ef4444, #f97316)',
                      borderRadius: '5px',
                      transition: 'width 0.25s ease-in-out'
                    }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted, #9ca3af)' }}>
                    <span>Batch deletion tracking (safe chunking)</span>
                    <span><strong>{Math.max(0, deleteProgress.total - deleteProgress.current)}</strong> remaining</span>
                  </div>
                </div>
              )}

              <div style={{
                background: 'var(--card-bg, #1e293b)',
                borderRadius: '8px',
                padding: '14px 16px',
                fontSize: '13px',
                color: 'var(--text-muted, #9ca3af)',
                border: '1px solid var(--border-color, #374151)'
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text-color, #f3f4f6)', marginBottom: '8px' }}>
                  {deleteSubjectQuestionsOnly
                    ? 'The following questions will be deleted while keeping the topic:'
                    : 'The following data will be completely removed from the application:'}
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.7' }}>
                  {!deleteSubjectQuestionsOnly && (
                    <li>The topic <strong>{topicToDelete.name}</strong></li>
                  )}
                  <li>
                    <strong style={{ color: '#ef4444' }}>
                      {questions.filter(q => q.subjectId === topicToDelete.id).length} question(s)
                    </strong>{' '}
                    belonging to this topic
                  </li>
                  <li>All question options, answer choices, and related question bank records</li>
                </ul>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={deletingTopicLoading}
                onClick={() => setShowDeleteTopicModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{
                  background: '#dc2626',
                  borderColor: '#dc2626',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                  padding: '8px 16px',
                  cursor: deletingTopicLoading ? 'not-allowed' : 'pointer'
                }}
                disabled={deletingTopicLoading}
                onClick={handleConfirmDeleteTopic}
              >
                {deletingTopicLoading ? (
                  <>
                    <RefreshCw size={15} className="spin" />{' '}
                    {deleteProgress ? `Deleting (${deleteProgress.current} / ${deleteProgress.total})...` : 'Deleting...'}
                  </>
                ) : (
                  <>
                    <Trash2 size={15} /> {deleteSubjectQuestionsOnly ? 'Clear Topic Questions' : 'Proceed to Delete'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Question(s) Confirmation Modal */}
      {showDeleteQuestionsModal && questionsToDelete.length > 0 && (
        <div className="modal-overlay" onClick={() => !deletingQuestionsLoading && setShowDeleteQuestionsModal(false)}>
          <div className="modal-content" style={{ maxWidth: '540px', borderTop: '4px solid #ef4444' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                <Trash2 size={20} color="#ef4444" /> {questionsToDelete.length === 1 ? 'Delete Question' : `Delete ${questionsToDelete.length} Selected Questions`}
              </h3>
              <button
                type="button"
                className="modal-close"
                disabled={deletingQuestionsLoading}
                onClick={() => setShowDeleteQuestionsModal(false)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                padding: '14px 16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}>
                <AlertCircle size={22} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 600, color: '#ef4444', marginBottom: '4px', fontSize: '14px' }}>
                    Warning: Irreversible Action
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-color, #e5e7eb)', lineHeight: 1.5 }}>
                    Are you sure you want to permanently delete {questionsToDelete.length === 1 ? 'this question' : `the ${questionsToDelete.length} selected questions`} from the Question Bank?
                  </div>
                </div>
              </div>

              {/* Live Deletion Progress Tracker with Numbers */}
              {deleteProgress && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '13px', color: '#ef4444' }}>
                      <RefreshCw size={15} className="spin" />
                      <span>{deleteProgress.statusText || 'Deleting questions in progress...'}</span>
                    </div>
                    <div style={{
                      background: '#ef4444',
                      color: '#ffffff',
                      padding: '3px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      letterSpacing: '0.5px'
                    }}>
                      {deleteProgress.current} / {deleteProgress.total} ({deleteProgress.percentage}%)
                    </div>
                  </div>

                  {/* Progress Bar Track */}
                  <div style={{
                    width: '100%',
                    height: '10px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '5px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${deleteProgress.percentage}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #ef4444, #f97316)',
                      borderRadius: '5px',
                      transition: 'width 0.25s ease-in-out'
                    }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted, #9ca3af)' }}>
                    <span>Batch processing to prevent timeout</span>
                    <span><strong>{Math.max(0, deleteProgress.total - deleteProgress.current)}</strong> remaining</span>
                  </div>
                </div>
              )}

              {/* Preview list */}
              <div style={{
                background: 'var(--card-bg, #1e293b)',
                borderRadius: '8px',
                padding: '12px 14px',
                border: '1px solid var(--border-color, #374151)',
                maxHeight: '220px',
                overflowY: 'auto'
              }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted, #9ca3af)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  {questionsToDelete.length === 1 ? 'Question to be removed:' : `Selected Questions (${questionsToDelete.length}):`}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {questionsToDelete.map((q, idx) => {
                    const sub = subjects.find(s => s.id === q.subjectId);
                    return (
                      <div key={q.id} style={{
                        padding: '8px 10px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color, #374151)'
                      }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main, #f3f4f6)', marginBottom: '4px' }}>
                          {idx + 1}. {q.text}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-muted, #9ca3af)' }}>
                          <span>Topic: <strong>{sub?.name || 'General Pool'}</strong></span>
                          <span>&bull;</span>
                          <span style={{ textTransform: 'uppercase' }}>{q.type}</span>
                          <span>&bull;</span>
                          <span>{q.difficulty}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-muted, #9ca3af)' }}>
                This will delete the question content, answer options, and related student test response logs. This action cannot be undone.
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={deletingQuestionsLoading}
                onClick={() => setShowDeleteQuestionsModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{
                  background: '#dc2626',
                  borderColor: '#dc2626',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 600,
                  padding: '8px 16px',
                  cursor: deletingQuestionsLoading ? 'not-allowed' : 'pointer'
                }}
                disabled={deletingQuestionsLoading}
                onClick={handleConfirmDeleteQuestions}
              >
                {deletingQuestionsLoading ? (
                  <>
                    <RefreshCw size={15} className="spin" />{' '}
                    {deleteProgress ? `Deleting (${deleteProgress.current} / ${deleteProgress.total})...` : 'Deleting...'}
                  </>
                ) : (
                  <>
                    <Trash2 size={15} /> Proceed to Delete ({questionsToDelete.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Bulk Upload Questions (PDF / Word / CSV) */}
      {showBulkUploadModal && (
        <div className="modal-overlay" onClick={() => setShowBulkUploadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <form onSubmit={handleBulkUploadSubmit}>
              <div className="modal-header">
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Upload size={18} color="#3b82f6" /> Bulk Upload Questions (PDF / Word / CSV)
                </h3>
                <button type="button" className="modal-close" onClick={() => setShowBulkUploadModal(false)}>&times;</button>
              </div>

              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '75vh', overflowY: 'auto' }}>
                <div style={{
                  padding: '12px 14px',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.2)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}>
                  <Sparkles size={18} style={{ color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>AI & Heuristic Question Extraction</strong>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Upload question papers in PDF or Word format (or spreadsheets). The parser will automatically identify question stems, options, and answers, and import them directly into the repository under your selected topic.
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Document / Paper Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TCS NQT Quantitative Aptitude Model Paper 2026"
                    className="form-control"
                    value={bulkDocName}
                    onChange={e => setBulkDocName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Target Topic / Subject *</label>
                    <button
                      type="button"
                      style={{
                        fontSize: '12px',
                        padding: '2px 8px',
                        color: 'var(--primary, #3b82f6)',
                        background: 'rgba(59, 130, 246, 0.08)',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      onClick={() => {
                        setShowBulkInlineTopic(!showBulkInlineTopic);
                        setBulkInlineTopicName('');
                      }}
                    >
                      <Plus size={13} /> {showBulkInlineTopic ? 'Cancel' : 'Create New Topic'}
                    </button>
                  </div>

                  {showBulkInlineTopic && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', padding: '10px', background: 'var(--bg-subtle, #f8fafc)', borderRadius: '6px', border: '1px dashed #3b82f6' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter new topic name (e.g. Cognitive Ability)..."
                        value={bulkInlineTopicName}
                        onChange={(e) => setBulkInlineTopicName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateBulkInlineTopic();
                          }
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={bulkCreatingTopic || !bulkInlineTopicName.trim()}
                        onClick={handleCreateBulkInlineTopic}
                        style={{ whiteSpace: 'nowrap', padding: '6px 14px' }}
                      >
                        {bulkCreatingTopic ? 'Adding...' : 'Add Topic'}
                      </button>
                    </div>
                  )}

                  <select
                    required
                    className="form-control"
                    value={bulkSubjectId}
                    onChange={e => setBulkSubjectId(e.target.value)}
                  >
                    <option value="">Select Target Topic</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name || (s as any).subjectName}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckSquare size={15} color="#3b82f6" /> Question Format / Answer Mode *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '6px' }}>
                    {/* MCQ Option */}
                    <div
                      onClick={() => setBulkQuestionType('mcq')}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: bulkQuestionType === 'mcq' ? '2px solid #3b82f6' : '1px solid var(--border)',
                        background: bulkQuestionType === 'mcq' ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-card, #ffffff)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: bulkQuestionType === 'mcq' ? '#2563eb' : 'var(--text-main)' }}>
                          MCQ (Single)
                        </span>
                        <input
                          type="radio"
                          name="adminBulkQType"
                          checked={bulkQuestionType === 'mcq'}
                          onChange={() => setBulkQuestionType('mcq')}
                          style={{ cursor: 'pointer' }}
                        />
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                        Exactly 1 correct answer per question (radio selection).
                      </span>
                    </div>

                    {/* Multiples Option */}
                    <div
                      onClick={() => setBulkQuestionType('checkbox')}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: bulkQuestionType === 'checkbox' ? '2px solid #10b981' : '1px solid var(--border)',
                        background: bulkQuestionType === 'checkbox' ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-card, #ffffff)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: bulkQuestionType === 'checkbox' ? '#059669' : 'var(--text-main)' }}>
                          Multiples
                        </span>
                        <input
                          type="radio"
                          name="adminBulkQType"
                          checked={bulkQuestionType === 'checkbox'}
                          onChange={() => setBulkQuestionType('checkbox')}
                          style={{ cursor: 'pointer' }}
                        />
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                        Multiple correct answers allowed (checkboxes).
                      </span>
                    </div>

                    {/* Auto Detect Option */}
                    <div
                      onClick={() => setBulkQuestionType('auto')}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: bulkQuestionType === 'auto' ? '2px solid #8b5cf6' : '1px solid var(--border)',
                        background: bulkQuestionType === 'auto' ? 'rgba(139, 92, 246, 0.08)' : 'var(--bg-card, #ffffff)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: bulkQuestionType === 'auto' ? '#7c3aed' : 'var(--text-main)' }}>
                          Auto-Detect
                        </span>
                        <input
                          type="radio"
                          name="adminBulkQType"
                          checked={bulkQuestionType === 'auto'}
                          onChange={() => setBulkQuestionType('auto')}
                          style={{ cursor: 'pointer' }}
                        />
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                        Infer from answer key (single or multiple choices).
                      </span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Question Document File (.pdf, .docx, .csv) *</label>
                  <input
                    id="admin-bulk-qfile"
                    type="file"
                    required
                    accept=".pdf,.docx,.csv"
                    className="form-control"
                    onChange={e => setBulkQFile(e.target.files?.[0] || null)}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Supports PDF documents, Microsoft Word (.docx), or comma-separated CSV spreadsheets.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Answer Key File (Optional, .pdf, .docx, .csv, .txt)</label>
                  <input
                    id="admin-bulk-ansfile"
                    type="file"
                    accept=".pdf,.docx,.csv,.txt"
                    className="form-control"
                    onChange={e => setBulkAnsFile(e.target.files?.[0] || null)}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Optional separate answer document with question numbers and correct keys (e.g., 1. B, 2. C).
                  </span>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowBulkUploadModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bulkUploading || !bulkQFile || !bulkSubjectId || !bulkDocName.trim()}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Upload size={16} />
                  {bulkUploading ? 'Extracting Questions...' : 'Upload & Extract Questions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Extracted Questions from Document */}
      {showDocQuestionsModal && selectedDocForQuestions && (
        <div className="modal-overlay" onClick={() => setShowDocQuestionsModal(false)}>
          <div className="modal-content" style={{ maxWidth: '680px', width: '95%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#3b82f6" /> Extracted Questions — {selectedDocForQuestions.name}
              </h3>
              <button type="button" className="modal-close" onClick={() => setShowDocQuestionsModal(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {loadingDocQuestions ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Loading extracted questions...
                </div>
              ) : docQuestions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No questions found for this document.
                </div>
              ) : (
                docQuestions.map((q, idx) => (
                  <div key={q.id} style={{
                    padding: '14px',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--hover)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)' }}>
                        Question {idx + 1} ({q.type.toUpperCase()})
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Difficulty: <strong style={{ color: q.difficulty === 'easy' ? 'var(--success)' : q.difficulty === 'medium' ? 'var(--warning)' : 'var(--danger)' }}>{q.difficulty}</strong> | Points: <strong>{q.marks || q.points || 5}pt</strong>
                      </span>
                    </div>
                    <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)', margin: '0 0 10px 0' }}>{q.question || q.text}</p>
                    
                    {q.options && q.options.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px' }}>
                        {q.options.map((opt: string, oIdx: number) => {
                          const isCorrect = Array.isArray(q.correctAnswer)
                            ? q.correctAnswer.includes(String(oIdx))
                            : String(oIdx) === String(q.correctAnswer);
                          return (
                            <div key={oIdx} style={{ fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: isCorrect ? 'var(--success-bg, rgba(16, 185, 129, 0.15))' : 'var(--border)',
                                color: isCorrect ? 'var(--success, #10b981)' : 'var(--text-muted)',
                                border: isCorrect ? '1px solid var(--success, #10b981)' : '1px solid var(--border)'
                              }}>
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span style={{ color: isCorrect ? 'var(--success, #10b981)' : 'var(--text-main)', fontWeight: isCorrect ? 600 : 400 }}>
                                {opt}
                              </span>
                              {isCorrect && (
                                <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#059669', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                  Correct
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowDocQuestionsModal(false)}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          USER PROFILE QUICK VIEW DRAWER
          ========================================== */}
      {drawerOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
          <div className="drawer">
            <div className="drawer-header">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} /> User Profile Quick View
              </h3>
              <button
                className="modal-close"
                style={{ fontSize: '24px', cursor: 'pointer', background: 'none', border: 'none' }}
                onClick={() => setDrawerOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="drawer-body">
              {drawerLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="skeleton skeleton-avatar" style={{ width: '70px', height: '70px' }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton skeleton-text" style={{ width: '60%', height: '18px' }} />
                      <div className="skeleton skeleton-text" style={{ width: '40%' }} />
                    </div>
                  </div>
                  <div className="skeleton skeleton-text" style={{ height: '120px' }} />
                  <div className="skeleton skeleton-text" style={{ height: '80px' }} />
                </div>
              ) : selectedUser ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Photo & Basic Details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {selectedUser.photoUrl ? (
                      <img
                        src={cleanPhotoUrl(selectedUser.photoUrl)}
                        alt={selectedUser.name}
                        style={{
                          width: '75px',
                          height: '75px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '3px solid var(--primary)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '75px',
                          height: '75px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--hover)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '28px',
                          fontWeight: 700,
                          color: 'var(--primary)',
                          border: '3px solid var(--border)',
                        }}
                      >
                        {selectedUser.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{selectedUser.name}</h4>
                      <span
                        className={`badge ${
                          selectedUser.role === 'admin'
                            ? 'badge-danger'
                            : selectedUser.role === 'faculty'
                            ? 'badge-info'
                            : 'badge-success'
                        }`}
                        style={{ fontSize: '11px', textTransform: 'capitalize' }}
                      >
                        {selectedUser.role}
                      </span>
                    </div>
                  </div>

                  {/* Contact & Status details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Email Address</span>
                      <code style={{ wordBreak: 'break-all' }}>{selectedUser.email}</code>
                    </div>
                    {selectedUser.phone && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Phone Number</span>
                        <span>{selectedUser.phone}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Status</span>
                      <span
                        className={`badge ${
                          selectedUser.status === 'active'
                            ? 'badge-success'
                            : selectedUser.status === 'pending'
                            ? 'badge-warning'
                            : 'badge-secondary'
                        }`}
                        style={{ textTransform: 'capitalize' }}
                      >
                        {selectedUser.status}
                      </span>
                    </div>
                  </div>

                  {/* Academic / Organization details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <h5 style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Academic / Office Info</h5>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Department</span>
                      <span>{selectedUser.departmentName}</span>
                    </div>
                    {selectedUser.role === 'student' && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Course</span>
                          <span>{selectedUser.courseName}</span>
                        </div>
                        {selectedUser.batch && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Batch</span>
                            <span style={{ fontWeight: 600 }}>{selectedUser.batch}</span>
                          </div>
                        )}
                        {selectedUser.academicYear && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Academic Year</span>
                            <span>Year {selectedUser.academicYear} ({selectedUser.academicYear === 1 ? '1st' : selectedUser.academicYear === 2 ? '2nd' : selectedUser.academicYear === 3 ? '3rd' : '4th'} Year)</span>
                          </div>
                        )}
                        {selectedUser.semester && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Semester</span>
                            <span>Semester {selectedUser.semester}</span>
                          </div>
                        )}
                      </>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        {selectedUser.role === 'student' ? 'Register Number' : 'Employee ID'}
                      </span>
                      <span>{selectedUser.registerNumber || selectedUser.id.substring(0, 8).toUpperCase()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Account Created</span>
                      <span>{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Quick Actions Panel */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <h5 style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Admin Actions</h5>
                    
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {selectedUser.role === 'student' && selectedUser.status === 'pending' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleUpdateStatus(selectedUser.id, 'active')}
                        >
                          Approve Student
                        </button>
                      )}
                      {selectedUser.status === 'active' ? (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                          onClick={() => handleUpdateStatus(selectedUser.id, 'inactive')}
                        >
                          Deactivate Account
                        </button>
                      ) : (
                        selectedUser.status !== 'pending' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleUpdateStatus(selectedUser.id, 'active')}
                          >
                            Activate Account
                          </button>
                        )
                      )}

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleResetPassword(selectedUser.id)}
                      >
                        Reset Password
                      </button>

                      <a
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        href={`mailto:${selectedUser.email}`}
                      >
                        Send Email
                      </a>
                    </div>
                  </div>

                  {/* Recent Activity Log */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                    <h5 style={{ margin: 0, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Recent Activity Logs</h5>
                    {selectedUser.recentActivity && selectedUser.recentActivity.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedUser.recentActivity.map((log: any, index: number) => (
                          <div
                            key={index}
                            style={{
                              background: 'var(--hover)',
                              padding: '8px 12px',
                              borderRadius: 'var(--radius)',
                              fontSize: '12px',
                            }}
                          >
                            <p style={{ margin: 0, color: 'var(--text-main)' }}>{log.action}</p>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No recent activity logged for this user.</p>
                    )}
                  </div>
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Failed to load user profile.</p>
              )}
            </div>
            <div className="drawer-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setDrawerOpen(false)}>
                Close Panel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
