const API_URL = '/api';

function getToken(): string | null {
  return localStorage.getItem('kio_token');
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const authApi = {
  async register(email: string, password: string) {
    const data = await apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) });
    localStorage.setItem('kio_token', data.token);
    return data;
  },
  async login(email: string, password: string) {
    const data = await apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    localStorage.setItem('kio_token', data.token);
    return data;
  },
  async resetPassword(email: string) {
    return apiFetch('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email }) });
  },
  async forgotPassword(email: string) {
    return apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
  },
  async resetPasswordWithToken(token: string, newPassword: string) {
    return apiFetch('/auth/reset-password-token', { method: 'POST', body: JSON.stringify({ token, newPassword }) });
  },
  async getMe() {
    return apiFetch('/auth/me');
  },
  logout() {
    localStorage.removeItem('kio_token');
  },
};

export const profileApi = {
  async getByUsername(username: string) {
    return apiFetch(`/profiles/username/${username}`);
  },
  async getByUserId(userId: string) {
    return apiFetch(`/profiles/user_id/${userId}`);
  },
  async create(profile: { username: string; display_name?: string }) {
    return apiFetch('/profiles', { method: 'POST', body: JSON.stringify(profile) });
  },
  async update(updates: Record<string, unknown>) {
    return apiFetch('/profiles', { method: 'PUT', body: JSON.stringify(updates) });
  },
  async get() {
    return apiFetch('/profiles/me');
  },
  async checkUsernameAvailable(username: string, excludeUserId?: string) {
    const qs = excludeUserId ? `?exclude=${excludeUserId}` : '';
    return apiFetch(`/profiles/check/${username}${qs}`);
  },
  async checkUsername(username: string) {
    return apiFetch(`/profiles/check/${username}`);
  },
  async incrementViews(profileId: string) {
    return apiFetch(`/profiles/${profileId}/view`, { method: 'POST' });
  },
  async search(query: string) {
    return apiFetch(`/profiles/search/${encodeURIComponent(query)}`);
  },
  async getAll() {
    return apiFetch('/profiles/admin/all');
  },
  async adminGetAll() {
    return apiFetch('/profiles/admin/all');
  },
  async ban(userId: string) {
    return apiFetch(`/profiles/admin/${userId}/ban`, { method: 'PUT', body: JSON.stringify({ active: false }) });
  },
  async adminBan(userId: string) {
    return apiFetch(`/profiles/admin/${userId}/ban`, { method: 'PUT', body: JSON.stringify({ active: false }) });
  },
  async unban(userId: string) {
    return apiFetch(`/profiles/admin/${userId}/ban`, { method: 'PUT', body: JSON.stringify({ active: true }) });
  },
  async adminUnban(userId: string) {
    return apiFetch(`/profiles/admin/${userId}/ban`, { method: 'PUT', body: JSON.stringify({ active: true }) });
  },
  async setAdmin(userId: string, isAdmin: boolean) {
    return apiFetch(`/profiles/admin/${userId}/admin`, { method: 'PUT', body: JSON.stringify({ isAdmin }) });
  },
  async adminMakeAdmin(userId: string) {
    return apiFetch(`/profiles/admin/${userId}/admin`, { method: 'PUT', body: JSON.stringify({ isAdmin: true }) });
  },
  async adminRemoveAdmin(userId: string) {
    return apiFetch(`/profiles/admin/${userId}/admin`, { method: 'PUT', body: JSON.stringify({ isAdmin: false }) });
  },
  async delete() {
    return apiFetch('/profiles/me', { method: 'DELETE' });
  },
};

export const configApi = {
  async getByProfileId(profileId: string) {
    return apiFetch(`/profiles/${profileId}/config`);
  },
  async get() {
    return apiFetch('/profiles/config');
  },
  async update(updates: Record<string, unknown>) {
    return apiFetch('/profiles/config', { method: 'PUT', body: JSON.stringify(updates) });
  },
  async applyTemplate(profileId: string, config: Record<string, unknown>) {
    return apiFetch('/profiles/config', { method: 'PUT', body: JSON.stringify(config) });
  },
};

