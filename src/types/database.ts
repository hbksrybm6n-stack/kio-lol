export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          username: string
          display_name: string
          bio: string
          avatar_url: string
          banner_url: string
          is_active: boolean
          is_admin: boolean
          view_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          username: string
          display_name?: string
          bio?: string
          avatar_url?: string
          banner_url?: string
          is_active?: boolean
          is_admin?: boolean
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          username?: string
          display_name?: string
          bio?: string
          avatar_url?: string
          banner_url?: string
          is_active?: boolean
          is_admin?: boolean
          view_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      profile_config: {
        Row: {
          id: string
          profile_id: string
          theme: string
          primary_color: string
          secondary_color: string
          accent_color: string
          background_color: string
          text_color: string
          background_type: string
          background_url: string
          background_video_url: string
          background_blur: number
          font_family: string
          heading_font: string
          mono_font: string
          enable_particles: boolean
          particle_color: string
          particle_count: number
          enable_snow: boolean
          enable_glow: boolean
          glow_color: string
          enable_custom_cursor: boolean
          cursor_url: string
          enable_typewriter: boolean
          enable_3d_tilt: boolean
          enable_matrix_rain: boolean
          enable_floating_shapes: boolean
          enable_neon_border: boolean
          enable_animated_gradient: boolean
          overlay_effect: string
          overlay_opacity: number
          card_style: string
          card_opacity: number
          card_blur: number
          card_border_radius: number
          music_url: string
          music_autoplay: boolean
          music_volume: number
          discord_user_id: string
          show_discord_status: boolean
          show_discord_rpc: boolean
          layout_style: string
          show_avatar: boolean
          avatar_shape: string
          avatar_size: number
          show_badges: boolean
          show_views: boolean
          show_social_links: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          theme?: string
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          background_color?: string
          text_color?: string
          background_type?: string
          background_url?: string
          background_video_url?: string
          background_blur?: number
          font_family?: string
          heading_font?: string
          mono_font?: string
          enable_particles?: boolean
          particle_color?: string
          particle_count?: number
          enable_snow?: boolean
          enable_glow?: boolean
          glow_color?: string
          enable_custom_cursor?: boolean
          cursor_url?: string
          enable_typewriter?: boolean
          enable_3d_tilt?: boolean
          enable_matrix_rain?: boolean
          enable_floating_shapes?: boolean
          enable_neon_border?: boolean
          enable_animated_gradient?: boolean
          overlay_effect?: string
          overlay_opacity?: number
          card_style?: string
          card_opacity?: number
          card_blur?: number
          card_border_radius?: number
          music_url?: string
          music_autoplay?: boolean
          music_volume?: number
          discord_user_id?: string
          show_discord_status?: boolean
          show_discord_rpc?: boolean
          layout_style?: string
          show_avatar?: boolean
          avatar_shape?: string
          avatar_size?: number
          show_badges?: boolean
          show_views?: boolean
          show_social_links?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          theme?: string
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          background_color?: string
          text_color?: string
          background_type?: string
          background_url?: string
          background_video_url?: string
          background_blur?: number
          font_family?: string
          heading_font?: string
          mono_font?: string
          enable_particles?: boolean
          particle_color?: string
          particle_count?: number
          enable_snow?: boolean
          enable_glow?: boolean
          glow_color?: string
          enable_custom_cursor?: boolean
          cursor_url?: string
          enable_typewriter?: boolean
          enable_3d_tilt?: boolean
          enable_matrix_rain?: boolean
          enable_floating_shapes?: boolean
          enable_neon_border?: boolean
          enable_animated_gradient?: boolean
          overlay_effect?: string
          overlay_opacity?: number
          card_style?: string
          card_opacity?: number
          card_blur?: number
          card_border_radius?: number
          music_url?: string
          music_autoplay?: boolean
          music_volume?: number
          discord_user_id?: string
          show_discord_status?: boolean
          show_discord_rpc?: boolean
          layout_style?: string
          show_avatar?: boolean
          avatar_shape?: string
          avatar_size?: number
          show_badges?: boolean
          show_views?: boolean
          show_social_links?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      links: {
        Row: {
          id: string
          profile_id: string
          title: string
          url: string
          description: string
          icon: string
          color: string
          background_color: string
          hover_color: string
          animation: string
          sort_order: number
          is_active: boolean
          click_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          title: string
          url: string
          description?: string
          icon?: string
          color?: string
          background_color?: string
          hover_color?: string
          animation?: string
          sort_order?: number
          is_active?: boolean
          click_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          title?: string
          url?: string
          description?: string
          icon?: string
          color?: string
          background_color?: string
          hover_color?: string
          animation?: string
          sort_order?: number
          is_active?: boolean
          click_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      social_links: {
        Row: {
          id: string
          profile_id: string
          platform: string
          url: string
          username: string
          color: string
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          platform: string
          url: string
          username?: string
          color?: string
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          platform?: string
          url?: string
          username?: string
          color?: string
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
      }
      badges: {
        Row: {
          id: string
          name: string
          icon: string
          color: string
          description: string
          is_system: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          icon: string
          color?: string
          description?: string
          is_system?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string
          color?: string
          description?: string
          is_system?: boolean
          created_at?: string
        }
      }
      user_badges: {
        Row: {
          id: string
          profile_id: string
          badge_id: string
          awarded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          badge_id: string
          awarded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          badge_id?: string
          awarded_by?: string | null
          created_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          creator_id: string | null
          name: string
          description: string
          thumbnail_url: string
          config: Json
          is_public: boolean
          uses_count: number
          likes_count: number
          share_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id?: string | null
          name: string
          description?: string
          thumbnail_url?: string
          config?: Json
          is_public?: boolean
          uses_count?: number
          likes_count?: number
          share_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          creator_id?: string | null
          name?: string
          description?: string
          thumbnail_url?: string
          config?: Json
          is_public?: boolean
          uses_count?: number
          likes_count?: number
          share_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      template_likes: {
        Row: {
          id: string
          template_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          template_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          user_id?: string
          created_at?: string
        }
      }
      analytics: {
        Row: {
          id: string
          profile_id: string
          event_type: string
          link_id: string | null
          visitor_ip: string | null
          visitor_agent: string | null
          referer: string | null
          country: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          event_type: string
          link_id?: string | null
          visitor_ip?: string | null
          visitor_agent?: string | null
          referer?: string | null
          country?: string
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          event_type?: string
          link_id?: string | null
          visitor_ip?: string | null
          visitor_agent?: string | null
          referer?: string | null
          country?: string
          created_at?: string
        }
      }
      daily_stats: {
        Row: {
          id: string
          profile_id: string
          date: string
          views: number
          link_clicks: number
          unique_visitors: number
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          date?: string
          views?: number
          link_clicks?: number
          unique_visitors?: number
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          date?: string
          views?: number
          link_clicks?: number
          unique_visitors?: number
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string | null
          reported_profile_id: string | null
          reason: string
          description: string
          status: string
          resolved_by: string | null
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          reporter_id?: string | null
          reported_profile_id?: string | null
          reason: string
          description?: string
          status?: string
          resolved_by?: string | null
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          reporter_id?: string | null
          reported_profile_id?: string | null
          reason?: string
          description?: string
          status?: string
          resolved_by?: string | null
          created_at?: string
          resolved_at?: string | null
        }
      }
    }
    Functions: {
      increment_view_count: {
        Args: { profile_uuid: string }
        Returns: void
      }
      increment_link_clicks: {
        Args: { link_uuid: string }
        Returns: void
      }
      upsert_daily_stats: {
        Args: { profile_uuid: string; event_type: string }
        Returns: void
      }
    }
  }
}
