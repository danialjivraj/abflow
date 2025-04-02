import { render, screen } from "@testing-library/react";
import TaskLabels from "../../../src/components/boardComponents/TaskLabels";

describe("TaskLabels", () => {
  it("returns null if labels prop is not provided", () => {
    const { container } = render(<TaskLabels />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null if labels prop is an empty array", () => {
    const { container } = render(<TaskLabels labels={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders labels with text when hideLabelText is false", () => {
    const labels = [
      { title: "Important", color: "#ff0000" },
      { title: "Optional", color: "#00ff00" },
    ];
    render(<TaskLabels labels={labels} hideLabelText={false} />);

    expect(screen.getByText("Important")).toBeInTheDocument();
    expect(screen.getByText("Optional")).toBeInTheDocument();

    const importantSpan = screen.getByText("Important");
    expect(importantSpan).toHaveStyle({ backgroundColor: "#ff0000" });
  });

  it("renders labels without text when hideLabelText is true", () => {
    const labels = [
      { title: "Important", color: "#ff0000" },
      { title: "Optional", color: "#00ff00" },
    ];
    const { container } = render(
      <TaskLabels labels={labels} hideLabelText={true} />,
    );
    const spans = container.querySelectorAll("span");
    expect(spans.length).toBe(2);
    spans.forEach((span) => {
      expect(span.textContent).toBe("");
    });
  });

  it("renders truncated label text when truncateLength is provided and title is too long", () => {
    const labels = [{ title: "SuperImportant", color: "#ff0000" }];
    render(
      <TaskLabels labels={labels} hideLabelText={false} truncateLength={5} />,
    );
    expect(screen.getByText("Super...")).toBeInTheDocument();
  });

  it("renders full label text when truncateLength is provided but title is within limit", () => {
    const labels = [{ title: "Short", color: "#ff0000" }];
    render(
      <TaskLabels labels={labels} hideLabelText={false} truncateLength={10} />,
    );
    expect(screen.getByText("Short")).toBeInTheDocument();
  });

  it("sets the title attribute to the full label title", () => {
    const labels = [{ title: "Very Important Label", color: "#ff0000" }];
    render(
      <TaskLabels labels={labels} hideLabelText={false} truncateLength={5} />,
    );
    const span = screen.getByText("Very ...");
    expect(span).toHaveAttribute("title", "Very Important Label");
  });
});
