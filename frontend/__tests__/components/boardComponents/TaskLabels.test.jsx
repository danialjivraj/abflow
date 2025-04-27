import { render, screen } from "@testing-library/react";
import TaskLabels, {
  getLabelVariant,
  generatePattern,
} from "../../../src/components/boardComponents/TaskLabels";

describe("TaskLabels", () => {
  it("returns null if labels prop is not provided", () => {
    const { container } = render(<TaskLabels />);
    expect(container.firstChild).toBeNull();
  });

  it("returns null if labels prop is an empty array", () => {
    const { container } = render(<TaskLabels labels={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders labels with text when hideLabelText is false and colorblindMode is false", () => {
    const labels = [
      { title: "Important", color: "#ff0000" },
      { title: "Optional", color: "#00ff00" },
    ];
    render(
      <TaskLabels
        labels={labels}
        hideLabelText={false}
        colorblindMode={false}
      />,
    );

    expect(screen.getByText("Important")).toBeInTheDocument();
    expect(screen.getByText("Optional")).toBeInTheDocument();

    const importantSpan = screen.getByText("Important");
    expect(importantSpan).toHaveStyle({ backgroundColor: "#ff0000" });
    expect(importantSpan.className).not.toContain("colorblind-label");
    expect(importantSpan.style.getPropertyValue("--pattern-image")).toBe("");
  });

  it("renders labels without text when hideLabelText is true and colorblindMode is false", () => {
    const labels = [
      { title: "Important", color: "#ff0000" },
      { title: "Optional", color: "#00ff00" },
    ];
    const { container } = render(
      <TaskLabels
        labels={labels}
        hideLabelText={true}
        colorblindMode={false}
      />,
    );
    const spans = container.querySelectorAll("span");
    expect(spans.length).toBe(2);
    spans.forEach((span) => {
      expect(span.textContent).toBe("");
      expect(span.className).not.toContain("colorblind-label");
    });
  });

  it("renders labels with colorblind styling when colorblindMode is true and hideLabelText is false", () => {
    const labels = [
      { title: "Important", color: "#ff0000" },
      { title: "Optional", color: "#00ff00" },
    ];
    render(
      <TaskLabels
        labels={labels}
        hideLabelText={false}
        colorblindMode={true}
      />,
    );

    const importantSpan = screen.getByText("Important");
    expect(importantSpan.className).toContain("colorblind-label");
    const expectedPattern = generatePattern(getLabelVariant("Important"));
    expect(importantSpan.style.getPropertyValue("--pattern-image")).toBe(
      expectedPattern,
    );
  });

  it("renders labels with colorblind styling when colorblindMode is true and hideLabelText is true", () => {
    const labels = [{ title: "Important", color: "#ff0000" }];
    const { container } = render(
      <TaskLabels labels={labels} hideLabelText={true} colorblindMode={true} />,
    );
    const span = container.querySelector("span");
    expect(span.className).toContain("colorblind-label");
    expect(span.textContent).toBe("");
    const expectedPattern = generatePattern(getLabelVariant("Important"));
    expect(span.style.getPropertyValue("--pattern-image")).toBe(
      expectedPattern,
    );
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

  it("generates correct pattern variants based on label title", () => {
    const titles = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"];
    titles.forEach((title) => {
      const variant = getLabelVariant(title);
      const pattern = generatePattern(variant);
      expect(pattern.startsWith('url("data:image/svg+xml,')).toBe(true);
    });
  });

  it("handles a label with an empty title gracefully in colorblind mode", () => {
    const labels = [{ title: "", color: "#123456" }];
    const { container } = render(
      <TaskLabels
        labels={labels}
        hideLabelText={false}
        colorblindMode={true}
      />,
    );
    const span = container.querySelector("span");
    expect(
      span.style
        .getPropertyValue("--pattern-image")
        .startsWith('url("data:image/svg+xml,'),
    ).toBe(true);
    expect(span).toHaveAttribute("title", "");
  });
});
