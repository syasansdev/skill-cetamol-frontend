import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTheme } from '../contexts/ThemeContext';
import { Lock, Mail, User, BookOpen, GraduationCap, CheckCircle, Shield, Eye, EyeOff, Sun, Moon, Search } from 'lucide-react';
import api from '../services/api';
import { 
  ENGINEERING_COURSES, 
  ARTS_AND_SCIENCE_COURSES, 
  getProgramsByCategory,
  getCollegesByCategory,
  filterValidColleges,
  isExclusivelyEngineeringCollege,
  isExclusivelyArtsCollege
} from '../data/academicPrograms';

export const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [isForgotPassword, setIsForgotPassword] = useState<boolean>(false);
  const [forgotEmailSent, setForgotEmailSent] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<'student' | 'faculty'>('student');
  
  // Student registration details
  const [colleges, setColleges] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'Engineering' | 'Arts & Science' | ''>('');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedDeptName, setSelectedDeptName] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [collegeSearchTerm, setCollegeSearchTerm] = useState<string>('');
  const [courseSearchTerm, setCourseSearchTerm] = useState<string>('');
  const [registerNumber, setRegisterNumber] = useState<string>('');
  const currentYear = new Date().getFullYear();
  const [academicYear, setAcademicYear] = useState<number>(1);
  const [startYear, setStartYear] = useState<number>(currentYear);
  const [endYear, setEndYear] = useState<number>(currentYear + 4);

  const handleAcademicYearChange = (yearNum: number) => {
    setAcademicYear(yearNum);
    const newStart = currentYear - (yearNum - 1);
    setStartYear(newStart);
    setEndYear(newStart + 4);
  };

  const handleStartYearChange = (newStart: number) => {
    setStartYear(newStart);
    setEndYear(newStart + 4);
    const calculatedYear = Math.min(4, Math.max(1, (currentYear - newStart) + 1));
    setAcademicYear(calculatedYear);
  };

  // Available colleges filtered by the selected stream / category, showing all valid colleges if not selected yet
  const availableColleges = useMemo(() => {
    if (!selectedCategory) return colleges;
    return getCollegesByCategory(colleges, selectedCategory);
  }, [colleges, selectedCategory]);

  const filteredColleges = useMemo(() => {
    if (!collegeSearchTerm.trim()) return availableColleges;
    const term = collegeSearchTerm.toLowerCase();
    return availableColleges.filter(c =>
      (c.collegeName || c.name || '').toLowerCase().includes(term) ||
      (c.code || '').toLowerCase().includes(term)
    );
  }, [availableColleges, collegeSearchTerm]);

  const selectedCollege = useMemo(() => {
    return colleges.find(c => c.id === selectedCollegeId);
  }, [colleges, selectedCollegeId]);

  // Available courses strictly computed from the selected category
  const availableCourses = useMemo(() => {
    if (!selectedCategory) return [];
    return getProgramsByCategory(selectedCategory);
  }, [selectedCategory]);

  const filteredCourses = useMemo(() => {
    if (!courseSearchTerm.trim()) return availableCourses;
    const term = courseSearchTerm.toLowerCase();
    return availableCourses.filter(c => c.toLowerCase().includes(term));
  }, [availableCourses, courseSearchTerm]);

  useEffect(() => {
    const fetchAcademicData = async () => {
      try {
        const metaRes = await api.get('/auth/academic-metadata');
        if (metaRes.data) {
          const rawCols = metaRes.data.colleges || [];
          const colList = filterValidColleges(rawCols);
          const deptList = metaRes.data.departments || [];
          const crsList = metaRes.data.courses || [];
          
          setColleges(colList);
          setDepartments(deptList);
          setCourses(crsList);
        }
      } catch (err) {
        console.error('Failed to load academic data for registration dropdowns:', err);
      }
    };
    if (!isLogin) {
      fetchAcademicData();
    }
  }, [isLogin]);

  // Reset college selection only if category changes and the selected college belongs strictly to the other category
  useEffect(() => {
    if (selectedCategory && selectedCollegeId) {
      const validColleges = getCollegesByCategory(colleges, selectedCategory);
      const isCurrentValid = validColleges.some(c => c.id === selectedCollegeId);
      if (!isCurrentValid) {
        setSelectedCollegeId('');
        setCollegeSearchTerm('');
      }
    }
  }, [selectedCategory, colleges]);

  const handleCollegeSelect = (colId: string) => {
    setSelectedCollegeId(colId);
    if (!selectedCategory && colId) {
      const chosen = colleges.find(c => c.id === colId);
      if (chosen) {
        const name = chosen.collegeName || chosen.name || '';
        if (isExclusivelyEngineeringCollege(name)) {
          setSelectedCategory('Engineering');
        } else if (isExclusivelyArtsCollege(name)) {
          setSelectedCategory('Arts & Science');
        }
      }
    }
  };

  // Reset department selection if category changes and the selected course is not in the new category
  useEffect(() => {
    if (selectedCategory) {
      const validCourses = getProgramsByCategory(selectedCategory);
      if (!validCourses.includes(selectedDeptName)) {
        setSelectedDeptName('');
        setSelectedDeptId('');
      }
    } else {
      setSelectedDeptName('');
      setSelectedDeptId('');
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedDeptId) {
      const filtered = courses.filter(c => c.departmentId === selectedDeptId);
      if (filtered.length > 0) {
        setSelectedCourseId(filtered[0].id);
      } else {
        setSelectedCourseId('');
      }
    }
  }, [selectedDeptId, courses]);
  
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // New Magic Code states (no longer used for login, only for password resets)
  const [loginMode, setLoginMode] = useState<'password' | 'magicCode'>('password');
  const [magicCodeSent, setMagicCodeSent] = useState<boolean>(false);
  const [magicCode, setMagicCode] = useState<string>('');

  // Password reset with code states
  const [resettingWithCode, setResettingWithCode] = useState<boolean>(false);
  const [resetCode, setResetCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');

  // Password visibility
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const { theme, toggleTheme } = useTheme();

  // Photo upload states
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);

  const { login, register, requestMagicCode, loginWithMagicCode } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Sync loginMode with role selection
  useEffect(() => {
    setLoginMode('password');
    setMagicCodeSent(false);
    setMagicCode('');
  }, [role, isLogin]);

  // Alert user if redirected due to expired session
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('expired') === 'true') {
      showToast('Your session has expired. Please sign in again.', 'warning');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [showToast]);


  const handleRequestMagicCode = async () => {
    if (!email) {
      showToast('Please enter your email address.', 'warning');
      return;
    }
    setLoading(true);
    try {
      await requestMagicCode(email);
      setMagicCodeSent(true);
    } catch (err) {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setUploadingPhoto(true);

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await api.post('/auth/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPhotoUrl(response.data.url);
      showToast('Profile photo uploaded successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to upload photo.', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast('Please enter your email address.', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.isStudent) {
        showToast(res.data.message || 'Verification code sent to your email.', 'success');
        setResettingWithCode(true);
      } else {
        showToast(res.data.message || 'Password reset link sent to your email.', 'success');
        setForgotEmailSent(true);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to request password reset.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetWithCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode || !newPassword || !confirmNewPassword) {
      showToast('All fields are required.', 'warning');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'warning');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast('Passwords do not match.', 'warning');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email,
        code: resetCode,
        password: newPassword
      });
      showToast('Password has been reset successfully! Please sign in.', 'success');
      setIsForgotPassword(false);
      setResettingWithCode(false);
      setForgotEmailSent(false);
      setResetCode('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Password reset failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const loggedUser = await login((email || '').trim(), (password || '').trim());
        navigate(`/${loggedUser.role}/dashboard`);
      } else {
        // Registering
        if (role === 'student') {
          if (!selectedCategory) {
            showToast('Please select your Stream / Category (Engineering or Arts & Science).', 'warning');
            setLoading(false);
            return;
          }
          if (!selectedCollegeId) {
            showToast('Please select your College / Institution.', 'warning');
            setLoading(false);
            return;
          }
          if (!selectedDeptName.trim() && !selectedDeptId) {
            showToast('Please select your Department / Branch from the dropdown.', 'warning');
            setLoading(false);
            return;
          }
          if (!registerNumber) {
            showToast('Please enter your Register Number.', 'warning');
            setLoading(false);
            return;
          }
          if (!startYear || !endYear || endYear <= startYear) {
            showToast('Please provide valid Batch Start and End Years.', 'warning');
            setLoading(false);
            return;
          }
        }

        const batchStr = `${startYear}-${endYear}`;
        const regData = {
          name,
          email,
          password: password,
          role: 'student',
          collegeId: selectedCollegeId,
          category: selectedCategory,
          departmentId: selectedDeptName.trim() || selectedDeptId,
          departmentName: selectedDeptName.trim() || selectedDeptId,
          courseId: selectedCourseId || undefined,
          registerNumber,
          year: academicYear,
          academicYear,
          startYear,
          endYear,
          batch: batchStr,
          yearOfPassing: String(endYear),
          photoUrl: undefined
        };

        await register(regData);
        setIsLogin(true);
        setRole('student');
        setLoginMode('password');
        setMagicCodeSent(false);
        setMagicCode('');
      }
    } catch (err) {
      // Handled by context toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
      {/* Left split screen - Premium Branding illustration */}
      <div className="login-visual-panel" style={{
        flex: 1.2,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '60px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow Effects */}
        <div style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}></div>

        <div className="login-brand" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <img src="/logo.jpeg" alt="Logo" style={{ width: '56px', height: '56px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '26px', fontWeight: 800, letterSpacing: '-0.025em', color: '#ffffff', lineHeight: 1.2 }}>
                SkillCetamol Exam Portal
              </span>
              <span style={{ fontSize: '17px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.02em', lineHeight: 1.3 }}>
                A PRODUCT OF SYASAN’S CAREER ANALYTICS TECHNOLOGY SOLUTIONS PVT LTD.
              </span>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '480px', margin: 'auto 0' }}>
          <h1 style={{ color: '#ffffff', fontSize: '38px', lineHeight: 1.2, fontWeight: 800, marginBottom: '20px', letterSpacing: '-0.03em' }}>
            Enterprise Evaluation, Built for Scale.
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '16px', lineHeight: 1.6, marginBottom: '40px' }}>
            A unified dashboard for university administration, secure question banks, responsive grading workflows, and detailed learner performance analysis.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px', borderRadius: '6px', color: '#3b82f6' }}>
                <Shield size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>Distraction-Free Exam Interface</h4>
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>Secure, full-screen examination console with auto-save and timing safeguards.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px', borderRadius: '6px', color: '#10b981' }}>
                <CheckCircle size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>Immediate Score Analytics</h4>
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>Visual performance graphs, subject-wise analytics, and rank indexing.</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px' }}>
          <span>System Version 2.4.0</span>
          <span>Security Protocol v1.8</span>
        </div>
      </div>

      {/* Right split screen - Login Form Card */}
      <div className="login-form-panel" style={{
        flex: 1,
        backgroundColor: 'var(--bg-sidebar)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px',
        overflowY: 'auto',
        position: 'relative'
      }}>
        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: '8px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--hover)',
            width: '36px',
            height: '36px'
          }}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>
              {isForgotPassword ? 'Reset Password' : isLogin ? 'Sign in to platform' : 'Create Student Account'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
              {isForgotPassword 
                ? 'Enter your registered email to receive a password reset link.'
                : isLogin 
                  ? 'Enter your credentials to access the examination portal' 
                  : 'Submit details for registration approval'
              }
            </p>
          </div>

          {/* Role Tabs */}
          {isLogin && (
            <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: '24px' }}>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '12px',
                  fontWeight: 600,
                  border: 'none',
                  background: 'transparent',
                  borderBottom: role === 'student' ? '2px solid var(--primary)' : 'none',
                  color: role === 'student' ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
                onClick={() => setRole('student')}
              >
                Student Portal
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: '12px',
                  fontWeight: 600,
                  border: 'none',
                  background: 'transparent',
                  borderBottom: role === 'faculty' ? '2px solid var(--primary)' : 'none',
                  color: role === 'faculty' ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
                onClick={() => setRole('faculty')}
              >
                Faculty / Admin
              </button>
            </div>
          )}
          {isForgotPassword ? (
            resettingWithCode ? (
              <form onSubmit={handleResetWithCodeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">6-Digit Verification Code</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      className="form-control"
                      style={{ paddingLeft: '36px', letterSpacing: '4px', textAlign: 'center', fontWeight: 'bold' }}
                      placeholder="123456"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="form-control"
                      style={{ paddingLeft: '36px', paddingRight: '40px' }}
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '10px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0
                      }}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="form-control"
                      style={{ paddingLeft: '36px' }}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                  {loading ? 'Updating Password...' : 'Reset Password'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <a href="#" style={{ fontSize: '14px', fontWeight: 600 }} onClick={(e) => { e.preventDefault(); setResettingWithCode(false); }}>
                    Cancel & Try Again
                  </a>
                </div>
              </form>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      required
                      className="form-control"
                      style={{ paddingLeft: '36px' }}
                      placeholder="name@university.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {forgotEmailSent && (
                  <div style={{ fontSize: '13px', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: 'var(--radius)', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
                    Password reset link sent! Check your inbox.
                  </div>
                )}

                <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                  {loading ? 'Processing...' : 'Send Reset Link'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <a href="#" style={{ fontSize: '14px', fontWeight: 600 }} onClick={(e) => { e.preventDefault(); setIsForgotPassword(false); setForgotEmailSent(false); }}>
                    Back to Sign In
                  </a>
                </div>
              </form>
            )
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {!isLogin && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    required
                    className="form-control"
                    style={{ paddingLeft: '36px' }}
                    placeholder="Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  required
                  className="form-control"
                  style={{ paddingLeft: '36px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Password Field (when registering, or when password login mode is active) */}
            {(!isLogin || loginMode === 'password') && (
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!isLogin || loginMode === 'password'}
                    className="form-control"
                    style={{ paddingLeft: '36px', paddingRight: '40px' }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    data-testid="toggle-password"
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '10px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0
                    }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Registration Additional Fields */}
            {!isLogin && (
              <>
                <div className="form-group">
                  <label className="form-label">Stream / Category</label>
                  <select
                    className="form-control"
                    required
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value as any);
                      setSelectedCollegeId('');
                      setCollegeSearchTerm('');
                      setSelectedDeptId('');
                      setSelectedDeptName('');
                      setCourseSearchTerm('');
                    }}
                  >
                    <option value="">Select Stream / Category</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Arts & Science">Arts & Science</option>
                  </select>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Choose whether you belong to Engineering or Arts & Science.
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">College / Institution</label>
                  
                  <div style={{ position: 'relative', marginBottom: '8px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="form-control"
                      style={{ paddingLeft: '32px', fontSize: '12px', height: '34px' }}
                      placeholder={selectedCategory ? `Quick search ${selectedCategory} colleges...` : "Quick search all colleges..."}
                      value={collegeSearchTerm}
                      onChange={(e) => setCollegeSearchTerm(e.target.value)}
                    />
                  </div>

                  <select
                    className="form-control"
                    required
                    value={selectedCollegeId}
                    onChange={(e) => handleCollegeSelect(e.target.value)}
                  >
                    <option value="">
                      {selectedCategory 
                        ? `-- Select ${selectedCategory} College / Institution (${filteredColleges.length} Available) --` 
                        : `-- Select College / Institution (${filteredColleges.length} Available) --`}
                    </option>
                    {filteredColleges.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.collegeName} {c.code ? `(${c.code})` : ''}
                      </option>
                    ))}
                  </select>

                  {selectedCollege ? (
                    <span style={{ fontSize: '12px', color: '#10b981', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={14} /> Selected: <strong>{selectedCollege.collegeName}</strong> {selectedCollege.code ? `(${selectedCollege.code})` : ''}
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      {selectedCategory 
                        ? `Select your affiliated ${selectedCategory} college / institution.` 
                        : 'Choose your college from the list or search by name.'}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Department / Branch</label>
                  
                  {selectedCategory && (
                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                      <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        className="form-control"
                        style={{ paddingLeft: '32px', fontSize: '12px', height: '34px' }}
                        placeholder="Quick search branch / program..."
                        value={courseSearchTerm}
                        onChange={(e) => setCourseSearchTerm(e.target.value)}
                      />
                    </div>
                  )}

                  <select
                    className="form-control"
                    required
                    disabled={!selectedCategory}
                    value={selectedDeptName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedDeptName(val);
                      setSelectedDeptId(val);
                    }}
                  >
                    <option value="">
                      {!selectedCategory 
                        ? 'Please select Stream / Category first' 
                        : `-- Select ${selectedCategory} Department / Branch --`}
                    </option>
                    {filteredCourses.map((crs, idx) => (
                      <option key={`${crs}-${idx}`} value={crs}>
                        {crs}
                      </option>
                    ))}
                  </select>

                  {selectedDeptName ? (
                    <span style={{ fontSize: '12px', color: '#10b981', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={14} /> Selected: <strong>{selectedDeptName}</strong>
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      {selectedCategory 
                        ? `Select your official ${selectedCategory} branch.` 
                        : 'Select Stream / Category above to view available branches.'}
                    </span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Register Number</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. REG-123456"
                    value={registerNumber}
                    onChange={(e) => setRegisterNumber(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Academic Year (1 to 4)</label>
                  <select
                    className="form-control"
                    required
                    value={academicYear}
                    onChange={(e) => handleAcademicYearChange(parseInt(e.target.value))}
                  >
                    <option value={1}>Year 1 (1st Year)</option>
                    <option value={2}>Year 2 (2nd Year)</option>
                    <option value={3}>Year 3 (3rd Year)</option>
                    <option value={4}>Year 4 (4th Year)</option>
                  </select>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Select your current year of study (1 to 4).
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Batch Duration</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Start Year</label>
                      <input
                        type="number"
                        min="2015"
                        max="2035"
                        required
                        className="form-control"
                        value={startYear}
                        onChange={(e) => handleStartYearChange(parseInt(e.target.value) || currentYear)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>End Year</label>
                      <input
                        type="number"
                        min={startYear + 1}
                        max={startYear + 10}
                        required
                        className="form-control"
                        value={endYear}
                        onChange={(e) => setEndYear(parseInt(e.target.value) || (startYear + 4))}
                      />
                    </div>
                  </div>
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    borderRadius: 'var(--radius)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    fontSize: '12px',
                    color: 'var(--primary-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span><strong>Batch:</strong> {startYear} - {endYear}</span>
                    <span><strong>Academic:</strong> Year {academicYear} (Semester {academicYear * 2 - 1} & {academicYear * 2})</span>
                  </div>
                </div>
              </>
            )}

            {isLogin && loginMode === 'password' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                <label className="checkbox-group">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                  <span>Remember me</span>
                </label>
                <a href="#" onClick={(e) => { e.preventDefault(); setIsForgotPassword(true); }} style={{ fontWeight: 500 }}>
                  Forgot password?
                </a>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Submit Registration')}
            </button>
          </form>
          )}

          {!isForgotPassword && (
            <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px' }}>
              <span style={{ color: 'var(--text-muted)' }}>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
              </span>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setIsLogin(!isLogin);
                }}
                style={{ fontWeight: 600 }}
              >
                {isLogin ? 'Register Student Portal' : 'Login Credentials'}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
