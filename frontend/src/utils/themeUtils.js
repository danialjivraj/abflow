export const updateAccentColor = (themeAccent) => {
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
      default: // Green (default)
        accentColor = "#4CAF50";
        headingColor = "#4CAF50";
    }
    document.documentElement.style.setProperty("--sidebar-active-bg", accentColor);
    document.documentElement.style.setProperty("--sidebar-heading-color", headingColor);
  };
  
  export const updateTopbarAccentColor = (topbarAccent) => {
    let activeTextColor, createBtnBg, createTaskBtnHover;
    switch (topbarAccent) {
      case "Red":
        activeTextColor = "#dc3545";
        createBtnBg = "#dc3545";
        createTaskBtnHover = "#c82333";
        break;
      case "Purple":
        activeTextColor = "#6f42c1";
        createBtnBg = "#6f42c1";
        createTaskBtnHover = "#5a32a3";
        break;
      case "Black":
        activeTextColor = "#343a40";
        createBtnBg = "#343a40";
        createTaskBtnHover = "#2c2f33";
        break;
      default: // Blue (default)
        activeTextColor = "#007bff";
        createBtnBg = "#007bff";
        createTaskBtnHover = "#0056b3";
    }
    document.documentElement.style.setProperty("--topbar-active-button-color", activeTextColor);
    document.documentElement.style.setProperty("--create-top-bar-btn-bg", createBtnBg);
    document.documentElement.style.setProperty("--create-task-btn-bg", createBtnBg);
    document.documentElement.style.setProperty("--create-task-btn-hover", createTaskBtnHover);
  };
  