import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Save } from 'lucide-react';
import Loading from '../../components/Loading';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // Try to get from localStorage first
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setFormData(prev => ({
          ...prev,
          name: userData.name,
          email: userData.email
        }));
      } else {
        const response = await authAPI.getProfile();
        setUser(response.data);
        setFormData(prev => ({
          ...prev,
          name: response.data.name,
          email: response.data.email
        }));
      }
    } catch (error) {
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // TODO: Replace with actual API call
      // await authAPI.updateProfile({ name: formData.name, email: formData.email });
      
      const updatedUser = { ...user, name: formData.name, email: formData.email };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);

    try {
      // TODO: Replace with actual API call
      // await authAPI.changePassword(formData.currentPassword, formData.newPassword);
      
      toast.success('Password changed successfully');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;

  const getRoleBadge = (role) => {
    const badges = {
      admin: { class: 'badge-danger', label: 'Admin' },
      manager: { class: 'badge-warning', label: 'Manager' },
      staff: { class: 'badge-info', label: 'Staff' }
    };
    return badges[role] || { class: 'badge-gray', label: role };
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">👤 My Profile</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '900px' }}>
        {/* Profile Info Card */}
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed 0%, #0ea5e9 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'white',
              fontSize: '32px',
              fontWeight: '600'
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#374151' }}>{user?.name}</h3>
            <p style={{ color: '#6b7280', marginTop: '4px' }}>{user?.email}</p>
            <span className={`badge ${getRoleBadge(user?.role).class}`} style={{ marginTop: '8px' }}>
              {getRoleBadge(user?.role).label}
            </span>
          </div>

          <form onSubmit={handleUpdateProfile}>
            <div className="form-group">
              <label>
                <User size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>
                <Mail size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
              <Save size={18} />
              {saving ? 'Saving...' : 'Update Profile'}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '20px' }}>
            <Shield size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Change Password
          </h3>

          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                required
              />
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                minLength={6}
                required
              />
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm new password"
                required
              />
            </div>
            <button type="submit" className="btn btn-secondary btn-block" disabled={saving}>
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;