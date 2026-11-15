import { requestJson } from "../../api/request.js";

export function fetchRestaurants(query, signal) {
  const params = new URLSearchParams({
    name: query.name,
    neighborhood: query.neighborhood,
    result: query.result,
    page: String(query.page),
    pageSize: "10",
  });

  if (query.sort?.length) {
    params.set(
      "sort",
      query.sort
        .map(({ field, direction }) => `${field}:${direction}`)
        .join(","),
    );
  }

  return requestJson(`/api/restaurants?${params}`, { signal });
}

export function fetchRestaurantDetails(restaurantId, signal) {
  return requestJson(`/api/restaurants/${encodeURIComponent(restaurantId)}`, {
    signal,
  });
}

export function fetchReports(restaurantId, signal) {
  return requestJson(
    `/api/restaurants/${encodeURIComponent(restaurantId)}/reports`,
    { signal, cache: "no-store" },
  );
}

export function createReport(restaurantId, { visitDate, description }, signal) {
  return requestJson(
    `/api/restaurants/${encodeURIComponent(restaurantId)}/reports`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitDate, description }),
      signal,
    },
  );
}

export function updateReport(reportId, { visitDate, description }, signal) {
  return requestJson(`/api/reports/${encodeURIComponent(reportId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ visitDate, description }),
    signal,
  });
}

export function deleteReport(reportId, signal) {
  return requestJson(`/api/reports/${encodeURIComponent(reportId)}`, {
    method: "DELETE",
    signal,
  });
}
