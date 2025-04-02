import {
  updateAccentColor,
  updateTopbarAccentColor,
  updatePriorityCSSVariables,
} from "../../src/utils/themeUtils";

describe("themeUtils", () => {
  describe("updateAccentColor", () => {
    beforeEach(() => {
      document.documentElement.style = "";
    });

    it("should update sidebar accent color to Blue", () => {
      updateAccentColor("Blue");
      expect(
        document.documentElement.style.getPropertyValue("--sidebar-active-bg"),
      ).toBe("#007bff");
      expect(
        document.documentElement.style.getPropertyValue(
          "--sidebar-heading-color",
        ),
      ).toBe("#007bff");
    });

    it("should update sidebar accent color to Orange", () => {
      updateAccentColor("Orange");
      expect(
        document.documentElement.style.getPropertyValue("--sidebar-active-bg"),
      ).toBe("#fd7e14");
      expect(
        document.documentElement.style.getPropertyValue(
          "--sidebar-heading-color",
        ),
      ).toBe("#fd7e14");
    });

    it("should update sidebar accent color to Purple", () => {
      updateAccentColor("Purple");
      expect(
        document.documentElement.style.getPropertyValue("--sidebar-active-bg"),
      ).toBe("#6f42c1");
      expect(
        document.documentElement.style.getPropertyValue(
          "--sidebar-heading-color",
        ),
      ).toBe("#6f42c1");
    });

    it("should update sidebar accent color to Yellow", () => {
      updateAccentColor("Yellow");
      expect(
        document.documentElement.style.getPropertyValue("--sidebar-active-bg"),
      ).toBe("#ffc107");
      expect(
        document.documentElement.style.getPropertyValue(
          "--sidebar-heading-color",
        ),
      ).toBe("#ffc107");
    });

    it("should update sidebar accent color to default (Green) if an unknown value is provided", () => {
      updateAccentColor("Unknown");
      expect(
        document.documentElement.style.getPropertyValue("--sidebar-active-bg"),
      ).toBe("#4CAF50");
      expect(
        document.documentElement.style.getPropertyValue(
          "--sidebar-heading-color",
        ),
      ).toBe("#4CAF50");
    });

    it("should update sidebar accent color to a custom color if a hex value is provided", () => {
      updateAccentColor("#abcdef");
      expect(
        document.documentElement.style.getPropertyValue("--sidebar-active-bg"),
      ).toBe("#abcdef");
      expect(
        document.documentElement.style.getPropertyValue(
          "--sidebar-heading-color",
        ),
      ).toBe("#abcdef");
    });
  });

  describe("updateTopbarAccentColor", () => {
    beforeEach(() => {
      document.documentElement.style = "";
    });

    it("should update topbar accent color to Blue (default)", () => {
      updateTopbarAccentColor("Blue");
      expect(
        document.documentElement.style.getPropertyValue(
          "--topbar-active-button-color",
        ),
      ).toBe("#007bff");
      expect(
        document.documentElement.style.getPropertyValue(
          "--create-top-bar-btn-bg",
        ),
      ).toBe("#007bff");
      expect(
        document.documentElement.style.getPropertyValue("--create-task-btn-bg"),
      ).toBe("#007bff");
      expect(
        document.documentElement.style.getPropertyValue(
          "--create-task-btn-hover",
        ),
      ).toBe("#0056b3");
    });

    it("should update topbar accent color to Green", () => {
      updateTopbarAccentColor("Green");
      expect(
        document.documentElement.style.getPropertyValue(
          "--topbar-active-button-color",
        ),
      ).toBe("#4CAF50");
      expect(
        document.documentElement.style.getPropertyValue(
          "--create-top-bar-btn-bg",
        ),
      ).toBe("#4CAF50");
      expect(
        document.documentElement.style.getPropertyValue("--create-task-btn-bg"),
      ).toBe("#4CAF50");
      expect(
        document.documentElement.style.getPropertyValue(
          "--create-task-btn-hover",
        ),
      ).toBe("#45a049");
    });

    it("should update topbar accent color to Orange", () => {
      updateTopbarAccentColor("Orange");
      expect(
        document.documentElement.style.getPropertyValue(
          "--topbar-active-button-color",
        ),
      ).toBe("#fd7e14");
      expect(
        document.documentElement.style.getPropertyValue(
          "--create-top-bar-btn-bg",
        ),
      ).toBe("#fd7e14");
      expect(
        document.documentElement.style.getPropertyValue("--create-task-btn-bg"),
      ).toBe("#fd7e14");
      expect(
        document.documentElement.style.getPropertyValue(
          "--create-task-btn-hover",
        ),
      ).toBe("#e66a00");
    });

    it("should update topbar accent color to Purple", () => {
      updateTopbarAccentColor("Purple");
      expect(
        document.documentElement.style.getPropertyValue(
          "--topbar-active-button-color",
        ),
      ).toBe("#6f42c1");
      expect(
        document.documentElement.style.getPropertyValue(
          "--create-top-bar-btn-bg",
        ),
      ).toBe("#6f42c1");
      expect(
        document.documentElement.style.getPropertyValue("--create-task-btn-bg"),
      ).toBe("#6f42c1");
      expect(
        document.documentElement.style.getPropertyValue(
          "--create-task-btn-hover",
        ),
      ).toBe("#5a32a3");
    });

    it("should update topbar accent color to Yellow", () => {
      updateTopbarAccentColor("Yellow");
      expect(
        document.documentElement.style.getPropertyValue(
          "--topbar-active-button-color",
        ),
      ).toBe("#ffc107");
      expect(
        document.documentElement.style.getPropertyValue(
          "--create-top-bar-btn-bg",
        ),
      ).toBe("#ffc107");
      expect(
        document.documentElement.style.getPropertyValue("--create-task-btn-bg"),
      ).toBe("#ffc107");
      expect(
        document.documentElement.style.getPropertyValue(
          "--create-task-btn-hover",
        ),
      ).toBe("#e0a800");
    });

    it("should update topbar accent color to default (Blue) if an unknown value is provided", () => {
      updateTopbarAccentColor("Unknown");
      expect(
        document.documentElement.style.getPropertyValue(
          "--topbar-active-button-color",
        ),
      ).toBe("#007bff");
      expect(
        document.documentElement.style.getPropertyValue(
          "--create-top-bar-btn-bg",
        ),
      ).toBe("#007bff");
      expect(
        document.documentElement.style.getPropertyValue("--create-task-btn-bg"),
      ).toBe("#007bff");
      expect(
        document.documentElement.style.getPropertyValue(
          "--create-task-btn-hover",
        ),
      ).toBe("#0056b3");
    });

    it("should update topbar accent color to a custom color if a hex value is provided", () => {
      updateTopbarAccentColor("#123456");
      expect(
        document.documentElement.style.getPropertyValue(
          "--topbar-active-button-color",
        ),
      ).toBe("#123456");
      expect(
        document.documentElement.style.getPropertyValue(
          "--create-top-bar-btn-bg",
        ),
      ).toBe("#123456");
      expect(
        document.documentElement.style.getPropertyValue("--create-task-btn-bg"),
      ).toBe("#123456");
      expect(
        document.documentElement.style.getPropertyValue(
          "--create-task-btn-hover",
        ),
      ).toBe("#123456");
    });
  });

  describe("updatePriorityCSSVariables", () => {
    beforeEach(() => {
      document.documentElement.style = "";
    });

    it("should update all priority CSS variables correctly", () => {
      const colors = {
        A1: "#111111",
        A2: "#222222",
        A3: "#333333",
        B1: "#444444",
        B2: "#555555",
        B3: "#666666",
        C1: "#777777",
        C2: "#888888",
        C3: "#999999",
        D: "#aaaaaa",
        E: "#bbbbbb",
      };
      updatePriorityCSSVariables(colors);
      Object.keys(colors).forEach((priority) => {
        expect(
          document.documentElement.style.getPropertyValue(
            `--priority-${priority}`,
          ),
        ).toBe(colors[priority]);
      });
    });
  });
});
