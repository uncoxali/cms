// API Base URL - can be configured via environment variable
// When using separate backend, set NEXT_PUBLIC_API_URL to backend URL (e.g., http://localhost:3001/api)
// When using Next.js API routes, leave empty or set to '/api'
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
export const UPLOADS_BASE = API_BASE.replace(/\/api$/, '') + '/uploads';

export function getUploadUrl(path: string | null | undefined): string | undefined {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    
    // UUID regex to identify if path is a file ID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    // If it's a UUID and doesn't start with /uploads, it's a direct file ID
    if (!path.startsWith('/uploads/') && uuidRegex.test(path)) {
        return `${API_BASE}/files/${path}/view`;
    }

    // If the path starts with /uploads, prefix with backend origin
    if (cleanPath.startsWith('/uploads')) {
        return `${API_BASE.replace(/\/api$/, '')}${cleanPath}`;
    }
    
    // Fallback
    return `${UPLOADS_BASE}${cleanPath}`;
}

interface RefreshQueueItem {
    resolve: (token: string) => void;
    reject: (error: any) => void;
}

class ApiClient {
    private token: string | null = null;
    private isRefreshing = false;
    private refreshQueue: RefreshQueueItem[] = [];

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

    private async handleResponse<T>(res: Response, retryCount = 0): Promise<T> {
        const contentType = res.headers.get('content-type');
        const isJson = contentType?.includes('application/json');
        
        // Handle 401 Unauthorized - try to refresh token
        if (res.status === 401 && retryCount === 0 && this.getToken()) {
            try {
                const newToken = await this.refreshToken();
                this.setToken(newToken);
                return {} as T; // Caller should retry
            } catch {
                // Refresh failed, let the error through
            }
        }
        
        if (!res.ok) {
            if (isJson) {
                const data = await res.json();
                throw new Error(data?.error || res.statusText);
            }
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        if (isJson) {
            return res.json();
        }
        return {} as T;
    }

    private async refreshToken(): Promise<string> {
        return new Promise((resolve, reject) => {
            // If already refreshing, queue this request
            if (this.isRefreshing) {
                this.refreshQueue.push({ resolve, reject });
                return;
            }

            this.isRefreshing = true;

            fetch(`${API_BASE}/auth/refresh`, {
                method: 'POST',
                headers: this.headers({ 'Content-Type': 'application/json' }),
            })
                .then(res => res.json())
                .then(data => {
                    if (data.access_token) {
                        this.setToken(data.access_token);
                        localStorage.setItem('nexdirect-token', data.access_token);
                        
                        // Process queued requests
                        this.refreshQueue.forEach(item => item.resolve(data.access_token));
                        this.refreshQueue = [];
                        
                        resolve(data.access_token);
                    } else {
                        // Refresh failed - logout
                        this.handleLogout();
                        reject(new Error('Token refresh failed'));
                    }
                })
                .catch(err => {
                    this.refreshQueue.forEach(item => item.reject(err));
                    this.refreshQueue = [];
                    this.handleLogout();
                    reject(err);
                })
                .finally(() => {
                    this.isRefreshing = false;
                });
        });
    }

    private handleLogout() {
        this.setToken(null);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('nexdirect-token');
            // Redirect to login
            window.location.href = '/admin/login';
        }
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
