import React, { useState, useEffect } from 'react';
import { 
  Clock, Plus, ShieldAlert, History, RefreshCw, AlertCircle, 
  CheckCircle2, User, Search, AlertTriangle, FileText
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';

interface ActiveSession {
  studentExamId: string;
  studentId: string;
  studentName: string;
  registerNumber: string;
  collegeName: string;
  examId: string;
  examTitle: string;
  startedAt: string;
  deadline: string;
  remainingSeconds: number;
  totalExtensionMinutes: number;
}

interface ExtensionRecord {
  id: string;
  studentName: string;
  registerNumber: string;
  examTitle: string;
  extensionMinutes: number;
  originalDeadline: string;
  newDeadline: string;
  reason: string | null;
  grantedByName: string;
  grantedByRole: string;
  createdAt: string;
}

interface Props {
  userRole: 'admin' | 'faculty';
}

export const ActiveInvigilationExtensions: React.FC<Props> = ({ userRole }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'sessions' | 'history'>('sessions');
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [history, setHistory] = useState<ExtensionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extension Modal State
  const [extendingSession, setExtendingSession] = useState<ActiveSession | null>(null);
  const [selectedMinutes, setSelectedMinutes] = useState<5 | 10>(5);
  const [extensionReason, setExtensionReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const apiPrefix = userRole === 'faculty' ? '/faculty' : '/admin';

  const fetchActiveSessions = async () => {
    try {
      const res = await api.get(`${apiPrefix}/exams/active-sessions`);
      setSessions(res.data || []);
    } catch (err: any) {
      console.error('Failed to fetch active exam sessions:', err);
      showToast(err.response?.data?.message || 'Failed to load active sessions', 'error');
    }
  };

  const fetchExtensionHistory = async () => {
    try {
      const res = await api.get(`${apiPrefix}/exams/extensions`);
      setHistory(res.data || []);
    } catch (err: any) {
      console.error('Failed to fetch extension history:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    if (activeTab === 'sessions') {
      await fetchActiveSessions();
    } else {
      await fetchExtensionHistory();
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // Poll active sessions every 15 seconds
    const interval = setInterval(() => {
      if (activeTab === 'sessions') {
        fetchActiveSessions();
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleGrantExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendingSession) return;

    setIsSubmitting(true);
    try {
      const res = await api.post(`${apiPrefix}/exams/extend-time`, {
        studentExamId: extendingSession.studentExamId,
        extensionMinutes: selectedMinutes,
        reason: extensionReason.trim() || undefined
      });

      showToast(
        `Successfully granted +${selectedMinutes} minutes to ${extendingSession.studentName}`,
        'success'
      );
      setExtendingSession(null);
      setExtensionReason('');
      await fetchActiveSessions();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to grant test time extension', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format seconds into MM:SS
  const formatRemainingTime = (totalSeconds: number) => {
    if (totalSeconds <= 0) return 'Expired / Submitting';
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const filteredSessions = sessions.filter(s => 
    s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.registerNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.examTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredHistory = history.filter(h => 
    h.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.registerNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    h.examTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="card space-y-5">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="card-title text-lg font-bold" style={{ margin: 0 }}>
              Live Invigilation & Additional Test Time Extensions
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Authorize and audit authoritative +5m or +10m time extensions for candidates facing technical disruptions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-border p-1 bg-muted/40">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'sessions' 
                  ? 'bg-card text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Active Sessions ({sessions.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'history' 
                  ? 'bg-card text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Extension Audit Log
            </button>
          </div>

          <button
            onClick={loadData}
            title="Refresh"
            className="p-2 text-muted-foreground hover:text-foreground rounded-lg border border-border hover:bg-muted/40 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search student, reg no, or exam..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Active Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="table-responsive">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Register No</th>
                <th>Assessment</th>
                <th>Started At</th>
                <th>Server Deadline</th>
                <th>Time Remaining</th>
                <th>Extensions</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSessions.map((session) => (
                <tr key={session.studentExamId}>
                  <td style={{ fontWeight: 600 }}>{session.studentName}</td>
                  <td><code>{session.registerNumber}</code></td>
                  <td>{session.examTitle}</td>
                  <td>{new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="font-mono text-xs">
                    {new Date(session.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td>
                    <span className={`badge ${session.remainingSeconds < 300 ? 'badge-danger' : 'badge-warning'}`}>
                      {formatRemainingTime(session.remainingSeconds)}
                    </span>
                  </td>
                  <td>
                    {session.totalExtensionMinutes > 0 ? (
                      <span className="badge badge-primary">
                        +{session.totalExtensionMinutes}m
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">None</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setExtendingSession(session);
                          setSelectedMinutes(5);
                        }}
                        className="btn btn-sm btn-outline-primary text-xs px-2.5 py-1"
                        title="Extend 5 Minutes"
                      >
                        +5 Min
                      </button>
                      <button
                        onClick={() => {
                          setExtendingSession(session);
                          setSelectedMinutes(10);
                        }}
                        className="btn btn-sm btn-primary text-xs px-2.5 py-1"
                        title="Extend 10 Minutes"
                      >
                        +10 Min
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSessions.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                    {loading ? 'Refreshing active sessions...' : 'No active test sessions found in progress.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Extension History Audit Tab */}
      {activeTab === 'history' && (
        <div className="table-responsive">
          <table className="enterprise-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Student</th>
                <th>Assessment</th>
                <th>Extension</th>
                <th>Original Deadline</th>
                <th>New Deadline</th>
                <th>Authorized By</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((item) => (
                <tr key={item.id}>
                  <td className="text-xs text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                  <td>
                    <div className="font-semibold text-foreground">{item.studentName}</div>
                    <code className="text-[11px]">{item.registerNumber}</code>
                  </td>
                  <td>{item.examTitle}</td>
                  <td>
                    <span className="badge badge-success font-bold">
                      +{item.extensionMinutes} mins
                    </span>
                  </td>
                  <td className="font-mono text-xs text-muted-foreground">
                    {new Date(item.originalDeadline).toLocaleTimeString()}
                  </td>
                  <td className="font-mono text-xs font-semibold text-foreground">
                    {new Date(item.newDeadline).toLocaleTimeString()}
                  </td>
                  <td>
                    <span className="text-xs font-medium text-foreground">{item.grantedByName}</span>
                    <span className="block text-[11px] text-muted-foreground uppercase">{item.grantedByRole}</span>
                  </td>
                  <td className="text-xs max-w-xs truncate" title={item.reason || 'None'}>
                    {item.reason || <span className="text-muted-foreground italic">Standard invigilation</span>}
                  </td>
                </tr>
              ))}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                    {loading ? 'Loading audit records...' : 'No time extension audit logs found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Grant Time Extension Modal */}
      {extendingSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-2 text-foreground font-bold text-lg">
              <Clock className="w-5 h-5 text-primary" />
              Authorize Test Time Extension
            </div>

            <p className="text-xs text-muted-foreground">
              Granting additional time updates the authoritative server deadline immediately and synchronizes the candidate's timer in real-time.
            </p>

            <div className="p-3 rounded-lg border border-border bg-muted/30 text-xs space-y-1">
              <div><span className="text-muted-foreground">Candidate:</span> <strong className="text-foreground">{extendingSession.studentName}</strong> ({extendingSession.registerNumber})</div>
              <div><span className="text-muted-foreground">Assessment:</span> <span className="font-medium text-foreground">{extendingSession.examTitle}</span></div>
              <div><span className="text-muted-foreground">Current Deadline:</span> <span className="font-mono font-medium">{new Date(extendingSession.deadline).toLocaleTimeString()}</span></div>
            </div>

            <form onSubmit={handleGrantExtension} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Extension Duration</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedMinutes(5)}
                    className={`py-2 text-sm font-semibold rounded-lg border transition-all ${
                      selectedMinutes === 5 
                        ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/30' 
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    +5 Minutes
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMinutes(10)}
                    className={`py-2 text-sm font-semibold rounded-lg border transition-all ${
                      selectedMinutes === 10 
                        ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/30' 
                        : 'border-border bg-card text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    +10 Minutes
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Reason for Extension (Optional)
                </label>
                <textarea
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  placeholder="e.g., Power interruption, browser crash, network reconnection..."
                  rows={2}
                  className="w-full text-xs rounded-lg border border-border bg-background p-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setExtendingSession(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Granting...' : `Confirm +${selectedMinutes}m Extension`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

