import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import "./RestaurantResults.css";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

const SORT_COLUMNS = [
  { field: "restaurantName", label: "Restaurant", asc: "A–Z", desc: "Z–A" },
  { field: "neighborhood", label: "Neighborhood", asc: "A–Z", desc: "Z–A" },
  {
    field: "latestInspectionDate",
    label: "Latest inspection",
    asc: "earliest first",
    desc: "latest first",
  },
  {
    field: "latestResult",
    label: "Result",
    asc: "Fail first",
    desc: "Pass first",
  },
];

function RestaurantResults({
  restaurants,
  total,
  page,
  totalPages,
  loading,
  sortFields,
  onSortChange,
  onResetSort,
  onPageChange,
  onSelect,
}) {
  const scrollRef = useRef(null);
  const noun = total === 1 ? "restaurant" : "restaurants";
  const primaryField = sortFields[0]?.field ?? "restaurantName";
  const primaryDirection = sortFields[0]?.direction ?? "asc";

  const sortSummary = sortFields.length
    ? sortFields
        .map(({ field, direction }, index) => {
          const column = SORT_COLUMNS.find((entry) => entry.field === field);
          return `${index + 1}. ${column.label} (${column[direction]})`;
        })
        .join(" → ")
    : "Default: Restaurant (A–Z)";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [restaurants]);

  return (
    <section
      className="restaurant-results"
      aria-labelledby="restaurant-results-title"
    >
      <header className="restaurant-results__header">
        <h2 id="restaurant-results-title">Restaurant Records</h2>

        <p role="status">
          {loading ? (
            "Updating results..."
          ) : (
            <>
              {total.toLocaleString("en-US")} matching {noun}
              {totalPages > 0 && (
                <span className="restaurant-results__sr-only">
                  {`, page ${page} of ${totalPages}`}
                </span>
              )}
            </>
          )}
        </p>
      </header>

      <p id="restaurant-sort-help" className="restaurant-results__sort-help">
        Click a heading to add, reverse, or remove a sort. Numbers show
        priority.
      </p>

      <div className="restaurant-results__sort-summary">
        <p id="restaurant-sort-summary" role="status">
          {sortSummary}
        </p>

        {sortFields.length > 0 && (
          <button type="button" onClick={onResetSort}>
            Reset sorting
          </button>
        )}
      </div>

      {totalPages > 0 && (
        <nav
          className="restaurant-results__pagination"
          aria-label="Restaurant result pages"
        >
          <button
            type="button"
            disabled={loading || page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </button>

          <p>{loading ? "Loading..." : `Page ${page} of ${totalPages}`}</p>

          <button
            type="button"
            disabled={loading || page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </button>
        </nav>
      )}

      <div
        ref={scrollRef}
        className="restaurant-results__scroll"
        role="region"
        aria-label="Restaurant inspection results"
        aria-busy={loading}
        tabIndex={0}
      >
        <table className="restaurant-results__table">
          <caption>Latest inspection for each matching restaurant</caption>

          <thead>
            <tr>
              {SORT_COLUMNS.map((column) => {
                const index = sortFields.findIndex(
                  (entry) => entry.field === column.field,
                );
                const active = sortFields[index];

                const nextAction = !active
                  ? `Sort ${column.label} ${column.asc} as priority ${sortFields.length + 1}`
                  : active.direction === "asc"
                    ? `Sort ${column.label} ${column.desc}`
                    : `Remove ${column.label} from sorting`;

                return (
                  <th
                    key={column.field}
                    scope="col"
                    aria-sort={
                      primaryField === column.field
                        ? primaryDirection === "asc"
                          ? "ascending"
                          : "descending"
                        : undefined
                    }
                  >
                    <button
                      className="restaurant-results__sort-button"
                      type="button"
                      data-active={Boolean(active)}
                      aria-describedby="restaurant-sort-help restaurant-sort-summary"
                      aria-label={`${column.label}: ${
                        active
                          ? `${column[active.direction]}, priority ${index + 1}`
                          : "no custom sort"
                      }. ${nextAction}.`}
                      title={nextAction}
                      onClick={() => onSortChange(column.field)}
                    >
                      <span>{column.label}</span>

                      <span
                        className="restaurant-results__sort-arrow"
                        aria-hidden="true"
                      >
                        {!active ? "↕" : active.direction === "asc" ? "↑" : "↓"}
                      </span>

                      {active && (
                        <span
                          className="restaurant-results__sort-priority"
                          aria-hidden="true"
                        >
                          {index + 1}
                        </span>
                      )}
                    </button>
                  </th>
                );
              })}

              <th scope="col">Details</th>
            </tr>
          </thead>

          <tbody>
            {restaurants.length === 0 && (
              <tr>
                <td colSpan={5}>
                  {loading
                    ? "Loading restaurants..."
                    : "No restaurants match these filters. Try another search or use Clear."}
                </td>
              </tr>
            )}

            {restaurants.map((restaurant) => (
              <tr key={restaurant.restaurantId}>
                <th scope="row">{restaurant.restaurantName}</th>
                <td>{restaurant.neighborhood}</td>
                <td>
                  <time dateTime={restaurant.latestInspectionDate}>
                    {dateFormatter.format(
                      new Date(restaurant.latestInspectionDate),
                    )}
                  </time>
                </td>
                <td>
                  <span
                    className={`restaurant-results__result restaurant-results__result--${restaurant.latestResult}`}
                  >
                    {restaurant.latestResult === "pass" ? "Pass" : "Fail"}
                  </span>
                </td>
                <td>
                  <button
                    className="restaurant-results__details"
                    type="button"
                    disabled={loading}
                    aria-label={`View details for ${restaurant.restaurantName}`}
                    onClick={(event) =>
                      onSelect(restaurant.restaurantId, event.currentTarget)
                    }
                  >
                    View details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

RestaurantResults.propTypes = {
  restaurants: PropTypes.arrayOf(
    PropTypes.shape({
      restaurantId: PropTypes.string.isRequired,
      restaurantName: PropTypes.string.isRequired,
      neighborhood: PropTypes.string.isRequired,
      latestInspectionDate: PropTypes.string.isRequired,
      latestResult: PropTypes.oneOf(["pass", "fail"]).isRequired,
    }),
  ).isRequired,
  total: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  loading: PropTypes.bool.isRequired,
  sortFields: PropTypes.arrayOf(
    PropTypes.shape({
      field: PropTypes.oneOf(SORT_COLUMNS.map((column) => column.field))
        .isRequired,
      direction: PropTypes.oneOf(["asc", "desc"]).isRequired,
    }),
  ).isRequired,
  onSortChange: PropTypes.func.isRequired,
  onResetSort: PropTypes.func.isRequired,
  onPageChange: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default RestaurantResults;
