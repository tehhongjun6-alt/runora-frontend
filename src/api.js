// Keep the backend address and routes in one place
export const API_URL =
    'https://hibro-backend-production.up.railway.app'

export const ENDPOINTS = {
    signup: `${API_URL}/auth/signup`,
    login: `${API_URL}/auth/login`,
    whoami: `${API_URL}/whoami`,
    posts: `${API_URL}/posts`,
}