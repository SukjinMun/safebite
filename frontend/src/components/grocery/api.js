import { requestJson } from "../../api/request.js";

const BASE_URL = "/api/grocery-items";

export function fetchGroceryItems(signal) {
  return requestJson(BASE_URL, { signal, cache: "no-store" });
}

export function addGroceryItem(name) {
  return requestJson(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export function updateGroceryItem(itemId, name) {
  return requestJson(`${BASE_URL}/${itemId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export function deleteGroceryItem(itemId) {
  return requestJson(`${BASE_URL}/${itemId}`, { method: "DELETE" });
}