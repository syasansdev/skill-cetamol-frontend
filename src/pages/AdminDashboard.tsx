import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, GraduationCap, FileText, CheckCircle, Clock, 
  Trash2, Plus, Search, Settings, SlidersHorizontal, 
  BookOpen, AlertCircle, Sparkles, Server, Check, X, ShieldAlert, Upload, Edit,
  Edit3, Key, Copy, Eye, EyeOff
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
import { ConsolidatedStudentAnalytics } from '../components/ConsolidatedStudentAnalytics';
import { ActiveInvigilationExtensions } from '../components/ActiveInvigilationExtensions';
import { PerformanceThresholdConfig } from '../components/PerformanceThresholdConfig';
import { CentralizedAssessmentStudio } from '../components/CentralizedAssessmentStudio';

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
  
  // File Upload states
  const [uploadType, setUploadType] = useState<string>('students');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadSummary, setUploadSummary] = useState<any | null>(null);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);

  // Q-Papers Extractor states
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [loadingQPapers, setLoadingQPapers] = useState<boolean>(false);
  const [qPaperName, setQPaperName] = useState<string>('');
  const [qPaperSubjectId, setQPaperSubjectId] = useState<string>('');
  const [qPaperFile, setQPaperFile] = useState<File | null>(null);
  const [qAnswerFile, setQAnswerFile] = useState<File | null>(null);
  const [uploadingQPaper, setUploadingQPaper] = useState<boolean>(false);
  const [showDocQuestionsModal, setShowDocQuestionsModal] = useState<boolean>(false);
  const [selectedDocumentQuestions, setSelectedDocumentQuestions] = useState<any[]>([]);
  const [activeDocForPreview, setActiveDocForPreview] = useState<UploadedDocument | null>(null);

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

  // Edit Faculty State
  const [showEditFacultyModal, setShowEditFacultyModal] = useState<boolean>(false);
  const [editingFaculty, setEditingFaculty] = useState<any | null>(null);
  const [editFacName, setEditFacName] = useState<string>('');
  const [editFacEmail, setEditFacEmail] = useState<string>('');
  const [editFacEmployeeId, setEditFacEmployeeId] = useState<string>('');
  const [editFacCollegeId, setEditFacCollegeId] = useState<string>('');
  const [editFacDeptId, setEditFacDeptId] = useState<string>('');
  const [editFacPassword, setEditFacPassword] = useState<string>('');
  const [editFacStatus, setEditFacStatus] = useState<string>('active');
  const [editFacEmailError, setEditFacEmailError] = useState<string>('');
  const [editFacSaving, setEditFacSaving] = useState<boolean>(false);

  // Reset Password State
  const [showResetPasswordModal, setShowResetPasswordModal] = useState<boolean>(false);
  const [resetTargetUser, setResetTargetUser] = useState<any | null>(null);
  const [customResetPassword, setCustomResetPassword] = useState<string>('');
  const [resetResultInfo, setResetResultInfo] = useState<{ password: string; emailSent: boolean; message: string } | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState<boolean>(false);
  const [copiedPassword, setCopiedPassword] = useState<boolean>(false);

  const [showCollegeModal, setShowCollegeModal] = useState<boolean>(false);
  const [collegeNameInput, setCollegeNameInput] = useState<string>('');
  const [collegeCodeInput, setCollegeCodeInput] = useState<string>('');

  const [showDeptModal, setShowDeptModal] = useState<boolean>(false);
  const [deptName, setDeptName] = useState<string>('');
  const [deptCode, setDeptCode] = useState<string>('');
  const [deptCollegeId, setDeptCollegeId] = useState<string>('');

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
  const [qCorrectAnswer, setQCorrectAnswer] = useState<string>('0');
  const [qPoints, setQPoints] = useState<number>(5);
  const [qDifficulty, setQDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('');
  const [selectedDifficultyFilter, setSelectedDifficultyFilter] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('');

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
      setColleges(colRes.data);

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

      const resRes = await api.get('/faculty/results');
      setResults(resRes.data);

      const lockedRes = await api.get('/admin/locked-exams');
      setLockedExams(lockedRes.data);

      try {
        const docRes = await api.get('/admin/uploaded-qpapers');
        setUploadedDocuments(docRes.data);
      } catch (e) {
        // optional
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUploadedQPapers = async () => {
    setLoadingQPapers(true);
    try {
      const res = await api.get('/admin/uploaded-qpapers');
      setUploadedDocuments(res.data);
    } catch (err) {
      console.error('Failed to fetch uploaded documents:', err);
    } finally {
      setLoadingQPapers(false);
    }
  };

  const handleUploadQPaperSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qPaperFile || !qPaperSubjectId || !qPaperName) {
      showToast('Please fill all required fields and select a question file.', 'error');
      return;
    }
    setUploadingQPaper(true);
    try {
      const formData = new FormData();
      formData.append('file', qPaperFile);
      if (qAnswerFile) formData.append('answerFile', qAnswerFile);
      formData.append('name', qPaperName);
      formData.append('subjectId', qPaperSubjectId);

      const res = await api.post('/admin/upload-qpaper', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast(res.data.message || 'Question paper uploaded and parsed successfully!', 'success');
      setQPaperName('');
      setQPaperSubjectId('');
      setQPaperFile(null);
      setQAnswerFile(null);
      const fileInput = document.getElementById('admin-qpaper-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      const ansInput = document.getElementById('admin-qpaper-ans-file-input') as HTMLInputElement;
      if (ansInput) ansInput.value = '';
      await fetchUploadedQPapers();
      await fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to upload and extract questions.', 'error');
    } finally {
      setUploadingQPaper(false);
    }
  };

  const handleDeleteQPaper = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document? This will also remove all questions extracted from it.')) return;
    try {
      await api.delete(`/admin/uploaded-qpapers/${id}`);
      setUploadedDocuments(prev => prev.filter(d => d.id !== id));
      showToast('Document and its questions deleted successfully.', 'success');
      await fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete document.', 'error');
    }
  };

  const handleViewDocQuestionsClick = async (doc: UploadedDocument) => {
    setActiveDocForPreview(doc);
    setSelectedDocumentQuestions([]);
    setShowDocQuestionsModal(true);
    try {
      const res = await api.get(`/admin/uploaded-qpapers/${doc.id}/questions`);
      setSelectedDocumentQuestions(res.data);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load document questions.', 'error');
    }
  };

  const handleCreateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/colleges', {
        collegeName: collegeNameInput,
        code: collegeCodeInput
      });
      showToast('College added successfully!', 'success');
      setShowCollegeModal(false);
      setCollegeNameInput('');
      setCollegeCodeInput('');
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

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setFacEmailError('');
    try {
      await api.post('/admin/faculty', {
        name: facName,
        email: facEmail,
        password: facPassword,
        facultyId: facId,
        collegeId: facCollegeId,
        departmentId: facDeptId,
        role: facRole,
        subjects: facSelectedSubjects
      });
      showToast(`Account for ${facName} created successfully. A welcome email has been sent.`, 'success');
      setShowFacultyModal(false);
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
      fetchData();
    } catch (err: any) {
      const errData = err.response?.data;
      if (errData?.field === 'email') {
        // Highlight the email field inline
        setFacEmailError(errData.message);
      } else {
        showToast(errData?.message || 'Error creating account.', 'error');
      }
    }
  };

  // Open Edit Faculty Modal
  const handleOpenEditFaculty = (f: any) => {
    setEditingFaculty(f);
    setEditFacName(f.name || '');
    setEditFacEmail(f.email || '');
    setEditFacEmployeeId(f.facultyId || '');
    setEditFacCollegeId(f.collegeId || '');
    setEditFacDeptId(f.departmentId || '');
    setEditFacPassword('');
    setEditFacStatus(f.status || 'active');
    setEditFacEmailError('');
    setShowEditFacultyModal(true);
  };

  // Save Faculty Edits
  const handleSaveEditFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaculty) return;
    setEditFacSaving(true);
    setEditFacEmailError('');
    try {
      await api.put(`/admin/faculty/${editingFaculty.id}`, {
        name: editFacName,
        email: editFacEmail,
        facultyId: editFacEmployeeId,
        collegeId: editFacCollegeId,
        departmentId: editFacDeptId || null,
        password: editFacPassword || undefined,
        status: editFacStatus
      });
      showToast(`Faculty profile for ${editFacName} updated successfully.`, 'success');
      setShowEditFacultyModal(false);
      fetchData();
    } catch (err: any) {
      const errData = err.response?.data;
      if (errData?.field === 'email') {
        setEditFacEmailError(errData.message);
      } else {
        showToast(errData?.message || 'Error updating faculty account.', 'error');
      }
    } finally {
      setEditFacSaving(false);
    }
  };

  // Open Reset Password Modal
  const handleOpenResetPasswordModal = (userItem: any) => {
    setResetTargetUser(userItem);
    setCustomResetPassword('');
    setResetResultInfo(null);
    setCopiedPassword(false);
    setShowResetPasswordModal(true);
  };

  // Execute Password Reset
  const handleExecuteResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;
    setIsResettingPassword(true);
    try {
      const res = await api.post(`/admin/faculty/${resetTargetUser.id}/reset-password`, {
        newPassword: customResetPassword ? customResetPassword.trim() : undefined
      });
      setResetResultInfo({
        password: res.data.newPassword,
        emailSent: res.data.emailSent,
        message: res.data.message
      });
      showToast('Password reset successfully applied.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error resetting password.', 'error');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleCopyPassword = (pwd: string) => {
    navigator.clipboard.writeText(pwd);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2500);
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/departments', { name: deptName, code: deptCode });
      showToast('Department added.', 'success');
      setShowDeptModal(false);
      setDeptName('');
      setDeptCode('');
      fetchData();
    } catch (err) {
      showToast('Error adding department.', 'error');
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
    setQSubjectId(subjects.length > 0 ? subjects[0].id : '');
    setQText('');
    setQType('mcq');
    setQOptions(['', '', '', '']);
    setQCorrectAnswer('0');
    setQPoints(5);
    setQDifficulty('medium');
    setShowQuestionModal(true);
  };

  const handleOpenEditQuestionModal = (q: Question) => {
    setEditingQuestion(q);
    setQSubjectId(q.subjectId);
    setQText(q.text);
    setQType(q.type as any);
    setQOptions(q.options && q.options.length > 0 ? [...q.options] : ['', '', '', '']);
    setQCorrectAnswer(Array.isArray(q.correctAnswer) ? q.correctAnswer[0] || '0' : String(q.correctAnswer || '0'));
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
      if (editingQuestion) {
        await api.put(`/admin/questions/${editingQuestion.id}`, {
          subjectId: qSubjectId,
          text: qText,
          type: qType,
          options: qType !== 'text' ? qOptions : [],
          correctAnswer: qCorrectAnswer,
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
          correctAnswer: qCorrectAnswer,
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

  const handleDeleteQuestion = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this question from the Question Bank?')) {
      try {
        await api.delete(`/admin/questions/${id}`);
        showToast('Question removed from Question Bank.', 'info');
        fetchData();
      } catch (err: any) {
        showToast(err.response?.data?.message || 'Error deleting question.', 'error');
      }
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

  const handleExportReportsCSV = () => {
    if (results.length === 0) {
      showToast('No report records to export.', 'warning');
      return;
    }
    const headers = ['Student Roll No', 'Student Name', 'Exam Title', 'Score Secured', 'Total Points', 'Percentage', 'Status', 'Submitted At'];
    const csvRows = [
      headers.join(','),
      ...results.map(r => [
        `"${r.studentRollNo || ''}"`,
        `"${r.studentName || ''}"`,
        `"${r.examTitle || ''}"`,
        r.score,
        r.totalPoints,
        `"${r.percentage}%"`,
        `"${r.status}"`,
        `"${new Date(r.submittedAt).toLocaleString()}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `academic_performance_report_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Academic performance report exported successfully.', 'success');
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
      {/* ==========================================
          PERFORMANCE ANALYTICS CONSOLIDATED SUB-VIEW (FEATURE 7)
          ========================================== */}
      {activeTab === 'analytics' && (
        <ConsolidatedStudentAnalytics userRole={user?.role} userCollegeId={user?.collegeId} />
      )}

      {/* ==========================================
          CENTRALIZED ASSESSMENT STUDIO SUB-VIEW (FEATURE 8)
          ========================================== */}
      {activeTab === 'central-exams' && (
        <CentralizedAssessmentStudio />
      )}

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
                <BookOpen size={22} />
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
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
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
                    <th>Semester</th>
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
                        <td>Semester {s.semester}</td>
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
                  <th>College</th>
                  <th>Department</th>
                  <th>Assigned Subjects</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {faculties.map(f => {
                  const dept = departments.find(d => d.id === f.departmentId);
                  const clg = colleges.find(c => c.id === f.collegeId);
                  const collegeDisplay = f.collegeName || clg?.collegeName || 'Not Assigned';
                  const assignedSubs = subjects.filter(s => f.subjects?.includes(s.id)).map(s => s.name).join(', ');
                  return (
                    <tr key={f.id}>
                      <td><code>{f.facultyId || 'N/A'}</code></td>
                      <td style={{ fontWeight: 600 }}>{f.name}</td>
                      <td>{f.email}</td>
                      <td>
                        <span style={{ fontWeight: 500, color: 'var(--primary, #3b82f6)' }}>
                          {collegeDisplay}
                        </span>
                      </td>
                      <td>{f.departmentName || (dept ? dept.name : 'General')}</td>
                      <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {assignedSubs || 'None'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            title="Edit Faculty Details"
                            onClick={() => handleOpenEditFaculty(f)}
                          >
                            <Edit3 size={14} style={{ color: 'var(--primary, #3b82f6)' }} />
                          </button>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            title="Reset Faculty Password"
                            onClick={() => handleOpenResetPasswordModal(f)}
                          >
                            <Key size={14} style={{ color: '#f59e0b' }} />
                          </button>
                          <button 
                            className="btn btn-secondary btn-sm" 
                            title="Delete Faculty Account"
                            onClick={() => handleDeleteUser(f.id)}
                          >
                            <Trash2 size={14} style={{ color: 'var(--danger, #ef4444)' }} />
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
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Colleges</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setShowCollegeModal(true)}>
                <Plus size={14} /> Add College
              </button>
            </div>
            <div className="table-responsive">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>College ID</th>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {colleges.map(c => (
                    <tr key={c.id}>
                      <td><code>{c.id}</code></td>
                      <td><strong>{c.code || '--'}</strong></td>
                      <td>{c.collegeName}</td>
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
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Departments</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setShowDeptModal(true)}>
                <Plus size={14} /> Add Department
              </button>
            </div>
            <div className="table-responsive">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Department ID</th>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map(d => (
                    <tr key={d.id}>
                      <td><code>{d.id}</code></td>
                      <td><strong>{d.code}</strong></td>
                      <td>{d.name}</td>
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
            <button className="btn btn-primary" onClick={handleOpenAddQuestionModal}>
              <Plus size={16} /> Add Question to Bank
            </button>
          </div>

          {/* Filter Bar */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Search question text..."
              className="form-control"
              style={{ flex: 1, minWidth: '220px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            >
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select>
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={selectedDifficultyFilter}
              onChange={(e) => setSelectedDifficultyFilter(e.target.value)}
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
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="mcq">Multiple Choice (MCQ)</option>
              <option value="checkbox">Multiple Select (Checkbox)</option>
              <option value="text">Descriptive</option>
            </select>
          </div>

          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Question Content</th>
                  <th>Subject</th>
                  <th>Type</th>
                  <th>Difficulty</th>
                  <th>Points</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions
                  .filter(q => {
                    const matchText = q.text.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchSub = selectedSubjectFilter ? q.subjectId === selectedSubjectFilter : true;
                    const matchDiff = selectedDifficultyFilter ? q.difficulty === selectedDifficultyFilter : true;
                    const matchType = selectedTypeFilter ? q.type === selectedTypeFilter : true;
                    return matchText && matchSub && matchDiff && matchType;
                  })
                  .map(q => {
                    const subObj = subjects.find(s => s.id === q.subjectId);
                    return (
                      <tr key={q.id}>
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
                        <td>{subObj ? `${subObj.name} (${subObj.code})` : 'Unknown'}</td>
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
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleDeleteQuestion(q.id)}
                              style={{ color: 'var(--danger)' }}
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
          UPLOAD & EXTRACT Q-PAPERS SUB-VIEW
          ========================================== */}
      {activeTab === 'qpapers' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(400px, 2fr)', gap: '24px' }}>
          {/* Upload Form Card */}
          <div className="card" style={{ height: 'fit-content' }}>
            <h3 className="card-title" style={{ marginBottom: '16px' }}>Upload Question Document</h3>
            <form onSubmit={handleUploadQPaperSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Document Display Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Mid-Term 2026 CS-401"
                  className="form-control"
                  value={qPaperName}
                  onChange={e => setQPaperName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <select
                  required
                  className="form-control"
                  value={qPaperSubjectId}
                  onChange={e => setQPaperSubjectId(e.target.value)}
                >
                  <option value="">Select a Subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
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
          REPORTS & ANALYTICS SUB-VIEW
          ========================================== */}
      {(activeTab === 'results' || activeTab === 'reports') && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>Historical Student Performance Analytics</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
                Aggregated summary showing pass rates, score distributions, and rank registries across departments.
              </p>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleExportReportsCSV}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              Export Reports (CSV)
            </button>
          </div>

          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Student Roll No</th>
                  <th>Student Name</th>
                  <th>Exam Title</th>
                  <th>Score Secured</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  <th>Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.id}>
                    <td><code>{r.studentRollNo}</code></td>
                    <td style={{ fontWeight: 600 }}>{r.studentName}</td>
                    <td>{r.examTitle}</td>
                    <td>{r.score} / {r.totalPoints}</td>
                    <td><strong>{r.percentage}%</strong></td>
                    <td>
                      <span className={`badge ${r.status === 'pass' ? 'badge-success' : 'badge-danger'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>{new Date(r.submittedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          EXAM PROCTORING MONITOR SUB-VIEW
          ========================================== */}
      {activeTab === 'proctoring' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <ActiveInvigilationExtensions userRole="admin" />
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
                </select>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <PerformanceThresholdConfig />
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
                  <label className="form-label">Password</label>
                  <input type="password" required className="form-control" placeholder="••••••••" value={facPassword} onChange={e => setFacPassword(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Employee ID / Register Number</label>
                  <input type="text" required className="form-control" placeholder="FAC-4401" value={facId} onChange={e => setFacId(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-control" value={facRole} onChange={e => setFacRole(e.target.value)}>
                    <option value="faculty">Faculty Member</option>
                    <option value="student">Student</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">College Name</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="Skill Cetamol Engineering College"
                    value={facCollegeId}
                    onChange={(e) => setFacCollegeId(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Department Assignment</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="Computer Science & Engineering"
                    value={facDeptId}
                    onChange={(e) => setFacDeptId(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ flexShrink: 0 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowFacultyModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Faculty Modal */}
      {showEditFacultyModal && (
        <div className="modal-overlay" onClick={() => { setShowEditFacultyModal(false); setEditFacEmailError(''); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <form onSubmit={handleSaveEditFaculty} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              <div className="modal-header" style={{ flexShrink: 0 }}>
                <h3 className="modal-title">Edit Faculty Member</h3>
                <button type="button" className="modal-close" onClick={() => { setShowEditFacultyModal(false); setEditFacEmailError(''); }}>&times;</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '55vh', paddingRight: '8px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control" 
                    value={editFacName} 
                    onChange={e => setEditFacName(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    required
                    className="form-control"
                    value={editFacEmail}
                    onChange={e => { setEditFacEmail(e.target.value); setEditFacEmailError(''); }}
                    style={editFacEmailError ? { borderColor: '#ef4444', boxShadow: '0 0 0 3px rgba(239,68,68,0.15)' } : {}}
                  />
                  {editFacEmailError && (
                    <div style={{ marginTop: '6px', padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', fontSize: '12.5px' }}>
                      ⚠️ {editFacEmailError}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Employee ID</label>
                  <input 
                    type="text" 
                    required 
                    className="form-control" 
                    value={editFacEmployeeId} 
                    onChange={e => setEditFacEmployeeId(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">College</label>
                  <select 
                    className="form-control" 
                    value={editFacCollegeId} 
                    onChange={e => setEditFacCollegeId(e.target.value)}
                  >
                    <option value="">Select or assign college</option>
                    {colleges.map(c => (
                      <option key={c.id} value={c.id}>{c.collegeName}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select 
                    className="form-control" 
                    value={editFacDeptId} 
                    onChange={e => setEditFacDeptId(e.target.value)}
                  >
                    <option value="">General / All Departments</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Account Status</label>
                  <select 
                    className="form-control" 
                    value={editFacStatus} 
                    onChange={e => setEditFacStatus(e.target.value)}
                  >
                    <option value="active">Active (Access Granted)</option>
                    <option value="inactive">Inactive (Suspended)</option>
                    <option value="pending">Pending Approval</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Change Password (Optional)</label>
                  <input 
                    type="password" 
                    className="form-control" 
                    placeholder="Leave blank to keep existing password" 
                    value={editFacPassword} 
                    onChange={e => setEditFacPassword(e.target.value)} 
                  />
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Only enter a new password if you wish to overwrite the current login credentials.
                  </span>
                </div>
              </div>
              <div className="modal-footer" style={{ flexShrink: 0 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditFacultyModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={editFacSaving}>
                  {editFacSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Faculty Password Modal */}
      {showResetPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowResetPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <form onSubmit={handleExecuteResetPassword}>
              <div className="modal-header">
                <h3 className="modal-title">Reset Faculty Password</h3>
                <button type="button" className="modal-close" onClick={() => setShowResetPasswordModal(false)}>&times;</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: 'var(--hover)', padding: '12px 16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Target Account</div>
                  <div style={{ fontWeight: 600, fontSize: '15px' }}>{resetTargetUser?.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{resetTargetUser?.email}</div>
                </div>

                {!resetResultInfo ? (
                  <>
                    <div className="form-group">
                      <label className="form-label">Set Custom Password (Optional)</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="e.g. faculty123 (Leave blank for default)" 
                        value={customResetPassword} 
                        onChange={e => setCustomResetPassword(e.target.value)} 
                      />
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <button 
                          type="button" 
                          className="btn btn-secondary btn-sm"
                          onClick={() => setCustomResetPassword('faculty123')}
                        >
                          Use "faculty123"
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-secondary btn-sm"
                          onClick={() => setCustomResetPassword(Math.random().toString(36).slice(-8) + 'A1!')}
                        >
                          Generate Random
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      Resetting the password takes effect immediately in the database. The user will be able to log in with this new password indefinitely until modified.
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 600, color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle size={18} /> Password Updated Successfully
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>New Authoritative Password:</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <code style={{ fontSize: '16px', fontWeight: 700, padding: '6px 12px', background: 'var(--surface, #1e293b)', borderRadius: '6px', color: 'var(--primary, #38bdf8)', flex: 1 }}>
                          {resetResultInfo.password}
                        </code>
                        <button 
                          type="button" 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleCopyPassword(resetResultInfo.password)}
                          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          {copiedPassword ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                          {copiedPassword ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {resetResultInfo.emailSent 
                        ? '✅ Email notification sent to faculty member.' 
                        : '⚠️ Email could not be delivered. Please share the password directly with the faculty member.'}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                {!resetResultInfo ? (
                  <>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowResetPasswordModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={isResettingPassword}>
                      {isResettingPassword ? 'Resetting...' : 'Reset & Save Password'}
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn btn-primary" onClick={() => setShowResetPasswordModal(false)}>Done</button>
                )}
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
                  <input type="text" required className="form-control" placeholder="Skill Cetamol Engineering College" value={collegeNameInput} onChange={e => setCollegeNameInput(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">College Code</label>
                  <input type="text" required className="form-control" placeholder="SCEC" value={collegeCodeInput} onChange={e => setCollegeCodeInput(e.target.value)} />
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
                  <label className="form-label">Department Name</label>
                  <input type="text" required className="form-control" placeholder="Mechanical Engineering" value={deptName} onChange={e => setDeptName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Code Code</label>
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
                  <label className="form-label">Subject</label>
                  <select
                    required
                    className="form-control"
                    value={qSubjectId}
                    onChange={(e) => setQSubjectId(e.target.value)}
                  >
                    <option value="">Select Subject</option>
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
                    {qOptions.map((opt, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type={qType === 'mcq' ? 'radio' : 'checkbox'}
                          name="correctOption"
                          checked={String(idx) === qCorrectAnswer || (Array.isArray(qCorrectAnswer) && qCorrectAnswer.includes(String(idx)))}
                          onChange={() => setQCorrectAnswer(String(idx))}
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
                    ))}
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Select the radio/checkbox next to Option A, B, C, or D to mark it as the correct answer.
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
                        {selectedUser.semester && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Semester</span>
                            <span>{selectedUser.semester}</span>
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

      {/* View Extracted Questions Modal */}
      {showDocQuestionsModal && activeDocForPreview && (
        <div className="modal-overlay" onClick={() => setShowDocQuestionsModal(false)}>
          <div className="modal-content" style={{ maxWidth: '640px', width: '95%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Extracted Questions - {activeDocForPreview.name}</h3>
              <button type="button" className="modal-close" onClick={() => setShowDocQuestionsModal(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {selectedDocumentQuestions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                  Loading parsed questions...
                </div>
              ) : (
                selectedDocumentQuestions.map((q, idx) => (
                  <div key={q.id} style={{
                    padding: '14px',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-app)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--primary)' }}>Q{idx + 1} ({q.type.toUpperCase()})</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{q.marks || 1} mark(s)</span>
                    </div>
                    <p style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: 500 }}>{q.question}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {q.options?.map((opt: any, oIdx: number) => {
                        const isCorrect = opt.isCorrect;
                        return (
                          <div key={opt.id || oIdx} style={{
                            padding: '6px 10px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            backgroundColor: isCorrect ? 'var(--success-bg)' : 'transparent',
                            color: isCorrect ? 'var(--success)' : 'inherit',
                            border: `1px solid ${isCorrect ? 'var(--success)' : 'var(--border)'}`,
                            fontWeight: isCorrect ? 600 : 400
                          }}>
                            {String.fromCharCode(65 + oIdx)}. {opt.option} {isCorrect && '✓'}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={() => setShowDocQuestionsModal(false)}>Close Preview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
