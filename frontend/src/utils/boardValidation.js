/**
 * Validates a column name against empty values, reserved words, and duplicates.
 *
 * @param {string} name - The column name to validate.
 * @param {object} columns - The current columns as an object (e.g., { columnId: { name: "column Name", ... } }).
 * @param {string|null} columnIdToExclude - (Optional) The column ID to exclude from duplicate checks (useful when renaming).
 * @returns {string} An error message if validation fails; an empty string otherwise.
 */
export function validateColumnName(name, columns, columnIdToExclude = null) {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return "Column name cannot be empty.";
  }
  if (trimmedName.toLowerCase() === "completed") {
    return "Column name 'Completed' is reserved.";
  }
  const duplicate = Object.entries(columns).find(
    ([id, column]) =>
      column.name.toLowerCase() === trimmedName.toLowerCase() &&
      id !== columnIdToExclude,
  );
  if (duplicate) {
    return "Column name already exists.";
  }
  return "";
}
