import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "./Departments.css";

const emptyForm = {
  name: "",
  code: "",
  description: "",
  isActive: true,
};

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  const departmentsPerPage = 10;

  // =========================================================
  // FETCH DEPARTMENTS
  // =========================================================

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      setError("");

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
      console.error("Error fetching departments:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load departments."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // =========================================================
  // HELPERS
  // =========================================================

  const getDepartmentCode = (department) => {
    return department?.code || "-";
  };

  const getDepartmentName = (department) => {
    return department?.name || "-";
  };

  const getDescription = (department) => {
    return department?.description || "-";
  };

  const getHod = (department) => {
    if (!department?.hod) {
      return "-";
    }

    if (typeof department.hod === "string") {
      return department.hod;
    }

    return (
      department.hod.name ||
      department.hod.user?.name ||
      "-"
    );
  };

  const getStatus = (department) => {
    return department?.isActive === false
      ? "inactive"
      : "active";
  };

  const getFacultyCount = (department) => {
    return (
      department?.facultyCount ??
      department?.totalFaculty ??
      department?.faculty?.length ??
      0
    );
  };

  const getSubjectCount = (department) => {
    return (
      department?.subjectCount ??
      department?.totalSubjects ??
      department?.subjects?.length ??
      0
    );
  };

  const getStudentCount = (department) => {
    return (
      department?.studentCount ??
      department?.totalStudents ??
      department?.students?.length ??
      0
    );
  };

  // =========================================================
  // STATISTICS
  // =========================================================

  const totalDepartments = departments.length;

  const activeDepartments = departments.filter(
    (department) =>
      getStatus(department) === "active"
  ).length;

  const departmentsWithHod = departments.filter(
    (department) =>
      department.hod &&
      (
        typeof department.hod === "string" ||
        department.hod.name ||
        department.hod.user?.name
      )
  ).length;

  const totalFaculty = departments.reduce(
    (total, department) =>
      total + getFacultyCount(department),
    0
  );

  // =========================================================
  // FILTER
  // =========================================================

  const filteredDepartments = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return departments.filter((department) => {
      const code = getDepartmentCode(
        department
      ).toLowerCase();

      const name = getDepartmentName(
        department
      ).toLowerCase();

      const description = getDescription(
        department
      ).toLowerCase();

      const hod = getHod(department).toLowerCase();

      const status = getStatus(
        department
      ).toLowerCase();

      const matchesSearch =
        !searchValue ||
        code.includes(searchValue) ||
        name.includes(searchValue) ||
        description.includes(searchValue) ||
        hod.includes(searchValue);

      const matchesStatus =
        statusFilter === "all" ||
        status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    departments,
    search,
    statusFilter,
  ]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredDepartments.length /
        departmentsPerPage
    )
  );

  const safePage = Math.min(
    currentPage,
    totalPages
  );

  const startIndex =
    (safePage - 1) *
    departmentsPerPage;

  const currentDepartments =
    filteredDepartments.slice(
      startIndex,
      startIndex + departmentsPerPage
    );

  // =========================================================
  // FORM
  // =========================================================

  const handleFormChange = (e) => {
    const { name, value, type, checked } =
      e.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const resetForm = () => {
    setForm({ ...emptyForm });
  };

  // =========================================================
  // ADD DEPARTMENT
  // =========================================================

  const handleAddDepartment = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Department name is required.");
      return;
    }

    if (!form.code.trim()) {
      alert("Department code is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await api.post(
        "/admin/departments",
        {
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          description:
            form.description.trim(),
        }
      );

      const newDepartment =
        response.data.department;

      setDepartments((previous) => [
        ...previous,
        newDepartment,
      ]);

      setShowAddModal(false);
      resetForm();

      alert(
        response.data.message ||
          "Department created successfully."
      );
    } catch (err) {
      console.error(
        "Create Department Error:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Unable to create department."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // VIEW DEPARTMENT
  // =========================================================

  const handleView = async (department) => {
    try {
      const response = await api.get(
        `/admin/departments/${department._id}`
      );

      setSelectedDepartment(
        response.data.department
      );

      setShowViewModal(true);
    } catch (err) {
      console.error(
        "View Department Error:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Unable to load department details."
      );
    }
  };

  // =========================================================
  // OPEN EDIT
  // =========================================================

  const handleEdit = async (department) => {
    try {
      const response = await api.get(
        `/admin/departments/${department._id}`
      );

      const data =
        response.data.department;

      setSelectedDepartment(data);

      setForm({
        name: data.name || "",
        code: data.code || "",
        description:
          data.description || "",
        isActive:
          data.isActive !== false,
      });

      setShowEditModal(true);
    } catch (err) {
      console.error(
        "Load Department Error:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Unable to load department."
      );
    }
  };

  // =========================================================
  // UPDATE DEPARTMENT
  // =========================================================

  const handleUpdateDepartment = async (e) => {
    e.preventDefault();

    if (!selectedDepartment?._id) {
      return;
    }

    if (!form.name.trim()) {
      alert("Department name is required.");
      return;
    }

    if (!form.code.trim()) {
      alert("Department code is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await api.put(
        `/admin/departments/${selectedDepartment._id}`,
        {
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          description:
            form.description.trim(),
          isActive: form.isActive,
        }
      );

      const updatedDepartment =
        response.data.department;

      setDepartments((previous) =>
        previous.map((department) =>
          department._id ===
          selectedDepartment._id
            ? updatedDepartment
            : department
        )
      );

      setShowEditModal(false);
      setSelectedDepartment(null);
      resetForm();

      alert(
        response.data.message ||
          "Department updated successfully."
      );
    } catch (err) {
      console.error(
        "Update Department Error:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Unable to update department."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DEACTIVATE DEPARTMENT
  // =========================================================

  const handleDeactivate = async (
    department
  ) => {
    if (!department?._id) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to deactivate ${
        department.name || "this department"
      }?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await api.patch(
        `/admin/departments/${department._id}/deactivate`
      );

      const updatedDepartment =
        response.data.department;

      setDepartments((previous) =>
        previous.map((item) =>
          item._id === department._id
            ? updatedDepartment
            : item
        )
      );

      alert(
        response.data.message ||
          "Department deactivated successfully."
      );
    } catch (err) {
      console.error(
        "Deactivate Department Error:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Unable to deactivate department."
      );
    }
  };

  // =========================================================
  // RESET
  // =========================================================

  const handleReset = () => {
    setSearch("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  // =========================================================
  // EXPORT CSV
  // =========================================================

  const handleExport = () => {
    if (!filteredDepartments.length) {
      alert(
        "No department data to export."
      );
      return;
    }

    const headers = [
      "Department Code",
      "Department Name",
      "HOD",
      "Faculty Count",
      "Subject Count",
      "Student Count",
      "Status",
    ];

    const rows =
      filteredDepartments.map(
        (department) => [
          getDepartmentCode(department),
          getDepartmentName(department),
          getHod(department),
          getFacultyCount(department),
          getSubjectCount(department),
          getStudentCount(department),
          getStatus(department),
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
      "smartcampus-departments.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // =========================================================
  // CLOSE MODALS
  // =========================================================

  const closeAddModal = () => {
    if (saving) return;

    setShowAddModal(false);
    resetForm();
  };

  const closeEditModal = () => {
    if (saving) return;

    setShowEditModal(false);
    setSelectedDepartment(null);
    resetForm();
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedDepartment(null);
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="departments-loading">
        <div className="departments-spinner"></div>

        <p>Loading departments...</p>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="departments-page">

      {/* BREADCRUMB */}

      <div className="departments-breadcrumb">
        <span>⌂</span>
        <span>Dashboard</span>
        <b>›</b>
        <strong>Departments</strong>
      </div>

      {/* HEADER */}

      <div className="departments-page-header">
        <div>
          <h1>Departments</h1>

          <p>
            Manage departments, assign HODs,
            view faculty and subjects.
          </p>
        </div>

        <div className="departments-header-right">
          <span className="departments-date">
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
            className="add-department-btn"
            type="button"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
          >
            <span>＋</span>
            Add Department
          </button>
        </div>
      </div>

      {/* STAT CARDS */}

      <div className="department-stat-grid">

        <DepartmentStatCard
          type="blue"
          icon="🏢"
          title="Total Departments"
          value={totalDepartments}
          text="Current departments"
        />

        <DepartmentStatCard
          type="green"
          icon="👥"
          title="Total Faculty"
          value={totalFaculty}
          text="Faculty across departments"
        />

        <DepartmentStatCard
          type="orange"
          icon="📚"
          title="Departments with HOD"
          value={departmentsWithHod}
          text="Assigned HODs"
        />

        <DepartmentStatCard
          type="purple"
          icon="✓"
          title="Active Departments"
          value={activeDepartments}
          text="Currently active"
        />

      </div>

      {/* FILTER */}

      <div className="departments-filter-panel">

        <div className="department-search-box">
          <span>⌕</span>

          <input
            type="text"
            placeholder="Search by department name, code, or HOD..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <select
          value="all"
          disabled
        >
          <option value="all">
            All Departments
          </option>
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
          className="department-filter-btn"
          type="button"
          onClick={() =>
            setCurrentPage(1)
          }
        >
          <span>⌕</span>
          Filter
        </button>

        <button
          className="department-reset-btn"
          type="button"
          onClick={handleReset}
        >
          ↻ Reset
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div className="departments-error">
          {error}
        </div>
      )}

      {/* TABLE */}

      <div className="departments-table-card">

        <div className="departments-table-wrapper">

          <table className="departments-table">

            <thead>
              <tr>
                <th>#</th>
                <th>Department Code</th>
                <th>Department Name</th>
                <th>HOD</th>
                <th>Faculty Count</th>
                <th>Subject Count</th>
                <th>Student Count</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>

              {currentDepartments.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="departments-empty"
                  >
                    <div>
                      <span>🏢</span>

                      <strong>
                        No departments found
                      </strong>

                      <small>
                        Try changing your
                        search or filters.
                      </small>
                    </div>
                  </td>
                </tr>
              ) : (
                currentDepartments.map(
                  (department, index) => {
                    const status =
                      getStatus(
                        department
                      );

                    return (
                      <tr
                        key={
                          department._id
                        }
                      >
                        <td>
                          {startIndex +
                            index +
                            1}
                        </td>

                        <td>
                          <span className="department-code">
                            {
                              getDepartmentCode(
                                department
                              )
                            }
                          </span>
                        </td>

                        <td>
                          <div className="department-name-cell">

                            <div className="department-icon">
                              🏢
                            </div>

                            <div>
                              <strong>
                                {
                                  getDepartmentName(
                                    department
                                  )
                                }
                              </strong>

                              <small>
                                {
                                  getDescription(
                                    department
                                  )
                                }
                              </small>
                            </div>

                          </div>
                        </td>

                        <td>
                          <span className="department-hod">
                            {
                              getHod(
                                department
                              )
                            }
                          </span>
                        </td>

                        <td className="department-number">
                          {
                            getFacultyCount(
                              department
                            )
                          }
                        </td>

                        <td className="department-number">
                          {
                            getSubjectCount(
                              department
                            )
                          }
                        </td>

                        <td className="department-number">
                          {
                            getStudentCount(
                              department
                            )
                          }
                        </td>

                        <td>
                          <span
                            className={`department-status ${
                              status ===
                              "active"
                                ? "department-active"
                                : "department-inactive"
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
                          <div className="department-actions">

                            {/* VIEW */}

                            <button
                              type="button"
                              className="department-view"
                              title="View"
                              onClick={() =>
                                handleView(
                                  department
                                )
                              }
                            >
                              👁
                            </button>

                            {/* EDIT */}

                            <button
                              type="button"
                              className="department-edit"
                              title="Edit"
                              onClick={() =>
                                handleEdit(
                                  department
                                )
                              }
                            >
                              ✎
                            </button>

                            {/* DEACTIVATE */}

                            {status ===
                            "active" ? (
                              <button
                                type="button"
                                className="department-delete"
                                title="Deactivate"
                                onClick={() =>
                                  handleDeactivate(
                                    department
                                  )
                                }
                              >
                                🗑
                              </button>
                            ) : (
                              <span
                                className="department-inactive-label"
                                title="Department is inactive"
                              >
                                —
                              </span>
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

        {/* TABLE FOOTER */}

        <div className="departments-table-footer">

          <div className="departments-count">
            Showing{" "}
            {filteredDepartments.length ===
            0
              ? 0
              : startIndex + 1}
            –
            {Math.min(
              startIndex +
                departmentsPerPage,
              filteredDepartments.length
            )}{" "}
            of{" "}
            {filteredDepartments.length}{" "}
            departments
          </div>

          <div className="departments-pagination">

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
                    ? "department-page-active"
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

        </div>

      </div>

      {/* PAGE FOOTER */}

      <div className="departments-page-footer">
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
          ADD DEPARTMENT MODAL
      ===================================================== */}

      {showAddModal && (
        <DepartmentModal
          title="Add Department"
          form={form}
          saving={saving}
          onChange={handleFormChange}
          onSubmit={handleAddDepartment}
          onClose={closeAddModal}
          submitText="Create Department"
        />
      )}

      {/* =====================================================
          EDIT DEPARTMENT MODAL
      ===================================================== */}

      {showEditModal && (
        <DepartmentModal
          title="Edit Department"
          form={form}
          saving={saving}
          onChange={handleFormChange}
          onSubmit={handleUpdateDepartment}
          onClose={closeEditModal}
          submitText="Save Changes"
          isEdit
        />
      )}

      {/* =====================================================
          VIEW DEPARTMENT MODAL
      ===================================================== */}

      {showViewModal &&
        selectedDepartment && (
          <div
            className="department-modal-overlay"
            onClick={closeViewModal}
          >
            <div
              className="department-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="department-modal-header">
                <div>
                  <h2>
                    Department Details
                  </h2>

                  <p>
                    View department
                    information
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    closeViewModal
                  }
                >
                  ×
                </button>
              </div>

              <div className="department-view-grid">

                <ViewField
                  label="Department Name"
                  value={
                    selectedDepartment.name
                  }
                />

                <ViewField
                  label="Department Code"
                  value={
                    selectedDepartment.code
                  }
                />

                <ViewField
                  label="Description"
                  value={
                    selectedDepartment.description ||
                    "-"
                  }
                  full
                />

                <ViewField
                  label="HOD"
                  value={getHod(
                    selectedDepartment
                  )}
                />

                <ViewField
                  label="Faculty Count"
                  value={getFacultyCount(
                    selectedDepartment
                  )}
                />

                <ViewField
                  label="Subject Count"
                  value={getSubjectCount(
                    selectedDepartment
                  )}
                />

                <ViewField
                  label="Student Count"
                  value={getStudentCount(
                    selectedDepartment
                  )}
                />

                <ViewField
                  label="Status"
                  value={
                    getStatus(
                      selectedDepartment
                    ) === "active"
                      ? "Active"
                      : "Inactive"
                  }
                />

              </div>

              <div className="department-modal-footer">
                <button
                  type="button"
                  className="department-cancel-btn"
                  onClick={
                    closeViewModal
                  }
                >
                  Close
                </button>

                <button
                  type="button"
                  className="department-submit-btn"
                  onClick={() => {
                    closeViewModal();
                    handleEdit(
                      selectedDepartment
                    );
                  }}
                >
                  Edit Department
                </button>
              </div>

            </div>
          </div>
        )}

    </div>
  );
};

// =========================================================
// DEPARTMENT MODAL
// =========================================================

const DepartmentModal = ({
  title,
  form,
  saving,
  onChange,
  onSubmit,
  onClose,
  submitText,
  isEdit = false,
}) => {
  return (
    <div
      className="department-modal-overlay"
      onClick={onClose}
    >
      <div
        className="department-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >

        <div className="department-modal-header">
          <div>
            <h2>{title}</h2>

            <p>
              {isEdit
                ? "Update department information."
                : "Create a new department."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit}>

          <div className="department-form-grid">

            <div className="department-form-group">
              <label>
                Department Name
                <span>*</span>
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="e.g. Computer Science and Engineering"
                required
              />
            </div>

            <div className="department-form-group">
              <label>
                Department Code
                <span>*</span>
              </label>

              <input
                type="text"
                name="code"
                value={form.code}
                onChange={(e) =>
                  onChange({
                    target: {
                      name: "code",
                      value:
                        e.target.value.toUpperCase(),
                      type: "text",
                    },
                  })
                }
                placeholder="e.g. CSE"
                maxLength={10}
                required
              />
            </div>

            <div className="department-form-group department-form-full">
              <label>
                Description
              </label>

              <textarea
                name="description"
                value={
                  form.description
                }
                onChange={onChange}
                placeholder="Enter department description..."
                rows="4"
              />
            </div>

            {isEdit && (
              <div className="department-form-group department-form-full">
                <label className="department-checkbox-label">

                  <input
                    type="checkbox"
                    name="isActive"
                    checked={
                      form.isActive
                    }
                    onChange={onChange}
                  />

                  <span>
                    Department is active
                  </span>

                </label>
              </div>
            )}

          </div>

          <div className="department-modal-footer">

            <button
              type="button"
              className="department-cancel-btn"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="department-submit-btn"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : submitText}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
};

// =========================================================
// VIEW FIELD
// =========================================================

const ViewField = ({
  label,
  value,
  full = false,
}) => {
  return (
    <div
      className={
        full
          ? "department-view-field department-view-full"
          : "department-view-field"
      }
    >
      <span>{label}</span>
      <strong>{value || "-"}</strong>
    </div>
  );
};

// =========================================================
// STAT CARD
// =========================================================

const DepartmentStatCard = ({
  type,
  icon,
  title,
  value,
  text,
}) => {
  return (
    <div
      className={`department-stat-card ${type}`}
    >
      <div className="department-stat-icon">
        {icon}
      </div>

      <div className="department-stat-content">
        <span>{title}</span>

        <strong>{value}</strong>

        <small>{text}</small>
      </div>
    </div>
  );
};

export default Departments;