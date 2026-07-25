import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import {
  Building2, Users, BookOpen,
  CheckCircle2, UserPlus, Award
} from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalInstitutes: 0, totalTeachers: 0, totalStudents: 0, totalTests: 0 });
  const [institutes, setInstitutes] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Institute Form
  const [showInstModal, setShowInstModal] = useState(false);
  const [instName, setInstName] = useState('');
  const [instCode, setInstCode] = useState('');
  const [instCity, setInstCity] = useState('');
  const [instAdminEmail, setInstAdminEmail] = useState('');

  // New Teacher Form
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('teacher123');
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
      setStats(res.data.stats);
      setInstitutes(res.data.institutes || []);
      setTeachers(res.data.teachers || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInstitute = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      await api.post('/admin/institutes', {
        instituteName: instName,
        code: instCode,
        city: instCity,
        adminEmail: instAdminEmail
      });

      setMessage('Institute created successfully!');
      setShowInstModal(false);
      setInstName('');
      setInstCode('');
      setInstCity('');
      setInstAdminEmail('');
      fetchAdminData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating institute');
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
      setTeacherInstId('');
      fetchAdminData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error creating teacher account');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-400 text-sm">
        Loading Platform Admin Dashboard...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="glass-card p-6 rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
            Platform Master Admin
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-1">Multi-Tenant Institute Control Panel</h1>
          <p className="text-xs text-slate-400 mt-1">Manage institutions, issue teacher credentials, and monitor global SaaS activity.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInstModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-600/20 transition-all"
          >
            <Building2 className="w-4 h-4" />
            <span>Add Institute</span>
          </button>

          <button
            onClick={() => setShowTeacherModal(true)}
            className="px-4 py-2.5 rounded-xl gradient-btn text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Teacher</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <div className="glass-card p-5 rounded-xl border border-slate-800 flex items-center gap-3">
          <Building2 className="w-8 h-8 text-amber-400" />
          <div>
            <div className="text-xl font-bold text-white">{stats.totalInstitutes}</div>
            <div className="text-xs text-slate-400">Total Institutes</div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800 flex items-center gap-3">
          <Users className="w-8 h-8 text-purple-400" />
          <div>
            <div className="text-xl font-bold text-white">{stats.totalTeachers}</div>
            <div className="text-xs text-slate-400">Active Teachers</div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800 flex items-center gap-3">
          <Award className="w-8 h-8 text-indigo-400" />
          <div>
            <div className="text-xl font-bold text-white">{stats.totalStudents}</div>
            <div className="text-xs text-slate-400">Registered Students</div>
          </div>
        </div>

        <div className="glass-card p-5 rounded-xl border border-slate-800 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-emerald-400" />
          <div>
            <div className="text-xl font-bold text-white">{stats.totalTests}</div>
            <div className="text-xs text-slate-400">Generated Tests</div>
          </div>
        </div>
      </div>

      {/* Institutes Table */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800">
        <h2 className="text-base font-bold text-white mb-4">Institutions Registered</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Institute Name</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Admin Email</th>
                <th className="py-3 px-4">Teachers</th>
                <th className="py-3 px-4">Students</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {institutes.map((i) => (
                <tr key={i._id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">{i.instituteName}</td>
                  <td className="py-3 px-4 font-mono text-amber-300">{i.code}</td>
                  <td className="py-3 px-4 text-slate-300">{i.city || 'N/A'}</td>
                  <td className="py-3 px-4 text-slate-400">{i.adminEmail || 'N/A'}</td>
                  <td className="py-3 px-4 font-semibold text-purple-400">{i.totalTeachers}</td>
                  <td className="py-3 px-4 font-semibold text-indigo-400">{i.totalStudents}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800">
        <h2 className="text-base font-bold text-white mb-4">Teacher Credentials Issued</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Institute Association</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {teachers.map((t) => (
                <tr key={t._id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">{t.fullName}</td>
                  <td className="py-3 px-4 font-mono text-slate-300">{t.email}</td>
                  <td className="py-3 px-4 font-semibold text-indigo-300">{t.instituteName || 'Independent'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD INSTITUTE MODAL */}
      {showInstModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateInstitute} className="max-w-md w-full glass-card p-6 rounded-2xl border border-amber-500/30 space-y-4">
            <h3 className="text-lg font-bold text-white">Register New Institution</h3>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Institute Name</label>
              <input
                type="text"
                required
                value={instName}
                onChange={(e) => setInstName(e.target.value)}
                placeholder="e.g. Oxford Public School"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Code</label>
                <input
                  type="text"
                  required
                  value={instCode}
                  onChange={(e) => setInstCode(e.target.value)}
                  placeholder="OXF01"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">City</label>
                <input
                  type="text"
                  value={instCity}
                  onChange={(e) => setInstCity(e.target.value)}
                  placeholder="Mumbai"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Admin Email</label>
              <input
                type="email"
                value={instAdminEmail}
                onChange={(e) => setInstAdminEmail(e.target.value)}
                placeholder="admin@oxford.edu"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowInstModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold"
              >
                Create Institute
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE TEACHER MODAL */}
      {showTeacherModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateTeacher} className="max-w-md w-full glass-card p-6 rounded-2xl border border-indigo-500/30 space-y-4">
            <h3 className="text-lg font-bold text-white">Create Teacher Account</h3>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="Prof. Alan Turing"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Teacher Email</label>
              <input
                type="email"
                required
                value={teacherEmail}
                onChange={(e) => setTeacherEmail(e.target.value)}
                placeholder="turing@apex.edu"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Initial Password</label>
              <input
                type="text"
                required
                value={teacherPassword}
                onChange={(e) => setTeacherPassword(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Institute Assignment (Optional)</label>
              <select
                value={teacherInstId}
                onChange={(e) => setTeacherInstId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
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
                onClick={() => setShowTeacherModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl gradient-btn text-white text-xs font-bold"
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
