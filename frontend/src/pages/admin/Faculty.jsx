import { useEffect, useMemo, useState } from "react";
import DatePickerInput from "../../components/DatePickerInput";
import api from "../../services/api";
import "./Faculty.css";

const initialForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  facultyId: "",
  employeeId: "",
  department: "",
  designation: "",
  specialization: "",
  qualification: "",
  dateOfJoining: "",
  status: "active",
};

const Faculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [designationFilter, setDesignationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Main modal
  const [modal, setModal] = useState(null);
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  // Add/Edit form
  const [form, setForm] = useState(initialForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const facultyPerPage = 10;

  // =====================================================
  // FETCH FACULTY
  // =====================================================

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/faculty");
      const data = response.data;

      const facultyList =
        data.faculty ||
        data.data?.faculty ||
        data.data ||
        [];

      setFaculty(Array.isArray(facultyList) ? facultyList : []);
    } catch (err) {
      console.error("Error fetching faculty:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load faculty."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FETCH DEPARTMENTS
  // =====================================================

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
        Array.isArray(departmentList) ? departmentList : []
      );
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  useEffect(() => {
    fetchFaculty();
    fetchDepartments();
  }, []);

  // =====================================================
  // HELPERS
  // =====================================================

  const getFacultyName = (member) =>
    member.user?.name || member.name || "-";

  const getFacultyEmail = (member) =>
    member.user?.email || member.email || "-";

  const getFacultyPhone = (member) =>
    member.phone || member.user?.phone || "-";

  const getDepartment = (member) =>
    member.department?.code ||
    member.department?.name ||
    "-";

  const getDesignation = (member) =>
    member.designation || "-";

  const getStatus = (member) => {
    if (member.status) {
      return String(member.status).toLowerCase();
    }

    if (member.user?.isActive === false) {
      return "inactive";
    }

    return "active";
  };

  // =====================================================
  // STATISTICS
  // =====================================================

  const totalFaculty = faculty.length;

  const professors = faculty.filter((member) => {
    const designation = getDesignation(member)
      .toLowerCase()
      .trim();

    return (
      designation === "professor" ||
      designation === "prof."
    );
  }).length;

  const associateProfessors = faculty.filter((member) =>
    getDesignation(member)
      .toLowerCase()
      .includes("associate")
  ).length;

  const assistantProfessors = faculty.filter((member) =>
    getDesignation(member)
      .toLowerCase()
      .includes("assistant")
  ).length;

  // =====================================================
  // FILTER
  // =====================================================

  const filteredFaculty = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return faculty.filter((member) => {
      const name = getFacultyName(member).toLowerCase();
      const email = getFacultyEmail(member).toLowerCase();
      const facultyId = String(member.facultyId || "").toLowerCase();
      const employeeId = String(member.employeeId || "").toLowerCase();
      const department = getDepartment(member).toLowerCase();
      const designation = getDesignation(member).toLowerCase();
      const status = getStatus(member);

      const matchesSearch =
        !searchValue ||
        name.includes(searchValue) ||
        email.includes(searchValue) ||
        facultyId.includes(searchValue) ||
        employeeId.includes(searchValue) ||
        department.includes(searchValue) ||
        designation.includes(searchValue);

      const matchesDepartment =
        departmentFilter === "all" ||
        department === departmentFilter.toLowerCase();

      const matchesDesignation =
        designationFilter === "all" ||
        designation === designationFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        status === statusFilter;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesDesignation &&
        matchesStatus
      );
    });
  }, [
    faculty,
    search,
    departmentFilter,
    designationFilter,
    statusFilter,
  ]);

  // =====================================================
  // PAGINATION
  // =====================================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredFaculty.length / facultyPerPage)
  );

  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * facultyPerPage;

  const currentFaculty = filteredFaculty.slice(
    startIndex,
    startIndex + facultyPerPage
  );

  // =====================================================
  // RESET
  // =====================================================

  const handleReset = () => {
    setSearch("");
    setDepartmentFilter("all");
    setDesignationFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  // =====================================================
  // FORM
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // OPEN ADD
  // =====================================================

  const openAddModal = () => {
    setForm({ ...initialForm });
    setSelectedFaculty(null);
    setFormError("");
    setModal("add");
  };

  // =====================================================
  // OPEN EDIT
  // =====================================================

  const openEditModal = async (member) => {
    try {
      setFormLoading(true);
      setFormError("");

      const response = await api.get(
        `/admin/faculty/${member._id}`
      );

      const data =
        response.data.faculty ||
        response.data.data?.faculty ||
        response.data;

      setSelectedFaculty(data);

      setForm({
        name: data.user?.name || "",
        email: data.user?.email || "",
        password: "",
        phone: data.phone || data.user?.phone || "",
        facultyId: data.facultyId || "",
        employeeId: data.employeeId || "",
        department: data.department?.code || "",
        designation: data.designation || "",
        specialization: data.specialization || "",
        qualification: data.qualification || "",
        dateOfJoining: data.dateOfJoining
          ? String(data.dateOfJoining).slice(0, 10)
          : "",
        status:
          data.status ||
          (data.user?.isActive ? "active" : "inactive"),
      });

      setModal("edit");
    } catch (err) {
      console.error("Error fetching faculty:", err);
      setFormError(
        err.response?.data?.message ||
          "Unable to load faculty details."
      );
    } finally {
      setFormLoading(false);
    }
  };

  // =====================================================
  // CLOSE MAIN MODAL
  // =====================================================

  const closeModal = () => {
    if (formLoading) return;

    setModal(null);
    setSelectedFaculty(null);
    setForm({ ...initialForm });
    setFormError("");
  };

  // =====================================================
  // ADD / UPDATE FACULTY
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.facultyId.trim() ||
      !form.employeeId.trim() ||
      !form.department ||
      !form.designation.trim()
    ) {
      setFormError(
        "Name, email, faculty ID, employee ID, department and designation are required."
      );
      return;
    }

    if (modal === "add" && !form.password) {
      setFormError(
        "Password is required when adding a faculty."
      );
      return;
    }

    if (modal === "add" && form.password.length < 6) {
      setFormError(
        "Password must be at least 6 characters long."
      );
      return;
    }

    try {
      setFormLoading(true);

      if (modal === "add") {
        const payload = {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim(),
          facultyId: form.facultyId.trim(),
          employeeId: form.employeeId.trim(),
          department: form.department,
          designation: form.designation.trim(),
          specialization: form.specialization.trim(),
          qualification: form.qualification.trim(),
          dateOfJoining:
            form.dateOfJoining || undefined,
        };

        const response = await api.post(
          "/admin/faculty",
          payload
        );

        const createdFaculty = response.data.faculty;

        if (createdFaculty) {
          setFaculty((previous) => [
            createdFaculty,
            ...previous,
          ]);
        } else {
          await fetchFaculty();
        }

        alert("Faculty created successfully.");
      }

      if (modal === "edit") {
        const payload = {
          name: form.name.trim(),
          phone: form.phone.trim(),
          department: form.department,
          designation: form.designation.trim(),
          specialization: form.specialization.trim(),
          qualification: form.qualification.trim(),
          dateOfJoining:
            form.dateOfJoining || undefined,
          status: form.status,
        };

        const response = await api.put(
          `/admin/faculty/${selectedFaculty._id}`,
          payload
        );

        const updatedFaculty = response.data.faculty;

        if (updatedFaculty) {
          setFaculty((previous) =>
            previous.map((item) =>
              item._id === updatedFaculty._id
                ? updatedFaculty
                : item
            )
          );
        } else {
          await fetchFaculty();
        }

        alert("Faculty updated successfully.");
      }

      closeModal();
    } catch (err) {
      console.error("Faculty save error:", err);
      setFormError(
        err.response?.data?.message ||
          "Unable to save faculty."
      );
    } finally {
      setFormLoading(false);
    }
  };

  // =====================================================
  // VIEW
  // =====================================================

  const handleView = (member) => {
    setSelectedFaculty(member);
    setModal("view");
  };

  // =====================================================
  // DEACTIVATE
  // =====================================================

  const handleDeactivate = async (member) => {
    const name = getFacultyName(member);

    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${name}?`
    );

    if (!confirmed) return;

    try {
      await api.patch(
        `/admin/faculty/${member._id}/deactivate`
      );

      setFaculty((previous) =>
        previous.map((item) =>
          item._id === member._id
            ? {
                ...item,
                status: "inactive",
                user: item.user
                  ? {
                      ...item.user,
                      isActive: false,
                    }
                  : item.user,
              }
            : item
        )
      );

      alert("Faculty deactivated successfully.");
    } catch (err) {
      console.error(
        "Deactivate faculty error:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Unable to deactivate faculty."
      );
    }
  };

  // =====================================================
  // CHANGE PASSWORD
  // =====================================================

  const openPasswordModal = (member) => {
    setSelectedFaculty(member);
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    if (passwordLoading) return;

    setShowPasswordModal(false);
    setSelectedFaculty(null);
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!selectedFaculty?._id) return;

    if (!newPassword) {
      alert("Please enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setPasswordLoading(true);

      /*
       * IMPORTANT:
       * This frontend expects the backend route:
       * PATCH /api/admin/faculty/:id/password
       *
       * If this route is not yet present in your backend,
       * the password button will return 404 until that route
       * is added.
       */
      const response = await api.patch(
        `/admin/faculty/${selectedFaculty._id}/password`,
        {
          password: newPassword,
        }
      );

      if (response.data?.success) {
        alert("Faculty password changed successfully.");
        closePasswordModal();
      }
    } catch (err) {
      console.error(
        "Error changing faculty password:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Unable to change faculty password."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // =====================================================
  // CSV EXPORT
  // =====================================================

  const handleExport = () => {
    if (!filteredFaculty.length) {
      alert("No faculty data to export.");
      return;
    }

    const headers = [
      "Faculty ID",
      "Employee ID",
      "Name",
      "Department",
      "Designation",
      "Email",
      "Phone",
      "Status",
    ];

    const rows = filteredFaculty.map((member) => [
      member.facultyId || "",
      member.employeeId || "",
      getFacultyName(member),
      getDepartment(member),
      getDesignation(member),
      getFacultyEmail(member),
      getFacultyPhone(member),
      getStatus(member),
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value).replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "smartcampus-faculty.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="faculty-loading">
        <div className="faculty-spinner"></div>
        <p>Loading faculty...</p>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="faculty-page">
      {/* BREADCRUMB */}
      <div className="faculty-breadcrumb">
        <span>⌂</span>
        <span>Dashboard</span>
        <b>›</b>
        <strong>Faculty</strong>
      </div>

      {/* HEADER */}
      <div className="faculty-page-header">
        <div>
          <h1>Faculty</h1>
          <p>
            Manage faculty information, associate departments
            and track faculty details.
          </p>
        </div>

        <div className="faculty-header-right">
          <span className="faculty-date">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "short",
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>

          <button
            className="add-faculty-btn"
            type="button"
            onClick={openAddModal}
          >
            <span>＋</span>
            Add Faculty
          </button>
        </div>
      </div>

      {/* STATISTICS */}
      <div className="faculty-stat-grid">
        <FacultyStatCard
          type="blue"
          icon="👥"
          title="Total Faculty"
          value={totalFaculty}
          text="Current faculty records"
        />

        <FacultyStatCard
          type="green"
          icon="👤"
          title="Professors"
          value={professors}
          text="Professor positions"
        />

        <FacultyStatCard
          type="orange"
          icon="👤"
          title="Associate Professors"
          value={associateProfessors}
          text="Associate positions"
        />

        <FacultyStatCard
          type="red"
          icon="👤"
          title="Assistant Professors"
          value={assistantProfessors}
          text="Assistant positions"
        />
      </div>

      {/* FILTERS */}
      <div className="faculty-filter-panel">
        <div className="faculty-search-box">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search by name, email, or ID..."
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
            setDepartmentFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="all">All Departments</option>

          {departments.map((department) => (
            <option
              key={department._id}
              value={department.code}
            >
              {department.code} - {department.name}
            </option>
          ))}
        </select>

        <select
          value={designationFilter}
          onChange={(e) => {
            setDesignationFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="all">All Designations</option>
          <option value="Professor">Professor</option>
          <option value="Associate Professor">
            Associate Professor
          </option>
          <option value="Assistant Professor">
            Assistant Professor
          </option>
          <option value="Lecturer">Lecturer</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="on leave">On Leave</option>
        </select>

        <button
          className="faculty-filter-btn"
          type="button"
          onClick={() => setCurrentPage(1)}
        >
          <span>⌕</span>
          Filter
        </button>

        <button
          className="faculty-reset-btn"
          type="button"
          onClick={handleReset}
        >
          ↻ Reset
        </button>
      </div>

      {error && (
        <div className="faculty-error">{error}</div>
      )}

      {/* TABLE */}
      <div className="faculty-table-card">
        <div className="faculty-table-wrapper">
          <table className="faculty-table">
            <thead>
              <tr>
                <th className="faculty-checkbox">
                  <input type="checkbox" />
                </th>
                <th>#</th>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Subjects</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {currentFaculty.length === 0 ? (
                <tr>
                  <td colSpan="11" className="faculty-empty">
                    <div>
                      <span>👨‍🏫</span>
                      <strong>No faculty found</strong>
                      <small>
                        Try changing your search or filters.
                      </small>
                    </div>
                  </td>
                </tr>
              ) : (
                currentFaculty.map((member, index) => {
                  const status = getStatus(member);
                  const designation = getDesignation(member);

                  return (
                    <tr key={member._id}>
                      <td>
                        <input type="checkbox" />
                      </td>

                      <td>
                        {startIndex + index + 1}
                      </td>

                      <td className="faculty-id">
                        {member.employeeId ||
                          member.facultyId ||
                          "-"}
                      </td>

                      <td>
                        <div className="faculty-name-cell">
                          <div className="faculty-avatar">
                            {getFacultyName(member)
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {getFacultyName(member)}
                            </strong>
                            <small>
                              {member.facultyId || "-"}
                            </small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="faculty-department">
                          {getDepartment(member)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`designation-badge ${
                            designation
                              .toLowerCase()
                              .includes("professor")
                              ? "designation-professor"
                              : ""
                          }`}
                        >
                          {designation}
                        </span>
                      </td>

                      <td className="faculty-email">
                        {getFacultyEmail(member)}
                      </td>

                      <td>{getFacultyPhone(member)}</td>

                      <td>
                        <span
                          className={`faculty-status ${
                            status === "active"
                              ? "faculty-active"
                              : status === "on leave"
                              ? "faculty-leave"
                              : "faculty-inactive"
                          }`}
                        >
                          <span></span>

                          {status === "on leave"
                            ? "On Leave"
                            : status === "active"
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td className="subject-count">
                        {member.subjects?.length ||
                          member.assignedSubjects?.length ||
                          member.subjectCount ||
                          0}
                      </td>

                      <td>
                        <div className="faculty-actions">
                          <button
                            type="button"
                            className="faculty-edit"
                            title="Change Password"
                            onClick={() =>
                              openPasswordModal(member)
                            }
                          >
                            🔑
                          </button>

                          <button
                            type="button"
                            className="faculty-view"
                            title="View"
                            onClick={() =>
                              handleView(member)
                            }
                          >
                            👁
                          </button>

                          <button
                            type="button"
                            className="faculty-edit"
                            title="Edit"
                            onClick={() =>
                              openEditModal(member)
                            }
                          >
                            ✎
                          </button>

                          {status !== "inactive" && (
                            <button
                              type="button"
                              className="faculty-delete"
                              title="Deactivate"
                              onClick={() =>
                                handleDeactivate(member)
                              }
                            >
                              ⏸
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* TABLE FOOTER */}
        <div className="faculty-table-footer">
          <div className="faculty-count">
            Showing{" "}
            {filteredFaculty.length === 0
              ? 0
              : startIndex + 1}
            {" – "}
            {Math.min(
              startIndex + facultyPerPage,
              filteredFaculty.length
            )}
            {" of "}
            {filteredFaculty.length}
            {" faculty"}
          </div>

          <div className="faculty-footer-right">
            <div className="faculty-pagination">
              <button
                disabled={safePage === 1}
                onClick={() =>
                  setCurrentPage(
                    Math.max(1, safePage - 1)
                  )
                }
              >
                ‹
              </button>

              {Array.from(
                {
                  length: Math.min(totalPages, 5),
                },
                (_, index) => index + 1
              ).map((page) => (
                <button
                  key={page}
                  className={
                    safePage === page
                      ? "faculty-page-active"
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
                      setCurrentPage(totalPages)
                    }
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                disabled={safePage === totalPages}
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
              className="faculty-export-btn"
              type="button"
              onClick={handleExport}
            >
              ⇩ Export to CSV
            </button>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="faculty-page-footer">
        <div>
          🎓 <strong>SmartCampus</strong>
          <span> | </span>
          <span>Empowering Education Through Technology</span>
        </div>

        <div>
          <span>v1.0.0</span>
          <span> | </span>
          <strong>Gandhi Engineering College</strong>
        </div>
      </div>

      {/* VIEW MODAL */}
      {modal === "view" && selectedFaculty && (
        <Modal
          title="Faculty Details"
          onClose={closeModal}
        >
          <div className="faculty-detail-grid">
            <Detail
              label="Faculty ID"
              value={selectedFaculty.facultyId}
            />

            <Detail
              label="Employee ID"
              value={selectedFaculty.employeeId}
            />

            <Detail
              label="Name"
              value={getFacultyName(selectedFaculty)}
            />

            <Detail
              label="Email"
              value={getFacultyEmail(selectedFaculty)}
            />

            <Detail
              label="Phone"
              value={getFacultyPhone(selectedFaculty)}
            />

            <Detail
              label="Department"
              value={getDepartment(selectedFaculty)}
            />

            <Detail
              label="Designation"
              value={selectedFaculty.designation}
            />

            <Detail
              label="Specialization"
              value={selectedFaculty.specialization}
            />

            <Detail
              label="Qualification"
              value={selectedFaculty.qualification}
            />

            <Detail
              label="Date of Joining"
              value={
                selectedFaculty.dateOfJoining
                  ? new Date(
                      selectedFaculty.dateOfJoining
                    ).toLocaleDateString("en-IN")
                  : "-"
              }
            />

            <Detail
              label="Status"
              value={getStatus(selectedFaculty)}
            />
          </div>

          <div className="faculty-modal-actions">
            <button
              type="button"
              className="faculty-reset-btn"
              onClick={closeModal}
            >
              Close
            </button>

            <button
              type="button"
              className="add-faculty-btn"
              onClick={() =>
                openEditModal(selectedFaculty)
              }
            >
              Edit Faculty
            </button>
          </div>
        </Modal>
      )}

      {/* ADD / EDIT MODAL */}
      {(modal === "add" || modal === "edit") && (
        <Modal
          title={
            modal === "add"
              ? "Add New Faculty"
              : "Edit Faculty"
          }
          onClose={closeModal}
        >
          <form onSubmit={handleSubmit}>
            {formError && (
              <div className="faculty-error">
                {formError}
              </div>
            )}

            <div className="faculty-form-grid">
              <FormInput
                label="Full Name *"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter faculty name"
              />

              <FormInput
                label="Email *"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="faculty@example.com"
                disabled={modal === "edit"}
              />

              {modal === "add" && (
                <FormInput
                  label="Password *"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create password"
                />
              )}

              <FormInput
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
              />

              <FormInput
                label="Faculty ID *"
                name="facultyId"
                value={form.facultyId}
                onChange={handleChange}
                placeholder="FAC001"
                disabled={modal === "edit"}
              />

              <FormInput
                label="Employee ID *"
                name="employeeId"
                value={form.employeeId}
                onChange={handleChange}
                placeholder="EMP001"
                disabled={modal === "edit"}
              />

              <div className="faculty-form-field">
                <label>Department *</label>

                <select
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select Department
                  </option>

                  {departments.map((department) => (
                    <option
                      key={department._id}
                      value={department.code}
                    >
                      {department.code} - {department.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="faculty-form-field">
                <label>Designation *</label>

                <select
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select Designation
                  </option>
                  <option value="Professor">
                    Professor
                  </option>
                  <option value="Associate Professor">
                    Associate Professor
                  </option>
                  <option value="Assistant Professor">
                    Assistant Professor
                  </option>
                  <option value="Lecturer">
                    Lecturer
                  </option>
                </select>
              </div>

              <FormInput
                label="Specialization"
                name="specialization"
                value={form.specialization}
                onChange={handleChange}
                placeholder="e.g. Artificial Intelligence"
              />

              <FormInput
                label="Qualification"
                name="qualification"
                value={form.qualification}
                onChange={handleChange}
                placeholder="e.g. M.Tech, Ph.D"
              />

              <FormInput
                label="Date of Joining"
                name="dateOfJoining"
                type="date"
                value={form.dateOfJoining}
                onChange={handleChange}
              />

              {modal === "edit" && (
                <div className="faculty-form-field">
                  <label>Status</label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="active">
                      Active
                    </option>
                    <option value="inactive">
                      Inactive
                    </option>
                    <option value="on leave">
                      On Leave
                    </option>
                  </select>
                </div>
              )}
            </div>

            <div className="faculty-modal-actions">
              <button
                type="button"
                className="faculty-reset-btn"
                onClick={closeModal}
                disabled={formLoading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="add-faculty-btn"
                disabled={formLoading}
              >
                {formLoading
                  ? "Saving..."
                  : modal === "add"
                  ? "Create Faculty"
                  : "Save Changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && selectedFaculty && (
        <Modal
          title="Change Faculty Password"
          onClose={closePasswordModal}
        >
          <div className="faculty-password-heading">
            <p>
              Faculty:{" "}
              <strong>
                {getFacultyName(selectedFaculty)}
              </strong>
            </p>
            <small>
              {getFacultyEmail(selectedFaculty)}
            </small>
          </div>

          <form onSubmit={handleChangePassword}>
            <div className="faculty-form-grid">
              <div className="faculty-form-field">
                <label>New Password *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword(e.target.value)
                  }
                  placeholder="Enter new password"
                  minLength={6}
                  required
                />
              </div>

              <div className="faculty-form-field">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Confirm new password"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div className="faculty-modal-actions">
              <button
                type="button"
                className="faculty-reset-btn"
                onClick={closePasswordModal}
                disabled={passwordLoading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="add-faculty-btn"
                disabled={passwordLoading}
              >
                {passwordLoading
                  ? "Changing..."
                  : "Change Password"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// =====================================================
// FORM INPUT
// =====================================================

const FormInput = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  disabled = false,
}) => {
  return (
    <div className="faculty-form-field">
      <label>{label}</label>

      {type === "date" ? (
        <DatePickerInput
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      ) : (
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
        />
      )}
    </div>
  );
};

// =====================================================
// DETAIL
// =====================================================

const Detail = ({ label, value }) => {
  return (
    <div className="faculty-detail-item">
      <span>{label}</span>
      <strong>{value || "-"}</strong>
    </div>
  );
};

// =====================================================
// MODAL
// =====================================================

const Modal = ({ title, children, onClose }) => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: "min(850px, 100%)",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "#fff",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0,0,0,.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 24px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "22px",
            }}
          >
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: 0,
              background: "transparent",
              fontSize: "26px",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// =====================================================
// STAT CARD
// =====================================================

const FacultyStatCard = ({
  type,
  icon,
  title,
  value,
  text,
}) => {
  return (
    <div className={`faculty-stat-card ${type}`}>
      <div className="faculty-stat-icon">
        {icon}
      </div>

      <div className="faculty-stat-content">
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{text}</small>
      </div>
    </div>
  );
};

export default Faculty;
