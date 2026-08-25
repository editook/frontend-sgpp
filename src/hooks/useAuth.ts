
import { useNavigate } from 'react-router-dom';
import api from '../services/apilogin';

export function useAuth() {
    const navigate = useNavigate();

    const login = async (username: string, password: string) => {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await api.post('/auth/login', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        if (response.data.access_token) {
            localStorage.setItem('token', response.data.access_token);
            if (response.data.user_role) {
                localStorage.setItem('role', response.data.user_role);
                localStorage.setItem('userId', response.data.user_id);
                localStorage.setItem('userName', response.data.user_name);
            }
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        navigate('/login');
    };

    return { login, logout };
}
