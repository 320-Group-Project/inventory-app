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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      Club: {
        Row: {
          club_id: number
          name: string | null
        }
        Insert: {
          club_id?: number
          name?: string | null
        }
        Update: {
          club_id?: number
          name?: string | null
        }
        Relationships: []
      }
      item: {
        Row: {
          cat_id: number | null
          condition: Database["public"]["Enums"]["condition"] | null
          description: string | null
          item_id: number
          item_image_url: string | null
          name: string | null
        }
        Insert: {
          cat_id?: number | null
          condition?: Database["public"]["Enums"]["condition"] | null
          description?: string | null
          item_id?: number
          item_image_url?: string | null
          name?: string | null
        }
        Update: {
          cat_id?: number | null
          condition?: Database["public"]["Enums"]["condition"] | null
          description?: string | null
          item_id?: number
          item_image_url?: string | null
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "item_category"
            referencedColumns: ["item_cat_id"]
          },
        ]
      }
      item_category: {
        Row: {
          club_id: number
          description: string | null
          item_cat_id: number
          item_cat_image_url: string | null
          name: string
          quantity: string
        }
        Insert: {
          club_id: number
          description?: string | null
          item_cat_id?: number
          item_cat_image_url?: string | null
          name: string
          quantity: string
        }
        Update: {
          club_id?: number
          description?: string | null
          item_cat_id?: number
          item_cat_image_url?: string | null
          name?: string
          quantity?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_category_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "Club"
            referencedColumns: ["club_id"]
          },
        ]
      }
      Role: {
        Row: {
          club_id: number
          role: string | null
          UID: string
        }
        Insert: {
          club_id: number
          role?: string | null
          UID: string
        }
        Update: {
          club_id?: number
          role?: string | null
          UID?: string
        }
        Relationships: [
          {
            foreignKeyName: "Role_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "Club"
            referencedColumns: ["club_id"]
          },
          {
            foreignKeyName: "Role_UID_fkey"
            columns: ["UID"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["UID"]
          },
        ]
      }
      User: {
        Row: {
          email: string | null
          fname: string | null
          lname: string | null
          password: string | null
          UID: string
          user_image_url: string | null
        }
        Insert: {
          email?: string | null
          fname?: string | null
          lname?: string | null
          password?: string | null
          UID: string
          user_image_url?: string | null
        }
        Update: {
          email?: string | null
          fname?: string | null
          lname?: string | null
          password?: string | null
          UID?: string
          user_image_url?: string | null
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
      condition: "1" | "2" | "3"
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
    Enums: {
      condition: ["1", "2", "3"],
    },
  },
} as const
