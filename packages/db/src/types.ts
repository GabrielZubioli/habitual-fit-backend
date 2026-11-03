export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          id: string;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          title?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      ai_messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string;
          id: string;
          input_tokens: number | null;
          output_tokens: number | null;
          role: string;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string;
          id?: string;
          input_tokens?: number | null;
          output_tokens?: number | null;
          role: string;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string;
          id?: string;
          input_tokens?: number | null;
          output_tokens?: number | null;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "ai_conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_recommendations: {
        Row: {
          body: string;
          created_at: string;
          dedupe_key: string;
          expires_at: string | null;
          id: string;
          kind: Database["public"]["Enums"]["ai_recommendation_kind_t"];
          payload: Json | null;
          resolved_at: string | null;
          severity: number;
          status: string;
          title: string;
          user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          dedupe_key: string;
          expires_at?: string | null;
          id?: string;
          kind: Database["public"]["Enums"]["ai_recommendation_kind_t"];
          payload?: Json | null;
          resolved_at?: string | null;
          severity?: number;
          status?: string;
          title: string;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          dedupe_key?: string;
          expires_at?: string | null;
          id?: string;
          kind?: Database["public"]["Enums"]["ai_recommendation_kind_t"];
          payload?: Json | null;
          resolved_at?: string | null;
          severity?: number;
          status?: string;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      body_measurements: {
        Row: {
          abdomen_cm: number | null;
          arm_cm: number | null;
          body_fat_pct: number | null;
          calf_cm: number | null;
          chest_cm: number | null;
          created_at: string;
          forearm_cm: number | null;
          hip_cm: number | null;
          id: string;
          log_date: string;
          neck_cm: number | null;
          notes: string | null;
          shoulder_cm: number | null;
          thigh_cm: number | null;
          user_id: string;
          waist_cm: number | null;
        };
        Insert: {
          abdomen_cm?: number | null;
          arm_cm?: number | null;
          body_fat_pct?: number | null;
          calf_cm?: number | null;
          chest_cm?: number | null;
          created_at?: string;
          forearm_cm?: number | null;
          hip_cm?: number | null;
          id?: string;
          log_date?: string;
          neck_cm?: number | null;
          notes?: string | null;
          shoulder_cm?: number | null;
          thigh_cm?: number | null;
          user_id: string;
          waist_cm?: number | null;
        };
        Update: {
          abdomen_cm?: number | null;
          arm_cm?: number | null;
          body_fat_pct?: number | null;
          calf_cm?: number | null;
          chest_cm?: number | null;
          created_at?: string;
          forearm_cm?: number | null;
          hip_cm?: number | null;
          id?: string;
          log_date?: string;
          neck_cm?: number | null;
          notes?: string | null;
          shoulder_cm?: number | null;
          thigh_cm?: number | null;
          user_id?: string;
          waist_cm?: number | null;
        };
        Relationships: [];
      };
      body_weights: {
        Row: {
          created_at: string;
          id: string;
          log_date: string;
          notes: string | null;
          user_id: string;
          weight_kg: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          log_date?: string;
          notes?: string | null;
          user_id: string;
          weight_kg: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          log_date?: string;
          notes?: string | null;
          user_id?: string;
          weight_kg?: number;
        };
        Relationships: [];
      };
      diet_days: {
        Row: {
          log_date: string;
          materialized_at: string;
          meal_labels: Json;
          notes: string | null;
          plan_id: string | null;
          user_id: string;
        };
        Insert: {
          log_date: string;
          materialized_at?: string;
          meal_labels?: Json;
          notes?: string | null;
          plan_id?: string | null;
          user_id: string;
        };
        Update: {
          log_date?: string;
          materialized_at?: string;
          meal_labels?: Json;
          notes?: string | null;
          plan_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "diet_days_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "meal_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      exercise_favorites: {
        Row: {
          created_at: string;
          exercise_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          exercise_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          exercise_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exercise_favorites_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
        ];
      };
      exercise_muscles: {
        Row: {
          contribution: number;
          exercise_id: string;
          muscle: Database["public"]["Enums"]["muscle_t"];
        };
        Insert: {
          contribution: number;
          exercise_id: string;
          muscle: Database["public"]["Enums"]["muscle_t"];
        };
        Update: {
          contribution?: number;
          exercise_id?: string;
          muscle?: Database["public"]["Enums"]["muscle_t"];
        };
        Relationships: [
          {
            foreignKeyName: "exercise_muscles_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
        ];
      };
      exercises: {
        Row: {
          category: Database["public"]["Enums"]["exercise_category_t"];
          common_mistakes: string[] | null;
          contraindications: string[] | null;
          created_at: string;
          cues: string[] | null;
          default_cadence: string | null;
          deleted_at: string | null;
          equipment: Database["public"]["Enums"]["equipment_t"];
          execution: string[] | null;
          execution_en: string[] | null;
          execution_es: string[] | null;
          external_id: string | null;
          force_type: Database["public"]["Enums"]["force_type_t"] | null;
          id: string;
          image_url: string | null;
          image_urls: string[] | null;
          instructions: string | null;
          is_public: boolean;
          level: Database["public"]["Enums"]["exercise_level_t"];
          mechanic: Database["public"]["Enums"]["mechanic_t"] | null;
          media_id: string | null;
          media_ref: string | null;
          media_source: string | null;
          movement_pattern: Database["public"]["Enums"]["movement_pattern_t"] | null;
          name: string;
          name_en: string | null;
          name_es: string | null;
          owner_id: string | null;
          popularity: number;
          primary_muscle: Database["public"]["Enums"]["muscle_t"];
          secondary_muscles: Database["public"]["Enums"]["muscle_t"][];
          updated_at: string;
          video_url: string | null;
        };
        Insert: {
          category?: Database["public"]["Enums"]["exercise_category_t"];
          common_mistakes?: string[] | null;
          contraindications?: string[] | null;
          created_at?: string;
          cues?: string[] | null;
          default_cadence?: string | null;
          deleted_at?: string | null;
          equipment?: Database["public"]["Enums"]["equipment_t"];
          execution?: string[] | null;
          execution_en?: string[] | null;
          execution_es?: string[] | null;
          external_id?: string | null;
          force_type?: Database["public"]["Enums"]["force_type_t"] | null;
          id?: string;
          image_url?: string | null;
          image_urls?: string[] | null;
          instructions?: string | null;
          is_public?: boolean;
          level?: Database["public"]["Enums"]["exercise_level_t"];
          mechanic?: Database["public"]["Enums"]["mechanic_t"] | null;
          media_id?: string | null;
          media_ref?: string | null;
          media_source?: string | null;
          movement_pattern?: Database["public"]["Enums"]["movement_pattern_t"] | null;
          name: string;
          name_en?: string | null;
          name_es?: string | null;
          owner_id?: string | null;
          popularity?: number;
          primary_muscle: Database["public"]["Enums"]["muscle_t"];
          secondary_muscles?: Database["public"]["Enums"]["muscle_t"][];
          updated_at?: string;
          video_url?: string | null;
        };
        Update: {
          category?: Database["public"]["Enums"]["exercise_category_t"];
          common_mistakes?: string[] | null;
          contraindications?: string[] | null;
          created_at?: string;
          cues?: string[] | null;
          default_cadence?: string | null;
          deleted_at?: string | null;
          equipment?: Database["public"]["Enums"]["equipment_t"];
          execution?: string[] | null;
          execution_en?: string[] | null;
          execution_es?: string[] | null;
          external_id?: string | null;
          force_type?: Database["public"]["Enums"]["force_type_t"] | null;
          id?: string;
          image_url?: string | null;
          image_urls?: string[] | null;
          instructions?: string | null;
          is_public?: boolean;
          level?: Database["public"]["Enums"]["exercise_level_t"];
          mechanic?: Database["public"]["Enums"]["mechanic_t"] | null;
          media_id?: string | null;
          media_ref?: string | null;
          media_source?: string | null;
          movement_pattern?: Database["public"]["Enums"]["movement_pattern_t"] | null;
          name?: string;
          name_en?: string | null;
          name_es?: string | null;
          owner_id?: string | null;
          popularity?: number;
          primary_muscle?: Database["public"]["Enums"]["muscle_t"];
          secondary_muscles?: Database["public"]["Enums"]["muscle_t"][];
          updated_at?: string;
          video_url?: string | null;
        };
        Relationships: [];
      };
      food_favorites: {
        Row: {
          created_at: string;
          food_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          food_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          food_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "food_favorites_food_id_fkey";
            columns: ["food_id"];
            isOneToOne: false;
            referencedRelation: "foods";
            referencedColumns: ["id"];
          },
        ];
      };
      food_log_entries: {
        Row: {
          consumed: boolean;
          consumed_at: string | null;
          created_at: string;
          food_id: string;
          grams: number | null;
          id: string;
          log_date: string;
          meal_slot: Database["public"]["Enums"]["meal_slot_t"];
          notes: string | null;
          plan_item_id: string | null;
          servings: number;
          source: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          consumed?: boolean;
          consumed_at?: string | null;
          created_at?: string;
          food_id: string;
          grams?: number | null;
          id?: string;
          log_date?: string;
          meal_slot?: Database["public"]["Enums"]["meal_slot_t"];
          notes?: string | null;
          plan_item_id?: string | null;
          servings?: number;
          source?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          consumed?: boolean;
          consumed_at?: string | null;
          created_at?: string;
          food_id?: string;
          grams?: number | null;
          id?: string;
          log_date?: string;
          meal_slot?: Database["public"]["Enums"]["meal_slot_t"];
          notes?: string | null;
          plan_item_id?: string | null;
          servings?: number;
          source?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "food_log_entries_food_id_fkey";
            columns: ["food_id"];
            isOneToOne: false;
            referencedRelation: "foods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "food_log_entries_plan_item_id_fkey";
            columns: ["plan_item_id"];
            isOneToOne: false;
            referencedRelation: "meal_plan_items";
            referencedColumns: ["id"];
          },
        ];
      };
      food_substitution_prefs: {
        Row: {
          created_at: string;
          food_id: string;
          substitute_id: string;
          times_used: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          food_id: string;
          substitute_id: string;
          times_used?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          food_id?: string;
          substitute_id?: string;
          times_used?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "food_substitution_prefs_food_id_fkey";
            columns: ["food_id"];
            isOneToOne: false;
            referencedRelation: "foods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "food_substitution_prefs_substitute_id_fkey";
            columns: ["substitute_id"];
            isOneToOne: false;
            referencedRelation: "foods";
            referencedColumns: ["id"];
          },
        ];
      };
      foods: {
        Row: {
          barcode: string | null;
          brand: string | null;
          calcium_mg: number | null;
          carbs_g: number;
          category: Database["public"]["Enums"]["food_category_t"];
          cholesterol_mg: number | null;
          created_at: string;
          deleted_at: string | null;
          external_id: string | null;
          fat_g: number;
          fiber_g: number;
          household_grams: number | null;
          household_measure: string | null;
          id: string;
          image_url: string | null;
          iron_mg: number | null;
          is_public: boolean;
          is_staple: boolean;
          kcal: number;
          magnesium_mg: number | null;
          name: string;
          owner_id: string | null;
          phosphorus_mg: number | null;
          popularity: number;
          potassium_mg: number | null;
          protein_g: number;
          saturated_fat_g: number;
          serving_size_g: number;
          serving_unit: string;
          sodium_mg: number;
          source: string;
          sugar_g: number;
          updated_at: string;
          vitamin_a_mcg: number | null;
          vitamin_b12_mcg: number | null;
          vitamin_c_mg: number | null;
          vitamin_d_mcg: number | null;
          vitamin_e_mg: number | null;
          zinc_mg: number | null;
        };
        Insert: {
          barcode?: string | null;
          brand?: string | null;
          calcium_mg?: number | null;
          carbs_g?: number;
          category?: Database["public"]["Enums"]["food_category_t"];
          cholesterol_mg?: number | null;
          created_at?: string;
          deleted_at?: string | null;
          external_id?: string | null;
          fat_g?: number;
          fiber_g?: number;
          household_grams?: number | null;
          household_measure?: string | null;
          id?: string;
          image_url?: string | null;
          iron_mg?: number | null;
          is_public?: boolean;
          is_staple?: boolean;
          kcal?: number;
          magnesium_mg?: number | null;
          name: string;
          owner_id?: string | null;
          phosphorus_mg?: number | null;
          popularity?: number;
          potassium_mg?: number | null;
          protein_g?: number;
          saturated_fat_g?: number;
          serving_size_g?: number;
          serving_unit?: string;
          sodium_mg?: number;
          source?: string;
          sugar_g?: number;
          updated_at?: string;
          vitamin_a_mcg?: number | null;
          vitamin_b12_mcg?: number | null;
          vitamin_c_mg?: number | null;
          vitamin_d_mcg?: number | null;
          vitamin_e_mg?: number | null;
          zinc_mg?: number | null;
        };
        Update: {
          barcode?: string | null;
          brand?: string | null;
          calcium_mg?: number | null;
          carbs_g?: number;
          category?: Database["public"]["Enums"]["food_category_t"];
          cholesterol_mg?: number | null;
          created_at?: string;
          deleted_at?: string | null;
          external_id?: string | null;
          fat_g?: number;
          fiber_g?: number;
          household_grams?: number | null;
          household_measure?: string | null;
          id?: string;
          image_url?: string | null;
          iron_mg?: number | null;
          is_public?: boolean;
          is_staple?: boolean;
          kcal?: number;
          magnesium_mg?: number | null;
          name?: string;
          owner_id?: string | null;
          phosphorus_mg?: number | null;
          popularity?: number;
          potassium_mg?: number | null;
          protein_g?: number;
          saturated_fat_g?: number;
          serving_size_g?: number;
          serving_unit?: string;
          sodium_mg?: number;
          source?: string;
          sugar_g?: number;
          updated_at?: string;
          vitamin_a_mcg?: number | null;
          vitamin_b12_mcg?: number | null;
          vitamin_c_mg?: number | null;
          vitamin_d_mcg?: number | null;
          vitamin_e_mg?: number | null;
          zinc_mg?: number | null;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          achieved_at: string | null;
          created_at: string;
          id: string;
          is_active: boolean;
          kind: Database["public"]["Enums"]["goal_kind_t"];
          label: string;
          metric_key: string;
          notes: string | null;
          start_value: number | null;
          target_date: string | null;
          target_value: number;
          unit: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          achieved_at?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          kind: Database["public"]["Enums"]["goal_kind_t"];
          label: string;
          metric_key: string;
          notes?: string | null;
          start_value?: number | null;
          target_date?: string | null;
          target_value: number;
          unit?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          achieved_at?: string | null;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          kind?: Database["public"]["Enums"]["goal_kind_t"];
          label?: string;
          metric_key?: string;
          notes?: string | null;
          start_value?: number | null;
          target_date?: string | null;
          target_value?: number;
          unit?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      meal_plan_items: {
        Row: {
          created_at: string;
          food_id: string;
          grams: number;
          id: string;
          meal_id: string;
          notes: string | null;
          position: number;
          prep_notes: string | null;
          weekday: number | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          food_id: string;
          grams: number;
          id?: string;
          meal_id: string;
          notes?: string | null;
          position?: number;
          prep_notes?: string | null;
          weekday?: number | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          food_id?: string;
          grams?: number;
          id?: string;
          meal_id?: string;
          notes?: string | null;
          position?: number;
          prep_notes?: string | null;
          weekday?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meal_plan_items_food_id_fkey";
            columns: ["food_id"];
            isOneToOne: false;
            referencedRelation: "foods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meal_plan_items_meal_id_fkey";
            columns: ["meal_id"];
            isOneToOne: false;
            referencedRelation: "meal_plan_meals";
            referencedColumns: ["id"];
          },
        ];
      };
      meal_plan_meals: {
        Row: {
          carbs_g_target: number | null;
          created_at: string;
          fat_g_target: number | null;
          id: string;
          kcal_target: number | null;
          label: string | null;
          plan_id: string;
          position: number;
          protein_g_target: number | null;
          slot: Database["public"]["Enums"]["meal_slot_t"];
          target_time: string | null;
          updated_at: string;
        };
        Insert: {
          carbs_g_target?: number | null;
          created_at?: string;
          fat_g_target?: number | null;
          id?: string;
          kcal_target?: number | null;
          label?: string | null;
          plan_id: string;
          position?: number;
          protein_g_target?: number | null;
          slot: Database["public"]["Enums"]["meal_slot_t"];
          target_time?: string | null;
          updated_at?: string;
        };
        Update: {
          carbs_g_target?: number | null;
          created_at?: string;
          fat_g_target?: number | null;
          id?: string;
          kcal_target?: number | null;
          label?: string | null;
          plan_id?: string;
          position?: number;
          protein_g_target?: number | null;
          slot?: Database["public"]["Enums"]["meal_slot_t"];
          target_time?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meal_plan_meals_plan_id_fkey";
            columns: ["plan_id"];
            isOneToOne: false;
            referencedRelation: "meal_plans";
            referencedColumns: ["id"];
          },
        ];
      };
      meal_plans: {
        Row: {
          carbs_g_target: number;
          created_at: string;
          deleted_at: string | null;
          fat_g_target: number;
          fiber_g_target: number | null;
          id: string;
          is_active: boolean;
          kcal_target: number;
          name: string;
          notes: string | null;
          protein_g_target: number;
          source: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          carbs_g_target: number;
          created_at?: string;
          deleted_at?: string | null;
          fat_g_target: number;
          fiber_g_target?: number | null;
          id?: string;
          is_active?: boolean;
          kcal_target: number;
          name: string;
          notes?: string | null;
          protein_g_target: number;
          source?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          carbs_g_target?: number;
          created_at?: string;
          deleted_at?: string | null;
          fat_g_target?: number;
          fiber_g_target?: number | null;
          id?: string;
          is_active?: boolean;
          kcal_target?: number;
          name?: string;
          notes?: string | null;
          protein_g_target?: number;
          source?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      onboarding_answers: {
        Row: {
          completed_at: string | null;
          created_at: string;
          payload: Json;
          updated_at: string;
          user_id: string;
          version: number;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          payload: Json;
          updated_at?: string;
          user_id: string;
          version?: number;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          payload?: Json;
          updated_at?: string;
          user_id?: string;
          version?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          activity_level: Database["public"]["Enums"]["activity_level_t"] | null;
          allergies: string[] | null;
          avatar_url: string | null;
          birth_date: string | null;
          carbs_g_target: number | null;
          cooking_skill: string | null;
          created_at: string;
          daily_kcal_target: number | null;
          days_per_week: number | null;
          dietary_restrictions: string[] | null;
          disliked_foods: string[] | null;
          display_name: string | null;
          equipment_available: string[] | null;
          experience_level: string | null;
          fat_g_target: number | null;
          fiber_g_target: number | null;
          focus_area: string | null;
          goal: Database["public"]["Enums"]["goal_t"] | null;
          goal_weight_kg: number | null;
          health_conditions: string[] | null;
          height_cm: number | null;
          id: string;
          injuries: string[] | null;
          liked_foods: string[] | null;
          meals_per_day: number | null;
          onboarding_completed: boolean;
          protein_g_target: number | null;
          session_duration: string | null;
          sex: Database["public"]["Enums"]["sex_t"] | null;
          sleep_time: string | null;
          training_place: string | null;
          tutorial_completed_at: string | null;
          unit_system: Database["public"]["Enums"]["unit_system_t"];
          updated_at: string;
          wake_time: string | null;
          water_ml_target: number | null;
          workout_time: string | null;
        };
        Insert: {
          activity_level?: Database["public"]["Enums"]["activity_level_t"] | null;
          allergies?: string[] | null;
          avatar_url?: string | null;
          birth_date?: string | null;
          carbs_g_target?: number | null;
          cooking_skill?: string | null;
          created_at?: string;
          daily_kcal_target?: number | null;
          days_per_week?: number | null;
          dietary_restrictions?: string[] | null;
          disliked_foods?: string[] | null;
          display_name?: string | null;
          equipment_available?: string[] | null;
          experience_level?: string | null;
          fat_g_target?: number | null;
          fiber_g_target?: number | null;
          focus_area?: string | null;
          goal?: Database["public"]["Enums"]["goal_t"] | null;
          goal_weight_kg?: number | null;
          health_conditions?: string[] | null;
          height_cm?: number | null;
          id: string;
          injuries?: string[] | null;
          liked_foods?: string[] | null;
          meals_per_day?: number | null;
          onboarding_completed?: boolean;
          protein_g_target?: number | null;
          session_duration?: string | null;
          sex?: Database["public"]["Enums"]["sex_t"] | null;
          sleep_time?: string | null;
          training_place?: string | null;
          tutorial_completed_at?: string | null;
          unit_system?: Database["public"]["Enums"]["unit_system_t"];
          updated_at?: string;
          wake_time?: string | null;
          water_ml_target?: number | null;
          workout_time?: string | null;
        };
        Update: {
          activity_level?: Database["public"]["Enums"]["activity_level_t"] | null;
          allergies?: string[] | null;
          avatar_url?: string | null;
          birth_date?: string | null;
          carbs_g_target?: number | null;
          cooking_skill?: string | null;
          created_at?: string;
          daily_kcal_target?: number | null;
          days_per_week?: number | null;
          dietary_restrictions?: string[] | null;
          disliked_foods?: string[] | null;
          display_name?: string | null;
          equipment_available?: string[] | null;
          experience_level?: string | null;
          fat_g_target?: number | null;
          fiber_g_target?: number | null;
          focus_area?: string | null;
          goal?: Database["public"]["Enums"]["goal_t"] | null;
          goal_weight_kg?: number | null;
          health_conditions?: string[] | null;
          height_cm?: number | null;
          id?: string;
          injuries?: string[] | null;
          liked_foods?: string[] | null;
          meals_per_day?: number | null;
          onboarding_completed?: boolean;
          protein_g_target?: number | null;
          session_duration?: string | null;
          sex?: Database["public"]["Enums"]["sex_t"] | null;
          sleep_time?: string | null;
          training_place?: string | null;
          tutorial_completed_at?: string | null;
          unit_system?: Database["public"]["Enums"]["unit_system_t"];
          updated_at?: string;
          wake_time?: string | null;
          water_ml_target?: number | null;
          workout_time?: string | null;
        };
        Relationships: [];
      };
      progress_photos: {
        Row: {
          angle: string | null;
          created_at: string;
          id: string;
          log_date: string;
          notes: string | null;
          storage_path: string;
          user_id: string;
          weight_kg: number | null;
        };
        Insert: {
          angle?: string | null;
          created_at?: string;
          id?: string;
          log_date?: string;
          notes?: string | null;
          storage_path: string;
          user_id: string;
          weight_kg?: number | null;
        };
        Update: {
          angle?: string | null;
          created_at?: string;
          id?: string;
          log_date?: string;
          notes?: string | null;
          storage_path?: string;
          user_id?: string;
          weight_kg?: number | null;
        };
        Relationships: [];
      };
      recipe_items: {
        Row: {
          created_at: string;
          food_id: string;
          grams: number;
          id: string;
          recipe_id: string;
        };
        Insert: {
          created_at?: string;
          food_id: string;
          grams: number;
          id?: string;
          recipe_id: string;
        };
        Update: {
          created_at?: string;
          food_id?: string;
          grams?: number;
          id?: string;
          recipe_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recipe_items_food_id_fkey";
            columns: ["food_id"];
            isOneToOne: false;
            referencedRelation: "foods";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recipe_items_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          },
        ];
      };
      recipes: {
        Row: {
          category: string | null;
          created_at: string;
          deleted_at: string | null;
          id: string;
          image_url: string | null;
          instructions: string | null;
          name: string;
          notes: string | null;
          prep_minutes: number | null;
          servings: number;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          image_url?: string | null;
          instructions?: string | null;
          name: string;
          notes?: string | null;
          prep_minutes?: number | null;
          servings?: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          image_url?: string | null;
          instructions?: string | null;
          name?: string;
          notes?: string | null;
          prep_minutes?: number | null;
          servings?: number;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          created_at: string;
          current_period_end: string | null;
          last_event_at: string;
          product_id: string;
          status: string;
          store: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          current_period_end?: string | null;
          last_event_at: string;
          product_id: string;
          status: string;
          store: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          current_period_end?: string | null;
          last_event_at?: string;
          product_id?: string;
          status?: string;
          store?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_meal_slots: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          kcal_share: number | null;
          label: string | null;
          position: number;
          slot: Database["public"]["Enums"]["meal_slot_t"];
          target_time: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          kcal_share?: number | null;
          label?: string | null;
          position?: number;
          slot: Database["public"]["Enums"]["meal_slot_t"];
          target_time?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          kcal_share?: number | null;
          label?: string | null;
          position?: number;
          slot?: Database["public"]["Enums"]["meal_slot_t"];
          target_time?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      water_intake: {
        Row: {
          id: string;
          log_date: string;
          logged_at: string;
          ml: number;
          user_id: string;
        };
        Insert: {
          id?: string;
          log_date?: string;
          logged_at?: string;
          ml: number;
          user_id: string;
        };
        Update: {
          id?: string;
          log_date?: string;
          logged_at?: string;
          ml?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      workout_routines: {
        Row: {
          created_at: string;
          current_index: number;
          days_per_week: number;
          deleted_at: string | null;
          equipment: string;
          goal: string;
          id: string;
          is_active: boolean;
          level: string;
          name: string;
          schedule_mode: string;
          training_weekdays: number[];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          current_index?: number;
          days_per_week: number;
          deleted_at?: string | null;
          equipment: string;
          goal: string;
          id?: string;
          is_active?: boolean;
          level: string;
          name: string;
          schedule_mode?: string;
          training_weekdays?: number[];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          current_index?: number;
          days_per_week?: number;
          deleted_at?: string | null;
          equipment?: string;
          goal?: string;
          id?: string;
          is_active?: boolean;
          level?: string;
          name?: string;
          schedule_mode?: string;
          training_weekdays?: number[];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      workout_sessions: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          duration_seconds: number | null;
          ended_at: string | null;
          id: string;
          name: string;
          notes: string | null;
          started_at: string;
          template_id: string | null;
          total_volume_kg: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          duration_seconds?: number | null;
          ended_at?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          started_at?: string;
          template_id?: string | null;
          total_volume_kg?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          duration_seconds?: number | null;
          ended_at?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          started_at?: string;
          template_id?: string | null;
          total_volume_kg?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workout_sessions_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "workout_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_sets: {
        Row: {
          cadence: string | null;
          completed: boolean;
          completed_at: string | null;
          created_at: string;
          distance_m: number | null;
          duration_seconds: number | null;
          exercise_id: string;
          id: string;
          is_pr: boolean;
          notes: string | null;
          position: number;
          reps: number | null;
          rest_actual_seconds: number | null;
          rest_seconds: number | null;
          rpe: number | null;
          session_id: string;
          set_index: number;
          set_type: Database["public"]["Enums"]["set_type_t"];
          superset_group: number | null;
          weight_kg: number | null;
        };
        Insert: {
          cadence?: string | null;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          distance_m?: number | null;
          duration_seconds?: number | null;
          exercise_id: string;
          id?: string;
          is_pr?: boolean;
          notes?: string | null;
          position: number;
          reps?: number | null;
          rest_actual_seconds?: number | null;
          rest_seconds?: number | null;
          rpe?: number | null;
          session_id: string;
          set_index: number;
          set_type?: Database["public"]["Enums"]["set_type_t"];
          superset_group?: number | null;
          weight_kg?: number | null;
        };
        Update: {
          cadence?: string | null;
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          distance_m?: number | null;
          duration_seconds?: number | null;
          exercise_id?: string;
          id?: string;
          is_pr?: boolean;
          notes?: string | null;
          position?: number;
          reps?: number | null;
          rest_actual_seconds?: number | null;
          rest_seconds?: number | null;
          rpe?: number | null;
          session_id?: string;
          set_index?: number;
          set_type?: Database["public"]["Enums"]["set_type_t"];
          superset_group?: number | null;
          weight_kg?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "workout_sets_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_sets_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "workout_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_template_exercises: {
        Row: {
          cadence: string | null;
          created_at: string;
          exercise_id: string;
          id: string;
          notes: string | null;
          position: number;
          rest_seconds: number | null;
          superset_group: number | null;
          target_rep_max: number | null;
          target_rep_min: number | null;
          target_reps: number | null;
          target_rpe: number | null;
          target_sets: number | null;
          template_id: string;
        };
        Insert: {
          cadence?: string | null;
          created_at?: string;
          exercise_id: string;
          id?: string;
          notes?: string | null;
          position: number;
          rest_seconds?: number | null;
          superset_group?: number | null;
          target_rep_max?: number | null;
          target_rep_min?: number | null;
          target_reps?: number | null;
          target_rpe?: number | null;
          target_sets?: number | null;
          template_id: string;
        };
        Update: {
          cadence?: string | null;
          created_at?: string;
          exercise_id?: string;
          id?: string;
          notes?: string | null;
          position?: number;
          rest_seconds?: number | null;
          superset_group?: number | null;
          target_rep_max?: number | null;
          target_rep_min?: number | null;
          target_reps?: number | null;
          target_rpe?: number | null;
          target_sets?: number | null;
          template_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workout_template_exercises_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_template_exercises_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "workout_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_templates: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          icon: string | null;
          id: string;
          name: string;
          notes: string | null;
          routine_id: string | null;
          routine_letter: string | null;
          routine_order: number | null;
          updated_at: string;
          user_id: string;
          weekdays: number[];
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          icon?: string | null;
          id?: string;
          name: string;
          notes?: string | null;
          routine_id?: string | null;
          routine_letter?: string | null;
          routine_order?: number | null;
          updated_at?: string;
          user_id: string;
          weekdays?: number[];
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          icon?: string | null;
          id?: string;
          name?: string;
          notes?: string | null;
          routine_id?: string | null;
          routine_letter?: string | null;
          routine_order?: number | null;
          updated_at?: string;
          user_id?: string;
          weekdays?: number[];
        };
        Relationships: [
          {
            foreignKeyName: "workout_templates_routine_id_fkey";
            columns: ["routine_id"];
            isOneToOne: false;
            referencedRelation: "workout_routines";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      all_http_urls: { Args: { urls: string[] }; Returns: boolean };
      apply_subscription_event: {
        Args: {
          _current_period_end: string;
          _event_at: string;
          _product_id: string;
          _status: string;
          _store: string;
          _user_id: string;
        };
        Returns: undefined;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_premium: { Args: never; Returns: boolean };
      show_limit: { Args: never; Returns: number };
      show_trgm: { Args: { "": string }; Returns: string[] };
    };
    Enums: {
      activity_level_t: "sedentary" | "light" | "moderate" | "active" | "very_active";
      ai_recommendation_kind_t:
        | "load_increase"
        | "load_decrease"
        | "deload"
        | "volume_increase"
        | "volume_decrease"
        | "exercise_swap"
        | "diet_adjust"
        | "hydration"
        | "consistency"
        | "check_in";
      app_role: "admin" | "user";
      equipment_t:
        | "barbell"
        | "dumbbell"
        | "machine"
        | "cable"
        | "bodyweight"
        | "kettlebell"
        | "band"
        | "other"
        | "cardio";
      exercise_category_t: "strength" | "cardio" | "stretching" | "plyometrics" | "olympic";
      exercise_level_t: "beginner" | "intermediate" | "advanced";
      food_category_t:
        | "protein_meat"
        | "protein_egg"
        | "dairy"
        | "legume"
        | "grain"
        | "tuber"
        | "vegetable"
        | "fruit"
        | "fat"
        | "beverage"
        | "supplement"
        | "sweet"
        | "condiment"
        | "prepared"
        | "other";
      force_type_t: "push" | "pull" | "static";
      goal_kind_t: "weight" | "body_fat" | "measurement" | "strength" | "habit" | "nutrition";
      goal_t: "lose" | "maintain" | "gain";
      meal_slot_t:
        | "breakfast"
        | "morning_snack"
        | "lunch"
        | "afternoon_snack"
        | "pre_workout"
        | "post_workout"
        | "dinner"
        | "supper";
      mechanic_t: "compound" | "isolation";
      movement_pattern_t:
        | "horizontal_push"
        | "vertical_push"
        | "horizontal_pull"
        | "vertical_pull"
        | "squat"
        | "hinge"
        | "lunge"
        | "isolation"
        | "core"
        | "carry"
        | "cardio"
        | "mobility";
      muscle_t:
        | "chest"
        | "back"
        | "lats"
        | "traps"
        | "shoulders"
        | "front_delts"
        | "side_delts"
        | "rear_delts"
        | "biceps"
        | "triceps"
        | "forearms"
        | "core"
        | "abs"
        | "obliques"
        | "quads"
        | "hamstrings"
        | "glutes"
        | "calves"
        | "adductors"
        | "abductors"
        | "cardio"
        | "full_body"
        | "lower_back"
        | "neck";
      set_type_t: "warmup" | "working" | "drop" | "failure";
      sex_t: "male" | "female" | "other";
      unit_system_t: "metric" | "imperial";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      activity_level_t: ["sedentary", "light", "moderate", "active", "very_active"],
      ai_recommendation_kind_t: [
        "load_increase",
        "load_decrease",
        "deload",
        "volume_increase",
        "volume_decrease",
        "exercise_swap",
        "diet_adjust",
        "hydration",
        "consistency",
        "check_in",
      ],
      app_role: ["admin", "user"],
      equipment_t: [
        "barbell",
        "dumbbell",
        "machine",
        "cable",
        "bodyweight",
        "kettlebell",
        "band",
        "other",
        "cardio",
      ],
      exercise_category_t: ["strength", "cardio", "stretching", "plyometrics", "olympic"],
      exercise_level_t: ["beginner", "intermediate", "advanced"],
      food_category_t: [
        "protein_meat",
        "protein_egg",
        "dairy",
        "legume",
        "grain",
        "tuber",
        "vegetable",
        "fruit",
        "fat",
        "beverage",
        "supplement",
        "sweet",
        "condiment",
        "prepared",
        "other",
      ],
      force_type_t: ["push", "pull", "static"],
      goal_kind_t: ["weight", "body_fat", "measurement", "strength", "habit", "nutrition"],
      goal_t: ["lose", "maintain", "gain"],
      meal_slot_t: [
        "breakfast",
        "morning_snack",
        "lunch",
        "afternoon_snack",
        "pre_workout",
        "post_workout",
        "dinner",
        "supper",
      ],
      mechanic_t: ["compound", "isolation"],
      movement_pattern_t: [
        "horizontal_push",
        "vertical_push",
        "horizontal_pull",
        "vertical_pull",
        "squat",
        "hinge",
        "lunge",
        "isolation",
        "core",
        "carry",
        "cardio",
        "mobility",
      ],
      muscle_t: [
        "chest",
        "back",
        "lats",
        "traps",
        "shoulders",
        "front_delts",
        "side_delts",
        "rear_delts",
        "biceps",
        "triceps",
        "forearms",
        "core",
        "abs",
        "obliques",
        "quads",
        "hamstrings",
        "glutes",
        "calves",
        "adductors",
        "abductors",
        "cardio",
        "full_body",
        "lower_back",
        "neck",
      ],
      set_type_t: ["warmup", "working", "drop", "failure"],
      sex_t: ["male", "female", "other"],
      unit_system_t: ["metric", "imperial"],
    },
  },
} as const;
