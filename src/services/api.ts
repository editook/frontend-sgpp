
const API_URL = 'https://service-sgpp.fly.dev/api/v1';
//const API_URL = 'http://localhost:9999/api/v1';

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

const request = (method: Method, url: string, data?: any): Promise<any> => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.withCredentials = false;

        xhr.open(method, `${API_URL}${url}`);

        const token = localStorage.getItem('token');

        if (token) {
            console.log(token);
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        if (data) {
            
            xhr.setRequestHeader('Content-Type', 'application/json');
        }

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                try {
                    const response = JSON.parse(xhr.responseText);

                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve({ data: response }); // 👈 imitamos axios
                    } else {
                        reject({
                            status: xhr.status,
                            data: response,
                        });
                    }
                } catch (e) {
                    reject({
                        status: xhr.status,
                        data: xhr.responseText,
                    });
                }
            }
        };

        xhr.onerror = function () {
            reject({ status: xhr.status, data: 'Network error' });
        };

        if (data) {
            xhr.send(JSON.stringify(data));
        } else {
            xhr.send();
        }
    });
};

const api = {
    get: (url: string) => request('GET', url),
    post: (url: string, data: any) => request('POST', url, data),
    patch: (url: string, data: any) => request('PATCH', url, data),
    put: (url: string, data: any) => request('PUT', url, data),
    delete: (url: string) => request('DELETE', url),
};

export default api;