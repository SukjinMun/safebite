import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import "./RecallAlert.css";

function RecallAlert({ item, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (item && !dialog.open) dialog.showModal();
    if (!item && dialog.open) dialog.close();
  }, [item]);

  return (
    <dialog
      ref={dialogRef}
      className="recall-alert"
      onClose={onClose}
      aria-labelledby="recall-alert-title"
    >
      {item && (
        <>
          <h2 id="recall-alert-title">RECALLED ITEM!</h2>
          <p>
            “{item.name}” matches {item.recalls.length}{" "}
            {item.recalls.length === 1 ? "recall" : "recalls"}:
          </p>

          <ul className="recall-alert__list">
            {item.recalls.map((recall) => (
              <li key={recall._id}>
                <strong>{recall.product}</strong>
                <span>
                  {recall.brand} · {recall.packageSize} · {recall.classification}
                </span>
                <span>{recall.reason}</span>
                <span className="recall-alert__action">
                  What to do: {recall.consumerAction}
                </span>
              </li>
            ))}
          </ul>

          <button type="button" onClick={onClose}>
            Okay
          </button>
        </>
      )}
    </dialog>
  );
}

RecallAlert.propTypes = {
  item: PropTypes.shape({
    name: PropTypes.string.isRequired,
    recalls: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        product: PropTypes.string.isRequired,
        brand: PropTypes.string.isRequired,
        packageSize: PropTypes.string,
        classification: PropTypes.string,
        reason: PropTypes.string,
        consumerAction: PropTypes.string,
      }),
    ).isRequired,
  }),
  onClose: PropTypes.func.isRequired,
};

export default RecallAlert;