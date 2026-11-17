import { useState } from "react";
import PropTypes from "prop-types";
import "./GroceryItemForm.css";

function GroceryItemForm({ onAdd }) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmed = name.trim();

    if (trimmed.length < 2) {
      setError("Enter at least 2 characters.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onAdd(trimmed);
      setName("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="grocery-form" onSubmit={handleSubmit}>
      <label htmlFor="grocery-item-name" className="grocery-form__label">
        Add an item to your list
      </label>
      <div className="grocery-form__row">
        <input
          id="grocery-item-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Example: Spinach, Butter, Lemon"
          maxLength={60}
        />
        <button type="submit" disabled={saving}>
          {saving ? "Adding…" : "Add to list"}
        </button>
      </div>
      {error && (
        <p className="grocery-form__error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

GroceryItemForm.propTypes = {
  onAdd: PropTypes.func.isRequired,
};

export default GroceryItemForm;