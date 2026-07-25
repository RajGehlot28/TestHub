import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import {
  Building2, TrendingUp, BookOpen, ArrowRight, Eye
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [stats, setStats] = useState({ totalTestsTaken: 0, averagePercentage: 0 });
  const [trends, setTrends] = useState([]);
  const [recentResults, setRecentResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Quick test link input box
  const [quickTestCode, setQuickTestCode] = useState('');

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const res = await api.get('/student/dashboard');
      setStudent(res.data.student);
      setStats(res.data.stats);
      setTrends(res.data.performanceTrends || []);
      setRecentResults(res.data.recentResults || []);
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTestByCode = (e) => {
    e.preventDefault();
    if (!quickTestCode.trim()) return;
    const cleanCode = quickTestCode.trim().toUpperCase();
    navigate(`/test/${cleanCode}`);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-500 text-sm font-medium">
        Loading Student Dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
              Student Workspace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Welcome back, {student?.name}
          </h1>

          {/* Institute Info Banner */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-700">
            <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Registered Institute:</span>
              <span className="font-bold text-slate-900">{student?.instituteName || user?.instituteName || 'No Institute Assigned'}</span>
            </div>
            <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-600">
              Roll No: <span className="font-mono text-slate-900 font-bold">{student?.rollNo}</span>
            </div>
          </div>
        </div>

        {/* Enter Test Code Quick Form */}
        <form onSubmit={handleJoinTestByCode} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 shrink-0">
          <input
            type="text"
            placeholder="Enter Test Code (e.g. APEX101)"
            value={quickTestCode}
            onChange={(e) => setQuickTestCode(e.target.value)}
            className="px-3 py-2 bg-white rounded-lg border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none w-48 font-mono"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
          >
            <span>Start Test</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{stats.totalTestsTaken}</div>
            <div className="text-xs text-slate-500 font-medium">Completed Assessments</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{stats.averagePercentage}%</div>
            <div className="text-xs text-slate-500 font-medium">Personal Average Score %</div>
          </div>
        </div>
      </div>

      {/* Personal Score Trend Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Personal Performance Trend</h2>
            <p className="text-xs text-slate-500 mt-1">Percentage score trajectory across completed tests.</p>
          </div>
        </div>

        {trends.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="testName" stroke="#64748b" tick={{ fill: '#475569', fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fill: '#475569', fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', color: '#0f172a' }}
                  formatter={(val) => [`${val}%`, 'Score']}
                />
                <Line type="monotone" dataKey="percentage" stroke="#4f46e5" strokeWidth={2} dot={{ r: 4, fill: '#4f46e5' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200">
            No test scores recorded yet. Click a test link provided by your teacher to take an assessment.
          </div>
        )}
      </div>

      {/* Test History */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Completed Tests History</h2>

        {recentResults.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Submitted Date</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4">Institute Scope</th>
                  <th className="py-3 px-4 text-right">Review Answers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {recentResults.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {new Date(r.submittedAt || r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{r.totalMarksObtained} / {r.maxMarks}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        r.percentage >= 75 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        r.percentage >= 50 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {r.percentage}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{r.instituteName || 'Open Assessment'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => navigate(`/student/results/${r._id}`)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Breakdown</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-xs">
            No completed tests found.
          </div>
        )}
      </div>
    </div>
  );
};
