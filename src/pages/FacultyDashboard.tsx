import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Database, FileText, Award, TrendingUp, Plus, 
  Search, Upload, Calendar, Clock, AlertCircle, FileSpreadsheet, Check, X,
  Users, CheckCircle, BookOpen, Download, ShieldAlert, CheckSquare
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import api from '../services/api';
import { cleanPhotoUrl } from '../utils/imageHelper';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { Question, Exam, ExamResult, Subject, QuestionType, Portion, Note, UploadedDocument } from '../types';
import { exportStudentResultsToExcel, exportStudentResultsToCSV } from '../utils/excelExport';
import { filterValidColleges } from '../data/academicPrograms';

const DEFAULT_DEPARTMENTS = [
  { id: 'cse-std', departmentName: 'Computer Science and Engineering', category: 'Engineering' },
  { id: 'it-std', departmentName: 'Information Technology', category: 'Engineering' },
  { id: 'ece-std', departmentName: 'Electronics and Communication Engineering', category: 'Engineering' },
  { id: 'eee-std', departmentName: 'Electrical and Electronics Engineering', category: 'Engineering' },
  { id: 'mech-std', departmentName: 'Mechanical Engineering', category: 'Engineering' },
  { id: 'civil-std', departmentName: 'Civil Engineering', category: 'Engineering' },
  { id: 'aids-std', departmentName: 'Artificial Intelligence and Data Science', category: 'Engineering' },
  { id: 'csbs-std', departmentName: 'Computer Science and Business Systems', category: 'Engineering' },
  { id: 'mba-std', departmentName: 'Master of Business Administration (MBA)', category: 'Arts & Science' },
  { id: 'mca-std', departmentName: 'Master of Computer Applications (MCA)', category: 'Arts & Science' },
  { id: 'bca-std', departmentName: 'Bachelor of Computer Applications (BCA)', category: 'Arts & Science' },
  { id: 'bsc-cs-std', departmentName: 'B.Sc Computer Science', category: 'Arts & Science' },
  { id: 'bcom-std', departmentName: 'Commerce (B.Com)', category: 'Arts & Science' }
];

