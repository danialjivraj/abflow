import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LogoutModal from "../../src/components/modals/LogoutModal";
import { auth } from "../../src/firebase";

jest.mock("../../src/firebase", () => ({
  auth: {
    signOut: jest.fn(),
  },
}));

describe("LogoutModal", () => {
  const onClose = jest.fn();

  beforeEach(() => {
    onClose.mockClear();
    auth.signOut.mockClear();
  });

  // =======================
  // UNIT TESTS
  // =======================
  test("does not render the modal when isOpen is false", () => {
    const { container } = render(
      <LogoutModal isOpen={false} onClose={onClose} />
    );
    expect(container.firstChild).toBeNull();
  });

  test("renders the modal when isOpen is true", () => {
    render(<LogoutModal isOpen={true} onClose={onClose} />);
    expect(screen.getByText("Confirm Logout")).toBeInTheDocument();
    expect(
      screen.getByText("Are you sure you want to log out?")
    ).toBeInTheDocument();
  });

  // =======================
  // INTEGRATION TESTS
  // =======================
  test("calls onClose when the close (X) button is clicked", () => {
    render(<LogoutModal isOpen={true} onClose={onClose} />);
    const closeButton = screen.getByText("×");
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  test("calls onClose when clicking on the overlay", () => {
    render(<LogoutModal isOpen={true} onClose={onClose} />);
    const overlay = document.querySelector(".modal-overlay");
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  test("does not call onClose when clicking inside the modal content", () => {
    render(<LogoutModal isOpen={true} onClose={onClose} />);
    const modalContent = document.querySelector(".modal-content");
    fireEvent.click(modalContent);
    expect(onClose).not.toHaveBeenCalled();
  });

  test("calls auth.signOut and onClose when Yes button is clicked", () => {
    render(<LogoutModal isOpen={true} onClose={onClose} />);
    const yesButton = screen.getByText("Yes");
    fireEvent.click(yesButton);
    expect(auth.signOut).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  test("calls onClose when No button is clicked", () => {
    render(<LogoutModal isOpen={true} onClose={onClose} />);
    const noButton = screen.getByText("No");
    fireEvent.click(noButton);
    expect(onClose).toHaveBeenCalled();
  });
});
