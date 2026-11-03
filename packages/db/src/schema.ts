// GERADO por scripts/build-powersync-schema.mjs a partir de src/types.ts — não editar à mão.
import { column, Schema, Table } from "@powersync/common";

const profiles = new Table(
  {
    activity_level: column.text,
    allergies: column.text,
    avatar_url: column.text,
    birth_date: column.text,
    carbs_g_target: column.real,
    cooking_skill: column.text,
    created_at: column.text,
    daily_kcal_target: column.real,
    days_per_week: column.real,
    dietary_restrictions: column.text,
    disliked_foods: column.text,
    display_name: column.text,
    equipment_available: column.text,
    experience_level: column.text,
    fat_g_target: column.real,
    fiber_g_target: column.real,
    focus_area: column.text,
    goal: column.text,
    goal_weight_kg: column.real,
    health_conditions: column.text,
    height_cm: column.real,
    injuries: column.text,
    liked_foods: column.text,
    meals_per_day: column.real,
    onboarding_completed: column.integer,
    protein_g_target: column.real,
    session_duration: column.text,
    sex: column.text,
    sleep_time: column.text,
    training_place: column.text,
    tutorial_completed_at: column.text,
    unit_system: column.text,
    updated_at: column.text,
    wake_time: column.text,
    water_ml_target: column.real,
    workout_time: column.text,
  },
);

const user_roles = new Table(
  {
    created_at: column.text,
    role: column.text,
    user_id: column.text,
  },
);

const onboarding_answers = new Table(
  {
    completed_at: column.text,
    created_at: column.text,
    payload: column.text,
    updated_at: column.text,
    user_id: column.text,
    version: column.real,
  },
);

const goals = new Table(
  {
    achieved_at: column.text,
    created_at: column.text,
    is_active: column.integer,
    kind: column.text,
    label: column.text,
    metric_key: column.text,
    notes: column.text,
    start_value: column.real,
    target_date: column.text,
    target_value: column.real,
    unit: column.text,
    updated_at: column.text,
    user_id: column.text,
  },
  { indexes: { user: ["user_id"] } },
);

const exercises = new Table(
  {
    category: column.text,
    common_mistakes: column.text,
    contraindications: column.text,
    created_at: column.text,
    cues: column.text,
    default_cadence: column.text,
    deleted_at: column.text,
    equipment: column.text,
    execution: column.text,
    execution_en: column.text,
    external_id: column.text,
    force_type: column.text,
    image_url: column.text,
    image_urls: column.text,
    instructions: column.text,
    is_public: column.integer,
    level: column.text,
    mechanic: column.text,
    media_id: column.text,
    media_ref: column.text,
    media_source: column.text,
    movement_pattern: column.text,
    name: column.text,
    name_en: column.text,
    owner_id: column.text,
    popularity: column.real,
    primary_muscle: column.text,
    secondary_muscles: column.text,
    updated_at: column.text,
    video_url: column.text,
  },
  { indexes: { owner: ["owner_id"], primary: ["primary_muscle"], equipment: ["equipment"] } },
);

const exercise_muscles = new Table(
  {
    contribution: column.real,
    exercise_id: column.text,
    muscle: column.text,
  },
  { indexes: { exercise: ["exercise_id"] } },
);

const exercise_favorites = new Table(
  {
    created_at: column.text,
    exercise_id: column.text,
    user_id: column.text,
  },
  { indexes: { user: ["user_id"] } },
);

const workout_routines = new Table(
  {
    created_at: column.text,
    current_index: column.real,
    days_per_week: column.real,
    deleted_at: column.text,
    equipment: column.text,
    goal: column.text,
    is_active: column.integer,
    level: column.text,
    name: column.text,
    schedule_mode: column.text,
    training_weekdays: column.text,
    updated_at: column.text,
    user_id: column.text,
  },
  { indexes: { user: ["user_id"] } },
);

const workout_templates = new Table(
  {
    created_at: column.text,
    deleted_at: column.text,
    icon: column.text,
    name: column.text,
    notes: column.text,
    routine_id: column.text,
    routine_letter: column.text,
    routine_order: column.real,
    updated_at: column.text,
    user_id: column.text,
    weekdays: column.text,
  },
  { indexes: { user: ["user_id"], routine: ["routine_id"] } },
);

