import React, { createContext } from "react";
import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Settings from "../src/pages/Settings";
import {
  fetchSettingsPreferences,
  updateSettingsPreferences,
} from "../src/services/preferencesService";
import { createBaseUser } from "../_testUtils/createBaseUser";
import { toast } from "react-toastify";

export const NotificationsContext = createContext({ notifications: [] });

const AllProviders = ({
  children,
  initialEntries = ["/settings/productivity-ux"],
}) => (
  <MemoryRouter initialEntries={initialEntries}>
    <NotificationsContext.Provider value={{ notifications: [] }}>
      {children}
    </NotificationsContext.Provider>
  </MemoryRouter>
);

jest.mock("../src/firebase", () => ({
  auth: { currentUser: { uid: "user1" } },
}));

jest.mock("../src/services/preferencesService", () => ({
  fetchSettingsPreferences: jest.fn(),
  updateSettingsPreferences: jest.fn(),
}));

jest.mock("../src/utils/themeUtils", () => ({
  updateAccentColor: jest.fn(),
  updateTopbarAccentColor: jest.fn(),
  updatePriorityCSSVariables: jest.fn(),
}));

jest.mock("../src/components/navigation/Layout", () => ({ children }) => (
  <div>{children}</div>
));
jest.mock("../src/components/navigation/TopBar", () => () => <div>TopBar</div>);

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe("Settings component", () => {
  const dummyUser = createBaseUser();

  beforeEach(() => {
    fetchSettingsPreferences.mockResolvedValue({
      data: { settingsPreferences: dummyUser.settingsPreferences },
    });
    updateSettingsPreferences.mockResolvedValue({});
  });

  it("renders settings after fetching preferences", async () => {
    render(
      <Routes>
        <Route
          path="/settings/:section/*"
          element={<Settings updateDefaultBoardView={jest.fn()} />}
        />
      </Routes>,
      { wrapper: AllProviders }
    );
    expect(screen.getByText("Loading settings...")).toBeInTheDocument();
    await waitForElementToBeRemoved(() =>
      screen.queryByText("Loading settings...")
    );
    const heading = await screen.findByRole("heading", {
      name: "Productivity & UX",
    });
    expect(heading).toBeInTheDocument();
  });

  it("preserves dark mode when 'Default All' is clicked", async () => {
    render(
      <Routes>
        <Route
          path="/settings/:section/*"
          element={<Settings updateDefaultBoardView={jest.fn()} />}
        />
      </Routes>,
      { wrapper: AllProviders }
    );
    await waitForElementToBeRemoved(() =>
      screen.queryByText("Loading settings...")
    );
    await screen.findByRole("heading", { name: "Productivity & UX" });

    const notificationsTab = await screen.findByText("Notifications");
    userEvent.click(notificationsTab);

    await screen.findByText("Mute Notifications");

    const muteCheckbox = screen.getByLabelText("Mute Notifications");
    userEvent.click(muteCheckbox);

    await waitFor(() => expect(muteCheckbox).toBeChecked());

    const defaultAllButton = screen.getByRole("button", {
      name: "Default All",
    });
    userEvent.click(defaultAllButton);

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("saves settings when 'Save Settings' is clicked", async () => {
    const updateDefaultBoardViewMock = jest.fn();
    render(
      <Routes>
        <Route
          path="/settings/:section/*"
          element={
            <Settings updateDefaultBoardView={updateDefaultBoardViewMock} />
          }
        />
      </Routes>,
      { wrapper: AllProviders }
    );
    await waitForElementToBeRemoved(() =>
      screen.queryByText("Loading settings...")
    );
    await screen.findByRole("heading", { name: "Productivity & UX" });

    const boardSelect = screen.getByRole("combobox", {
      name: "Default Board View",
    });
    await userEvent.selectOptions(boardSelect, "schedule");

    await waitFor(() => {
      expect(boardSelect.value).toBe("schedule");
    });

    const saveButton = screen.getByRole("button", { name: "Save Settings" });
    expect(saveButton).not.toBeDisabled();
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Settings saved!");
    });

    expect(updateDefaultBoardViewMock).toHaveBeenCalledWith("schedule");
    expect(updateSettingsPreferences).toHaveBeenCalled();
  });

  it("redirects to default section if section param is missing", async () => {
    render(
      <Routes>
        <Route
          path="/settings"
          element={<Settings updateDefaultBoardView={jest.fn()} />}
        />
        <Route
          path="/settings/:section/*"
          element={<Settings updateDefaultBoardView={jest.fn()} />}
        />
      </Routes>,
      {
        wrapper: ({ children }) => (
          <MemoryRouter initialEntries={["/settings"]}>
            <NotificationsContext.Provider value={{ notifications: [] }}>
              {children}
            </NotificationsContext.Provider>
          </MemoryRouter>
        ),
      }
    );
    const heading = await screen.findByRole("heading", {
      name: "Productivity & UX",
    });
    expect(heading).toBeInTheDocument();
  });

  it("renders default section if unknown slug provided", async () => {
    render(
      <Routes>
        <Route
          path="/settings/:section/*"
          element={<Settings updateDefaultBoardView={jest.fn()} />}
        />
      </Routes>,
      {
        wrapper: ({ children }) => (
          <MemoryRouter initialEntries={["/settings/unknown"]}>
            <NotificationsContext.Provider value={{ notifications: [] }}>
              {children}
            </NotificationsContext.Provider>
          </MemoryRouter>
        ),
      }
    );
    const heading = await screen.findByRole("heading", {
      name: "Productivity & UX",
    });
    expect(heading).toBeInTheDocument();
  });

  it("renders Scheduling section when sidebar item is clicked", async () => {
    render(
      <Routes>
        <Route
          path="/settings/:section/*"
          element={<Settings updateDefaultBoardView={jest.fn()} />}
        />
      </Routes>,
      { wrapper: AllProviders }
    );
    const schedulingTab = await screen.findByText("Scheduling");
    userEvent.click(schedulingTab);
    const heading = await screen.findByRole("heading", { name: "Scheduling" });
    expect(heading).toBeInTheDocument();
    expect(screen.getByText("Disable Drag to Create Task")).toBeInTheDocument();
  });

  it("resets Productivity & UX settings when default category button is clicked", async () => {
    render(
      <Routes>
        <Route
          path="/settings/:section/*"
          element={<Settings updateDefaultBoardView={jest.fn()} />}
        />
      </Routes>,
      { wrapper: AllProviders }
    );
    await waitForElementToBeRemoved(() =>
      screen.queryByText("Loading settings...")
    );
    const boardSelect = screen.getByRole("combobox", {
      name: "Default Board View",
    });
    boardSelect.value = "schedule";
    boardSelect.dispatchEvent(new Event("change", { bubbles: true }));
    expect(boardSelect.value).toBe("schedule");

    const resetCategoryButton = screen.getByRole("button", {
      name: "Default Productivity & UX",
    });
    userEvent.click(resetCategoryButton);
    await waitFor(() => {
      expect(boardSelect.value).toBe("boards");
    });
  });

  it("resets all settings except dark mode when 'Default All' is clicked", async () => {
    render(
      <Routes>
        <Route
          path="/settings/:section/*"
          element={<Settings updateDefaultBoardView={jest.fn()} />}
        />
      </Routes>,
      { wrapper: AllProviders }
    );
    await waitForElementToBeRemoved(() =>
      screen.queryByText("Loading settings...")
    );
    const boardSelect = screen.getByRole("combobox", {
      name: "Default Board View",
    });
    boardSelect.value = "schedule";
    boardSelect.dispatchEvent(new Event("change", { bubbles: true }));
    expect(boardSelect.value).toBe("schedule");

    document.documentElement.setAttribute("data-theme", "dark");

    const defaultAllButton = screen.getByRole("button", {
      name: "Default All",
    });
    userEvent.click(defaultAllButton);

    await waitFor(() => {
      expect(boardSelect.value).toBe("boards");
    });
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("disables 'Save Settings' button when no changes are made", async () => {
    render(
      <Routes>
        <Route
          path="/settings/:section/*"
          element={<Settings updateDefaultBoardView={jest.fn()} />}
        />
      </Routes>,
      { wrapper: AllProviders }
    );
    await waitForElementToBeRemoved(() =>
      screen.queryByText("Loading settings...")
    );
    const saveButton = screen.getByRole("button", { name: "Save Settings" });
    expect(saveButton).toBeDisabled();
  });

  it("shows error message if save fails", async () => {
    updateSettingsPreferences.mockRejectedValue(new Error("Save failed"));
    render(
      <Routes>
        <Route
          path="/settings/:section/*"
          element={<Settings updateDefaultBoardView={jest.fn()} />}
        />
      </Routes>,
      { wrapper: AllProviders }
    );
    await waitForElementToBeRemoved(() =>
      screen.queryByText("Loading settings...")
    );

    const boardSelect = screen.getByRole("combobox", {
      name: "Default Board View",
    });
    await userEvent.selectOptions(boardSelect, "schedule");

    await waitFor(() => {
      expect(boardSelect.value).toBe("schedule");
    });

    const saveButton = screen.getByRole("button", { name: "Save Settings" });
    expect(saveButton).not.toBeDisabled();
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to save settings.");
    });
  });

  it("toggles 'Hide Label Text'", async () => {
    render(
      <Routes>
        <Route
          path="/settings/:section/*"
          element={<Settings updateDefaultBoardView={jest.fn()} />}
        />
      </Routes>,
      {
        wrapper: ({ children }) => (
          <MemoryRouter initialEntries={["/settings/interface-customisation"]}>
            <NotificationsContext.Provider value={{ notifications: [] }}>
              {children}
            </NotificationsContext.Provider>
          </MemoryRouter>
        ),
      }
    );
    await waitForElementToBeRemoved(() =>
      screen.queryByText("Loading settings...")
    );
    const hideLabelCheckbox = screen.getByLabelText("Hide Label Text");
    expect(hideLabelCheckbox).not.toBeChecked();
    userEvent.click(hideLabelCheckbox);
    await waitFor(() => expect(hideLabelCheckbox).toBeChecked());
  });
});
