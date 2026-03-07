export type MealType = "breakfast" | "brunch" | "lunch" | "mid-afternoon" | "dinner";

export interface InviteePreference {
  label: string;
  name?: string | null;
  restrictions: string[];
}

export interface GenerateMenuInput {
  courseCount: 3 | 4 | 5 | 6;
  mealType: MealType;
  restrictions: string[];
  notes?: string;
  serveAt: string;
  inviteeCount: number;
  inviteePreferences?: InviteePreference[];
}

export interface Dish {
  course: string;
  name: string;
  description: string;
  platingNotes: string;
  decorationNotes?: string;
  beverageSuggestion?: string;
  imagePrompt: string;
  imagePath?: string | null;
}

export interface MenuOption {
  id: string;
  title: string;
  concept: string;
  heroImagePath?: string | null;
  heroImagePrompt?: string | null;
  dishes: Dish[];
}

export interface ApprovalVoteInput {
  optionId: string;
  note?: string;
}
