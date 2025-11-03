// src/pages/AuthPage.jsx
import React, { useState } from 'react';
import './AuthPage.css';

const AuthPage = ({ onLoginSuccess, setErrorAlert, API_BASE_URL }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Authentication failed.');
            }

            // Store token and user info
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.user.username);
            localStorage.setItem('firstName', data.user.firstName);

            onLoginSuccess();
        } catch (error) {
            setErrorAlert({ message: error.message, type: 'error' });
        }
    };

    return (
        <>
            <h1 className='login-page-heading'>Welcome to App Monitor</h1>
            <div className="auth-page-container">
                <form onSubmit={handleSubmit} className="auth-form">
                    <h2>Login</h2>

                    <div className="form-group">
                        <label>Username</label>
                        <input 
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                    </div>

                    <button type="submit" className="submit-button">
                        Log In
                    </button>
                </form>
            </div>
        </>
    );
};

export default AuthPage;
