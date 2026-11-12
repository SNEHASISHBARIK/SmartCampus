import { useEffect, useMemo, useState } from "react";

import {
  FaCheck,
  FaCheckCircle,
  FaClock,
  FaComments,
  FaExclamationCircle,
  FaEye,
  FaFilter,
  FaRedo,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

import api from "../../services/api";

import "./Complaints.css";

const CATEGORIES = [
  "academic",
  "hostel",
  "library",
  "transport",
  "fees",
  "technical",
  "other",
];

const STATUSES = [
  "pending",
  "in-progress",
  "resolved",
  "rejected",
];

const Complaints = () => {
  // =========================================================
  // STATE
  // =========================================================

  const [complaints, setComplaints] = useState([]);
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [department, setDepartment] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // View modal
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] =
    useState(null);

  const [viewLoading, setViewLoading] = useState(false);

  // Action loading
  const [actionLoading, setActionLoading] = useState(null);

  // =========================================================
  // FETCH COMPLAINTS
  // =========================================================

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/admin/complaints"
      );

      const data =
        response.data?.complaints ||
        response.data?.data ||
        [];

      setComplaints(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Failed to fetch complaints:",
        error
      );

      setComplaints([]);

      setError(
        error.response?.data?.message ||
          "Failed to load complaints."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FETCH STUDENTS
  // =========================================================

  const fetchStudents = async () => {
    try {
      const response = await api.get(
        "/admin/students"
      );

      const data =
        response.data?.students ||
        response.data?.data ||
        [];

      setStudents(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Failed to fetch students:",
        error
      );

      setStudents([]);
    }
  };

  // =========================================================
  // FETCH DEPARTMENTS
  // =========================================================

  const fetchDepartments = async () => {
    try {
      const response = await api.get(
        "/admin/departments"
      );

      const data =
        response.data?.departments ||
        response.data?.data ||
        [];

      setDepartments(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Failed to fetch departments:",
        error
      );

      setDepartments([]);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchComplaints();
    fetchStudents();
    fetchDepartments();
  }, []);

  // =========================================================
  // HELPERS
  // =========================================================

  const getStudentName = (complaint) => {
    return (
      complaint?.student?.user?.name ||
      complaint?.student?.name ||
      complaint?.user?.name ||
      "Unknown Student"
    );
  };

  const getStudentId = (complaint) => {
    return (
      complaint?.student?.studentId ||
      complaint?.studentId ||
      "-"
    );
  };

  const getStudentEmail = (complaint) => {
    return (
      complaint?.student?.user?.email ||
      complaint?.student?.email ||
      "-"
    );
  };

  const getStudentPhone = (complaint) => {
    return (
      complaint?.student?.user?.phone ||
      complaint?.student?.phone ||
      "-"
    );
  };

  const getStudentDepartment = (complaint) => {
    const student = complaint?.student;

    if (!student?.department) {
      return "-";
    }

    // Department populated as object
    if (
      typeof student.department === "object"
    ) {
      return (
        student.department.code ||
        student.department.name ||
        "-"
      );
    }

    // Department stored as ObjectId
    const departmentId =
      String(student.department);

    const departmentData =
      departments.find(
        (item) =>
          String(item._id) ===
          departmentId
      );

    if (departmentData) {
      return (
        departmentData.code ||
        departmentData.name ||
        "-"
      );
    }

    // Check student list
    const studentData = students.find(
      (item) =>
        String(item._id) ===
        String(student?._id)
    );

    if (studentData?.department) {
      if (
        typeof studentData.department ===
        "object"
      ) {
        return (
          studentData.department.code ||
          studentData.department.name ||
          "-"
        );
      }

      const departmentData2 =
        departments.find(
          (item) =>
            String(item._id) ===
            String(
              studentData.department
            )
        );

      return (
        departmentData2?.code ||
        departmentData2?.name ||
        "-"
      );
    }

    return "-";
  };

  const getCategoryLabel = (value) => {
    if (!value) return "-";

    return value
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  const getStatusLabel = (value) => {
    if (!value) return "-";

    return value
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  const getDate = (complaint) => {
    if (!complaint?.createdAt) {
      return "-";
    }

    const date = new Date(
      complaint.createdAt
    );

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const getResolvedDate = (complaint) => {
    if (!complaint?.resolvedAt) {
      return "-";
    }

    const date = new Date(
      complaint.resolvedAt
    );

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleString(
      "en-IN"
    );
  };

  const getComplaintId = (
    complaint,
    index = 0
  ) => {
    if (complaint?.complaintId) {
      return complaint.complaintId;
    }

    return `CMP-${String(
      index + 1
    ).padStart(4, "0")}`;
  };

  const statusClass = (value) => {
    const normalized = String(
      value || ""
    )
      .toLowerCase()
      .replace(/\s+/g, "-");

    return `status-badge status-${normalized}`;
  };

  // =========================================================
  // FILTER COMPLAINTS
  // =========================================================

  const filteredComplaints = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return complaints.filter(
      (complaint) => {
        const studentName =
          getStudentName(complaint);

        const studentId =
          getStudentId(complaint);

        const departmentName =
          getStudentDepartment(
            complaint
          );

        const complaintId =
          getComplaintId(complaint);

        const subject =
          complaint?.subject || "";

        const description =
          complaint?.description || "";

        const complaintCategory =
          complaint?.category || "";

        const complaintStatus =
          complaint?.status || "";

        const matchesSearch =
          !searchValue ||
          complaintId
            .toLowerCase()
            .includes(searchValue) ||
          subject
            .toLowerCase()
            .includes(searchValue) ||
          description
            .toLowerCase()
            .includes(searchValue) ||
          studentName
            .toLowerCase()
            .includes(searchValue) ||
          studentId
            .toLowerCase()
            .includes(searchValue) ||
          departmentName
            .toLowerCase()
            .includes(searchValue);

        const matchesCategory =
          category === "all" ||
          complaintCategory === category;

        const matchesStatus =
          status === "all" ||
          complaintStatus === status;

        const matchesDepartment =
          department === "all" ||
          departmentName === department;

        return (
          matchesSearch &&
          matchesCategory &&
          matchesStatus &&
          matchesDepartment
        );
      }
    );
  }, [
    complaints,
    search,
    category,
    status,
    department,
    departments,
    students,
  ]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredComplaints.length /
        rowsPerPage
    )
  );

  const safePage = Math.min(
    page,
    totalPages
  );

  const startIndex =
    (safePage - 1) * rowsPerPage;

  const visibleComplaints =
    filteredComplaints.slice(
      startIndex,
      startIndex + rowsPerPage
    );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // =========================================================
  // STATISTICS
  // =========================================================

  const totalComplaints =
    complaints.length;

  const resolvedCount =
    complaints.filter(
      (item) =>
        item.status === "resolved"
    ).length;

  const inProgressCount =
    complaints.filter(
      (item) =>
        item.status === "in-progress"
    ).length;

  const pendingCount =
    complaints.filter(
      (item) =>
        item.status === "pending"
    ).length;

  const rejectedCount =
    complaints.filter(
      (item) =>
        item.status === "rejected"
    ).length;

  // =========================================================
  // DEPARTMENT OPTIONS
  // =========================================================

  const departmentOptions = useMemo(() => {
    return departments
      .filter(
        (item) =>
          item?.isActive !== false
      )
      .sort((a, b) =>
        String(
          a?.name || ""
        ).localeCompare(
          String(b?.name || "")
        )
      );
  }, [departments]);

  // =========================================================
  // RESET FILTERS
  // =========================================================

  const resetFilters = () => {
    setSearch("");
    setCategory("all");
    setStatus("all");
    setDepartment("all");
    setPage(1);
  };

  // =========================================================
  // VIEW COMPLAINT
  // =========================================================

  const handleViewComplaint = async (
    complaint
  ) => {
    try {
      setViewLoading(true);
      setViewModalOpen(true);
      setSelectedComplaint(null);

      const response = await api.get(
        `/admin/complaints/${complaint._id}`
      );

      const data =
        response.data?.complaint ||
        complaint;

      setSelectedComplaint(data);
    } catch (error) {
      console.error(
        "Failed to view complaint:",
        error
      );

      setSelectedComplaint(
        complaint
      );
    } finally {
      setViewLoading(false);
    }
  };

  // =========================================================
  // CLOSE VIEW MODAL
  // =========================================================

  const closeViewModal = () => {
    if (actionLoading) return;

    setViewModalOpen(false);
    setSelectedComplaint(null);
  };

  // =========================================================
  // UPDATE STATUS
  // =========================================================

  const updateComplaintStatus = async (
    complaint,
    newStatus
  ) => {
    const actionText =
      newStatus === "resolved"
        ? "resolve"
        : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionText} this complaint?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(
        `${newStatus}-${complaint._id}`
      );

      setError("");

      const response = await api.put(
        `/admin/complaints/${complaint._id}`,
        {
          status: newStatus,
        }
      );

      const updatedComplaint =
        response.data?.complaint;

      if (updatedComplaint) {
        setComplaints((previous) =>
          previous.map((item) =>
            item._id ===
            updatedComplaint._id
              ? updatedComplaint
              : item
          )
        );

        // Update opened view also
        if (
          selectedComplaint?._id ===
          updatedComplaint._id
        ) {
          setSelectedComplaint(
            updatedComplaint
          );
        }
      } else {
        await fetchComplaints();
      }
    } catch (error) {
      console.error(
        `Failed to ${actionText} complaint:`,
        error
      );

      setError(
        error.response?.data?.message ||
          `Failed to ${actionText} complaint.`
      );
    } finally {
      setActionLoading(null);
    }
  };

  // =========================================================
  // RESOLVE COMPLAINT
  // =========================================================

  const handleResolveComplaint = (
    complaint
  ) => {
    updateComplaintStatus(
      complaint,
      "resolved"
    );
  };

  // =========================================================
  // REJECT COMPLAINT
  // =========================================================

  const handleRejectComplaint = (
    complaint
  ) => {
    updateComplaintStatus(
      complaint,
      "rejected"
    );
  };

  // =========================================================
  // DELETE COMPLAINT
  // =========================================================

  const handleDeleteComplaint = async (
    complaint
  ) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the complaint "${complaint?.subject || "this complaint"}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(
        `delete-${complaint._id}`
      );

      setError("");

      await api.delete(
        `/admin/complaints/${complaint._id}`
      );

      setComplaints((previous) =>
        previous.filter(
          (item) =>
            item._id !== complaint._id
        )
      );

      // Close view modal if deleting
      if (
        selectedComplaint?._id ===
        complaint._id
      ) {
        closeViewModal();
      }
    } catch (error) {
      console.error(
        "Failed to delete complaint:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to delete complaint."
      );
    } finally {
      setActionLoading(null);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="admin-complaints-page">

      {/* =====================================================
          NO HEADER HERE
          AdminLayout ALREADY PROVIDES THE HEADER
      ====================================================== */}

      <main className="complaints-content">

        {/* =================================================
            PAGE HEADING
        ================================================== */}

        <div className="complaints-heading">

          <div>

            <div className="breadcrumb">

              <span>⌂</span>

              <span>
                Dashboard
              </span>

              <span>
                ›
              </span>

              <strong>
                Complaints
              </strong>

            </div>

            <h1>
              Complaints
            </h1>

            <p>
              Manage, review, resolve and
              reject student complaints.
            </p>

          </div>

        </div>

        {/* =================================================
            STATISTICS
        ================================================== */}

        <section className="complaint-stats">

          {/* TOTAL */}

          <div className="stat-card">

            <div className="stat-icon blue">
              <FaComments />
            </div>

            <div>

              <span>
                Total Complaints
              </span>

              <strong>
                {totalComplaints}
              </strong>

              <small className="positive">
                ↑ Total records
              </small>

            </div>

          </div>

          {/* RESOLVED */}

          <div className="stat-card">

            <div className="stat-icon green">
              <FaCheckCircle />
            </div>

            <div>

              <span>
                Resolved
              </span>

              <strong>
                {resolvedCount}
              </strong>

              <small className="positive">
                ↑ Resolved complaints
              </small>

            </div>

          </div>

          {/* IN PROGRESS */}

          <div className="stat-card">

            <div className="stat-icon orange">
              <FaClock />
            </div>

            <div>

              <span>
                In Progress
              </span>

              <strong>
                {inProgressCount}
              </strong>

              <small className="positive">
                ↑ Being handled
              </small>

            </div>

          </div>

          {/* PENDING */}

          <div className="stat-card">

            <div className="stat-icon red">
              <FaExclamationCircle />
            </div>

            <div>

              <span>
                Pending
              </span>

              <strong>
                {pendingCount}
              </strong>

              <small className="positive">
                ↑ Awaiting action
              </small>

            </div>

          </div>

          {/* REJECTED */}

          <div className="stat-card">

            <div className="stat-icon purple">
              <FaComments />
            </div>

            <div>

              <span>
                Rejected
              </span>

              <strong>
                {rejectedCount}
              </strong>

              <small className="positive">
                ↑ Rejected complaints
              </small>

            </div>

          </div>

        </section>

        {/* =================================================
            FILTERS
        ================================================== */}

        <section className="complaint-filter-card">

          <div className="filter-search">

            <input
              type="text"
              placeholder="Search complaints..."
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value
                );
                setPage(1);
              }}
            />

          </div>

          <select
            value={category}
            onChange={(event) => {
              setCategory(
                event.target.value
              );
              setPage(1);
            }}
          >

            <option value="all">
              All Categories
            </option>

            {CATEGORIES.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {getCategoryLabel(
                    item
                  )}
                </option>
              )
            )}

          </select>

          <select
            value={department}
            onChange={(event) => {
              setDepartment(
                event.target.value
              );
              setPage(1);
            }}
          >

            <option value="all">
              All Departments
            </option>

            {departmentOptions.map(
              (item) => (
                <option
                  key={item._id}
                  value={
                    item.code ||
                    item.name
                  }
                >
                  {item.code
                    ? `${item.code} - ${item.name}`
                    : item.name}
                </option>
              )
            )}

          </select>

          <select
            value={status}
            onChange={(event) => {
              setStatus(
                event.target.value
              );
              setPage(1);
            }}
          >

            <option value="all">
              All Status
            </option>

            {STATUSES.map(
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {getStatusLabel(
                    item
                  )}
                </option>
              )
            )}

          </select>

          <button
            type="button"
            className="filter-btn"
            onClick={() =>
              setPage(1)
            }
          >
            <FaFilter />
            Filter
          </button>

          <button
            type="button"
            className="reset-btn"
            onClick={resetFilters}
          >
            <FaRedo />
            Reset
          </button>

        </section>

        {/* =================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="complaint-alert error">
            {error}

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              <FaTimes />
            </button>
          </div>
        )}

        {/* =================================================
            COMPLAINT TABLE
        ================================================== */}

        <section className="complaint-table-card">

          <div className="table-wrapper">

            <table className="complaints-table">

              <thead>

                <tr>

                  <th>
                    #
                  </th>

                  <th>
                    Complaint ID
                  </th>

                  <th>
                    Subject
                  </th>

                  <th>
                    Raised By
                  </th>

                  <th>
                    Category
                  </th>

                  <th>
                    Department
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Date
                  </th>

                  <th>
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>

                    <td
                      colSpan="9"
                      className="empty-row"
                    >
                      Loading complaints...
                    </td>

                  </tr>

                ) : visibleComplaints.length ===
                  0 ? (

                  <tr>

                    <td
                      colSpan="9"
                      className="empty-row"
                    >
                      No complaints found.
                    </td>

                  </tr>

                ) : (

                  visibleComplaints.map(
                    (
                      complaint,
                      index
                    ) => {

                      const complaintId =
                        getComplaintId(
                          complaint,
                          startIndex +
                            index
                        );

                      const studentName =
                        getStudentName(
                          complaint
                        );

                      const isResolving =
                        actionLoading ===
                        `resolved-${complaint._id}`;

                      const isRejecting =
                        actionLoading ===
                        `rejected-${complaint._id}`;

                      const isDeleting =
                        actionLoading ===
                        `delete-${complaint._id}`;

                      return (
                        <tr
                          key={
                            complaint?._id ||
                            complaintId
                          }
                        >

                          {/* NUMBER */}

                          <td>
                            {startIndex +
                              index +
                              1}
                          </td>

                          {/* COMPLAINT ID */}

                          <td className="complaint-id">
                            {complaintId}
                          </td>

                          {/* SUBJECT */}

                          <td className="complaint-title">

                            <strong>
                              {complaint?.subject ||
                                "Untitled Complaint"}
                            </strong>

                            <small>
                              {complaint?.description
                                ? complaint.description.slice(
                                    0,
                                    60
                                  ) +
                                  (complaint
                                    .description
                                    .length >
                                  60
                                    ? "..."
                                    : "")
                                : ""}
                            </small>

                          </td>

                          {/* STUDENT */}

                          <td>

                            <div className="student-cell">

                              <div className="student-avatar">

                                {studentName
                                  .charAt(
                                    0
                                  )
                                  .toUpperCase()}

                              </div>

                              <div>

                                <strong>
                                  {studentName}
                                </strong>

                                <small>
                                  {getStudentId(
                                    complaint
                                  )}
                                </small>

                              </div>

                            </div>

                          </td>

                          {/* CATEGORY */}

                          <td>

                            <span className="type-badge">

                              {getCategoryLabel(
                                complaint?.category
                              )}

                            </span>

                          </td>

                          {/* DEPARTMENT */}

                          <td>
                            {getStudentDepartment(
                              complaint
                            )}
                          </td>

                          {/* STATUS */}

                          <td>

                            <span
                              className={statusClass(
                                complaint?.status
                              )}
                            >
                              {getStatusLabel(
                                complaint?.status
                              )}
                            </span>

                          </td>

                          {/* DATE */}

                          <td>
                            {getDate(
                              complaint
                            )}
                          </td>

                          {/* ACTIONS */}

                          <td>

                            <div className="complaint-actions">

                              {/* VIEW */}

                              <button
                                type="button"
                                className="complaint-action view"
                                title="View Complaint"
                                onClick={() =>
                                  handleViewComplaint(
                                    complaint
                                  )
                                }
                              >
                                <FaEye />
                              </button>

                              {/* RESOLVE */}

                              {complaint.status !==
                                "resolved" &&
                                complaint.status !==
                                  "rejected" && (
                                  <button
                                    type="button"
                                    className="complaint-action resolve"
                                    title="Resolve Complaint"
                                    disabled={
                                      actionLoading !==
                                      null
                                    }
                                    onClick={() =>
                                      handleResolveComplaint(
                                        complaint
                                      )
                                    }
                                  >
                                    {isResolving ? (
                                      "..."
                                    ) : (
                                      <FaCheck />
                                    )}
                                  </button>
                                )}

                              {/* REJECT */}

                              {complaint.status !==
                                "rejected" &&
                                complaint.status !==
                                  "resolved" && (
                                  <button
                                    type="button"
                                    className="complaint-action reject"
                                    title="Reject Complaint"
                                    disabled={
                                      actionLoading !==
                                      null
                                    }
                                    onClick={() =>
                                      handleRejectComplaint(
                                        complaint
                                      )
                                    }
                                  >
                                    {isRejecting ? (
                                      "..."
                                    ) : (
                                      <FaTimes />
                                    )}
                                  </button>
                                )}

                              {/* DELETE */}

                              <button
                                type="button"
                                className="complaint-action delete"
                                title="Delete Complaint"
                                disabled={
                                  actionLoading !==
                                  null
                                }
                                onClick={() =>
                                  handleDeleteComplaint(
                                    complaint
                                  )
                                }
                              >
                                {isDeleting ? (
                                  "..."
                                ) : (
                                  <FaTrash />
                                )}
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

          {/* =================================================
              PAGINATION
          ================================================== */}

          <div className="table-footer">

            <div className="pagination-info">

              Showing{" "}

              {filteredComplaints.length ===
              0
                ? 0
                : startIndex + 1}

              {" - "}

              {Math.min(
                startIndex +
                  rowsPerPage,
                filteredComplaints.length
              )}

              {" of "}

              {filteredComplaints.length}

              {" complaints"}

            </div>

            <div className="pagination">

              <button
                type="button"
                disabled={
                  safePage <= 1
                }
                onClick={() =>
                  setPage(
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
                  length: totalPages,
                },
                (_, index) =>
                  index + 1
              )
                .slice(
                  Math.max(
                    0,
                    safePage - 3
                  ),
                  Math.min(
                    totalPages,
                    safePage + 2
                  )
                )
                .map((number) => (

                  <button
                    type="button"
                    key={number}
                    className={
                      number ===
                      safePage
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      setPage(number)
                    }
                  >
                    {number}
                  </button>

                ))}

              <button
                type="button"
                disabled={
                  safePage >=
                  totalPages
                }
                onClick={() =>
                  setPage(
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

        </section>

      </main>

      {/* =====================================================
          VIEW COMPLAINT MODAL
      ====================================================== */}

      {viewModalOpen && (

        <div
          className="complaint-modal-overlay"
          onClick={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeViewModal();
            }
          }}
        >

          <div className="complaint-view-modal">

            {/* HEADER */}

            <div className="complaint-modal-header">

              <div>

                <h2>
                  Complaint Details
                </h2>

                <p>
                  {selectedComplaint
                    ? getComplaintId(
                        selectedComplaint
                      )
                    : "Loading..."}
                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeViewModal
                }
                disabled={viewLoading}
              >
                <FaTimes />
              </button>

            </div>

            {/* BODY */}

            {viewLoading ? (

              <div className="complaint-modal-loading">
                Loading complaint details...
              </div>

            ) : selectedComplaint ? (

              <div className="complaint-view-content">

                {/* STUDENT INFORMATION */}

                <div className="complaint-detail-grid">

                  <div className="complaint-detail-item">

                    <span>
                      Student Name
                    </span>

                    <strong>
                      {getStudentName(
                        selectedComplaint
                      )}
                    </strong>

                  </div>

                  <div className="complaint-detail-item">

                    <span>
                      Student ID
                    </span>

                    <strong>
                      {getStudentId(
                        selectedComplaint
                      )}
                    </strong>

                  </div>

                  <div className="complaint-detail-item">

                    <span>
                      Email
                    </span>

                    <strong>
                      {getStudentEmail(
                        selectedComplaint
                      )}
                    </strong>

                  </div>

                  <div className="complaint-detail-item">

                    <span>
                      Phone
                    </span>

                    <strong>
                      {getStudentPhone(
                        selectedComplaint
                      )}
                    </strong>

                  </div>

                  <div className="complaint-detail-item">

                    <span>
                      Department
                    </span>

                    <strong>
                      {getStudentDepartment(
                        selectedComplaint
                      )}
                    </strong>

                  </div>

                  <div className="complaint-detail-item">

                    <span>
                      Category
                    </span>

                    <strong>
                      {getCategoryLabel(
                        selectedComplaint.category
                      )}
                    </strong>

                  </div>

                  <div className="complaint-detail-item">

                    <span>
                      Status
                    </span>

                    <strong>
                      <span
                        className={statusClass(
                          selectedComplaint.status
                        )}
                      >
                        {getStatusLabel(
                          selectedComplaint.status
                        )}
                      </span>
                    </strong>

                  </div>

                  <div className="complaint-detail-item">

                    <span>
                      Created Date
                    </span>

                    <strong>
                      {getDate(
                        selectedComplaint
                      )}
                    </strong>

                  </div>

                </div>

                {/* SUBJECT */}

                <div className="complaint-detail-section">

                  <h3>
                    Subject
                  </h3>

                  <p>
                    {selectedComplaint.subject ||
                      "-"}
                  </p>

                </div>

                {/* DESCRIPTION */}

                <div className="complaint-detail-section">

                  <h3>
                    Description
                  </h3>

                  <p>
                    {selectedComplaint.description ||
                      "-"}
                  </p>

                </div>

                {/* RESPONSE */}

                <div className="complaint-detail-section">

                  <h3>
                    Response
                  </h3>

                  <p>
                    {selectedComplaint.response ||
                      "No response added."}
                  </p>

                </div>

                {/* RESOLVED INFORMATION */}

                {selectedComplaint.status ===
                  "resolved" && (

                  <div className="complaint-detail-section">

                    <h3>
                      Resolution Information
                    </h3>

                    <p>
                      Resolved At:{" "}
                      {getResolvedDate(
                        selectedComplaint
                      )}
                    </p>

                    {selectedComplaint.resolvedBy && (
                      <p>
                        Resolved By:{" "}
                        {selectedComplaint
                          .resolvedBy
                          ?.name ||
                          selectedComplaint
                            .resolvedBy
                            ?.email ||
                          "-"}
                      </p>
                    )}

                  </div>

                )}

                {/* MODAL ACTIONS */}

                <div className="complaint-modal-actions">

                  {selectedComplaint.status !==
                    "resolved" &&
                    selectedComplaint.status !==
                      "rejected" && (

                    <>
                      <button
                        type="button"
                        className="modal-resolve-btn"
                        disabled={
                          actionLoading !==
                          null
                        }
                        onClick={() =>
                          handleResolveComplaint(
                            selectedComplaint
                          )
                        }
                      >
                        <FaCheck />
                        Resolve Complaint
                      </button>

                      <button
                        type="button"
                        className="modal-reject-btn"
                        disabled={
                          actionLoading !==
                          null
                        }
                        onClick={() =>
                          handleRejectComplaint(
                            selectedComplaint
                          )
                        }
                      >
                        <FaTimes />
                        Reject Complaint
                      </button>
                    </>

                  )}

                  <button
                    type="button"
                    className="modal-delete-btn"
                    disabled={
                      actionLoading !==
                      null
                    }
                    onClick={() =>
                      handleDeleteComplaint(
                        selectedComplaint
                      )
                    }
                  >
                    <FaTrash />
                    Delete Complaint
                  </button>

                  <button
                    type="button"
                    className="modal-close-btn"
                    onClick={
                      closeViewModal
                    }
                    disabled={
                      actionLoading !==
                      null
                    }
                  >
                    Close
                  </button>

                </div>

              </div>

            ) : (

              <div className="complaint-modal-loading">
                Complaint details not found.
              </div>

            )}

          </div>

        </div>

      )}

    </div>
  );
};

export default Complaints;