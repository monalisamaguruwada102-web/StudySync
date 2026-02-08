import api from "./api";

export const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user: initialUser } = response.data;
    localStorage.setItem('token', token);

    // Fetch full profile (includes cloud-stored settings)
    try {
        const profileRes = await api.get('/user/profile');
        const fullUser = { ...initialUser, ...profileRes.data };
        localStorage.setItem('user', JSON.stringify(fullUser));
        return fullUser;
    } catch (error) {
        console.error('Failed to fetch full profile during login:', error);
        localStorage.setItem('user', JSON.stringify(initialUser));
        return initialUser;
    }
};

export const register = async (email, password) => {
    const response = await api.post('/auth/register', { email, password });
    const { token, user: initialUser } = response.data;
    localStorage.setItem('token', token);

    // Fetch full profile
    try {
        const profileRes = await api.get('/user/profile');
        const fullUser = { ...initialUser, ...profileRes.data };
        localStorage.setItem('user', JSON.stringify(fullUser));
        return fullUser;
    } catch (error) {
        localStorage.setItem('user', JSON.stringify(initialUser));
        return initialUser;
    }
};

export const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
};

export const getCurrentUser = async () => {
    try {
        const response = await api.get('/auth/me');
        return response.data.user;
    } catch {
        return null;
    }
};

export const isUserAuthorized = async (user) => {
    if (!user) return false;
    try {
        const response = await api.get('/auth/me');
        return response.data.authorized;
    } catch {
        return false;
    }
};

export const updateUserXP = async (amount) => {
    try {
        const response = await api.post('/user/xp', { amount });
        return response.data;
    } catch (error) {
        console.error('Failed to update XP:', error);
        return null;
    }
};
