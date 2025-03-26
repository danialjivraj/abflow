import React, { useState, useRef, useEffect } from "react";
import { FaAngleDoubleLeft, FaAngleDoubleRight, FaTimes } from "react-icons/fa";

const FilterBar = ({ filters, setFilters }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [timerDropdownOpen, setTimerDropdownOpen] = useState(false);
  const [calendarDropdownOpen, setCalendarDropdownOpen] = useState(false);
  const [dueStatusDropdownOpen, setDueStatusDropdownOpen] = useState(false);
  
  const timerDropdownRef = useRef(null);
  const calendarDropdownRef = useRef(null);
  const dueStatusDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (timerDropdownRef.current && !timerDropdownRef.current.contains(event.target)) {
        setTimerDropdownOpen(false);
      }
      if (calendarDropdownRef.current && !calendarDropdownRef.current.contains(event.target)) {
        setCalendarDropdownOpen(false);
      }
      if (dueStatusDropdownRef.current && !dueStatusDropdownRef.current.contains(event.target)) {
        setDueStatusDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const updateFilter = (name, value) => {
    setFilters({ ...filters, [name]: value });
  };

  const clearAllFilters = () => {
    setFilters({
      taskName: "",
      priority: "",
      assignedTo: "",
      storyPoints: "",
      timerRunning: null,
      today: null,
      dueStatus: null
    });
  };

  return (
    <div className="filter-bar-container">
      <button className="filter-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <FaAngleDoubleLeft size={12} /> : <FaAngleDoubleRight size={12} />}
      </button>
      
      {isOpen && (
        <div className="filters-container">
          <input
            type="text"
            name="taskName"
            placeholder="Task"
            value={filters.taskName || ""}
            onChange={handleInputChange}
            className="filter-input"
          />

          <select
            name="priority"
            value={filters.priority || ""}
            onChange={handleInputChange}
            className="filter-select"
          >
            <option value="">Priority</option>
            <option value="A1">A1</option>
            <option value="A2">A2</option>
            <option value="A3">A3</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="B3">B3</option>
            <option value="C1">C1</option>
            <option value="C2">C2</option>
            <option value="C3">C3</option>
            <option value="D">D</option>
            <option value="E">E</option>
          </select>

          <input
            type="text"
            name="assignedTo"
            placeholder="Assignee"
            value={filters.assignedTo || ""}
            onChange={handleInputChange}
            className="filter-input"
          />

          <input
            type="number"
            name="storyPoints"
            placeholder="Points"
            value={filters.storyPoints || ""}
            onChange={handleInputChange}
            className="filter-input"
          />

          <div className="filter-dropdown" ref={timerDropdownRef}>
            <div 
              className="filter-tag"
              onClick={() => setTimerDropdownOpen(!timerDropdownOpen)}
            >
              {filters.timerRunning === true ? 'Timer: On' : 
               filters.timerRunning === false ? 'Timer: Off' : 'Timer'}
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

          <div className="filter-dropdown" ref={calendarDropdownRef}>
            <div 
              className="filter-tag"
              onClick={() => setCalendarDropdownOpen(!calendarDropdownOpen)}
            >
              {filters.today === true ? 'Today' : 
               filters.today === false ? 'Not Today' : 'Date'}
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

          <div className="filter-dropdown" ref={dueStatusDropdownRef}>
            <div 
              className="filter-tag"
              onClick={() => setDueStatusDropdownOpen(!dueStatusDropdownOpen)}
            >
              {filters.dueStatus === 'due' ? 'Due' : 
               filters.dueStatus === 'overdue' ? 'Overdue' :
               filters.dueStatus === 'none' ? 'No Due Date' : 'Due Status'}
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
                    updateFilter("dueStatus", 'due');
                    setDueStatusDropdownOpen(false);
                  }}
                >
                  Due
                </button>
                <button
                  className="filter-dropdown-btn"
                  onClick={() => {
                    updateFilter("dueStatus", 'overdue');
                    setDueStatusDropdownOpen(false);
                  }}
                >
                  Overdue
                </button>
                <button
                  className="filter-dropdown-btn"
                  onClick={() => {
                    updateFilter("dueStatus", 'none');
                    setDueStatusDropdownOpen(false);
                  }}
                >
                  No Due Date
                </button>
              </div>
            )}
          </div>

          <div 
            className="filter-tag clear-filters-tag"
            onClick={clearAllFilters}
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