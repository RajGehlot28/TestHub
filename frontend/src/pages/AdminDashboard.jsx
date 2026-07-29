import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import {
  Building2, Users, BookOpen,
  CheckCircle2, UserPlus, Award, AlertCircle
} from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalInstitutes: 0, totalTeachers: 0, totalStudents: 0, totalTests: 0 });
  const [institutes, setInstitutes] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Teacher Form
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [teacherInstId, setTeacherInstId] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setStats(res.data.stats || { totalInstitutes: 0, totalTeachers: 0, totalStudents: 0, totalTests: 0 });
      setInstitutes(res.data.institutes || []);
      setTeachers(res.data.teachers || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      await api.post('/admin/teachers', {
        email: teacherEmail,
        password: teacherPassword,
        fullName: teacherName,
        instituteId: teacherInstId || null
      });

      setMessage('Teacher account created successfully!');
      setShowTeacherModal(false);
      setTeacherEmail('');
      setTeacherName('');
      setTeacherPassword('');
      setTeacherInstId('');
      fetchAdminData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating teacher account');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-500 text-sm font-medium">
        Loading Platform Admin Dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Multi-Tenant Control Panel</h1>
          <p className="text-xs text-slate-600 mt-1">Issue teacher credentials and monitor platform activity.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { setError(''); setShowTeacherModal(true); }}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Teacher</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{stats.totalInstitutes}</div>
            <div className="text-xs font-medium text-slate-500">Total Institutes</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{stats.totalTeachers}</div>
            <div className="text-xs font-medium text-slate-500">Active Teachers</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{stats.totalStudents}</div>
            <div className="text-xs font-medium text-slate-500">Registered Students</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{stats.totalTests}</div>
            <div className="text-xs font-medium text-slate-500">Generated Tests</div>
          </div>
        </div>
      </div>

      {/* Institutes Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4">Institutions Registered ({institutes.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Institute Name</th>
                <th className="py-3 px-4">Teachers</th>
                <th className="py-3 px-4">Students</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {institutes.length === 0 ? (
                <tr>
                  <td colSpan="3" className="py-6 text-center text-slate-500">No institutions registered yet.</td>
                </tr>
              ) : (
                institutes.map((i) => (
                  <tr key={i._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{i.instituteName}</td>
                    <td className="py-3.5 px-4 font-bold text-purple-700">{i.totalTeachers}</td>
                    <td className="py-3.5 px-4 font-bold text-indigo-700">{i.totalStudents}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4">Teacher Credentials Issued ({teachers.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Institute Association</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan="3" className="py-6 text-center text-slate-500">No teacher accounts issued yet.</td>
                </tr>
              ) : (
                teachers.map((t) => (
                  <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{t.fullName}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{t.email}</td>
                    <td className="py-3.5 px-4 font-semibold text-indigo-600">{t.instituteName || 'Independent'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE TEACHER MODAL */}
      {showTeacherModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateTeacher} className="max-w-md w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Create Teacher Account</h3>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="Prof. Alan Turing"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Teacher Email</label>
              <input
                type="email"
                required
                value={teacherEmail}
                onChange={(e) => setTeacherEmail(e.target.value)}
                placeholder="turing@apex.edu"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password</label>
              <input
                type="text"
                required
                value={teacherPassword}
                onChange={(e) => setTeacherPassword(e.target.value)}
                placeholder="teacher123"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs font-mono placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Institute Assignment (Optional)</label>
              <select
                value={teacherInstId}
                onChange={(e) => setTeacherInstId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-indigo-600 transition-colors"
              >
                <option value="">No Institute / Independent Teacher</option>
                {institutes.map((i) => (
                  <option key={i._id} value={i._id}>{i.instituteName}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setShowTeacherModal(false); setError(''); }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
