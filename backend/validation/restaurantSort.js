const sortableFields = new Set([
  "restaurantName",
  "neighborhood",
  "latestInspectionDate",
  "latestResult",
]);

export const DEFAULT_RESTAURANT_SORT = Object.freeze({
  restaurantName: 1,
  restaurantId: 1,
});

export function parseRestaurantSort(rawSort = "") {
  if (typeof rawSort !== "string") {
    return { value: null, error: "sort must be one text value." };
  }

  const text = rawSort.trim();

  if (!text) {
    return { value: { ...DEFAULT_RESTAURANT_SORT }, error: null };
  }

  const entries = text.split(",");

  if (text.length > 200 || entries.length > sortableFields.size) {
    return { value: null, error: "Use up to four sort columns." };
  }

  const sort = {};

  for (const entry of entries) {
    const parts = entry.split(":");

    if (parts.length !== 2) {
      return {
        value: null,
        error: "Use sort entries such as restaurantName:asc.",
      };
    }

    const field = parts[0].trim();
    const direction = parts[1].trim().toLowerCase();

    if (!sortableFields.has(field) || !["asc", "desc"].includes(direction)) {
      return {
        value: null,
        error:
          "Sort by restaurantName, neighborhood, latestInspectionDate, or latestResult using asc or desc.",
      };
    }

    if (Object.hasOwn(sort, field)) {
      return { value: null, error: "Each sort column may appear only once." };
    }

    sort[field] = direction === "asc" ? 1 : -1;
  }

  // Keep tied rows in a consistent order when moving between pages.
  sort.restaurantId = 1;

  return { value: sort, error: null };
}
