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

  CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
  CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
  CREATE INDEX IF NOT EXISTS idx_links_profile_id ON links(profile_id);
  CREATE INDEX IF NOT EXISTS idx_social_links_profile_id ON social_links(profile_id);
  CREATE INDEX IF NOT EXISTS idx_analytics_profile_id ON analytics(profile_id);
  CREATE INDEX IF NOT EXISTS idx_daily_stats_profile_date ON daily_stats(profile_id, date);
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

// Migrate: add columns that may not exist
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

export default db;
