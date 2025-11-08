export const login = async (email) => {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Login service not found');
            }
            const errorData = await response.json();
            throw new Error(errorData.message || 'Login failed');
        }

        const data = await response.json();

        if (!data.success || !data.token || !data.user) {
            throw new Error('Invalid response format from server');
        }

        return data;
    } catch (error) {
        console.error('Login error:', {
            message: error.message,
            email: email,
            timestamp: new Date().toISOString()
        });
        throw error;
    }
};
