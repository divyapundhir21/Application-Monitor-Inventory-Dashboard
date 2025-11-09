import React, { useState, useEffect } from 'react';
import { MdEdit, MdDelete } from 'react-icons/md';
import './UserManagement.css';

const UserManagement = ({ onAlert }) => {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({
        email: '',
        firstName: '',
        lastName: '',
        role: 'viewer'
    });
    const [editingUserId, setEditingUserId] = useState(null);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            onAlert({ message: error.message, type: 'error' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingUserId
                ? `/api/users/${editingUserId}`
                : '/api/users';

            const method = editingUserId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(newUser)
            });

            if (!response.ok) throw new Error('Failed to save user');

            await fetchUsers();

            setNewUser({ email: '', firstName: '', lastName: '', role: 'viewer' });
            setEditingUserId(null);

            onAlert({
                message: editingUserId ? 'User updated successfully' : 'User added successfully',
                type: 'success'
            });
        } catch (error) {
            onAlert({ message: error.message, type: 'error' });
        }
    };

    const handleEdit = (user) => {
        setEditingUserId(user._id);
        setNewUser({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            const response = await fetch(`/api/users/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Failed to delete user');

        await fetchUsers();
        onAlert({ message: 'User deleted successfully', type: 'success' });

    } catch (error) {
        onAlert({ message: error.message, type: 'error' });
    }
};

useEffect(() => {
    fetchUsers();
}, []);

return (
    <div className="user-management">
        <h2>User Management</h2>

        <form onSubmit={handleSubmit} className="user-form">
            <div className="form-group">
                <input
                    type="email"
                    placeholder="Email"
                    value={newUser.email}
                    onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                    required
                />
                <input
                    type="text"
                    placeholder="First Name"
                    value={newUser.firstName}
                    onChange={e => setNewUser({ ...newUser, firstName: e.target.value })}
                    required
                />
                <input
                    type="text"
                    placeholder="Last Name"
                    value={newUser.lastName}
                    onChange={e => setNewUser({ ...newUser, lastName: e.target.value })}
                    required
                />
                <select
                    value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                >
                    <option value="viewer">Viewer</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            <button type="submit">
                {editingUserId ? 'Update User' : 'Add User'}
            </button>
        </form>

        <div className="users-list">
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Last Login</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user._id}>
                            <td>{`${user.firstName} ${user.lastName}`}</td>
                            <td>{user.email}</td>
                            <td>{user.role}</td>
                            <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</td>
                            <td className="actions">
                                <button
                                    className="icon-button"
                                    onClick={() => handleEdit(user)}
                                >
                                    <MdEdit />
                                </button>

                                <button
                                    className="icon-button delete"
                                    onClick={() => handleDelete(user._id)}
                                >
                                    <MdDelete />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);
}

export default UserManagement;
