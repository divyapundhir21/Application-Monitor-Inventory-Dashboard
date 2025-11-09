import React, { useState, useEffect } from 'react';
import './AdminPage.css';

const AdminPage = () => {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({
        email: '',
        firstName: '',
        lastName: '',
        role: 'viewer'
    });
    const [editingUser, setEditingUser] = useState(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            }
        } catch (error) {
            setMessage('Error fetching users');
        }
    };

    const roles = ['viewer', 'user', 'admin'];

    const handleEdit = (user) => {
        setEditingUser(user);
        setNewUser({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
        });
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            console.log('Deleting user:', userId); // Debug log
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const data = await response.json();
            console.log('Delete response:', data); // Debug log

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete user');
            }

            setUsers(prev => prev.filter(user => user._id !== userId));
            setMessage('User deleted successfully');
        } catch (error) {
            console.error('Delete error:', error);
            setMessage(`Error: ${error.message}`);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!newUser.email.endsWith('@chevron.com')) {
                setMessage('Only Chevron email addresses are allowed');
                return;
            }

            console.log('Submitting user:', newUser); // Debug log
            const url = editingUser ? `/api/users/${editingUser._id}` : '/api/users';
            const method = editingUser ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(newUser)
            });

            const data = await response.json();
            console.log('Submit response:', data); // Debug log

            if (!response.ok) {
                throw new Error(data.message || `Failed to ${editingUser ? 'update' : 'create'} user`);
            }

            setMessage(data.message);
            setNewUser({ email: '', firstName: '', lastName: '', role: 'viewer' });
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            console.error('Submit error:', error);
            setMessage(`Error: ${error.message}`);
        }
    };

    return (
        <div className="admin-page">
            <h2>{editingUser ? 'Edit User' : 'Add New User'}</h2>

            {message && (
                <div className={message.includes('Error') ? 'error-message' : 'success-message'}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="user-form">
                <div className="form-group">
                    <label>Email:</label>
                    <input
                        type="email"
                        value={newUser.email}
                        onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>First Name:</label>
                    <input
                        type="text"
                        value={newUser.firstName}
                        onChange={e => setNewUser({ ...newUser, firstName: e.target.value })}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Last Name:</label>
                    <input
                        type="text"
                        value={newUser.lastName}
                        onChange={e => setNewUser({ ...newUser, lastName: e.target.value })}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Role:</label>
                    <select
                        value={newUser.role}
                        onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                    >
                        {roles.map(role => (
                            <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                        ))}
                    </select>
                </div>
                <button type="submit">{editingUser ? 'Update User' : 'Add User'}</button>
                {editingUser && (
                    <button type="button" onClick={() => {
                        setEditingUser(null);
                        setNewUser({ email: '', firstName: '', lastName: '', role: 'viewer' });
                    }}>
                        Cancel Edit
                    </button>
                )}
            </form>

            <div className="users-list">
                <h3>Existing Users</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Last Login</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user._id}>
                                <td>{user.email}</td>
                                <td>{user.firstName} {user.lastName}</td>
                                <td>{user.role}</td>
                                <td>
                                    {user.lastLogin
                                        ? new Date(user.lastLogin).toLocaleString()
                                        : 'Never'}
                                </td>
                                <td>
                                    <button
                                        className="edit-btn"
                                        onClick={() => handleEdit(user)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="delete-btn"
                                        onClick={() => handleDelete(user._id)}
                                        disabled={user.email === 'admin@chevron.com'}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminPage;
