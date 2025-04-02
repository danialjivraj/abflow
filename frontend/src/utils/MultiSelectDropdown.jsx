import { useState, useRef, useEffect } from "react";

function MultiSelectDropdown({ label, options, selectedOptions, onChange, fallbackText }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (optionValue) => {
    if (selectedOptions.includes(optionValue)) {
      onChange(selectedOptions.filter((o) => o !== optionValue));
    } else {
      onChange([...selectedOptions, optionValue]);
    }
  };

  const selectedObjects = options.filter((opt) => selectedOptions.includes(opt.value));
  const fallback = typeof fallbackText !== "undefined" ? fallbackText : label || "All";

  return (
    <div className="multi-select-dropdown" ref={dropdownRef}>
      {label && <label>{label}</label>}
      <div
        data-testid="dropdown-header"
        className={`dropdown-header${isOpen ? " open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedObjects.length > 0 ? (
          <div className="selected-options">
            {selectedObjects.map((opt, idx) => (
              <span className="selected-option" key={idx}>
                {opt.label}
              </span>
            ))}
          </div>
        ) : (
          <span className="fallback-label">{fallback}</span>
        )}
      </div>

      {isOpen && (
        <div className="dropdown-options">
          {selectedOptions.length > 0 && (
            <button className="dropdown-clear-btn" onClick={() => onChange([])}>
              Clear All
            </button>
          )}
          {options.map((opt, index) => (
            <div key={index} className="dropdown-option">
              <label>
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(opt.value)}
                  onChange={() => toggleOption(opt.value)}
                />
                {opt.label}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MultiSelectDropdown;
