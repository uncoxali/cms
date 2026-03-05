const API_BASE = '/api';

class ApiClient {
    private token: string | null = null;

    setToken(token: string | null) {
        this.token = token;
    }

    getToken(): string | null {
        // Try from memory first, then localStorage
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

    async get<T = any>(path: string, params?: Record<string, string>): Promise<T> {
        const url = new URL(`${API_BASE}${path}`, window.location.origin);
        if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
        const res = await fetch(url.toString(), { headers: this.headers() });
        if (!res.ok) throw new Error((await res.json()).error || res.statusText);
        return res.json();
    }

    async post<T = any>(path: string, body?: any): Promise<T> {
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            headers: this.headers({ 'Content-Type': 'application/json' }),
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!res.ok) throw new Error((await res.json()).error || res.statusText);
        return res.json();
    }

    async patch<T = any>(path: string, body: any): Promise<T> {
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'PATCH',
            headers: this.headers({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error || res.statusText);
        return res.json();
    }

    async del<T = any>(path: string): Promise<T> {
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'DELETE',
            headers: this.headers(),
        });
        if (!res.ok) throw new Error((await res.json()).error || res.statusText);
        return res.json();
    }

    async upload(path: string, formData: FormData): Promise<any> {
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${this.getToken()}` },
            body: formData,
        });
        if (!res.ok) throw new Error((await res.json()).error || res.statusText);
        return res.json();
    }
}

export const api = new ApiClient();
