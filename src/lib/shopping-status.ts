export const shoppingItemStatuses = ["purchased", "already_have", "not_purchased"] as const;

export type ShoppingItemStatus = (typeof shoppingItemStatuses)[number];

export function isShoppingItemStatus(value: string | null | undefined): value is ShoppingItemStatus {
  if (!value) return false;
  return shoppingItemStatuses.includes(value as ShoppingItemStatus);
}

export function normalizeShoppingItemStatus(
  status: string | null | undefined,
  purchased: boolean | null | undefined,
): ShoppingItemStatus {
  if (isShoppingItemStatus(status)) return status;
  return purchased ? "purchased" : "not_purchased";
}

export function isShoppingItemComplete(status: string | null | undefined, purchased: boolean | null | undefined) {
  const resolved = normalizeShoppingItemStatus(status, purchased);
  return resolved === "purchased" || resolved === "already_have";
}

export function mapShoppingStatusToPurchased(status: ShoppingItemStatus) {
  return status === "purchased" || status === "already_have";
}
