const getLabelVariant = (labelTitle) => {
  const variants = [
    "circle",
    "triangle",
    "square",
    "diagonal-lines",
    "zigzag",
    "cross",
    "star",
    "wavy-line",
    "plus",
    "dots",
  ];
  const hash = Array.from(labelTitle).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0,
  );
  return variants[hash % variants.length];
};

const generatePattern = (variant) => {
  let svg;
  switch (variant) {
    case "circle":
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12">
        <circle cx="6" cy="6" r="3" fill="rgba(0,0,0,0.5)" />
      </svg>`;
      break;
    case "triangle":
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12">
        <polygon points="6,1 11,8 1,8" fill="rgba(0,0,0,0.5)" />
      </svg>`;
      break;
    case "square":
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12">
        <rect x="3" y="3" width="6" height="6" fill="rgba(0,0,0,0.5)" />
      </svg>`;
      break;
    case "diagonal-lines":
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12">
        <defs>
          <pattern id="lines" patternUnits="userSpaceOnUse" width="4" height="4">
            <path d="M0 4 L4 0" stroke="rgba(0,0,0,0.5)" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="12" height="12" fill="url(#lines)" />
      </svg>`;
      break;
    case "zigzag":
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="9">
        <polyline points="0,4 3,0 6,4 9,0 12,4" fill="none" stroke="rgba(0,0,0,0.5)" stroke-width="1" />
        <polyline points="0,8 3,4 6,8 9,4 12,8" fill="none" stroke="rgba(0,0,0,0.5)" stroke-width="1" />
      </svg>`;
      break;
    case "cross":
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12">
        <line x1="3" y1="3" x2="9" y2="9" stroke="rgba(0,0,0,0.5)" stroke-width="1"/>
        <line x1="9" y1="3" x2="3" y2="9" stroke="rgba(0,0,0,0.5)" stroke-width="1"/>
      </svg>`;
      break;
    case "star":
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12">
        <polygon points="6,1 7,5 11,5 8,7 9,11 6,9 3,11 4,7 1,5 5,5" fill="rgba(0,0,0,0.5)" />
      </svg>`;
      break;
    case "wavy-line":
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12">
        <path d="M0,6 C3,2 9,10 12,6" stroke="rgba(0,0,0,0.5)" stroke-width="1" fill="none"/>
      </svg>`;
      break;
    case "plus":
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12">
        <line x1="6" y1="2" x2="6" y2="10" stroke="rgba(0,0,0,0.5)" stroke-width="1"/>
        <line x1="2" y1="6" x2="10" y2="6" stroke="rgba(0,0,0,0.5)" stroke-width="1"/>
      </svg>`;
      break;
    case "dots":
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12">
        <circle cx="3" cy="3" r="1" fill="rgba(0,0,0,0.5)" />
        <circle cx="9" cy="3" r="1" fill="rgba(0,0,0,0.5)" />
        <circle cx="3" cy="9" r="1" fill="rgba(0,0,0,0.5)" />
        <circle cx="9" cy="9" r="1" fill="rgba(0,0,0,0.5)" />
      </svg>`;
      break;
    default:
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12">
        <circle cx="6" cy="6" r="3" fill="rgba(0,0,0,0.5)" />
      </svg>`;
  }
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};

export { getLabelVariant, generatePattern };

const TaskLabels = ({
  labels,
  hideLabelText,
  truncateLength,
  colorblindMode,
}) => {
  if (!labels || labels.length === 0) return null;

  return (
    <div className="task-labels">
      {labels.map((label, idx) => {
        const titleText = label.title || "";
        let labelClass = hideLabelText ? "hidden-label" : "shown-label";
        let customStyle = {};
        if (colorblindMode) {
          labelClass += " colorblind-label";
          const variant = getLabelVariant(titleText);
          customStyle["--pattern-image"] = generatePattern(variant);
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
            style={{ backgroundColor: label.color, ...customStyle }}
            title={titleText}
          >
            {hideLabelText ? null : displayedTitle}
          </span>
        );
      })}
    </div>
  );
};

export default TaskLabels;
