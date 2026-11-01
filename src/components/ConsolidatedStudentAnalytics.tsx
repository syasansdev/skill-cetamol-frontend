import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Award, TrendingUp, AlertTriangle, BookOpen, 
  Search, Filter, Download, ArrowUpRight, CheckCircle2,
  Calendar, Building, ChevronRight, X, Clock, BarChart3
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

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Exceptional': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800';
      case 'Good': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800';
      case 'Average': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800';
      default: return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800';
    }
  };

  const CATEGORY_COLORS: Record<string, string> = {
    'Exceptional': '#10b981',
    'Good': '#3b82f6',
    'Average': '#f59e0b',
    'Needs Improvement': '#f43f5e'
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
              <option value="Exceptional">Exceptional (90-100%)</option>
              <option value="Good">Good (75-89%)</option>
              <option value="Average">Average (50-74%)</option>
              <option value="Needs Improvement">Needs Improvement (&lt;50%)</option>
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

      {/* KPI Cards (Feature 7) */}
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
        <div className="stat-card" style={{ borderLeft: '3px solid #ef4444' }}>
          <div className="stat-icon" style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.15)' }}>
            <AlertTriangle size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label" style={{ color: '#ef4444' }}>Need Improvement</span>
            <span className="stat-value" style={{ color: '#ef4444' }}>{loading ? '...' : (data?.studentsNeedingImprovement ?? 0)}</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Require academic support</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Classification Distribution (Donut Chart) */}
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm">
          <h3 className="text-base font-semibold text-foreground mb-1">Performance Classification Distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">Breakdown of students across the four performance tiers</p>
          
          {data?.categoryDistribution && data.categoryDistribution.some(c => c.count > 0) ? (
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.categoryDistribution}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {data.categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.category] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: any, name: any) => [`${val} students`, name]}
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    formatter={(val) => <span style={{ fontSize: '12px', color: 'var(--foreground)' }}>{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-sm">
              <BarChart3 className="w-8 h-8 opacity-40 mb-2" />
              No completed assessment records found for this filter criteria.
            </div>
          )}
        </div>

        {/* Subject-Wise Performance Comparison */}
        <div className="p-5 rounded-xl border border-border bg-card shadow-sm">
          <h3 className="text-base font-semibold text-foreground mb-1">Subject-Wise Average Performance</h3>
          <p className="text-xs text-muted-foreground mb-4">Average student percentage scores by subject curriculum</p>

          {data?.subjectPerformance && data.subjectPerformance.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.subjectPerformance} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis 
                    dataKey="subject" 
                    tick={{ fontSize: 11 }} 
                    angle={-20} 
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    formatter={(val: any) => [`${val}%`, 'Average Score']}
                    contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="averageScore" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Average Score %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground text-sm">
              <BarChart3 className="w-8 h-8 opacity-40 mb-2" />
              No subject performance data available.
            </div>
          )}
        </div>
      </div>

      {/* Student Performance Table & At-Risk Section */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-muted/20">
          <div>
            <h3 className="text-base font-semibold text-foreground">Individual Student Performance Directory</h3>
            <p className="text-xs text-muted-foreground">
              Review student-level performance metrics, test completions, and open detailed student profiles.
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search student or reg no..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Register Number</th>
                <th className="py-3 px-4">Institution</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Tests Completed</th>
                <th className="py-3 px-4 text-center">Average Score</th>
                <th className="py-3 px-4 text-center">Highest Score</th>
                <th className="py-3 px-4 text-center">Classification</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredStudents.map((st) => (
                <tr key={st.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-foreground">{st.name}</div>
                    <div className="text-[11px] text-muted-foreground">{st.email}</div>
                  </td>
                  <td className="py-3 px-4 font-mono font-medium text-foreground">
                    {st.registerNumber}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {st.collegeName || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {st.departmentName || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-foreground">
                    {st.testsCompleted}
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-foreground">
                    {st.averageScore}%
                  </td>
                  <td className="py-3 px-4 text-center text-muted-foreground">
                    {st.highestScore}%
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getCategoryBadgeClass(st.performanceCategory)}`}>
                      {st.performanceCategory}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleOpenStudentProfile(st.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      View Profile
                      <ChevronRight className="w-3 h-3" />
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
      </div>

      {/* Drill-down Student Profile Modal */}
      {selectedStudentId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
            <button
              onClick={() => { setSelectedStudentId(null); setStudentProfile(null); }}
              className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {profileLoading || !studentProfile ? (
              <div className="py-16 text-center text-muted-foreground">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                <p>Loading student profile and assessment history...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-foreground">{studentProfile.student.name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getCategoryBadgeClass(studentProfile.metrics.performanceCategory)}`}>
                        {studentProfile.metrics.performanceCategory}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Reg No: <span className="font-mono font-medium text-foreground">{studentProfile.student.registerNumber}</span> • {studentProfile.student.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {studentProfile.student.college} • {studentProfile.student.department}
                    </p>
                  </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg border border-border bg-muted/20">
                    <span className="text-[11px] text-muted-foreground uppercase font-semibold">Tests Taken</span>
                    <p className="text-xl font-bold text-foreground mt-1">{studentProfile.metrics.totalTests}</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-muted/20">
                    <span className="text-[11px] text-muted-foreground uppercase font-semibold">Average Score</span>
                    <p className="text-xl font-bold text-foreground mt-1">{studentProfile.metrics.averageScore}%</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-muted/20">
                    <span className="text-[11px] text-muted-foreground uppercase font-semibold">Highest Score</span>
                    <p className="text-xl font-bold text-foreground mt-1">{studentProfile.metrics.highestScore}%</p>
                  </div>
                  <div className="p-3 rounded-lg border border-border bg-muted/20">
                    <span className="text-[11px] text-muted-foreground uppercase font-semibold">Avg Time / Q</span>
                    <p className="text-xl font-bold text-foreground mt-1">
                      {studentProfile.metrics.averageTimePerQuestion > 0 ? `${studentProfile.metrics.averageTimePerQuestion}s` : 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Assessment History Table */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2">Completed Assessments</h4>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                          <th className="py-2.5 px-3">Assessment Title</th>
                          <th className="py-2.5 px-3">Subject</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3 text-center">Score</th>
                          <th className="py-2.5 px-3 text-center">Classification</th>
                          <th className="py-2.5 px-3 text-right">Time Spent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {studentProfile.assessments.map((a) => (
                          <tr key={a.resultId} className="hover:bg-muted/30">
                            <td className="py-2.5 px-3 font-semibold text-foreground">{a.examTitle}</td>
                            <td className="py-2.5 px-3 text-muted-foreground">{a.subject}</td>
                            <td className="py-2.5 px-3 text-muted-foreground">{new Date(a.date).toLocaleDateString()}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-foreground">{a.percentage}%</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getCategoryBadgeClass(a.category)}`}>
                                {a.category}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right text-muted-foreground">
                              {Math.floor(a.timeSpentSeconds / 60)}m {a.timeSpentSeconds % 60}s
                            </td>
                          </tr>
                        ))}
                        {studentProfile.assessments.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-muted-foreground">
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
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">Subject Mastery Breakdown</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {studentProfile.subjectBreakdown.map((sb) => (
                        <div key={sb.subject} className="p-3 rounded-lg border border-border bg-card flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-foreground text-xs">{sb.subject}</span>
                            <p className="text-[11px] text-muted-foreground">{sb.testsTaken} assessment{sb.testsTaken !== 1 ? 's' : ''}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-sm text-foreground">{sb.averageScore}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

