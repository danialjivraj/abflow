const TaskLabels = ({ labels, hideLabelText, truncateLength }) => {
  if (!labels || labels.length === 0) return null;

  return (
    <div className="task-labels">
      {labels.map((label, idx) => {
        const titleText = label.title || "";
        const labelClass = hideLabelText ? "hidden-label" : "shown-label";

        if (hideLabelText) {
          return (
            <span
              key={idx}
              className={labelClass}
              style={{ backgroundColor: label.color }}
            />
          );
        }

        const shouldTruncate =
          truncateLength && titleText.length > truncateLength;
        const displayedTitle = shouldTruncate
          ? titleText.slice(0, truncateLength) + "..."
          : titleText;

        return (
          <span
            key={idx}
            className={labelClass}
            style={{ backgroundColor: label.color }}
            title={titleText}
          >
            {displayedTitle}
          </span>
        );
      })}
    </div>
  );
};

export default TaskLabels;
