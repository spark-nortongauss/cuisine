export type MenuTitleSource = {
  title?: string | null;
};

export type MenuOptionTitleSource = {
  title?: string | null;
  michelin_name?: string | null;
};

function normalizeMeaningful(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase() === "untitled menu") return null;
  return trimmed;
}

export function resolveOptionDisplayTitle(option?: MenuOptionTitleSource | null) {
  return normalizeMeaningful(option?.title) ?? normalizeMeaningful(option?.michelin_name) ?? null;
}

export function resolveMenuDisplayTitle(
  menu?: MenuTitleSource | null,
  approvedOption?: MenuOptionTitleSource | null,
  untitledFallback = "Untitled menu",
) {
  return normalizeMeaningful(menu?.title) ?? resolveOptionDisplayTitle(approvedOption) ?? untitledFallback;
}

export function resolveCanonicalMenuTitleFromOption(option?: MenuOptionTitleSource | null) {
  return resolveOptionDisplayTitle(option);
}
