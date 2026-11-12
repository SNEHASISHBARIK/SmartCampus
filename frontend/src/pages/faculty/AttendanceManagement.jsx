import { useEffect, useMemo, useState } from "react";

import {

  FiCalendar,

  FiCheckCircle,

  FiXCircle,

  FiClock,

  FiUsers,

  FiBookOpen,

  FiBarChart2,

  FiDownload,

  FiSave,

  FiRefreshCw,

  FiChevronLeft,

  FiChevronRight,

  FiAlertCircle,

} from "react-icons/fi";

import DatePickerInput from "../../components/DatePickerInput";
import api from "../../services/api";

import "./AttendanceManagement.css";

const toLocalDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const AttendanceManagement = () => {

  const [records, setRecords] = useState([]);

  const [students, setStudents] = useState([]);

  const [availableSections, setAvailableSections] = useState([]);

  const [rosterRefresh, setRosterRefresh] = useState(0);

  const [subjects, setSubjects] = useState([]);
  const [refreshingSubjects, setRefreshingSubjects] = useState(false);

  const [selectedSubject, setSelectedSubject] = useState("");

  const [selectedDate, setSelectedDate] = useState(() =>
    toLocalDateInputValue(new Date())
  );

  const [selectedSection, setSelectedSection] =

    useState("All");

  const [selectedPeriod, setSelectedPeriod] =

    useState("10:00 AM - 10:50 AM");

  const [attendance, setAttendance] = useState({});

  const [remarks, setRemarks] = useState("");

  const [loading, setLoading] = useState(true);

  const [loadingStudents, setLoadingStudents] = useState(false);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [search, setSearch] = useState("");

  const entriesPerPage = 10;

  /* =========================================================

     FETCH DATA

  ========================================================= */

  const fetchSubjectsOnly = async () => {
    try {
      setRefreshingSubjects(true);
      const res = await api.get("/faculty/subjects");
      if (Array.isArray(res.data?.subjects)) {
        setSubjects(res.data.subjects);
      }
    } catch (err) {
      console.warn("Refresh subjects error:", err);
    } finally {
      setRefreshingSubjects(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        attendanceResponse,
        dashboardResponse,
        subjectsResponse,
      ] = await Promise.all([
        api.get("/attendance"),
        api.get("/faculty/dashboard"),
        api.get("/faculty/subjects").catch((err) => {
          console.warn("Faculty subjects API fallback:", err);
          return null;
        }),
      ]);

      const attendanceData =
        attendanceResponse.data?.attendance || [];

      const dashboard =
        dashboardResponse.data?.dashboard || {};

      const subjectsData =
        subjectsResponse?.data?.subjects || dashboard.subjects || [];

      if (!Array.isArray(attendanceData)) {
        throw new Error("Attendance response has an invalid format.");
      }

      setRecords(attendanceData);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
    } catch (err) {
      console.error(
        "Fetch attendance data error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load attendance data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    fetchData();

  }, []);

  /* =========================================================

     FILTER STUDENTS

  ========================================================= */

  const filteredStudents = useMemo(() => {

    return students.filter((student) => {

      const name =

        student.user?.name ||

        student.name ||

        "";

      const searchableValues = [
        name,
        student.studentId,
        student.rollNumber,
        student.user?.email,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());
      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        searchableValues.some((value) => value.includes(query));

      return matchesSearch;

    });

  }, [

    students,
    search,

  ]);

  useEffect(() => {
    let cancelled = false;

    const loadStudents = async () => {
      setError("");

      if (!selectedSubject) {
        setAvailableSections([]);
        setLoadingStudents(false);
        return;
      }

      setLoadingStudents(true);

      try {
        const response = await api.get(
          "/faculty/attendance/students",
          {
            params: {
              subjectId: selectedSubject,
              section: selectedSection,
            },
          }
        );

        if (!cancelled) {
          if (!Array.isArray(response.data?.students)) {
            throw new Error("Student roster response has an invalid format.");
          }
          setStudents(response.data.students);
          setAvailableSections(
            Array.isArray(response.data.sections) ? response.data.sections : []
          );
          setCurrentPage(1);
          setLoadingStudents(false);
        }
      } catch (err) {
        if (!cancelled) {
          setStudents([]);
          setAvailableSections([]);
          setLoadingStudents(false);
          setError(
            err.response?.data?.message ||
              "Unable to load class students."
          );
        }
      }
    };

    loadStudents();

    return () => {
      cancelled = true;
    };
  }, [selectedSubject, selectedSection, rosterRefresh]);

  /* =========================================================

     EXISTING ATTENDANCE FOR SELECTED DATE/SUBJECT

  ========================================================= */

  useEffect(() => {

    if (!selectedSubject || !selectedDate) {
      return;

    }

    const toId = (value) => {

      if (!value) return "";

      return String(value._id || value);

    };

    const toDate = (value) => {

      if (!value) return "";

      const date = new Date(value);

      if (Number.isNaN(date.getTime())) return "";

      return date.toISOString().slice(0, 10);

    };

    const selectedRecords = records.filter((record) => {

      const recordSubject = toId(record.subject);

      const recordPeriod = String(record.period || "").trim();

      return (

        toDate(record.date) === selectedDate &&

        recordSubject === String(selectedSubject) &&

        recordPeriod === String(selectedPeriod).trim()

      );

    });

    const mapped = {};

    selectedRecords.forEach((record) => {

      const studentId = toId(record.student);

      if (!studentId) return;

      mapped[studentId] = {

        status: record.status || "present",

        remarks: record.remarks || "",

        recordId: record._id,

      };

    });

    setAttendance(mapped);

  }, [records, selectedSubject, selectedDate, selectedPeriod]);

  /* =========================================================

     STATISTICS

  ========================================================= */

  const selectedSessionRecords = useMemo(
    () =>
      students.flatMap((student) => {
        const current = attendance[student._id];
        return current?.status ? [{ status: current.status }] : [];
      }),
    [students, attendance]
  );

  const presentCount = selectedSessionRecords.filter(

    (record) => record.status === "present"

  ).length;

  const absentCount = selectedSessionRecords.filter(

    (record) => record.status === "absent"

  ).length;

  const lateCount = selectedSessionRecords.filter(

    (record) => record.status === "late"

  ).length;

  const leaveCount = selectedSessionRecords.filter(

    (record) => record.status === "leave"

  ).length;

  const totalMarked =

    presentCount + absentCount + lateCount + leaveCount;

  const attendancePercentage =

    totalMarked > 0

      ? Math.round(((presentCount + lateCount) / totalMarked) * 100)

      : 0;

  /* =========================================================

     SECTIONS

  ========================================================= */

  const sections = useMemo(
    () => ["All", ...availableSections],
    [availableSections]
  );

  /* =========================================================

     PAGINATION

  ========================================================= */

  const totalPages = Math.max(

    1,

    Math.ceil(

      filteredStudents.length /

        entriesPerPage

    )

  );

  const paginatedStudents =

    filteredStudents.slice(

      (currentPage - 1) *

        entriesPerPage,

      currentPage * entriesPerPage

    );

  /* =========================================================

     CHANGE STATUS

  ========================================================= */

  const updateStudentStatus = (

    studentId,

    status

  ) => {

    setAttendance((prev) => ({

      ...prev,

      [studentId]: {

        ...prev[studentId],

        status,

        remarks:

          prev[studentId]?.remarks || "",

        recordId:

          prev[studentId]?.recordId || null,

      },

    }));

  };

  /* =========================================================

     CHANGE REMARK

  ========================================================= */

  const updateStudentRemark = (

    studentId,

    value

  ) => {

    setAttendance((prev) => ({

      ...prev,

      [studentId]: {

        ...prev[studentId],

        status:

          prev[studentId]?.status ||

          "",

        remarks: value,

        recordId:

          prev[studentId]?.recordId || null,

      },

    }));

  };

  /* =========================================================

     AUTO MARK PRESENT

  ========================================================= */

  const markAllPresent = () => {

    const updated = { ...attendance };

    students.forEach((student) => {

      updated[student._id] = {

        ...updated[student._id],

        status: "present",

        remarks:

          updated[student._id]?.remarks || "",

        recordId:

          updated[student._id]?.recordId ||

          null,

      };

    });

    setAttendance(updated);

  };

  /* =========================================================

     SAVE ATTENDANCE

  ========================================================= */

  const handleSaveAttendance = async () => {

    if (!selectedSubject) {

      setError(

        "Please select a subject first."

      );

      return;

    }

    if (!selectedDate) {

      setError(

        "Please select an attendance date."

      );

      return;

    }

    if (students.length === 0) {

      setError(

        "No students available."

      );

      return;

    }

    const unmarkedStudents = students.filter(
      (student) => !attendance[student._id]?.status
    );

    if (unmarkedStudents.length > 0) {
      setError(
        `Mark attendance for all students before saving. ${unmarkedStudents.length} student(s) are not marked.`
      );
      return;
    }

    let savedCount = 0;
    try {

      setSaving(true);

      setError("");

      setSuccess("");

      for (const student of students) {

        const studentId = student._id;

        const current =

          attendance[studentId] || {};

        const payload = {

          student: studentId,

          subject: selectedSubject,

          date: selectedDate,

          period: selectedPeriod,

          section: selectedSection,

          status: current.status,
          remarks: current.remarks || remarks || "",

        };
        let response;
        if (current.recordId) {

          response = await api.put(

            `/attendance/${current.recordId}`,

            payload

          );

        } else {

          response = await api.post(

            "/attendance",

            payload

          );

        }

        const savedRecordId = response.data?.attendance?._id;
        if (!response.data?.success || !savedRecordId) {
          throw new Error(
            response.data?.message ||
              `Attendance was not saved for ${student.user?.name || student.studentId || "a student"}.`
          );
        }

        setAttendance((previous) => ({
          ...previous,
          [studentId]: {
            ...previous[studentId],
            ...current,
            status: payload.status,
            remarks: payload.remarks,
            recordId: savedRecordId,
          },
        }));
        savedCount += 1;

      }

      setSuccess(

        "Attendance saved successfully."

      );

      await fetchData();

    } catch (err) {

      console.error(

        "Save attendance error:",

        err

      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to save attendance."
      );
      if (savedCount > 0) {
        setError(
          `${savedCount} student record(s) were saved before an error. Successfully saved records are retained; retry to finish the session.`
        );
      }

    } finally {

      setSaving(false);

    }

  };

  /* =========================================================

     DOWNLOAD REPORT

  ========================================================= */

  const handleDownloadReport = () => {

    const rows = filteredStudents.map(

      (student, index) => {

        const current =

          attendance[student._id] || {};

        return [

          index + 1,

          student.studentId || "",

          student.user?.name ||

            student.name ||

            "",

          current.status || "Not marked",

          current.remarks || "",

        ];

      }

    );

    const csv = [

      [

        "#",

        "Student ID",

        "Student Name",

        "Status",

        "Remarks",

      ],

      ...rows,

    ]

      .map((row) =>

        row

          .map((value) =>

            `"${String(value).replace(

              /"/g,

              '""'

            )}"`

          )

          .join(",")

      )

      .join("\n");

    const blob = new Blob(

      [csv],

      { type: "text/csv;charset=utf-8;" }

    );

    const url =

      URL.createObjectURL(blob);

    const link =

      document.createElement("a");

    link.href = url;

    link.download =

      `attendance-${selectedDate}.csv`;

    link.click();

    URL.revokeObjectURL(url);

  };

  /* =========================================================

     FORMAT DATE

  ========================================================= */

  const formattedDate =

    new Date(

      `${selectedDate}T00:00:00`

    ).toLocaleDateString(

      "en-IN",

      {

        day: "2-digit",

        month: "short",

        year: "numeric",

      }

    );

  /* =========================================================

     LOADING

  ========================================================= */

  if (loading) {

    return (

      <div className="attendance-page">

        <div className="attendance-loading">

          <div className="attendance-spinner" />

          <h3>

            Loading Attendance Management...

          </h3>

          <p>

            Loading your students and attendance

            records.

          </p>

        </div>

      </div>

    );

  }

  /* =========================================================

     UI

  ========================================================= */

  return (

    <div className="attendance-page">

      {/* HEADER */}

      <div className="attendance-heading">

        <div>

          <div className="attendance-breadcrumb">

            <span>⌂</span>

            <span>Dashboard</span>

            <b>›</b>

            <strong>Attendance</strong>

          </div>

          <h1>

            Attendance Management

          </h1>

          <p>

            Mark and manage student attendance

            for your classes.

          </p>

        </div>

        <div className="attendance-date-display">

          <FiCalendar />

          {formattedDate}

        </div>

      </div>

      {/* ALERTS */}

      {error && (

        <div className="attendance-alert error">

          <FiAlertCircle />

          <span>{error}</span>

          <button

            onClick={() =>

              setError("")

            }

          >

            ×

          </button>

        </div>

      )}

      {success && (

        <div className="attendance-alert success">

          <FiCheckCircle />

          <span>{success}</span>

          <button

            onClick={() =>

              setSuccess("")

            }

          >

            ×

          </button>

        </div>

      )}

      {/* STAT CARDS */}

      <section className="attendance-stat-grid">

        <AttendanceStat

          icon={<FiUsers />}

          title="Total Students"

          value={students.length}

          subtitle={

            selectedSection === "All"

              ? "Loaded sections"

              : selectedSection

          }

          color="blue"

        />

        <AttendanceStat

          icon={<FiCheckCircle />}

          title="Present"

          value={presentCount}

          subtitle={

            totalMarked > 0

              ? `${Math.round(

                  (presentCount /

                    totalMarked) *

                    100

                )}% attendance`

              : "Not marked"

          }

          color="green"

        />

        <AttendanceStat

          icon={<FiXCircle />}

          title="Absent"

          value={absentCount}

          subtitle={

            totalMarked > 0

              ? `${Math.round(

                  (absentCount /

                    totalMarked) *

                    100

                )}% of marked`

              : "Not marked"

          }

          color="red"

        />

        <AttendanceStat

          icon={<FiClock />}

          title="Late"

          value={lateCount}

          subtitle={

            totalMarked > 0

              ? `${Math.round(

                  (lateCount /

                    totalMarked) *

                    100

                )}% of marked`

              : "Not marked"

          }

          color="orange"

        />

        <AttendanceStat

          icon={<FiAlertCircle />}

          title="Leave / Other"

          value={leaveCount}

          subtitle={

            totalMarked > 0

              ? `${Math.round(

                  (leaveCount /

                    totalMarked) *

                    100

                )}% of marked`

              : "Not marked"

          }

          color="orange"

        />

      </section>

      {/* FILTER BAR */}

      <section className="attendance-filter-panel">

        <div className="attendance-filter">
          <div className="attendance-filter-label-row">
            <label>Select Subject</label>
            <button
              type="button"
              className="attendance-quick-refresh-btn"
              onClick={fetchSubjectsOnly}
              disabled={refreshingSubjects}
              title="Sync latest subjects from backend"
            >
              <FiRefreshCw className={refreshingSubjects ? "spin-icon" : ""} />
              <span>{refreshingSubjects ? "Syncing..." : "Sync"}</span>
            </button>
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(
                e.target.value
              );
              setStudents([]);
              setSearch("");
              setAttendance({});
              setSelectedSection("All");
              setAvailableSections([]);
              setCurrentPage(1);
            }}
          >
            <option value="">
              Select Subject ({subjects.length} Available)
            </option>

            {subjects.map((subject) => {
              const deptCode =
                subject.department?.code ||
                (typeof subject.department === "string"
                  ? subject.department
                  : "");
              const semText = subject.semester ? `Sem ${subject.semester}` : "";
              const badge = [semText, deptCode].filter(Boolean).join(" · ");
              return (
                <option
                  key={subject._id}
                  value={subject._id}
                >
                  {subject.name} {subject.code ? `(${subject.code})` : ""}
                  {badge ? ` — [${badge}]` : ""}
                </option>
              );
            })}
          </select>
        </div>

        <div className="attendance-filter">

          <label>

            Select Date

          </label>

          <div className="date-input-wrapper">

            <DatePickerInput
              value={selectedDate}

              onChange={(e) => {

                setSelectedDate(
                  e.target.value
                );
                setAttendance({});
                setCurrentPage(1);

              }}

            />

          </div>

        </div>

        <div className="attendance-filter">

          <label>

            Select Section

          </label>

          <select

            value={selectedSection}

            onChange={(e) => {

              setSelectedSection(

                e.target.value

              );
              setStudents([]);
              setSearch("");

              setCurrentPage(1);

            }}

          >

            {sections.map((section) => (

              <option

                key={section}

                value={section}

              >

                {section === "All"

                  ? "All Sections"

                  : section}

              </option>

            ))}

          </select>

        </div>

        <div className="attendance-filter">

          <label>

            Select Period

          </label>

          <select

            value={selectedPeriod}

            onChange={(e) => {
              setSelectedPeriod(
                e.target.value
              );
              setAttendance({});
            }}

          >

            <option>

              09:00 AM - 09:50 AM

            </option>

            <option>

              10:00 AM - 10:50 AM

            </option>

            <option>

              11:00 AM - 11:50 AM

            </option>

            <option>

              12:00 PM - 12:50 PM

            </option>

            <option>

              02:00 PM - 02:50 PM

            </option>

            <option>

              03:00 PM - 03:50 PM

            </option>

            <option>

              04:00 PM - 05:00 PM

            </option>

          </select>

        </div>

        <button

          className="load-students-btn"

          type="button"

          disabled={!selectedSubject || loadingStudents}

          onClick={() => {
            setCurrentPage(1);
            setSuccess("");
            setError("");
            setRosterRefresh((refresh) => refresh + 1);
          }}

        >

          <FiRefreshCw />
          {loadingStudents ? "Loading Students..." : "Load Students"}

        </button>

      </section>

      {/* MAIN CONTENT */}

      <section className="attendance-content-grid">

        {/* STUDENT LIST */}

        <div className="attendance-list-panel">

          <div className="attendance-list-header">

            <div>

              <h2>

                Student Attendance List

              </h2>

              <p>

                {selectedSubject

                  ? subjects.find(

                      (subject) =>

                        subject._id ===

                        selectedSubject

                    )?.name ||

                    "Selected Subject"

                  : "Select a subject"}

                {" - "}

                {formattedDate}

              </p>

            </div>

            <div className="attendance-header-actions">

              <span className="count-badge present">

                Present: {presentCount}

              </span>

              <span className="count-badge absent">

                Absent: {absentCount}

              </span>

              <span className="count-badge leave">

                Late: {lateCount}

              </span>

              <span className="count-badge leave">

                Leave: {leaveCount}

              </span>

              <button

                type="button"

                className="auto-mark-btn"

                onClick={markAllPresent}

              >

                <FiCheckCircle />

                Auto Mark All Present

              </button>

            </div>

          </div>

          {/* SEARCH */}

          <div className="attendance-table-toolbar">

            <div className="student-search">

              <input

                type="text"

                placeholder="Search by roll number or name..."

                value={search}

                onChange={(e) => {

                  setSearch(

                    e.target.value

                  );

                  setCurrentPage(1);

                }}

              />

            </div>

            <span>

              {search.trim()
                ? `Showing ${filteredStudents.length} of ${students.length} students`
                : `${students.length} students in this class`}

            </span>

          </div>

          {/* TABLE */}

          <div className="attendance-table-wrapper">

            <table className="attendance-table">

              <thead>

                <tr>

                  <th>#</th>

                  <th>Roll No.</th>

                  <th>Name</th>

                  <th>Status</th>

                  <th>Remarks</th>

                </tr>

              </thead>

              <tbody>

                {paginatedStudents.length >

                0 ? (

                  paginatedStudents.map(

                    (

                      student,

                      index

                    ) => {

                      const studentId =

                        student._id;

                      const current =

                        attendance[

                          studentId

                        ] || {};

                      return (

                        <tr

                          key={

                            studentId

                          }

                        >

                          <td>

                            {(currentPage -

                              1) *

                              entriesPerPage +

                              index +

                              1}

                          </td>

                          <td>

                            <strong>

                              {student.studentId ||

                                "N/A"}

                            </strong>

                          </td>

                          <td>

                            <div className="student-name">

                              <span className="student-avatar">

                                {(

                                  student

                                    .user

                                    ?.name ||

                                  student.name ||

                                  "S"

                                )

                                  .charAt(

                                    0

                                  )

                                  .toUpperCase()}

                              </span>

                              <span>

                                {student

                                  .user

                                  ?.name ||

                                  student.name ||

                                  "Unknown Student"}

                              </span>

                            </div>

                          </td>

                          <td>

                            <select

                              className={`status-select ${

                                current.status ||

                                "unmarked"

                              }`}

                              value={

                                current.status || ""

                              }

                              onChange={(e) =>

                                updateStudentStatus(

                                  studentId,

                                  e.target

                                    .value

                                )

                              }

                            >

                              <option value="">

                                Not marked

                              </option>

                              <option value="present">

                                Present

                              </option>

                              <option value="absent">

                                Absent

                              </option>

                              <option value="late">

                                Late

                              </option>

                              <option value="leave">

                                Leave / Other

                              </option>

                            </select>

                          </td>

                          <td>

                            <input

                              className="remark-input"

                              type="text"

                              placeholder="-"

                              value={

                                current.remarks ||

                                ""

                              }

                              onChange={(e) =>

                                updateStudentRemark(

                                  studentId,

                                  e.target

                                    .value

                                )

                              }

                            />

                          </td>

                        </tr>

                      );

                    }

                  )

                ) : (

                  <tr>

                    <td

                      colSpan="5"

                      className="no-students"

                    >

                      <FiUsers />

                      <strong>

                        {!selectedSubject
                          ? "Select a subject"
                          : loadingStudents
                            ? "Loading class students..."
                            : "No students found"}

                      </strong>

                      <span>

                        {!selectedSubject
                          ? "Choose a subject to load its students."
                          : loadingStudents
                            ? "Please wait while the class roster loads."
                            : "Try changing the section or search, or check student section assignments."}

                      </span>

                    </td>

                  </tr>

                )}

              </tbody>

            </table>

          </div>

          {/* PAGINATION */}

          <div className="attendance-table-footer">

            <span>

              Showing{" "}

              {filteredStudents.length ===

              0

                ? 0

                : (currentPage - 1) *

                    entriesPerPage +

                  1}

              {" - "}

              {Math.min(

                currentPage *

                  entriesPerPage,

                filteredStudents.length

              )}{" "}

              of{" "}

              {filteredStudents.length}{" "}

              entries

            </span>

            <div className="pagination">

              <button

                disabled={

                  currentPage === 1

                }

                onClick={() =>

                  setCurrentPage(

                    (page) =>

                      Math.max(

                        1,

                        page - 1

                      )

                  )

                }

              >

                <FiChevronLeft />

              </button>

              {Array.from(

                {

                  length: totalPages,

                },

                (_, index) =>

                  index + 1

              )

                .slice(

                  0,

                  Math.min(totalPages, 5)

                )

                .map((page) => (

                  <button

                    key={page}

                    className={

                      currentPage === page

                        ? "active"

                        : ""

                    }

                    onClick={() =>

                      setCurrentPage(

                        page

                      )

                    }

                  >

                    {page}

                  </button>

                ))}

              <button

                disabled={

                  currentPage ===

                  totalPages

                }

                onClick={() =>

                  setCurrentPage(

                    (page) =>

                      Math.min(

                        totalPages,

                        page + 1

                      )

                  )

                }

              >

                <FiChevronRight />

              </button>

            </div>

          </div>

          {/* GENERAL REMARKS */}

          <div className="general-remarks">

            <label>

              Add General Remarks

              <span>(Optional)</span>

            </label>

            <textarea

              placeholder="Enter remarks for this class..."

              value={remarks}

              onChange={(e) =>

                setRemarks(

                  e.target.value

                )

              }

            />

          </div>

          {/* SAVE */}

          <div className="attendance-save-actions">

            <button

              className="download-btn"

              type="button"

              onClick={

                handleDownloadReport

              }

            >

              <FiDownload />

              Download Report

            </button>

            <button

              className="save-attendance-btn"

              type="button"

              disabled={saving}

              onClick={

                handleSaveAttendance

              }

            >

              <FiSave />

              {saving

                ? "Saving..."

                : "Save Attendance"}

            </button>

          </div>

        </div>

        {/* RIGHT SIDEBAR */}

        <aside className="attendance-side">

          {/* DATE SUMMARY */}

          <div className="side-card">

            <div className="side-card-header">

              <h3>

                Attendance Summary

              </h3>

              <FiBarChart2 />

            </div>

            <div
              className="attendance-circle"
              style={{ "--attendance": attendancePercentage }}
              aria-label={`Attendance rate ${attendancePercentage}%`}
            >

              <div>

                <strong>

                  {attendancePercentage}%

                </strong>

                <span>

                  Attendance

                </span>

              </div>

            </div>

            <div className="attendance-summary-list">

              <SummaryItem

                color="green"

                label="Present"

                value={

                  presentCount

                }

              />

              <SummaryItem

                color="red"

                label="Absent"

                value={

                  absentCount

                }

              />

              <SummaryItem

                color="orange"

                label="Late"

                value={

                  lateCount

                }

              />

              <SummaryItem

                color="orange"

                label="Leave / Other"

                value={

                  leaveCount

                }

              />

              <SummaryItem

                color="blue"

                label="Total Marked"

                value={

                  totalMarked

                }

              />

            </div>

          </div>

          {/* SUBJECT INFORMATION */}

          <div className="side-card">

            <div className="side-card-header">

              <h3>

                Selected Class

              </h3>

              <FiBookOpen />

            </div>

            <div className="class-information">

              <div>

                <span>Subject</span>

                <strong>

                  {selectedSubject

                    ? subjects.find(

                        (subject) =>

                          subject._id ===

                          selectedSubject

                      )?.name ||

                      "Selected Subject"

                    : "Not selected"}

                </strong>

              </div>

              <div>

                <span>Date</span>

                <strong>

                  {formattedDate}

                </strong>

              </div>

              <div>

                <span>Period</span>

                <strong>

                  {selectedPeriod}

                </strong>

              </div>

              <div>

                <span>Students</span>

                <strong>

                  {filteredStudents.length}

                </strong>

              </div>

            </div>

          </div>

          {/* QUICK ACTIONS */}

          <div className="side-card">

            <div className="side-card-header">

              <h3>

                Quick Actions

              </h3>

            </div>

            <div className="quick-actions">

              <button

                onClick={

                  markAllPresent

                }

              >

                <FiCheckCircle />

                Mark All Present

              </button>

              <button

                onClick={() => {

                  setSelectedDate(
                    toLocalDateInputValue(new Date())
                  );
                  setAttendance({});

                  setCurrentPage(1);

                }}

              >

                <FiCalendar />

                Today

              </button>

              <button

                onClick={fetchData}

              >

                <FiRefreshCw />

                Refresh Data

              </button>

            </div>

          </div>

        </aside>

      </section>

      {/* FOOTER */}

      <footer className="attendance-footer">

        <div>

          <strong>

            🎓 SmartCampus

          </strong>

          <span>

            |

          </span>

          <span>

            Empowering Education Through

            Technology

          </span>

        </div>

        <div>

          <span>v1.0.0</span>

          <span>|</span>

          <span>

            Gandhi Engineering College

          </span>

        </div>

      </footer>

    </div>

  );

};

/* =========================================================

   STAT CARD

========================================================= */

const AttendanceStat = ({

  icon,

  title,

  value,

  subtitle,

  color,

}) => {

  return (

    <div className="attendance-stat-card">

      <div

        className={`attendance-stat-icon ${color}`}

      >

        {icon}

      </div>

      <div>

        <span>{title}</span>

        <strong>{value}</strong>

        <small>{subtitle}</small>

      </div>

    </div>

  );

};

/* =========================================================

   SUMMARY ITEM

========================================================= */

const SummaryItem = ({

  color,

  label,

  value,

}) => {

  return (

    <div className="summary-item">

      <div>

        <span

          className={`summary-dot ${color}`}

        />

        <span>{label}</span>

      </div>

      <strong>{value}</strong>

    </div>

  );

};

export default AttendanceManagement;
