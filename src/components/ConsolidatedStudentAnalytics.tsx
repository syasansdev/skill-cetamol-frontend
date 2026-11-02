import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Award, TrendingUp, AlertTriangle, BookOpen, 
  Search, Filter, Download, ArrowUpRight, CheckCircle2,
  Calendar, Building, ChevronRight, X, Clock, BarChart3,
  Mail, GraduationCap
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface ConsolidatedKPIData {
  totalStudents: number;
  totalAssessments: number;
  completedAssessments: number;
  averageStudentScore: number;
  studentsNeedingImprovement: number;
  categoryDistribution: {
    category: string;
    count: number;
    color: string;
  }[];
  subjectPerformance: {
    subject: string;
    averageScore: number;
    testCount: number;
  }[];
  studentRecords: StudentRecord[];
}

interface StudentRecord {
  id: string;
  name: string;
  registerNumber: string;
  email: string;
  collegeName: string;
  departmentName: string;
  testsCompleted: number;
  averageScore: number;
  highestScore: number;
  performanceCategory: 'Exceptional' | 'Good' | 'Average' | 'Needs Improvement';
  lastActive: string | null;
}

interface StudentProfile {
  student: {
    id: string;
    name: string;
    registerNumber: string;
    email: string;
    college: string;
    department: string;
  };
  metrics: {
    totalTests: number;
    averageScore: number;
    highestScore: number;
    performanceCategory: string;
    averageTimePerQuestion: number;
  };
  assessments: {
    resultId: string;
    examTitle: string;
    subject: string;
    score: number;
    percentage: number;
    category: string;
    date: string;
    timeSpentSeconds: number;
  }[];
  subjectBreakdown: {
    subject: string;
    averageScore: number;
    testsTaken: number;
  }[];
}

interface Props {
  userRole?: string;
  userCollegeId?: string | null;
}

