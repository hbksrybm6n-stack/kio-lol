export interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  banner_url: string;
  is_active: boolean;
  is_admin: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileConfig {
  id: string;
  profile_id: string;
  theme: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  background_type: string;
  background_url: string;
  background_video_url: string;
  background_blur: number;
  font_family: string;
  heading_font: string;
  mono_font: string;
  enable_particles: boolean;
  particle_color: string;
  particle_count: number;
  enable_snow: boolean;
  enable_glow: boolean;
  glow_color: string;
  enable_custom_cursor: boolean;
  cursor_url: string;
  enable_typewriter: boolean;
  enable_3d_tilt: boolean;
  enable_matrix_rain: boolean;
  enable_floating_shapes: boolean;
  enable_neon_border: boolean;
  enable_animated_gradient: boolean;
  overlay_effect: string;
  overlay_opacity: number;
  card_style: string;
  card_opacity: number;
  card_blur: number;
  card_border_radius: number;
  music_url: string;
  music_autoplay: boolean;
  music_volume: number;
  discord_user_id: string;
  show_discord_status: boolean;
  show_discord_rpc: boolean;
  layout_style: string;
  show_avatar: boolean;
  avatar_shape: string;
  avatar_size: number;
  show_badges: boolean;
  show_views: boolean;
  show_social_links: boolean;
  created_at: string;
  updated_at: string;
}

export interface Link {
  id: string;
  profile_id: string;
  title: string;
  url: string;
  description: string;
  icon: string;
  color: string;
  background_color: string;
  hover_color: string;
  animation: string;
  sort_order: number;
  is_active: boolean;
  click_count: number;
  created_at: string;
  updated_at: string;
}

export interface SocialLink {
  id: string;
  profile_id: string;
  platform: string;
  url: string;
  username: string;
  color: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  is_system: boolean;
  created_at: string;
}

export interface UserBadge {
  id: string;
  profile_id: string;
  badge_id: string;
  awarded_by: string | null;
  created_at: string;
  badge?: Badge;
}

export interface Template {
  id: string;
  creator_id: string | null;
  name: string;
  description: string;
  thumbnail_url: string;
  config: Partial<ProfileConfig>;
  is_public: boolean;
  uses_count: number;
  likes_count: number;
  share_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsEvent {
  id: string;
  profile_id: string;
  event_type: string;
  link_id: string | null;
  visitor_ip: string | null;
  visitor_agent: string | null;
  referer: string | null;
  country: string;
  created_at: string;
}

export interface DailyStats {
  id: string;
  profile_id: string;
  date: string;
  views: number;
  link_clicks: number;
  unique_visitors: number;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string | null;
  reported_profile_id: string | null;
  reason: string;
  description: string;
  status: string;
  resolved_by: string | null;
  created_at: string;
  resolved_at: string | null;
}

export type SocialPlatform = 
  | 'discord' | 'github' | 'twitter' | 'youtube' | 'tiktok' 
  | 'instagram' | 'twitch' | 'telegram' | 'spotify' | 'linkedin'
  | 'email' | 'website' | 'other';

export const SOCIAL_PLATFORMS: Record<SocialPlatform, { name: string; color: string; icon: string }> = {
  discord: { name: 'Discord', color: '#5865F2', icon: 'discord' },
  github: { name: 'GitHub', color: '#ffffff', icon: 'github' },
  twitter: { name: 'Twitter / X', color: '#1DA1F2', icon: 'twitter' },
  youtube: { name: 'YouTube', color: '#FF0000', icon: 'youtube' },
  tiktok: { name: 'TikTok', color: '#000000', icon: 'tiktok' },
  instagram: { name: 'Instagram', color: '#E4405F', icon: 'instagram' },
  twitch: { name: 'Twitch', color: '#9146FF', icon: 'twitch' },
  telegram: { name: 'Telegram', color: '#26A5E4', icon: 'telegram' },
  spotify: { name: 'Spotify', color: '#1DB954', icon: 'spotify' },
  linkedin: { name: 'LinkedIn', color: '#0A66C2', icon: 'linkedin' },
  email: { name: 'Email', color: '#EA4335', icon: 'mail' },
  website: { name: 'Website', color: '#6B7280', icon: 'globe' },
  other: { name: 'Other', color: '#8B5CF6', icon: 'link' },
};

export type ThemeName = 'dark' | 'midnight' | 'cyberpunk' | 'nature' | 'sunset' | 'ocean' | 'custom';

export const THEMES: Record<ThemeName, { name: string; primary: string; secondary: string; bg: string }> = {
  dark: { name: 'Dark', primary: '#8b5cf6', secondary: '#06b6d4', bg: '#000000' },
  midnight: { name: 'Midnight', primary: '#6366f1', secondary: '#a855f7', bg: '#0a0a1a' },
  cyberpunk: { name: 'Cyberpunk', primary: '#f72585', secondary: '#4cc9f0', bg: '#0d0221' },
  nature: { name: 'Nature', primary: '#22c55e', secondary: '#84cc16', bg: '#0a1a0a' },
  sunset: { name: 'Sunset', primary: '#f97316', secondary: '#ef4444', bg: '#1a0a0a' },
  ocean: { name: 'Ocean', primary: '#0ea5e9', secondary: '#06b6d4', bg: '#0a1a2a' },
  custom: { name: 'Custom', primary: '#8b5cf6', secondary: '#06b6d4', bg: '#000000' },
};

export type LayoutStyle = 'centered' | 'left-aligned' | 'right-aligned' | 'full-width' | 'minimal' | 'grid';

export type CardStyle = 'glassmorphism' | 'solid' | 'outline' | 'neon' | 'gradient' | 'minimal';

export type AvatarShape = 'circle' | 'square' | 'rounded' | 'hexagon';

export type AnimationType = 'none' | 'bounce' | 'slide' | 'glow' | 'pulse' | 'shake' | 'float';

export type OverlayEffect = 'none' | 'snow' | 'rain' | 'stars' | 'fireflies' | 'sakura' | 'sparkles';

export interface DiscordPresence {
  status: string;
  activities: Array<{
    name: string;
    type: number;
    state?: string;
    details?: string;
    timestamps?: { start: number; end?: number };
    assets?: { large_image?: string; large_text?: string; small_image?: string; small_text?: string };
  }>;
  discord_user: {
    username: string;
    discriminator: string;
    id: string;
    avatar: string;
  };
}
