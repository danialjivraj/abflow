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
    let topbarColor;
    switch (topbarAccent) {
      case "Red":
        topbarColor = "#dc3545";
        break;
      case "Purple":
        topbarColor = "#6f42c1";
        break;
      case "Black":
        topbarColor = "#343a40";
        break;
      default:
        topbarColor = "#007bff";
    }
    document.documentElement.style.setProperty("--topbar-bg", topbarColor);
  };
  