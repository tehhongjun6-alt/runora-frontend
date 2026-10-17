export const API_URL =
    import.meta.env.VITE_API_URL ||
    'https://hibro-backend-production.up.railway.app'

export const ENDPOINTS = {
    signup: `${API_URL}/auth/signup`,
    login: `${API_URL}/auth/login`,
    whoami: `${API_URL}/whoami`,
    posts: `${API_URL}/posts`,
    users: `${API_URL}/users`,
    friend: `${API_URL}/friend`,
    friendRequests: `${API_URL}/friend/requests`,
}