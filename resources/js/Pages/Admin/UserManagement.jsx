import React, { useState, useEffect } from 'react';
import { Users, Shield, Edit2, Trash2, Plus, Search, UserCheck, UserX, Key, Mail } from 'lucide-react';
import Sidebar from '@/Components/SideBar';
import { Head } from '@inertiajs/react';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'user',
    department: '',
    password: '',
    password_confirmation: '',
    permission_level: 'view' // Changed from permissions array to single permission level
  });

  const roles = ['admin', 'supervisor', 'user'];
  const departments = ['Operations', 'Production', 'Quality Control', 'Environmental'];
  
  // Simplified permission levels
  const permissionLevels = [
    { value: 'view', label: 'View Only', description: 'Can only view information' },
    { value: 'edit', label: 'View & Edit', description: 'Can view and modify information' }
  ];

  const renderPermissionsSection = () => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">Permission Level</label>
      <div className="space-y-3">
        {permissionLevels.map(level => (
          <div key={level.value} className="flex items-start">
            <input
              type="radio"
              id={level.value}
              name="permission_level"
              value={level.value}
              checked={userForm.permission_level === level.value}
              onChange={(e) => setUserForm(prev => ({...prev, permission_level: e.target.value}))}
              className="h-4 w-4 text-blue-600 border-gray-300 mt-1"
            />
            <div className="ml-3">
              <label htmlFor={level.value} className="text-sm font-medium text-gray-700">
                {level.label}
              </label>
              <p className="text-xs text-gray-500">{level.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    
    if (!userForm.name || !userForm.email || !userForm.role) {
      const error = 'Please fill in all required fields';
      console.error('Validation error:', error, { formData: userForm });
      setError(error);
      return;
    }

    if (!editingUser && userForm.password !== userForm.password_confirmation) {
      const error = 'Passwords do not match';
      console.error('Validation error:', error, { 
        password: userForm.password?.length,
        confirmation: userForm.password_confirmation?.length
      });
      setError(error);
      return;
    }

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      console.log('Attempting to save user:', {
        url,
        method,
        formData: { ...userForm, password: '[REDACTED]' },
        editingUserId: editingUser?.id
      });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify({
          ...userForm,
          permission_level: userForm.permission_level
        }),
      });
      
      if (response.ok) {
        console.log('User saved successfully');
        await fetchUsers();
        setShowModal(false);
        setEditingUser(null);
        resetForm();
        setError(null);
      } else {
        const data = await response.json();
        console.error('Server error response:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        setError(data.message || 'Failed to save user');
      }
    } catch (err) {
      console.error('Error saving user:', {
        error: err.message,
        stack: err.stack,
        formData: { ...userForm, password: '[REDACTED]' }
      });
      setError('Failed to save user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      });
      
      if (response.ok) {
        await fetchUsers();
      } else {
        setError('Failed to delete user');
      }
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const resetForm = () => {
    setUserForm({
      name: '',
      email: '',
      role: 'user',
      department: '',
      password: '',
      password_confirmation: '',
      permission_level: 'view'
    });
  };

  const openUserModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setUserForm({
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department || '',
        password: '',
        password_confirmation: '',
        permission_level: user.permission_level || 'view'
      });
    } else {
      setEditingUser(null);
      resetForm();
    }
    setError(null);
    setShowModal(true);
  };

  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'supervisor': return 'bg-blue-100 text-blue-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getStatusBadgeColor = (status) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getPermissionBadgeColor = (permission) => {
    return permission === 'edit' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users', {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || data);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Head title="User Management" />
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Head title="User Management" />
      <Sidebar />
      <div className="flex-1 overflow-auto">
        {/* Header Section */}
        <div className="p-8 pb-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Manage users, roles and permissions</p>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg shadow-blue-100 p-6 border border-blue-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg shadow-green-100 p-6 border border-green-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Users</p>
                  <p className="text-2xl font-bold text-green-600">
                    {users.filter(u => u.status === 'active').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg shadow-red-100 p-6 border border-red-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Admins</p>
                  <p className="text-2xl font-bold text-red-600">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg shadow-purple-100 p-6 border border-purple-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Edit Access</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {users.filter(u => u.permission_level === 'edit').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Edit2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 pb-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-lg shadow-blue-100 border border-blue-100 p-8 mb-8">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Manage Users</h2>
                <p className="text-gray-600">Search, filter and manage system users</p>
              </div>
              <button
                onClick={() => openUserModal()}
                className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add User
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Roles</option>
                {roles.map(role => (
                  <option key={role} value={role}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl shadow-lg shadow-blue-100 border border-blue-100 overflow-hidden">
            <div className="p-8 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Users ({filteredUsers.length})
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Permission Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                          {user.role?.charAt(0)?.toUpperCase() + user.role?.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.department || 'Not assigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(user.status || 'active')}`}>
                          {(user.status || 'active').charAt(0).toUpperCase() + (user.status || 'active').slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPermissionBadgeColor(user.permission_level || 'view')}`}>
                          {user.permission_level === 'edit' ? 'View & Edit' : 'View Only'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.last_login_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openUserModal(user)}
                            className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                            title="Edit user"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Add/Edit User Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              
              <form onSubmit={handleUserSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={userForm.name}
                    onChange={(e) => setUserForm(prev => ({...prev, name: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({...prev, email: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    required
                    value={userForm.role}
                    onChange={(e) => setUserForm(prev => ({...prev, role: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {roles.map(role => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={userForm.department}
                    onChange={(e) => setUserForm(prev => ({...prev, department: e.target.value}))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {!editingUser && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                      <input
                        type="password"
                        required={!editingUser}
                        value={userForm.password}
                        onChange={(e) => setUserForm(prev => ({...prev, password: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                      <input
                        type="password"
                        required={!editingUser}
                        value={userForm.password_confirmation}
                        onChange={(e) => setUserForm(prev => ({...prev, password_confirmation: e.target.value}))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </>
                )}
                
                {/* Simplified Permissions Section */}
                {renderPermissionsSection()}
                
                {/* Error display */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
                    {error}
                  </div>
                )}
                
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingUser(null);
                      resetForm();
                      setError(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    {editingUser ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}