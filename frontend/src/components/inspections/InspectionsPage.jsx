import { useEffect, useRef, useState } from "react";
import PageBanner from "../PageBanner.jsx";
import RestaurantSearch from "./RestaurantSearch";
import RestaurantResults from "./RestaurantResults";
import RestaurantDetails from "./RestaurantDetails";
import InspectionsSnapshot from "./InspectionsSnapshot";
import { fetchRestaurants } from "./api";
import "./InspectionsPage.css";
import RestaurantFooter from "./RestaurantFooter.jsx";

const NEIGHBORHOODS = [
  "Back Bay",
  "Beacon Hill",
  "Dorchester",
  "East Boston",
  "Jamaica Plain",
];

function InspectionsPage() {
  const [query, setQuery] = useState({
    name: "",
    neighborhood: "",
    result: "",
    page: 1,
    sort: [],
  });

  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);
  const openerRef = useRef(null);

  const [response, setResponse] = useState({
    query: null,
    data: null,
    error: false,
  });

  const loading = response.query !== query;
  const failed = !loading && response.error;
  const data = !loading && !failed ? response.data : null;
  const lastData = response.data;

  // Reuse snapshot totals while paging or sorting within the same filters.
  const snapshotMatchesQuery =
    response.query?.name === query.name &&
    response.query?.neighborhood === query.neighborhood &&
    response.query?.result === query.result;

  const snapshotData = snapshotMatchesQuery && !failed ? lastData : null;

  useEffect(() => {
    const controller = new AbortController();

    async function loadRestaurants() {
      try {
        const data = await fetchRestaurants(query, controller.signal);

        if (!controller.signal.aborted) {
          setResponse({ query, data, error: false });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Restaurant lookup failed:", error);
          setResponse({ query, data: null, error: true });
        }
      }
    }

    loadRestaurants();

    return () => controller.abort();
  }, [query]);

  useEffect(() => {
    if (selectedRestaurantId === null) {
      openerRef.current?.focus();
    }
  }, [selectedRestaurantId]);

  function handleSearch(filters) {
    setQuery((current) => ({
      ...current,
      ...filters,
      page: 1,
    }));
  }

  function handleSortChange(field) {
    setQuery((current) => {
      const active = current.sort.find((entry) => entry.field === field);
      let nextSort;

      if (!active) {
        // New columns become the next sorting priority.
        nextSort = [...current.sort, { field, direction: "asc" }];
      } else if (active.direction === "asc") {
        // Reverse direction while preserving this column's priority.
        nextSort = current.sort.map((entry) =>
          entry.field === field ? { ...entry, direction: "desc" } : entry,
        );
      } else {
        nextSort = current.sort.filter((entry) => entry.field !== field);
      }

      return { ...current, sort: nextSort, page: 1 };
    });
  }

  function resetSort() {
    setQuery((current) => ({ ...current, sort: [], page: 1 }));
  }

  function goToPage(nextPage) {
    setQuery((current) => ({ ...current, page: nextPage }));
  }

  function retry() {
    setQuery((current) => ({ ...current }));
  }

  function openDetails(restaurantId, button) {
    openerRef.current = button;
    setSelectedRestaurantId(restaurantId);
  }

  function closeDetails() {
    setSelectedRestaurantId(null);
  }

  const resultLabel = query.result ? query.result.toUpperCase() : "All results";

  return (
    <div className="inspections-workspace">
      <PageBanner
        title="RESTAURANT INSPECTIONS"
        image="/restaurant-banner.jpg"
        position="center 65%"
      />
      <section className="inspections-page" aria-label="Restaurant workspace">
        {/* Preserve the search view while displaying details. */}
        <div hidden={selectedRestaurantId !== null}>
          <InspectionsSnapshot
            total={snapshotData?.total ?? 0}
            summary={snapshotData?.summary ?? null}
            loading={loading && !snapshotData}
            error={failed}
          />

          <RestaurantSearch
            neighborhoods={NEIGHBORHOODS}
            onSearch={handleSearch}
          />

          <p className="inspections-page__summary">
            Search criteria: {query.name || "All names"} ·{" "}
            {query.neighborhood || "All neighborhoods"} · {resultLabel}
          </p>

          {loading && !lastData && <p role="status">Loading restaurants...</p>}

          {failed && (
            <div className="inspections-page__error" role="alert">
              <p>Could not load restaurants. Please try again.</p>

              <button
                className="inspections-page__retry"
                type="button"
                onClick={retry}
              >
                Try again
              </button>
            </div>
          )}

          {lastData && !failed && (
            <RestaurantResults
              restaurants={data?.restaurants ?? lastData.restaurants}
              total={lastData.total}
              page={lastData.page}
              totalPages={lastData.totalPages}
              loading={loading}
              sortFields={query.sort}
              onSortChange={handleSortChange}
              onResetSort={resetSort}
              onPageChange={goToPage}
              onSelect={openDetails}
            />
          )}
        </div>

        {selectedRestaurantId !== null && (
          <RestaurantDetails
            key={selectedRestaurantId}
            restaurantId={selectedRestaurantId}
            onBack={closeDetails}
          />
        )}
      </section>

      <RestaurantFooter />
    </div>
  );
}

InspectionsPage.propTypes = {};

export default InspectionsPage;
