import axios from 'axios';

const API_URL = 'https://service-sgpp.fly.dev/api/v1';
//const API_URL = 'http://localhost:9999/api/v1';
const apilogin = axios.create({
    baseURL: API_URL,
});

apilogin.interceptors.request.use((config) => {
    
    return config;
});

export default apilogin;