import { useState } from "react";
import PropTypes from "prop-types";
import "./GroceryItem.css";

function GroceryItem({ item, onUpdate, onDelete, onShowRecalls }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const recalled = item.recalls.length > 0;
  const inputId = `grocery-edit-${item._id}`;

  async function handleSave(event) {
    event.preventDefault();
    const trimmed = name.trim();

    if (trimmed.length < 2) {
      setError("Enter at least 2 characters.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      await onUpdate(item._id, trimmed);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function handleCancel() {
    setEditing(false);
    setName(item.name);
    setError("");
  }

  async function handleDelete() {
    if (!window.confirm(`Remove "${item.name}" from your list?`)) return;

    setBusy(true);
    setError("");

    try {
      await onDelete(item._id);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <li className={`grocery-item${recalled ? " grocery-item--recalled" : ""}`}>
      {editing ? (
        <form className="grocery-item__edit" onSubmit={handleSave}>
          <label htmlFor={inputId} className="grocery-item__label">
            Edit item name
          </label>
          <input
            id={inputId}
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={60}
          />
          <button type="submit" disabled={busy}>
            Save
          </button>
          <button type="button" onClick={handleCancel} disabled={busy}>
            Cancel
          </button>
        </form>
      ) : (
        <>
          <span className="grocery-item__name">{item.name}</span>

          {recalled && (
            <button
              type="button"
              className="grocery-item__badge"
              onClick={() => onShowRecalls(item)}
            >
              Recalled ({item.recalls.length})
            </button>
          )}

          <div className="grocery-item__actions">
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={busy}
            >
              Edit
            </button>
            <button type="button" onClick={handleDelete} disabled={busy}>
              Remove
            </button>
          </div>
        </>
      )}

      {error && (
        <p className="grocery-item__error" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}

GroceryItem.propTypes = {
  item: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    recalls: PropTypes.arrayOf(PropTypes.object).isRequired,
  }).isRequired,
  onUpdate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onShowRecalls: PropTypes.func.isRequired,
};

export default GroceryItem;
