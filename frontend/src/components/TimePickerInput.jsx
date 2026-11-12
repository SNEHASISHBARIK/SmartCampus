import { useEffect, useId, useRef, useState } from "react";
import { FiCheck, FiClock, FiX, FiChevronDown, FiZap } from "react-icons/fi";
import "./TimePickerInput.css";

const PRESET_TIMES = [
  { label: "09:00 AM", hour: "9", minute: "00", period: "AM" },
  { label: "10:00 AM", hour: "10", minute: "00", period: "AM" },
  { label: "11:00 AM", hour: "11", minute: "00", period: "AM" },
  { label: "12:00 PM", hour: "12", minute: "00", period: "PM" },
  { label: "01:00 PM", hour: "1", minute: "00", period: "PM" },
  { label: "02:00 PM", hour: "2", minute: "00", period: "PM" },
  { label: "03:00 PM", hour: "3", minute: "00", period: "PM" },
  { label: "04:00 PM", hour: "4", minute: "00", period: "PM" },
  { label: "05:00 PM", hour: "5", minute: "00", period: "PM" },
];

const STANDARD_MINUTES = [
  "00", "05", "10", "15", "20", "25",
  "30", "35", "40", "45", "50", "55",
];

const toClockParts = (value) => {
  if (!value) {
    return { hour: "9", minute: "00", period: "AM" };
  }

  const [hourString = "09", minuteString = "00"] = value.split(":");
  const hour24 = Number(hourString);
  if (!Number.isInteger(hour24) || hour24 < 0 || hour24 > 23) {
    return { hour: "9", minute: "00", period: "AM" };
  }

  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  return {
    hour: String(hour12),
    minute: minuteString.slice(0, 2).padStart(2, "0"),
    period,
  };
};

const toInputValue = ({ hour, minute, period }) => {
  const hour12 = Number(hour) % 12;
  const hour24 = hour12 + (period === "PM" ? 12 : 0);
  return `${String(hour24).padStart(2, "0")}:${minute}`;
};

const formatDisplayTime = (value) => {
  if (!value) return "";
  const { hour, minute, period } = toClockParts(value);
  return `${hour.padStart(2, "0")}:${minute} ${period}`;
};

const getCurrentSystemTime = () => {
  const now = new Date();
  const h24 = now.getHours();
  const period = h24 >= 12 ? "PM" : "AM";
  const hour = String(h24 % 12 || 12);
  const roundedMins = Math.round(now.getMinutes() / 5) * 5 % 60;
  const minute = String(roundedMins).padStart(2, "0");
  return { hour, minute, period };
};

