export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      api_sync_state: {
        Row: {
          endpoint: string
          etag: string
          last_sync: string | null
        }
        Insert: {
          endpoint: string
          etag: string
          last_sync?: string | null
        }
        Update: {
          endpoint?: string
          etag?: string
          last_sync?: string | null
        }
        Relationships: []
      }
      group_standings: {
        Row: {
          drawn: number | null
          goals_against: number | null
          goals_diff: number | null
          goals_for: number | null
          group_letter: string
          id: string
          lost: number | null
          played: number | null
          points: number | null
          rank: number
          team_name: string
          updated_at: string | null
          won: number | null
        }
        Insert: {
          drawn?: number | null
          goals_against?: number | null
          goals_diff?: number | null
          goals_for?: number | null
          group_letter: string
          id?: string
          lost?: number | null
          played?: number | null
          points?: number | null
          rank: number
          team_name: string
          updated_at?: string | null
          won?: number | null
        }
        Update: {
          drawn?: number | null
          goals_against?: number | null
          goals_diff?: number | null
          goals_for?: number | null
          group_letter?: string
          id?: string
          lost?: number | null
          played?: number | null
          points?: number | null
          rank?: number
          team_name?: string
          updated_at?: string | null
          won?: number | null
        }
        Relationships: []
      }
      league_comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          emoji: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "league_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_comment_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      league_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          league_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          league_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          league_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_comments_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      league_members: {
        Row: {
          joined_at: string | null
          league_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string | null
          league_id: string
          user_id: string
        }
        Update: {
          joined_at?: string | null
          league_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "league_members_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          id: string
          invite_code: string
          name: string
          owner_id: string | null
        }
        Insert: {
          id?: string
          invite_code: string
          name: string
          owner_id?: string | null
        }
        Update: {
          id?: string
          invite_code?: string
          name?: string
          owner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leagues_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      long_term_predictions: {
        Row: {
          champion_team: string
          created_at: string
          id: string
          runner_up_team: string
          updated_at: string
          user_id: string
        }
        Insert: {
          champion_team: string
          created_at?: string
          id?: string
          runner_up_team: string
          updated_at?: string
          user_id: string
        }
        Update: {
          champion_team?: string
          created_at?: string
          id?: string
          runner_up_team?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "long_term_predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_score: number | null
          away_team: string
          group_letter: string | null
          home_score: number | null
          home_team: string
          id: string
          kickoff_time: string
          match_number: number | null
          stage: string
          status: string
        }
        Insert: {
          away_score?: number | null
          away_team: string
          group_letter?: string | null
          home_score?: number | null
          home_team: string
          id?: string
          kickoff_time: string
          match_number?: number | null
          stage?: string
          status?: string
        }
        Update: {
          away_score?: number | null
          away_team?: string
          group_letter?: string | null
          home_score?: number | null
          home_team?: string
          id?: string
          kickoff_time?: string
          match_number?: number | null
          stage?: string
          status?: string
        }
        Relationships: []
      }
      predictions: {
        Row: {
          away_score: number
          home_score: number
          id: string
          match_id: string
          points: number | null
          user_id: string
        }
        Insert: {
          away_score: number
          home_score: number
          id?: string
          match_id: string
          points?: number | null
          user_id: string
        }
        Update: {
          away_score?: number
          home_score?: number
          id?: string
          match_id?: string
          points?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          display_name?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_results: {
        Row: {
          champion_team: string | null
          id: number
          runner_up_team: string | null
          updated_at: string | null
        }
        Insert: {
          champion_team?: string | null
          id?: number
          runner_up_team?: string | null
          updated_at?: string | null
        }
        Update: {
          champion_team?: string | null
          id?: number
          runner_up_team?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          email: string | null
          id: string
          name: string | null
        }
        Insert: {
          avatar_url?: string | null
          email?: string | null
          id: string
          name?: string | null
        }
        Update: {
          avatar_url?: string | null
          email?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      user_ranking: {
        Row: {
          display_name: string | null
          total_points: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "predictions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_global_standings: {
        Args: never
        Returns: {
          avatar_url: string
          correct_count: number
          display_name: string
          exact_count: number
          total_points: number
          user_id: string
        }[]
      }
      get_league_comments: {
        Args: { p_league_id: string }
        Returns: {
          avatar_url: string
          content: string
          created_at: string
          display_name: string
          id: string
          league_id: string
          reactions: Json
          user_id: string
        }[]
      }
      get_league_standings: {
        Args: { p_league_id: string }
        Returns: {
          avatar_url: string
          display_name: string
          total_points: number
          user_id: string
        }[]
      }
      get_league_stats: {
        Args: { p_league_id: string }
        Returns: {
          metric: string
          user_avatar_url: string
          user_id: string
          user_name: string
          value: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

