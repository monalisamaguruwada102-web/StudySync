import api from "./api";

export const login = async (email, password) => {
    try {
        const response = await api.post('/auth/login', { email, password });
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        return user;
    } catch (error) {
        throw error;
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
    } catch (error) {
        return null;
    }
};

export const isUserAuthorized = async (user) => {
    if (!user) return false;
    try {
        const response = await api.get('/auth/me');
        return response.data.authorized;
    } catch (error) {
        return false;
    }
};