const TimePickerInput = ({
  className = "",
  disabled = false,
  id,
  name,
  onChange,
  required = false,
  style,
  value = "",
  placeholder = "Select time",
}) => {
  const pickerRef = useRef(null);
  const hourListRef = useRef(null);
  const minuteListRef = useRef(null);
  const pickerId = useId();

  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(() => toClockParts(value));

  // Sync draft when incoming value changes while picker is closed
  useEffect(() => {
    if (!isOpen && value) {
      setDraft(toClockParts(value));
    }
  }, [value, isOpen]);

  // Click outside to dismiss
  useEffect(() => {
    if (!isOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!pickerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [isOpen]);

  // Auto scroll active items into view when opened
  useEffect(() => {
    if (isOpen) {
      const activeHourEl = hourListRef.current?.querySelector(".tp-cell-active");
      if (activeHourEl) {
        activeHourEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
      const activeMinEl = minuteListRef.current?.querySelector(".tp-cell-active");
      if (activeMinEl) {
        activeMinEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [isOpen]);

  const openPicker = () => {
    if (disabled) return;
    setDraft(toClockParts(value));
    setIsOpen(true);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSelectHour = (h) => {
    setDraft((prev) => ({ ...prev, hour: String(h) }));
  };

  const handleSelectMinute = (m) => {
    setDraft((prev) => ({ ...prev, minute: String(m) }));
  };

  const handleTogglePeriod = (p) => {
    setDraft((prev) => ({ ...prev, period: p }));
  };

  const handleApplyPreset = (preset) => {
    const updated = { hour: preset.hour, minute: preset.minute, period: preset.period };
    setDraft(updated);
    onChange?.({
      target: {
        name,
        value: toInputValue(updated),
      },
    });
    setIsOpen(false);
  };

  const handleSetCurrentTime = () => {
    const nowParts = getCurrentSystemTime();
    setDraft(nowParts);
  };

  const applyTime = () => {
    onChange?.({
      target: {
        name,
        value: toInputValue(draft),
      },
    });
    setIsOpen(false);
  };

  // Build minutes list ensuring draft minute is present even if custom
  const minutesList = STANDARD_MINUTES.includes(draft.minute)
    ? STANDARD_MINUTES
    : [...STANDARD_MINUTES, draft.minute].sort((a, b) => Number(a) - Number(b));

  const displayText = value ? formatDisplayTime(value) : placeholder;

  return (
    <span
      className={`clock-time-picker ${isOpen ? "is-open" : ""}`}
      ref={pickerRef}
      onKeyDown={handleKeyDown}
    >
      <button
        id={id}
        type="button"
        className={`clock-time-picker-trigger ${value ? "has-value" : "is-empty"} ${className}`}
        style={style}
        aria-label={`${name || "Time"}: ${value ? formatDisplayTime(value) : "Not set"}. Choose time`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={pickerId}
        aria-required={required || undefined}
        disabled={disabled}
        onClick={openPicker}
      >
        <span className="clock-trigger-left">
          <span className="clock-trigger-icon" aria-hidden="true">
            <FiClock />
          </span>
          <span className="clock-trigger-text">{displayText}</span>
        </span>
        <FiChevronDown className="clock-trigger-chevron" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          className="clock-time-picker-popover"
          id={pickerId}
          role="dialog"
          aria-label="Choose a time"
        >
          {/* DIGITAL CLOCK HEADER */}
          <div className="tp-digital-header">
            <div className="tp-digital-clock">
              <span className="tp-dig-num">{draft.hour.padStart(2, "0")}</span>
              <span className="tp-dig-colon">:</span>
              <span className="tp-dig-num">{draft.minute}</span>
            </div>

            {/* AM / PM SEGMENTED TOGGLE */}
            <div className="tp-period-segmented" role="radiogroup" aria-label="AM or PM">
              <button
                type="button"
                className={`tp-period-btn ${draft.period === "AM" ? "active" : ""}`}
                onClick={() => handleTogglePeriod("AM")}
              >
                AM
              </button>
              <button
                type="button"
                className={`tp-period-btn ${draft.period === "PM" ? "active" : ""}`}
                onClick={() => handleTogglePeriod("PM")}
              >
                PM
              </button>
            </div>
          </div>

          {/* QUICK PRESETS ROW */}
          <div className="tp-presets-wrapper">
            <div className="tp-presets-label">
              <FiZap aria-hidden="true" /> Quick Slots
            </div>
            <div className="tp-presets-scroll">
              {PRESET_TIMES.map((p) => {
                const isActive =
                  draft.hour === p.hour &&
                  draft.minute === p.minute &&
                  draft.period === p.period;
                return (
                  <button
                    key={p.label}
                    type="button"
                    className={`tp-preset-chip ${isActive ? "active" : ""}`}
                    onClick={() => handleApplyPreset(p)}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* INTERACTIVE DYNAMIC COLUMNS */}
          <div className="tp-columns-container">
            {/* HOURS */}
            <div className="tp-column">
              <div className="tp-col-title">HOUR</div>
              <div className="tp-cells-list" ref={hourListRef}>
                {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((h) => {
                  const isSelected = draft.hour === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      className={`tp-cell-btn ${isSelected ? "tp-cell-active" : ""}`}
                      onClick={() => handleSelectHour(h)}
                    >
                      {h.padStart(2, "0")}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="tp-col-divider">:</div>

            {/* MINUTES */}
            <div className="tp-column">
              <div className="tp-col-title">MINUTE</div>
              <div className="tp-cells-list" ref={minuteListRef}>
                {minutesList.map((m) => {
                  const isSelected = draft.minute === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      className={`tp-cell-btn ${isSelected ? "tp-cell-active" : ""}`}
                      onClick={() => handleSelectMinute(m)}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ACTIONS FOOTER */}
          <div className="tp-actions-bar">
            <button
              type="button"
              className="tp-btn-now"
              onClick={handleSetCurrentTime}
              title="Set to current device time"
            >
              <FiClock aria-hidden="true" /> Now
            </button>

            <div className="tp-actions-right">
              <button
                type="button"
                className="tp-btn-cancel"
                onClick={() => setIsOpen(false)}
              >
                <FiX aria-hidden="true" /> Cancel
              </button>
              <button
                type="button"
                className="tp-btn-set"
                onClick={applyTime}
              >
                <FiCheck aria-hidden="true" /> Set Time
              </button>
            </div>
          </div>
        </div>
      )}
    </span>
  );
};

export default TimePickerInput;
