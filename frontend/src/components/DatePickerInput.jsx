import { useRef } from "react";
import { FiCalendar } from "react-icons/fi";
import "./DatePickerInput.css";

const DatePickerInput = ({ className = "", ...inputProps }) => {
  const inputRef = useRef(null);

  const openCalendar = () => {
    const input = inputRef.current;
    if (typeof input?.showPicker === "function") {
      input.showPicker();
    } else {
      input?.focus();
    }
  };

  return (
    <span className="calendar-date-input">
      <input
        {...inputProps}
        ref={inputRef}
        type="date"
        className={className}
      />
      <button
        type="button"
        className="calendar-date-input-trigger"
        aria-label="Open calendar"
        onClick={openCalendar}
        disabled={inputProps.disabled}
      >
        <FiCalendar aria-hidden="true" />
      </button>
    </span>
  );
};

export default DatePickerInput;
