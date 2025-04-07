import { useState } from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LabelsModal from "../../src/components/modals/LabelsModal";
import { toast } from "react-toastify";
import {
  createLabel,
  updateLabel,
  deleteLabel,
  updateLabelOrder,
} from "../../src/services/labelsService";

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockOnDragEnd = jest.fn();
jest.mock("@hello-pangea/dnd", () => ({
  DragDropContext: ({ children, onDragEnd }) => {
    mockOnDragEnd.mockImplementation(onDragEnd);
    return <div>{children}</div>;
  },
  Droppable: ({ children }) => {
    return (
      <div data-testid="droppable">
        {children({ innerRef: jest.fn(), droppableProps: {} })}
      </div>
    );
  },
  Draggable: ({ children, draggableId }) => {
    return (
      <div data-testid={`draggable-${draggableId}`}>
        {children({
          innerRef: jest.fn(),
          draggableProps: {},
          dragHandleProps: {},
        })}
      </div>
    );
  },
}));
jest.mock("../../src/services/labelsService", () => ({
  createLabel: jest.fn(),
  updateLabel: jest.fn(),
  deleteLabel: jest.fn(),
  updateLabelOrder: jest.fn(() => Promise.resolve({})),
}));

const LabelsModalWrapper = ({
  initialLabels = [],
  isOpen = true,
  closeModal = jest.fn(),
}) => {
  const [labels, setLabels] = useState(initialLabels);
  return (
    <LabelsModal
      isOpen={isOpen}
      closeModal={closeModal}
      labels={labels}
      setLabels={setLabels}
      userId="user1"
    />
  );
};

// ===================
// Unit Tests
// ===================
describe("LabelsModal - Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOnDragEnd.mockReset();
  });

  describe("Editing cancellation", () => {
    const initialLabel = {
      _id: "label1",
      title: "Old Label",
      color: "#ff4d4d",
    };

    it("should cancel editing and reset edit state when Cancel is clicked", async () => {
      const { container } = render(
        <LabelsModalWrapper initialLabels={[initialLabel]} />,
      );
      const editButton = container.querySelector(".edit-btn");
      userEvent.click(editButton);

      const leftColumnHeading = container.querySelector(".add-label-column h3");
      await waitFor(() =>
        expect(leftColumnHeading.textContent).toBe("Edit Label Color"),
      );

      const cancelEditButton = screen.getByRole("button", { name: "Cancel" });
      userEvent.click(cancelEditButton);

      await waitFor(() => {
        expect(screen.queryByDisplayValue("Old Label")).toBeNull();
      });
      expect(leftColumnHeading.textContent).toBe("Add New Label");
    });
  });

  describe("Drag and Drop Reordering", () => {
    it("should update label order and call updateLabelOrder", async () => {
      const initialLabels = [
        { _id: "label1", title: "Label 1", color: "#ff4d4d", order: 0 },
        { _id: "label2", title: "Label 2", color: "#f57c00", order: 1 },
      ];
      render(<LabelsModalWrapper initialLabels={initialLabels} />);

      const result = {
        source: { index: 1, droppableId: "labels" },
        destination: { index: 0, droppableId: "labels" },
      };
      await mockOnDragEnd(result);

      await waitFor(() =>
        expect(updateLabelOrder).toHaveBeenCalledWith("user1", [
          { _id: "label2", title: "Label 2", color: "#f57c00", order: 0 },
          { _id: "label1", title: "Label 1", color: "#ff4d4d", order: 1 },
        ]),
      );
    });
  });

  describe("Modal Open/Close Behavior", () => {
    it("should not render the modal when isOpen is false", () => {
      const { container } = render(<LabelsModalWrapper isOpen={false} />);
      expect(container.firstChild).toBeNull();
    });

    it("should call closeModal when overlay is clicked", async () => {
      const closeModalMock = jest.fn();
      const { container } = render(
        <LabelsModalWrapper closeModal={closeModalMock} />,
      );
      const overlay = container.querySelector(".modal-overlay");
      userEvent.click(overlay);
      await waitFor(() => expect(closeModalMock).toHaveBeenCalled());
    });
  });

  describe("Color Picker Behavior", () => {
    it("should update active color when a preset is clicked", async () => {
      render(<LabelsModalWrapper />);
      const selectedCircleBefore = document.querySelector(
        ".color-circle.selected",
      );
      expect(selectedCircleBefore).toHaveStyle({
        backgroundColor: "rgb(211, 47, 47)",
      });

      const circles = document.querySelectorAll(".color-circle");
      userEvent.click(circles[2]);
      await waitFor(() => {
        const selectedCircleAfter = document.querySelector(
          ".color-circle.selected",
        );
        expect(selectedCircleAfter).not.toHaveStyle({
          backgroundColor: "rgb(255, 77, 77)",
        });
      });
    });

    it("should update active color when custom color is changed", async () => {
      render(<LabelsModalWrapper />);
      const input = document.querySelector(".color-input-overlay");
      fireEvent.change(input, { target: { value: "#123456" } });
      const customToggle = document.querySelector(".custom-color-toggle");
      await waitFor(() => {
        expect(customToggle).toHaveStyle({
          backgroundColor: "rgb(18, 52, 86)",
        });
      });
    });
  });
});

