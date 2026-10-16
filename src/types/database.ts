// Généré via MCP Supabase generate_typescript_types, projet skzehjvqvdbxfehbrgzu, schéma novabudget, 16/10/2026.
// Régénération (lecture seule) : node scripts/generate-db-types.mjs --project-id <ref> --schema novabudget
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
    PostgrestVersion: "14.18"
  }
  novabudget: {
    Tables: {
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          id: string
          is_active: boolean
          notes: string | null
          target_date: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          id: string
          is_active?: boolean
          notes?: string | null
          target_date: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          target_date?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      future_projects: {
        Row: {
          amount: number
          category: string
          created_at: string
          id: string
          is_active: boolean
          notes: string | null
          target_date: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          id: string
          is_active?: boolean
          notes?: string | null
          target_date: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          target_date?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inflows: {
        Row: {
          amount: number
          created_at: string
          id: string
          is_active: boolean
          notes: string | null
          target_date: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id: string
          is_active?: boolean
          notes?: string | null
          target_date: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          target_date?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      savings_accounts: {
        Row: {
          amount: number
          bank: string | null
          category: string
          created_at: string
          id: string
          name: string
          notes: string | null
          rate: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          bank?: string | null
          category: string
          created_at?: string
          id: string
          name: string
          notes?: string | null
          rate?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          bank?: string | null
          category?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          rate?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          monthly_savings: number
          safety_cushion: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          monthly_savings?: number
          safety_cushion?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          monthly_savings?: number
          safety_cushion?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "novabudget">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  novabudget: {
    Enums: {},
  },
} as const


// Alias dérivés du contrat généré ; aucun champ métier redéfini manuellement.
export type SavingsAccountRow = Database["novabudget"]["Tables"]["savings_accounts"]["Row"];
export type SavingsAccountInsert = Database["novabudget"]["Tables"]["savings_accounts"]["Insert"];
export type SavingsAccountUpdate = Database["novabudget"]["Tables"]["savings_accounts"]["Update"];
export type ExpenseRow = Database["novabudget"]["Tables"]["expenses"]["Row"];
export type ExpenseInsert = Database["novabudget"]["Tables"]["expenses"]["Insert"];
export type ExpenseUpdate = Database["novabudget"]["Tables"]["expenses"]["Update"];
export type FutureProjectRow = Database["novabudget"]["Tables"]["future_projects"]["Row"];
export type FutureProjectInsert = Database["novabudget"]["Tables"]["future_projects"]["Insert"];
export type FutureProjectUpdate = Database["novabudget"]["Tables"]["future_projects"]["Update"];
export type InflowRow = Database["novabudget"]["Tables"]["inflows"]["Row"];
export type InflowInsert = Database["novabudget"]["Tables"]["inflows"]["Insert"];
export type InflowUpdate = Database["novabudget"]["Tables"]["inflows"]["Update"];
export type UserSettingsRow = Database["novabudget"]["Tables"]["user_settings"]["Row"];
export type UserSettingsInsert = Database["novabudget"]["Tables"]["user_settings"]["Insert"];
export type UserSettingsUpdate = Database["novabudget"]["Tables"]["user_settings"]["Update"];
