import { render, screen } from "@testing-library/react";
import Layout from "../../../src/components/navigation/Layout";
import { MemoryRouter } from "react-router-dom";
import { NotificationsContext } from "../../../src/contexts/NotificationsContext";

describe("Layout Component", () => {
  test("renders Sidebar and children", () => {
    render(
      <MemoryRouter>
        <Layout>
          <div>Test Content</div>
        </Layout>
      </MemoryRouter>,
    );
    expect(screen.getByText("ABFlow")).toBeInTheDocument();
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  test("renders TopBar when topBarButtons prop is provided", () => {
    const topBarButtons = [
      {
        label: "Button A",
        className: "btn-a",
        onClick: jest.fn(),
      },
    ];
    render(
      <NotificationsContext.Provider value={{ notifications: [] }}>
        <MemoryRouter>
          <Layout topBarButtons={topBarButtons} openModal={jest.fn()}>
            <div>Test Content</div>
          </Layout>
        </MemoryRouter>
      </NotificationsContext.Provider>,
    );
    expect(screen.getByText("Button A")).toBeInTheDocument();
  });

  test("does not render TopBar when topBarButtons prop is empty", () => {
    render(
      <MemoryRouter>
        <Layout topBarButtons={[]} openModal={jest.fn()}>
          <div>Test Content</div>
        </Layout>
      </MemoryRouter>,
    );
    const topBarElement = document.querySelector(".top-bar");
    expect(topBarElement).toBeNull();
  });
});
