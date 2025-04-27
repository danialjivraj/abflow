import { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaAngleDoubleLeft, FaAngleDoubleRight, FaTimes } from "react-icons/fa";
import MultiSelectDropdown from "../../utils/MultiSelectDropdown";

const FilterBar = ({
  filters,
  setFilters,
  showTimer = true,
  rangeFilter = false,
  showCalendar = true,
  availableLabels = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [timerDropdownOpen, setTimerDropdownOpen] = useState(false);
  const [calendarDropdownOpen, setCalendarDropdownOpen] = useState(false);
  const [dueStatusDropdownOpen, setDueStatusDropdownOpen] = useState(false);

  const timerDropdownRef = useRef(null);
  const calendarDropdownRef = useRef(null);
  const dueStatusDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        timerDropdownRef.current &&
        !timerDropdownRef.current.contains(event.target)
      ) {
        setTimerDropdownOpen(false);
      }
      if (
        calendarDropdownRef.current &&
        !calendarDropdownRef.current.contains(event.target)
      ) {
        setCalendarDropdownOpen(false);
      }
      if (
        dueStatusDropdownRef.current &&
        !dueStatusDropdownRef.current.contains(event.target)
      ) {
        setDueStatusDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "storyPoints") {
      const newValue = Math.max(0, Number(value));
      setFilters({ ...filters, [name]: newValue });
    } else {
      setFilters({ ...filters, [name]: value });
    }
  };

  const updateFilter = (name, value) => {
    setFilters({ ...filters, [name]: value });
  };

  const clearAllFilters = () => {
    setFilters({
      taskName: "",
      priority: [],
      labels: [],
      assignedTo: "",
      storyPoints: "",
      timerRunning: null,
      today: null,
      dueStatus: null,
      startDate: null,
      endDate: null,
    });
  };

  const isDefaultFilters =
    filters.taskName === "" &&
    filters.priority.length === 0 &&
    filters.labels?.length === 0 &&
    filters.assignedTo === "" &&
    filters.storyPoints === "" &&
    filters.timerRunning === null &&
    filters.today === null &&
    filters.dueStatus === null &&
    filters.startDate === null &&
    filters.endDate === null;

  return (
    <div className="filter-bar-container">
      <button
        data-testid="filter-toggle-btn"
        className="filter-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <FaAngleDoubleLeft size={12} />
        ) : (
          <FaAngleDoubleRight size={12} />
        )}
      </button>

      {isOpen && (
        <div className="filters-container">
          {/* Task Field */}
          <div className="clearable-input-container">
            <input
              type="text"
              name="taskName"
              placeholder="Task"
              value={filters.taskName || ""}
              onChange={handleInputChange}
              className="filter-input"
            />
            {filters.taskName && (
              <button
                data-testid="clear-task-btn"
                className="clear-input-button"
                aria-label="Clear Task Name"
                onClick={() => updateFilter("taskName", "")}
              >
                <FaTimes size={10} />
              </button>
            )}
          </div>

          {/* Priority MultiSelectDropdown */}
          <MultiSelectDropdown
            label="Priority"
            options={[
              { value: "A1", label: "A1" },
              { value: "A2", label: "A2" },
              { value: "A3", label: "A3" },
              { value: "B1", label: "B1" },
              { value: "B2", label: "B2" },
              { value: "B3", label: "B3" },
              { value: "C1", label: "C1" },
              { value: "C2", label: "C2" },
              { value: "C3", label: "C3" },
              { value: "D", label: "D" },
              { value: "E", label: "E" },
            ]}
            selectedOptions={filters.priority}
            onChange={(newSelectedArray) =>
              setFilters((prev) => ({ ...prev, priority: newSelectedArray }))
            }
          />

          <MultiSelectDropdown
            label="Labels"
            options={availableLabels.map((label) => ({
              value: label.title,
              label: (
                <div className="label-option-wrapper">
                  <span
                    className="label-color-box"
                    style={{ backgroundColor: label.color }}
                  />
                  <span>{label.title}</span>
                </div>
              ),
            }))}
            selectedOptions={filters.labels || []}
            onChange={(newSelectedLabels) =>
              setFilters((prev) => ({ ...prev, labels: newSelectedLabels }))
            }
          />

          {/* Assignee Field */}
          <div className="clearable-input-container">
            <input
              type="text"
              name="assignedTo"
              placeholder="Assignee"
              value={filters.assignedTo || ""}
              onChange={handleInputChange}
              className="filter-input"
            />
            {filters.assignedTo && (
              <button
                data-testid="clear-assignee-btn"
                className="clear-input-button"
                aria-label="Clear Assignee"
                onClick={() => updateFilter("assignedTo", "")}
              >
                <FaTimes size={10} />
              </button>
            )}
          </div>

          {/* Story Points Field */}
          <input
            type="number"
            name="storyPoints"
            placeholder="Points"
            value={filters.storyPoints || ""}
            onChange={handleInputChange}
            className="filter-input"
          />

          {showTimer && (
            <div className="filter-dropdown" ref={timerDropdownRef}>
              <div
                className={`filter-tag ${
                  filters.timerRunning !== null ? "filtered" : ""
                }`}
                onClick={() => setTimerDropdownOpen(!timerDropdownOpen)}
              >
                {filters.timerRunning === true
                  ? "Timer: On"
                  : filters.timerRunning === false
                    ? "Timer: Off"
                    : "Timer"}
              </div>
              {timerDropdownOpen && (
                <div className="filter-dropdown-options">
                  <button
                    className="filter-dropdown-btn"
                    onClick={() => {
                      updateFilter("timerRunning", null);
                      setTimerDropdownOpen(false);
                    }}
                  >
                    All
                  </button>
                  <button
                    className="filter-dropdown-btn"
                    onClick={() => {
                      updateFilter("timerRunning", true);
                      setTimerDropdownOpen(false);
                    }}
                  >
                    Running
                  </button>
                  <button
                    className="filter-dropdown-btn"
                    onClick={() => {
                      updateFilter("timerRunning", false);
                      setTimerDropdownOpen(false);
                    }}
                  >
                    Stopped
                  </button>
                </div>
              )}
            </div>
          )}

          {showCalendar && (
            <div className="filter-dropdown" ref={calendarDropdownRef}>
              <div
                className={`filter-tag ${
                  filters.today !== null ? "filtered" : ""
                }`}
                onClick={() => setCalendarDropdownOpen(!calendarDropdownOpen)}
              >
                {filters.today === true
                  ? "Calendar: Today"
                  : filters.today === false
                    ? "Calendar: Not Today"
                    : "Calendar"}
              </div>
              {calendarDropdownOpen && (
                <div className="filter-dropdown-options">
                  <button
                    className="filter-dropdown-btn"
                    onClick={() => {
                      updateFilter("today", null);
                      setCalendarDropdownOpen(false);
                    }}
                  >
                    All
                  </button>
                  <button
                    className="filter-dropdown-btn"
                    onClick={() => {
                      updateFilter("today", true);
                      setCalendarDropdownOpen(false);
                    }}
                  >
                    Today
                  </button>
                  <button
                    className="filter-dropdown-btn"
                    onClick={() => {
                      updateFilter("today", false);
                      setCalendarDropdownOpen(false);
                    }}
                  >
                    Not Today
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="filter-dropdown" ref={dueStatusDropdownRef}>
            <div
              className={`filter-tag ${
                filters.dueStatus !== null ? "filtered" : ""
              }`}
              onClick={() => setDueStatusDropdownOpen(!dueStatusDropdownOpen)}
            >
              {filters.dueStatus === "due"
                ? "Due Status: Due"
                : filters.dueStatus === "overdue"
                  ? "Due Status: Overdue"
                  : filters.dueStatus === "none"
                    ? "Due Status: No Due Date"
                    : "Due Status"}
            </div>
            {dueStatusDropdownOpen && (
              <div className="filter-dropdown-options">
                <button
                  className="filter-dropdown-btn"
                  onClick={() => {
                    updateFilter("dueStatus", null);
                    setDueStatusDropdownOpen(false);
                  }}
                >
                  All
                </button>
                <button
                  className="filter-dropdown-btn"
                  onClick={() => {
                    updateFilter("dueStatus", "due");
                    setDueStatusDropdownOpen(false);
                  }}
                >
                  Due
                </button>
                <button
                  className="filter-dropdown-btn"
                  onClick={() => {
                    updateFilter("dueStatus", "overdue");
                    setDueStatusDropdownOpen(false);
                  }}
                >
                  Overdue
                </button>
                <button
                  className="filter-dropdown-btn"
                  onClick={() => {
                    updateFilter("dueStatus", "none");
                    setDueStatusDropdownOpen(false);
                  }}
                >
                  No Due Date
                </button>
              </div>
            )}
          </div>

          {rangeFilter && (
            <div className="range-filter">
              <div className="range-filter-label">Range:</div>
              <div className="clearable-input-container">
                <DatePicker
                  selected={filters.startDate}
                  onChange={(date) => updateFilter("startDate", date)}
                  placeholderText="Start Date"
                  className="filter-input"
                  dateFormat="dd/MM/yyyy"
                />
                {filters.startDate && (
                  <button
                    data-testid="clear-start-date-btn"
                    className="clear-input-button"
                    aria-label="Clear Start Date"
                    onClick={() => updateFilter("startDate", null)}
                  >
                    <FaTimes size={10} />
                  </button>
                )}
              </div>
              <div className="clearable-input-container">
                <DatePicker
                  selected={filters.endDate}
                  onChange={(date) => updateFilter("endDate", date)}
                  placeholderText="End Date"
                  className="filter-input"
                  dateFormat="dd/MM/yyyy"
                />
                {filters.endDate && (
                  <button
                    data-testid="clear-end-date-btn"
                    className="clear-input-button"
                    aria-label="Clear End Date"
                    onClick={() => updateFilter("endDate", null)}
                  >
                    <FaTimes size={10} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Clear Filters button */}
          <div
            className={`filter-tag clear-filters-tag ${
              isDefaultFilters ? "disabled" : ""
            }`}
            onClick={!isDefaultFilters ? clearAllFilters : undefined}
            title="Clear all filters"
          >
            <FaTimes size={10} /> Clear
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
