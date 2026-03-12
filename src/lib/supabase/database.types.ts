export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      cook_plans: {
        Row: {
          created_at: string;
          id: string;
          menu_id: string;
          mise_en_place: string | null;
          overview: string | null;
          plating_overview: string | null;
          service_notes: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          menu_id: string;
          mise_en_place?: string | null;
          overview?: string | null;
          plating_overview?: string | null;
          service_notes?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          menu_id?: string;
          mise_en_place?: string | null;
          overview?: string | null;
          plating_overview?: string | null;
          service_notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cook_plans_menu_id_fkey";
            columns: ["menu_id"];
            isOneToOne: true;
            referencedRelation: "menus";
            referencedColumns: ["id"];
          },
        ];
      };
      cook_steps: {
        Row: {
          cook_plan_id: string;
          created_at: string;
          details: string;
          dish_name: string | null;
          id: string;
          phase: string;
          relative_minutes: number | null;
          step_no: number;
          title: string;
        };
        Insert: {
          cook_plan_id: string;
          created_at?: string;
          details: string;
          dish_name?: string | null;
          id?: string;
          phase: string;
          relative_minutes?: number | null;
          step_no: number;
          title: string;
        };
        Update: {
          cook_plan_id?: string;
          created_at?: string;
          details?: string;
          dish_name?: string | null;
          id?: string;
          phase?: string;
          relative_minutes?: number | null;
          step_no?: number;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cook_steps_cook_plan_id_fkey";
            columns: ["cook_plan_id"];
            isOneToOne: false;
            referencedRelation: "cook_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      dish_feedback: {
        Row: {
          comment: string | null;
          created_at: string;
          feedback_request_id: string;
          id: string;
          menu_dish_id: string;
          rating: number;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          feedback_request_id: string;
          id?: string;
          menu_dish_id: string;
          rating: number;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          feedback_request_id?: string;
          id?: string;
          menu_dish_id?: string;
          rating?: number;
        };
        Relationships: [
          {
            foreignKeyName: "dish_feedback_feedback_request_id_fkey";
            columns: ["feedback_request_id"];
            isOneToOne: false;
            referencedRelation: "feedback_requests";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dish_feedback_menu_dish_id_fkey";
            columns: ["menu_dish_id"];
            isOneToOne: false;
            referencedRelation: "menu_dishes";
            referencedColumns: ["id"];
          },
        ];
      };
      feedback_requests: {
        Row: {
          completed_at: string | null;
          created_at: string;
          id: string;
          invitee_first_name: string;
          invitee_phone: string;
          menu_id: string;
          opened_at: string | null;
          sent_at: string | null;
          status: string;
          token_hash: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          invitee_first_name: string;
          invitee_phone: string;
          menu_id: string;
          opened_at?: string | null;
          sent_at?: string | null;
          status?: string;
          token_hash: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          invitee_first_name?: string;
          invitee_phone?: string;
          menu_id?: string;
          opened_at?: string | null;
          sent_at?: string | null;
          status?: string;
          token_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: "feedback_requests_menu_id_fkey";
            columns: ["menu_id"];
            isOneToOne: false;
            referencedRelation: "menus";
            referencedColumns: ["id"];
          },
        ];
      };
      menu_dishes: {
        Row: {
          course_label: string | null;
          course_no: number;
          created_at: string;
          decoration_notes: string | null;
          description: string;
          dish_name: string;
          id: string;
          image_path: string | null;
          image_prompt: string | null;
          menu_option_id: string;
          plating_notes: string | null;
        };
        Insert: {
          course_label?: string | null;
          course_no: number;
          created_at?: string;
          decoration_notes?: string | null;
          description: string;
          dish_name: string;
          id?: string;
          image_path?: string | null;
          image_prompt?: string | null;
          menu_option_id: string;
          plating_notes?: string | null;
        };
        Update: {
          course_label?: string | null;
          course_no?: number;
          created_at?: string;
          decoration_notes?: string | null;
          description?: string;
          dish_name?: string;
          id?: string;
          image_path?: string | null;
          image_prompt?: string | null;
          menu_option_id?: string;
          plating_notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "menu_dishes_menu_option_id_fkey";
            columns: ["menu_option_id"];
            isOneToOne: false;
            referencedRelation: "menu_options";
            referencedColumns: ["id"];
          },
        ];
      };
      menu_favorites: {
        Row: {
          created_at: string;
          id: string;
          menu_id: string;
          owner_id: string;
          people_count: number | null;
          rating_percent: number;
          served_on: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          menu_id: string;
          owner_id: string;
          people_count?: number | null;
          rating_percent: number;
          served_on?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          menu_id?: string;
          owner_id?: string;
          people_count?: number | null;
          rating_percent?: number;
          served_on?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "menu_favorites_menu_id_fkey";
            columns: ["menu_id"];
            isOneToOne: true;
            referencedRelation: "menus";
            referencedColumns: ["id"];
          },
        ];
      };
      menu_feedback_summary: {
        Row: {
          menu_id: string;
          overall_score: number;
          response_count: number;
          updated_at: string;
        };
        Insert: {
          menu_id: string;
          overall_score?: number;
          response_count?: number;
          updated_at?: string;
        };
        Update: {
          menu_id?: string;
          overall_score?: number;
          response_count?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "menu_feedback_summary_menu_id_fkey";
            columns: ["menu_id"];
            isOneToOne: true;
            referencedRelation: "menus";
            referencedColumns: ["id"];
          },
        ];
      };
      menu_invites: {
        Row: {
          channel: string;
          created_at: string;
          id: string;
          invitee_first_name: string;
          invitee_note: string | null;
          invitee_phone: string;
          menu_id: string;
          opened_at: string | null;
          selected_option_id: string | null;
          sent_at: string | null;
          status: string;
          token_hash: string;
          voted_at: string | null;
        };
        Insert: {
          channel?: string;
          created_at?: string;
          id?: string;
          invitee_first_name: string;
          invitee_note?: string | null;
          invitee_phone: string;
          menu_id: string;
          opened_at?: string | null;
          selected_option_id?: string | null;
          sent_at?: string | null;
          status?: string;
          token_hash: string;
          voted_at?: string | null;
        };
        Update: {
          channel?: string;
          created_at?: string;
          id?: string;
          invitee_first_name?: string;
          invitee_note?: string | null;
          invitee_phone?: string;
          menu_id?: string;
          opened_at?: string | null;
          selected_option_id?: string | null;
          sent_at?: string | null;
          status?: string;
          token_hash?: string;
          voted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "menu_invites_menu_id_fkey";
            columns: ["menu_id"];
            isOneToOne: false;
            referencedRelation: "menus";
            referencedColumns: ["id"];
          },
        ];
      };
      menu_options: {
        Row: {
          beverage_pairing: string | null;
          chef_notes: string | null;
          concept: string | null;
          concept_summary: string | null;
          created_at: string;
          hero_image_path: string | null;
          hero_image_prompt: string | null;
          id: string;
          menu_id: string;
          michelin_name: string;
          option_no: number;
          sort_order: number | null;
          title: string | null;
        };
        Insert: {
          beverage_pairing?: string | null;
          chef_notes?: string | null;
          concept?: string | null;
          concept_summary?: string | null;
          created_at?: string;
          hero_image_path?: string | null;
          hero_image_prompt?: string | null;
          id?: string;
          menu_id: string;
          michelin_name: string;
          option_no?: number;
          sort_order?: number | null;
          title?: string | null;
        };
        Update: {
          beverage_pairing?: string | null;
          chef_notes?: string | null;
          concept?: string | null;
          concept_summary?: string | null;
          created_at?: string;
          hero_image_path?: string | null;
          hero_image_prompt?: string | null;
          id?: string;
          menu_id?: string;
          michelin_name?: string;
          option_no?: number;
          sort_order?: number | null;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "menu_options_menu_id_fkey";
            columns: ["menu_id"];
            isOneToOne: false;
            referencedRelation: "menus";
            referencedColumns: ["id"];
          },
        ];
      };
      menus: {
        Row: {
          approved_option_id: string | null;
          chef_user_id: string | null;
          course_count: number;
          created_at: string;
          id: string;
          invitee_count: number | null;
          invitee_preferences: Json | null;
          meal_type: string;
          notes: string | null;
          owner_id: string;
          restrictions: string[];
          serve_at: string | null;
          status: string;
          title: string | null;
          updated_at: string;
        };
        Insert: {
          approved_option_id?: string | null;
          chef_user_id?: string | null;
          course_count: number;
          created_at?: string;
          id?: string;
          invitee_count?: number | null;
          invitee_preferences?: Json | null;
          meal_type: string;
          notes?: string | null;
          owner_id?: string;
          restrictions?: string[];
          serve_at?: string | null;
          status?: string;
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          approved_option_id?: string | null;
          chef_user_id?: string | null;
          course_count?: number;
          created_at?: string;
          id?: string;
          invitee_count?: number | null;
          invitee_preferences?: Json | null;
          meal_type?: string;
          notes?: string | null;
          owner_id?: string;
          restrictions?: string[];
          serve_at?: string | null;
          status?: string;
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      shopping_items: {
        Row: {
          created_at: string;
          estimated_total_price_eur: number | null;
          estimated_unit_price_eur: number | null;
          id: string;
          item_name: string;
          note: string | null;
          purchased: boolean;
          quantity: number | null;
          section: string;
          shopping_list_id: string;
          sort_order: number;
          unit: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          estimated_total_price_eur?: number | null;
          estimated_unit_price_eur?: number | null;
          id?: string;
          item_name: string;
          note?: string | null;
          purchased?: boolean;
          quantity?: number | null;
          section: string;
          shopping_list_id: string;
          sort_order?: number;
          unit?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          estimated_total_price_eur?: number | null;
          estimated_unit_price_eur?: number | null;
          id?: string;
          item_name?: string;
          note?: string | null;
          purchased?: boolean;
          quantity?: number | null;
          section?: string;
          shopping_list_id?: string;
          sort_order?: number;
          unit?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shopping_items_shopping_list_id_fkey";
            columns: ["shopping_list_id"];
            isOneToOne: false;
            referencedRelation: "shopping_lists";
            referencedColumns: ["id"];
          },
        ];
      };
      shopping_lists: {
        Row: {
          created_at: string;
          estimated_total_eur: number | null;
          generated_by: string;
          id: string;
          menu_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          estimated_total_eur?: number | null;
          generated_by?: string;
          id?: string;
          menu_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          estimated_total_eur?: number | null;
          generated_by?: string;
          id?: string;
          menu_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "shopping_lists_menu_id_fkey";
            columns: ["menu_id"];
            isOneToOne: true;
            referencedRelation: "menus";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