export const ConsolidatedStudentAnalytics: React.FC<Props> = ({ userRole, userCollegeId }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<ConsolidatedKPIData | null>(null);

  // Filter States
  const [colleges, setColleges] = useState<{ id: string; name: string }[]>([]);
  const [exams, setExams] = useState<{ id: string; title: string }[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  
  const [selectedCollege, setSelectedCollege] = useState<string>('all');
  const [selectedExam, setSelectedExam] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Drilldown Profile State
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);

  // Fetch initial filter metadata
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [collegesRes, examsRes] = await Promise.all([
          api.get('/admin/colleges').catch(() => ({ data: [] })),
          api.get('/admin/exams').catch(() => ({ data: [] }))
        ]);
        setColleges(collegesRes.data || []);
        setExams(examsRes.data || []);
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch Consolidated Analytics Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedCollege !== 'all') params.collegeId = selectedCollege;
      if (selectedExam !== 'all') params.examId = selectedExam;
      if (selectedSubject !== 'all') params.subject = selectedSubject;
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/admin/analytics/consolidated', { params });
      setData(res.data);

      // Extract unique subjects
      if (res.data?.subjectPerformance) {
        const subs = res.data.subjectPerformance.map((s: any) => s.subject);
        setSubjects(Array.from(new Set(subs)));
      }
    } catch (err: any) {
      console.error('Failed to load consolidated analytics:', err);
      showToast(err.response?.data?.message || 'Failed to load consolidated analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchData();
  }, [selectedCollege, selectedExam, selectedSubject, selectedCategory, startDate, endDate]);

  // Fetch Drilldown Student Profile
  const handleOpenStudentProfile = async (studentId: string) => {
    setSelectedStudentId(studentId);
    setProfileLoading(true);
    try {
      const res = await api.get(`/admin/analytics/student/${studentId}`);
      setStudentProfile(res.data);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load student profile', 'error');
      setSelectedStudentId(null);
    } finally {
      setProfileLoading(false);
    }
  };

  // Filter student records by search
  const filteredStudents = useMemo(() => {
    if (!data?.studentRecords) return [];
    if (!searchTerm.trim()) return data.studentRecords;
    const term = searchTerm.toLowerCase();
    return data.studentRecords.filter(s => 
      s.name.toLowerCase().includes(term) || 
      s.registerNumber.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term) ||
      (s.collegeName && s.collegeName.toLowerCase().includes(term))
    );
  }, [data?.studentRecords, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredStudents.length) return;
    const headers = ['Student Name', 'Register Number', 'College', 'Department', 'Tests Completed', 'Average Score %', 'Highest Score %', 'Classification', 'Last Active'];
    const rows = filteredStudents.map(s => [
      `"${s.name}"`,
      `"${s.registerNumber}"`,
      `"${s.collegeName || '-'}"`,
      `"${s.departmentName || '-'}"`,
      s.testsCompleted,
      `${s.averageScore}%`,
      `${s.highestScore}%`,
      `"${s.performanceCategory}"`,
      `"${s.lastActive ? new Date(s.lastActive).toLocaleDateString() : 'Never'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student_performance_consolidated_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Student performance data exported successfully', 'success');
  };

  const normalizeTier = (category?: string | null): { key: string; emoji: string; color: string; badgeClass: string } => {
    if (!category) return { key: 'Developing', emoji: '📈', color: '#f59e0b', badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/30' };
    const lower = category.toLowerCase().trim();
    if (lower === 'exceptional' || lower === 'outstanding') {
      return { key: 'Outstanding', emoji: '🌟', color: '#10b981', badgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' };
    }
    if (lower === 'good' || lower === 'proficient') {
      return { key: 'Proficient', emoji: '🎯', color: '#3b82f6', badgeClass: 'bg-blue-500/10 text-blue-500 border-blue-500/30' };
    }
    if (lower === 'competent') {
      return { key: 'Competent', emoji: '✅', color: '#06b6d4', badgeClass: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30' };
    }
    if (lower === 'average' || lower === 'developing') {
      return { key: 'Developing', emoji: '📈', color: '#f59e0b', badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/30' };
    }
    if (lower.includes('need') || lower.includes('improv')) {
      return { key: 'Needs Improvement', emoji: '⚠️', color: '#ef4444', badgeClass: 'bg-rose-500/10 text-rose-500 border-rose-500/30' };
    }
    return { key: category, emoji: '📊', color: '#94a3b8', badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/30' };
  };

  const getCategoryBadgeClass = (category: string) => {
    return normalizeTier(category).badgeClass;
  };

  const CATEGORY_COLORS: Record<string, string> = {
    'Outstanding': '#10b981',
    'Proficient': '#3b82f6',
    'Competent': '#06b6d4',
    'Developing': '#f59e0b',
    'Needs Improvement': '#ef4444',
    'Exceptional': '#10b981',
    'Good': '#3b82f6',
    'Average': '#f59e0b'
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Consolidated Student Performance Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Institution-wide assessment performance analytics, student classification, and at-risk academic support.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={!filteredStudents.length}
            className="btn btn-secondary btn-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={fetchData}
            className="btn btn-primary btn-sm"
          >
            <BarChart3 className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '20px', margin: 0 }}>
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground" style={{ marginBottom: '14px' }}>
          <Filter className="w-4 h-4 text-primary" />
          Filter Analytics
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '14px' }}>
          {/* College Filter (Visible for Super Admin or when user has no collegeId lock) */}
          {(!userCollegeId || userRole === 'admin') && colleges.length > 0 && (
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>Institution</label>
              <select
                value={selectedCollege}
                onChange={(e) => setSelectedCollege(e.target.value)}
                className="form-control"
                style={{ padding: '8px 12px', fontSize: '13px' }}
              >
                <option value="all">All Institutions</option>
                {colleges.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Exam Filter */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>Assessment</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="form-control"
              style={{ padding: '8px 12px', fontSize: '13px' }}
            >
              <option value="all">All Assessments</option>
              {exams.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.title}</option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="form-control"
              style={{ padding: '8px 12px', fontSize: '13px' }}
            >
              <option value="all">All Subjects</option>
              {subjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Performance Category Filter */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>Classification</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-control"
              style={{ padding: '8px 12px', fontSize: '13px' }}
            >
              <option value="all">All Categories</option>
              <option value="Outstanding">🌟 Outstanding (90-100%)</option>
              <option value="Proficient">🎯 Proficient (75-89%)</option>
              <option value="Competent">✅ Competent (60-74%)</option>
              <option value="Developing">📈 Developing (40-59%)</option>
              <option value="Needs Improvement">⚠️ Needs Improvement (&lt;40%)</option>
            </select>
          </div>

          {/* Date Start */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-control"
              style={{ padding: '8px 12px', fontSize: '13px' }}
            />
          </div>

          {/* Date End */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-control"
              style={{ padding: '8px 12px', fontSize: '13px' }}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {/* Total Students */}
        <div className="stat-card">
          <div className="stat-icon" style={{ color: 'var(--primary)', backgroundColor: 'rgba(37, 99, 235, 0.15)' }}>
            <Users size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Students</span>
            <span className="stat-value">{loading ? '...' : (data?.totalStudents ?? 0)}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Enrolled in scope</span>
          </div>
        </div>

        {/* Total Assessments */}
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#0ea5e9', backgroundColor: 'rgba(14, 165, 233, 0.15)' }}>
            <BookOpen size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Assessments</span>
            <span className="stat-value">{loading ? '...' : (data?.totalAssessments ?? 0)}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Scheduled or active</span>
          </div>
        </div>

        {/* Completed Assessments */}
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Completed Tests</span>
            <span className="stat-value">{loading ? '...' : (data?.completedAssessments ?? 0)}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Evaluated submissions</span>
          </div>
        </div>

        {/* Average Student Score */}
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#a855f7', backgroundColor: 'rgba(168, 85, 247, 0.15)' }}>
            <TrendingUp size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Average Score</span>
            <span className="stat-value">{loading ? '...' : `${data?.averageStudentScore ?? 0}%`}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Across all completed tests</span>
          </div>
        </div>

        {/* Students Needing Improvement */}
        <div className="stat-card">
          <div className="stat-icon" style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.15)' }}>
            <AlertTriangle size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label" style={{ color: '#ef4444' }}>Needs Improvement</span>
            <span className="stat-value" style={{ color: '#ef4444' }}>{loading ? '...' : (data?.studentsNeedingImprovement ?? 0)}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Require academic support</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Performance Classification Distribution (Donut Chart) */}
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between" style={{ minHeight: '390px' }}>
          <div>
            <h3 className="text-base font-semibold text-foreground mb-1">Performance Classification Distribution</h3>
            <p className="text-xs text-muted-foreground mb-4">Breakdown of students across the five performance tiers</p>
          </div>
          
          {data?.categoryDistribution && data.categoryDistribution.some(c => c.count > 0) ? (
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryDistribution}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {data.categoryDistribution.map((entry, index) => {
                      const t = normalizeTier(entry.category);
                      return <Cell key={`cell-${index}`} fill={t.color} />;
                    })}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any, name: any) => {
                      const t = normalizeTier(name);
                      return [`${val} students`, `${t.emoji} ${t.key}`];
                    }}
                    contentStyle={{ backgroundColor: 'var(--bg-card, #1e293b)', borderColor: 'var(--border, #334155)', borderRadius: '8px', fontSize: '12px', color: '#f8fafc' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={40} 
                    formatter={(val) => {
                      const t = normalizeTier(val);
                      return <span style={{ fontSize: '12px', color: 'var(--text-main, #f8fafc)', margin: '0 6px' }}>{t.emoji} {t.key}</span>;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground text-sm" style={{ height: '300px' }}>
              <BarChart3 className="w-8 h-8 opacity-40 mb-2" />
              No completed assessment records found for this filter criteria.
            </div>
          )}
        </div>

        {/* Subject-Wise Performance Comparison */}
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-between" style={{ minHeight: '390px' }}>
          <div>
            <h3 className="text-base font-semibold text-foreground mb-1">Subject-Wise Average Performance</h3>
            <p className="text-xs text-muted-foreground mb-4">Average student percentage scores by subject curriculum</p>
          </div>

          {data?.subjectPerformance && data.subjectPerformance.length > 0 ? (
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.subjectPerformance} margin={{ top: 10, right: 15, left: -10, bottom: 65 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                  <XAxis 
                    dataKey="subject" 
                    tick={{ fontSize: 11, fill: 'var(--text-muted, #94a3b8)' }} 
                    angle={-20} 
                    textAnchor="end"
                    interval={0}
                    height={65}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted, #94a3b8)' }} />
                  <Tooltip 
                    formatter={(val: any) => [`${val}%`, 'Average Score']}
                    contentStyle={{ backgroundColor: 'var(--bg-card, #1e293b)', borderColor: 'var(--border, #334155)', borderRadius: '8px', fontSize: '12px', color: '#f8fafc' }}
                  />
                  <Bar dataKey="averageScore" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Average Score %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground text-sm" style={{ height: '300px' }}>
              <BarChart3 className="w-8 h-8 opacity-40 mb-2" />
              No subject performance data available.
            </div>
          )}
        </div>
      </div>

      {/* Student Performance Table & At-Risk Section */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-muted/20">
          <div>
            <h3 className="text-base font-semibold text-foreground">Individual Student Performance Directory</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review student-level performance metrics, test completions, and open detailed student profiles.
            </p>
          </div>
          <div style={{ position: 'relative', width: '100%', maxWidth: '280px', flexShrink: 0 }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #94a3b8)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search student or reg no..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="form-control"
              style={{ paddingLeft: '38px', height: '38px', fontSize: '13px', width: '100%' }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                <th className="py-3 px-4" style={{ minWidth: '180px' }}>Student</th>
                <th className="py-3 px-4" style={{ minWidth: '130px' }}>Register Number</th>
                <th className="py-3 px-4" style={{ minWidth: '220px' }}>Institution</th>
                <th className="py-3 px-4" style={{ minWidth: '200px' }}>Department</th>
                <th className="py-3 px-4 text-center" style={{ minWidth: '100px' }}>Tests Completed</th>
                <th className="py-3 px-4 text-center" style={{ minWidth: '100px' }}>Average Score</th>
                <th className="py-3 px-4 text-center" style={{ minWidth: '100px' }}>Highest Score</th>
                <th className="py-3 px-4 text-center" style={{ minWidth: '140px' }}>Classification</th>
                <th className="py-3 px-4 text-right" style={{ minWidth: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedStudents.map((st) => (
                <tr key={st.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-foreground" style={{ fontSize: '13px' }}>{st.name}</div>
                    <div className="text-[11px] text-muted-foreground" style={{ marginTop: '2px' }}>{st.email}</div>
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-foreground">
                    <code style={{ fontSize: '12px', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px', color: 'var(--primary, #38bdf8)' }}>
                      {st.registerNumber}
                    </code>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                    {st.collegeName || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                    {st.departmentName || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-foreground" style={{ fontSize: '13px' }}>
                    {st.testsCompleted}
                  </td>
                  <td className="py-3 px-4 text-center font-bold" style={{ fontSize: '13px', color: st.averageScore >= 75 ? '#10b981' : st.averageScore >= 50 ? '#f59e0b' : '#ef4444' }}>
                    {st.averageScore}%
                  </td>
                  <td className="py-3 px-4 text-center text-muted-foreground" style={{ fontSize: '12px' }}>
                    {st.highestScore}%
                  </td>
                  <td className="py-3 px-4 text-center">
                    {(() => {
                      const tier = normalizeTier(st.performanceCategory);
                      return (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${tier.badgeClass}`}>
                          <span>{tier.emoji}</span>
                          <span>{tier.key}</span>
                        </span>
                      );
                    })()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleOpenStudentProfile(st.id)}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '5px 10px' }}
                    >
                      View Profile
                      <ChevronRight size={13} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted-foreground">
                    {loading ? 'Loading student performance data...' : 'No matching student records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls Bar */}
        {filteredStudents.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderTop: '1px solid var(--border)',
            flexWrap: 'wrap',
            gap: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)'
          }}>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Showing <span style={{ fontWeight: 600, color: 'var(--text-main, #f8fafc)' }}>
                {(currentPage - 1) * pageSize + 1}
              </span> to <span style={{ fontWeight: 600, color: 'var(--text-main, #f8fafc)' }}>
                {Math.min(currentPage * pageSize, filteredStudents.length)}
              </span> of <span style={{ fontWeight: 600, color: 'var(--text-main, #f8fafc)' }}>
                {filteredStudents.length}
              </span> students
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="form-control"
                  style={{ padding: '4px 8px', height: '32px', fontSize: '12px', width: 'auto' }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '4px 8px', height: '32px', opacity: currentPage === 1 ? 0.4 : 1 }}
                  title="First Page"
                >
                  «
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '4px 10px', height: '32px', opacity: currentPage === 1 ? 0.4 : 1 }}
                  title="Previous Page"
                >
                  ‹
                </button>

                {getPageNumbers().map((p, idx) => (
                  typeof p === 'number' ? (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(p)}
                      className={`btn btn-sm ${currentPage === p ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ minWidth: '32px', height: '32px', padding: '0 8px', fontWeight: currentPage === p ? 700 : 500 }}
                    >
                      {p}
                    </button>
                  ) : (
                    <span key={idx} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>...</span>
                  )
                ))}

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '4px 10px', height: '32px', opacity: (currentPage === totalPages || totalPages === 0) ? 0.4 : 1 }}
                  title="Next Page"
                >
                  ›
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '4px 8px', height: '32px', opacity: (currentPage === totalPages || totalPages === 0) ? 0.4 : 1 }}
                  title="Last Page"
                >
                  »
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drill-down Student Profile Modal */}
      {selectedStudentId && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedStudentId(null);
              setStudentProfile(null);
            }
          }}
        >
          <div 
            className="rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border"
            style={{
              backgroundColor: 'var(--bg-card, #1e293b)',
              borderColor: 'var(--border, #334155)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)'
            }}
          >
            {profileLoading || !studentProfile ? (
              <div className="py-24 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mb-4"></div>
                <p className="text-sm font-medium">Loading comprehensive student profile...</p>
              </div>
            ) : (
              <>
                {/* Profile Header */}
                <div 
                  className="p-6 border-b flex items-start justify-between gap-4"
                  style={{ 
                    borderColor: 'var(--border, #334155)', 
                    backgroundColor: 'rgba(15, 23, 42, 0.55)' 
                  }}
                >
                  <div className="flex items-center gap-4">
                    {/* Student Initials Avatar */}
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-lg flex-shrink-0"
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                        boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                        border: '1px solid rgba(255, 255, 255, 0.15)'
                      }}
                    >
                      {studentProfile.student?.name
                        .split(' ')
                        .filter(Boolean)
                        .map(n => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase() || 'ST'}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-2xl font-bold tracking-tight text-white">
                          {studentProfile.student?.name}
                        </h3>
                        {(() => {
                          const t = normalizeTier(studentProfile.metrics?.performanceCategory || (studentProfile as any).summary?.overallCategory);
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${t.badgeClass}`}>
                              <span>{t.emoji}</span>
                              <span>{t.key}</span>
                            </span>
                          );
                        })()}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                        <span 
                          className="font-mono font-medium px-2.5 py-0.5 rounded text-[11px] border"
                          style={{ 
                            backgroundColor: 'rgba(51, 65, 85, 0.5)', 
                            borderColor: 'var(--border, #334155)',
                            color: '#f8fafc' 
                          }}
                        >
                          Reg No: {studentProfile.student.registerNumber}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <Mail className="w-3.5 h-3.5 text-blue-400 opacity-90" />
                          {studentProfile.student.email}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-0.5">
                        <span className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {studentProfile.student?.college || (studentProfile.student as any)?.collegeName || 'N/A'}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                          {studentProfile.student?.department || (studentProfile.student as any)?.departmentName || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={() => { setSelectedStudentId(null); setStudentProfile(null); }}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-white transition-all flex-shrink-0 cursor-pointer border hover:border-slate-500"
                    style={{ 
                      backgroundColor: 'rgba(51, 65, 85, 0.4)',
                      borderColor: 'var(--border, #334155)'
                    }}
                    title="Close Profile"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Scrollable Content Body */}
                <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                  {/* Metrics Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* Tests Taken */}
                    <div 
                      className="p-4 rounded-xl border flex flex-col justify-between transition-all hover:border-blue-500/50 hover:shadow-md"
                      style={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.5)', 
                        borderColor: 'var(--border, #334155)' 
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Tests Taken</span>
                        <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                          <BookOpen className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                          {studentProfile.metrics?.totalTests ?? (studentProfile as any).summary?.totalTests ?? 0}
                        </div>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">Completed exams</span>
                      </div>
                    </div>

                    {/* Average Score */}
                    <div 
                      className="p-4 rounded-xl border flex flex-col justify-between transition-all hover:border-emerald-500/50 hover:shadow-md"
                      style={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.5)', 
                        borderColor: 'var(--border, #334155)' 
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Average Score</span>
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                          {studentProfile.metrics?.averageScore ?? (studentProfile as any).summary?.averageScore ?? 0}%
                        </div>
                        <span className="text-[11px] text-emerald-400 font-medium mt-0.5 block">Overall accuracy</span>
                      </div>
                    </div>

                    {/* Highest Score */}
                    <div 
                      className="p-4 rounded-xl border flex flex-col justify-between transition-all hover:border-amber-500/50 hover:shadow-md"
                      style={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.5)', 
                        borderColor: 'var(--border, #334155)' 
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Highest Score</span>
                        <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                          <Award className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                          {studentProfile.metrics?.highestScore ?? (studentProfile as any).summary?.highestScore ?? 0}%
                        </div>
                        <span className="text-[11px] text-amber-400 font-medium mt-0.5 block">Peak performance</span>
                      </div>
                    </div>

                    {/* Avg Time / Q */}
                    <div 
                      className="p-4 rounded-xl border flex flex-col justify-between transition-all hover:border-purple-500/50 hover:shadow-md"
                      style={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.5)', 
                        borderColor: 'var(--border, #334155)' 
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Avg Time / Q</span>
                        <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                          <Clock className="w-4 h-4" />
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                          {(studentProfile.metrics?.averageTimePerQuestion ?? (studentProfile as any).summary?.averageTimePerQuestionSeconds ?? 0) > 0 ? `${studentProfile.metrics?.averageTimePerQuestion ?? (studentProfile as any).summary?.averageTimePerQuestionSeconds}s` : 'N/A'}
                        </div>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">Pacing speed</span>
                      </div>
                    </div>
                  </div>

                  {/* Assessment History Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        Completed Assessments
                      </h4>
                      <span 
                        className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full border"
                        style={{ 
                          backgroundColor: 'rgba(51, 65, 85, 0.4)', 
                          borderColor: 'var(--border, #334155)',
                          color: 'var(--text-muted, #94a3b8)' 
                        }}
                      >
                        {studentProfile.assessments.length} {studentProfile.assessments.length === 1 ? 'Assessment' : 'Assessments'}
                      </span>
                    </div>

                    <div 
                      className="overflow-x-auto rounded-xl border shadow-sm"
                      style={{ 
                        borderColor: 'var(--border, #334155)',
                        backgroundColor: 'rgba(15, 23, 42, 0.3)'
                      }}
                    >
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr 
                            className="border-b text-slate-400 font-semibold text-[11px] uppercase tracking-wider"
                            style={{ 
                              borderColor: 'var(--border, #334155)', 
                              backgroundColor: 'rgba(15, 23, 42, 0.7)' 
                            }}
                          >
                            <th className="py-3 px-4">Assessment Title</th>
                            <th className="py-3 px-4">Subject</th>
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-4 text-center">Score</th>
                            <th className="py-3 px-4 text-center">Classification</th>
                            <th className="py-3 px-4 text-right">Time Spent</th>
                          </tr>
                        </thead>
                        <tbody 
                          className="divide-y"
                          style={{ borderColor: 'var(--border, #334155)' }}
                        >
                          {studentProfile.assessments.map((a) => (
                            <tr 
                              key={a.resultId} 
                              className="hover:bg-slate-800/40 transition-colors"
                            >
                              <td className="py-3.5 px-4 font-semibold text-white">
                                {a.examTitle}
                              </td>
                              <td className="py-3.5 px-4 text-slate-300">
                                {a.subject}
                              </td>
                              <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                                {new Date(a.date).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span 
                                  className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold border"
                                  style={{
                                    backgroundColor: a.percentage >= 75 ? 'rgba(16, 185, 129, 0.15)' :
                                                     a.percentage >= 60 ? 'rgba(59, 130, 246, 0.15)' :
                                                     a.percentage >= 50 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                                    borderColor: a.percentage >= 75 ? 'rgba(16, 185, 129, 0.3)' :
                                                 a.percentage >= 60 ? 'rgba(59, 130, 246, 0.3)' :
                                                 a.percentage >= 50 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(244, 63, 94, 0.3)',
                                    color: a.percentage >= 75 ? '#34d399' :
                                           a.percentage >= 60 ? '#60a5fa' :
                                           a.percentage >= 50 ? '#fbbf24' : '#f87171'
                                  }}
                                >
                                  {a.percentage}%
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                {(() => {
                                  const t = normalizeTier(a.category);
                                  return (
                                    <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-semibold border ${t.badgeClass}`}>
                                      <span>{t.emoji}</span>
                                      <span>{t.key}</span>
                                    </span>
                                  );
                                })()}
                              </td>
                              <td className="py-3.5 px-4 text-right text-slate-400 font-mono">
                                {Math.floor(a.timeSpentSeconds / 60)}m {a.timeSpentSeconds % 60}s
                              </td>
                            </tr>
                          ))}
                          {studentProfile.assessments.length === 0 && (
                            <tr>
                              <td colSpan={6} className="py-10 text-center text-slate-400">
                                No completed assessments found for this student.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Subject Mastery Breakdown */}
                  {studentProfile.subjectBreakdown.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-primary" />
                          Subject Mastery Breakdown
                        </h4>
                        <span className="text-xs text-slate-400">
                          Curriculum Competency
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {studentProfile.subjectBreakdown.map((sb) => {
                          const scoreColor = 
                            sb.averageScore >= 75 ? '#10b981' :
                            sb.averageScore >= 60 ? '#3b82f6' :
                            sb.averageScore >= 50 ? '#f59e0b' : '#f43f5e';

                          return (
                            <div 
                              key={sb.subject} 
                              className="p-4 rounded-xl border flex flex-col justify-between transition-all hover:border-slate-500/50"
                              style={{ 
                                backgroundColor: 'rgba(15, 23, 42, 0.5)', 
                                borderColor: 'var(--border, #334155)' 
                              }}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2.5">
                                <div>
                                  <span className="font-semibold text-white text-xs block">
                                    {sb.subject}
                                  </span>
                                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                                    {sb.testsTaken} assessment{sb.testsTaken !== 1 ? 's' : ''} completed
                                  </span>
                                </div>
                                <span 
                                  className="font-bold text-xs px-2.5 py-1 rounded-lg border text-right flex-shrink-0"
                                  style={{
                                    color: scoreColor,
                                    borderColor: `${scoreColor}40`,
                                    backgroundColor: `${scoreColor}1a`
                                  }}
                                >
                                  {sb.averageScore}%
                                </span>
                              </div>

                              {/* Visual Progress Bar */}
                              <div className="mt-1">
                                <div 
                                  className="w-full h-2 rounded-full overflow-hidden"
                                  style={{ backgroundColor: 'rgba(51, 65, 85, 0.6)' }}
                                >
                                  <div 
                                    className="h-full rounded-full transition-all duration-500 ease-out"
                                    style={{ 
                                      width: `${Math.min(Math.max(sb.averageScore, 0), 100)}%`,
                                      backgroundColor: scoreColor 
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div 
                  className="p-4 px-6 border-t flex items-center justify-between"
                  style={{ 
                    borderColor: 'var(--border, #334155)', 
                    backgroundColor: 'rgba(15, 23, 42, 0.7)' 
                  }}
                >
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Student Profile Record:</span>
                    <span className="font-mono text-white font-medium">{studentProfile.student.registerNumber}</span>
                  </div>

                  <button
                    onClick={() => { setSelectedStudentId(null); setStudentProfile(null); }}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all cursor-pointer shadow-md hover:brightness-110 active:scale-95 flex items-center gap-1.5"
                    style={{ 
                      backgroundColor: '#2563eb',
                      border: '1px solid #3b82f6'
                    }}
                  >
                    Close Profile
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

