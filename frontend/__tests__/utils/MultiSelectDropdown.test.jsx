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
  
    const allPriorityTextElements = screen.getAllByText("Priority");
  
    const fallback = allPriorityTextElements.find(
      (el) => el.className.includes("fallback-label")
    );
  
    expect(fallback).toBeInTheDocument();
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

    const selectedOption1 = screen.getByText("A1");
    const selectedOption2 = screen.getByText("A3");

    expect(selectedOption1).toBeInTheDocument();
    expect(selectedOption2).toBeInTheDocument();
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

    fireEvent.click(screen.getByTestId("dropdown-header"));
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

    fireEvent.click(screen.getByTestId("dropdown-header"));
    fireEvent.click(screen.getByText("Clear All"));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  describe("MultiSelectDropdown - Label Filter with Colors", () => {
    const labelOptions = [
      {
        value: "Bug",
        label: (
          <div className="label-option-wrapper">
            <span
              data-testid="color-box"
              className="label-color-box"
              style={{ backgroundColor: "#ff0000" }}
            />
            <span>Bug</span>
          </div>
        ),
      },
      {
        value: "Feature",
        label: (
          <div className="label-option-wrapper">
            <span
              data-testid="color-box"
              className="label-color-box"
              style={{ backgroundColor: "#00ff00" }}
            />
            <span>Feature</span>
          </div>
        ),
      },
    ];

    test("renders fallback text 'Labels' when nothing is selected", () => {
      render(
        <MultiSelectDropdown
          label="Labels"
          options={labelOptions}
          selectedOptions={[]}
          onChange={() => {}}
        />
      );
      const fallbackLabels = screen.getAllByText("Labels");
      expect(fallbackLabels.length).toBeGreaterThan(0);
      expect(fallbackLabels.some(el => el.className.includes("fallback-label"))).toBe(true);
    });

    test("renders selected custom JSX label with color box", () => {
      render(
        <MultiSelectDropdown
          label="Labels"
          options={labelOptions}
          selectedOptions={["Bug"]}
          onChange={() => {}}
        />
      );
      expect(screen.getByText("Bug")).toBeInTheDocument();
      expect(screen.getByTestId("color-box")).toBeInTheDocument();
    });

    test("opens dropdown and toggles label selection", () => {
      const onChange = jest.fn();
      render(
        <MultiSelectDropdown
          label="Labels"
          options={labelOptions}
          selectedOptions={[]}
          onChange={onChange}
        />
      );

      fireEvent.click(screen.getByTestId("dropdown-header"));
      const checkbox = screen.getByLabelText("Bug");
      fireEvent.click(checkbox);
      expect(onChange).toHaveBeenCalledWith(["Bug"]);
    });

    test("clears all selected labels using Clear All button", () => {
      const onChange = jest.fn();
      render(
        <MultiSelectDropdown
          label="Labels"
          options={labelOptions}
          selectedOptions={["Bug", "Feature"]}
          onChange={onChange}
        />
      );

      fireEvent.click(screen.getByTestId("dropdown-header"));
      fireEvent.click(screen.getByText("Clear All"));
      expect(onChange).toHaveBeenCalledWith([]);
    });
  });
});
