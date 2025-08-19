import axios from 'axios';
import { logout } from './authFunctions';

const hostname = window.location.hostname;
const api = axios.create({
    baseURL: 'http://' + hostname + ':3000/api',
    withCredentials: true,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

api.interceptors.response.use(
    response => response,
    async error => {
        if (error.config?.url !== '/login' && error.response) {
            const { status } = error.response;

            if (status === 401) {
                console.warn('Unauthorized api call');
                await logout();
            }

            if (status === 403) {
                console.warn('Forbidden');
            }
        } else if (error.request) {
            console.error('No response from server');
        } else {
            console.error('Axios error:', error.message);
        }
        return Promise.reject(error);
    }
);

export default api;
