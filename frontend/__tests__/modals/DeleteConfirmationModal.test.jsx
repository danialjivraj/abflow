import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import DeleteConfirmationModal from "../../src/components/Modals/DeleteConfirmationModal";

describe("DeleteConfirmationModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    entityType: "task",
    entityName: "Test Task",
    hasTasks: false,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  // =======================
  // UNIT TESTS
  // =======================
  describe("Unit Tests", () => {
    // General Rendering Tests
    test("does not render when isOpen is false", () => {
      const { container } = render(
        <DeleteConfirmationModal {...defaultProps} isOpen={false} />
      );
      expect(container.firstChild).toBeNull();
    });

    test("renders the modal when isOpen is true", () => {
      render(<DeleteConfirmationModal {...defaultProps} />);
      expect(screen.getByText("Confirm Deletion")).toBeInTheDocument();
    });

    // Message Display Tests
    test("displays correct message for task deletion", () => {
      const expectedMessage =
        'Are you sure you want to delete the task:<br>"Test Task"?';
      const { container } = render(
        <DeleteConfirmationModal
          {...defaultProps}
          entityType="task"
          entityName="Test Task"
        />
      );
      const messageElement = container.querySelector(
        ".delete-confirmation-text"
      );
      expect(messageElement.innerHTML).toBe(expectedMessage);
    });

    test("displays correct message for column deletion without tasks", () => {
      const expectedMessage =
        'Are you sure you want to delete the board:<br>"Test Board"?';
      const { container } = render(
        <DeleteConfirmationModal
          {...defaultProps}
          entityType="column"
          entityName="Test Board"
          hasTasks={false}
        />
      );
      const messageElement = container.querySelector(
        ".delete-confirmation-text"
      );
      expect(messageElement.innerHTML).toBe(expectedMessage);
    });

    test("displays correct message for column deletion with tasks", () => {
      const expectedMessage =
        'Are you sure you want to delete the board:<br>"Test Board"?<br><br>All tasks inside will also be deleted!';
      const { container } = render(
        <DeleteConfirmationModal
          {...defaultProps}
          entityType="column"
          entityName="Test Board"
          hasTasks={true}
        />
      );
      const messageElement = container.querySelector(
        ".delete-confirmation-text"
      );
      expect(messageElement.innerHTML).toBe(expectedMessage);
    });
  });

  // =======================
  // INTEGRATION TESTS
  // =======================
  describe("Integration Tests", () => {
    // Overlay and Close Button Tests
    test("calls onClose when clicking on the overlay", () => {
      const { container } = render(
        <DeleteConfirmationModal {...defaultProps} />
      );
      const overlay = container.querySelector(".modal-overlay");
      fireEvent.click(overlay);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    test("calls onClose when the close (×) button is clicked", () => {
      render(<DeleteConfirmationModal {...defaultProps} />);
      const closeButton = screen.getByText("×");
      fireEvent.click(closeButton);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    test("calls onClose when the No button is clicked", () => {
      render(<DeleteConfirmationModal {...defaultProps} />);
      const noButton = screen.getByText("No");
      fireEvent.click(noButton);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    test("calls onConfirm when the Yes button is clicked", () => {
      render(<DeleteConfirmationModal {...defaultProps} />);
      const yesButton = screen.getByText("Yes");
      fireEvent.click(yesButton);
      expect(defaultProps.onConfirm).toHaveBeenCalled();
    });

    test("does not call onClose when clicking inside modal content", () => {
      render(<DeleteConfirmationModal {...defaultProps} />);
      const modalContent = screen.getByText("Confirm Deletion").parentElement;
      fireEvent.click(modalContent);
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });
});
