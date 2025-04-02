/**
 * Validates a board name against empty values, reserved words, and duplicates.
 *
 * @param {string} name - The board name to validate.
 * @param {object} columns - The current boards as an object (e.g., { boardId: { name: "Board Name", ... } }).
 * @param {string|null} boardIdToExclude - (Optional) The board ID to exclude from duplicate checks (useful when renaming).
 * @returns {string} An error message if validation fails; an empty string otherwise.
 */
export function validateBoardName(name, columns, boardIdToExclude = null) {
  const trimmedName = name.trim();
  if (!trimmedName) {
    return "Board name cannot be empty.";
  }
  if (trimmedName.toLowerCase() === "completed") {
    return "Board name 'Completed' is reserved.";
  }
  const duplicate = Object.entries(columns).find(
    ([id, board]) =>
      board.name.toLowerCase() === trimmedName.toLowerCase() &&
      id !== boardIdToExclude,
  );
  if (duplicate) {
    return "Board name already taken.";
  }
  return "";
}
