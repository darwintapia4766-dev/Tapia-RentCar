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
      bookings: {
        Row: {
          client_email: string
          client_name: string
          client_phone: string
          created_at: string
          days: number
          delivery_location: string
          delivery_time: string
          document_id: string | null
          end_date: string
          flight_number: string | null
          id: string
          price_per_day: number
          start_date: string
          status: string
          total_price: number
          user_id: string | null
          vehicle_id: string
          vehicle_name: string
        }
        Insert: {
          client_email: string
          client_name: string
          client_phone: string
          created_at?: string
          days: number
          delivery_location: string
          delivery_time: string
          document_id?: string | null
          end_date: string
          flight_number?: string | null
          id?: string
          price_per_day: number
          start_date: string
          status?: string
          total_price: number
          user_id?: string | null
          vehicle_id: string
          vehicle_name: string
        }
        Update: {
          client_email?: string
          client_name?: string
          client_phone?: string
          created_at?: string
          days?: number
          delivery_location?: string
          delivery_time?: string
          document_id?: string | null
          end_date?: string
          flight_number?: string | null
          id?: string
          price_per_day?: number
          start_date?: string
          status?: string
          total_price?: number
          user_id?: string | null
          vehicle_id?: string
          vehicle_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contacts: {
        Row: {
          bookings_count: number
          created_at: string
          email: string
          id: string
          last_booking_at: string
          name: string
          phone: string
          updated_at: string
        }
        Insert: {
          bookings_count?: number
          created_at?: string
          email: string
          id?: string
          last_booking_at?: string
          name: string
          phone: string
          updated_at?: string
        }
        Update: {
          bookings_count?: number
          created_at?: string
          email?: string
          id?: string
          last_booking_at?: string
          name?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          phone: string | null
          photo_url: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          phone?: string | null
          photo_url?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          photo_url?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          price_text: string
          sort_order: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          name: string
          price_text?: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          price_text?: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          ac: boolean
          airbags: boolean
          available: boolean
          base_rate: number
          blocked_dates: Json
          bluetooth: boolean
          car_play: boolean
          category: string
          created_at: string
          cruise_control: boolean
          engine: string
          extra_features: string[]
          fuel: string
          id: string
          images: string[]
          keyless_start: boolean
          leather_seats: boolean
          license_plate: string | null
          luggage: string
          name: string
          parking_sensors: boolean
          reverse_camera: boolean
          seats: number
          sort_order: number
          sunroof: boolean
          touchscreen: boolean
          traction: string
          transmission: string
          units: number
          updated_at: string
          usb: boolean
          wireless_charger: boolean
          year: number
        }
        Insert: {
          ac?: boolean
          airbags?: boolean
          available?: boolean
          base_rate: number
          blocked_dates?: Json
          bluetooth?: boolean
          car_play?: boolean
          category?: string
          created_at?: string
          cruise_control?: boolean
          engine?: string
          extra_features?: string[]
          fuel?: string
          id?: string
          images?: string[]
          keyless_start?: boolean
          leather_seats?: boolean
          license_plate?: string | null
          luggage?: string
          name: string
          parking_sensors?: boolean
          reverse_camera?: boolean
          seats?: number
          sort_order?: number
          sunroof?: boolean
          touchscreen?: boolean
          traction?: string
          transmission?: string
          units?: number
          updated_at?: string
          usb?: boolean
          wireless_charger?: boolean
          year: number
        }
        Update: {
          ac?: boolean
          airbags?: boolean
          available?: boolean
          base_rate?: number
          blocked_dates?: Json
          bluetooth?: boolean
          car_play?: boolean
          category?: string
          created_at?: string
          cruise_control?: boolean
          engine?: string
          extra_features?: string[]
          fuel?: string
          id?: string
          images?: string[]
          keyless_start?: boolean
          leather_seats?: boolean
          license_plate?: string | null
          luggage?: string
          name?: string
          parking_sensors?: boolean
          reverse_camera?: boolean
          seats?: number
          sort_order?: number
          sunroof?: boolean
          touchscreen?: boolean
          traction?: string
          transmission?: string
          units?: number
          updated_at?: string
          usb?: boolean
          wireless_charger?: boolean
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "client"
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
      app_role: ["admin", "client"],
    },
  },
} as const
