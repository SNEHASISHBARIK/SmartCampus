import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "./Subjects.css";

const initialForm = {
  name: "",
  code: "",
  department: "",
  semester: "",
  credits: "",
  faculty: "",
  isActive: true,
};

const Subjects = () => {
  // =========================================================
  // STATE
  // =========================================================

  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [facultyList, setFacultyList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);

  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Form
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState("");

  const subjectsPerPage = 10;

  // =========================================================
  // FETCH SUBJECTS
  // =========================================================

  const fetchSubjects = async () => {
    try {
      setError("");

      const response = await api.get("/admin/subjects");

      const data = response.data;

      const list =
        data.subjects ||
        data.data?.subjects ||
        data.data ||
        [];

      setSubjects(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error fetching subjects:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load subjects."
      );
    }
  };

  // =========================================================
  // FETCH DEPARTMENTS
  // =========================================================

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/admin/departments");

      const data = response.data;

      const list =
        data.departments ||
        data.data?.departments ||
        data.data ||
        [];

      setDepartments(
        Array.isArray(list)
          ? list.filter(
              (department) =>
                department.isActive !== false
            )
          : []
      );
    } catch (err) {
      console.error(
        "Error fetching departments:",
        err
      );
    }
  };

  // =========================================================
  // FETCH FACULTY
  // =========================================================

  const fetchFaculty = async () => {
    try {
      const response = await api.get("/admin/faculty");

      const data = response.data;

      const list =
        data.faculty ||
        data.data?.faculty ||
        data.data ||
        [];

      setFacultyList(
        Array.isArray(list)
          ? list.filter(
              (faculty) =>
                faculty.status === "active"
            )
          : []
      );
    } catch (err) {
      console.error(
        "Error fetching faculty:",
        err
      );
    }
  };

  // =========================================================
  // FETCH ALL DATA
  // =========================================================

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        fetchSubjects(),
        fetchDepartments(),
        fetchFaculty(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // =========================================================
  // HELPERS
  // =========================================================

  const getCode = (subject) => {
    return subject.code || "-";
  };

  const getName = (subject) => {
    return subject.name || "-";
  };

  const getDepartment = (subject) => {
    if (!subject.department) {
      return "-";
    }

    if (typeof subject.department === "string") {
      return subject.department;
    }

    return (
      subject.department.code ||
      subject.department.name ||
      "-"
    );
  };

  const getDepartmentName = (subject) => {
    if (!subject.department) {
      return "-";
    }

    if (typeof subject.department === "string") {
      return subject.department;
    }

    return (
      subject.department.name ||
      subject.department.code ||
      "-"
    );
  };

  const getSemester = (subject) => {
    return subject.semester ?? "-";
  };

  const getCredits = (subject) => {
    return subject.credits ?? "-";
  };

  const getFaculty = (subject) => {
    if (!subject.faculty) {
      return "Not Assigned";
    }

    if (typeof subject.faculty === "string") {
      return subject.faculty;
    }

    return (
      subject.faculty.user?.name ||
      subject.faculty.facultyId ||
      subject.faculty.employeeId ||
      subject.faculty.designation ||
      "Assigned"
    );
  };

  const getStatus = (subject) => {
    return subject.isActive === false
      ? "inactive"
      : "active";
  };

  // =========================================================
  // STATISTICS
  // =========================================================

  const totalSubjects = subjects.length;

  const assignedSubjects = subjects.filter(
    (subject) => subject.faculty
  ).length;

  const unassignedSubjects = subjects.filter(
    (subject) => !subject.faculty
  ).length;

  const activeSubjects = subjects.filter(
    (subject) =>
      getStatus(subject) === "active"
  ).length;

  // =========================================================
  // DEPARTMENT OPTIONS
  // =========================================================

  const departmentOptions = useMemo(() => {
    return departments
      .filter(
        (department) =>
          department.isActive !== false
      )
      .sort((a, b) =>
        String(a.code || "").localeCompare(
          String(b.code || "")
        )
      );
  }, [departments]);

  // =========================================================
  // FILTER SUBJECTS
  // =========================================================

  const filteredSubjects = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return subjects.filter((subject) => {
      const code = getCode(subject).toLowerCase();

      const name = getName(subject).toLowerCase();

      const department =
        getDepartment(subject).toLowerCase();

      const semester = String(
        getSemester(subject)
      );

      const matchesSearch =
        !searchValue ||
        code.includes(searchValue) ||
        name.includes(searchValue) ||
        department.includes(searchValue);

      const matchesDepartment =
        departmentFilter === "all" ||
        getDepartment(subject) ===
          departmentFilter;

      const matchesSemester =
        semesterFilter === "all" ||
        semester === semesterFilter;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesSemester
      );
    });
  }, [
    subjects,
    search,
    departmentFilter,
    semesterFilter,
  ]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredSubjects.length /
        subjectsPerPage
    )
  );

  const safePage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safePage - 1) *
    subjectsPerPage;

  const currentSubjects =
    filteredSubjects.slice(
      startIndex,
      startIndex + subjectsPerPage
    );

  // =========================================================
  // FORM CHANGE
  // =========================================================

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setFormError("");
  };

  // =========================================================
  // OPEN ADD MODAL
  // =========================================================

  const openAddModal = () => {
    setModalMode("add");
    setSelectedSubject(null);
    setForm({
      ...initialForm,
      isActive: true,
    });
    setFormError("");
    setShowModal(true);
  };

  // =========================================================
  // OPEN EDIT MODAL
  // =========================================================

  const openEditModal = async (subject) => {
    try {
      setFormLoading(true);
      setFormError("");

      const response = await api.get(
        `/admin/subjects/${subject._id}`
      );

      const data = response.data.subject;

      setSelectedSubject(data);
      setModalMode("edit");

      setForm({
        name: data.name || "",

        code: data.code || "",

        department:
          data.department?.code ||
          data.department ||
          "",

        semester: data.semester ?? "",

        credits: data.credits ?? "",

        faculty:
          data.faculty?._id ||
          data.faculty ||
          "",

        // IMPORTANT:
        // false stays false
        // undefined/null becomes true
        isActive:
          data.isActive !== false,
      });

      setShowModal(true);
    } catch (err) {
      console.error(
        "Error fetching subject:",
        err
      );

      setFormError(
        err.response?.data?.message ||
          "Unable to load subject details."
      );
    } finally {
      setFormLoading(false);
    }
  };

  // =========================================================
  // CLOSE MODAL
  // =========================================================

  const closeModal = () => {
    if (formLoading) {
      return;
    }

    setShowModal(false);
    setSelectedSubject(null);
    setForm(initialForm);
    setFormError("");
  };

  // =========================================================
  // CREATE / UPDATE SUBJECT
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setFormError("");

    if (
      !form.name.trim() ||
      !form.code.trim() ||
      !form.department ||
      !form.semester ||
      !form.credits
    ) {
      setFormError(
        "Name, code, department, semester and credits are required."
      );

      return;
    }

    try {
      setFormLoading(true);

      const payload = {
        name: form.name.trim(),

        code: form.code
          .trim()
          .toUpperCase(),

        department: form.department,

        semester: Number(form.semester),

        credits: Number(form.credits),

        faculty: form.faculty || null,

        // IMPORTANT
        // Backend updateSubject supports isActive
        isActive: form.isActive,
      };

      if (modalMode === "add") {
        await api.post(
          "/admin/subjects",
          payload
        );
      } else {
        await api.put(
          `/admin/subjects/${selectedSubject._id}`,
          payload
        );
      }

      closeModal();

      await fetchSubjects();
    } catch (err) {
      console.error(
        "Save subject error:",
        err
      );

      setFormError(
        err.response?.data?.message ||
          "Unable to save subject."
      );
    } finally {
      setFormLoading(false);
    }
  };

  // =========================================================
  // VIEW SUBJECT
  // =========================================================

  const handleView = async (subject) => {
    try {
      setFormLoading(true);
      setFormError("");

      const response = await api.get(
        `/admin/subjects/${subject._id}`
      );

      setSelectedSubject(
        response.data.subject
      );

      setModalMode("view");
      setShowModal(true);
    } catch (err) {
      console.error(
        "Error fetching subject:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Unable to load subject."
      );
    } finally {
      setFormLoading(false);
    }
  };

  // =========================================================
  // DEACTIVATE SUBJECT
  // =========================================================

  const handleDeactivate = async (subject) => {
    if (!subject?._id) {
      return;
    }

    if (getStatus(subject) === "inactive") {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${getName(
        subject
      )}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.patch(
        `/admin/subjects/${subject._id}/deactivate`
      );

      await fetchSubjects();
    } catch (err) {
      console.error(
        "Deactivate subject error:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Unable to deactivate subject."
      );
    }
  };

  // =========================================================
  // ACTIVATE SUBJECT
  // =========================================================

  const handleActivate = async (subject) => {
    if (!subject?._id) {
      return;
    }

    if (getStatus(subject) === "active") {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to activate ${getName(
        subject
      )}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      // There is no separate activate endpoint.
      // Backend updateSubject supports isActive.
      await api.put(
        `/admin/subjects/${subject._id}`,
        {
          isActive: true,
        }
      );

      await fetchSubjects();
    } catch (err) {
      console.error(
        "Activate subject error:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Unable to activate subject."
      );
    }
  };

  // =========================================================
  // RESET FILTERS
  // =========================================================

  const handleReset = () => {
    setSearch("");
    setDepartmentFilter("all");
    setSemesterFilter("all");
    setCurrentPage(1);
  };

  // =========================================================
  // EXPORT CSV
  // =========================================================

  const handleExport = () => {
    if (!filteredSubjects.length) {
      alert("No subject data to export.");
      return;
    }

    const headers = [
      "Subject Code",
      "Subject Name",
      "Department",
      "Semester",
      "Credits",
      "Faculty",
      "Status",
    ];

    const rows = filteredSubjects.map(
      (subject) => [
        getCode(subject),
        getName(subject),
        getDepartment(subject),
        getSemester(subject),
        getCredits(subject),
        getFaculty(subject),
        getStatus(subject),
      ]
    );

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value).replace(
                /"/g,
                '""'
              )}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "smartcampus-subjects.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="subjects-loading">
        <div className="subjects-spinner"></div>

        <p>Loading subjects...</p>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="subjects-page">

      {/* =====================================================
          BREADCRUMB
      ====================================================== */}

      <div className="subjects-breadcrumb">
        <span>⌂</span>

        <span>Dashboard</span>

        <b>›</b>

        <strong>Subjects</strong>
      </div>

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="subjects-page-header">

        <div>
          <h1>Subjects</h1>

          <p>
            Manage subjects, departments,
            semesters, credits and faculty
            assignments.
          </p>
        </div>

        <div className="subjects-header-right">

          <span className="subjects-date">
            {new Date().toLocaleDateString(
              "en-IN",
              {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric",
              }
            )}
          </span>

          <button
            className="add-subject-btn"
            type="button"
            onClick={openAddModal}
          >
            <span>＋</span>

            Add Subject
          </button>

        </div>
      </div>

      {/* =====================================================
          STAT CARDS
      ====================================================== */}

      <div className="subject-stat-grid">

        <SubjectStatCard
          type="blue"
          icon="📖"
          title="Total Subjects"
          value={totalSubjects}
          text="All registered subjects"
        />

        <SubjectStatCard
          type="purple"
          icon="👨‍🏫"
          title="Assigned Faculty"
          value={assignedSubjects}
          text="Subjects with faculty"
        />

        <SubjectStatCard
          type="orange"
          icon="📚"
          title="Unassigned"
          value={unassignedSubjects}
          text="Subjects without faculty"
        />

        <SubjectStatCard
          type="green"
          icon="✓"
          title="Active Subjects"
          value={activeSubjects}
          text="Currently offered"
        />

      </div>

      {/* =====================================================
          FILTERS
      ====================================================== */}

      <div className="subjects-filter-panel">

        <div className="subject-search-box">

          <span>⌕</span>

          <input
            type="text"
            placeholder="Search by subject name or code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />

        </div>

        <select
          value={departmentFilter}
          onChange={(e) => {
            setDepartmentFilter(
              e.target.value
            );

            setCurrentPage(1);
          }}
        >
          <option value="all">
            All Departments
          </option>

          {departmentOptions.map(
            (department) => (
              <option
                key={department._id}
                value={department.code}
              >
                {department.code} -{" "}
                {department.name}
              </option>
            )
          )}
        </select>

        <select
          value={semesterFilter}
          onChange={(e) => {
            setSemesterFilter(
              e.target.value
            );

            setCurrentPage(1);
          }}
        >
          <option value="all">
            All Semesters
          </option>

          {[1, 2, 3, 4, 5, 6, 7, 8].map(
            (semester) => (
              <option
                key={semester}
                value={semester}
              >
                Semester {semester}
              </option>
            )
          )}
        </select>

        <button
          className="subject-reset-btn"
          type="button"
          onClick={handleReset}
        >
          ↻ Reset
        </button>

      </div>

      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="subjects-error">
          {error}
        </div>
      )}

      {/* =====================================================
          TABLE
      ====================================================== */}

      <div className="subjects-table-card">

        <div className="subjects-table-wrapper">

          <table className="subjects-table">

            <thead>
              <tr>
                <th>#</th>

                <th>Subject Code</th>

                <th>Subject Name</th>

                <th>Department</th>

                <th>Semester</th>

                <th>Credits</th>

                <th>Faculty Assigned</th>

                <th>Status</th>

                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {currentSubjects.length === 0 ? (

                <tr>
                  <td
                    colSpan="9"
                    className="subjects-empty"
                  >
                    <div>

                      <span>📚</span>

                      <strong>
                        No subjects found
                      </strong>

                      <small>
                        Try changing your
                        search or filters.
                      </small>

                    </div>
                  </td>
                </tr>

              ) : (

                currentSubjects.map(
                  (subject, index) => {

                    const status =
                      getStatus(subject);

                    return (
                      <tr
                        key={subject._id}
                      >

                        {/* NUMBER */}

                        <td>
                          {startIndex +
                            index +
                            1}
                        </td>

                        {/* CODE */}

                        <td>
                          <span className="subject-code">
                            {getCode(subject)}
                          </span>
                        </td>

                        {/* NAME */}

                        <td>
                          <div className="subject-name-cell">

                            <div className="subject-icon">
                              📘
                            </div>

                            <div>
                              <strong>
                                {getName(
                                  subject
                                )}
                              </strong>

                              <small>
                                {getCode(
                                  subject
                                )}
                              </small>
                            </div>

                          </div>
                        </td>

                        {/* DEPARTMENT */}

                        <td>
                          <span className="subject-department">
                            {getDepartment(
                              subject
                            )}
                          </span>
                        </td>

                        {/* SEMESTER */}

                        <td className="subject-semester">
                          {getSemester(
                            subject
                          )}
                        </td>

                        {/* CREDITS */}

                        <td className="subject-credits">
                          {getCredits(
                            subject
                          )}
                        </td>

                        {/* FACULTY */}

                        <td>
                          <span className="subject-faculty">
                            {getFaculty(
                              subject
                            )}
                          </span>
                        </td>

                        {/* STATUS */}

                        <td>
                          <span
                            className={`subject-status ${
                              status === "active"
                                ? "subject-active"
                                : "subject-inactive"
                            }`}
                          >
                            <span></span>

                            {status === "active"
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        {/* ACTIONS */}

                        <td>

                          <div className="subject-actions">

                            {/* VIEW */}

                            <button
                              type="button"
                              className="subject-view"
                              title="View"
                              onClick={() =>
                                handleView(
                                  subject
                                )
                              }
                            >
                              👁
                            </button>

                            {/* EDIT */}

                            <button
                              type="button"
                              className="subject-edit"
                              title="Edit"
                              onClick={() =>
                                openEditModal(
                                  subject
                                )
                              }
                            >
                              ✎
                            </button>

                            {/* ACTIVE / INACTIVE */}

                            {status ===
                            "active" ? (

                              <button
                                type="button"
                                className="subject-delete"
                                title="Deactivate"
                                onClick={() =>
                                  handleDeactivate(
                                    subject
                                  )
                                }
                              >
                                ⏸
                              </button>

                            ) : (

                              <button
                                type="button"
                                className="subject-activate"
                                title="Activate"
                                onClick={() =>
                                  handleActivate(
                                    subject
                                  )
                                }
                              >
                                ▶
                              </button>

                            )}

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )

              )}

            </tbody>

          </table>

        </div>

        {/* =================================================
            TABLE FOOTER
        ================================================== */}

        <div className="subjects-table-footer">

          <div className="subjects-count">

            Showing{" "}

            {filteredSubjects.length === 0
              ? 0
              : startIndex + 1}

            –

            {Math.min(
              startIndex +
                subjectsPerPage,
              filteredSubjects.length
            )}{" "}

            of{" "}

            {filteredSubjects.length}{" "}

            subjects

          </div>

          {/* PAGINATION */}

          <div className="subjects-pagination">

            <button
              disabled={safePage === 1}
              onClick={() =>
                setCurrentPage(
                  Math.max(
                    1,
                    safePage - 1
                  )
                )
              }
            >
              ‹
            </button>

            {Array.from(
              {
                length: Math.min(
                  totalPages,
                  5
                ),
              },
              (_, index) =>
                index + 1
            ).map((page) => (

              <button
                key={page}
                className={
                  safePage === page
                    ? "subject-page-active"
                    : ""
                }
                onClick={() =>
                  setCurrentPage(page)
                }
              >
                {page}
              </button>

            ))}

            {totalPages > 5 && (
              <>
                <span>...</span>

                <button
                  onClick={() =>
                    setCurrentPage(
                      totalPages
                    )
                  }
                >
                  {totalPages}
                </button>
              </>
            )}

            <button
              disabled={
                safePage === totalPages
              }
              onClick={() =>
                setCurrentPage(
                  Math.min(
                    totalPages,
                    safePage + 1
                  )
                )
              }
            >
              ›
            </button>

          </div>

        </div>

      </div>

      {/* =====================================================
          EXPORT
      ====================================================== */}

      <div className="subjects-bottom-actions">

        <button
          type="button"
          onClick={handleExport}
        >
          ↓ Export to CSV
        </button>

      </div>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <div className="subjects-page-footer">

        <div>
          🎓

          <strong>SmartCampus</strong>

          <span>|</span>

          <span>
            Empowering Education Through
            Technology
          </span>
        </div>

        <div>

          <span>v1.0.0</span>

          <span>|</span>

          <strong>
            Gandhi Engineering College
          </strong>

        </div>

      </div>

      {/* =====================================================
          ADD / EDIT / VIEW MODAL
      ====================================================== */}

      {showModal && (

        <div
          className="subject-modal-overlay"
          onMouseDown={(e) => {

            if (
              e.target === e.currentTarget &&
              !formLoading
            ) {
              closeModal();
            }

          }}
        >

          <div className="subject-modal">

            {/* MODAL HEADER */}

            <div className="subject-modal-header">

              <div>

                <h2>
                  {modalMode === "add"
                    ? "Add Subject"
                    : modalMode === "edit"
                    ? "Edit Subject"
                    : "Subject Details"}
                </h2>

                <p>
                  {modalMode === "view"
                    ? "View complete subject information."
                    : "Enter the subject information below."}
                </p>

              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={formLoading}
              >
                ×
              </button>

            </div>

            {/* MODAL ERROR */}

            {formError && (
              <div className="subject-modal-error">
                {formError}
              </div>
            )}

            {/* =================================================
                VIEW MODE
            ================================================== */}

            {modalMode === "view" ? (

              <div className="subject-view-details">

                <div className="subject-detail-item">
                  <span>Subject Name</span>

                  <strong>
                    {selectedSubject?.name ||
                      "-"}
                  </strong>
                </div>

                <div className="subject-detail-item">
                  <span>Subject Code</span>

                  <strong>
                    {selectedSubject?.code ||
                      "-"}
                  </strong>
                </div>

                <div className="subject-detail-item">
                  <span>Department</span>

                  <strong>
                    {getDepartmentName(
                      selectedSubject || {}
                    )}
                  </strong>
                </div>

                <div className="subject-detail-item">
                  <span>Semester</span>

                  <strong>
                    {selectedSubject?.semester ??
                      "-"}
                  </strong>
                </div>

                <div className="subject-detail-item">
                  <span>Credits</span>

                  <strong>
                    {selectedSubject?.credits ??
                      "-"}
                  </strong>
                </div>

                <div className="subject-detail-item">
                  <span>Faculty</span>

                  <strong>
                    {getFaculty(
                      selectedSubject || {}
                    )}
                  </strong>
                </div>

                <div className="subject-detail-item">
                  <span>Status</span>

                  <strong>
                    {selectedSubject?.isActive ===
                    false
                      ? "Inactive"
                      : "Active"}
                  </strong>
                </div>

                <div className="subject-modal-footer">

                  <button
                    type="button"
                    onClick={closeModal}
                  >
                    Close
                  </button>

                </div>

              </div>

            ) : (

              /* =================================================
                  ADD / EDIT FORM
              ================================================== */

              <form
                onSubmit={handleSubmit}
                className="subject-form"
              >

                <div className="subject-form-grid">

                  {/* SUBJECT NAME */}

                  <div className="subject-form-group">

                    <label>
                      Subject Name *
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={
                        handleFormChange
                      }
                      placeholder="e.g. Data Structures"
                      disabled={formLoading}
                    />

                  </div>

                  {/* SUBJECT CODE */}

                  <div className="subject-form-group">

                    <label>
                      Subject Code *
                    </label>

                    <input
                      type="text"
                      name="code"
                      value={form.code}
                      onChange={
                        handleFormChange
                      }
                      placeholder="e.g. CS301"
                      disabled={formLoading}
                    />

                  </div>

                  {/* DEPARTMENT */}

                  <div className="subject-form-group">

                    <label>
                      Department *
                    </label>

                    <select
                      name="department"
                      value={form.department}
                      onChange={
                        handleFormChange
                      }
                      disabled={formLoading}
                    >

                      <option value="">
                        Select Department
                      </option>

                      {departmentOptions.map(
                        (department) => (

                          <option
                            key={department._id}
                            value={department.code}
                          >
                            {department.code} -{" "}
                            {department.name}
                          </option>

                        )
                      )}

                    </select>

                  </div>

                  {/* SEMESTER */}

                  <div className="subject-form-group">

                    <label>
                      Semester *
                    </label>

                    <select
                      name="semester"
                      value={form.semester}
                      onChange={
                        handleFormChange
                      }
                      disabled={formLoading}
                    >

                      <option value="">
                        Select Semester
                      </option>

                      {[
                        1,
                        2,
                        3,
                        4,
                        5,
                        6,
                        7,
                        8,
                      ].map(
                        (semester) => (

                          <option
                            key={semester}
                            value={semester}
                          >
                            Semester{" "}
                            {semester}
                          </option>

                        )
                      )}

                    </select>

                  </div>

                  {/* CREDITS */}

                  <div className="subject-form-group">

                    <label>
                      Credits *
                    </label>

                    <input
                      type="number"
                      name="credits"
                      min="1"
                      max="10"
                      step="1"
                      value={form.credits}
                      onChange={
                        handleFormChange
                      }
                      placeholder="e.g. 4"
                      disabled={formLoading}
                    />

                  </div>

                  {/* FACULTY */}

                  <div className="subject-form-group">

                    <label>
                      Faculty
                    </label>

                    <select
                      name="faculty"
                      value={form.faculty}
                      onChange={
                        handleFormChange
                      }
                      disabled={formLoading}
                    >

                      <option value="">
                        No Faculty Assigned
                      </option>

                      {facultyList.map(
                        (faculty) => (

                          <option
                            key={faculty._id}
                            value={faculty._id}
                          >
                            {faculty.user?.name ||
                              faculty.facultyId ||
                              faculty.employeeId ||
                              "Faculty"}{" "}
                            —{" "}
                            {faculty.designation ||
                              ""}
                          </option>

                        )
                      )}

                    </select>

                  </div>

                  {/* STATUS */}

                  <div className="subject-form-group">

                    <label>
                      Status
                    </label>

                    <select
                      name="isActive"
                      value={
                        form.isActive
                          ? "true"
                          : "false"
                      }
                      onChange={(e) =>
                        setForm(
                          (previous) => ({
                            ...previous,

                            isActive:
                              e.target.value ===
                              "true",
                          })
                        )
                      }
                      disabled={formLoading}
                    >

                      <option value="true">
                        Active
                      </option>

                      <option value="false">
                        Inactive
                      </option>

                    </select>

                  </div>

                </div>

                {/* FORM FOOTER */}

                <div className="subject-modal-footer">

                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={formLoading}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={formLoading}
                  >
                    {formLoading
                      ? "Saving..."
                      : modalMode === "add"
                      ? "Create Subject"
                      : "Update Subject"}
                  </button>

                </div>

              </form>

            )}

          </div>

        </div>

      )}

    </div>
  );
};

// =========================================================
// STAT CARD
// =========================================================

const SubjectStatCard = ({
  type,
  icon,
  title,
  value,
  text,
}) => {

  return (
    <div
      className={`subject-stat-card ${type}`}
    >

      <div className="subject-stat-icon">
        {icon}
      </div>

      <div className="subject-stat-content">

        <span>{title}</span>

        <strong>{value}</strong>

        <small>{text}</small>

      </div>

    </div>
  );
};

export default Subjects;