const workout_template_exercises = new Table(
  {
    cadence: column.text,
    created_at: column.text,
    exercise_id: column.text,
    notes: column.text,
    position: column.real,
    rest_seconds: column.real,
    superset_group: column.real,
    target_rep_max: column.real,
    target_rep_min: column.real,
    target_reps: column.real,
    target_rpe: column.real,
    target_sets: column.real,
    template_id: column.text,
  },
  { indexes: { template: ["template_id"] } },
);

const workout_sessions = new Table(
  {
    created_at: column.text,
    deleted_at: column.text,
    duration_seconds: column.real,
    ended_at: column.text,
    name: column.text,
    notes: column.text,
    started_at: column.text,
    template_id: column.text,
    total_volume_kg: column.real,
    updated_at: column.text,
    user_id: column.text,
  },
  { indexes: { user_started: ["user_id", "started_at"] } },
);

const workout_sets = new Table(
  {
    cadence: column.text,
    completed: column.integer,
    completed_at: column.text,
    created_at: column.text,
    distance_m: column.real,
    duration_seconds: column.real,
    exercise_id: column.text,
    is_pr: column.integer,
    notes: column.text,
    position: column.real,
    reps: column.real,
    rest_actual_seconds: column.real,
    rest_seconds: column.real,
    rpe: column.real,
    session_id: column.text,
    set_index: column.real,
    set_type: column.text,
    superset_group: column.real,
    weight_kg: column.real,
  },
  { indexes: { session: ["session_id"], exercise: ["exercise_id"] } },
);

const foods = new Table(
  {
    barcode: column.text,
    brand: column.text,
    calcium_mg: column.real,
    carbs_g: column.real,
    category: column.text,
    cholesterol_mg: column.real,
    created_at: column.text,
    deleted_at: column.text,
    external_id: column.text,
    fat_g: column.real,
    fiber_g: column.real,
    household_grams: column.real,
    household_measure: column.text,
    image_url: column.text,
    iron_mg: column.real,
    is_public: column.integer,
    is_staple: column.integer,
    kcal: column.real,
    magnesium_mg: column.real,
    name: column.text,
    owner_id: column.text,
    phosphorus_mg: column.real,
    popularity: column.real,
    potassium_mg: column.real,
    protein_g: column.real,
    saturated_fat_g: column.real,
    serving_size_g: column.real,
    serving_unit: column.text,
    sodium_mg: column.real,
    source: column.text,
    sugar_g: column.real,
    updated_at: column.text,
    vitamin_a_mcg: column.real,
    vitamin_b12_mcg: column.real,
    vitamin_c_mg: column.real,
    vitamin_d_mcg: column.real,
    vitamin_e_mg: column.real,
    zinc_mg: column.real,
  },
  { indexes: { name: ["name"], category: ["category"] } },
);

const food_log_entries = new Table(
  {
    consumed: column.integer,
    consumed_at: column.text,
    created_at: column.text,
    food_id: column.text,
    grams: column.real,
    log_date: column.text,
    meal_slot: column.text,
    notes: column.text,
    plan_item_id: column.text,
    servings: column.real,
    source: column.text,
    updated_at: column.text,
    user_id: column.text,
  },
  { indexes: { user_date: ["user_id", "log_date"] } },
);

const food_substitution_prefs = new Table(
  {
    created_at: column.text,
    food_id: column.text,
    substitute_id: column.text,
    times_used: column.real,
    user_id: column.text,
  },
  { indexes: { user_food: ["user_id", "food_id"] } },
);

const water_intake = new Table(
  {
    log_date: column.text,
    logged_at: column.text,
    ml: column.real,
    user_id: column.text,
  },
  { indexes: { user_date: ["user_id", "log_date"] } },
);

const diet_days = new Table(
  {
    log_date: column.text,
    materialized_at: column.text,
    meal_labels: column.text,
    notes: column.text,
    plan_id: column.text,
    user_id: column.text,
  },
  { indexes: { user_date: ["user_id", "log_date"] } },
);

