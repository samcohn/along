// Auto-generated Supabase database types placeholder.
// Replace with output of: npx supabase gen types typescript --project-id <your-project-id>

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      blueprints: {
        Row: {
          id: string
          owner_id: string
          story_intent: string
          bounding_context: Json
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          story_intent: string
          bounding_context?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          story_intent?: string
          bounding_context?: Json
          metadata?: Json
          updated_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          blueprint_id: string
          name: string
          coordinates: Json
          category: string[]
          timestamp: string | null
          notes: string
          source_type: string
          source_id: string | null
          source_name: string | null
          source_url: string | null
          confidence: number | null
          created_at: string
        }
        Insert: {
          id?: string
          blueprint_id: string
          name: string
          coordinates: Json
          category?: string[]
          timestamp?: string | null
          notes?: string
          source_type?: string
          source_id?: string | null
          source_name?: string | null
          source_url?: string | null
          confidence?: number | null
          created_at?: string
        }
        Update: {
          name?: string
          coordinates?: Json
          category?: string[]
          timestamp?: string | null
          notes?: string
          source_type?: string
          source_id?: string | null
          source_name?: string | null
          source_url?: string | null
          confidence?: number | null
        }
      }
      photos: {
        Row: {
          id: string
          location_id: string
          storage_url: string
          exif_lat: number | null
          exif_lng: number | null
          exif_timestamp: string | null
          exif_bearing: number | null
          caption: string | null
          created_at: string
        }
        Insert: {
          id?: string
          location_id: string
          storage_url: string
          exif_lat?: number | null
          exif_lng?: number | null
          exif_timestamp?: string | null
          exif_bearing?: number | null
          caption?: string | null
          created_at?: string
        }
        Update: {
          caption?: string | null
        }
      }
      artifacts: {
        Row: {
          id: string
          blueprint_id: string
          artifact_type: string
          preset_id: string
          config_overrides: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          blueprint_id: string
          artifact_type: string
          preset_id: string
          config_overrides?: Json | null
          created_at?: string
        }
        Update: {
          artifact_type?: string
          preset_id?: string
          config_overrides?: Json | null
        }
      }
      collaborators: {
        Row: {
          id: string
          blueprint_id: string
          user_id: string
          role: string
          invited_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          blueprint_id: string
          user_id: string
          role?: string
          invited_at?: string
          accepted_at?: string | null
        }
        Update: {
          role?: string
          accepted_at?: string | null
        }
      }
      living_dataset_configs: {
        Row: {
          id: string
          blueprint_id: string
          scraper_config: Json
          cron_schedule: string
          last_run_at: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          blueprint_id: string
          scraper_config: Json
          cron_schedule: string
          last_run_at?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          scraper_config?: Json
          cron_schedule?: string
          last_run_at?: string | null
          status?: string
        }
      }
      preset_registry: {
        Row: {
          id: string
          name: string
          artifact_type: string
          mapbox_style_url: string
          decklgl_config: Json
          atmosphere_config: Json
          typography_system: Json
          post_processing: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          artifact_type: string
          mapbox_style_url: string
          decklgl_config?: Json
          atmosphere_config?: Json
          typography_system?: Json
          post_processing?: Json
          created_at?: string
        }
        Update: {
          name?: string
          mapbox_style_url?: string
          decklgl_config?: Json
          atmosphere_config?: Json
          typography_system?: Json
          post_processing?: Json
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
