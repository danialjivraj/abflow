import { updateAccentColor, updateTopbarAccentColor } from "../../src/utils/themeUtils";

describe("themeUtils", () => {
  describe("updateAccentColor", () => {
    it("should update sidebar accent color to Blue", () => {
      updateAccentColor("Blue");
      expect(document.documentElement.style.getPropertyValue("--sidebar-active-bg")).toBe("#007bff");
      expect(document.documentElement.style.getPropertyValue("--sidebar-heading-color")).toBe("#007bff");
    });

    it("should update sidebar accent color to Orange", () => {
      updateAccentColor("Orange");
      expect(document.documentElement.style.getPropertyValue("--sidebar-active-bg")).toBe("#fd7e14");
      expect(document.documentElement.style.getPropertyValue("--sidebar-heading-color")).toBe("#fd7e14");
    });

    it("should update sidebar accent color to Purple", () => {
      updateAccentColor("Purple");
      expect(document.documentElement.style.getPropertyValue("--sidebar-active-bg")).toBe("#6f42c1");
      expect(document.documentElement.style.getPropertyValue("--sidebar-heading-color")).toBe("#6f42c1");
    });

    it("should update sidebar accent color to Yellow", () => {
      updateAccentColor("Yellow");
      expect(document.documentElement.style.getPropertyValue("--sidebar-active-bg")).toBe("#ffc107");
      expect(document.documentElement.style.getPropertyValue("--sidebar-heading-color")).toBe("#ffc107");
    });

    it("should update sidebar accent color to default (Green) if an unknown value is provided", () => {
      updateAccentColor("Unknown");
      expect(document.documentElement.style.getPropertyValue("--sidebar-active-bg")).toBe("#4CAF50");
      expect(document.documentElement.style.getPropertyValue("--sidebar-heading-color")).toBe("#4CAF50");
    });
  });

  describe("updateTopbarAccentColor", () => {
    it("should update topbar accent color to Blue (default)", () => {
      updateTopbarAccentColor("Blue");
      expect(document.documentElement.style.getPropertyValue("--topbar-active-button-color")).toBe("#007bff");
      expect(document.documentElement.style.getPropertyValue("--create-top-bar-btn-bg")).toBe("#007bff");
      expect(document.documentElement.style.getPropertyValue("--create-task-btn-bg")).toBe("#007bff");
      expect(document.documentElement.style.getPropertyValue("--create-task-btn-hover")).toBe("#0056b3");
    });

    it("should update topbar accent color to Red", () => {
      updateTopbarAccentColor("Red");
      expect(document.documentElement.style.getPropertyValue("--topbar-active-button-color")).toBe("#dc3545");
      expect(document.documentElement.style.getPropertyValue("--create-top-bar-btn-bg")).toBe("#dc3545");
      expect(document.documentElement.style.getPropertyValue("--create-task-btn-bg")).toBe("#dc3545");
      expect(document.documentElement.style.getPropertyValue("--create-task-btn-hover")).toBe("#c82333");
    });

    it("should update topbar accent color to Purple", () => {
      updateTopbarAccentColor("Purple");
      expect(document.documentElement.style.getPropertyValue("--topbar-active-button-color")).toBe("#6f42c1");
      expect(document.documentElement.style.getPropertyValue("--create-top-bar-btn-bg")).toBe("#6f42c1");
      expect(document.documentElement.style.getPropertyValue("--create-task-btn-bg")).toBe("#6f42c1");
      expect(document.documentElement.style.getPropertyValue("--create-task-btn-hover")).toBe("#5a32a3");
    });

    it("should update topbar accent color to Black", () => {
      updateTopbarAccentColor("Black");
      expect(document.documentElement.style.getPropertyValue("--topbar-active-button-color")).toBe("#343a40");
      expect(document.documentElement.style.getPropertyValue("--create-top-bar-btn-bg")).toBe("#343a40");
      expect(document.documentElement.style.getPropertyValue("--create-task-btn-bg")).toBe("#343a40");
      expect(document.documentElement.style.getPropertyValue("--create-task-btn-hover")).toBe("#2c2f33");
    });

    it("should update topbar accent color to default (Blue) if an unknown value is provided", () => {
      updateTopbarAccentColor("Unknown");
      expect(document.documentElement.style.getPropertyValue("--topbar-active-button-color")).toBe("#007bff");
      expect(document.documentElement.style.getPropertyValue("--create-top-bar-btn-bg")).toBe("#007bff");
      expect(document.documentElement.style.getPropertyValue("--create-task-btn-bg")).toBe("#007bff");
      expect(document.documentElement.style.getPropertyValue("--create-task-btn-hover")).toBe("#0056b3");
    });
  });
});
