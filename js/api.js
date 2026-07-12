const API_BASE_URL = 'https://hackerna-orbit.onrender.com/api';

class ApiClient {
    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        const headers = {
            ...options.headers,
        };

        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        // We use credentials: 'include' to automatically send and receive cookies 
        // (accessToken, refreshToken) handled by the backend.
        const config = {
            ...options,
            headers,
            credentials: 'include'
        };

        try {
            const response = await fetch(url, config);
            
            // Handle unauthorized (potentially expired token)
            if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
                const refreshed = await this.refreshToken();
                if (refreshed) {
                    return this.request(endpoint, options);
                } else {
                    this.redirectToLogin();
                    throw new Error('Session expired. Please log in again.');
                }
            }

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.message || `Request failed with status ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    async refreshToken() {
        try {
            const response = await fetch(`${this.baseUrl}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    redirectToLogin() {
        window.location.href = 'index.html';
    }

    // --- Auth API ---
    login(email, password, role) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password, role })
        });
    }

    register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    logout() {
        return this.request('/auth/logout', { method: 'POST' }).then(() => {
            this.redirectToLogin();
        });
    }

    getMe() {
        return this.request('/auth/me');
    }

    // --- Achievements API ---
    getAchievements(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/achievements?${query}`);
    }

    // --- Portfolio API ---
    getPortfolio(userId) {
        return this.request(`/portfolio/${userId}`);
    }

    createAchievement(achievementData) {
        return this.request('/achievements', {
            method: 'POST',
            body: JSON.stringify(achievementData)
        });
    }

    uploadProof(achievementId, file) {
        const formData = new FormData();
        formData.append('file', file);
        return this.request(`/achievements/${achievementId}/upload-proof`, {
            method: 'POST',
            body: formData
        });
    }
    
    uploadDocument(file) {
        const formData = new FormData();
        formData.append('file', file);
        return this.request('/uploads', {
            method: 'POST',
            body: formData
        });
    }

    deleteAchievement(id) {
        return this.request(`/achievements/${id}`, { method: 'DELETE' });
    }

    // --- Reviews API ---
    getReviewQueue() {
        return this.request('/reviews/queue');
    }

    reviewAchievement(id, decision, remarks = '') {
        return this.request(`/achievements/${id}/review`, {
            method: 'PATCH',
            body: JSON.stringify({ decision, remarks })
        });
    }

    // --- Notifications/Logs API ---
    getNotifications() {
        return this.request('/notifications');
    }

    getAuditLogs(limit = 50) {
        return this.request(`/audit-logs?limit=${limit}`);
    }

    markNotificationRead(id) {
        return this.request(`/notifications/${id}/read`, { method: 'PATCH' });
    }

    // --- Users / Bootstrap API ---
    getBootstrap() {
        return this.request('/bootstrap');
    }

    getUsers(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/users?${query}`);
    }

    // --- Reports ---
    getReport(type) {
        return this.request(`/reports/${type}`);
    }
}

const api = new ApiClient();
window.api = api;
