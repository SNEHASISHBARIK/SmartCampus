import { useEffect, useMemo, useState } from "react";
import {
  FiBookOpen,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiDownload,
  FiGrid,
  FiMapPin,
  FiRefreshCw,
  FiUser,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "./Timetable.css";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WEEKDAY_BY_DATE = ["Sunday", ...DAYS];
const SUBJECT_COLORS = ["blue", "green", "purple", "pink", "teal", "orange"];

const startOfWeek = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return result;
};

const addDays = (date, count) => {
  const result = new Date(date);
  result.setDate(result.getDate() + count);
  return result;
};

const dateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const displayDate = (date, options = { day: "numeric", month: "short" }) =>
  date.toLocaleDateString("en-IN", options);

const Timetable = () => {
  const [timetable, setTimetable] = useState([]);
  const [semester, setSemester] = useState(null);
  const [section, setSection] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [view, setView] = useState("week");
  const [weekOffset, setWeekOffset] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  useEffect(() => {
    let isMounted = true;

    const loadTimetable = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/students/timetable");
        if (!isMounted) return;
        setTimetable(response.data?.timetable || []);
        setSemester(response.data?.student?.semester ?? null);
        setSection(response.data?.student?.section || "");
      } catch (requestError) {
        console.error("Student timetable error:", requestError);
        if (isMounted) {
          setError(
            requestError.response?.data?.message || "Unable to load your timetable."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadTimetable();
    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const weekDates = useMemo(() => {
    const monday = addDays(startOfWeek(new Date()), weekOffset * 7);
    return DAYS.map((_, index) => addDays(monday, index));
  }, [weekOffset]);

  const timeSlots = useMemo(
    () =>
      [...new Set(timetable.map((entry) => `${entry.startTime}|${entry.endTime}`))]
        .sort((first, second) => first.localeCompare(second))
        .map((slot) => slot.split("|")),
    [timetable]
  );

  const subjects = useMemo(() => {
    const unique = new Map();
    timetable.forEach((entry) => {
      if (entry.subject?._id) {
        unique.set(entry.subject._id, entry.subject);
      }
    });
    return [...unique.values()];
  }, [timetable]);

  const subjectColor = (entry) => {
    const subjectId = entry.subject?._id || entry.sessionType || entry.title;
    let hash = 0;
    for (let index = 0; index < subjectId.length; index += 1) {
      hash = (hash * 31 + subjectId.charCodeAt(index)) | 0;
    }
    return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length];
  };

  const entriesForDay = (day) =>
    timetable
      .filter((entry) => entry.day === day)
      .sort((first, second) => first.startTime.localeCompare(second.startTime));

  const rangeLabel = `${displayDate(weekDates[0])} - ${displayDate(
    weekDates[weekDates.length - 1],
    { day: "numeric", month: "short", year: "numeric" }
  )}`;

  const monthStart = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
    1
  );
  const monthGridStart = addDays(monthStart, -monthStart.getDay());
  const calendarDates = Array.from({ length: 42 }, (_, index) =>
    addDays(monthGridStart, index)
  );

  const today = new Date();
  const selectedDay = WEEKDAY_BY_DATE[selectedDate.getDay()];
  const selectedDateEntries = entriesForDay(selectedDay);

  const goToToday = () => {
    setWeekOffset(0);
    setCalendarMonth(new Date());
    setSelectedDate(new Date());
  };

  const moveRange = (direction) => {
    if (view === "calendar") {
      setCalendarMonth(
        (current) =>
          new Date(current.getFullYear(), current.getMonth() + direction, 1)
      );
      return;
    }
    setWeekOffset((current) => current + direction);
  };

  const renderEntry = (entry, compact = false) => (
    <article
      className={`student-timetable-entry ${subjectColor(entry)} ${
        compact ? "compact" : ""
      }`}
      key={entry._id}
    >
      <strong>{entry.title || entry.subject?.name || "Scheduled session"}</strong>
      {entry.subject?.code && <span>{entry.subject.code}</span>}
      {entry.room && (
        <span className="student-timetable-entry-meta">
          <FiMapPin aria-hidden="true" /> {entry.room}
        </span>
      )}
      {entry.faculty?.user?.name && (
        <span className="student-timetable-entry-meta">
          <FiUser aria-hidden="true" /> {entry.faculty.user.name}
        </span>
      )}
      {!compact && entry.sessionType !== "class" && (
        <span className="student-timetable-entry-type">{entry.sessionType}</span>
      )}
    </article>
  );

  if (loading) {
    return (
      <div className="student-timetable-page">
        <div className="student-timetable-state" role="status">
          Loading your timetable…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-timetable-page">
        <div className="student-timetable-state error" role="alert">
          <strong>Timetable could not be loaded</strong>
          <span>{error}</span>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
            <FiRefreshCw aria-hidden="true" /> Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="student-timetable-page">
      <div className="student-timetable-breadcrumb">
        <Link to="/student">Dashboard</Link>
        <span aria-hidden="true">›</span>
        <strong>Timetable</strong>
      </div>

      <header className="student-timetable-heading">
        <div>
          <h1>Timetable</h1>
          <p>Plan your week and never miss a class.</p>
        </div>
        <span className="student-timetable-semester">
          {semester ? `Semester ${semester}` : "Your semester"}
          {section ? ` · Section ${section}` : ""}
        </span>
      </header>

      <section className="student-timetable-toolbar" aria-label="Timetable controls">
        <div className="student-timetable-view-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={view === "week"}
            className={view === "week" ? "active" : ""}
            onClick={() => setView("week")}
          >
            <FiGrid aria-hidden="true" /> Weekly View
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "list"}
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
          >
            <FiBookOpen aria-hidden="true" /> List View
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === "calendar"}
            className={view === "calendar" ? "active" : ""}
            onClick={() => setView("calendar")}
          >
            <FiCalendar aria-hidden="true" /> Calendar View
          </button>
        </div>

        <div className="student-timetable-navigation">
          <button
            type="button"
            aria-label={view === "calendar" ? "Previous month" : "Previous week"}
            onClick={() => moveRange(-1)}
          >
            <FiChevronLeft aria-hidden="true" />
          </button>
          <strong>
            {view === "calendar"
              ? calendarMonth.toLocaleDateString("en-IN", {
                  month: "short",
                  year: "numeric",
                })
              : rangeLabel}
          </strong>
          <button
            type="button"
            aria-label={view === "calendar" ? "Next month" : "Next week"}
            onClick={() => moveRange(1)}
          >
            <FiChevronRight aria-hidden="true" />
          </button>
          <button type="button" className="today-button" onClick={goToToday}>
            Today
          </button>
          <button
            type="button"
            className="download-button"
            onClick={() => window.print()}
          >
            <FiDownload aria-hidden="true" /> Download
          </button>
        </div>
      </section>

      {!timetable.length ? (
        <div className="student-timetable-empty">
          <FiCalendar aria-hidden="true" />
          <h2>No timetable has been published</h2>
          <p>
            Your weekly classes will appear here after your department publishes
            the schedule for this semester.
          </p>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
            <FiRefreshCw aria-hidden="true" /> Refresh timetable
          </button>
        </div>
      ) : (
        <>
          {view === "week" && (
            <div className="student-timetable-card student-timetable-week-wrap">
              <table className="student-timetable-week">
                <thead>
                  <tr>
                    <th scope="col">Time</th>
                    {DAYS.map((day, index) => (
                      <th scope="col" key={day}>
                        <span>{day}</span>
                        <small>{displayDate(weekDates[index])}</small>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map(([startTime, endTime]) => (
                    <tr key={`${startTime}-${endTime}`}>
                      <th scope="row">
                        <span>{startTime}</span>
                        <small>{endTime}</small>
                      </th>
                      {DAYS.map((day) => {
                        const entries = timetable.filter(
                          (entry) =>
                            entry.day === day &&
                            entry.startTime === startTime &&
                            entry.endTime === endTime
                        );
                        return (
                          <td key={`${day}-${startTime}`}>
                            {entries.map((entry) => renderEntry(entry, true))}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!timeSlots.length && (
                <p className="student-timetable-no-classes">
                  No sessions are scheduled for this week.
                </p>
              )}
            </div>
          )}

          {view === "list" && (
            <div className="student-timetable-list">
              {DAYS.map((day, index) => {
                const entries = entriesForDay(day);
                return (
                  <section className="student-timetable-day-card" key={day}>
                    <header>
                      <h2>{day}</h2>
                      <span>{displayDate(weekDates[index])}</span>
                    </header>
                    {entries.length ? (
                      <div className="student-timetable-day-entries">
                        {entries.map((entry) => (
                          <div className="student-timetable-list-entry" key={entry._id}>
                            <div className="student-timetable-list-time">
                              <FiClock aria-hidden="true" />
                              <span>
                                {entry.startTime} – {entry.endTime}
                              </span>
                            </div>
                            {renderEntry(entry)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="student-timetable-free-day">No classes scheduled</p>
                    )}
                  </section>
                );
              })}
            </div>
          )}

          {view === "calendar" && (
            <div className="student-timetable-calendar-layout">
              <div className="student-timetable-card student-timetable-month">
                <div className="student-timetable-calendar-weekdays">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
                <div className="student-timetable-calendar-grid">
                  {calendarDates.map((date) => {
                    const day = WEEKDAY_BY_DATE[date.getDay()];
                    const entries = entriesForDay(day);
                    const inMonth = date.getMonth() === calendarMonth.getMonth();
                    const isSelected = dateKey(date) === dateKey(selectedDate);
                    const isToday = dateKey(date) === dateKey(today);
                    return (
                      <button
                        type="button"
                        key={dateKey(date)}
                        className={[
                          "student-timetable-calendar-date",
                          !inMonth ? "outside-month" : "",
                          isSelected ? "selected" : "",
                          isToday ? "today" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        onClick={() => setSelectedDate(date)}
                      >
                        <span>{date.getDate()}</span>
                        {inMonth && entries.length > 0 && (
                          <small>{entries.length} {entries.length === 1 ? "class" : "classes"}</small>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <section className="student-timetable-day-card student-timetable-selected-day">
                <header>
                  <h2>{selectedDate.toLocaleDateString("en-IN", { weekday: "long" })}</h2>
                  <span>
                    {displayDate(selectedDate, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </header>
                {selectedDateEntries.length ? (
                  <div className="student-timetable-day-entries">
                    {selectedDateEntries.map((entry) => (
                      <div className="student-timetable-list-entry" key={entry._id}>
                        <div className="student-timetable-list-time">
                          <FiClock aria-hidden="true" />
                          <span>
                            {entry.startTime} – {entry.endTime}
                          </span>
                        </div>
                        {renderEntry(entry)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="student-timetable-free-day">
                    No classes scheduled for this day.
                  </p>
                )}
              </section>
            </div>
          )}

          <section className="student-timetable-bottom-grid">
            <div className="student-timetable-card student-timetable-legend">
              <h2><FiBookOpen aria-hidden="true" /> Subject Legend</h2>
              {subjects.length ? (
                <div className="student-timetable-legend-items">
                  {subjects.map((subject) => {
                    const sampleEntry = timetable.find(
                      (entry) => entry.subject?._id === subject._id
                    );
                    return (
                      <span key={subject._id}>
                        <i className={subjectColor(sampleEntry)} />
                        {subject.name} {subject.code ? `(${subject.code})` : ""}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p>Events in your schedule are shown with their published titles.</p>
              )}
            </div>
            <div className="student-timetable-card student-timetable-notes">
              <h2><FiCalendar aria-hidden="true" /> Important Notes</h2>
              <ul>
                <li>Check this page regularly for schedule updates.</li>
                <li>Room and faculty details appear when provided.</li>
                <li>Contact your department if a class entry looks incorrect.</li>
              </ul>
            </div>
            <div className="student-timetable-card student-timetable-download">
              <h2><FiDownload aria-hidden="true" /> Download Timetable</h2>
              <p>Print or save your current timetable as a PDF.</p>
              <button type="button" onClick={() => window.print()}>
                <FiDownload aria-hidden="true" /> Download PDF
              </button>
            </div>
          </section>
        </>
      )}

      <footer className="student-timetable-footer">
        <FiBookOpen aria-hidden="true" />
        <span>Learn Today&nbsp; | &nbsp;Grow Tomorrow&nbsp; | &nbsp;Belong Forever</span>
        <em>— SmartCampus</em>
      </footer>
    </div>
  );
};

export default Timetable;