// ===================
// Integration Tests
// ===================
describe("LabelsModal - Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Creating a label", () => {
    it("should successfully create a label and display a success toast", async () => {
      createLabel.mockResolvedValueOnce({
        data: { _id: "label1", title: "Test Label", color: "#d32f2f" },
      });
      render(<LabelsModalWrapper />);

      const nameInput = screen.getByPlaceholderText("Label name");
      fireEvent.change(nameInput, { target: { value: "Test Label" } });
      expect(nameInput.value).toBe("Test Label");

      const addButton = screen.getByRole("button", { name: "Add Label" });
      userEvent.click(addButton);

      await waitFor(() =>
        expect(createLabel).toHaveBeenCalledWith("user1", {
          title: "Test Label",
          color: "#d32f2f",
        }),
      );
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith("Label created!"),
      );
      expect(screen.getByPlaceholderText("Label name").value).toBe("");
    });

    it("should successfully create a label when Enter is pressed", async () => {
      createLabel.mockResolvedValueOnce({
        data: { _id: "label-enter", title: "Enter Label", color: "#d32f2f" },
      });
      render(<LabelsModalWrapper />);

      const nameInput = screen.getByPlaceholderText("Label name");
      fireEvent.change(nameInput, { target: { value: "Enter Label" } });
      expect(nameInput.value).toBe("Enter Label");

      fireEvent.keyDown(nameInput, { key: "Enter", code: "Enter" });

      await waitFor(() =>
        expect(createLabel).toHaveBeenCalledWith("user1", {
          title: "Enter Label",
          color: "#d32f2f",
        }),
      );
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith("Label created!"),
      );
      expect(screen.getByPlaceholderText("Label name").value).toBe("");
    });

    it("should fail to create a label and display an error toast", async () => {
      createLabel.mockRejectedValueOnce(new Error("Creation failed"));
      render(<LabelsModalWrapper />);

      const nameInput = screen.getByPlaceholderText("Label name");
      fireEvent.change(nameInput, { target: { value: "Test Label" } });
      expect(nameInput.value).toBe("Test Label");

      const addButton = screen.getByRole("button", { name: "Add Label" });
      userEvent.click(addButton);

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith("Error creating label!"),
      );
    });

    it("should display error message when trying to create a label with empty field", async () => {
      createLabel.mockRejectedValueOnce({
        response: { data: { error: "Field cannot be empty." } },
      });

      render(<LabelsModalWrapper />);

      const nameInput = screen.getByPlaceholderText("Label name");
      expect(nameInput.value).toBe("");

      const addButton = screen.getByRole("button", { name: "Add Label" });
      userEvent.click(addButton);

      const errorMessage = await screen.findByText("Field cannot be empty.");
      expect(errorMessage).toBeInTheDocument();
    });

    it("should display inline error when duplicate label error occurs on creation", async () => {
      createLabel.mockRejectedValueOnce({
        response: { data: { error: "Label already exists" } },
      });
      render(<LabelsModalWrapper />);

      const nameInput = screen.getByPlaceholderText("Label name");
      fireEvent.change(nameInput, { target: { value: "Duplicate Label" } });
      userEvent.click(screen.getByRole("button", { name: "Add Label" }));

      const errorMessage = await screen.findByText("Label already exists");
      expect(errorMessage).toBeInTheDocument();
    });
  });

  describe("Editing a label", () => {
    const initialLabel = {
      _id: "label1",
      title: "Old Label",
      color: "#ff4d4d",
    };

    it("should successfully update a label and display a success toast", async () => {
      updateLabel.mockResolvedValueOnce({
        data: { _id: "label1", title: "Updated Label", color: "#f57c00" },
      });
      const { container } = render(
        <LabelsModalWrapper initialLabels={[initialLabel]} />,
      );

      const editButton = container.querySelector(".edit-btn");
      userEvent.click(editButton);

      const inlineInput = await screen.findByDisplayValue("Old Label");
      fireEvent.change(inlineInput, { target: { value: "Updated Label" } });
      expect(inlineInput.value).toBe("Updated Label");

      const circles = container.querySelectorAll(".color-circle");
      userEvent.click(circles[1]);

      const saveButton = screen.getByRole("button", { name: "Save" });
      userEvent.click(saveButton);

      await waitFor(() =>
        expect(updateLabel).toHaveBeenCalledWith("user1", "label1", {
          title: "Updated Label",
          color: "#f57c00",
        }),
      );
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith("Label updated!"),
      );
    });

    it("should successfully update a label when pressing Enter while editing", async () => {
      updateLabel.mockResolvedValueOnce({
        data: {
          _id: "label1",
          title: "Updated Label via Enter",
          color: "#ff4d4d",
        },
      });
      const initialLabel = {
        _id: "label1",
        title: "Old Label",
        color: "#ff4d4d",
      };

      const { container } = render(
        <LabelsModalWrapper initialLabels={[initialLabel]} />,
      );

      const editButton = container.querySelector(".edit-btn");
      userEvent.click(editButton);

      const inlineInput = await screen.findByDisplayValue("Old Label");
      fireEvent.change(inlineInput, {
        target: { value: "Updated Label via Enter" },
      });
      expect(inlineInput.value).toBe("Updated Label via Enter");

      fireEvent.keyDown(inlineInput, { key: "Enter", code: "Enter" });

      await waitFor(() =>
        expect(updateLabel).toHaveBeenCalledWith("user1", "label1", {
          title: "Updated Label via Enter",
          color: "#ff4d4d",
        }),
      );

      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith("Label updated!"),
      );
    });

    it("should display inline duplicate error when updating a label and clear it on typing", async () => {
      updateLabel.mockRejectedValueOnce({
        response: { data: { error: "Label already exists" } },
      });
      const { container } = render(
        <LabelsModalWrapper initialLabels={[initialLabel]} />,
      );

      const editButton = container.querySelector(".edit-btn");
      userEvent.click(editButton);

      const inlineInput = await screen.findByDisplayValue("Old Label");
      fireEvent.change(inlineInput, { target: { value: "Duplicate Label" } });
      const saveButton = screen.getByRole("button", { name: "Save" });
      userEvent.click(saveButton);

      const errorMessage = await screen.findByText("Label already exists");
      expect(errorMessage).toBeInTheDocument();

      fireEvent.change(inlineInput, { target: { value: "Another Label" } });
      await waitFor(() =>
        expect(screen.queryByText("Label already exists")).toBeNull(),
      );
    });

    it("should fail to update a label and display a toast error when error is not duplicate", async () => {
      updateLabel.mockRejectedValueOnce(new Error("Update failed"));
      const { container } = render(
        <LabelsModalWrapper initialLabels={[initialLabel]} />,
      );

      const editButton = container.querySelector(".edit-btn");
      userEvent.click(editButton);

      const inlineInput = await screen.findByDisplayValue("Old Label");
      fireEvent.change(inlineInput, { target: { value: "Updated Label" } });
      expect(inlineInput.value).toBe("Updated Label");

      const saveButton = screen.getByRole("button", { name: "Save" });
      userEvent.click(saveButton);

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith("Error updating label!"),
      );
    });
  });

  describe("Deleting a label", () => {
    const initialLabel = {
      _id: "label1",
      title: "Label to Delete",
      color: "#d32f2f",
    };

    it("should successfully delete a label and display a success toast", async () => {
      deleteLabel.mockResolvedValueOnce({});
      const { container } = render(
        <LabelsModalWrapper initialLabels={[initialLabel]} />,
      );

      const deleteButton = container.querySelector(".delete-btn");
      userEvent.click(deleteButton);

      await waitFor(() =>
        expect(deleteLabel).toHaveBeenCalledWith("user1", "label1"),
      );
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith("Label deleted!"),
      );
    });

    it("should fail to delete a label and display an error toast", async () => {
      deleteLabel.mockRejectedValueOnce(new Error("Delete failed"));
      const { container } = render(
        <LabelsModalWrapper initialLabels={[initialLabel]} />,
      );

      const deleteButton = container.querySelector(".delete-btn");
      userEvent.click(deleteButton);

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith("Error deleting label!"),
      );
    });
  });
});
