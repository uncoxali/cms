const API_BASE = '/api';

class ApiClient {
    private token: string | null = null;

    setToken(token: string | null) {
        this.token = token;
    }

    getToken(): string | null {
        if (this.token) return this.token;
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('nexdirect-token');
            if (stored) {
                this.token = stored;
                return stored;
            }
        }
        return null;
    }

    private headers(extra: Record<string, string> = {}): Record<string, string> {
        const h: Record<string, string> = { ...extra };
        const token = this.getToken();
        if (token) h['Authorization'] = `Bearer ${token}`;
        return h;
    }

    private async handleResponse<T>(res: Response): Promise<T> {
        const contentType = res.headers.get('content-type');
        const isJson = contentType?.includes('application/json');
        
        if (!res.ok) {
            if (isJson) {
                const data = await res.json();
                throw new Error(data.error || res.statusText);
            }
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        if (isJson) {
            return res.json();
        }
        return {} as T;
    }

    async get<T = any>(path: string, params?: Record<string, string>): Promise<T> {
        const url = new URL(`${API_BASE}${path}`, window.location.origin);
        if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
        const res = await fetch(url.toString(), { headers: this.headers() });
        return this.handleResponse<T>(res);
    }

    async post<T = any>(path: string, body?: any): Promise<T> {
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            headers: this.headers({ 'Content-Type': 'application/json' }),
            body: body ? JSON.stringify(body) : undefined,
        });
        return this.handleResponse<T>(res);
    }

    async patch<T = any>(path: string, body: any): Promise<T> {
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'PATCH',
            headers: this.headers({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(body),
        });
        return this.handleResponse<T>(res);
    }

    async del<T = any>(path: string): Promise<T> {
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'DELETE',
            headers: this.headers(),
        });
        return this.handleResponse<T>(res);
    }

    async upload(path: string, formData: FormData): Promise<any> {
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.getToken()}` },
            body: formData,
        });
        return this.handleResponse(res);
    }
}

export const api = new ApiClient();
