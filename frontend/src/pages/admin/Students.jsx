import { useEffect, useMemo, useState } from "react";
import DatePickerInput from "../../components/DatePickerInput";
import api from "../../services/api";
import "./Students.css";

const emptyStudentForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  studentId: "",
  rollNumber: "",
  department: "",
  semester: "",
  subjects: [],
  section: "",
  batch: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  guardianName: "",
  guardianPhone: "",
  admissionDate: "",
  status: "active",
};

const Students = () => {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [subjectsError, setSubjectsError] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;

  // MODALS
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState(null);

  const [addForm, setAddForm] = useState({
    ...emptyStudentForm,
  });

  const [editForm, setEditForm] = useState({
    ...emptyStudentForm,
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // =========================================================
  // FETCH STUDENTS
  // =========================================================

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/students");

      const data = response.data;

      const studentList =
        data.students ||
        data.data?.students ||
        data.data ||
        [];

      setStudents(
        Array.isArray(studentList) ? studentList : []
      );
    } catch (err) {
      console.error("Error fetching students:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load students."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FETCH DEPARTMENTS
  // =========================================================

  const fetchDepartments = async () => {
    try {
      const response = await api.get("/admin/departments");

      const data = response.data;
      
      const departmentList =
        data.departments ||
        data.data?.departments ||
        data.data ||
        [];

      setDepartments(
        Array.isArray(departmentList)
          ? departmentList
          : []
      );
    } catch (err) {
      console.error(
        "Error fetching departments:",
        err
      );
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await api.get("/admin/subjects");
      const subjectList = response.data?.subjects;
      if (!Array.isArray(subjectList)) {
        throw new Error("Subjects response has an invalid format.");
      }
      setAvailableSubjects(subjectList);
      setSubjectsError("");
    } catch (err) {
      console.error("Error fetching subjects:", err);
      setSubjectsError(
        err.response?.data?.message || "Unable to load subjects."
      );
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchDepartments();
    fetchSubjects();
  }, []);

  // =========================================================
  // DATA HELPERS
  // =========================================================

  const getStudentName = (student) => {
    return student.user?.name || student.name || "-";
  };

  const getStudentEmail = (student) => {
    return student.user?.email || student.email || "-";
  };

  const getStudentPhone = (student) => {
    return (
      student.user?.phone ||
      student.phone ||
      "-"
    );
  };

  const getDepartment = (student) => {
    return (
      student.department?.code ||
      student.department?.name ||
      "-"
    );
  };

  const getStatus = (student) => {
    return (
      student.status ||
      (student.user?.isActive
        ? "active"
        : "inactive") ||
      "active"
    );
  };

  // =========================================================
  // STATISTICS
  // =========================================================

  const totalStudents = students.length;

  const activeStudents = students.filter(
    (student) =>
      getStatus(student).toLowerCase() ===
      "active"
  ).length;

  const inactiveStudents =
    students.filter(
      (student) =>
        getStatus(student).toLowerCase() !==
        "active"
    ).length;

  const newThisMonth = students.filter(
    (student) => {
      if (!student.createdAt) return false;

      const created = new Date(
        student.createdAt
      );

      const now = new Date();

      return (
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      );
    }
  ).length;

  // =========================================================
  // FILTER
  // =========================================================

  const filteredStudents = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return students.filter((student) => {
      const name =
        getStudentName(student).toLowerCase();

      const email =
        getStudentEmail(student).toLowerCase();

      const rollNumber = String(
        student.rollNumber || ""
      ).toLowerCase();

      const studentId = String(
        student.studentId || ""
      ).toLowerCase();

      const department =
        getDepartment(student).toLowerCase();

      const status =
        getStatus(student).toLowerCase();

      const semester = String(
        student.semester || ""
      );

      const matchesSearch =
        !searchValue ||
        name.includes(searchValue) ||
        email.includes(searchValue) ||
        rollNumber.includes(searchValue) ||
        studentId.includes(searchValue) ||
        department.includes(searchValue);

      const matchesDepartment =
        departmentFilter === "all" ||
        department ===
          departmentFilter.toLowerCase();

      const matchesSemester =
        semesterFilter === "all" ||
        semester === semesterFilter;

      const matchesStatus =
        statusFilter === "all" ||
        status === statusFilter;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesSemester &&
        matchesStatus
      );
    });
  }, [
    students,
    search,
    departmentFilter,
    semesterFilter,
    statusFilter,
  ]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredStudents.length /
        studentsPerPage
    )
  );

  const safePage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safePage - 1) *
    studentsPerPage;

  const currentStudents =
    filteredStudents.slice(
      startIndex,
      startIndex + studentsPerPage
    );

  // =========================================================
  // RESET
  // =========================================================

  const handleReset = () => {
    setSearch("");
    setDepartmentFilter("all");
    setSemesterFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  // =========================================================
  // ADD STUDENT
  // =========================================================

  const handleAddStudent = async (e) => {
    e.preventDefault();

    if (
      !addForm.name ||
      !addForm.email ||
      !addForm.password ||
      !addForm.studentId ||
      !addForm.rollNumber ||
      !addForm.department ||
      !addForm.semester
    ) {
      alert(
        "Please fill all required fields."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...addForm,
        semester: Number(addForm.semester),
        subjects: addForm.subjects,
      };

      const response = await api.post(
        "/admin/students",
        payload
      );

      if (response.data?.success) {
        alert(
          "Student created successfully."
        );

        setShowAddModal(false);

        setAddForm({
          ...emptyStudentForm,
        });

        await fetchStudents();
      }
    } catch (err) {
      console.error(
        "Error creating student:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Unable to create student."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // VIEW STUDENT
  // =========================================================

  const handleView = async (student) => {
    try {
      const response = await api.get(
        `/admin/students/${student._id}`
      );

      setSelectedStudent(
        response.data?.student || student
      );

      setShowViewModal(true);
    } catch (err) {
      console.error(
        "Error fetching student:",
        err
      );

      setSelectedStudent(student);
      setShowViewModal(true);
    }
  };

  // =========================================================
  // EDIT STUDENT
  // =========================================================

  const handleEdit = async (student) => {
    try {
      const response = await api.get(
        `/admin/students/${student._id}`
      );

      const data =
        response.data?.student || student;

      setSelectedStudent(data);

      setEditForm({
        name: data.user?.name || "",
        email: data.user?.email || "",
        password: "",
        phone: data.user?.phone || "",
        studentId: data.studentId || "",
        rollNumber: data.rollNumber || "",
        department:
          data.department?.code || "",
        semester:
          data.semester
            ? String(data.semester)
            : "",
        subjects: Array.isArray(data.subjects)
          ? data.subjects.map((subject) =>
              String(subject._id || subject)
            )
          : [],
        section: data.section || "",
        batch: data.batch || "",
        dateOfBirth: data.dateOfBirth
          ? String(data.dateOfBirth).substring(
              0,
              10
            )
          : "",
        gender: data.gender || "",
        address: data.address || "",
        guardianName:
          data.guardianName || "",
        guardianPhone:
          data.guardianPhone || "",
        admissionDate: data.admissionDate
          ? String(
              data.admissionDate
            ).substring(0, 10)
          : "",
        status:
          data.status || "active",
      });

      setShowEditModal(true);
    } catch (err) {
      console.error(
        "Error loading student:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Unable to load student."
      );
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();

    if (!selectedStudent?._id) return;

    try {
      setSaving(true);

      const payload = {
        name: editForm.name,
        phone: editForm.phone,
        department: editForm.department,
        semester: Number(
          editForm.semester
        ),
        subjects: editForm.subjects,
        section: editForm.section,
        batch: editForm.batch,
        dateOfBirth:
          editForm.dateOfBirth || undefined,
        gender: editForm.gender,
        address: editForm.address,
        guardianName:
          editForm.guardianName,
        guardianPhone:
          editForm.guardianPhone,
        admissionDate:
          editForm.admissionDate ||
          undefined,
        status: editForm.status,
      };

      const response = await api.put(
        `/admin/students/${selectedStudent._id}`,
        payload
      );

      if (response.data?.success) {
        alert(
          "Student updated successfully."
        );

        setShowEditModal(false);
        setSelectedStudent(null);

        await fetchStudents();
      }
    } catch (err) {
      console.error(
        "Error updating student:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Unable to update student."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // CHANGE PASSWORD
  // =========================================================

  const openPasswordModal = (student) => {
    setSelectedStudent(student);
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordModal(true);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!selectedStudent?._id) return;

    if (!newPassword) {
      alert("Enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      alert(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      alert(
        "Passwords do not match."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await api.patch(
        `/admin/students/${selectedStudent._id}/password`,
        {
          password: newPassword,
        }
      );

      if (response.data?.success) {
        alert(
          "Student password updated successfully."
        );

        setShowPasswordModal(false);
        setNewPassword("");
        setConfirmPassword("");
        setSelectedStudent(null);
      }
    } catch (err) {
      console.error(
        "Error changing password:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Unable to change password."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // ACTIVATE / DEACTIVATE
  // =========================================================

  const handleToggleStatus = async (
    student
  ) => {
    const currentStatus =
      getStatus(student).toLowerCase();

    const isActive =
      currentStatus === "active";

    const action = isActive
      ? "deactivate"
      : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${getStudentName(
        student
      )}?`
    );

    if (!confirmed) return;

    try {
      if (isActive) {
        await api.patch(
          `/admin/students/${student._id}/deactivate`
        );
      } else {
        await api.patch(
          `/admin/students/${student._id}/activate`
        );
      }

      await fetchStudents();

      alert(
        `Student ${action}d successfully.`
      );
    } catch (err) {
      console.error(
        "Error changing student status:",
        err
      );

      alert(
        err.response?.data?.message ||
          `Unable to ${action} student.`
      );
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (student) => {
    const confirmed = window.confirm(
      `Delete ${getStudentName(
        student
      )}? This action may remove the student account.`
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/admin/students/${student._id}`
      );

      setStudents((prev) =>
        prev.filter(
          (item) =>
            item._id !== student._id
        )
      );

      alert(
        "Student deleted successfully."
      );
    } catch (err) {
      console.error(
        "Error deleting student:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Delete endpoint is not available."
      );
    }
  };

  // =========================================================
  // EXPORT CSV
  // =========================================================

  const handleExport = () => {
    if (!filteredStudents.length) {
      alert(
        "No student data to export."
      );
      return;
    }

    const headers = [
      "Student ID",
      "Roll Number",
      "Name",
      "Department",
      "Semester",
      "Email",
      "Phone",
      "Status",
    ];

    const rows = filteredStudents.map(
      (student) => [
        student.studentId || "",
        student.rollNumber || "",
        getStudentName(student),
        getDepartment(student),
        student.semester || "",
        getStudentEmail(student),
        getStudentPhone(student),
        getStatus(student),
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
      "smartcampus-students.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // =========================================================
  // INPUT HELPERS
  // =========================================================

  const updateAddForm = (field, value) => {
    setAddForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateEditForm = (
    field,
    value
  ) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="students-loading">
        <div className="students-spinner"></div>
        <p>Loading students...</p>
      </div>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="students-page">

      {/* HEADER */}

      <div className="students-breadcrumb">
        <span>⌂</span>
        <span>Dashboard</span>
        <b>›</b>
        <strong>Students</strong>
      </div>

      <div className="students-page-header">
        <div>
          <h1>Students</h1>

          <p>
            Manage student records, view details
            and track academic progress.
          </p>
        </div>

        <button
          className="add-student-btn"
          type="button"
          onClick={() =>
            setShowAddModal(true)
          }
        >
          <span>＋</span>
          Add Student
        </button>
      </div>

      {/* STAT CARDS */}

      <div className="student-stat-grid">

        <StatCard
          icon="👥"
          title="Total Students"
          value={totalStudents}
          type="blue"
        />

        <StatCard
          icon="✓"
          title="Active Students"
          value={activeStudents}
          type="green"
        />

        <StatCard
          icon="👤"
          title="Inactive Students"
          value={inactiveStudents}
          type="red"
        />

        <StatCard
          icon="🎓"
          title="New This Month"
          value={newThisMonth}
          type="purple"
        />

      </div>

      {/* FILTER PANEL */}

      <div className="students-filter-panel">

        <div className="student-search-box">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search by name, roll number..."
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

          {departments.map(
            (department) => (
              <option
                key={department._id}
                value={department.code}
              >
                {department.code}
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
                value={String(semester)}
              >
                Semester {semester}
              </option>
            )
          )}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(
              e.target.value
            );
            setCurrentPage(1);
          }}
        >
          <option value="all">
            All Status
          </option>

          <option value="active">
            Active
          </option>

          <option value="inactive">
            Inactive
          </option>
        </select>

        <button
          className="filter-btn"
          type="button"
        >
          <span>⌕</span>
          Filter
        </button>

        <button
          className="reset-btn"
          type="button"
          onClick={handleReset}
        >
          ↻
          <span>Reset</span>
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div className="students-error">
          {error}
        </div>
      )}

      {/* TABLE */}

      <div className="students-table-card">

        <div className="students-table-wrapper">

          <table className="students-table">

            <thead>
              <tr>
                <th className="checkbox-column">
                  <input type="checkbox" />
                </th>

                <th>#</th>
                <th>Roll Number</th>
                <th>Name</th>
                <th>Department</th>
                <th>Semester</th>
                <th>Subjects</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {currentStudents.length === 0 ? (

                <tr>
                  <td
                    colSpan="11"
                    className="empty-students"
                  >
                    <div className="empty-icon">
                      👥
                    </div>

                    <strong>
                      No students found
                    </strong>

                    <span>
                      Try changing your
                      search or filters.
                    </span>
                  </td>
                </tr>

              ) : (

                currentStudents.map(
                  (student, index) => {

                    const status =
                      getStatus(
                        student
                      ).toLowerCase();

                    return (
                      <tr
                        key={
                          student._id
                        }
                      >

                        <td>
                          <input type="checkbox" />
                        </td>

                        <td>
                          {startIndex +
                            index +
                            1}
                        </td>

                        <td className="roll-number">
                          {student.rollNumber ||
                            "-"}
                        </td>

                        <td>

                          <div className="student-name-cell">

                            <div className="student-avatar">
                              {getStudentName(
                                student
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>

                              <strong>
                                {getStudentName(
                                  student
                                )}
                              </strong>

                              <small>
                                {student.studentId ||
                                  "-"}
                              </small>

                            </div>

                          </div>

                        </td>

                        <td>
                          <span className="department-badge">
                            {getDepartment(
                              student
                            )}
                          </span>
                        </td>

                        <td>
                          {student.semester ||
                            "-"}
                        </td>

                        <td>
                          <span className="student-subject-count">
                            {Array.isArray(student.subjects)
                              ? student.subjects.length
                              : 0}{" "}
                            assigned
                          </span>
                        </td>

                        <td className="email-cell">
                          {getStudentEmail(
                            student
                          )}
                        </td>

                        <td>
                          {getStudentPhone(
                            student
                          )}
                        </td>

                        <td>

                          <span
                            className={`status-badge ${
                              status ===
                              "active"
                                ? "status-active"
                                : "status-inactive"
                            }`}
                          >
                            <span></span>

                            {status ===
                            "active"
                              ? "Active"
                              : "Inactive"}
                          </span>

                        </td>

                        <td>

                          <div className="student-actions">

                            {/* VIEW */}

                            <button
                              type="button"
                              title="View"
                              className="view-action"
                              onClick={() =>
                                handleView(
                                  student
                                )
                              }
                            >
                              👁
                            </button>

                            {/* EDIT */}

                            <button
                              type="button"
                              title="Edit"
                              className="edit-action"
                              onClick={() =>
                                handleEdit(
                                  student
                                )
                              }
                            >
                              ✎
                            </button>

                            {/* PASSWORD */}

                            <button
                              type="button"
                              title="Change Password"
                              className="edit-action"
                              onClick={() =>
                                openPasswordModal(
                                  student
                                )
                              }
                            >
                              🔑
                            </button>

                            {/* ACTIVATE / DEACTIVATE */}

                            <button
                              type="button"
                              title={
                                status ===
                                "active"
                                  ? "Deactivate"
                                  : "Activate"
                              }
                              className="delete-action"
                              onClick={() =>
                                handleToggleStatus(
                                  student
                                )
                              }
                            >
                              {status ===
                              "active"
                                ? "⛔"
                                : "✓"}
                            </button>

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

        {/* TABLE FOOTER */}

        <div className="students-table-footer">

          <div className="students-count">

            Showing{" "}

            {filteredStudents.length === 0
              ? 0
              : startIndex + 1}

            –

            {Math.min(
              startIndex +
                studentsPerPage,
              filteredStudents.length
            )}

            {" "}of{" "}
            {filteredStudents.length}
            {" "}students

          </div>

          <div className="students-footer-right">

            <div className="pagination">

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
                      ? "page-active"
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
                  safePage ===
                  totalPages
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

            <button
              className="export-btn"
              onClick={handleExport}
              type="button"
            >
              ⇩
              Export to CSV
            </button>

          </div>

        </div>

      </div>

      {/* =====================================================
          ADD STUDENT MODAL
      ===================================================== */}

      {showAddModal && (
        <StudentModal
          title="Add New Student"
          subtitle="Create student profile and login account"
          onClose={() =>
            setShowAddModal(false)
          }
        >

          <form
            onSubmit={
              handleAddStudent
            }
          >

            <StudentFormFields
              form={addForm}
              updateForm={updateAddForm}
              departments={departments}
              subjects={availableSubjects}
              subjectsError={subjectsError}
              showPassword
            />

            <ModalActions
              onCancel={() =>
                setShowAddModal(false)
              }
              saving={saving}
              submitText="Create Student"
            />

          </form>

        </StudentModal>
      )}

      {/* =====================================================
          EDIT STUDENT MODAL
      ===================================================== */}

      {showEditModal && (
        <StudentModal
          title="Edit Student"
          subtitle="Update student information"
          onClose={() => {
            setShowEditModal(false);
            setSelectedStudent(null);
          }}
        >

          <form
            onSubmit={
              handleUpdateStudent
            }
          >

            <StudentFormFields
              form={editForm}
              updateForm={updateEditForm}
              departments={departments}
              subjects={availableSubjects}
              subjectsError={subjectsError}
              editMode
            />

            <ModalActions
              onCancel={() => {
                setShowEditModal(false);
                setSelectedStudent(null);
              }}
              saving={saving}
              submitText="Save Changes"
            />

          </form>

        </StudentModal>
      )}

      {/* =====================================================
          VIEW STUDENT MODAL
      ===================================================== */}

      {showViewModal &&
        selectedStudent && (
          <StudentModal
            title="Student Details"
            subtitle="Complete student information"
            onClose={() => {
              setShowViewModal(false);
              setSelectedStudent(null);
            }}
          >

            <div className="student-view-grid">

              <ViewField
                label="Name"
                value={getStudentName(
                  selectedStudent
                )}
              />

              <ViewField
                label="Email"
                value={getStudentEmail(
                  selectedStudent
                )}
              />

              <ViewField
                label="Phone"
                value={getStudentPhone(
                  selectedStudent
                )}
              />

              <ViewField
                label="Student ID"
                value={
                  selectedStudent.studentId
                }
              />

              <ViewField
                label="Roll Number"
                value={
                  selectedStudent.rollNumber
                }
              />

              <ViewField
                label="Department"
                value={getDepartment(
                  selectedStudent
                )}
              />

              <ViewField
                label="Semester"
                value={
                  selectedStudent.semester
                }
              />

              <div className="student-view-full">
                <ViewField
                  label="Assigned Subjects"
                  value={
                    Array.isArray(selectedStudent.subjects) &&
                    selectedStudent.subjects.length
                      ? selectedStudent.subjects
                          .map((subject) =>
                            subject?.name
                              ? `${subject.name}${subject.code ? ` (${subject.code})` : ""}`
                              : ""
                          )
                          .filter(Boolean)
                          .join(", ")
                      : "No subjects assigned"
                  }
                />
              </div>

              <ViewField
                label="Section"
                value={
                  selectedStudent.section
                }
              />

              <ViewField
                label="Batch"
                value={
                  selectedStudent.batch
                }
              />

              <ViewField
                label="Gender"
                value={
                  selectedStudent.gender
                }
              />

              <ViewField
                label="Date of Birth"
                value={
                  selectedStudent.dateOfBirth
                    ? String(
                        selectedStudent.dateOfBirth
                      ).substring(0, 10)
                    : "-"
                }
              />

              <ViewField
                label="Guardian Name"
                value={
                  selectedStudent.guardianName
                }
              />

              <ViewField
                label="Guardian Phone"
                value={
                  selectedStudent.guardianPhone
                }
              />

              <ViewField
                label="Admission Date"
                value={
                  selectedStudent.admissionDate
                    ? String(
                        selectedStudent.admissionDate
                      ).substring(0, 10)
                    : "-"
                }
              />

              <ViewField
                label="Status"
                value={getStatus(
                  selectedStudent
                )}
              />

              <div className="student-view-full">
                <ViewField
                  label="Address"
                  value={
                    selectedStudent.address
                  }
                />
              </div>

            </div>

            <ModalActions
              onCancel={() => {
                setShowViewModal(false);
                setSelectedStudent(null);
              }}
              submitText="Close"
              hideSubmit
            />

          </StudentModal>
        )}

      {/* =====================================================
          CHANGE PASSWORD MODAL
      ===================================================== */}

      {showPasswordModal &&
        selectedStudent && (
          <StudentModal
            title="Change Student Password"
            subtitle={`Set a new password for ${getStudentName(
              selectedStudent
            )}`}
            onClose={() => {
              setShowPasswordModal(false);
              setSelectedStudent(null);
            }}
          >

            <form
              onSubmit={
                handleChangePassword
              }
            >

              <div className="student-form-grid">

                <div className="student-form-group full-width">
                  <label>
                    Student
                  </label>

                  <input
                    type="text"
                    value={getStudentName(
                      selectedStudent
                    )}
                    disabled
                  />
                </div>

                <div className="student-form-group">
                  <label>
                    New Password *
                  </label>

                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(
                        e.target.value
                      )
                    }
                    minLength={6}
                    required
                  />
                </div>

                <div className="student-form-group">
                  <label>
                    Confirm Password *
                  </label>

                  <input
                    type="password"
                    value={
                      confirmPassword
                    }
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    minLength={6}
                    required
                  />
                </div>

              </div>

              <ModalActions
                onCancel={() => {
                  setShowPasswordModal(
                    false
                  );
                  setSelectedStudent(null);
                }}
                saving={saving}
                submitText="Update Password"
              />

            </form>

          </StudentModal>
        )}

    </div>
  );
};

// =========================================================
// STUDENT FORM
// =========================================================

const StudentFormFields = ({
  form,
  updateForm,
  departments,
  subjects,
  subjectsError,
  showPassword = false,
  editMode = false,
}) => {
  const matchingSubjects = subjects.filter(
    (subject) =>
      subject.isActive !== false &&
      subject.department?.code === form.department &&
      String(subject.semester) === String(form.semester)
  );

  const selectedSubjectIds = Array.isArray(form.subjects)
    ? form.subjects
    : [];

  return (
    <div className="student-form-grid">

      <div className="student-form-group">
        <label>
          Full Name *
        </label>

        <input
          type="text"
          value={form.name}
          onChange={(e) =>
            updateForm(
              "name",
              e.target.value
            )
          }
          required
        />
      </div>

      <div className="student-form-group">
        <label>
          Email *
        </label>

        <input
          type="email"
          value={form.email}
          disabled={editMode}
          onChange={(e) =>
            updateForm(
              "email",
              e.target.value
            )
          }
          required
        />
      </div>

      {showPassword && (
        <div className="student-form-group">
          <label>
            Password *
          </label>

          <input
            type="password"
            value={form.password}
            onChange={(e) =>
              updateForm(
                "password",
                e.target.value
              )
            }
            minLength={6}
            required
          />
        </div>
      )}

      <div className="student-form-group">
        <label>
          Phone
        </label>

        <input
          type="text"
          value={form.phone}
          onChange={(e) =>
            updateForm(
              "phone",
              e.target.value
            )
          }
        />
      </div>

      <div className="student-form-group">
        <label>
          Student ID *
        </label>

        <input
          type="text"
          value={form.studentId}
          disabled={editMode}
          onChange={(e) =>
            updateForm(
              "studentId",
              e.target.value
            )
          }
          required
        />
      </div>

      <div className="student-form-group">
        <label>
          Roll Number *
        </label>

        <input
          type="text"
          value={form.rollNumber}
          disabled={editMode}
          onChange={(e) =>
            updateForm(
              "rollNumber",
              e.target.value
            )
          }
          required
        />
      </div>

      <div className="student-form-group">
        <label>
          Department *
        </label>

        <select
          value={form.department}
          onChange={(e) => {
            updateForm("department", e.target.value);
            updateForm("subjects", []);
          }}
          required
        >
          <option value="">
            Select Department
          </option>

          {departments.map(
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

      <div className="student-form-group">
        <label>
          Semester *
        </label>

        <select
          value={form.semester}
          onChange={(e) => {
            updateForm("semester", e.target.value);
            updateForm("subjects", []);
          }}
          required
        >
          <option value="">
            Select Semester
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
      </div>

      <div className="student-form-group full-width student-subject-assignment">
        <label>Assigned Subjects</label>
        {!form.department || !form.semester ? (
          <p className="student-subject-help">
            Select a department and semester to choose subjects.
          </p>
        ) : subjectsError ? (
          <p className="student-subject-error">{subjectsError}</p>
        ) : matchingSubjects.length === 0 ? (
          <p className="student-subject-help">
            No active subjects are available for this department and semester.
          </p>
        ) : (
          <>
            <p className="student-subject-help">
              Select the subjects this student is enrolled in.
            </p>
            <div className="student-subject-options">
              {matchingSubjects.map((subject) => {
                const isSelected = selectedSubjectIds.includes(subject._id);
                return (
                  <label
                    className={`student-subject-option${isSelected ? " selected" : ""}`}
                    key={subject._id}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(event) => {
                        const nextSubjects = event.target.checked
                          ? [...selectedSubjectIds, subject._id]
                          : selectedSubjectIds.filter((id) => id !== subject._id);
                        updateForm("subjects", nextSubjects);
                      }}
                    />
                    <span>
                      <strong>{subject.name}</strong>
                      <small>{subject.code} · Semester {subject.semester}</small>
                    </span>
                  </label>
                );
              })}
            </div>
            <span className="student-subject-selected-count">
              {selectedSubjectIds.length} subject(s) selected
            </span>
          </>
        )}
      </div>

      <div className="student-form-group">
        <label>
          Batch
        </label>

        <input
          type="text"
          placeholder="2023-2027"
          value={form.batch}
          onChange={(e) =>
            updateForm(
              "batch",
              e.target.value
            )
          }
        />
      </div>

      <div className="student-form-group">
        <label>
          Section
        </label>

        <input
          type="text"
          placeholder="A"
          value={form.section}
          onChange={(e) =>
            updateForm(
              "section",
              e.target.value
            )
          }
        />
      </div>

      <div className="student-form-group">
        <label>
          Date of Birth
        </label>

        <DatePickerInput
          value={form.dateOfBirth}
          onChange={(e) =>
            updateForm(
              "dateOfBirth",
              e.target.value
            )
          }
        />
      </div>

      <div className="student-form-group">
        <label>
          Gender
        </label>

        <select
          value={form.gender}
          onChange={(e) =>
            updateForm(
              "gender",
              e.target.value
            )
          }
        >
          <option value="">
            Select Gender
          </option>

          <option value="male">
            Male
          </option>

          <option value="female">
            Female
          </option>

          <option value="other">
            Other
          </option>
        </select>
      </div>

      <div className="student-form-group">
        <label>
          Admission Date
        </label>

        <DatePickerInput
          value={form.admissionDate}
          onChange={(e) =>
            updateForm(
              "admissionDate",
              e.target.value
            )
          }
        />
      </div>

      {editMode && (
        <div className="student-form-group">
          <label>
            Status
          </label>

          <select
            value={form.status}
            onChange={(e) =>
              updateForm(
                "status",
                e.target.value
              )
            }
          >
            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>
          </select>
        </div>
      )}

      <div className="student-form-group">
        <label>
          Guardian Name
        </label>

        <input
          type="text"
          value={form.guardianName}
          onChange={(e) =>
            updateForm(
              "guardianName",
              e.target.value
            )
          }
        />
      </div>

      <div className="student-form-group">
        <label>
          Guardian Phone
        </label>

        <input
          type="text"
          value={form.guardianPhone}
          onChange={(e) =>
            updateForm(
              "guardianPhone",
              e.target.value
            )
          }
        />
      </div>

      <div className="student-form-group full-width">
        <label>
          Address
        </label>

        <textarea
          rows="3"
          value={form.address}
          onChange={(e) =>
            updateForm(
              "address",
              e.target.value
            )
          }
        />
      </div>

    </div>
  );
};

// =========================================================
// MODAL
// =========================================================

const StudentModal = ({
  title,
  subtitle,
  onClose,
  children,
}) => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background:
          "rgba(15, 23, 42, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
      }}
    >

      <div
        style={{
          width: "min(900px, 100%)",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: "16px",
          boxShadow:
            "0 25px 70px rgba(0,0,0,0.25)",
        }}
      >

        <div
          style={{
            padding: "22px 26px",
            borderBottom:
              "1px solid #e5e7eb",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "flex-start",
            position: "sticky",
            top: 0,
            background: "#fff",
            zIndex: 2,
          }}
        >

          <div>
            <h2
              style={{
                margin: 0,
                fontSize: "22px",
                color: "#111827",
              }}
            >
              {title}
            </h2>

            {subtitle && (
              <p
                style={{
                  margin:
                    "6px 0 0",
                  color: "#6b7280",
                  fontSize: "14px",
                }}
              >
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: "none",
              background: "#f3f4f6",
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              fontSize: "24px",
              cursor: "pointer",
              color: "#374151",
            }}
          >
            ×
          </button>

        </div>

        <div
          style={{
            padding: "26px",
          }}
        >
          {children}
        </div>

      </div>

    </div>
  );
};

// =========================================================
// MODAL ACTIONS
// =========================================================

const ModalActions = ({
  onCancel,
  saving = false,
  submitText = "Save",
  hideSubmit = false,
}) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: "12px",
        marginTop: "24px",
        paddingTop: "20px",
        borderTop:
          "1px solid #e5e7eb",
      }}
    >

      <button
        type="button"
        onClick={onCancel}
        style={{
          padding:
            "10px 20px",
          border:
            "1px solid #d1d5db",
          background: "#fff",
          color: "#374151",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Close
      </button>

      {!hideSubmit && (
        <button
          type="submit"
          disabled={saving}
          style={{
            padding:
              "10px 22px",
            border: "none",
            background:
              "#2563eb",
            color: "#fff",
            borderRadius: "8px",
            cursor: saving
              ? "not-allowed"
              : "pointer",
            fontWeight: 600,
            opacity: saving
              ? 0.7
              : 1,
          }}
        >
          {saving
            ? "Saving..."
            : submitText}
        </button>
      )}

    </div>
  );
};

// =========================================================
// VIEW FIELD
// =========================================================

const ViewField = ({
  label,
  value,
}) => {
  return (
    <div
      style={{
        padding:
          "12px 14px",
        background:
          "#f8fafc",
        border:
          "1px solid #e5e7eb",
        borderRadius: "8px",
      }}
    >

      <div
        style={{
          fontSize: "12px",
          color: "#6b7280",
          marginBottom: "5px",
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontSize: "14px",
          color: "#111827",
          fontWeight: 600,
          wordBreak:
            "break-word",
        }}
      >
        {value || "-"}
      </div>

    </div>
  );
};

// =========================================================
// STAT CARD
// =========================================================

const StatCard = ({
  icon,
  title,
  value,
  type,
}) => {
  return (
    <div
      className={`student-stat-card ${type}`}
    >
      <div className="student-stat-icon">
        {icon}
      </div>

      <div className="student-stat-content">

        <span>{title}</span>

        <strong>{value}</strong>

        <small>
          {type === "red"
            ? "Current records"
            : type === "purple"
            ? "Registered this month"
            : "Current records"}
        </small>

      </div>
    </div>
  );
};

export default Students;