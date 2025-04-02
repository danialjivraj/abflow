import { render, screen, fireEvent } from "@testing-library/react";
import TopBar from "../../../src/components/navigation/TopBar";
import { MemoryRouter } from "react-router-dom";
import { NotificationsContext } from "../../../src/contexts/NotificationsContext";

const dummyOpenModal = jest.fn();
const dummyNavigate = jest.fn();

const buttons = [
  {
    label: "Button One",
    className: "btn-one",
    path: "/one",
    onClick: (openModal, navigate) => {
      openModal();
      navigate("/one");
    },
  },
  {
    label: "Button Two",
    className: "btn-two",
    value: "chartTwo",
    onClick: (openModal, navigate) => {
      openModal();
      navigate("/two");
    },
  },
];

const renderWithContext = (ui, { notifications = [] } = {}) => {
  return render(
    <NotificationsContext.Provider value={{ notifications }}>
      <MemoryRouter>{ui}</MemoryRouter>
    </NotificationsContext.Provider>,
  );
};

describe("TopBar Component", () => {
  beforeEach(() => {
    dummyOpenModal.mockClear();
    dummyNavigate.mockClear();
  });

  test("renders all provided buttons with proper labels", () => {
    renderWithContext(
      <TopBar
        buttons={buttons}
        openModal={dummyOpenModal}
        navigate={dummyNavigate}
        activeChartType={"chartTwo"}
      />,
    );
    expect(screen.getByText("Button One")).toBeInTheDocument();
    expect(screen.getByText("Button Two")).toBeInTheDocument();
  });

  test("applies active class based on location path for buttons with a path", () => {
    render(
      <NotificationsContext.Provider value={{ notifications: [] }}>
        <MemoryRouter initialEntries={["/one/some"]}>
          <TopBar
            buttons={buttons}
            openModal={dummyOpenModal}
            navigate={dummyNavigate}
            activeChartType={null}
          />
        </MemoryRouter>
      </NotificationsContext.Provider>,
    );
    const buttonOne = screen.getByText("Button One");
    expect(buttonOne).toHaveClass("active");
  });

  test("applies active class based on activeChartType for buttons without path", () => {
    renderWithContext(
      <TopBar
        buttons={buttons}
        openModal={dummyOpenModal}
        navigate={dummyNavigate}
        activeChartType={"chartTwo"}
      />,
    );
    const buttonTwo = screen.getByText("Button Two");
    expect(buttonTwo).toHaveClass("active");
  });

  test("calls the button onClick function with openModal and navigate", () => {
    renderWithContext(
      <TopBar
        buttons={buttons}
        openModal={dummyOpenModal}
        navigate={dummyNavigate}
        activeChartType={null}
      />,
    );
    const buttonOne = screen.getByText("Button One");
    fireEvent.click(buttonOne);
    expect(dummyOpenModal).toHaveBeenCalled();
    expect(dummyNavigate).toHaveBeenCalledWith("/one");
  });

  test("renders all notification messages in the dropdown when opened", () => {
    const notifications = [
      { id: 1, read: false, message: "Notification 1" },
      { id: 2, read: true, message: "Notification 2" },
      { id: 3, read: false, message: "Notification 3" },
    ];
    renderWithContext(
      <TopBar
        buttons={buttons}
        openModal={dummyOpenModal}
        navigate={dummyNavigate}
        activeChartType={null}
      />,
      { notifications },
    );
    const container = screen.getByText(
      (content, node) =>
        node.classList && node.classList.contains("notifications-container"),
    );
    const notifBtn = container.querySelector(
      "button.top-bar-button.notification-button",
    );

    expect(screen.queryByText("Notification 1")).toBeNull();
    expect(screen.queryByText("Notification 2")).toBeNull();
    expect(screen.queryByText("Notification 3")).toBeNull();

    fireEvent.click(notifBtn);

    expect(screen.getByText("Notification 1")).toBeInTheDocument();
    expect(screen.getByText("Notification 2")).toBeInTheDocument();
    expect(screen.getByText("Notification 3")).toBeInTheDocument();
  });

  test("renders notifications count as 99+ when unread count exceeds 99", () => {
    const notifications = Array.from({ length: 101 }, (_, i) => ({
      id: i,
      read: false,
      message: `Notification ${i}`,
    }));
    renderWithContext(
      <TopBar
        buttons={buttons}
        openModal={dummyOpenModal}
        navigate={dummyNavigate}
        activeChartType={null}
      />,
      { notifications },
    );
    expect(screen.getByText("99")).toBeInTheDocument();
    expect(screen.getByText("+")).toBeInTheDocument();
  });

  test("toggles notifications dropdown when notifications button is clicked", () => {
    const notifications = [
      { id: 1, read: false, message: "Test notification" },
    ];
    renderWithContext(
      <TopBar
        buttons={buttons}
        openModal={dummyOpenModal}
        navigate={dummyNavigate}
        activeChartType={null}
      />,
      { notifications },
    );
    const container = screen.getByText((content, node) => {
      return (
        node.classList && node.classList.contains("notifications-container")
      );
    });
    const notifBtn = container.querySelector(
      "button.top-bar-button.notification-button",
    );
    expect(screen.queryByText("Test notification")).toBeNull();
    fireEvent.click(notifBtn);
    expect(screen.getByText("Test notification")).toBeInTheDocument();
  });

  test("closes notifications dropdown when clicking outside", () => {
    const notifications = [
      { id: 1, read: false, message: "Test notification" },
    ];
    renderWithContext(
      <TopBar
        buttons={buttons}
        openModal={dummyOpenModal}
        navigate={dummyNavigate}
        activeChartType={null}
      />,
      { notifications },
    );
    const container = screen.getByText((content, node) => {
      return (
        node.classList && node.classList.contains("notifications-container")
      );
    });
    const notifBtn = container.querySelector(
      "button.top-bar-button.notification-button",
    );
    fireEvent.click(notifBtn);
    expect(screen.getByText("Test notification")).toBeInTheDocument();
    fireEvent.mouseDown(document);
    expect(screen.queryByText("Test notification")).toBeNull();
  });
});
