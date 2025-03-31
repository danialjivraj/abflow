import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import LabelsDropdown from "../../../src/components/boardComponents/LabelsDropdown";

import { createBaseUser } from "../../../_testUtils/createBaseUser";

const dummyUser = createBaseUser({
  labels: [
    { _id: "l1", title: "Urgent", color: "#ff0000" },
    { _id: "l2", title: "Feature", color: "#00ff00" },
    { _id: "l3", title: "Bug", color: "#0000ff" },
  ],
});

const availableLabels = dummyUser.labels;
const task = {
  labels: [{ title: "Urgent", color: "#ff0000" }],
};

describe("LabelsDropdown", () => {
  const handleToggleLabel = jest.fn();
  const setIsLabelsDropdownOpen = jest.fn();
  const setIsTaskDropdownOpen = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders 'No labels available' if availableLabels is empty", () => {
    render(
      <LabelsDropdown
        task={task}
        availableLabels={[]}
        handleToggleLabel={handleToggleLabel}
        setIsLabelsDropdownOpen={setIsLabelsDropdownOpen}
        setIsTaskDropdownOpen={setIsTaskDropdownOpen}
      />
    );
    expect(screen.getByText("No labels available")).toBeInTheDocument();
  });

  it("renders attached and unattached labels with separator when both exist", () => {
    render(
      <LabelsDropdown
        task={task}
        availableLabels={availableLabels}
        handleToggleLabel={handleToggleLabel}
        setIsLabelsDropdownOpen={setIsLabelsDropdownOpen}
        setIsTaskDropdownOpen={setIsTaskDropdownOpen}
      />
    );
    expect(screen.getByText("Urgent")).toBeInTheDocument();
    expect(screen.getByText("Feature")).toBeInTheDocument();
    expect(screen.getByText("Bug")).toBeInTheDocument();
    expect(document.querySelector("hr.labels-separator")).toBeInTheDocument();
  });

  it("renders only attached labels if no unattached labels exist", () => {
    const taskAll = { labels: availableLabels };
    render(
      <LabelsDropdown
        task={taskAll}
        availableLabels={availableLabels}
        handleToggleLabel={handleToggleLabel}
        setIsLabelsDropdownOpen={setIsLabelsDropdownOpen}
        setIsTaskDropdownOpen={setIsTaskDropdownOpen}
      />
    );
    expect(screen.getByText("Urgent")).toBeInTheDocument();
    expect(screen.getByText("Feature")).toBeInTheDocument();
    expect(screen.getByText("Bug")).toBeInTheDocument();
    expect(document.querySelector("hr.labels-separator")).toBeNull();
  });

  it("renders only unattached labels if no attached labels exist", () => {
    const taskEmpty = { labels: [] };
    render(
      <LabelsDropdown
        task={taskEmpty}
        availableLabels={availableLabels}
        handleToggleLabel={handleToggleLabel}
        setIsLabelsDropdownOpen={setIsLabelsDropdownOpen}
        setIsTaskDropdownOpen={setIsTaskDropdownOpen}
      />
    );
    expect(screen.getByText("Urgent")).toBeInTheDocument();
    expect(screen.getByText("Feature")).toBeInTheDocument();
    expect(screen.getByText("Bug")).toBeInTheDocument();
    expect(document.querySelector("hr.labels-separator")).toBeNull();
  });

  it("calls callbacks when an attached label is clicked", () => {
    render(
      <LabelsDropdown
        task={task}
        availableLabels={availableLabels}
        handleToggleLabel={handleToggleLabel}
        setIsLabelsDropdownOpen={setIsLabelsDropdownOpen}
        setIsTaskDropdownOpen={setIsTaskDropdownOpen}
      />
    );
    const urgentButton = screen.getByText("Urgent").closest("button");
    fireEvent.click(urgentButton);
    expect(handleToggleLabel).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Urgent", color: "#ff0000" })
    );
    expect(setIsLabelsDropdownOpen).toHaveBeenCalledWith(false);
    expect(setIsTaskDropdownOpen).toHaveBeenCalledWith(null);
  });

  it("calls callbacks when an unattached label is clicked", () => {
    render(
      <LabelsDropdown
        task={task}
        availableLabels={availableLabels}
        handleToggleLabel={handleToggleLabel}
        setIsLabelsDropdownOpen={setIsLabelsDropdownOpen}
        setIsTaskDropdownOpen={setIsTaskDropdownOpen}
      />
    );
    const featureButton = screen.getByText("Feature").closest("button");
    fireEvent.click(featureButton);
    expect(handleToggleLabel).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Feature", color: "#00ff00" })
    );
    expect(setIsLabelsDropdownOpen).toHaveBeenCalledWith(false);
    expect(setIsTaskDropdownOpen).toHaveBeenCalledWith(null);
  });

  it("renders the separator only when both attached and unattached labels exist", () => {
    const { container, rerender } = render(
      <LabelsDropdown
        task={task}
        availableLabels={availableLabels}
        handleToggleLabel={handleToggleLabel}
        setIsLabelsDropdownOpen={setIsLabelsDropdownOpen}
        setIsTaskDropdownOpen={setIsTaskDropdownOpen}
      />
    );
    expect(container.querySelector("hr.labels-separator")).toBeInTheDocument();

    const taskAll = { labels: availableLabels };
    rerender(
      <LabelsDropdown
        task={taskAll}
        availableLabels={availableLabels}
        handleToggleLabel={handleToggleLabel}
        setIsLabelsDropdownOpen={setIsLabelsDropdownOpen}
        setIsTaskDropdownOpen={setIsTaskDropdownOpen}
      />
    );
    expect(container.querySelector("hr.labels-separator")).toBeNull();

    const taskNone = { labels: [] };
    rerender(
      <LabelsDropdown
        task={taskNone}
        availableLabels={availableLabels}
        handleToggleLabel={handleToggleLabel}
        setIsLabelsDropdownOpen={setIsLabelsDropdownOpen}
        setIsTaskDropdownOpen={setIsTaskDropdownOpen}
      />
    );
    expect(container.querySelector("hr.labels-separator")).toBeNull();
  });

  it('renders "No labels available" if availableLabels is empty', () => {
    render(
      <LabelsDropdown
        task={task}
        availableLabels={[]}
        handleToggleLabel={handleToggleLabel}
        setIsLabelsDropdownOpen={setIsLabelsDropdownOpen}
        setIsTaskDropdownOpen={setIsTaskDropdownOpen}
      />
    );
    expect(screen.getByText("No labels available")).toBeInTheDocument();
  });

  it("renders attached and unattached labels separately with separator when both exist", () => {
    const { container } = render(
      <LabelsDropdown
        task={task}
        availableLabels={availableLabels}
        handleToggleLabel={handleToggleLabel}
        setIsLabelsDropdownOpen={setIsLabelsDropdownOpen}
        setIsTaskDropdownOpen={setIsTaskDropdownOpen}
      />
    );
    expect(screen.getByText("Urgent")).toBeInTheDocument();
    expect(screen.getByText("Feature")).toBeInTheDocument();
    expect(screen.getByText("Bug")).toBeInTheDocument();
    expect(container.querySelector("hr.labels-separator")).toBeInTheDocument();
  });

  it("calls callbacks when an attached label is clicked", () => {
    render(
      <LabelsDropdown
        task={task}
        availableLabels={availableLabels}
        handleToggleLabel={handleToggleLabel}
        setIsLabelsDropdownOpen={setIsLabelsDropdownOpen}
        setIsTaskDropdownOpen={setIsTaskDropdownOpen}
      />
    );
    const attachedButton = screen.getByText("Urgent").closest("button");
    fireEvent.click(attachedButton);
    expect(handleToggleLabel).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Urgent", color: "#ff0000" })
    );
    expect(setIsLabelsDropdownOpen).toHaveBeenCalledWith(false);
    expect(setIsTaskDropdownOpen).toHaveBeenCalledWith(null);
  });

  it("calls callbacks when an unattached label is clicked", () => {
    render(
      <LabelsDropdown
        task={task}
        availableLabels={availableLabels}
        handleToggleLabel={handleToggleLabel}
        setIsLabelsDropdownOpen={setIsLabelsDropdownOpen}
        setIsTaskDropdownOpen={setIsTaskDropdownOpen}
      />
    );
    const unattachedButton = screen.getByText("Feature").closest("button");
    fireEvent.click(unattachedButton);
    expect(handleToggleLabel).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Feature", color: "#00ff00" })
    );
    expect(setIsLabelsDropdownOpen).toHaveBeenCalledWith(false);
    expect(setIsTaskDropdownOpen).toHaveBeenCalledWith(null);
  });

  it("applies scroll container style when availableLabels exceed the scrollThreshold", () => {
    const manyLabels = [
      { _id: "l1", title: "Urgent", color: "#ff0000" },
      { _id: "l2", title: "Feature", color: "#00ff00" },
      { _id: "l3", title: "Bug", color: "#0000ff" },
      { _id: "l4", title: "UI", color: "#ffff00" },
      { _id: "l5", title: "Backend", color: "#00ffff" },
      { _id: "l6", title: "Research", color: "#ff00ff" },
      { _id: "l7", title: "QA", color: "#cccccc" },
    ];

    render(
      <LabelsDropdown
        task={task}
        availableLabels={manyLabels}
        handleToggleLabel={handleToggleLabel}
        setIsLabelsDropdownOpen={setIsLabelsDropdownOpen}
        setIsTaskDropdownOpen={setIsTaskDropdownOpen}
        maxHeight="200px"
      />
    );
    const dropdownContainer = document.querySelector(".nested-dropdown-menu");
    expect(dropdownContainer).toBeInTheDocument();
    expect(dropdownContainer).toHaveStyle("max-height: 200px");
    expect(dropdownContainer).toHaveStyle("overflow-y: auto");
  });
});
