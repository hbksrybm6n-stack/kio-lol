import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '..', 'data.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    banner_url TEXT DEFAULT '',
    location TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,
    is_admin INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS profile_config (
    id TEXT PRIMARY KEY,
    profile_id TEXT UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'dark',
    primary_color TEXT DEFAULT '#7c3aed',
    secondary_color TEXT DEFAULT '#06b6d4',
    accent_color TEXT DEFAULT '#f59e0b',
    background_color TEXT DEFAULT '#08080c',
    text_color TEXT DEFAULT '#ffffff',
    icon_color TEXT DEFAULT '',
    background_type TEXT DEFAULT 'color',
    background_url TEXT DEFAULT '',
    background_video_url TEXT DEFAULT '',
    background_blur INTEGER DEFAULT 0,
    background_opacity INTEGER DEFAULT 100,
    background_scale INTEGER DEFAULT 100,
    background_position TEXT DEFAULT 'center',
    background_effect TEXT DEFAULT '',
    font_family TEXT DEFAULT 'Inter',
    heading_font TEXT DEFAULT 'Space Grotesk',
    mono_font TEXT DEFAULT 'JetBrains Mono',
    profile_layout TEXT DEFAULT 'centered',
    profile_opacity INTEGER DEFAULT 100,
    profile_blur INTEGER DEFAULT 0,
    profile_border INTEGER DEFAULT 0,
    profile_border_radius INTEGER DEFAULT 16,
    enable_glow INTEGER DEFAULT 0,
    glow_color TEXT DEFAULT '#7c3aed',
    enable_gradient INTEGER DEFAULT 0,
    gradient_colors TEXT DEFAULT '',
    enable_username_effects INTEGER DEFAULT 0,
    enable_animated_title INTEGER DEFAULT 0,
    animated_title_text TEXT DEFAULT '',
    enable_typewriter INTEGER DEFAULT 0,
    typewriter_text TEXT DEFAULT '',
    enable_particles INTEGER DEFAULT 0,
    particle_color TEXT DEFAULT '#7c3aed',
    particle_count INTEGER DEFAULT 50,
    enable_snow INTEGER DEFAULT 0,
    enable_stars INTEGER DEFAULT 0,
    enable_matrix_rain INTEGER DEFAULT 0,
    enable_floating_shapes INTEGER DEFAULT 0,
    enable_neon_border INTEGER DEFAULT 0,
    enable_animated_gradient INTEGER DEFAULT 0,
    enable_cursor_effects INTEGER DEFAULT 0,
    enable_click_effects INTEGER DEFAULT 0,
    enable_background_effects INTEGER DEFAULT 0,
    enable_text_effects INTEGER DEFAULT 0,
    enable_custom_cursor INTEGER DEFAULT 0,
    cursor_url TEXT DEFAULT '',
    overlay_effect TEXT DEFAULT 'none',
    overlay_opacity INTEGER DEFAULT 30,
    card_style TEXT DEFAULT 'glassmorphism',
    card_opacity INTEGER DEFAULT 80,
    card_blur INTEGER DEFAULT 10,
    card_border_radius INTEGER DEFAULT 16,
    music_url TEXT DEFAULT '',
    music_title TEXT DEFAULT '',
    music_artist TEXT DEFAULT '',
    music_cover TEXT DEFAULT '',
    music_autoplay INTEGER DEFAULT 0,
    music_volume INTEGER DEFAULT 30,
    music_loop INTEGER DEFAULT 1,
    music_show_player INTEGER DEFAULT 1,
    music_start_time INTEGER DEFAULT 0,
    discord_user_id TEXT DEFAULT '',
    show_discord_status INTEGER DEFAULT 0,
    show_discord_rpc INTEGER DEFAULT 0,
    show_avatar INTEGER DEFAULT 1,
    avatar_shape TEXT DEFAULT 'circle',
    avatar_size INTEGER DEFAULT 120,
    show_badges INTEGER DEFAULT 1,
    show_views INTEGER DEFAULT 1,
    show_social_links INTEGER DEFAULT 1,
    layout_style TEXT DEFAULT 'centered',
    widgets TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS links (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    description TEXT DEFAULT '',
    icon TEXT DEFAULT '',
    color TEXT DEFAULT '#7c3aed',
    background_color TEXT DEFAULT 'transparent',
    hover_color TEXT DEFAULT '',
    animation TEXT DEFAULT 'none',
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    click_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS social_links (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    url TEXT NOT NULL,
    username TEXT DEFAULT '',
    color TEXT DEFAULT '#7c3aed',
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS badges (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    icon TEXT NOT NULL,
    color TEXT DEFAULT '#7c3aed',
    description TEXT DEFAULT '',
    is_system INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_badges (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
    awarded_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(profile_id, badge_id)
  );

  CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    creator_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    thumbnail_url TEXT DEFAULT '',
    config TEXT DEFAULT '{}',
    is_public INTEGER DEFAULT 0,
    uses_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    share_id TEXT UNIQUE,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS daily_stats (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date TEXT NOT NULL DEFAULT (date('now')),
    views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    link_clicks INTEGER DEFAULT 0,
    UNIQUE(profile_id, date)
  );

  CREATE TABLE IF NOT EXISTS analytics (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    link_id TEXT,
    visitor_agent TEXT DEFAULT '',
    referer TEXT DEFAULT '',
    visitor_ip TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT,
    reported_profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    resolved_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    resolved_at TEXT
  );

  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS username_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    old_username TEXT NOT NULL,
    new_username TEXT NOT NULL,
    changed_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS login_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip TEXT DEFAULT '',
    user_agent TEXT DEFAULT '',
    country TEXT DEFAULT '',
    success INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    ip TEXT DEFAULT '',
    user_agent TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS blocked_users (
    id TEXT PRIMARY KEY,
    blocker_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    blocked_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(blocker_id, blocked_id)
  );

  CREATE TABLE IF NOT EXISTS link_groups (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_visible INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS report_actions (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    action_by TEXT,
    action TEXT NOT NULL,
    notes TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    target_type TEXT DEFAULT '',
    target_id TEXT DEFAULT '',
    details TEXT DEFAULT '',
    ip TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    is_active INTEGER DEFAULT 1,
    created_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT
  );

  CREATE TABLE IF NOT EXISTS staff_notes (
    id TEXT PRIMARY KEY,
    target_user_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
    note TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT DEFAULT '',
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    permissions TEXT DEFAULT 'read',
    rate_limit INTEGER DEFAULT 100,
    is_active INTEGER DEFAULT 1,
    last_used_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS webhooks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    events TEXT DEFAULT '[]',
    secret TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,
    last_triggered_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'free',
    status TEXT DEFAULT 'active',
    stripe_customer_id TEXT DEFAULT '',
    stripe_subscription_id TEXT DEFAULT '',
    current_period_start TEXT,
    current_period_end TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS appeals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    reviewed_by TEXT,
    reviewed_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS legal_pages (
    slug TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cookie_consents (
    id TEXT PRIMARY KEY,
    visitor_ip TEXT DEFAULT '',
    visitor_agent TEXT DEFAULT '',
    consented INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS profile_reports (
    id TEXT PRIMARY KEY,
    reporter_profile_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    reported_profile_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'other',
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS blocked_ips (
    id TEXT PRIMARY KEY,
    ip TEXT NOT NULL,
    reason TEXT DEFAULT '',
    blocked_by TEXT,
    expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS profile_tags (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    UNIQUE(profile_id, tag)
  );

  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    revoked INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS revoked_tokens (
    jti TEXT PRIMARY KEY,
    expires_at TEXT NOT NULL,
    revoked_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS email_verifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    verified INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS totp_secrets (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    secret TEXT NOT NULL,
    enabled INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS recovery_codes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS trusted_devices (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_name TEXT DEFAULT '',
    fingerprint TEXT NOT NULL,
    last_used_at TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS system_backups (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    size INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS error_logs (
    id TEXT PRIMARY KEY,
    level TEXT DEFAULT 'error',
    message TEXT NOT NULL,
    stack TEXT DEFAULT '',
    context TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS premium_plans (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    price_monthly REAL DEFAULT 0,
    price_yearly REAL DEFAULT 0,
    features TEXT DEFAULT '[]',
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS captcha_tokens (
    id TEXT PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    ip TEXT DEFAULT '',
    verified INTEGER DEFAULT 0,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pending_registrations (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    code TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_pending_registrations_email ON pending_registrations(email);

  CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
  CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
  CREATE INDEX IF NOT EXISTS idx_links_profile_id ON links(profile_id);
  CREATE INDEX IF NOT EXISTS idx_social_links_profile_id ON social_links(profile_id);
  CREATE INDEX IF NOT EXISTS idx_analytics_profile_id ON analytics(profile_id);
  CREATE INDEX IF NOT EXISTS idx_daily_stats_profile_date ON daily_stats(profile_id, date);
  CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
  CREATE INDEX IF NOT EXISTS idx_link_groups_profile_id ON link_groups(profile_id);
  CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
  CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
  CREATE INDEX IF NOT EXISTS idx_profile_tags_profile_id ON profile_tags(profile_id);
  CREATE INDEX IF NOT EXISTS idx_profile_tags_tag ON profile_tags(tag);
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
`);

const badgeCount = db.prepare('SELECT COUNT(*) as c FROM badges').get() as { c: number };
if (badgeCount.c === 0) {
  const insertBadge = db.prepare('INSERT INTO badges (id, name, icon, color, description, is_system) VALUES (?, ?, ?, ?, ?, ?)');
  const badges = [
    ['b1', 'Owner', '👑', '#f59e0b', 'Platform owner', 1],
    ['b2', 'Staff', '🛡️', '#3b82f6', 'Staff member', 1],
    ['b3', 'Developer', '💻', '#8b5cf6', 'Developer', 1],
    ['b4', 'Verified', '✓', '#22c55e', 'Verified account', 1],
    ['b5', 'Partner', '🤝', '#06b6d4', 'Official partner', 1],
    ['b6', 'Premium', '⭐', '#f59e0b', 'Premium subscriber', 1],
    ['b7', 'Bug Bounty', '🐛', '#ef4444', 'Found and reported bugs', 1],
    ['b8', 'Early User', '🌟', '#f97316', 'Joined during early access', 1],
    ['b9', 'Community Leader', '🏆', '#f97316', 'Community contribution', 1],
    ['b10', 'Booster', '🚀', '#ec4899', 'Server booster', 1],
    ['b11', 'Rule Maker', '📋', '#6366f1', 'Helped create community rules', 1],
    ['b12', 'Content Creator', '🎬', '#e11d48', 'Creates content for the platform', 1],
  ];
  const insertMany = db.transaction((items: unknown[][]) => { for (const b of items) insertBadge.run(...b); });
  insertMany(badges);
}

const migrateColumn = (table: string, column: string, type: string, def: string) => {
  try {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type} DEFAULT ${def}`).run();
  } catch { /* column already exists */ }
};

migrateColumn('profiles', 'location', 'TEXT', "''");
migrateColumn('profile_config', 'icon_color', 'TEXT', "''");
migrateColumn('profile_config', 'background_opacity', 'INTEGER', '100');
migrateColumn('profile_config', 'background_scale', 'INTEGER', '100');
migrateColumn('profile_config', 'background_position', 'TEXT', "'center'");
migrateColumn('profile_config', 'background_effect', 'TEXT', "''");
migrateColumn('profile_config', 'profile_layout', 'TEXT', "'centered'");
migrateColumn('profile_config', 'profile_opacity', 'INTEGER', '100');
migrateColumn('profile_config', 'profile_blur', 'INTEGER', '0');
migrateColumn('profile_config', 'profile_border', 'INTEGER', '0');
migrateColumn('profile_config', 'profile_border_radius', 'INTEGER', '16');
migrateColumn('profile_config', 'enable_gradient', 'INTEGER', '0');
migrateColumn('profile_config', 'gradient_colors', 'TEXT', "''");
migrateColumn('profile_config', 'enable_username_effects', 'INTEGER', '0');
migrateColumn('profile_config', 'enable_animated_title', 'INTEGER', '0');
migrateColumn('profile_config', 'animated_title_text', 'TEXT', "''");
migrateColumn('profile_config', 'typewriter_text', 'TEXT', "''");
migrateColumn('profile_config', 'enable_stars', 'INTEGER', '0');
migrateColumn('profile_config', 'enable_cursor_effects', 'INTEGER', '0');
migrateColumn('profile_config', 'enable_click_effects', 'INTEGER', '0');
migrateColumn('profile_config', 'enable_background_effects', 'INTEGER', '0');
migrateColumn('profile_config', 'enable_text_effects', 'INTEGER', '0');
migrateColumn('profile_config', 'music_title', 'TEXT', "''");
migrateColumn('profile_config', 'music_artist', 'TEXT', "''");
migrateColumn('profile_config', 'music_cover', 'TEXT', "''");
migrateColumn('profile_config', 'music_loop', 'INTEGER', '1');
migrateColumn('profile_config', 'music_show_player', 'INTEGER', '1');
migrateColumn('profile_config', 'music_start_time', 'INTEGER', '0');
migrateColumn('profile_config', 'widgets', 'TEXT', "'[]'");
migrateColumn('daily_stats', 'unique_visitors', 'INTEGER', '0');
migrateColumn('analytics', 'visitor_ip', 'TEXT', "''");

migrateColumn('profiles', 'is_private', 'INTEGER', '0');
migrateColumn('profiles', 'passcode', 'TEXT', "''");
migrateColumn('profiles', 'custom_css', 'TEXT', "''");
migrateColumn('profiles', 'custom_html', 'TEXT', "''");
migrateColumn('profiles', 'custom_title', 'TEXT', "''");
migrateColumn('profiles', 'featured', 'INTEGER', '0');
migrateColumn('profiles', 'premium', 'INTEGER', '0');

migrateColumn('profile_config', 'card_width', 'TEXT', "'420px'");
migrateColumn('profile_config', 'card_height', 'TEXT', "'auto'");
migrateColumn('profile_config', 'card_shadow', 'TEXT', "''");
migrateColumn('profile_config', 'card_border', 'TEXT', "'0px solid rgba(255,255,255,0.06)'");
migrateColumn('profile_config', 'text_align', 'TEXT', "'center'");
migrateColumn('profile_config', 'link_size', 'TEXT', "'normal'");
migrateColumn('profile_config', 'link_gap', 'TEXT', "'normal'");
migrateColumn('profile_config', 'cursor_color', 'TEXT', "'#8b5cf6'");
migrateColumn('profile_config', 'username_animation', 'TEXT', "'none'");
migrateColumn('profile_config', 'display_name_animation', 'TEXT', "'none'");
migrateColumn('profile_config', 'bio_animation', 'TEXT', "'none'");
migrateColumn('profile_config', 'background_repeat', 'TEXT', "'no-repeat'");
migrateColumn('profile_config', 'background_attachment', 'TEXT', "'scroll'");
migrateColumn('profile_config', 'background_overlay_color', 'TEXT', "''");
migrateColumn('profile_config', 'overlay_color_opacity', 'INTEGER', '50');
migrateColumn('profile_config', 'player_position', 'TEXT', "'bottom-right'");
migrateColumn('profile_config', 'custom_favicon_url', 'TEXT', "''");
migrateColumn('profile_config', 'page_title', 'TEXT', "''");
migrateColumn('profile_config', 'hide_username', 'INTEGER', '0');
migrateColumn('profile_config', 'transition_animation', 'TEXT', "'fade'");
migrateColumn('profile_config', 'loading_animation', 'TEXT', "'spinner'");
migrateColumn('profile_config', 'profile_max_width', 'INTEGER', '420');

migrateColumn('links', 'group_id', 'TEXT', "''");
migrateColumn('links', 'thumbnail_url', 'TEXT', "''");
migrateColumn('links', 'scheduled_at', 'TEXT', "''");
migrateColumn('links', 'scheduled_end', 'TEXT', "''");
migrateColumn('links', 'visibility', 'TEXT', "'public'");
migrateColumn('links', 'target', 'TEXT', "'_blank'");
migrateColumn('links', 'open_animation', 'TEXT', "'none'");

migrateColumn('analytics', 'device_type', 'TEXT', "''");
migrateColumn('analytics', 'browser', 'TEXT', "''");
migrateColumn('analytics', 'os', 'TEXT', "''");
migrateColumn('analytics', 'country', 'TEXT', "''");
migrateColumn('analytics', 'screen_width', 'INTEGER', '0');

migrateColumn('profiles', 'slug', 'TEXT', "''");
migrateColumn('profiles', 'verified', 'INTEGER', '0');
migrateColumn('profiles', 'custom_status', 'TEXT', "''");
migrateColumn('profiles', 'share_enabled', 'INTEGER', '1');
migrateColumn('profiles', 'is_deactivated', 'INTEGER', '0');
migrateColumn('profiles', 'role', 'TEXT', "'user'");
migrateColumn('profiles', 'premium_until', 'TEXT', "''");
migrateColumn('profiles', 'premium_plan', 'TEXT', "''");
migrateColumn('profiles', 'preferred_theme', 'TEXT', "'dark'");

migrateColumn('profile_config', 'card_background', 'TEXT', "''");
migrateColumn('profile_config', 'card_padding', 'TEXT', "'16px'");
migrateColumn('profile_config', 'card_position', 'TEXT', "'center'");
migrateColumn('profile_config', 'link_border_radius', 'INTEGER', '12');
migrateColumn('profile_config', 'link_opacity', 'INTEGER', '100');
migrateColumn('profile_config', 'link_blur', 'INTEGER', '0');
migrateColumn('profile_config', 'link_shadow', 'INTEGER', '0');
migrateColumn('profile_config', 'link_hover_color', 'TEXT', "''");
migrateColumn('profile_config', 'social_icon_size', 'INTEGER', '18');
migrateColumn('profile_config', 'social_icon_gap', 'INTEGER', '8');
migrateColumn('profile_config', 'social_icon_animation', 'TEXT', "'none'");
migrateColumn('profile_config', 'badge_position', 'TEXT', "'inline'");
migrateColumn('profile_config', 'badge_gap', 'INTEGER', '6');
migrateColumn('profile_config', 'font_size', 'INTEGER', '14');
migrateColumn('profile_config', 'font_weight', 'INTEGER', '400');
migrateColumn('profile_config', 'letter_spacing', 'TEXT', "'normal'");
migrateColumn('profile_config', 'line_height', 'TEXT', "'1.5'");
migrateColumn('profile_config', 'heading_size', 'INTEGER', '26');
migrateColumn('profile_config', 'custom_text_colors', 'TEXT', "''");
migrateColumn('profile_config', 'custom_icon_colors', 'TEXT', "''");
migrateColumn('profile_config', 'page_bg_color', 'TEXT', "''");
migrateColumn('profile_config', 'show_verified_badge', 'INTEGER', '1');
migrateColumn('profile_config', 'profile_verified_color', 'TEXT', "'#22c55e'");

migrateColumn('links', 'password', 'TEXT', "''");
migrateColumn('links', 'expiration', 'TEXT', "''");
migrateColumn('links', 'redirect_url', 'TEXT', "''");
migrateColumn('links', 'embed_html', 'TEXT', "''");

migrateColumn('analytics', 'screen_height', 'INTEGER', '0');

migrateColumn('profile_config', 'music_playlist', 'TEXT', "'[]'");
migrateColumn('profile_config', 'show_visualizer', 'INTEGER', '0');
migrateColumn('profile_config', 'visualizer_color', 'TEXT', "'#8b5cf6'");
migrateColumn('profile_config', 'show_progress_bar', 'INTEGER', '1');
migrateColumn('profile_config', 'show_music_controls', 'INTEGER', '1');
migrateColumn('profile_config', 'song_transition', 'TEXT', "'fade'");
migrateColumn('profile_config', 'music_end_time', 'INTEGER', '0');

export default db;
