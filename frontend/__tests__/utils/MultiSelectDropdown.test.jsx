import React from "react";
import { render, fireEvent, screen } from "@testing-library/react";
import MultiSelectDropdown from "../../src/utils/MultiSelectDropdown";

describe("MultiSelectDropdown", () => {
  const options = [
    { value: "A1", label: "A1" },
    { value: "A2", label: "A2" },
    { value: "A3", label: "A3" },
  ];

  test("renders fallback text 'All' when no options are selected", () => {
    render(
      <MultiSelectDropdown
        label="Priority"
        options={options}
        selectedOptions={[]}
        onChange={() => {}}
        fallbackText="All"
      />
    );
    expect(screen.getByText("All")).toBeInTheDocument();
  });

  test("renders fallback text 'Priority' when no options are selected", () => {
    render(
      <MultiSelectDropdown
        label="Priority"
        options={options}
        selectedOptions={[]}
        onChange={() => {}}
      />
    );
    const header = screen.getByText((content, node) => {
      const hasClass = node.className && node.className.includes("dropdown-header");
      const textMatches = content === "Priority";
      return hasClass && textMatches;
    });
    expect(header).toBeInTheDocument();
  });

  test("renders custom fallback text when provided", () => {
    render(
      <MultiSelectDropdown
        label="Priority"
        options={options}
        selectedOptions={[]}
        onChange={() => {}}
        fallbackText="No Options"
      />
    );
    expect(screen.getByText("No Options")).toBeInTheDocument();
  });

  test("displays selected options when they are provided", () => {
    render(
      <MultiSelectDropdown
        label="Priority"
        options={options}
        selectedOptions={["A1", "A3"]}
        onChange={() => {}}
        fallbackText="All"
      />
    );
    expect(screen.getByText("A1, A3")).toBeInTheDocument();
  });

  test("toggles an option when clicked", () => {
    const onChange = jest.fn();
    render(
      <MultiSelectDropdown
        label="Priority"
        options={options}
        selectedOptions={[]}
        onChange={onChange}
        fallbackText="All"
      />
    );
    // Open dropdown
    fireEvent.click(screen.getByText("All"));
    const checkbox = screen.getByLabelText("A2");
    fireEvent.click(checkbox);
    expect(onChange).toHaveBeenCalledWith(["A2"]);
  });

  test("displays and clears selection with the Clear All button", () => {
    const onChange = jest.fn();
    render(
      <MultiSelectDropdown
        label="Priority"
        options={options}
        selectedOptions={["A1", "A2"]}
        onChange={onChange}
        fallbackText="All"
      />
    );
    expect(screen.getByText("A1, A2")).toBeInTheDocument();
    // Open dropdown
    fireEvent.click(screen.getByText("A1, A2"));
    const clearBtn = screen.getByText("Clear All");
    fireEvent.click(clearBtn);
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
