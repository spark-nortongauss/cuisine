export type CookStepLike = {
  step_no: number;
  phase: string;
  title: string;
  details: string;
  technique: string;
  knife_cut?: string | null;
  utensils: string[];
  dish_name?: string | null;
  relative_minutes?: number | null;
};

type ParsedCookDetail = {
  key: string;
  label: string;
  value: string;
};

const detailLabelMap: Record<string, { key: string; label: string }> = {
  action: { key: "action", label: "Action" },
  objective: { key: "objective", label: "Objective" },
  "ingredients & amounts": { key: "ingredients", label: "Ingredients & amounts" },
  ingredients: { key: "ingredients", label: "Ingredients & amounts" },
  duration: { key: "duration", label: "Duration" },
  heat: { key: "heat", label: "Heat" },
  temperature: { key: "heat", label: "Heat" },
  tools: { key: "tools", label: "Tools" },
  cookware: { key: "tools", label: "Tools" },
  technique: { key: "technique", label: "Technique" },
  "knife cut": { key: "knifeCut", label: "Knife cut" },
  prep: { key: "prep", label: "Prep" },
  "visual cue": { key: "visualCue", label: "Visual cue" },
  cue: { key: "visualCue", label: "Visual cue" },
  doneness: { key: "visualCue", label: "Visual cue" },
  avoid: { key: "avoid", label: "Avoid" },
  warning: { key: "avoid", label: "Avoid" },
  "common mistake": { key: "avoid", label: "Avoid" },
  "chef tip": { key: "chefTip", label: "Chef tip" },
  "pro tip": { key: "chefTip", label: "Chef tip" },
  tip: { key: "chefTip", label: "Chef tip" },
  "hold/storage": { key: "holdStorage", label: "Hold/storage" },
  hold: { key: "holdStorage", label: "Hold/storage" },
  storage: { key: "holdStorage", label: "Hold/storage" },
  "make-ahead": { key: "holdStorage", label: "Hold/storage" },
};

function cleanLine(line: string) {
  return line.replace(/^\s*[-•]\s*/, "").trim();
}

function normalizeDetailLabel(rawLabel: string) {
  return rawLabel.toLowerCase().replace(/\s+/g, " ").trim();
}

export function splitCookDetailLines(details: string) {
  return details
    .split(/\n+/)
    .map(cleanLine)
    .filter(Boolean);
}

export function parseCookStepDetails(details: string): ParsedCookDetail[] {
  return splitCookDetailLines(details).map((line) => {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      return { key: "note", label: "Note", value: line };
    }

    const rawLabel = line.slice(0, separatorIndex);
    const value = line.slice(separatorIndex + 1).trim();
    const normalized = detailLabelMap[normalizeDetailLabel(rawLabel)];

    if (!normalized || !value) {
      return { key: "note", label: rawLabel.trim() || "Note", value: value || line };
    }

    return { key: normalized.key, label: normalized.label, value };
  });
}

function hasDetailKey(details: string, key: string) {
  return parseCookStepDetails(details).some((item) => item.key === key && item.value.trim().length > 0);
}

function dedupeLines(lines: string[]) {
  const seen = new Set<string>();
  return lines.filter((line) => {
    const normalized = line.toLowerCase();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

export function normalizeCookStep(step: CookStepLike, index: number): CookStepLike {
  const cleanedLines = dedupeLines(splitCookDetailLines(step.details));
  const joinedDetails = cleanedLines.join("\n");

  if (!hasDetailKey(joinedDetails, "action")) {
    cleanedLines.unshift(`Action: ${step.title.trim() || `Complete step ${index + 1}`}.`);
  }
  if (!hasDetailKey(cleanedLines.join("\n"), "technique") && step.technique?.trim()) {
    cleanedLines.push(`Technique: ${step.technique.trim()}.`);
  }
  if (!hasDetailKey(cleanedLines.join("\n"), "tools")) {
    const tools = step.utensils.map((tool) => tool.trim()).filter(Boolean);
    if (tools.length) {
      cleanedLines.push(`Tools: ${tools.join(", ")}.`);
    }
  }
  if (!hasDetailKey(cleanedLines.join("\n"), "knifeCut") && step.knife_cut?.trim()) {
    cleanedLines.push(`Knife cut: ${step.knife_cut.trim()}.`);
  }

  return {
    step_no: Number.isInteger(step.step_no) && step.step_no > 0 ? step.step_no : index + 1,
    phase: step.phase.trim() || "cooking phase",
    title: step.title.trim() || `Step ${index + 1}`,
    details: cleanedLines.join("\n"),
    technique: step.technique.trim() || "Chef technique",
    knife_cut: step.knife_cut?.trim() || null,
    utensils: (() => {
      const cleaned = step.utensils.map((utensil) => utensil.trim()).filter(Boolean);
      return cleaned.length ? cleaned : ["Chef knife"];
    })(),
    dish_name: step.dish_name?.trim() || null,
    relative_minutes: Number.isInteger(step.relative_minutes ?? null) ? step.relative_minutes ?? null : null,
  };
}

export function normalizeCookPlanPayload<T extends {
  overview: string;
  mise_en_place: string;
  plating_overview: string;
  service_notes: string;
  steps: CookStepLike[];
}>(payload: T): T {
  return {
    ...payload,
    overview: payload.overview.trim(),
    mise_en_place: payload.mise_en_place.trim(),
    plating_overview: payload.plating_overview.trim(),
    service_notes: payload.service_notes.trim(),
    steps: payload.steps.map((step, index) => normalizeCookStep(step, index)),
  };
}

export function getCookStepRichnessIssues(step: Pick<CookStepLike, "details">) {
  const details = parseCookStepDetails(step.details);
  const keys = new Set(details.map((item) => item.key));
  const issues: string[] = [];

  if (!keys.has("action")) issues.push("Missing Action line.");
  if (!keys.has("ingredients")) issues.push("Missing Ingredients & amounts line.");
  if (!keys.has("duration")) issues.push("Missing Duration line.");
  if (!keys.has("heat")) issues.push("Missing Heat line.");
  if (!keys.has("visualCue")) issues.push("Missing Visual cue line.");
  if (!keys.has("avoid")) issues.push("Missing Avoid line.");
  if (!keys.has("chefTip")) issues.push("Missing Chef tip line.");

  return issues;
}
