import OpenAI from "openai";
import { GenerateMenuInput, MenuOption } from "@/types/domain";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateMichelinMenus(input: GenerateMenuInput): Promise<MenuOption[]> {
  const prompt = `Create exactly 3 premium menu options for a ${input.mealType} with ${input.courseCount} courses. Restrictions: ${input.restrictions.join(", ") || "none"}. Return valid JSON array of 3 options with title, concept, dishes (course,name,description,platingNotes,beverageSuggestion,imagePrompt).`;

  const completion = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
  });

  const text = completion.output_text;
  return JSON.parse(text) as MenuOption[];
}
