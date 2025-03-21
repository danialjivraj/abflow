import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "../../../src/components/navigation/Sidebar";
import { MemoryRouter } from "react-router-dom";
import { auth } from "../../../src/firebase";

jest.mock("../../../src/firebase", () => ({
  auth: { signOut: jest.fn() },
}));

const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => {
  const actual = jest.requireActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Sidebar Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders the ABFlow heading", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.getByText("ABFlow")).toBeInTheDocument();
  });

  test("renders active Dashboard when route is /dashboard", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.getByText("Dashboard")).toHaveClass("active");
    expect(screen.getByText("Charts")).not.toHaveClass("active");
    expect(screen.getByText("Profile")).not.toHaveClass("active");
  });

  test("renders active Charts when route is /charts/some", () => {
    render(
      <MemoryRouter initialEntries={["/charts/some"]}>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.getByText("Charts")).toHaveClass("active");
    expect(screen.getByText("Dashboard")).not.toHaveClass("active");
    expect(screen.getByText("Profile")).not.toHaveClass("active");
  });

  test("renders active Profile when route is /profile", () => {
    render(
      <MemoryRouter initialEntries={["/profile"]}>
        <Sidebar />
      </MemoryRouter>
    );
    expect(screen.getByText("Profile")).toHaveClass("active");
    expect(screen.getByText("Dashboard")).not.toHaveClass("active");
    expect(screen.getByText("Charts")).not.toHaveClass("active");
  });

  test("navigates to /dashboard when Dashboard is clicked", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText("Dashboard"));
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  test("navigates to /charts when Charts is clicked", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText("Charts"));
    expect(mockNavigate).toHaveBeenCalledWith("/charts");
  });

  test("navigates to /profile when Profile is clicked", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText("Profile"));
    expect(mockNavigate).toHaveBeenCalledWith("/profile");
  });

  test("calls auth.signOut when Logout button is clicked", () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText("Logout"));
    expect(auth.signOut).toHaveBeenCalled();
  });
});
