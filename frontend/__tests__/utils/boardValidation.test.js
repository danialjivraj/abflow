const { validateBoardName } = require('../../src/utils/boardValidation');
const { createBaseColumn } = require('../../_testUtils/createBaseColumn');

describe('validateBoardName', () => {
    const columns = {
        "board-1": createBaseColumn({ columnId: "board-1", name: "Board One" }),
        "board-2": createBaseColumn({ columnId: "board-2", name: "Board Two" }),
    };

    it('returns an error when the board name is empty', () => {
        expect(validateBoardName("   ", columns)).toBe("Board name cannot be empty.");
    });

    it('returns an error when the board name is "Completed" (case-insensitive)', () => {
        expect(validateBoardName("Completed", columns)).toBe("Board name 'Completed' is reserved.");
        expect(validateBoardName("completed", columns)).toBe("Board name 'Completed' is reserved.");
        expect(validateBoardName("  CoMpLeTeD  ", columns)).toBe("Board name 'Completed' is reserved.");
    });

    it('returns an error when the board name is a duplicate', () => {
        expect(validateBoardName("Board One", columns)).toBe("Board name already taken.");
        expect(validateBoardName("board one", columns)).toBe("Board name already taken.");
        expect(validateBoardName("  Board One  ", columns)).toBe("Board name already taken.");
    });

    it('does not return an error for a duplicate name when excluding the same boardId', () => {
        expect(validateBoardName("Board One", columns, "board-1")).toBe("");
    });

    it('returns an empty string for a valid board name', () => {
        expect(validateBoardName("New Board", columns)).toBe("");
    });

    it('trims input before validation', () => {
        expect(validateBoardName("   New Board   ", columns)).toBe("");
    });

    it('returns empty string for unique name when columns are empty', () => {
        expect(validateBoardName("New Board", {})).toBe("");
    });
});
