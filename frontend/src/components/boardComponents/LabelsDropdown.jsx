const LabelsDropdown = ({
  task,
  availableLabels,
  handleToggleLabel,
  setIsLabelsDropdownOpen,
  setIsTaskDropdownOpen,
  maxHeight = "200px",
}) => {
  const attachedLabels = availableLabels.filter((lbl) =>
    task.labels.some((l) => l.title === lbl.title && l.color === lbl.color)
  );

  const unattachedLabels = availableLabels.filter(
    (lbl) =>
      !task.labels.some((l) => l.title === lbl.title && l.color === lbl.color)
  );

  const containerStyle = { maxHeight, overflowY: "auto" };

  return (
    <div className="nested-dropdown-menu" style={containerStyle}>
      {attachedLabels.length > 0 &&
        attachedLabels.map((label) => (
          <button
            key={label._id || label.title}
            onClick={(ev) => {
              ev.stopPropagation();
              handleToggleLabel(label);
              setIsLabelsDropdownOpen(false);
              setIsTaskDropdownOpen(null);
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <span
                  className="label-color-box"
                  style={{ backgroundColor: label.color }}
                />
                <span>{label.title}</span>
              </div>
              <div className="label-remove-x">x</div>
            </div>
          </button>
        ))}

      {attachedLabels.length > 0 && unattachedLabels.length > 0 && (
        <hr className="labels-separator" />
      )}

      {unattachedLabels.length > 0 &&
        unattachedLabels.map((label) => (
          <button
            key={label._id || label.title}
            onClick={(ev) => {
              ev.stopPropagation();
              handleToggleLabel(label);
              setIsLabelsDropdownOpen(false);
              setIsTaskDropdownOpen(null);
            }}
          >
            <div style={{ display: "flex" }}>
              <span
                className="label-color-box"
                style={{ backgroundColor: label.color }}
              />
              <span>{label.title}</span>
            </div>
          </button>
        ))}

      {availableLabels.length === 0 && <div>No labels available</div>}
    </div>
  );
};

export default LabelsDropdown;
