import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('testhub_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.error('Error reading testhub_user from localStorage:', e);
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('testhub_token');
    } catch (e) {
      return null;
    }
  });

  const login = (newToken, newUser) => {
    localStorage.setItem('testhub_token', newToken);
    localStorage.setItem('testhub_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const updateUser = (updatedFields) => {
    setUser(prev => {
      if (!prev) return prev;
      const newObj = { ...prev, ...updatedFields };
      localStorage.setItem('testhub_user', JSON.stringify(newObj));
      return newObj;
    });
  };

  const logout = () => {
    localStorage.removeItem('testhub_token');
    localStorage.removeItem('testhub_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
