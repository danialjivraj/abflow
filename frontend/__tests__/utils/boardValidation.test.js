const { validateColumnName } = require("../../src/utils/boardValidation");
const { createBaseColumn } = require("../../_testUtils/createBaseColumn");

describe("validateColumnName", () => {
  const columns = {
    "board-1": createBaseColumn({ columnId: "board-1", name: "Board One" }),
    "board-2": createBaseColumn({ columnId: "board-2", name: "Board Two" }),
  };

  it("returns an error when the board name is empty", () => {
    expect(validateColumnName("   ", columns)).toBe(
      "Column name cannot be empty.",
    );
  });

  it('returns an error when the board name is "Completed" (case-insensitive)', () => {
    expect(validateColumnName("Completed", columns)).toBe(
      "Column name 'Completed' is reserved.",
    );
    expect(validateColumnName("completed", columns)).toBe(
      "Column name 'Completed' is reserved.",
    );
    expect(validateColumnName("  CoMpLeTeD  ", columns)).toBe(
      "Column name 'Completed' is reserved.",
    );
  });

  it("returns an error when the board name is a duplicate", () => {
    expect(validateColumnName("Board One", columns)).toBe(
      "Column name already exists.",
    );
    expect(validateColumnName("board one", columns)).toBe(
      "Column name already exists.",
    );
    expect(validateColumnName("  Board One  ", columns)).toBe(
      "Column name already exists.",
    );
  });

  it("does not return an error for a duplicate name when excluding the same boardId", () => {
    expect(validateColumnName("Board One", columns, "board-1")).toBe("");
  });

  it("returns an empty string for a valid board name", () => {
    expect(validateColumnName("New Board", columns)).toBe("");
  });

  it("trims input before validation", () => {
    expect(validateColumnName("   New Board   ", columns)).toBe("");
  });

  it("returns empty string for unique name when columns are empty", () => {
    expect(validateColumnName("New Board", {})).toBe("");
  });
});
