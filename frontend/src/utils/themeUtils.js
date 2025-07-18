export const updateAccentColor = (themeAccent) => {
  if (themeAccent.startsWith("#") || themeAccent.startsWith("rgb")) {
    document.documentElement.style.setProperty(
      "--sidebar-active-bg",
      themeAccent,
    );
    document.documentElement.style.setProperty(
      "--sidebar-heading-color",
      themeAccent,
    );
    return;
  }

  let accentColor, headingColor;
  switch (themeAccent) {
    case "Blue":
      accentColor = "#007bff";
      headingColor = "#007bff";
      break;
    case "Orange":
      accentColor = "#fd7e14";
      headingColor = "#fd7e14";
      break;
    case "Purple":
      accentColor = "#6f42c1";
      headingColor = "#6f42c1";
      break;
    case "Yellow":
      accentColor = "#ffc107";
      headingColor = "#ffc107";
      break;
    default: // "Green"
      accentColor = "#4CAF50";
      headingColor = "#4CAF50";
  }
  document.documentElement.style.setProperty(
    "--sidebar-active-bg",
    accentColor,
  );
  document.documentElement.style.setProperty(
    "--sidebar-heading-color",
    headingColor,
  );
};

export const updateTopbarAccentColor = (topbarAccent) => {
  if (topbarAccent.startsWith("#") || topbarAccent.startsWith("rgb")) {
    document.documentElement.style.setProperty(
      "--topbar-active-button-color",
      topbarAccent,
    );
    document.documentElement.style.setProperty(
      "--create-top-bar-btn-bg",
      topbarAccent,
    );
    document.documentElement.style.setProperty(
      "--create-task-btn-bg",
      topbarAccent,
    );
    document.documentElement.style.setProperty(
      "--create-task-btn-hover",
      topbarAccent,
    );
    return;
  }

  let activeTextColor, createBtnBg, createTaskBtnHover;
  switch (topbarAccent) {
    case "Green":
      activeTextColor = "#4CAF50";
      createBtnBg = "#4CAF50";
      createTaskBtnHover = "#45a049";
      break;
    case "Orange":
      activeTextColor = "#fd7e14";
      createBtnBg = "#fd7e14";
      createTaskBtnHover = "#e66a00";
      break;
    case "Purple":
      activeTextColor = "#6f42c1";
      createBtnBg = "#6f42c1";
      createTaskBtnHover = "#5a32a3";
      break;
    case "Yellow":
      activeTextColor = "#ffc107";
      createBtnBg = "#ffc107";
      createTaskBtnHover = "#e0a800";
      break;
    case "Blue":
      activeTextColor = "#007bff";
      createBtnBg = "#007bff";
      createTaskBtnHover = "#0056b3";
      break;
    default: // "Blue"
      activeTextColor = "#007bff";
      createBtnBg = "#007bff";
      createTaskBtnHover = "#0056b3";
      break;
  }
  document.documentElement.style.setProperty(
    "--topbar-active-button-color",
    activeTextColor,
  );
  document.documentElement.style.setProperty(
    "--create-top-bar-btn-bg",
    createBtnBg,
  );
  document.documentElement.style.setProperty(
    "--create-task-btn-bg",
    createBtnBg,
  );
  document.documentElement.style.setProperty(
    "--create-task-btn-hover",
    createTaskBtnHover,
  );
};

export const updatePriorityCSSVariables = (priorityColours) => {
  Object.keys(priorityColours).forEach((priority) => {
    document.documentElement.style.setProperty(
      `--priority-${priority}`,
      priorityColours[priority],
    );
  });
};
