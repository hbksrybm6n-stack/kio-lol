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
  async getReferrers(profileId: string) {
    return apiFetch(`/analytics/referrers/${profileId}`);
  },
  async getDevices(profileId: string) {
    return apiFetch(`/analytics/devices/${profileId}`);
  },
  async getCountries(profileId: string) {
    return apiFetch(`/analytics/countries/${profileId}`);
  },
  async exportCSV(profileId: string) {
    const token = getToken();
    const res = await fetch(`${API_URL}/analytics/export/${profileId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${profileId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

export const leaderboardApi = {
  async getTop() {
    const data = await apiFetch('/leaderboard');
    return data.data as Array<{
      id: string; username: string; display_name: string; avatar_url: string;
      view_count: number; link_count: number; badge_count: number;
    }>;
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

export const accountApi = {
  async changeEmail(newEmail: string, currentPassword: string) {
    return apiFetch('/account/email', { method: 'PUT', body: JSON.stringify({ newEmail, currentPassword }) });
  },
  async changePassword(currentPassword: string, newPassword: string) {
    return apiFetch('/account/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) });
  },
  async getLoginHistory() {
    return apiFetch('/account/login-history');
  },
  async getSessions() {
    return apiFetch('/account/sessions');
  },
  async revokeSession(sessionId: string) {
    return apiFetch(`/account/sessions/${sessionId}`, { method: 'DELETE' });
  },
  async revokeAllSessions() {
    return apiFetch('/account/sessions/revoke-all', { method: 'POST' });
  },
  async getSecurity() {
    return apiFetch('/account/security');
  },
};

export const discoveryApi = {
  async getTrending() {
    return apiFetch('/discovery/trending');
  },
  async getFeatured() {
    return apiFetch('/discovery/featured');
  },
  async getRecent() {
    return apiFetch('/discovery/recent');
  },
  async getDirectory(page = 1, search = '') {
    return apiFetch(`/discovery/directory?page=${page}&search=${encodeURIComponent(search)}`);
  },
  async search(query: string) {
    return apiFetch(`/discovery/search?q=${encodeURIComponent(query)}`);
  },
};

export const adminExtendedApi = {
  async getStats() {
    return apiFetch('/admin-extended/stats');
  },
  async getAuditLogs(page = 1) {
    return apiFetch(`/admin-extended/audit-logs?page=${page}`);
  },
  async getAnnouncements() {
    return apiFetch('/admin-extended/announcements');
  },
  async createAnnouncement(data: { title: string; content: string; type?: string }) {
    return apiFetch('/admin-extended/announcements', { method: 'POST', body: JSON.stringify(data) });
  },
  async deleteAnnouncement(id: string) {
    return apiFetch(`/admin-extended/announcements/${id}`, { method: 'DELETE' });
  },
  async addStaffNote(userId: string, note: string) {
    return apiFetch('/admin-extended/staff-notes', { method: 'POST', body: JSON.stringify({ userId, note }) });
  },
  async getStaffNotes(userId: string) {
    return apiFetch(`/admin-extended/staff-notes/${userId}`);
  },
  async toggleMaintenance(enabled: boolean) {
    return apiFetch('/admin-extended/maintenance', { method: 'PUT', body: JSON.stringify({ enabled }) });
  },
  async getHealth() {
    return apiFetch('/admin-extended/health');
  },
  async featureProfile(profileId: string) {
    return apiFetch(`/admin-extended/feature-profile/${profileId}`, { method: 'POST' });
  },
};

export const legalApi = {
  async getPage(slug: string) {
    return apiFetch(`/legal/${slug}`);
  },
  async updatePage(slug: string, data: { title: string; content: string }) {
    return apiFetch(`/legal/${slug}`, { method: 'PUT', body: JSON.stringify(data) });
  },
};

export const moderationApi = {
  async report(data: { reported_profile_id: string; reason: string; description?: string; category?: string }) {
    return apiFetch('/moderation/report', { method: 'POST', body: JSON.stringify(data) });
  },
  async blockUser(userId: string) {
    return apiFetch(`/moderation/block/${userId}`, { method: 'POST' });
  },
  async unblockUser(userId: string) {
    return apiFetch(`/moderation/block/${userId}`, { method: 'DELETE' });
  },
  async getBlocked() {
    return apiFetch('/moderation/blocked');
  },
  async submitAppeal(data: { reason: string; description?: string }) {
    return apiFetch('/moderation/appeal', { method: 'POST', body: JSON.stringify(data) });
  },
  async getAppeals() {
    return apiFetch('/moderation/appeals');
  },
};

export const linkGroupsApi = {
  async list() {
    return apiFetch('/links/groups');
  },
  async create(data: { name: string; sort_order?: number }) {
    return apiFetch('/links/groups', { method: 'POST', body: JSON.stringify(data) });
  },
  async update(id: string, data: { name?: string; sort_order?: number; is_visible?: number }) {
    return apiFetch(`/links/groups/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async delete(id: string) {
    return apiFetch(`/links/groups/${id}`, { method: 'DELETE' });
  },
  async reorder(groups: { id: string; sort_order: number }[]) {
    return apiFetch('/links/groups/reorder', { method: 'POST', body: JSON.stringify({ groups }) });
  },
};