export const linksApi = {
  async getByProfileId(profileId: string) {
    return apiFetch(`/links/profile/${profileId}`);
  },
  async list() {
    return apiFetch('/links');
  },
  async create(link: Record<string, unknown>) {
    return apiFetch('/links', { method: 'POST', body: JSON.stringify(link) });
  },
  async update(id: string, updates: Record<string, unknown>) {
    return apiFetch(`/links/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
  },
  async delete(id: string) {
    return apiFetch(`/links/${id}`, { method: 'DELETE' });
  },
  async reorder(links: { id: string; sort_order: number }[]) {
    return apiFetch('/links/reorder', { method: 'POST', body: JSON.stringify({ links }) });
  },
  async incrementClicks(id: string) {
    return apiFetch(`/links/${id}/click`, { method: 'POST' });
  },
  async trackClick(id: string) {
    return apiFetch(`/links/${id}/click`, { method: 'POST' });
  },
};

export const socialLinksApi = {
  async list() {
    return apiFetch('/socials');
  },
  async getByProfileId(profileId: string) {
    return apiFetch(`/socials/profile/${profileId}`);
  },
  async create(social: Record<string, unknown>) {
    return apiFetch('/socials', { method: 'POST', body: JSON.stringify(social) });
  },
  async update(id: string, updates: Record<string, unknown>) {
    return apiFetch(`/socials/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
  },
  async delete(id: string) {
    return apiFetch(`/socials/${id}`, { method: 'DELETE' });
  },
};

export const badgesApi = {
  async getAll() {
    return apiFetch('/badges');
  },
  async getUserBadges(profileId: string) {
    return apiFetch(`/badges/profile/${profileId}`);
  },
  async getUsersWithBadges() {
    return apiFetch('/badges/users');
  },
  async assignBadge(profileId: string, badgeId: string) {
    return apiFetch('/badges/assign', { method: 'POST', body: JSON.stringify({ profile_id: profileId, badge_id: badgeId }) });
  },
  async removeBadge(profileId: string, badgeId: string) {
    return apiFetch('/badges/remove', { method: 'DELETE', body: JSON.stringify({ profile_id: profileId, badge_id: badgeId }) });
  },
};

export const templatesApi = {
  async getPublic(limit = 20) {
    return apiFetch(`/templates/public?limit=${limit}`);
  },
  async getById(id: string) {
    return apiFetch(`/templates/${id}`);
  },
  async getAll() {
    return apiFetch('/templates');
  },
  async create(template: Record<string, unknown>) {
    return apiFetch('/templates', { method: 'POST', body: JSON.stringify(template) });
  },
  async update(id: string, updates: Record<string, unknown>) {
    return apiFetch(`/templates/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
  },
  async delete(id: string) {
    return apiFetch(`/templates/${id}`, { method: 'DELETE' });
  },
  async apply(id: string) {
    return apiFetch(`/templates/${id}/apply`, { method: 'POST' });
  },
};

export const analyticsApi = {
  async trackEvent(profileId: string, eventType: string, linkId?: string) {
    try { await apiFetch(`/links/${linkId || profileId}/click`, { method: 'POST' }); } catch {}
  },
  async get() {
    return apiFetch('/analytics/overview');
  },
  async getOverview() {
    return apiFetch('/analytics/overview');
  },
  async getDailyStats(profileId: string, days = 30) {
    return apiFetch(`/analytics/daily/${profileId}?days=${days}`);
  },
  async getTopLinks(profileId: string, limit = 10) {
    return apiFetch(`/analytics/top-links/${profileId}?limit=${limit}`);
  },
  async getTotalViews(profileId: string) {
    const data = await apiFetch(`/analytics/totals/${profileId}`);
    return data.views as number;
  },
  async getTotalClicks(profileId: string) {
    const data = await apiFetch(`/analytics/totals/${profileId}`);
    return data.clicks as number;
  },
};

export const reportsApi = {
  async create(report: Record<string, unknown>) {
    return apiFetch('/reports', { method: 'POST', body: JSON.stringify(report) });
  },
  async getAll() {
    return apiFetch('/reports');
  },
  async resolve(id: string) {
    return apiFetch(`/reports/${id}/resolve`, { method: 'PUT' });
  },
};

export const uploadApi = {
  async upload(file: File, type: 'avatar' | 'banner' | 'link') {
    const MAX_UPLOAD_SIZE = 200 * 1024 * 1024; // 200 MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
    if (file.size > MAX_UPLOAD_SIZE) throw new Error('File size exceeds 200 MB limit');
    if (!ALLOWED_TYPES.includes(file.type)) throw new Error('File type not allowed');
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return `${API_URL.replace('/api', '')}${data.url}`;
  },
  async image(file: File) {
    return this.upload(file, 'link');
  },
};