const meal_plans = new Table(
  {
    carbs_g_target: column.real,
    created_at: column.text,
    deleted_at: column.text,
    fat_g_target: column.real,
    fiber_g_target: column.real,
    is_active: column.integer,
    kcal_target: column.real,
    name: column.text,
    notes: column.text,
    protein_g_target: column.real,
    source: column.text,
    updated_at: column.text,
    user_id: column.text,
  },
  { indexes: { user: ["user_id"] } },
);

const meal_plan_meals = new Table(
  {
    carbs_g_target: column.real,
    created_at: column.text,
    fat_g_target: column.real,
    kcal_target: column.real,
    label: column.text,
    plan_id: column.text,
    position: column.real,
    protein_g_target: column.real,
    slot: column.text,
    target_time: column.text,
    updated_at: column.text,
  },
  { indexes: { plan: ["plan_id"] } },
);

const meal_plan_items = new Table(
  {
    created_at: column.text,
    food_id: column.text,
    grams: column.real,
    meal_id: column.text,
    notes: column.text,
    position: column.real,
    prep_notes: column.text,
    weekday: column.real,
    updated_at: column.text,
  },
  { indexes: { meal: ["meal_id"] } },
);

const recipes = new Table(
  {
    category: column.text,
    created_at: column.text,
    deleted_at: column.text,
    image_url: column.text,
    instructions: column.text,
    name: column.text,
    notes: column.text,
    prep_minutes: column.real,
    servings: column.real,
    updated_at: column.text,
    user_id: column.text,
  },
  { indexes: { user: ["user_id"] } },
);

const recipe_items = new Table(
  {
    created_at: column.text,
    food_id: column.text,
    grams: column.real,
    recipe_id: column.text,
  },
  { indexes: { recipe: ["recipe_id"] } },
);

const body_weights = new Table(
  {
    created_at: column.text,
    log_date: column.text,
    notes: column.text,
    user_id: column.text,
    weight_kg: column.real,
  },
  { indexes: { user_date: ["user_id", "log_date"] } },
);

const body_measurements = new Table(
  {
    abdomen_cm: column.real,
    arm_cm: column.real,
    body_fat_pct: column.real,
    calf_cm: column.real,
    chest_cm: column.real,
    created_at: column.text,
    forearm_cm: column.real,
    hip_cm: column.real,
    log_date: column.text,
    neck_cm: column.real,
    notes: column.text,
    shoulder_cm: column.real,
    thigh_cm: column.real,
    user_id: column.text,
    waist_cm: column.real,
  },
  { indexes: { user_date: ["user_id", "log_date"] } },
);

const progress_photos = new Table(
  {
    angle: column.text,
    created_at: column.text,
    log_date: column.text,
    notes: column.text,
    storage_path: column.text,
    user_id: column.text,
    weight_kg: column.real,
  },
  { indexes: { user_date: ["user_id", "log_date"] } },
);

export const AppSchema = new Schema({
  profiles,
  user_roles,
  onboarding_answers,
  goals,
  exercises,
  exercise_muscles,
  exercise_favorites,
  workout_routines,
  workout_templates,
  workout_template_exercises,
  workout_sessions,
  workout_sets,
  foods,
  food_log_entries,
  food_substitution_prefs,
  water_intake,
  diet_days,
  meal_plans,
  meal_plan_meals,
  meal_plan_items,
  recipes,
  recipe_items,
  body_weights,
  body_measurements,
  progress_photos,
});

export type Database = (typeof AppSchema)["types"];

/** Colunas array/JSON no Postgres (texto JSON no SQLite), por tabela. */
export const JSON_COLUMNS: Record<string, readonly string[]> = {
  "profiles": [
    "allergies",
    "dietary_restrictions",
    "disliked_foods",
    "equipment_available",
    "health_conditions",
    "injuries",
    "liked_foods"
  ],
  "onboarding_answers": [
    "payload"
  ],
  "exercises": [
    "common_mistakes",
    "contraindications",
    "cues",
    "execution",
    "execution_en",
    "image_urls",
    "secondary_muscles"
  ],
  "workout_routines": [
    "training_weekdays"
  ],
  "workout_templates": [
    "weekdays"
  ],
  "diet_days": [
    "meal_labels"
  ]
};
