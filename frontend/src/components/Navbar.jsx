import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { BrainCircuit, LogOut, Building2, PlusCircle } from 'lucide-react';


export const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login-student');
  };

  const handleCreateTestClick = (e) => {
    e.preventDefault();
    if (window.location.pathname === '/teacher/create-test') {
      navigate('/teacher/create-test', { state: { reset: Date.now() }, replace: true });
    } else {
      navigate('/teacher/create-test');
    }
  };

  return (
    <nav className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to={
              isAuthenticated && user
                ? user.role === 'admin' ? '/admin/dashboard'
                : user.role === 'teacher' ? '/teacher/dashboard'
                : '/student/dashboard'
                : '/'
            }
            className="flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">Test<span className="text-indigo-600">Hub</span></span>
            </div>
          </Link>

          {/* Navigation Items */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Role Specific Actions */}
              {user.role === 'teacher' && (
                <>
                  <button
                    onClick={handleCreateTestClick}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Create Test
                  </button>
                </>
              )}


              {/* Institute Badge (Students & Teachers only) */}
              {user.role !== 'admin' && (
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{user.instituteName || 'No Institute Assigned'}</span>
                </div>
              )}

              {/* User Profile */}
              <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center font-bold text-xs">
                  {(user?.name || user?.fullName || user?.email || 'U')[0].toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-slate-900">{user?.name || user?.fullName || user?.email || 'User'}</div>
                  <div className="text-[10px] text-slate-500 capitalize font-medium">{user?.role}</div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login-student"
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Student Portal
              </Link>
              <Link
                to="/login-teacher"
                className="text-xs font-semibold px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                Teacher Portal
              </Link>
              <Link
                to="/login-admin"
                className="text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg hover:bg-amber-100 transition-colors"
              >
                Admin Portal
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
