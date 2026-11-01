import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { User, Student, Faculty } from '../types';
import { useToast } from './ToastContext';
import { cleanPhotoUrl } from '../utils/imageHelper';

interface AuthContextType {
  user: User | Student | Faculty | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | Student | Faculty>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  updateCurrentUser: (userData: User | Student | Faculty) => void;
  requestMagicCode: (email: string) => Promise<any>;
  loginWithMagicCode: (email: string, magicCode: string) => Promise<User | Student | Faculty>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | Student | Faculty | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  useEffect(() => {
    // Check if token and user exist in localStorage
    const savedToken = localStorage.getItem('exam_token');
    const savedUser = localStorage.getItem('exam_current_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      const parsed = JSON.parse(savedUser);
      if (parsed) {
        parsed.photoUrl = cleanPhotoUrl(parsed.photoUrl);
      }
      setUser(parsed);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: loggedInUser, token: authToken } = response.data;
      
      const cleanedUser = { ...loggedInUser, photoUrl: cleanPhotoUrl(loggedInUser.photoUrl) };
      setUser(cleanedUser);
      setToken(authToken);
      localStorage.setItem('exam_token', authToken);
      localStorage.setItem('exam_current_user', JSON.stringify(cleanedUser));
      
      showToast(`Welcome back, ${loggedInUser.name}!`, 'success');
      return loggedInUser;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Login failed. Please check credentials.';
      showToast(msg, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const requestMagicCode = async (email: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/magic-code', { email });
      showToast('Login code has been sent to the mail', 'success');
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Failed to request magic code.';
      showToast(msg, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithMagicCode = async (email: string, magicCode: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login-magic', { email, magicCode });
      const { user: loggedInUser, token: authToken } = response.data;
      
      const cleanedUser = { ...loggedInUser, photoUrl: cleanPhotoUrl(loggedInUser.photoUrl) };
      setUser(cleanedUser);
      setToken(authToken);
      localStorage.setItem('exam_token', authToken);
      localStorage.setItem('exam_current_user', JSON.stringify(cleanedUser));
      
      showToast(`Welcome back, ${loggedInUser.name}!`, 'success');
      return loggedInUser;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Invalid magic code.';
      showToast(msg, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (regData: any) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register', regData);
      showToast(response.data.message || 'Registration successful!', 'success');
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Registration failed.';
      showToast(msg, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('exam_token');
    localStorage.removeItem('exam_current_user');
    setUser(null);
    setToken(null);
    showToast('Logged out successfully', 'info');
  };

  const updateCurrentUser = (userData: User | Student | Faculty) => {
    const cleaned = { ...userData, photoUrl: cleanPhotoUrl(userData.photoUrl) };
    localStorage.setItem('exam_current_user', JSON.stringify(cleaned));
    setUser(cleaned);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateCurrentUser, requestMagicCode, loginWithMagicCode }}>
      {children}
    </AuthContext.Provider>
  );
};