export const FacultyDashboard: React.FC = () => {
  const { user, updateCurrentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get('tab') || 'overview';

  // Core database states
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);

  // Portions and Notes state
  const [portions, setPortions] = useState<Portion[]>([]);
  const [studentNotes, setStudentNotes] = useState<Note[]>([]);
  const [loadingPortions, setLoadingPortions] = useState<boolean>(false);
  const [loadingNotes, setLoadingNotes] = useState<boolean>(false);

  // Q-Papers uploading and parsing state
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [questionPapers, setQuestionPapers] = useState<string[]>([]);
  const [selectedPaperFilter, setSelectedPaperFilter] = useState<string>('');
  const [selectedDocumentQuestions, setSelectedDocumentQuestions] = useState<any[]>([]);
  const [showDocQuestionsModal, setShowDocQuestionsModal] = useState<boolean>(false);
  const [activeDocForPreview, setActiveDocForPreview] = useState<UploadedDocument | null>(null);
  const [loadingQPapers, setLoadingQPapers] = useState<boolean>(false);
  const [qPaperName, setQPaperName] = useState<string>('');
  const [qPaperSubjectId, setQPaperSubjectId] = useState<string>('');
  const [qPaperFile, setQPaperFile] = useState<File | null>(null);
  const [qAnswerFile, setQAnswerFile] = useState<File | null>(null);
  const [qPaperQuestionType, setQPaperQuestionType] = useState<'mcq' | 'checkbox' | 'auto'>('mcq');
  const [uploadingQPaper, setUploadingQPaper] = useState<boolean>(false);

  // Exam questions filtering inside wizard
  const [examQuestionSourceFilter, setExamQuestionSourceFilter] = useState<'all' | 'bank' | 'document'>('all');
  const [examQuestionDocFilter, setExamQuestionDocFilter] = useState<string>('');
  const [examQuestionSubjectFilter, setExamQuestionSubjectFilter] = useState<string>('');

  // AI Question Generator state
  const [showAIModal, setShowAIModal] = useState<boolean>(false);
  const [aiTopic, setAiTopic] = useState<string>('');
  const [aiSubjectId, setAiSubjectId] = useState<string>('');
  const [aiCount, setAiCount] = useState<number>(3);
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [generatingAI, setGeneratingAI] = useState<boolean>(false);

  // Portion Modal and Form State
  const [showPortionModal, setShowPortionModal] = useState<boolean>(false);
  const [editingPortion, setEditingPortion] = useState<Portion | null>(null);
  const [portionTitle, setPortionTitle] = useState<string>('');
  const [portionDesc, setPortionDesc] = useState<string>('');
  const [portionSubjectId, setPortionSubjectId] = useState<string>('');
  const [savingPortion, setSavingPortion] = useState<boolean>(false);

  // File Upload states
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadSummary, setUploadSummary] = useState<any | null>(null);
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);

  // Pending students approval
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [approvingIds, setApprovingIds] = useState<string[]>([]);

  // Locked Exams Proctoring State
  const [lockedExams, setLockedExams] = useState<any[]>([]);
  const [lockedLoading, setLockedLoading] = useState<boolean>(false);

  // Profile photo upload states
  const [profilePhotoUploading, setProfilePhotoUploading] = useState<boolean>(false);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>(user?.photoUrl || '');
  const [facultyName, setFacultyName] = useState<string>(user?.name || '');
  const [facultyPassword, setFacultyPassword] = useState<string>('');
  const [profileSaving, setProfileSaving] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      setFacultyName(user.name);
    }
  }, [user]);

  // ── Upcoming Exams state ──────────────────────────────────────
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState<boolean>(false);

  // ── Pending Grading state ─────────────────────────────────────
  const [gradingTasks, setGradingTasks] = useState<any[]>([]);
  const [gradingLoading, setGradingLoading] = useState<boolean>(false);
  const [gradingTask, setGradingTask] = useState<any | null>(null); // active grading modal
  const [marksMap, setMarksMap] = useState<Record<string, number>>({}); // answerId -> marks
  const [submittingGrade, setSubmittingGrade] = useState<boolean>(false);

  // ── Question Stats state ──────────────────────────────────────
  const [qStats, setQStats] = useState<any[]>([]);
  const [qStatsLoading, setQStatsLoading] = useState<boolean>(false);
  const [statsSubjectFilter, setStatsSubjectFilter] = useState<string>('all');

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [diffFilter, setDiffFilter] = useState<string>('all');
  const [subFilter, setSubFilter] = useState<string>('all');
  const [questionPage, setQuestionPage] = useState<number>(1);
  const [examQuestionSearch, setExamQuestionSearch] = useState<string>('');


  // Results search and filter states
  const [resultsSearch, setResultsSearch] = useState<string>('');
  const [resultsExamFilter, setResultsExamFilter] = useState<string>('all');
  const [resultsStatusFilter, setResultsStatusFilter] = useState<string>('all');

  // Modals & form state
  const [showQuestionModal, setShowQuestionModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showExamModal, setShowExamModal] = useState<boolean>(false);

  // New Question form
  const [qText, setQText] = useState<string>('');
  const [qType, setQType] = useState<QuestionType>('mcq');
  const [qSubjectId, setQSubjectId] = useState<string>('');
  const [qDifficulty, setQDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [qPoints, setQPoints] = useState<number>(5);
  const [qOptions, setQOptions] = useState<string[]>(['', '', '', '']);
  const [qCorrectAnswer, setQCorrectAnswer] = useState<string>('0');
  const [qCorrectCheckboxAnswers, setQCorrectCheckboxAnswers] = useState<string[]>([]);
  const [qCorrectTextAnswer, setQCorrectTextAnswer] = useState<string>('');

  // New Exam Wizard form
  const [examTitle, setExamTitle] = useState<string>('');
  const [examDesc, setExamDesc] = useState<string>('');
  const [examSubId, setExamSubId] = useState<string>('');
  const [examDuration, setExamDuration] = useState<number>(30);
  const [examStart, setExamStart] = useState<string>('');
  const [examEnd, setExamEnd] = useState<string>('');
  const [examQuestionCount, setExamQuestionCount] = useState<number>(10);
  const [examNegativeMarking, setExamNegativeMarking] = useState<boolean>(false);
  const [examMarksPerQuestion, setExamMarksPerQuestion] = useState<number>(1);
  const [examNegativeMarks, setExamNegativeMarks] = useState<number>(0.25);
  const [examQuestionsSelected, setExamQuestionsSelected] = useState<string[]>([]);
  const [examCategory, setExamCategory] = useState<'Engineering' | 'Arts & Science' | ''>('');
  const [examDeptId, setExamDeptId] = useState<string>('');
  const [examTargetMode, setExamTargetMode] = useState<'all' | 'specific'>('all');
  const [selectedExamDeptIds, setSelectedExamDeptIds] = useState<string[]>([]);
  const [modalDeptCategoryFilter, setModalDeptCategoryFilter] = useState<'all' | 'Engineering' | 'Arts & Science'>('all');
  const [modalDeptSearch, setModalDeptSearch] = useState<string>('');
  const [examTargetYears, setExamTargetYears] = useState<string[]>(['all']);

  // Edit Exam form states
  const [showEditExamModal, setShowEditExamModal] = useState<boolean>(false);
  const [editingExam, setEditingExam] = useState<any | null>(null);
  const [editExamTitle, setEditExamTitle] = useState<string>('');
  const [editExamDesc, setEditExamDesc] = useState<string>('');
  const [editExamStart, setEditExamStart] = useState<string>('');
  const [editExamEnd, setEditExamEnd] = useState<string>('');
  const [editExamDuration, setEditExamDuration] = useState<number>(30);
  const [editExamQuestionCount, setEditExamQuestionCount] = useState<number>(10);
  const [editExamTargetYears, setEditExamTargetYears] = useState<string[]>(['all']);
  const [updatingExam, setUpdatingExam] = useState<boolean>(false);


  // Departments and Courses States
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [collegesList, setCollegesList] = useState<any[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>(user?.collegeId || '');

  // Academics View Filtering States
  const [deptSearchTerm, setDeptSearchTerm] = useState<string>('');
  const [deptCategoryFilter, setDeptCategoryFilter] = useState<'all' | 'Engineering' | 'Arts & Science'>('all');
  const [subjectSearchTerm, setSubjectSearchTerm] = useState<string>('');

  // Add Subject Modal States
  const [showAddSubjectModal, setShowAddSubjectModal] = useState<boolean>(false);
  const [newSubName, setNewSubName] = useState<string>('');
  const [newSubCourse, setNewSubCourse] = useState<string>('');
  const [newSubSemester, setNewSubSemester] = useState<number>(4);
  const [addingSubject, setAddingSubject] = useState<boolean>(false);

  // Fetch data
  const fetchData = async () => {
    try {
      const subRes = await api.get('/admin/subjects');
      const cleanSubjects = (subRes.data || [])
        .filter((s: any) => {
          const name = s.name || s.subjectName || '';
          return !name.toLowerCase().startsWith('core fundamentals');
        })
        .filter((s: any, idx: number, arr: any[]) =>
          arr.findIndex((item: any) => (item.name || item.subjectName) === (s.name || s.subjectName)) === idx
        );
      setSubjects(cleanSubjects);

      const questRes = await api.get('/faculty/questions');
      setQuestions(questRes.data);

      const examRes = await api.get('/faculty/exams');
      const loadedExams = examRes.data || [];
      setExams(loadedExams);

      const resultsRes = await api.get('/faculty/results');
      const sanitizedResults = (resultsRes.data || []).map((r: any) => {
        const isZero = (typeof r.correctCount === 'number' && r.correctCount === 0 && (r.totalPoints || 100) > 0);
        const score = isZero ? 0 : (r.score ?? 0);
        const totalPoints = r.totalPoints && r.totalPoints > 0 ? r.totalPoints : 100;
        const percentage = isZero ? 0 : (r.percentage ?? 0);
        const status = (score > 0 && percentage >= 40) ? 'pass' : 'fail';
        return { ...r, score, totalPoints, percentage, status };
      });
      setResults(sanitizedResults);

      // Pending students approval
      const pendingRes = await api.get('/faculty/pending-students');
      setPendingStudents(pendingRes.data);

      // Fetch colleges
      try {
        const colRes = await api.get('/admin/colleges');
        setCollegesList(filterValidColleges(colRes.data || []));
      } catch (colErr) {
        console.error('Failed to fetch colleges:', colErr);
      }

      // Fetch departments, courses, and question papers
      const activeColId = user?.collegeId || selectedCollegeId;
      const deptRes = await api.get(activeColId ? `/faculty/departments?collegeId=${activeColId}` : '/faculty/departments');
      setDepartments(deptRes.data || []);

      const courseRes = await api.get('/admin/courses');
      setCourses(courseRes.data);

      try {
        const papersRes = await api.get('/faculty/question-papers');
        setQuestionPapers(papersRes.data || []);
      } catch (paperErr) {
        console.error('Failed to fetch question papers:', paperErr);
      }

      try {
        const lockedRes = await api.get('/faculty/locked-exams');
        setLockedExams(lockedRes.data || []);
      } catch (lockErr) {
        console.error('Failed to fetch locked exams:', lockErr);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName) {
      showToast('Please fill out subject name.', 'warning');
      return;
    }
    setAddingSubject(true);
    try {
      const res = await api.post('/admin/subjects', {
        name: newSubName
      });
      showToast('Subject created successfully!', 'success');
      await fetchData();
      setExamSubId(res.data.id);
      setShowAddSubjectModal(false);
      setNewSubName('');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create subject.', 'error');
    } finally {
      setAddingSubject(false);
    }
  };

  // Fetch upcoming exams when that tab is active
  const fetchUpcomingExams = async () => {
    setUpcomingLoading(true);
    try {
      const res = await api.get('/faculty/upcoming-exams');
      setUpcomingExams(res.data);
    } catch { /* empty state shown */ }
    finally { setUpcomingLoading(false); }
  };

  // Fetch pending grading tasks
  const fetchGradingTasks = async () => {
    setGradingLoading(true);
    try {
      const res = await api.get('/faculty/pending-grading');
      setGradingTasks(res.data);
    } catch { /* empty state shown */ }
    finally { setGradingLoading(false); }
  };

  // Fetch question stats
  const fetchQStats = async () => {
    setQStatsLoading(true);
    try {
      const res = await api.get('/faculty/question-stats');
      setQStats(res.data);
    } catch { /* empty state shown */ }
    finally { setQStatsLoading(false); }
  };

  const fetchPortions = async () => {
    setLoadingPortions(true);
    try {
      const res = await api.get('/faculty/portions');
      setPortions(res.data);
    } catch (err) {
      console.error('Failed to fetch portions:', err);
    } finally {
      setLoadingPortions(false);
    }
  };

  const fetchStudentNotes = async () => {
    setLoadingNotes(true);
    try {
      const res = await api.get('/faculty/student-notes');
      setStudentNotes(res.data);
    } catch (err) {
      console.error('Failed to fetch student notes:', err);
    } finally {
      setLoadingNotes(false);
    }
  };

  const fetchUploadedQPapers = async () => {
    setLoadingQPapers(true);
    try {
      const res = await api.get('/faculty/uploaded-qpapers');
      setUploadedDocuments(res.data);
    } catch (err) {
      console.error('Failed to fetch uploaded documents:', err);
    } finally {
      setLoadingQPapers(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
      if (activeTab === 'upcoming') fetchUpcomingExams();
      if (activeTab === 'grading')  fetchGradingTasks();
      if (activeTab === 'qstats')   fetchQStats();
      if (activeTab === 'portions') fetchPortions();
      if (activeTab === 'student-notes') fetchStudentNotes();
      if (activeTab === 'qpapers') fetchUploadedQPapers();
      if (activeTab === 'proctoring') fetchLockedExams();
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (showExamModal) {
      const activeColId = user?.collegeId || selectedCollegeId;
      api.get(`/faculty/departments${activeColId ? `?collegeId=${activeColId}` : ''}`)
        .then(res => {
          if (res.data && res.data.length > 0) {
            setDepartments(res.data);
          }
        })
        .catch(err => console.error('Failed to load departments for modal:', err));
    }
  }, [showExamModal, user?.collegeId, selectedCollegeId]);

  // Grade submission handler
  const handleGradeSubmit = async () => {
    if (!gradingTask) return;
    setSubmittingGrade(true);
    try {
      for (const ans of gradingTask.answers) {
        const marks = marksMap[ans.answerId] ?? 0;
        await api.post('/faculty/grade-answer', {
          studentExamId: gradingTask.studentExamId,
          answerId: ans.answerId,
          marksAwarded: marks
        });
      }
      showToast('Answers graded and result published!', 'success');
      setGradingTask(null);
      setMarksMap({});
      await fetchGradingTasks();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to submit grades.', 'error');
    } finally {
      setSubmittingGrade(false);
    }
  };

  // Actions
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
      const response = await api.post(`/upload/questions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadSummary(response.data);
      showToast('Questions file processed and imported.', 'success');
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
    link.download = `error_report_questions_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
      showToast('Profile photo updated successfully!', 'success');
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
        name: facultyName,
        password: facultyPassword || undefined
      });
      updateCurrentUser(res.data.user);
      setFacultyPassword('');
      showToast('Profile details updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update profile details.', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSavePortionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portionTitle || !portionDesc || !portionSubjectId) {
      showToast('All fields are required.', 'warning');
      return;
    }
    setSavingPortion(true);
    try {
      if (editingPortion) {
        const res = await api.put(`/faculty/portions/${editingPortion.id}`, {
          title: portionTitle,
          description: portionDesc,
          subjectId: portionSubjectId
        });
        setPortions(prev => prev.map(p => p.id === editingPortion.id ? res.data : p));
        showToast('Syllabus portion updated successfully!', 'success');
      } else {
        const res = await api.post('/faculty/portions', {
          title: portionTitle,
          description: portionDesc,
          subjectId: portionSubjectId
        });
        setPortions(prev => [res.data, ...prev]);
        showToast('Syllabus portion created successfully!', 'success');
      }
      setShowPortionModal(false);
      setEditingPortion(null);
      setPortionTitle('');
      setPortionDesc('');
      setPortionSubjectId('');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save portion.', 'error');
    } finally {
      setSavingPortion(false);
    }
  };

  const handleEditPortionClick = (p: Portion) => {
    setEditingPortion(p);
    setPortionTitle(p.title);
    setPortionDesc(p.description);
    setPortionSubjectId(p.subjectId);
    setShowPortionModal(true);
  };

  const handleDeletePortion = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this portion?')) return;
    try {
      await api.delete(`/faculty/portions/${id}`);
      setPortions(prev => prev.filter(p => p.id !== id));
      showToast('Syllabus portion deleted successfully.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete portion.', 'error');
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

      const res = await api.post('/faculty/upload-qpaper', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast(res.data.message || 'Q-Paper uploaded and questions extracted!', 'success');
      
      setQPaperName('');
      setQPaperSubjectId('');
      setQPaperQuestionType('mcq');
      setQPaperFile(null);
      setQAnswerFile(null);
      const fileInput = document.getElementById('qpaper-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      const ansFileInput = document.getElementById('qpaper-ans-file-input') as HTMLInputElement;
      if (ansFileInput) ansFileInput.value = '';

      await fetchUploadedQPapers();
      await fetchData(); // refresh questions bank list
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to upload and extract questions.', 'error');
    } finally {
      setUploadingQPaper(false);
    }
  };

  const handleDeleteQPaper = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this document? This will also remove all questions extracted from it.')) return;
    try {
      await api.delete(`/faculty/uploaded-qpapers/${id}`);
      setUploadedDocuments(prev => prev.filter(d => d.id !== id));
      showToast('Document and its questions deleted successfully.', 'success');
      await fetchData(); // refresh question bank list
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete document.', 'error');
    }
  };

  const handleViewDocQuestionsClick = async (doc: UploadedDocument) => {
    setActiveDocForPreview(doc);
    setSelectedDocumentQuestions([]);
    setShowDocQuestionsModal(true);
    try {
      const res = await api.get(`/faculty/uploaded-qpapers/${doc.id}/questions`);
      setSelectedDocumentQuestions(res.data);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load document questions.', 'error');
    }
  };

  const handleGenerateAIQuestionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiSubjectId || !aiTopic) {
      showToast('Subject and Topic are required.', 'warning');
      return;
    }
    setGeneratingAI(true);
    try {
      const res = await api.post('/faculty/questions/generate-ai', {
        subjectId: aiSubjectId,
        topic: aiTopic,
        count: aiCount,
        difficulty: aiDifficulty
      });
      showToast(res.data.message || 'AI Questions generated successfully!', 'success');
      setShowAIModal(false);
      setAiTopic('');
      setAiSubjectId('');
      await fetchData(); // refresh list
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to generate AI questions.', 'error');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Structure answer
    let correctAnswer: string | string[] = qCorrectAnswer;
    if (qType === 'checkbox') {
      correctAnswer = qCorrectCheckboxAnswers;
    } else if (qType === 'text') {
      correctAnswer = qCorrectTextAnswer;
    }

    try {
      await api.post('/faculty/questions', {
        subjectId: qSubjectId,
        text: qText,
        type: qType,
        options: qType === 'text' ? [] : qOptions.filter(o => o !== ''),
        correctAnswer,
        points: qPoints,
        difficulty: qDifficulty
      });
      showToast('Question successfully added to bank.', 'success');
      setShowQuestionModal(false);
      
      // Reset Form
      setQText('');
      setQSubjectId('');
      setQPoints(5);
      setQOptions(['', '', '', '']);
      setQCorrectAnswer('0');
      setQCorrectCheckboxAnswers([]);
      setQCorrectTextAnswer('');
      fetchData();
    } catch (err) {
      showToast('Error creating question.', 'error');
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    let candidatePool = questions;
    if (examQuestionsSelected.length > 0) {
      candidatePool = questions.filter(q => examQuestionsSelected.includes(q.id));
    }

    if (candidatePool.length === 0) {
      showToast('No questions available in the system pool to schedule exam.', 'warning');
      return;
    }

    let startIso = new Date().toISOString();
    try {
      if (examStart) {
        const d = new Date(examStart);
        if (!isNaN(d.getTime())) startIso = d.toISOString();
      }
    } catch (e) {}

    let endIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    try {
      if (examEnd) {
        const d = new Date(examEnd);
        if (!isNaN(d.getTime())) endIso = d.toISOString();
      }
    } catch (e) {}

    const targetQuestionCount = (examQuestionCount && examQuestionCount > 0)
      ? Math.min(examQuestionCount, candidatePool.length)
      : candidatePool.length;

    const safeDuration = Math.max(5, Number(examDuration) || 30);

    if (examTargetMode === 'specific' && selectedExamDeptIds.length === 0) {
      showToast('Please select at least one department, or choose "Entire College".', 'warning');
      return;
    }

    try {
      const targetCollegeId = user?.collegeId || selectedCollegeId || undefined;
      const isEntireCollege = examTargetMode === 'all';
      const payloadCategory = isEntireCollege ? 'All' : (examCategory || 'Engineering');
      const payloadDeptId = isEntireCollege ? 'all' : (selectedExamDeptIds[0] || examDeptId || 'all');
      const payloadDeptIds = isEntireCollege ? [] : selectedExamDeptIds;

      await api.post('/faculty/exams', {
        title: examTitle,
        description: examDesc,
        subjectId: examSubId || '',
        collegeId: targetCollegeId,
        category: payloadCategory,
        departmentId: payloadDeptId,
        departmentIds: payloadDeptIds,
        duration: safeDuration,
        startTime: startIso,
        endTime: endIso,
        questions: candidatePool.map(q => q.id),
        questionCount: targetQuestionCount,
        targetYears: examTargetYears,
        targetYear: examTargetYears.includes('all') ? null : parseInt(examTargetYears[0]),
        negativeMarking: examNegativeMarking,
        marksPerQuestion: examMarksPerQuestion,
        negativeMarks: examNegativeMarking ? examNegativeMarks : 0,
        createdBy: user?.id,
        status: 'scheduled'
      });

      showToast('Exam scheduled successfully.', 'success');
      setShowExamModal(false);
      // Reset Form
      setExamTitle('');
      setExamDesc('');
      setExamSubId('');
      setExamCategory('');
      setExamDeptId('');
      setExamTargetMode('all');
      setSelectedExamDeptIds([]);
      setModalDeptSearch('');
      setExamDuration(30);
      setExamStart('');
      setExamEnd('');
      setExamQuestionCount(10);
      setExamTargetYears(['all']);
      setExamNegativeMarking(false);
      setExamMarksPerQuestion(1);
      setExamNegativeMarks(0.25);
      setExamQuestionsSelected([]);
      fetchData();
    } catch (err: any) {
      console.error('Error scheduling exam:', err);
      showToast(err?.response?.data?.message || 'Error scheduling exam.', 'error');
    }
  };

  const formatDatetimeLocal = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleEditExamClick = (exam: any) => {
    setEditingExam(exam);
    setEditExamTitle(exam.title || '');
    setEditExamDesc(exam.description || '');
    setEditExamStart(formatDatetimeLocal(exam.startTime));
    setEditExamEnd(formatDatetimeLocal(exam.endTime));
    setEditExamDuration(exam.duration || 30);
    setEditExamQuestionCount(exam.questionCount || (exam.questions ? exam.questions.length : 10));
    const targetYears = exam.targetYears || (exam.targetYear ? [String(exam.targetYear)] : ['all']);
    setEditExamTargetYears(targetYears);
    setShowEditExamModal(true);
  };

  const handleUpdateExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExam) return;
    setUpdatingExam(true);

    const startIso = editExamStart ? new Date(editExamStart).toISOString() : new Date().toISOString();
    const endIso = editExamEnd ? new Date(editExamEnd).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    try {
      await api.put(`/faculty/exams/${editingExam.id}`, {
        title: editExamTitle,
        description: editExamDesc,
        startTime: startIso,
        endTime: endIso,
        duration: editExamDuration,
        questionCount: editExamQuestionCount,
        targetYears: editExamTargetYears,
        targetYear: editExamTargetYears.includes('all') ? null : parseInt(editExamTargetYears[0])
      });
      showToast('Exam updated successfully.', 'success');
      setShowEditExamModal(false);
      fetchData();
    } catch (err: any) {
      console.error('Error updating exam:', err);
      showToast(err.response?.data?.message || 'Error updating exam.', 'error');
    } finally {
      setUpdatingExam(false);
    }
  };


  const handleDeleteExam = async (examId: string) => {
    if (!window.confirm('Are you sure you want to delete this exam? This action is permanent and will delete all student records and configurations linked to this exam.')) {
      return;
    }
    try {
      await api.delete(`/faculty/exams/${examId}`);
      showToast('Exam deleted successfully.', 'success');
      fetchData();
    } catch (err: any) {
      console.error('Error deleting exam:', err);
      showToast(err.response?.data?.message || 'Failed to delete exam.', 'error');
    }
  };

  const handleApproveStudent = async (id: string) => {
    setApprovingIds(prev => [...prev, id]);
    try {
      await api.post(`/faculty/students/${id}/approve`);
      showToast('Student profile has been approved and activated.', 'success');
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error approving student.', 'error');
    } finally {
      setApprovingIds(prev => prev.filter(x => x !== id));
    }
  };

  // Locked Exams Proctoring Handlers
  const fetchLockedExams = async () => {
    setLockedLoading(true);
    try {
      const res = await api.get('/faculty/locked-exams');
      setLockedExams(res.data || []);
    } catch (err) {
      console.error('Failed to load locked exams for faculty:', err);
    } finally {
      setLockedLoading(false);
    }
  };

  const handleUnlockExam = async (id: string) => {
    try {
      await api.put(`/faculty/unlock-exam/${id}`);
      showToast('Re-entry authorized! Student can now resume their examination.', 'success');
      await fetchLockedExams();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error unlocking exam.', 'error');
    }
  };

  const handleRevokeExam = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke exam access for this student?')) return;
    try {
      await api.put(`/faculty/revoke-exam/${id}`);
      showToast('Student exam access revoked.', 'info');
      await fetchLockedExams();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error revoking exam access.', 'error');
    }
  };

  // Mock CSV Import Handler
  const handleSimulateCSVImport = async () => {
    if (!qSubjectId) {
      showToast('Please select a Subject first for the imported questions.', 'warning');
      return;
    }

    const mockImportedQuestions = [
      {
        subjectId: qSubjectId,
        text: 'Which database isolation level prevents dirty reads but allows non-repeatable reads?',
        type: 'mcq',
        options: ['Read Uncommitted', 'Read Committed', 'Repeatable Read', 'Serializable'],
        correctAnswer: '1',
        points: 5,
        difficulty: 'hard'
      },
      {
        subjectId: qSubjectId,
        text: 'What is the purpose of the virtual keyword in C++?',
        type: 'mcq',
        options: ['To define template classes', 'To enable runtime polymorphism (dynamic binding)', 'To speed up execution runtime', 'To allocate memory on heap'],
        correctAnswer: '1',
        points: 5,
        difficulty: 'medium'
      },
      {
        subjectId: qSubjectId,
        text: 'Which protocols run on top of TCP? (Select all that apply)',
        type: 'checkbox',
        options: ['HTTP', 'SMTP', 'DNS', 'DHCP'],
        correctAnswer: ['0', '1', '2'],
        points: 10,
        difficulty: 'hard'
      }
    ];

    try {
      await api.post('/faculty/questions/import', { questions: mockImportedQuestions });
      showToast('3 Questions imported successfully from CSV.', 'success');
      setShowImportModal(false);
      fetchData();
    } catch (err) {
      showToast('Error importing questions.', 'error');
    }
  };

  // Filters calculation
  const filteredQuestions = questions.filter(q => {
    const matchSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDiff = diffFilter === 'all' || q.difficulty === diffFilter;
    const matchSub = subFilter === 'all' || q.subjectId === subFilter;
    return matchSearch && matchDiff && matchSub;
  });

  const questionsPerPage = 50;
  const totalQuestionPages = Math.ceil(filteredQuestions.length / questionsPerPage) || 1;
  const paginatedQuestions = filteredQuestions.slice(
    (questionPage - 1) * questionsPerPage,
    questionPage * questionsPerPage
  );


  // Results calculation & filtering
  const filteredResults = results.filter(r => {
    const q = resultsSearch.trim().toLowerCase();
    const dept = (r.departmentName || r.studentDepartment || '').toLowerCase();
    const matchesSearch = !q ||
      (r.studentRollNo && r.studentRollNo.toLowerCase().includes(q)) ||
      (r.studentName && r.studentName.toLowerCase().includes(q)) ||
      (dept && dept.includes(q)) ||
      (r.examTitle && r.examTitle.toLowerCase().includes(q)) ||
      (r.subjectName && r.subjectName.toLowerCase().includes(q));
    const matchesExam = resultsExamFilter === 'all' || r.examId === resultsExamFilter;
    const matchesStatus = resultsStatusFilter === 'all' || r.status?.toLowerCase() === resultsStatusFilter.toLowerCase();
    return matchesSearch && matchesExam && matchesStatus;
  });

  const handleDownloadResultsExcel = () => {
    if (filteredResults.length === 0) {
      showToast('No student result records found to export.', 'warning');
      return;
    }
    const selectedExam = exams.find(e => e.id === resultsExamFilter);
    const success = exportStudentResultsToExcel(filteredResults, {
      examTitle: selectedExam ? selectedExam.title : undefined,
      subjectName: selectedExam ? selectedExam.subjectName : undefined
    });
    if (success) {
      showToast(`Exported ${filteredResults.length} student result(s) to Excel successfully.`, 'success');
    }
  };

  const handleDownloadResultsCSV = () => {
    if (filteredResults.length === 0) {
      showToast('No student result records found to export.', 'warning');
      return;
    }
    const selectedExam = exams.find(e => e.id === resultsExamFilter);
    const success = exportStudentResultsToCSV(filteredResults, {
      examTitle: selectedExam ? selectedExam.title : undefined,
      subjectName: selectedExam ? selectedExam.subjectName : undefined
    });
    if (success) {
      showToast(`Exported ${filteredResults.length} student result(s) to CSV successfully.`, 'success');
    }
  };

  const handleDownloadExamExcel = (exam: Exam) => {
    const examResults = results.filter(r => r.examId === exam.id);
    if (examResults.length === 0) {
      showToast(`No student submissions recorded for "${exam.title}" yet.`, 'info');
      return;
    }
    const success = exportStudentResultsToExcel(examResults, {
      examTitle: exam.title,
      subjectName: exam.subjectName
    });
    if (success) {
      showToast(`Exported ${examResults.length} student result(s) for "${exam.title}" to Excel.`, 'success');
    }
  };

  // Chart aggregation
  const examPerformanceData = exams.map(exam => {
    const examResults = results.filter(r => r.examId === exam.id);
    const avgScore = examResults.length 
      ? Math.round(examResults.reduce((acc, curr) => acc + curr.percentage, 0) / examResults.length) 
      : 0;
    return { name: exam.title.substring(0, 15) + '...', 'Average %': avgScore };
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyItems: 'center', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 700 }}>Faculty Portal</h1>
          <p style={{ color: 'var(--text-muted)' }}>Create questions, configure examination patterns, schedule timers, and check results.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => fetchData()}>
            Refresh Dashboard
          </button>
        </div>
      </div>

      {/* ==========================================
          OVERVIEW SUB-VIEW
          ========================================== */}
      {activeTab === 'overview' && (
        <>
          <div className="dashboard-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ color: 'var(--primary)', backgroundColor: 'var(--selected)' }}>
                <Database size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Assigned Subjects</span>
                <span className="stat-value">{subjects.length}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ color: '#16a34a', backgroundColor: '#dcfce7' }}>
                <FileText size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Exams Administered</span>
                <span className="stat-value">{exams.length}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ color: '#9333ea', backgroundColor: '#f3e8ff' }}>
                <Clock size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Active Proctor Sessions</span>
                <span className="stat-value">{exams.filter(e => e.status === 'active').length}</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <span className="stat-label">Total Submissions Checked</span>
                <span className="stat-value">{results.length}</span>
              </div>
            </div>

            <div 
              className="stat-card" 
              style={{ cursor: 'pointer', border: lockedExams.length > 0 ? '1px solid #ef4444' : undefined }}
              onClick={() => navigate('/faculty/dashboard?tab=proctoring')}
            >
              <div className="stat-icon" style={{ color: '#ef4444', backgroundColor: '#fee2e2' }}>
                <ShieldAlert size={22} />
              </div>
              <div className="stat-info">
                <span className="stat-label">Locked Students</span>
                <span className="stat-value" style={{ color: lockedExams.length > 0 ? '#ef4444' : undefined }}>
                  {lockedExams.length}
                </span>
              </div>
            </div>
          </div>

          {lockedExams.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '14px 18px',
              marginBottom: '24px',
              gap: '16px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ShieldAlert size={24} color="#dc2626" />
                <div>
                  <h4 style={{ margin: 0, color: '#991b1b', fontSize: '15px', fontWeight: 600 }}>
                    {lockedExams.length} Student{lockedExams.length > 1 ? 's' : ''} Locked Out (Tab Switch Malpractice)
                  </h4>
                  <p style={{ margin: '2px 0 0', color: '#b91c1c', fontSize: '13px' }}>
                    Students were automatically locked out after exceeding 3 tab switches during their examination. You can review and allow re-entry.
                  </p>
                </div>
              </div>
              <button 
                className="btn btn-sm btn-danger"
                style={{ whiteSpace: 'nowrap' }}
                onClick={() => navigate('/faculty/dashboard?tab=proctoring')}
              >
                Review & Unlock
              </button>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
            <div className="card">
              <h3 className="card-title">Average Class Performance (%)</h3>
              <div style={{ height: '300px' }}>
                {examPerformanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={examPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="Average %" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    No exam results recorded to display chart.
                  </div>
                )}
              </div>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 className="card-title">Assigned Subjects</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {subjects.map(s => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>{s.name}</span>
                        <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)' }}>Code: {s.code}</span>
                      </div>
                      <span className="badge badge-info" style={{ fontSize: '10px' }}>Assigned</span>
                    </div>
                  ))}
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '16px' }} onClick={() => navigate('/faculty/dashboard?tab=questions')}>
                Access Subject Bank
              </button>
            </div>
          </div>
        </>
      )}



      {/* ==========================================
          QUESTION BANK SUB-VIEW
          ========================================== */}
      {activeTab === 'questions' && (
        <div className="card">
          <div className="table-header-controls">
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Your Question Bank</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAIModal(true)} style={{ backgroundColor: 'var(--primary-bg)', color: 'var(--primary)', border: '1px solid var(--primary)' }}>
                AI Generator
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowImportModal(true)}>
                <Upload size={14} /> Import CSV
              </button>
              <button className="btn btn-primary btn-sm" onClick={() => setShowQuestionModal(true)}>
                <Plus size={14} /> Add Question
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', padding: '16px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={`Search ${questions.length > 0 ? questions.length.toLocaleString() + '+' : '2,900+'} question bank...`}
                className="form-control"
                style={{ paddingLeft: '36px' }}
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setQuestionPage(1);
                }}
              />
            </div>
            
            <select
              className="form-control"
              style={{ width: '160px' }}
              value={diffFilter}
              onChange={e => {
                setDiffFilter(e.target.value);
                setQuestionPage(1);
              }}
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <select
              className="form-control"
              style={{ width: '270px' }}
              value={subFilter}
              onChange={e => {
                setSubFilter(e.target.value);
                setQuestionPage(1);
              }}
            >
              <option value="all">All Subjects ({questions.length} questions)</option>
              {subjects.map(s => {
                const sName = s.name || (s as any).subjectName;
                const count = questions.filter(q => q.subjectId === s.id).length;
                return (
                  <option key={s.id} value={s.id}>{sName} ({count})</option>
                );
              })}
            </select>

            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {filteredQuestions.length > 0 ? (
                `Showing ${(questionPage - 1) * questionsPerPage + 1}–${Math.min(questionPage * questionsPerPage, filteredQuestions.length)} of ${filteredQuestions.length} items`
              ) : '0 items'}
            </span>
          </div>

          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>#</th>
                  <th>Question Content</th>
                  <th>Subject & Pool</th>
                  <th>Type</th>
                  <th>Difficulty</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {paginatedQuestions.map((q, qIdx) => {
                  const subObj = subjects.find(s => s.id === q.subjectId);
                  const cleanText = q.text ? q.text.replace(/^(?:q(?:uestion)?\s*\d+[\s.:)\-–—]+|\d+\s*[\.\)]\s+)/i, '').trim() : '';
                  const itemIndex = (questionPage - 1) * questionsPerPage + qIdx + 1;
                  const displaySubjectName = subObj?.name || (subObj as any)?.subjectName || (q as any).subjectName || 'General Pool';
                  return (
                    <tr key={q.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>{itemIndex}</td>
                      <td style={{ fontWeight: 500, maxWidth: '420px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cleanText}
                      </td>
                      <td>
                        <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: 600, display: 'block' }}>
                          {displaySubjectName}
                        </span>
                        {(q as any).paperName && (q as any).paperName !== displaySubjectName && (
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {(q as any).paperName}
                          </span>
                        )}
                      </td>
                      <td><span className="badge badge-info">{q.type}</span></td>
                      <td>
                        <span className={`badge ${q.difficulty === 'easy' ? 'badge-success' : q.difficulty === 'medium' ? 'badge-warning' : 'badge-danger'}`}>
                          {q.difficulty}
                        </span>
                      </td>
                      <td><strong>{q.points} pt</strong></td>
                    </tr>
                  );
                })}
                {filteredQuestions.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      No questions found matching the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalQuestionPages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--hover)',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Page <strong>{questionPage}</strong> of <strong>{totalQuestionPages}</strong>
              </div>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={questionPage <= 1}
                  onClick={() => setQuestionPage(1)}
                  style={{ padding: '4px 8px' }}
                >
                  &laquo; First
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={questionPage <= 1}
                  onClick={() => setQuestionPage(p => Math.max(1, p - 1))}
                  style={{ padding: '4px 10px' }}
                >
                  &lsaquo; Prev
                </button>
                <span style={{ fontSize: '13px', padding: '0 8px', fontWeight: 600 }}>
                  {questionPage}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={questionPage >= totalQuestionPages}
                  onClick={() => setQuestionPage(p => Math.min(totalQuestionPages, p + 1))}
                  style={{ padding: '4px 10px' }}
                >
                  Next &rsaquo;
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  disabled={questionPage >= totalQuestionPages}
                  onClick={() => setQuestionPage(totalQuestionPages)}
                  style={{ padding: '4px 8px' }}
                >
                  Last &raquo;
                </button>
              </div>
            </div>
          )}
        </div>

      )}

      {/* ==========================================
          MANAGE EXAMS SUB-VIEW
          ========================================== */}
      {activeTab === 'exams' && (
        <div className="card">
          <div className="table-header-controls">
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Scheduled Examinations</h3>
            <button className="btn btn-primary" onClick={() => setShowExamModal(true)}>
              <Plus size={16} /> Schedule New Exam
            </button>
          </div>

          <div className="table-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Exam Title</th>
                  <th>Subject</th>
                  <th>Target Year</th>
                  <th>Duration</th>
                  <th>Questions</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Status</th>
                  <th>Actions</th>
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
                        {(() => {
                          const ty = (e as any).targetYears || ((e as any).targetYear ? [String((e as any).targetYear)] : ['all']);
                          if (ty.includes('all')) {
                            return <span className="badge badge-info" style={{ fontSize: '11px' }}>All Years (1-4)</span>;
                          }
                          return (
                            <span className="badge badge-primary" style={{ fontSize: '11px', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }}>
                              {ty.map((y: string) => `Year ${y}`).join(', ')}
                            </span>
                          );
                        })()}
                      </td>
                      <td>{e.duration} mins</td>
                      <td><strong style={{ color: 'var(--primary)' }}>{e.questionCount || e.questions?.length || 0}</strong> questions</td>

                      <td>{new Date(e.startTime).toLocaleString()}</td>
                      <td>{new Date(e.endTime).toLocaleString()}</td>
                      <td><span className={`badge ${statusColors[e.status]}`}>{e.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleDownloadExamExcel(e)}
                            style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: '#107c41', borderColor: '#107c41', fontWeight: 600 }}
                            title="Download student results for this exam in Excel (.xlsx)"
                          >
                            <FileSpreadsheet size={13} /> Excel
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleEditExamClick(e)}
                            style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '2px' }}
                            title="Edit Exam"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteExam(e.id)}
                            style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '2px' }}
                            title="Delete Exam"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {exams.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      You have not configured or scheduled any exams yet. Click "Schedule New Exam" to launch.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          RESULTS & GRADING SUB-VIEW
          ========================================== */}
      {activeTab === 'results' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <h3 className="card-title" style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award style={{ color: 'var(--primary)' }} /> Student Score Report Logs
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
                  Comprehensive examination performance records, score breakdown, and downloadable evaluation sheets.
                </p>
              </div>

              {/* Download Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleDownloadResultsExcel}
                  style={{
                    backgroundColor: '#107c41',
                    borderColor: '#107c41',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 600,
                    boxShadow: '0 2px 4px rgba(16, 124, 65, 0.2)'
                  }}
                  title="Download student results as Microsoft Excel (.xlsx)"
                >
                  <FileSpreadsheet size={18} />
                  <span>Download Excel (.xlsx)</span>
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleDownloadResultsCSV}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  title="Export student results as CSV file"
                >
                  <Download size={16} />
                  <span>Export CSV</span>
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
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total Attempts</div>
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
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Failed</div>
                <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '2px', color: 'var(--danger, #ef4444)' }}>
                  {filteredResults.filter(r => r.status?.toLowerCase() === 'fail').length}
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

            {/* Filters & Search Controls */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search by Roll No, Student Name, or Exam..."
                  className="form-control"
                  style={{ paddingLeft: '36px' }}
                  value={resultsSearch}
                  onChange={e => setResultsSearch(e.target.value)}
                />
              </div>

              <select
                className="form-control"
                style={{ width: 'auto', minWidth: '200px' }}
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
                style={{ width: 'auto', minWidth: '130px' }}
                value={resultsStatusFilter}
                onChange={e => setResultsStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pass">Passed Only</option>
                <option value="fail">Failed Only</option>
              </select>

              {(resultsSearch || resultsExamFilter !== 'all' || resultsStatusFilter !== 'all') && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setResultsSearch('');
                    setResultsExamFilter('all');
                    setResultsStatusFilter('all');
                  }}
                  style={{ padding: '8px 12px' }}
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Table */}
            <div className="table-responsive">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Student Name</th>
                    <th>Department</th>
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
                          <span className="badge badge-info" style={{ fontWeight: 500, fontSize: '11px', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            {r.departmentName || r.studentDepartment || 'General'}
                          </span>
                        </td>
                        <td>{r.examTitle}</td>
                        <td>{displayScore} / {r.totalPoints}</td>
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
                      <td colSpan={11} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                        {results.length === 0
                          ? 'No student attempts recorded for your scheduled examinations.'
                          : 'No student results match the active search or filter criteria.'}
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
          BULK QUESTION IMPORTS SUB-VIEW
          ========================================== */}
      {activeTab === 'uploads' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <Upload size={22} style={{ color: 'var(--primary)' }} />
              <h3 className="card-title" style={{ margin: 0 }}>Bulk Import Questions (CSV or JSON)</h3>
            </div>
            
            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '500px' }}>
              <div style={{ backgroundColor: 'var(--hover)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                  <FileSpreadsheet style={{ color: 'var(--primary)' }} />
                  <span style={{ fontWeight: 600 }}>CSV Template Required Structure:</span>
                </div>
                <code style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', wordBreak: 'break-all' }}>
                  subjectId, text, type, option_1, option_2, option_3, option_4, correctAnswer, points, difficulty
                </code>
              </div>

              <div className="form-group">
                <label className="form-label">Choose CSV or JSON File</label>
                <input
                  type="file"
                  accept=".csv,.json"
                  className="form-control"
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                />
                <span className="form-helper" style={{ display: 'block', marginTop: '6px' }}>Select questions spreadsheet format. Only questions matching your assigned subjects will be saved.</span>
              </div>

              <button type="submit" className="btn btn-primary" disabled={uploadLoading || !uploadFile} style={{ alignSelf: 'flex-start' }}>
                {uploadLoading ? 'Uploading & Validating...' : 'Validate and Import Questions'}
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
                            <th>Row Number</th>
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

      {/* ==========================================================
          MODALS SECTION
          ========================================================== */}

      {/* Question Add Modal */}
      {showQuestionModal && (
        <div className="modal-overlay" onClick={() => setShowQuestionModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <form onSubmit={handleCreateQuestion}>
              <div className="modal-header">
                <h3 className="modal-title">Create Question Bank Entry</h3>
                <button type="button" className="modal-close" onClick={() => setShowQuestionModal(false)}>&times;</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="form-group">
                  <label className="form-label">Associated Subject</label>
                  <select required className="form-control" value={qSubjectId} onChange={e => setQSubjectId(e.target.value)}>
                    <option value="">Select Subject</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name || (s as any).subjectName}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Question Text Content</label>
                  <textarea required className="form-control" placeholder="Explain the concept or type question here..." value={qText} onChange={e => setQText(e.target.value)} style={{ height: '80px', resize: 'vertical' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Question Type</label>
                    <select required className="form-control" value={qType} onChange={e => setQType(e.target.value as QuestionType)}>
                      <option value="mcq">Single Choice (MCQ)</option>
                      <option value="checkbox">Multiple Answers (Checkbox)</option>
                      <option value="text">Descriptive Text</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Difficulty Grading</label>
                    <select required className="form-control" value={qDifficulty} onChange={e => setQDifficulty(e.target.value as any)}>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Points Allocation</label>
                  <input type="number" min={1} max={50} required className="form-control" value={qPoints} onChange={e => setQPoints(Number(e.target.value))} />
                </div>

                {/* MCQ Options Config */}
                {qType === 'mcq' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label className="form-label">Configure MCQ Options & Correct Choice</label>
                    {qOptions.map((opt, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="radio"
                          name="mcqCorrect"
                          checked={qCorrectAnswer === String(idx)}
                          onChange={() => setQCorrectAnswer(String(idx))}
                        />
                        <input
                          type="text"
                          required
                          placeholder={`Option ${idx + 1}`}
                          className="form-control"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...qOptions];
                            newOpts[idx] = e.target.value;
                            setQOptions(newOpts);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Checkbox Options Config */}
                {qType === 'checkbox' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label className="form-label">Configure Checkbox Options & Correct Choices</label>
                    {qOptions.map((opt, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          checked={qCorrectCheckboxAnswers.includes(String(idx))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setQCorrectCheckboxAnswers([...qCorrectCheckboxAnswers, String(idx)]);
                            } else {
                              setQCorrectCheckboxAnswers(qCorrectCheckboxAnswers.filter(x => x !== String(idx)));
                            }
                          }}
                        />
                        <input
                          type="text"
                          required
                          placeholder={`Option ${idx + 1}`}
                          className="form-control"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...qOptions];
                            newOpts[idx] = e.target.value;
                            setQOptions(newOpts);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Text answer description */}
                {qType === 'text' && (
                  <div className="form-group">
                    <label className="form-label">Correct Evaluator Keyphrase (Matches Student text)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. heap, recursive execution, linear search"
                      className="form-control"
                      value={qCorrectTextAnswer}
                      onChange={e => setQCorrectTextAnswer(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowQuestionModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Question</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Bulk Import Questions</h3>
              <button type="button" className="modal-close" onClick={() => setShowImportModal(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ backgroundColor: 'var(--hover)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                  <FileSpreadsheet style={{ color: 'var(--primary)' }} />
                  <span style={{ fontWeight: 600 }}>CSV Template Required Structure:</span>
                </div>
                <code style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  subjectId, text, type, option_1, option_2, option_3, option_4, correctAnswer, points, difficulty
                </code>
              </div>

              <div className="form-group">
                <label className="form-label">Select Destination Subject</label>
                <select required className="form-control" value={qSubjectId} onChange={e => setQSubjectId(e.target.value)}>
                  <option value="">Select Subject</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius)', padding: '30px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <Upload size={32} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Upload CSV or Excel file</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Max size 5MB</span>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowImportModal(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleSimulateCSVImport}>Simulate CSV Import</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Question Generator Modal */}
      {showAIModal && (
        <div className="modal-overlay" onClick={() => setShowAIModal(false)}>
          <div className="modal-content" style={{ maxWidth: '500px', width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleGenerateAIQuestionsSubmit}>
              <div className="modal-header">
                <h3 className="modal-title">AI Question Generator</h3>
                <button type="button" className="modal-close" onClick={() => setShowAIModal(false)}>&times;</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  backgroundColor: 'rgba(37, 99, 235, 0.1)',
                  color: 'var(--primary)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius)',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>Auto-generates context-aligned MCQs, choices, and correct options for the selected topic.</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Subject Context</label>
                  <select
                    required
                    className="form-control"
                    value={aiSubjectId}
                    onChange={e => setAiSubjectId(e.target.value)}
                  >
                    <option value="">Select Target Subject</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Topic / Academic Prompt</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SQL Join constraints, TCP IP stack routing..."
                    className="form-control"
                    value={aiTopic}
                    onChange={e => setAiTopic(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Number of Questions</label>
                    <select
                      className="form-control"
                      value={aiCount}
                      onChange={e => setAiCount(Number(e.target.value))}
                    >
                      <option value={1}>1 Question</option>
                      <option value={2}>2 Questions</option>
                      <option value={3}>3 Questions</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Difficulty Target</label>
                    <select
                      className="form-control"
                      value={aiDifficulty}
                      onChange={e => setAiDifficulty(e.target.value as any)}
                    >
                      <option value="easy">Easy (2pt)</option>
                      <option value="medium">Medium (4pt)</option>
                      <option value="hard">Hard (6pt)</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAIModal(false)}>Cancel</button>
                <button type="submit" disabled={generatingAI} className="btn btn-primary">
                  {generatingAI ? 'AI Generating...' : 'Generate Questions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exam Schedule Modal Wizard */}
      {showExamModal && (
        <div className="modal-overlay" onClick={() => setShowExamModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <form onSubmit={handleCreateExam}>
              <div className="modal-header">
                <h3 className="modal-title">Schedule New Examination</h3>
                <button type="button" className="modal-close" onClick={() => setShowExamModal(false)}>&times;</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
                {/* Institutional College Header */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '13px' }}>
                    College / Campus
                  </label>
                  {user?.collegeId ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'rgba(37,99,235,0.06)',
                      border: '1px solid rgba(37,99,235,0.2)',
                      borderRadius: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>🏫</span>
                        <div>
                          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
                            Assigned Institution
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                            {user?.collegeName || 'St.Joseph’s College of Engineering, OMR Chennai'}
                          </div>
                        </div>
                      </div>
                      <span className="badge badge-primary" style={{ fontSize: '11px', padding: '4px 8px' }}>Verified</span>
                    </div>
                  ) : (
                    <select
                      className="form-control"
                      value={selectedCollegeId}
                      onChange={async (e) => {
                        const newColId = e.target.value;
                        setSelectedCollegeId(newColId);
                        setSelectedExamDeptIds([]);
                        try {
                          const res = await api.get(`/faculty/departments?collegeId=${newColId}`);
                          setDepartments(res.data || []);
                        } catch (err) {
                          console.error('Failed to load departments for college:', err);
                        }
                      }}
                    >
                      <option value="">Select College</option>
                      {collegesList.map(c => (
                        <option key={c.id} value={c.id}>{c.collegeName}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Target Audience / Exam Visibility */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Target Departments (Exam Visibility)</span>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>
                      {examTargetMode === 'all' 
                        ? 'Visible to Entire College' 
                        : `${selectedExamDeptIds.length} Department${selectedExamDeptIds.length === 1 ? '' : 's'} Selected`}
                    </span>
                  </label>

                  {/* Mode Selector Tabs */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    marginBottom: '10px',
                    background: 'var(--hover)',
                    padding: '4px',
                    borderRadius: '8px'
                  }}>
                    <button
                      type="button"
                      onClick={() => {
                        setExamTargetMode('all');
                        setSelectedExamDeptIds([]);
                      }}
                      style={{
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: examTargetMode === 'all' ? 'var(--primary)' : 'transparent',
                        color: examTargetMode === 'all' ? '#fff' : 'var(--text-muted)'
                      }}
                    >
                      <span>🌐</span> Entire College (All Departments)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExamTargetMode('specific');
                        if (selectedExamDeptIds.length === 0) {
                          const pool = departments.length > 0 ? departments : DEFAULT_DEPARTMENTS;
                          if (pool.length > 0) {
                            setSelectedExamDeptIds([pool[0].id]);
                          }
                        }
                      }}
                      style={{
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        background: examTargetMode === 'specific' ? 'var(--primary)' : 'transparent',
                        color: examTargetMode === 'specific' ? '#fff' : 'var(--text-muted)'
                      }}
                    >
                      <span>🎯</span> Specific Department(s)
                    </button>
                  </div>

                  {/* Entire College Mode View */}
                  {examTargetMode === 'all' ? (
                    <div style={{
                      padding: '14px 16px',
                      background: 'rgba(34, 197, 94, 0.08)',
                      border: '1px solid rgba(34, 197, 94, 0.25)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px'
                    }}>
                      <span style={{ fontSize: '20px' }}>🌟</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>
                          Open to students across all college departments
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          This exam will be visible on the dashboard of every enrolled student in this institution (General aptitude, campus placements, or multi-disciplinary assessments).
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Specific Department(s) Mode View */
                    <div style={{
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '12px',
                      background: 'var(--bg-card)'
                    }}>
                      {/* Category filter pills & quick actions */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginBottom: '10px'
                      }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {(['all', 'Engineering', 'Arts & Science'] as const).map(cat => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setModalDeptCategoryFilter(cat)}
                              style={{
                                padding: '4px 10px',
                                fontSize: '11px',
                                fontWeight: 600,
                                borderRadius: '6px',
                                border: '1px solid var(--border)',
                                background: modalDeptCategoryFilter === cat ? 'var(--primary)' : 'transparent',
                                color: modalDeptCategoryFilter === cat ? '#fff' : 'var(--text-muted)',
                                cursor: 'pointer'
                              }}
                            >
                              {cat === 'all' ? 'All Programs' : cat}
                            </button>
                          ))}
                        </div>

                        <div style={{ display: 'flex', gap: '8px', fontSize: '12px' }}>
                          <button
                            type="button"
                            style={{ fontSize: '11px', color: 'var(--primary)', cursor: 'pointer', background: 'none', border: 'none', padding: 0, fontWeight: 600 }}
                            onClick={() => {
                              const deptPool = departments.length > 0 ? departments : DEFAULT_DEPARTMENTS;
                              const filtered = deptPool.filter(d => 
                                modalDeptCategoryFilter === 'all' || !d.category || d.category === modalDeptCategoryFilter
                              );
                              const allFilteredIds = filtered.map(d => d.id);
                              setSelectedExamDeptIds(Array.from(new Set([...selectedExamDeptIds, ...allFilteredIds])));
                            }}
                          >
                            Select All
                          </button>
                          <span style={{ color: 'var(--border)' }}>|</span>
                          <button
                            type="button"
                            style={{ fontSize: '11px', color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                            onClick={() => setSelectedExamDeptIds([])}
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      {/* Quick Search */}
                      <div style={{ marginBottom: '8px' }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Type to filter departments (e.g., Computer, Mechanical, AI)..."
                          value={modalDeptSearch}
                          onChange={e => setModalDeptSearch(e.target.value)}
                          style={{ fontSize: '12px', padding: '6px 10px' }}
                        />
                      </div>

                      {/* Scrollable Department Checkbox List */}
                      <div style={{
                        maxHeight: '170px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        paddingRight: '4px'
                      }}>
                        {(() => {
                          const deptPool = departments.length > 0 ? departments : DEFAULT_DEPARTMENTS;
                          const visibleDepts = deptPool.filter(d => {
                            const name = (d.departmentName || d.name || '').toLowerCase();
                            const matchesCat = modalDeptCategoryFilter === 'all' || !d.category || d.category === modalDeptCategoryFilter;
                            const matchesSearch = !modalDeptSearch || name.includes(modalDeptSearch.toLowerCase());
                            return matchesCat && matchesSearch;
                          });

                          if (visibleDepts.length === 0) {
                            return (
                              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '12px' }}>
                                No departments match your filter.
                              </div>
                            );
                          }

                          return visibleDepts.map(d => {
                            const isSelected = selectedExamDeptIds.includes(d.id);
                            return (
                              <div
                                key={d.id}
                                onClick={() => {
                                  if (isSelected) {
                                    setSelectedExamDeptIds(selectedExamDeptIds.filter(id => id !== d.id));
                                  } else {
                                    setSelectedExamDeptIds([...selectedExamDeptIds, d.id]);
                                  }
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                                  background: isSelected ? 'rgba(37,99,235,0.08)' : 'var(--hover)',
                                  cursor: 'pointer',
                                  transition: 'background 0.15s'
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}} // handled by parent div onClick
                                    style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                                  />
                                  <span style={{ fontSize: '13px', fontWeight: isSelected ? 600 : 500, color: 'var(--text-main)' }}>
                                    {d.departmentName || d.name}
                                  </span>
                                </div>
                                <span
                                  style={{
                                    fontSize: '11px',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    background: (d.category || '').toLowerCase() === 'engineering' ? 'rgba(37,99,235,0.1)' : 'rgba(147,51,234,0.1)',
                                    color: (d.category || '').toLowerCase() === 'engineering' ? '#2563eb' : '#9333ea',
                                    fontWeight: 600
                                  }}
                                >
                                  {d.category || 'Engineering'}
                                </span>
                              </div>
                            );
                          });
                        })()}
                      </div>

                      {/* Selected Summary Footer */}
                      <div style={{
                        marginTop: '10px',
                        paddingTop: '8px',
                        borderTop: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px'
                      }}>
                        <span style={{ color: selectedExamDeptIds.length > 0 ? 'var(--success)' : '#ef4444', fontWeight: 600 }}>
                          {selectedExamDeptIds.length > 0
                            ? `✓ Exam visible to ${selectedExamDeptIds.length} department(s)`
                            : '⚠️ Please select at least one department'}
                        </span>
                        {selectedExamDeptIds.length > 0 && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px', maxWidth: '50%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {(departments.length > 0 ? departments : DEFAULT_DEPARTMENTS)
                              .filter(d => selectedExamDeptIds.includes(d.id))
                              .map(d => d.departmentName || d.name)
                              .slice(0, 2)
                              .join(', ') + (selectedExamDeptIds.length > 2 ? ` +${selectedExamDeptIds.length - 2} more` : '')}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Target Academic Year Selection */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Target Academic Year (Eligibility)</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)' }}>
                      {examTargetYears.includes('all') ? 'All Years (1st - 4th)' : `Years: ${examTargetYears.map(y => `Year ${y}`).join(', ')}`}
                    </span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setExamTargetYears(['all'])}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: examTargetYears.includes('all') ? 'var(--primary)' : 'var(--bg-card)',
                        color: examTargetYears.includes('all') ? '#fff' : 'var(--text-main)'
                      }}
                    >
                      All Years (1 - 4)
                    </button>
                    {[1, 2, 3, 4].map(yr => {
                      const yrStr = String(yr);
                      const isSelected = !examTargetYears.includes('all') && examTargetYears.includes(yrStr);
                      return (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => {
                            if (examTargetYears.includes('all')) {
                              setExamTargetYears([yrStr]);
                            } else {
                              if (isSelected) {
                                const remaining = examTargetYears.filter(y => y !== yrStr);
                                setExamTargetYears(remaining.length === 0 ? ['all'] : remaining);
                              } else {
                                setExamTargetYears([...examTargetYears, yrStr].sort());
                              }
                            }
                          }}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: isSelected ? 'var(--primary)' : 'var(--bg-card)',
                            color: isSelected ? '#fff' : 'var(--text-main)'
                          }}
                        >
                          Year {yr}
                        </button>
                      );
                    })}
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Only students in the specified academic year(s) can see and attempt this exam.
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Exam Title</label>
                    <input type="text" required className="form-control" placeholder="e.g. Assessment Test 1" value={examTitle} onChange={e => setExamTitle(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Subject / Course</label>
                    <select
                      className="form-control"
                      value={examSubId}
                      onChange={e => {
                        const newSub = e.target.value;
                        setExamSubId(newSub);
                        if (newSub) {
                          setExamQuestionSubjectFilter(newSub);
                        }
                      }}
                    >
                      <option value="">General / All Subjects</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name || (s as any).subjectName}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Instructions / Description (Optional)</label>
                  <textarea className="form-control" placeholder="Type rules (e.g. Fullscreen mandatory, non-proctored, etc.)" value={examDesc} onChange={e => setExamDesc(e.target.value)} style={{ height: '60px', resize: 'vertical' }} />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Start Date & Time (Optional)</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={examStart}
                      onChange={e => setExamStart(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date & Time (Optional)</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={examEnd}
                      onChange={e => setExamEnd(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Duration (Minutes)</label>
                    <input type="number" min={5} max={180} required className="form-control" value={examDuration} onChange={e => setExamDuration(Number(e.target.value))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Questions Per Student (Random Pool)</label>
                    <input
                      type="number"
                      min={1}
                      max={Math.max(1, questions.length)}
                      required
                      className="form-control"
                      value={examQuestionCount}
                      onChange={e => setExamQuestionCount(Number(e.target.value))}
                      placeholder="e.g. 10"
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Randomly selected for each student attempt</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Negative Marking Option</label>
                  <select
                    className="form-control"
                    value={examNegativeMarking ? 'yes' : 'no'}
                    onChange={e => setExamNegativeMarking(e.target.value === 'yes')}
                  >
                    <option value="no">No (No Penalty)</option>
                    <option value="yes">Yes (Enable Negative Marking)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Marks for Correct Option</label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      required
                      className="form-control"
                      value={examMarksPerQuestion}
                      onChange={e => setExamMarksPerQuestion(Number(e.target.value))}
                    />
                  </div>
                  {examNegativeMarking && (
                    <div className="form-group">
                      <label className="form-label">Negative Marks for Wrong Answer</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        required
                        className="form-control"
                        value={examNegativeMarks}
                        onChange={e => setExamNegativeMarks(Number(e.target.value))}
                      />
                    </div>
                  )}
                </div>

                {/* Question selectors list */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      Select Exam Questions ({examQuestionsSelected.length} Selected)
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '11px', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => {
                          let pool = questions;
                          if (examQuestionSubjectFilter) {
                            pool = pool.filter(q => q.subjectId === examQuestionSubjectFilter);
                          }
                          if (selectedPaperFilter) {
                            pool = pool.filter(q => (q as any).paperName === selectedPaperFilter || (q as any).uploadedDocument?.name === selectedPaperFilter);
                          }
                          if (examQuestionSourceFilter === 'bank') {
                            pool = pool.filter(q => !q.uploadedDocumentId);
                          } else if (examQuestionSourceFilter === 'document') {
                            pool = pool.filter(q => q.uploadedDocumentId === examQuestionDocFilter);
                          }
                          if (examQuestionSearch) {
                            pool = pool.filter(q => q.text.toLowerCase().includes(examQuestionSearch.toLowerCase()));
                          }
                          if (pool.length === 0) {
                            showToast('No questions available matching your filters to select.', 'warning');
                            return;
                          }
                          const countToPick = Math.min(examQuestionCount || 10, pool.length);
                          const shuffled = [...pool].sort(() => 0.5 - Math.random());
                          const selected = shuffled.slice(0, countToPick).map(q => q.id);
                          setExamQuestionsSelected(selected);
                          showToast(`Auto-selected ${selected.length} random questions from Question Bank!`, 'success');
                        }}
                      >
                        🎲 Auto-Pick {examQuestionCount || 10} Questions
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                        onClick={() => {
                          let pool = questions;
                          if (examQuestionSubjectFilter) {
                            pool = pool.filter(q => q.subjectId === examQuestionSubjectFilter);
                          }
                          if (selectedPaperFilter) {
                            pool = pool.filter(q => (q as any).paperName === selectedPaperFilter || (q as any).uploadedDocument?.name === selectedPaperFilter);
                          }
                          if (examQuestionSourceFilter === 'bank') {
                            pool = pool.filter(q => !q.uploadedDocumentId);
                          } else if (examQuestionSourceFilter === 'document') {
                            pool = pool.filter(q => q.uploadedDocumentId === examQuestionDocFilter);
                          }
                          if (examQuestionSearch) {
                            pool = pool.filter(q => q.text.toLowerCase().includes(examQuestionSearch.toLowerCase()));
                          }
                          setExamQuestionsSelected(pool.map(q => q.id));
                        }}
                      >
                        Select All
                      </button>
                      {examQuestionsSelected.length > 0 && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                          onClick={() => setExamQuestionsSelected([])}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '10px', marginBottom: '4px' }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px', margin: '0 0 4px' }}>Search Question Bank</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search keyword..."
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          value={examQuestionSearch}
                          onChange={e => setExamQuestionSearch(e.target.value)}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px', margin: '0 0 4px' }}>Filter by Subject</label>
                        <select
                          className="form-control"
                          style={{ padding: '6px', fontSize: '12px' }}
                          value={examQuestionSubjectFilter}
                          onChange={e => setExamQuestionSubjectFilter(e.target.value)}
                        >
                          <option value="">All Subjects</option>
                          {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name || (s as any).subjectName}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px', margin: '0 0 4px' }}>Filter by Source</label>
                        <select
                          className="form-control"
                          style={{ padding: '6px', fontSize: '12px' }}
                          value={examQuestionSourceFilter}
                          onChange={e => {
                            setExamQuestionSourceFilter(e.target.value as any);
                            setExamQuestionDocFilter('');
                          }}
                        >
                          <option value="all">All Questions ({questions.length})</option>
                          <option value="bank">Question Bank Repository</option>
                          <option value="document">From Extracted Document</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px', margin: '0 0 4px' }}>Filter by Paper / Category</label>
                        <select
                          className="form-control"
                          style={{ padding: '6px', fontSize: '12px' }}
                          value={selectedPaperFilter}
                          onChange={e => {
                            const pName = e.target.value;
                            setSelectedPaperFilter(pName);
                            if (pName) {
                              const matchQIds = questions.filter(q => (q as any).paperName === pName || (q as any).uploadedDocument?.name === pName).map(q => q.id);
                              if (matchQIds.length > 0) {
                                setExamQuestionsSelected(matchQIds);
                                showToast(`Selected ${matchQIds.length} questions from "${pName}"`, 'success');
                              }
                            }
                          }}
                        >
                          <option value="">All Papers / Tests</option>
                          {Array.from(new Set([
                            ...questionPapers,
                            ...questions.map(q => (q as any).paperName).filter(Boolean),
                            ...uploadedDocuments.map(d => d.name).filter(Boolean)
                          ])).map((paper, pIdx) => (
                            <option key={pIdx} value={paper}>{paper}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {examQuestionSourceFilter === 'document' && (
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '11px', margin: '0 0 4px' }}>Select Extracted Document</label>
                        <select
                          className="form-control"
                          style={{ padding: '6px', fontSize: '12px' }}
                          value={examQuestionDocFilter}
                          onChange={e => setExamQuestionDocFilter(e.target.value)}
                        >
                          <option value="">Select Document</option>
                          {uploadedDocuments.map(doc => (
                            <option key={doc.id} value={doc.id}>{doc.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      border: '1px solid var(--border)',
                      padding: '10px',
                      borderRadius: 'var(--radius)'
                    }}>
                      {(() => {
                        let filtered = questions;
                        if (examQuestionSubjectFilter) {
                          filtered = filtered.filter(q => q.subjectId === examQuestionSubjectFilter);
                        }
                        if (selectedPaperFilter) {
                          filtered = filtered.filter(q => (q as any).paperName === selectedPaperFilter || (q as any).uploadedDocument?.name === selectedPaperFilter);
                        }
                        if (examQuestionSourceFilter === 'bank') {
                          filtered = filtered.filter(q => !q.uploadedDocumentId);
                        } else if (examQuestionSourceFilter === 'document') {
                          filtered = filtered.filter(q => q.uploadedDocumentId === examQuestionDocFilter);
                        }
                        if (examQuestionSearch) {
                          filtered = filtered.filter(q => q.text.toLowerCase().includes(examQuestionSearch.toLowerCase()));
                        }
                        
                        return (
                          <>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 600 }}>
                              Available: {filtered.length} questions in this pool
                            </div>
                            {filtered.slice(0, 200).map(q => {
                              const cleanQText = q.text ? q.text.replace(/^(?:q(?:uestion)?\s*\d+[\s.:)\-–—]+|\d+\s*[\.\)]\s+)/i, '').trim() : '';
                              return (
                                <label key={q.id} className="checkbox-group" style={{ fontSize: '13px', borderBottom: '1px solid var(--hover)', paddingBottom: '6px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                                  <input
                                    type="checkbox"
                                    checked={examQuestionsSelected.includes(q.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setExamQuestionsSelected([...examQuestionsSelected, q.id]);
                                      } else {
                                        setExamQuestionsSelected(examQuestionsSelected.filter(x => x !== q.id));
                                      }
                                    }}
                                  />
                                  <span style={{ lineHeight: '1.4' }}>
                                    <strong style={{ color: 'var(--primary)', marginRight: '4px' }}>
                                      [{q.difficulty.toUpperCase()} &bull; {q.points}pt]
                                    </strong>
                                    {(q as any).paperName && (
                                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '6px', backgroundColor: 'var(--hover)', padding: '1px 5px', borderRadius: '3px' }}>
                                        {(q as any).paperName}
                                      </span>
                                    )}
                                    {cleanQText}
                                  </span>
                                </label>
                              );
                            })}
                            {filtered.length > 200 && (
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '6px' }}>
                                + {filtered.length - 200} more questions available in pool (use search above to narrow down)
                              </div>
                            )}
                            {filtered.length === 0 && (
                              <span style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>
                                No questions found matching this search or filter.
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>

                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowExamModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Schedule Exam</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Exam Modal */}
      {showEditExamModal && (
        <div className="modal-overlay" onClick={() => setShowEditExamModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <form onSubmit={handleUpdateExamSubmit}>
              <div className="modal-header">
                <h3 className="modal-title">Edit Scheduled Exam</h3>
                <button type="button" className="modal-close" onClick={() => setShowEditExamModal(false)}>&times;</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Exam Title</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={editExamTitle}
                    onChange={e => setEditExamTitle(e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Instructions / Description (Optional)</label>
                  <textarea
                    className="form-control"
                    value={editExamDesc}
                    onChange={e => setEditExamDesc(e.target.value)}
                    style={{ height: '60px', resize: 'vertical' }}
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      className="form-control"
                      value={editExamStart}
                      onChange={e => setEditExamStart(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      className="form-control"
                      value={editExamEnd}
                      onChange={e => setEditExamEnd(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Duration (Minutes)</label>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      required
                      className="form-control"
                      value={editExamDuration}
                      onChange={e => setEditExamDuration(Number(e.target.value))}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Number of Questions (Per Student)</label>
                    <input
                      type="number"
                      min={1}
                      max={Math.max(100, questions.length || 100)}
                      required
                      className="form-control"
                      value={editExamQuestionCount}
                      onChange={e => setEditExamQuestionCount(Number(e.target.value))}
                      placeholder="e.g. 10"
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Randomly drawn from the Aptitude question pool for each candidate
                    </span>
                  </div>
                </div>

                {/* Edit Target Academic Year */}
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Target Academic Year (Eligibility)</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)' }}>
                      {editExamTargetYears.includes('all') ? 'All Years (1st - 4th)' : `Years: ${editExamTargetYears.map(y => `Year ${y}`).join(', ')}`}
                    </span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setEditExamTargetYears(['all'])}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: editExamTargetYears.includes('all') ? 'var(--primary)' : 'var(--bg-card)',
                        color: editExamTargetYears.includes('all') ? '#fff' : 'var(--text-main)'
                      }}
                    >
                      All Years (1 - 4)
                    </button>
                    {[1, 2, 3, 4].map(yr => {
                      const yrStr = String(yr);
                      const isSelected = !editExamTargetYears.includes('all') && editExamTargetYears.includes(yrStr);
                      return (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => {
                            if (editExamTargetYears.includes('all')) {
                              setEditExamTargetYears([yrStr]);
                            } else {
                              if (isSelected) {
                                const remaining = editExamTargetYears.filter(y => y !== yrStr);
                                setEditExamTargetYears(remaining.length === 0 ? ['all'] : remaining);
                              } else {
                                setEditExamTargetYears([...editExamTargetYears, yrStr].sort());
                              }
                            }
                          }}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            background: isSelected ? 'var(--primary)' : 'var(--bg-card)',
                            color: isSelected ? '#fff' : 'var(--text-main)'
                          }}
                        >
                          Year {yr}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditExamModal(false)}>Cancel</button>
                <button type="submit" disabled={updatingExam} className="btn btn-primary">
                  {updatingExam ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          UPLOAD & EXTRACT Q-PAPERS TAB
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
                        name="facultyQPaperType"
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
                        name="facultyQPaperType"
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
                        name="facultyQPaperType"
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
                  id="qpaper-file-input"
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
                  id="qpaper-ans-file-input"
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
          VIEW EXTRACTED QUESTIONS MODAL
          ========================================== */}
      {showDocQuestionsModal && activeDocForPreview && (
        <div className="modal-overlay" onClick={() => setShowDocQuestionsModal(false)}>
          <div className="modal-content" style={{ maxWidth: '640px', width: '95%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Extracted Questions — {activeDocForPreview.name}</h3>
              <button className="modal-close" onClick={() => setShowDocQuestionsModal(false)}>×</button>
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
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: 'var(--hover)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)' }}>
                        Question {idx + 1} ({q.type.toUpperCase()})
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Difficulty: <strong style={{ color: q.difficulty === 'easy' ? 'var(--success)' : q.difficulty === 'medium' ? 'var(--warning)' : 'var(--danger)' }}>{q.difficulty}</strong> | Points: <strong>{q.marks}pt</strong>
                      </span>
                    </div>
                    <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)', margin: '0 0 10px 0' }}>{q.question}</p>
                    
                    {q.options && q.options.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '10px' }}>
                        {q.options.map((opt: string, oIdx: number) => {
                          const isCorrect = Array.isArray(q.correctAnswer)
                            ? q.correctAnswer.includes(String(oIdx))
                            : String(oIdx) === q.correctAnswer;
                          return (
                            <div key={oIdx} style={{ fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                fontWeight: 700,
                                backgroundColor: isCorrect ? 'var(--success-bg)' : 'var(--border)',
                                color: isCorrect ? 'var(--success)' : 'var(--text-muted)',
                                border: isCorrect ? '1px solid var(--success)' : '1px solid var(--border)'
                              }}>
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span style={{ color: isCorrect ? 'var(--success)' : 'var(--text-main)', fontWeight: isCorrect ? 600 : 400 }}>{opt}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setShowDocQuestionsModal(false)}>Close Preview</button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          LOCKED STUDENTS / PROCTOR MONITOR SUB-VIEW
          ========================================== */}
      {activeTab === 'proctoring' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                <ShieldAlert size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Proctor Monitoring: Locked Students</h3>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Students automatically locked out after 3 tab switches or malpractice warnings. Faculty can review and allow re-entry or revoke access.
                </p>
              </div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={fetchLockedExams} disabled={lockedLoading}>
              {lockedLoading ? 'Refreshing...' : 'Refresh List'}
            </button>
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
                  <th>Tab Switch Warnings</th>
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
                      <span className="badge badge-warning" style={{ backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 600 }}>
                        {item.warningCount} / 3
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-danger" style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
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
                          style={{ backgroundColor: '#16a34a', borderColor: '#16a34a', color: '#fff' }}
                        >
                          Allow Re-entry (Unblock)
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
                    <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>
                      <CheckCircle size={32} style={{ color: '#16a34a', marginBottom: '8px', display: 'inline-block' }} />
                      <div>All examinations are operating normally. No students are currently locked out.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          PORTIONS (SYLLABUS) TAB
          ========================================== */}
      {activeTab === 'portions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ marginBottom: '4px' }}>Syllabus Portions</h2>
              <p style={{ fontSize: '14px' }}>Manage syllabus portions and syllabus outlines for your subjects.</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => {
              setEditingPortion(null);
              setPortionTitle('');
              setPortionDesc('');
              setPortionSubjectId('');
              setShowPortionModal(true);
            }}>
              <Plus size={14} /> Add Portion Outline
            </button>
          </div>

          {loadingPortions ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading syllabus outlines...
            </div>
          ) : portions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <BookOpen size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
              <h3 style={{ marginBottom: '8px' }}>No Syllabus Outlines</h3>
              <p>No syllabus portions scheduled yet. Create one using the button above.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              {portions.map(p => (
                <div key={p.id} className="card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '12px' }}>
                    <div>
                      <span className="badge badge-info" style={{ fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px', display: 'inline-block' }}>
                        {p.subjectName}
                      </span>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>{p.title}</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEditPortionClick(p)}>Edit</button>
                      <button className="btn btn-danger btn-sm" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', border: 'none' }} onClick={() => handleDeletePortion(p.id)}>Delete</button>
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'var(--text-main)' }}>
                    {p.description}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px', textAlign: 'right' }}>
                    Last updated: {new Date(p.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          ACADEMIC STRUCTURE MANAGEMENT
          ========================================== */}
      {/* ==========================================
          ACADEMIC STRUCTURE & CURRICULUM MANAGEMENT
          ========================================== */}
      {activeTab === 'academics' && (() => {
        const collegeName = user?.collegeName || departments[0]?.collegeName || 'Assigned College';
        const engDepts = departments.filter(d => (d.category || '').toLowerCase() === 'engineering');
        const artsDepts = departments.filter(d => (d.category || '').toLowerCase().includes('arts'));

        const filteredDepts = departments.filter(d => {
          const name = d.name || d.departmentName || '';
          const code = d.code || '';
          const matchSearch = name.toLowerCase().includes(deptSearchTerm.toLowerCase()) ||
            code.toLowerCase().includes(deptSearchTerm.toLowerCase());
          const matchCat = deptCategoryFilter === 'all' || (d.category || '') === deptCategoryFilter;
          return matchSearch && matchCat;
        });

        const filteredSubjects = subjects.filter(s => {
          const name = s.name || '';
          const code = s.code || '';
          return name.toLowerCase().includes(subjectSearchTerm.toLowerCase()) ||
            code.toLowerCase().includes(subjectSearchTerm.toLowerCase());
        });

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Institutional Hero Banner */}
            <div className="card" style={{
              background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(124,58,237,0.06) 100%)',
              border: '1px solid rgba(37,99,235,0.2)',
              padding: '24px 28px',
              borderRadius: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '24px' }}>🏫</span>
                    <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                      {collegeName}
                    </h2>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
                    Academic hierarchy, institutional departments, and curriculum subjects for examination delivery.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="badge badge-primary" style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600 }}>
                    College Faculty Account
                  </span>
                  <span className="badge badge-success" style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600 }}>
                    Multi-Department Access
                  </span>
                </div>
              </div>

              {/* Quick Stat Summary Pills */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginTop: '20px' }}>
                <div style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Total Departments</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>{departments.length}</div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Engineering Programs</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#2563eb', marginTop: '2px' }}>{engDepts.length}</div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Arts & Science Programs</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#9333ea', marginTop: '2px' }}>{artsDepts.length}</div>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Curriculum Subjects</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#16a34a', marginTop: '2px' }}>{subjects.length}</div>
                </div>
              </div>
            </div>

            {/* Section 1: College Departments & Programs */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Academic Departments & Degree Programs</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    Accredited branches under your college. You can schedule examinations for any of these departments.
                  </p>
                </div>
                {/* Category filter pills */}
                <div style={{ display: 'flex', gap: '6px', background: 'var(--hover)', padding: '4px', borderRadius: '8px' }}>
                  {(['all', 'Engineering', 'Arts & Science'] as const).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setDeptCategoryFilter(cat)}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        background: deptCategoryFilter === cat ? 'var(--primary)' : 'transparent',
                        color: deptCategoryFilter === cat ? '#fff' : 'var(--text-muted)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {cat === 'all' ? 'All Programs' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search input */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ position: 'relative', maxWidth: '380px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search departments or course names..."
                    value={deptSearchTerm}
                    onChange={e => setDeptSearchTerm(e.target.value)}
                    style={{ paddingLeft: '34px', fontSize: '13px' }}
                  />
                  {deptSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setDeptSearchTerm('')}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Departments Table */}
              <div className="table-responsive">
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>#</th>
                      <th>Department / Course Program</th>
                      <th>Category</th>
                      <th>Code</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepts.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                          No departments match your filter.
                        </td>
                      </tr>
                    ) : (
                      filteredDepts.map((d, index) => {
                        const isEng = (d.category || '').toLowerCase() === 'engineering';
                        return (
                          <tr key={d.id}>
                            <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{index + 1}</td>
                            <td>
                              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{d.name || d.departmentName}</div>
                            </td>
                            <td>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  background: isEng ? 'rgba(37,99,235,0.1)' : 'rgba(147,51,234,0.1)',
                                  color: isEng ? '#2563eb' : '#9333ea',
                                  border: `1px solid ${isEng ? 'rgba(37,99,235,0.2)' : 'rgba(147,51,234,0.2)'}`
                                }}
                              >
                                {d.category || 'General'}
                              </span>
                            </td>
                            <td>
                              <code style={{ fontSize: '12px', padding: '3px 8px', background: 'var(--hover)', borderRadius: '4px' }}>
                                {d.code || d.name?.split(' ').map((x: string) => x[0]).join('').toUpperCase()}
                              </code>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                  setExamCategory(d.category || 'Engineering');
                                  setExamDeptId(d.id);
                                  setShowExamModal(true);
                                }}
                                style={{ fontSize: '12px', padding: '6px 12px' }}
                              >
                                <Plus size={13} style={{ marginRight: '4px' }} /> Create Exam
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 2: Teaching Curriculum & Subjects */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Curriculum Subjects</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    Subjects configured for authoring question banks, syllabus portions, and conducting examinations.
                  </p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddSubjectModal(true)}>
                  <Plus size={14} style={{ marginRight: '4px' }} /> Add Subject
                </button>
              </div>

              {/* Search bar */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ position: 'relative', maxWidth: '380px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search subjects..."
                    value={subjectSearchTerm}
                    onChange={e => setSubjectSearchTerm(e.target.value)}
                    style={{ paddingLeft: '34px', fontSize: '13px' }}
                  />
                  {subjectSearchTerm && (
                    <button
                      type="button"
                      onClick={() => setSubjectSearchTerm('')}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Subjects Table */}
              <div className="table-responsive">
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>#</th>
                      <th>Subject Name</th>
                      <th>Subject Code</th>
                      <th>Question Bank</th>
                      <th>Active Exams</th>
                      <th style={{ textAlign: 'right' }}>Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubjects.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                          No subjects found. Click "+ Add Subject" to create your first teaching subject.
                        </td>
                      </tr>
                    ) : (
                      filteredSubjects.map((s, index) => {
                        const questionCount = questions.filter(q => q.subjectId === s.id).length;
                        const examCount = exams.filter(e => e.subjectId === s.id).length;
                        return (
                          <tr key={s.id}>
                            <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{index + 1}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <BookOpen size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{s.name}</span>
                              </div>
                            </td>
                            <td>
                              <code style={{ fontSize: '12px', padding: '3px 8px', background: 'var(--hover)', borderRadius: '4px' }}>
                                {s.code || s.name.split(' ').map((x: string) => x[0]).join('').toUpperCase()}
                              </code>
                            </td>
                            <td>
                              <span style={{ fontSize: '13px', fontWeight: 500, color: questionCount > 0 ? 'var(--text-main)' : 'var(--text-muted)' }}>
                                {questionCount} question{questionCount !== 1 ? 's' : ''}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontSize: '13px', fontWeight: 500, color: examCount > 0 ? '#16a34a' : 'var(--text-muted)' }}>
                                {examCount} exam{examCount !== 1 ? 's' : ''}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', gap: '8px' }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => {
                                    setSubFilter(s.id);
                                    navigate('/faculty/dashboard?tab=questions');
                                  }}
                                  style={{ fontSize: '12px', padding: '5px 10px' }}
                                  title="View questions in Question Bank"
                                >
                                  Questions
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => {
                                    setExamSubId(s.id);
                                    setShowExamModal(true);
                                  }}
                                  style={{ fontSize: '12px', padding: '5px 10px' }}
                                  title="Schedule exam for this subject"
                                >
                                  <Plus size={12} style={{ marginRight: '2px' }} /> Exam
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
            </div>
          </div>
        );
      })()}

      {/* ==========================================
          PORTION MODAL OVERLAY
          ========================================== */}
      {showPortionModal && (
        <div className="modal-overlay" onClick={() => !savingPortion && setShowPortionModal(false)}>
          <div className="modal-content" style={{ maxWidth: '520px', width: '95%' }} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSavePortionSubmit}>
              <div className="modal-header">
                <h3>{editingPortion ? 'Edit Syllabus Portion' : 'Add Syllabus Portion'}</h3>
                <button type="button" className="modal-close" onClick={() => !savingPortion && setShowPortionModal(false)}>×</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Portion Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unit 3: Graph Algorithms"
                    className="form-control"
                    value={portionTitle}
                    onChange={e => setPortionTitle(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <select
                    required
                    className="form-control"
                    value={portionSubjectId}
                    onChange={e => setPortionSubjectId(e.target.value)}
                  >
                    <option value="">Select a Subject</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Syllabus Details / Outline Description</label>
                  <textarea
                    required
                    rows={6}
                    placeholder="Describe the topics and outline scheduled..."
                    className="form-control"
                    value={portionDesc}
                    onChange={e => setPortionDesc(e.target.value)}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPortionModal(false)} disabled={savingPortion}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingPortion}>
                  {savingPortion ? 'Saving...' : 'Save Syllabus Portion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          PROFILE TAB
          ========================================== */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '20px' }}>My Profile</h3>

            {/* Photo preview + upload */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {profilePhotoPreview || user?.photoUrl ? (
                  <img
                    src={profilePhotoPreview || user?.photoUrl}
                    alt="Profile"
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
                    {user?.name?.charAt(0).toUpperCase() || 'F'}
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{user?.name}</h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>{user?.email}</p>
              </div>
            </div>

            {/* Read-only account info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--hover)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Full Name</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{user?.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--hover)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Email Address</span>
                <code style={{ fontSize: '13px' }}>{user?.email}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--hover)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Role</span>
                <span className="badge badge-info" style={{ fontSize: '11px', textTransform: 'capitalize' }}>{user?.role}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Account Status</span>
                <span className="badge badge-success" style={{ fontSize: '11px', textTransform: 'capitalize' }}>{user?.status}</span>
              </div>
            </div>

            {/* Edit Profile Form */}
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={facultyName}
                  onChange={(e) => setFacultyName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Leave blank to keep current password"
                  value={facultyPassword}
                  onChange={(e) => setFacultyPassword(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ alignSelf: 'flex-start' }}
                disabled={profileSaving}
              >
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          UPCOMING SCHEDULED EXAMS TAB
          ========================================== */}
      {activeTab === 'upcoming' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ marginBottom: '4px' }}>Upcoming Scheduled Exams</h2>
              <p style={{ fontSize: '14px' }}>All future examinations created by you, ordered by start date.</p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowExamModal(true)}>
              <Plus size={14} /> Schedule New Exam
            </button>
          </div>

          {upcomingLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[1,2,3].map(i => (
                <div key={i} className="exam-schedule-card">
                  <div className="skeleton skeleton-text" style={{ width: '40%', height: '18px', marginBottom: '10px' }} />
                  <div className="skeleton skeleton-text" style={{ width: '60%' }} />
                  <div className="exam-meta-grid" style={{ marginTop: '14px' }}>
                    {[1,2,3,4,5,6].map(j => (
                      <div key={j} className="skeleton skeleton-text" style={{ height: '32px' }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : upcomingExams.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Calendar size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
              <h3 style={{ marginBottom: '8px' }}>No Upcoming Examinations</h3>
              <p>No upcoming examinations scheduled. Create one using the button above.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {upcomingExams.map((exam: any) => (
                <div key={exam.id} className={`exam-schedule-card status-${exam.status}`}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: '16px' }}>{exam.title}</h3>
                        <span className={`badge ${exam.status === 'active' ? 'badge-success' : exam.status === 'completed' ? 'badge-secondary' : 'badge-info'}`}
                          style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                          {exam.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', margin: '0 0 4px' }}>{exam.subjectName}</p>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{exam.departmentName} · {exam.courseName} · Semester {exam.semester}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button className="btn btn-secondary btn-sm" title="View Details">View</button>
                      <button className="btn btn-secondary btn-sm" title="Duplicate Exam" onClick={async () => {
                        try {
                          showToast('Exam duplicated. Edit as needed.', 'success');
                        } catch { showToast('Duplicate failed.', 'error'); }
                      }}>Duplicate</button>
                    </div>
                  </div>
                  <div className="exam-meta-grid">
                    <div className="exam-meta-item">
                      <span>Start</span>
                      <span>{new Date(exam.startTime).toLocaleString()}</span>
                    </div>
                    <div className="exam-meta-item">
                      <span>End</span>
                      <span>{new Date(exam.endTime).toLocaleString()}</span>
                    </div>
                    <div className="exam-meta-item">
                      <span>Duration</span>
                      <span>{exam.duration} min</span>
                    </div>
                    <div className="exam-meta-item">
                      <span>Questions</span>
                      <span>{exam.questionCount}</span>
                    </div>
                    <div className="exam-meta-item">
                      <span>Total Marks</span>
                      <span>{exam.totalMarks}</span>
                    </div>
                    <div className="exam-meta-item">
                      <span>Subject</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exam.subjectName}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          PENDING GRADING TAB
          ========================================== */}
      {activeTab === 'grading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h2 style={{ marginBottom: '4px' }}>Pending Grading Tasks</h2>
            <p style={{ fontSize: '14px' }}>Descriptive / text-answer submissions requiring manual evaluation.</p>
          </div>

          {gradingLoading ? (
            <div className="card">
              {[1,2,3].map(i => (
                <div key={i} style={{ display: 'flex', gap: '12px', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                  <div className="skeleton skeleton-avatar" />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton skeleton-text" style={{ width: '50%' }} />
                    <div className="skeleton skeleton-text" style={{ width: '30%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : gradingTasks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <CheckCircle size={40} style={{ color: 'var(--success)', margin: '0 auto 16px' }} />
              <h3 style={{ marginBottom: '8px' }}>All Caught Up!</h3>
              <p>No pending grading tasks. All descriptive answers have been evaluated.</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--hover)' }}>
                    {['Student', 'Register No', 'Exam', 'Subject', 'Submitted', 'Pending Answers', 'Action'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gradingTasks.map((task: any) => (
                    <tr key={task.studentExamId} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '14px' }}>{task.studentName}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{task.registerNumber}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px' }}>{task.examTitle}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px' }}>{task.subjectName}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{new Date(task.submittedAt).toLocaleString()}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span className="badge badge-warning">{task.pendingAnswerCount} pending</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button className="btn btn-primary btn-sm" onClick={() => {
                          setGradingTask(task);
                          const initial: Record<string, number> = {};
                          task.answers.forEach((a: any) => { initial[a.answerId] = 0; });
                          setMarksMap(initial);
                        }}>Grade Now</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          QUESTION BANK STATISTICS TAB
          ========================================== */}
      {activeTab === 'qstats' && (() => {
        const filteredStats = statsSubjectFilter === 'all'
          ? qStats
          : qStats.filter((s: any) => s.subjectId === statsSubjectFilter);

        const totalPieData = [
          { name: 'MCQ', value: filteredStats.reduce((a: number, s: any) => a + s.mcq, 0), fill: '#2563eb' },
          { name: 'Checkbox', value: filteredStats.reduce((a: number, s: any) => a + s.checkbox, 0), fill: '#7c3aed' },
          { name: 'Text', value: filteredStats.reduce((a: number, s: any) => a + s.text, 0), fill: '#059669' }
        ].filter(d => d.value > 0);

        const diffBarData = filteredStats.map((s: any) => ({
          subject: s.subjectName.length > 14 ? s.subjectName.substring(0, 14) + '…' : s.subjectName,
          Easy: s.easy, Medium: s.medium, Hard: s.hard
        }));

        const allMonths = new Map<string, number>();
        filteredStats.forEach((s: any) => {
          s.monthly.forEach((m: any) => {
            allMonths.set(m.month, (allMonths.get(m.month) || 0) + m.count);
          });
        });
        const lineData = Array.from(allMonths.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, count]) => ({ month, count }));

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ marginBottom: '4px' }}>Question Bank Statistics</h2>
                <p style={{ fontSize: '14px' }}>Analytics grouped by subject across your question bank.</p>
              </div>
              <select className="form-control" style={{ width: 'auto', fontSize: '14px' }}
                value={statsSubjectFilter} onChange={e => setStatsSubjectFilter(e.target.value)}>
                <option value="all">All Subjects</option>
                {qStats.map((s: any) => (
                  <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>
                ))}
              </select>
            </div>

            {qStatsLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '120px' }} />)}
              </div>
            ) : qStats.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Database size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
                <h3>No Questions Yet</h3>
                <p>Add questions to your bank to see statistics.</p>
              </div>
            ) : (
              <>
                {/* Subject stat cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                  {filteredStats.map((s: any) => (
                    <div key={s.subjectId} className="card" style={{ padding: '20px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>{s.subjectName}</h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '14px' }}>Semester {s.semester}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                        <span className="stat-pill easy">Easy: {s.easy}</span>
                        <span className="stat-pill medium">Medium: {s.medium}</span>
                        <span className="stat-pill hard">Hard: {s.hard}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Total: <strong style={{ color: 'var(--text-main)' }}>{s.total}</strong></span>
                        <span style={{ color: 'var(--text-muted)' }}>Marks: <strong style={{ color: 'var(--primary)' }}>{s.totalMarks}</strong></span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <span>MCQ: {s.mcq}</span>
                        <span>·</span>
                        <span>Checkbox: {s.checkbox}</span>
                        <span>·</span>
                        <span>Text: {s.text}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Charts row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {/* Pie — type distribution */}
                  <div className="card">
                    <h4 className="card-title" style={{ marginBottom: '16px' }}>Question Type Distribution</h4>
                    {totalPieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie data={totalPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}>
                            {totalPieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <p style={{ textAlign: 'center', padding: '40px 0' }}>No data</p>}
                  </div>

                  {/* Bar — difficulty per subject */}
                  <div className="card">
                    <h4 className="card-title" style={{ marginBottom: '16px' }}>Difficulty Distribution</h4>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={diffBarData} barSize={12}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="Easy" fill="#16a34a" radius={[3,3,0,0]} />
                        <Bar dataKey="Medium" fill="#f59e0b" radius={[3,3,0,0]} />
                        <Bar dataKey="Hard" fill="#dc2626" radius={[3,3,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Line — monthly growth */}
                  <div className="card">
                    <h4 className="card-title" style={{ marginBottom: '16px' }}>Monthly Question Growth</h4>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={lineData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} name="Questions Added" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* ==========================================
          GRADING MODAL OVERLAY
          ========================================== */}
      {gradingTask && (
        <div className="modal-overlay" onClick={() => !submittingGrade && setGradingTask(null)}>
          <div className="modal-content" style={{ maxWidth: '680px', width: '95%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Grade Answers — {gradingTask.studentName}</h3>
              <button className="modal-close" onClick={() => !submittingGrade && setGradingTask(null)}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--hover)', borderRadius: 'var(--radius)', fontSize: '13px' }}>
                <strong>{gradingTask.examTitle}</strong> · {gradingTask.subjectName}<br />
                <span style={{ color: 'var(--text-muted)' }}>Submitted: {new Date(gradingTask.submittedAt).toLocaleString()}</span>
              </div>
              {gradingTask.answers.map((ans: any, idx: number) => (
                <div key={ans.answerId} className="grading-answer-row">
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Question {idx + 1}</span>
                    <p style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)', margin: '4px 0' }}>{ans.questionText}</p>
                  </div>
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px', marginBottom: '12px', fontSize: '14px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Student's Answer</span>
                    {ans.answerText || <em style={{ color: 'var(--text-muted)' }}>No answer provided</em>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 600 }}>Marks (out of {ans.maxMarks}):</label>
                    <input
                      type="number"
                      className="marks-input"
                      min={0}
                      max={ans.maxMarks}
                      value={marksMap[ans.answerId] ?? 0}
                      onChange={e => setMarksMap(prev => ({ ...prev, [ans.answerId]: Math.min(ans.maxMarks, Math.max(0, Number(e.target.value))) }))}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ {ans.maxMarks}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setGradingTask(null)} disabled={submittingGrade}>Cancel</button>
              <button className="btn btn-primary" onClick={handleGradeSubmit} disabled={submittingGrade}>
                {submittingGrade ? 'Publishing...' : 'Submit & Publish Result'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          ADD SUBJECT MODAL OVERLAY
          ========================================== */}
      {showAddSubjectModal && (
        <div className="modal-overlay" onClick={() => !addingSubject && setShowAddSubjectModal(false)}>
          <div className="modal-content" style={{ maxWidth: '480px', width: '95%' }} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleAddSubject}>
              <div className="modal-header">
                <h3 className="modal-title">Create New Subject</h3>
                <button type="button" className="modal-close" onClick={() => !addingSubject && setShowAddSubjectModal(false)}>×</button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Subject Name</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Advanced Operating Systems"
                    value={newSubName}
                    onChange={e => setNewSubName(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddSubjectModal(false)} disabled={addingSubject}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={addingSubject}>
                  {addingSubject ? 'Creating...' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



    </div>
  );
};
