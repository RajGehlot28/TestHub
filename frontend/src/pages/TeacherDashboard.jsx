import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import {
  BookOpen, PlusCircle, Building2, Users, TrendingUp,
  Copy, Check, BarChart2, Eye
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

export const TeacherDashboard = () => {
  const { updateUser } = useAuth();
  const [teacher, setTeacher] = useState(null);
  const [stats, setStats] = useState({ totalTestsCreated: 0, totalStudentsEvaluated: 0, overallAverage: 0 });
  const [trends, setTrends] = useState([]);
  const [recentTests, setRecentTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/teacher/dashboard');
      setTeacher(res.data.teacher);
      if (res.data.teacher && res.data.teacher.instituteName) {
        updateUser({
          instituteName: res.data.teacher.instituteName,
          instituteId: res.data.teacher.instituteId
        });
      }
      setStats(res.data.stats);
      setTrends(res.data.performanceTrends || []);
      setRecentTests(res.data.recentTests || []);
    } catch (err) {
      console.error('Failed to load teacher dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyTestLink = (testCode) => {
    const fullUrl = `${window.location.origin}/test/${testCode}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedCode(testCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-500 text-sm font-medium">
        Loading Teacher Dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
              Teacher Workspace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Welcome back, {teacher?.fullName}
          </h1>

          {/* Institute Info Banner */}
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 inline-flex">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>Associated Institute:</span>
            <span className="font-bold text-slate-900">
              {teacher?.instituteName || 'Independent Teacher (No Institute Association)'}
            </span>
          </div>
        </div>

        <Link
          to="/teacher/create-test"
          className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 transition-all self-start md:self-auto"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Create New Test</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{stats.totalTestsCreated}</div>
            <div className="text-xs text-slate-500 font-medium">Total Tests Created</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{stats.totalStudentsEvaluated}</div>
            <div className="text-xs text-slate-500 font-medium">Students Evaluated</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{stats.overallAverage}%</div>
            <div className="text-xs text-slate-500 font-medium">Overall Student Avg %</div>
          </div>
        </div>
      </div>

      {/* Analytics Graph */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              <span>Student Performance Trends (Student Avg %)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">Average score percentage achieved by students per assessment.</p>
          </div>
        </div>

        {trends.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="testName" stroke="#64748b" tick={{ fill: '#475569', fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fill: '#475569', fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', color: '#0f172a' }}
                  formatter={(val) => [`${val}%`, 'Average Score']}
                />
                <Area type="monotone" dataKey="averagePercentage" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorAvg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200">
            No student evaluations recorded yet. Create and share tests to view performance analytics.
          </div>
        )}
      </div>

      {/* Tests Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">Your Assessments & History</h2>
          <span className="text-xs text-slate-500 font-medium">{recentTests.length} Total Tests</span>
        </div>

        {recentTests.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Test Name & Code</th>
                  <th className="py-3.5 px-4">Institute Scope</th>
                  <th className="py-3.5 px-4">Questions</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Students Taken</th>
                  <th className="py-3.5 px-4">Average %</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700">
                {recentTests.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{t.testName}</div>
                      <div className="font-mono text-[10px] text-indigo-600 font-bold">Code: {t.testCode}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                        t.instituteName
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      }`}>
                        <Building2 className="w-3 h-3" />
                        {t.instituteName || 'Open (All Institutes)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold">{t.totalQuestions} Qs ({t.maxMarks} marks)</td>
                    <td className="py-3.5 px-4 text-slate-600">{t.duration} mins</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{t.totalStudentsTaken}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-indigo-700">{t.averagePercentage}%</span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => copyTestLink(t.testCode)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors inline-flex items-center gap-1 text-[11px] font-semibold"
                        title="Copy Shareable Link"
                      >
                        {copiedCode === t.testCode ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => navigate(`/teacher/tests/${t._id}/results`)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors inline-flex items-center gap-1 text-[11px] font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Results</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-xs">
            No tests created yet. Click "Create New Test" above to generate your first PDF assessment.
          </div>
        )}
      </div>
    </div>
  );
};
