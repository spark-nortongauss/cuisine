export type MealType = "breakfast" | "brunch" | "lunch" | "mid-afternoon" | "dinner";

export interface GenerateMenuInput {
  courseCount: 3 | 4 | 5 | 6;
  mealType: MealType;
  restrictions: string[];
  notes?: string;
  serveAt: string;
  inviteeCount: number;
}

export interface Dish {
  course: string;
  name: string;
  description: string;
  platingNotes: string;
  decorationNotes?: string;
  beverageSuggestion?: string;
  imagePrompt: string;
}

export interface MenuOption {
  id: string;
  title: string;
  concept: string;
  dishes: Dish[];
}

export interface ApprovalVoteInput {
  optionId: string;
  note?: string;
}
