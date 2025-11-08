const API_BASE = '/api';

export const handleResponse = async (response) => {
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Invalid response format');
    }

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
};

export const loginUser = async (email) => {
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        if (response.status === 404) {
            console.error('Login endpoint not found');
            throw new Error('Service unavailable');
        }

        const data = await handleResponse(response);
        if (data.token) {
            localStorage.setItem('token', data.token);
        }
        return data;
    } catch (error) {
        console.error('Auth fetch error:', error);
        throw error;
    }
};

export const fetchUserProfile = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No auth token found');
    }

    try {
        const response = await fetch(`${API_BASE}/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 404) {
            console.error('User not found');
            return null;
        }

        if (response.status === 401) {
            console.error('Token invalid or expired');
            localStorage.removeItem('token');
            window.location.hash = 'login';
            return null;
        }

        return await handleResponse(response);
    } catch (error) {
        console.error('Profile fetch error:', error);
        throw error;
    }
};

export const fetchApplications = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No auth token found');
    }

    try {
        const response = await fetch(`${API_BASE}/applications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 404) {
            console.error('No applications found');
            return [];
        }

        return await handleResponse(response);
    } catch (error) {
        console.error('Applications fetch error:', error);
        throw error;
    }
};
