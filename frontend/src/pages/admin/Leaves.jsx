import { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import "./Leaves.css";

// ==========================================
// HELPERS
// ==========================================

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const calculateDays = (fromDate, toDate) => {
  if (!fromDate || !toDate) return 0;

  const from = new Date(fromDate);
  const to = new Date(toDate);

  const difference =
    Math.ceil(
      (to.getTime() - from.getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

  return difference > 0 ? difference : 0;
};

const capitalize = (value = "") => {
  if (!value) return "-";

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
};

// ==========================================
// COMPONENT
// ==========================================

export default function Leaves() {
  // ========================================
  // STATE
  // ========================================

  const [leaves, setLeaves] = useState([]);

  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("All Status");

  const [typeFilter, setTypeFilter] =
    useState("All Types");

  const [selectedLeaves, setSelectedLeaves] =
    useState([]);

  const [bulkAction, setBulkAction] =
    useState("Bulk Actions");

  const [loading, setLoading] = useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] = useState("");

  // ==========================================
  // FETCH LEAVES
  // ==========================================

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        page: pagination.currentPage,
        limit: pagination.limit,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (statusFilter !== "All Status") {
        params.status =
          statusFilter.toLowerCase();
      }

      if (typeFilter !== "All Types") {
        params.leaveType =
          typeFilter.toLowerCase();
      }

      const response = await api.get(
        "/admin/leaves",
        {
          params,
        }
      );

      const data = response.data;

      setLeaves(data.leaves || []);

      setStatistics(
        data.statistics || {
          total: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
        }
      );

      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error(
        "Fetch Leaves Error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load leave applications."
      );

      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // INITIAL / FILTER / PAGE LOAD
  // ==========================================

  useEffect(() => {
    fetchLeaves();
  }, [
    pagination.currentPage,
    statusFilter,
    typeFilter,
  ]);

  // ==========================================
  // SEARCH
  // ==========================================

  const handleSearch = () => {
    setPagination((prev) => ({
      ...prev,
      currentPage: 1,
    }));

    fetchLeaves();
  };

  // ==========================================
  // RESET
  // ==========================================

  const handleReset = () => {
    setSearch("");
    setStatusFilter("All Status");
    setTypeFilter("All Types");

    setSelectedLeaves([]);

    setPagination((prev) => ({
      ...prev,
      currentPage: 1,
    }));
  };

  // ==========================================
  // VIEW LEAVE
  // ==========================================

  const viewLeave = async (id) => {
    try {
      const response = await api.get(
        `/admin/leaves/${id}`
      );

      const leave = response.data.leave;

      if (!leave) {
        window.alert(
          "Leave record not found."
        );
        return;
      }

      const studentName =
        leave.student?.user?.name ||
        "Unknown Student";

      const studentId =
        leave.student?.studentId || "-";

      const rollNumber =
        leave.student?.rollNumber || "-";

      const department =
        leave.student?.department?.code || "-";

      const semester =
        leave.student?.semester || "-";

      const message = `
Student: ${studentName}
Student ID: ${studentId}
Roll Number: ${rollNumber}
Department: ${department}
Semester: ${semester}

Leave Type: ${capitalize(
        leave.leaveType
      )}

From: ${formatDate(
        leave.fromDate
      )}

To: ${formatDate(
        leave.toDate
      )}

Days: ${calculateDays(
        leave.fromDate,
        leave.toDate
      )}

Reason:
${leave.reason || "-"}

Status: ${capitalize(
        leave.status
      )}

Review Comment:
${leave.reviewComment || "No review comment"}

Reviewed By:
${leave.reviewedBy?.name || "Not reviewed"}
      `;

      window.alert(message);
    } catch (err) {
      console.error(
        "View Leave Error:",
        err
      );

      window.alert(
        err.response?.data?.message ||
          "Unable to load leave details."
      );
    }
  };

  // ==========================================
  // UPDATE LEAVE STATUS
  // ==========================================

  const updateStatus = async (
    id,
    status
  ) => {
    const action =
      status === "approved"
        ? "approve"
        : status === "rejected"
        ? "reject"
        : "move this leave back to pending";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this leave?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);

      await api.put(
        `/admin/leaves/${id}`,
        {
          status,
        }
      );

      await fetchLeaves();

      setSelectedLeaves((prev) =>
        prev.filter(
          (item) => item !== id
        )
      );
    } catch (err) {
      console.error(
        "Update Leave Error:",
        err
      );

      window.alert(
        err.response?.data?.message ||
          "Failed to update leave."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // DELETE LEAVE
  // ==========================================

  const deleteLeave = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this leave record?"
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);

      await api.delete(
        `/admin/leaves/${id}`
      );

      setSelectedLeaves((prev) =>
        prev.filter(
          (item) => item !== id
        )
      );

      await fetchLeaves();
    } catch (err) {
      console.error(
        "Delete Leave Error:",
        err
      );

      window.alert(
        err.response?.data?.message ||
          "Failed to delete leave."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // SELECT ONE
  // ==========================================

  const toggleSelect = (id) => {
    setSelectedLeaves((prev) =>
      prev.includes(id)
        ? prev.filter(
            (item) => item !== id
          )
        : [...prev, id]
    );
  };

  // ==========================================
  // SELECT ALL
  // ==========================================

  const toggleSelectAll = () => {
    if (
      leaves.length > 0 &&
      selectedLeaves.length ===
        leaves.length
    ) {
      setSelectedLeaves([]);
      return;
    }

    setSelectedLeaves(
      leaves.map(
        (leave) => leave._id
      )
    );
  };

  // ==========================================
  // BULK ACTION
  // ==========================================

  const applyBulkAction = async () => {
    if (selectedLeaves.length === 0) {
      window.alert(
        "Please select at least one leave."
      );
      return;
    }

    if (
      bulkAction === "Bulk Actions"
    ) {
      window.alert(
        "Please select a bulk action."
      );
      return;
    }

    try {
      setActionLoading(true);

      // --------------------------------------
      // APPROVE SELECTED
      // --------------------------------------

      if (
        bulkAction ===
        "Approve Selected"
      ) {
        const confirmed =
          window.confirm(
            `Are you sure you want to approve ${selectedLeaves.length} selected leave(s)?`
          );

        if (!confirmed) return;

        await Promise.all(
          selectedLeaves.map((id) =>
            api.put(
              `/admin/leaves/${id}`,
              {
                status: "approved",
              }
            )
          )
        );
      }

      // --------------------------------------
      // REJECT SELECTED
      // --------------------------------------

      if (
        bulkAction ===
        "Reject Selected"
      ) {
        const confirmed =
          window.confirm(
            `Are you sure you want to reject ${selectedLeaves.length} selected leave(s)?`
          );

        if (!confirmed) return;

        await Promise.all(
          selectedLeaves.map((id) =>
            api.put(
              `/admin/leaves/${id}`,
              {
                status: "rejected",
              }
            )
          )
        );
      }

      // --------------------------------------
      // DELETE SELECTED
      // --------------------------------------

      if (
        bulkAction ===
        "Delete Selected"
      ) {
        const confirmed =
          window.confirm(
            `Are you sure you want to delete ${selectedLeaves.length} selected leave(s)?`
          );

        if (!confirmed) return;

        await Promise.all(
          selectedLeaves.map((id) =>
            api.delete(
              `/admin/leaves/${id}`
            )
          )
        );
      }

      setSelectedLeaves([]);

      setBulkAction(
        "Bulk Actions"
      );

      await fetchLeaves();
    } catch (err) {
      console.error(
        "Bulk Action Error:",
        err
      );

      window.alert(
        err.response?.data?.message ||
          "Bulk action failed."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // DISPLAYED LEAVES
  // ==========================================

  const displayedLeaves = useMemo(() => {
    return leaves;
  }, [leaves]);

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="leaves-page">

      {/* =====================================
          PAGE HEADER
      ====================================== */}

      <div className="leaves-header">

        <div>

          <div className="leaves-breadcrumb">
            Dashboard
            <span>›</span>
            Leaves
          </div>

          <h1>
            Leaves
          </h1>

          <p>
            Manage and review student
            leave applications.
          </p>

        </div>

        <button
          className="leave-primary-button"
          onClick={() =>
            window.alert(
              "Add Leave functionality can be connected next."
            )
          }
        >
          <span>+</span>
          Add Leave
        </button>

      </div>


      {/* =====================================
          ERROR MESSAGE
      ====================================== */}

      {error && (
        <div
          className="leave-error"
          style={{
            marginBottom: "16px",
            padding: "12px 16px",
            borderRadius: "8px",
            background: "#fff1f2",
            color: "#b91c1c",
            border:
              "1px solid #fecdd3",
          }}
        >
          {error}
        </div>
      )}


      {/* =====================================
          STATISTICS
      ====================================== */}

      <div className="leave-stat-grid">

        {/* TOTAL */}

        <div className="leave-stat-card">

          <div className="leave-stat-icon blue">
            ▣
          </div>

          <div>

            <span>
              Total Leaves
            </span>

            <strong>
              {statistics.total}
            </strong>

            <small className="green-text">
              All applications
            </small>

          </div>

        </div>


        {/* PENDING */}

        <div className="leave-stat-card">

          <div className="leave-stat-icon orange">
            ◷
          </div>

          <div>

            <span>
              Pending Leaves
            </span>

            <strong>
              {statistics.pending}
            </strong>

            <small className="orange-text">
              Awaiting approval
            </small>

          </div>

        </div>


        {/* APPROVED */}

        <div className="leave-stat-card">

          <div className="leave-stat-icon green">
            ✓
          </div>

          <div>

            <span>
              Approved Leaves
            </span>

            <strong>
              {statistics.approved}
            </strong>

            <small className="green-text">
              Successfully approved
            </small>

          </div>

        </div>


        {/* REJECTED */}

        <div className="leave-stat-card">

          <div className="leave-stat-icon red">
            !
          </div>

          <div>

            <span>
              Rejected Leaves
            </span>

            <strong>
              {statistics.rejected}
            </strong>

            <small className="red-text">
              Rejected applications
            </small>

          </div>

        </div>

      </div>


      {/* =====================================
          FILTER AREA
      ====================================== */}

      <div className="leaves-filter-card">

        {/* SEARCH */}

        <div className="leave-search">

          <span>
            ⌕
          </span>

          <input
            type="text"
            placeholder="Search by student, ID, leave..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            onKeyDown={(e) => {
              if (
                e.key === "Enter"
              ) {
                handleSearch();
              }
            }}
          />

        </div>


        {/* TYPE */}

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(
              e.target.value
            );

            setPagination(
              (prev) => ({
                ...prev,
                currentPage: 1,
              })
            );
          }}
        >

          <option>
            All Types
          </option>

          <option>
            Medical
          </option>

          <option>
            Personal
          </option>

          <option>
            Family
          </option>

          <option>
            Academic
          </option>

          <option>
            Other
          </option>

        </select>


        {/* STATUS */}

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(
              e.target.value
            );

            setPagination(
              (prev) => ({
                ...prev,
                currentPage: 1,
              })
            );
          }}
        >

          <option>
            All Status
          </option>

          <option>
            Pending
          </option>

          <option>
            Approved
          </option>

          <option>
            Rejected
          </option>

        </select>


        {/* FILTER */}

        <button
          className="filter-button"
          onClick={handleSearch}
        >
          ⚱ Filter
        </button>


        {/* RESET */}

        <button
          className="reset-button"
          onClick={handleReset}
        >
          ↻ Reset
        </button>

      </div>


      {/* =====================================
          TABLE CARD
      ====================================== */}

      <div className="leaves-table-card">

        {/* TABLE HEADER */}

        <div className="table-top">

          <div>

            <h2>
              Leave Applications
            </h2>

            <p>
              Review and manage student
              leave requests.
            </p>

          </div>

          <span className="total-leaves-badge">
            {pagination.totalItems} Records
          </span>

        </div>


        {/* TABLE */}

        <div className="table-wrapper">

          <table className="leaves-table">

            <thead>

              <tr>

                <th>

                  <input
                    type="checkbox"
                    checked={
                      leaves.length > 0 &&
                      selectedLeaves.length ===
                        leaves.length
                    }
                    onChange={
                      toggleSelectAll
                    }
                  />

                </th>

                <th>
                  #
                </th>

                <th>
                  Leave ID
                </th>

                <th>
                  Student
                </th>

                <th>
                  Type
                </th>

                <th>
                  From
                </th>

                <th>
                  To
                </th>

                <th>
                  Days
                </th>

                <th>
                  Reason
                </th>

                <th>
                  Status
                </th>

                <th>
                  Actions
                </th>

              </tr>

            </thead>


            <tbody>

              {/* LOADING */}

              {loading && (
                <tr>

                  <td
                    colSpan="11"
                    style={{
                      textAlign:
                        "center",
                      padding:
                        "40px",
                    }}
                  >
                    Loading leave
                    applications...
                  </td>

                </tr>
              )}


              {/* EMPTY */}

              {!loading &&
                displayedLeaves.length ===
                  0 && (
                  <tr>

                    <td
                      colSpan="11"
                      style={{
                        textAlign:
                          "center",
                        padding:
                          "40px",
                      }}
                    >
                      No leave
                      applications
                      found.
                    </td>

                  </tr>
                )}


              {/* DATA */}

              {!loading &&
                displayedLeaves.map(
                  (
                    leave,
                    index
                  ) => {

                    const studentName =
                      leave.student
                        ?.user
                        ?.name ||
                      "Unknown Student";

                    const studentId =
                      leave.student
                        ?.studentId ||
                      "-";

                    const leaveType =
                      capitalize(
                        leave.leaveType
                      );

                    const status =
                      capitalize(
                        leave.status
                      );

                    const days =
                      calculateDays(
                        leave.fromDate,
                        leave.toDate
                      );

                    return (
                      <tr
                        key={
                          leave._id
                        }
                      >

                        {/* CHECKBOX */}

                        <td>

                          <input
                            type="checkbox"
                            checked={selectedLeaves.includes(
                              leave._id
                            )}
                            onChange={() =>
                              toggleSelect(
                                leave._id
                              )
                            }
                          />

                        </td>


                        {/* NUMBER */}

                        <td>

                          {(pagination.currentPage -
                            1) *
                            pagination.limit +
                            index +
                            1}

                        </td>


                        {/* LEAVE ID */}

                        <td>

                          <strong className="leave-id">
                            LV
                            {String(
                              (pagination.currentPage -
                                1) *
                                pagination.limit +
                                index +
                                1
                            ).padStart(
                              3,
                              "0"
                            )}
                          </strong>

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
                                {
                                  studentName
                                }
                              </strong>

                              <span>
                                {
                                  studentId
                                }
                              </span>

                            </div>

                          </div>

                        </td>


                        {/* TYPE */}

                        <td>

                          <span className="type-badge">
                            {
                              leaveType
                            }
                          </span>

                        </td>


                        {/* FROM */}

                        <td>
                          {formatDate(
                            leave.fromDate
                          )}
                        </td>


                        {/* TO */}

                        <td>
                          {formatDate(
                            leave.toDate
                          )}
                        </td>


                        {/* DAYS */}

                        <td>

                          <strong>
                            {days}
                          </strong>

                        </td>


                        {/* REASON */}

                        <td>

                          <span className="reason-text">
                            {
                              leave.reason ||
                              "-"
                            }
                          </span>

                        </td>


                        {/* STATUS */}

                        <td>

                          <span
                            className={`status-badge ${
                              leave.status
                            }`}
                          >
                            {
                              status
                            }
                          </span>

                        </td>


                        {/* ACTIONS */}

                        <td>

                          <div className="action-buttons">

                            {/* VIEW */}

                            <button
                              title="View"
                              className="view-action"
                              onClick={() =>
                                viewLeave(
                                  leave._id
                                )
                              }
                              disabled={
                                actionLoading
                              }
                            >
                              👁
                            </button>


                            {/* APPROVE / REJECT */}

                            {leave.status ===
                              "pending" && (
                              <>
                                <button
                                  title="Approve"
                                  className="approve-action"
                                  onClick={() =>
                                    updateStatus(
                                      leave._id,
                                      "approved"
                                    )
                                  }
                                  disabled={
                                    actionLoading
                                  }
                                >
                                  ✓
                                </button>

                                <button
                                  title="Reject"
                                  className="reject-action"
                                  onClick={() =>
                                    updateStatus(
                                      leave._id,
                                      "rejected"
                                    )
                                  }
                                  disabled={
                                    actionLoading
                                  }
                                >
                                  ✕
                                </button>
                              </>
                            )}


                            {/* DELETE */}

                            <button
                              title="Delete"
                              className="delete-action"
                              onClick={() =>
                                deleteLeave(
                                  leave._id
                                )
                              }
                              disabled={
                                actionLoading
                              }
                            >
                              🗑
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )}

            </tbody>

          </table>

        </div>


        {/* =====================================
            TABLE FOOTER
        ====================================== */}

        <div className="leaves-table-footer">

          {/* BULK ACTION */}

          <div className="bulk-section">

            <select
              value={bulkAction}
              onChange={(e) =>
                setBulkAction(
                  e.target.value
                )
              }
            >

              <option>
                Bulk Actions
              </option>

              <option>
                Approve Selected
              </option>

              <option>
                Reject Selected
              </option>

              <option>
                Delete Selected
              </option>

            </select>


            <button
              onClick={
                applyBulkAction
              }
              disabled={
                actionLoading
              }
            >
              Apply
            </button>

          </div>


          {/* PAGINATION */}

          <div className="pagination">

            <button
              className="page-arrow"
              disabled={
                !pagination.hasPreviousPage ||
                loading
              }
              onClick={() =>
                setPagination(
                  (prev) => ({
                    ...prev,
                    currentPage:
                      Math.max(
                        prev.currentPage -
                          1,
                        1
                      ),
                  })
                )
              }
            >
              ‹
            </button>


            {Array.from(
              {
                length:
                  pagination.totalPages ||
                  1,
              },
              (_, index) =>
                index + 1
            ).map(
              (pageNumber) => (
                <button
                  key={
                    pageNumber
                  }
                  className={`page-number ${
                    pageNumber ===
                    pagination.currentPage
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setPagination(
                      (prev) => ({
                        ...prev,
                        currentPage:
                          pageNumber,
                      })
                    )
                  }
                  disabled={
                    loading
                  }
                >
                  {
                    pageNumber
                  }
                </button>
              )
            )}


            <button
              className="page-arrow"
              disabled={
                !pagination.hasNextPage ||
                loading
              }
              onClick={() =>
                setPagination(
                  (prev) => ({
                    ...prev,
                    currentPage:
                      prev.currentPage +
                      1,
                  })
                )
              }
            >
              ›
            </button>

          </div>

        </div>

      </div>


      {/* =====================================
          FOOTER
      ====================================== */}

      <div className="leaves-footer">

        <div>

          🎓

          <strong>
            SmartCampus
          </strong>

          <span>
            |
          </span>

          Empowering Education
          Through Technology

        </div>

        <div>
          v1.0.0&nbsp;&nbsp; | &nbsp;&nbsp;
          Gandhi Engineering College
        </div>

      </div>

    </div>
  );
}