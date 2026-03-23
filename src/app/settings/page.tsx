'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/lib/protectedRoute';
import styles from './settings.module.css';

function SettingsContent() {
  const { user, updateProfile, changePassword, error: authError, clearError } = useAuth();
  const router = useRouter();

  // Profile form state
  const [profileData, setProfileData] = useState({
    email: '',
    line_id: '',
    birthdate: '',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Initialize profile form with user data
  useEffect(() => {
    if (user) {
      setProfileData({
        email: user.email || '',
        line_id: user.line_id || '',
        birthdate: user.birthdate || '',
      });
    }
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    clearError();

    // Validation
    if (!profileData.email) {
      setError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const updates: any = { email: profileData.email };
      if (profileData.line_id) updates.line_id = profileData.line_id;
      if (profileData.birthdate) updates.birthdate = profileData.birthdate;

      await updateProfile(updates);
      setSuccessMessage('Profile updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    clearError();

    // Validation
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setError('Current and new password are required');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setSuccessMessage('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const displayError = error || authError;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Account Settings</h1>
        <p>Manage your profile and security settings</p>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'profile' ? styles.tabActive : ''}`}
          onClick={() => {
            setActiveTab('profile');
            setError('');
            setSuccessMessage('');
          }}
        >
          Profile Information
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'password' ? styles.tabActive : ''}`}
          onClick={() => {
            setActiveTab('password');
            setError('');
            setSuccessMessage('');
          }}
        >
          Change Password
        </button>
      </div>

      <div className={styles.content}>
        {displayError && <div className={styles.errorMsg}>{displayError}</div>}
        {successMessage && <div className={styles.successMsg}>{successMessage}</div>}

        {activeTab === 'profile' && (
          <form className={styles.form} onSubmit={handleProfileSubmit}>
            <h2>Profile Information</h2>

            <div className={styles.field}>
              <label className={styles.label}>
                Email Address <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="email"
                className={styles.input}
                name="email"
                value={profileData.email}
                onChange={handleProfileChange}
                disabled={loading}
                required
                placeholder="you@example.com"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                LINE ID <span style={{ color: '#999', fontSize: '0.8em' }}>(optional)</span>
              </label>
              <input
                type="text"
                className={styles.input}
                name="line_id"
                value={profileData.line_id}
                onChange={handleProfileChange}
                disabled={loading}
                placeholder="your_line_id"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Birthdate <span style={{ color: '#999', fontSize: '0.8em' }}>(optional)</span>
              </label>
              <input
                type="date"
                className={styles.input}
                name="birthdate"
                value={profileData.birthdate}
                onChange={handleProfileChange}
                disabled={loading}
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        )}

        {activeTab === 'password' && (
          <form className={styles.form} onSubmit={handlePasswordSubmit}>
            <h2>Change Password</h2>

            <div className={styles.field}>
              <label className={styles.label}>
                Current Password <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="password"
                className={styles.input}
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                disabled={loading}
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                New Password <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="password"
                className={styles.input}
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                disabled={loading}
                required
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <small className={styles.helper}>At least 6 characters</small>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Confirm New Password <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="password"
                className={styles.input}
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                disabled={loading}
                required
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}
