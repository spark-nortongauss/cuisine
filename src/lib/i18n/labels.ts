type Translator = (key: string, fallback?: string) => string;

export function localizeMealType(value: string | null | undefined, t: Translator) {
  if (!value) return t("common.mealFallback", "Service");

  switch (value) {
    case "breakfast":
      return t("common.mealTypes.breakfast", "Breakfast");
    case "brunch":
      return t("common.mealTypes.brunch", "Brunch");
    case "lunch":
      return t("common.mealTypes.lunch", "Lunch");
    case "mid-afternoon":
      return t("common.mealTypes.midAfternoon", "Mid-afternoon");
    case "dinner":
      return t("common.mealTypes.dinner", "Dinner");
    default:
      return value;
  }
}

export function localizeMenuStatus(value: string | null | undefined, t: Translator) {
  if (!value) return t("common.status.unknown", "Unknown");

  switch (value) {
    case "generated":
      return t("common.status.generated", "Generated");
    case "approved":
      return t("common.status.approved", "Approved");
    case "validated":
      return t("common.status.validated", "Validated");
    case "selected":
      return t("common.status.selected", "Selected");
    case "draft":
      return t("common.status.draft", "Draft");
    case "pending":
      return t("common.status.pending", "Pending");
    default:
      return value;
  }
}

export function localizeShoppingStatus(value: string | null | undefined, t: Translator) {
  switch (value) {
    case "purchased":
      return t("shopping.status.purchased", "Purchased");
    case "already_have":
      return t("shopping.status.alreadyHave", "Already Have");
    case "not_purchased":
      return t("shopping.status.notPurchased", "Not Purchased");
    default:
      return t("shopping.status.notPurchased", "Not Purchased");
  }
}
