import { useEffect, useMemo, useState } from "react";
import DatePickerInput from "../../components/DatePickerInput";
import api from "../../services/api";
import "./Fees.css";

const initialForm = {
  student: "",
  semester: "",
  feeType: "tuition",
  amount: "",
  paidAmount: "0",
  dueDate: "",
  paymentDate: "",
  transactionId: "",
  status: "pending",
};

const feeTypes = [
  { value: "tuition", label: "Tuition" },
  { value: "hostel", label: "Hostel" },
  { value: "library", label: "Library" },
  { value: "exam", label: "Exam" },
  { value: "transport", label: "Transport" },
  { value: "other", label: "Other" },
];

const statuses = [
  { value: "pending", label: "Pending" },
  { value: "partial", label: "Partially Paid" },
  { value: "paid", label: "Paid" },
  { value: "overdue", label: "Overdue" },
];

const Fees = () => {
  const [fees, setFees] = useState([]);
  const [students, setStudents] = useState([]);
  const [departmentList, setDepartmentList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [semester, setSemester] = useState("all");
  const [status, setStatus] = useState("all");

  const [page, setPage] = useState(1);
  const perPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("add");
  const [selectedFee, setSelectedFee] = useState(null);

  const [form, setForm] = useState(initialForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // =========================================================
  // FETCH FEES
  // =========================================================

  const fetchFees = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/fees");

      const data = response.data;

      const list =
        data.fees ||
        data.data?.fees ||
        data.data ||
        [];

      setFees(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Fee fetch error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load fee records."
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
      setStudentsLoading(true);

      const response = await api.get(
        "/admin/students"
      );

      const data = response.data;

      const list =
        data.students ||
        data.data?.students ||
        data.data ||
        [];

      setStudents(
        Array.isArray(list) ? list : []
      );
    } catch (err) {
      console.error(
        "Student fetch error:",
        err
      );

      setFormError(
        err.response?.data?.message ||
          "Unable to load students."
      );
    } finally {
      setStudentsLoading(false);
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

      const data = response.data;

      const list =
        data.departments ||
        data.data?.departments ||
        data.data ||
        [];

      setDepartmentList(
        Array.isArray(list) ? list : []
      );
    } catch (err) {
      console.error(
        "Department fetch error:",
        err
      );
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchFees();
    fetchStudents();
    fetchDepartments();
  }, []);

  // =========================================================
  // HELPER FUNCTIONS
  // =========================================================

  const getStudent = (fee) => {
    if (!fee?.student) return {};

    return typeof fee.student === "object"
      ? fee.student
      : {};
  };

  const getUser = (fee) => {
    const student = getStudent(fee);

    if (
      student.user &&
      typeof student.user === "object"
    ) {
      return student.user;
    }

    return {};
  };

  const getName = (fee) => {
    return (
      getUser(fee).name ||
      fee?.studentName ||
      "Unknown Student"
    );
  };

  const getRollNumber = (fee) => {
    const student = getStudent(fee);

    return (
      student.rollNumber ||
      student.rollNo ||
      fee?.rollNumber ||
      "-"
    );
  };

  const getStudentId = (fee) => {
    const student = getStudent(fee);

    return (
      student.studentId ||
      student.registrationNumber ||
      fee?.studentId ||
      "-"
    );
  };

  // =========================================================
  // DEPARTMENT FIX
  // =========================================================

  const getDepartment = (fee) => {
    const student = getStudent(fee);

    if (!student?.department) {
      return "-";
    }

    // If department is already populated
    if (
      typeof student.department === "object"
    ) {
      return (
        student.department.code ||
        student.department.name ||
        "-"
      );
    }

    // If department is only an ObjectId
    const departmentId =
      String(student.department);

    const departmentData =
      departmentList.find(
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

    return "-";
  };

  const getSemester = (fee) => {
    return (
      fee?.semester ??
      getStudent(fee).semester ??
      "-"
    );
  };

  const getAmount = (fee) => {
    return Number(fee?.amount || 0);
  };

  const getPaid = (fee) => {
    return Number(
      fee?.paidAmount || 0
    );
  };

  const getPending = (fee) => {
    return Math.max(
      0,
      getAmount(fee) -
        getPaid(fee)
    );
  };

  const getStatus = (fee) => {
    if (fee?.status) {
      return String(
        fee.status
      ).toLowerCase();
    }

    const pending =
      getPending(fee);

    if (pending === 0) {
      return "paid";
    }

    if (getPaid(fee) > 0) {
      return "partial";
    }

    return "pending";
  };

  const getLastPayment = (fee) => {
    return (
      fee?.paymentDate ||
      null
    );
  };

  const formatDate = (date) => {
    if (!date) return "-";

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return "-";
    }

    return parsed.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const money = (value) => {
    return `₹${Number(
      value || 0
    ).toLocaleString("en-IN")}`;
  };

  // =========================================================
  // STUDENT DROPDOWN HELPERS
  // =========================================================

  const getStudentDisplayName = (
    student
  ) => {
    if (!student) {
      return "Unknown Student";
    }

    if (
      student.user &&
      typeof student.user === "object"
    ) {
      return (
        student.user.name ||
        student.name ||
        "Unknown Student"
      );
    }

    return (
      student.name ||
      "Unknown Student"
    );
  };

  const getStudentRoll = (
    student
  ) => {
    return (
      student?.rollNumber ||
      student?.rollNo ||
      "-"
    );
  };

  const getStudentCode = (
    student
  ) => {
    return (
      student?.studentId ||
      student?.registrationNumber ||
      "-"
    );
  };

  // =========================================================
  // STATISTICS
  // =========================================================

  const statistics = useMemo(() => {
    const total = fees.reduce(
      (sum, fee) =>
        sum + getAmount(fee),
      0
    );

    const paid = fees.reduce(
      (sum, fee) =>
        sum + getPaid(fee),
      0
    );

    const pending = fees.reduce(
      (sum, fee) =>
        sum + getPending(fee),
      0
    );

    const defaulters =
      fees.filter(
        (fee) =>
          getStatus(fee) ===
            "pending" ||
          getStatus(fee) ===
            "overdue"
      ).length;

    return {
      total,
      paid,
      pending,
      defaulters,
    };
  }, [fees]);

  // =========================================================
  // DEPARTMENT FILTER
  // =========================================================

  const departments = useMemo(() => {
    const fromApi =
      departmentList
        .filter(
          (item) =>
            item.isActive !== false
        )
        .map(
          (item) =>
            item.code ||
            item.name
        )
        .filter(Boolean);

    if (fromApi.length > 0) {
      return [
        ...new Set(fromApi),
      ];
    }

    return [
      ...new Set(
        fees
          .map(getDepartment)
          .filter(
            (item) =>
              item !== "-"
          )
      ),
    ];
  }, [
    departmentList,
    fees,
  ]);

  // =========================================================
  // FILTER FEES
  // =========================================================

  const filteredFees = useMemo(() => {
    const value =
      search
        .trim()
        .toLowerCase();

    return fees.filter(
      (fee) => {
        const name =
          getName(fee)
            .toLowerCase();

        const roll =
          getRollNumber(fee)
            .toString()
            .toLowerCase();

        const studentId =
          getStudentId(fee)
            .toString()
            .toLowerCase();

        const transaction =
          String(
            fee.transactionId ||
              ""
          ).toLowerCase();

        const matchesSearch =
          !value ||
          name.includes(value) ||
          roll.includes(value) ||
          studentId.includes(value) ||
          transaction.includes(value);

        const matchesDepartment =
          department === "all" ||
          getDepartment(fee) ===
            department;

        const matchesSemester =
          semester === "all" ||
          String(
            getSemester(fee)
          ) === semester;

        const matchesStatus =
          status === "all" ||
          getStatus(fee) ===
            status;

        return (
          matchesSearch &&
          matchesDepartment &&
          matchesSemester &&
          matchesStatus
        );
      }
    );
  }, [
    fees,
    departmentList,
    search,
    department,
    semester,
    status,
  ]);

  // =========================================================
  // PAGINATION
  // =========================================================

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredFees.length /
        perPage
    )
  );

  const currentPage = Math.min(
    page,
    totalPages
  );

  const start =
    (currentPage - 1) *
    perPage;

  const currentFees =
    filteredFees.slice(
      start,
      start + perPage
    );

  // =========================================================
  // RESET FILTERS
  // =========================================================

  const resetFilters = () => {
    setSearch("");
    setDepartment("all");
    setSemester("all");
    setStatus("all");
    setPage(1);
  };

  // =========================================================
  // FORM
  // =========================================================

  const handleFormChange = (
    e
  ) => {
    const {
      name,
      value,
    } = e.target;

    setForm(
      (prev) => ({
        ...prev,
        [name]: value,
      })
    );

    setFormError("");
  };

  const resetForm = () => {
    setForm(initialForm);
    setFormError("");
    setSelectedFee(null);
  };

  // =========================================================
  // ADD FEE
  // =========================================================

  const openAddModal = () => {
    resetForm();
    setModalType("add");
    setShowModal(true);
  };

  // =========================================================
  // EDIT FEE
  // =========================================================

  const openEditModal =
    async (fee) => {
      try {
        setFormError("");
        setModalType("edit");
        setSelectedFee(fee);

        const response =
          await api.get(
            `/admin/fees/${fee._id}`
          );

        const data =
          response.data?.fee ||
          fee;

        setForm({
          student:
            typeof data.student ===
            "object"
              ? data.student?._id ||
                ""
              : data.student ||
                "",

          semester:
            data.semester ?? "",

          feeType:
            data.feeType ||
            "tuition",

          amount:
            data.amount ?? "",

          paidAmount:
            data.paidAmount ??
            0,

          dueDate:
            data.dueDate
              ? String(
                  data.dueDate
                ).slice(0, 10)
              : "",

          paymentDate:
            data.paymentDate
              ? String(
                  data.paymentDate
                ).slice(0, 10)
              : "",

          transactionId:
            data.transactionId ||
            "",

          status:
            data.status ||
            "pending",
        });

        setShowModal(true);
      } catch (err) {
        console.error(
          "Get fee error:",
          err
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load fee details."
        );
      }
    };

  // =========================================================
  // VIEW FEE
  // =========================================================

  const handleView =
    async (fee) => {
      try {
        const response =
          await api.get(
            `/admin/fees/${fee._id}`
          );

        const data =
          response.data?.fee ||
          fee;

        setSelectedFee(data);
        setModalType("view");
        setShowModal(true);
      } catch (err) {
        console.error(
          "View fee error:",
          err
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load fee details."
        );
      }
    };

  // =========================================================
  // CREATE / UPDATE FEE
  // =========================================================

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      setFormError("");

      if (!form.student) {
        setFormError(
          "Please select a student."
        );
        return;
      }

      if (!form.semester) {
        setFormError(
          "Please select a semester."
        );
        return;
      }

      if (!form.feeType) {
        setFormError(
          "Please select a fee type."
        );
        return;
      }

      if (
        form.amount === "" ||
        Number(form.amount) < 0
      ) {
        setFormError(
          "Please enter a valid amount."
        );
        return;
      }

      if (
        form.paidAmount === "" ||
        Number(form.paidAmount) < 0
      ) {
        setFormError(
          "Please enter a valid paid amount."
        );
        return;
      }

      if (
        Number(
          form.paidAmount
        ) >
        Number(form.amount)
      ) {
        setFormError(
          "Paid amount cannot be greater than total amount."
        );
        return;
      }

      try {
        setFormLoading(true);

        const payload = {
          student:
            form.student,

          semester:
            Number(
              form.semester
            ),

          feeType:
            form.feeType,

          amount:
            Number(
              form.amount
            ),

          paidAmount:
            Number(
              form.paidAmount
            ),

          dueDate:
            form.dueDate ||
            undefined,

          paymentDate:
            form.paymentDate ||
            null,

          transactionId:
            form.transactionId.trim(),

          status:
            form.status,
        };

        if (
          modalType === "add"
        ) {
          await api.post(
            "/admin/fees",
            payload
          );
        } else {
          await api.put(
            `/admin/fees/${selectedFee._id}`,
            {
              semester:
                payload.semester,

              feeType:
                payload.feeType,

              amount:
                payload.amount,

              paidAmount:
                payload.paidAmount,

              dueDate:
                payload.dueDate,

              paymentDate:
                payload.paymentDate,

              transactionId:
                payload.transactionId,

              status:
                payload.status,
            }
          );
        }

        setShowModal(false);
        resetForm();

        await fetchFees();
      } catch (err) {
        console.error(
          "Save fee error:",
          err
        );

        setFormError(
          err.response?.data
            ?.message ||
            "Unable to save fee record."
        );
      } finally {
        setFormLoading(false);
      }
    };

  // =========================================================
  // DELETE FEE
  // =========================================================

  const handleDelete =
    async (fee) => {
      const confirmed =
        window.confirm(
          `Are you sure you want to delete the fee record for ${getName(
            fee
          )}?`
        );

      if (!confirmed) {
        return;
      }

      try {
        setError("");

        await api.delete(
          `/admin/fees/${fee._id}`
        );

        await fetchFees();

        if (
          currentPage > 1 &&
          currentFees.length ===
            1
        ) {
          setPage(
            Math.max(
              1,
              currentPage - 1
            )
          );
        }
      } catch (err) {
        console.error(
          "Delete fee error:",
          err
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to delete fee record."
        );
      }
    };

  // =========================================================
  // EXPORT CSV
  // =========================================================

  const exportCSV = () => {
    if (
      !filteredFees.length
    ) {
      alert(
        "No fee records to export."
      );
      return;
    }

    const headers = [
      "Roll Number",
      "Student Name",
      "Student ID",
      "Department",
      "Semester",
      "Fee Type",
      "Total Fees",
      "Paid",
      "Pending",
      "Status",
      "Due Date",
      "Payment Date",
      "Transaction ID",
    ];

    const rows =
      filteredFees.map(
        (fee) => [
          getRollNumber(fee),
          getName(fee),
          getStudentId(fee),
          getDepartment(fee),
          getSemester(fee),
          fee.feeType || "",
          getAmount(fee),
          getPaid(fee),
          getPending(fee),
          getStatus(fee),
          formatDate(
            fee.dueDate
          ),
          formatDate(
            fee.paymentDate
          ),
          fee.transactionId ||
            "",
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
              `"${String(
                value
              ).replace(
                /"/g,
                '""'
              )}"`
          )
          .join(",")
      )
      .join("\n");

    const blob =
      new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      });

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;
    link.download =
      "smartcampus-fees.csv";

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    URL.revokeObjectURL(url);
  };

  // =========================================================
  // VIEW MODAL
  // =========================================================

  const renderViewModal =
    () => {
      if (!selectedFee) {
        return null;
      }

      return (
        <div
          className="fee-modal-overlay"
          onClick={() =>
            setShowModal(false)
          }
        >
          <div
            className="fee-modal fee-view-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="fee-modal-header">
              <div>
                <h2>
                  Fee Details
                </h2>

                <p>
                  Complete fee
                  record
                </p>
              </div>

              <button
                type="button"
                className="fee-modal-close"
                onClick={() =>
                  setShowModal(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="fee-view-grid">
              <div>
                <span>
                  Student Name
                </span>

                <strong>
                  {getName(
                    selectedFee
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Student ID
                </span>

                <strong>
                  {getStudentId(
                    selectedFee
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Roll Number
                </span>

                <strong>
                  {getRollNumber(
                    selectedFee
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Department
                </span>

                <strong>
                  {getDepartment(
                    selectedFee
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Semester
                </span>

                <strong>
                  {getSemester(
                    selectedFee
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Fee Type
                </span>

                <strong>
                  {selectedFee.feeType
                    ? selectedFee.feeType
                        .charAt(
                          0
                        )
                        .toUpperCase() +
                      selectedFee.feeType.slice(
                        1
                      )
                    : "-"}
                </strong>
              </div>

              <div>
                <span>
                  Total Amount
                </span>

                <strong>
                  {money(
                    selectedFee.amount
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Paid Amount
                </span>

                <strong className="view-paid">
                  {money(
                    selectedFee.paidAmount
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Pending Amount
                </span>

                <strong className="view-pending">
                  {money(
                    getPending(
                      selectedFee
                    )
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Status
                </span>

                <strong>
                  {getStatus(
                    selectedFee
                  )
                    .charAt(0)
                    .toUpperCase() +
                    getStatus(
                      selectedFee
                    ).slice(1)}
                </strong>
              </div>

              <div>
                <span>
                  Due Date
                </span>

                <strong>
                  {formatDate(
                    selectedFee.dueDate
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Payment Date
                </span>

                <strong>
                  {formatDate(
                    selectedFee.paymentDate
                  )}
                </strong>
              </div>

              <div className="fee-view-full">
                <span>
                  Transaction ID
                </span>

                <strong>
                  {selectedFee.transactionId ||
                    "-"}
                </strong>
              </div>
            </div>

            <div className="fee-modal-footer">
              <button
                type="button"
                className="fee-cancel-btn"
                onClick={() =>
                  setShowModal(
                    false
                  )
                }
              >
                Close
              </button>

              <button
                type="button"
                className="fee-save-btn"
                onClick={() =>
                  openEditModal(
                    selectedFee
                  )
                }
              >
                ✎ Edit Fee
              </button>
            </div>
          </div>
        </div>
      );
    };

  // =========================================================
  // ADD / EDIT MODAL
  // =========================================================

  const renderFormModal =
    () => {
      const isEdit =
        modalType ===
        "edit";

      return (
        <div
          className="fee-modal-overlay"
          onClick={() => {
            if (!formLoading) {
              setShowModal(
                false
              );
            }
          }}
        >
          <div
            className="fee-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <div className="fee-modal-header">
              <div>
                <h2>
                  {isEdit
                    ? "Edit Fee"
                    : "Add New Fee"}
                </h2>

                <p>
                  {isEdit
                    ? "Update fee information"
                    : "Create a new student fee record"}
                </p>
              </div>

              <button
                type="button"
                className="fee-modal-close"
                disabled={
                  formLoading
                }
                onClick={() =>
                  setShowModal(
                    false
                  )
                }
              >
                ×
              </button>
            </div>

            {formError && (
              <div className="fee-form-error">
                {formError}
              </div>
            )}

            <form
              className="fee-form"
              onSubmit={
                handleSubmit
              }
            >
              <div className="fee-form-grid">
                {/* STUDENT */}

                <div className="fee-form-group fee-form-full">
                  <label>
                    Student{" "}
                    <span>
                      *
                    </span>
                  </label>

                  <select
                    name="student"
                    value={
                      form.student
                    }
                    onChange={
                      handleFormChange
                    }
                    disabled={
                      isEdit ||
                      studentsLoading ||
                      formLoading
                    }
                    required
                  >
                    <option value="">
                      {studentsLoading
                        ? "Loading students..."
                        : "Select Student"}
                    </option>

                    {students.map(
                      (
                        student
                      ) => (
                        <option
                          key={
                            student._id
                          }
                          value={
                            student._id
                          }
                        >
                          {getStudentDisplayName(
                            student
                          )}{" "}
                          —{" "}
                          {getStudentCode(
                            student
                          )}{" "}
                          {getStudentRoll(
                            student
                          ) !==
                          "-"
                            ? `(${getStudentRoll(
                                student
                              )})`
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* SEMESTER */}

                <div className="fee-form-group">
                  <label>
                    Semester{" "}
                    <span>
                      *
                    </span>
                  </label>

                  <select
                    name="semester"
                    value={
                      form.semester
                    }
                    onChange={
                      handleFormChange
                    }
                    disabled={
                      formLoading
                    }
                    required
                  >
                    <option value="">
                      Select Semester
                    </option>

                    {[
                      1, 2, 3, 4,
                      5, 6, 7, 8,
                    ].map(
                      (item) => (
                        <option
                          key={
                            item
                          }
                          value={
                            item
                          }
                        >
                          Semester{" "}
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* FEE TYPE */}

                <div className="fee-form-group">
                  <label>
                    Fee Type{" "}
                    <span>
                      *
                    </span>
                  </label>

                  <select
                    name="feeType"
                    value={
                      form.feeType
                    }
                    onChange={
                      handleFormChange
                    }
                    disabled={
                      formLoading
                    }
                    required
                  >
                    {feeTypes.map(
                      (item) => (
                        <option
                          key={
                            item.value
                          }
                          value={
                            item.value
                          }
                        >
                          {
                            item.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* AMOUNT */}

                <div className="fee-form-group">
                  <label>
                    Total Amount{" "}
                    <span>
                      *
                    </span>
                  </label>

                  <input
                    type="number"
                    name="amount"
                    value={
                      form.amount
                    }
                    onChange={
                      handleFormChange
                    }
                    min="0"
                    step="0.01"
                    placeholder="Enter amount"
                    disabled={
                      formLoading
                    }
                    required
                  />
                </div>

                {/* PAID */}

                <div className="fee-form-group">
                  <label>
                    Paid Amount{" "}
                    <span>
                      *
                    </span>
                  </label>

                  <input
                    type="number"
                    name="paidAmount"
                    value={
                      form.paidAmount
                    }
                    onChange={
                      handleFormChange
                    }
                    min="0"
                    step="0.01"
                    placeholder="Enter paid amount"
                    disabled={
                      formLoading
                    }
                    required
                  />
                </div>

                {/* DUE DATE */}

                <div className="fee-form-group">
                  <label>
                    Due Date
                  </label>

                  <DatePickerInput
                    name="dueDate"
                    value={
                      form.dueDate
                    }
                    onChange={
                      handleFormChange
                    }
                    disabled={
                      formLoading
                    }
                  />
                </div>

                {/* PAYMENT DATE */}

                <div className="fee-form-group">
                  <label>
                    Payment Date
                  </label>

                  <DatePickerInput
                    name="paymentDate"
                    value={
                      form.paymentDate
                    }
                    onChange={
                      handleFormChange
                    }
                    disabled={
                      formLoading
                    }
                  />
                </div>

                {/* STATUS */}

                <div className="fee-form-group">
                  <label>
                    Status{" "}
                    <span>
                      *
                    </span>
                  </label>

                  <select
                    name="status"
                    value={
                      form.status
                    }
                    onChange={
                      handleFormChange
                    }
                    disabled={
                      formLoading
                    }
                    required
                  >
                    {statuses.map(
                      (item) => (
                        <option
                          key={
                            item.value
                          }
                          value={
                            item.value
                          }
                        >
                          {
                            item.label
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* TRANSACTION */}

                <div className="fee-form-group fee-form-full">
                  <label>
                    Transaction ID
                  </label>

                  <input
                    type="text"
                    name="transactionId"
                    value={
                      form.transactionId
                    }
                    onChange={
                      handleFormChange
                    }
                    placeholder="Enter transaction ID"
                    disabled={
                      formLoading
                    }
                  />
                </div>
              </div>

              {/* SUMMARY */}

              <div className="fee-form-summary">
                <div>
                  <span>
                    Total Amount
                  </span>

                  <strong>
                    {money(
                      form.amount
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Paid Amount
                  </span>

                  <strong className="summary-paid">
                    {money(
                      form.paidAmount
                    )}
                  </strong>
                </div>

                <div>
                  <span>
                    Pending Amount
                  </span>

                  <strong className="summary-pending">
                    {money(
                      Math.max(
                        0,
                        Number(
                          form.amount ||
                            0
                        ) -
                          Number(
                            form.paidAmount ||
                              0
                          )
                      )
                    )}
                  </strong>
                </div>
              </div>

              <div className="fee-modal-footer">
                <button
                  type="button"
                  className="fee-cancel-btn"
                  disabled={
                    formLoading
                  }
                  onClick={() =>
                    setShowModal(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="fee-save-btn"
                  disabled={
                    formLoading
                  }
                >
                  {formLoading
                    ? "Saving..."
                    : isEdit
                    ? "Update Fee"
                    : "Create Fee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="fees-loading">
        <div className="fees-spinner" />
        <p>
          Loading fee records...
        </p>
      </div>
    );
  }

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="fees-page">

      {/* BREADCRUMB */}

      <div className="fees-breadcrumb">
        <span>⌂</span>
        <span>
          Dashboard
        </span>
        <b>›</b>
        <strong>
          Fees
        </strong>
      </div>

      {/* HEADER */}

      <div className="fees-header">
        <div>
          <h1>
            Fees
          </h1>

          <p>
            Manage student fee records,
            track payments and generate
            reports.
          </p>
        </div>

        <div className="fees-header-right">
          <span>
            {new Date().toLocaleDateString(
              "en-IN",
              {
                weekday:
                  "short",
                day: "2-digit",
                month: "short",
                year: "numeric",
              }
            )}
          </span>

          <button
            className="collect-fee-btn"
            onClick={
              openAddModal
            }
          >
            ＋ Collect / Add Fee
          </button>
        </div>
      </div>

      {/* STATISTICS */}

      <div className="fee-stat-grid">

        <FeeStat
          type="blue"
          icon="💼"
          title="Total Fees Collection"
          value={money(
            statistics.total
          )}
          subtitle="All fee records"
        />

        <FeeStat
          type="green"
          icon="✓"
          title="Paid Fees"
          value={money(
            statistics.paid
          )}
          subtitle="Amount collected"
        />

        <FeeStat
          type="red"
          icon="◷"
          title="Pending Fees"
          value={money(
            statistics.pending
          )}
          subtitle="Amount outstanding"
        />

        <FeeStat
          type="purple"
          icon="👥"
          title="Defaulters"
          value={
            statistics.defaulters
          }
          subtitle="Pending / overdue"
        />

      </div>

      {/* FILTERS */}

      <div className="fees-filter">

        <div className="fee-search">
          <span>⌕</span>

          <input
            value={search}
            onChange={(e) => {
              setSearch(
                e.target.value
              );
              setPage(1);
            }}
            placeholder="Search by roll number, name, or transaction ID..."
          />
        </div>

        <select
          value={department}
          onChange={(e) => {
            setDepartment(
              e.target.value
            );
            setPage(1);
          }}
        >
          <option value="all">
            All Departments
          </option>

          {departments.map(
            (item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            )
          )}
        </select>

        <select
          value={semester}
          onChange={(e) => {
            setSemester(
              e.target.value
            );
            setPage(1);
          }}
        >
          <option value="all">
            All Semesters
          </option>

          {[
            1, 2, 3, 4,
            5, 6, 7, 8,
          ].map(
            (item) => (
              <option
                key={item}
                value={item}
              >
                Semester {item}
              </option>
            )
          )}
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(
              e.target.value
            );
            setPage(1);
          }}
        >
          <option value="all">
            All Fee Status
          </option>

          <option value="paid">
            Paid
          </option>

          <option value="partial">
            Partially Paid
          </option>

          <option value="pending">
            Pending
          </option>

          <option value="overdue">
            Overdue
          </option>
        </select>

        <button
          className="fee-filter-btn"
          onClick={() =>
            setPage(1)
          }
        >
          🔽 Filter
        </button>

        <button
          className="fee-reset-btn"
          onClick={
            resetFilters
          }
        >
          ↻ Reset
        </button>

      </div>

      {/* ERROR */}

      {error && (
        <div className="fees-error">
          {error}
        </div>
      )}

      {/* TABLE */}

      <div className="fees-table-card">

        <div className="fees-table-scroll">

          <table className="fees-table">

            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                  />
                </th>

                <th>
                  #
                </th>

                <th>
                  Roll Number
                </th>

                <th>
                  Student Name
                </th>

                <th>
                  Department
                </th>

                <th>
                  Semester
                </th>

                <th>
                  Total Fees (₹)
                </th>

                <th>
                  Paid (₹)
                </th>

                <th>
                  Pending (₹)
                </th>

                <th>
                  Status
                </th>

                <th>
                  Last Payment
                </th>

                <th>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>

              {currentFees.length ===
              0 ? (
                <tr>
                  <td
                    colSpan="12"
                    className="fees-empty"
                  >
                    💰 No fee records
                    found.
                  </td>
                </tr>
              ) : (
                currentFees.map(
                  (
                    fee,
                    index
                  ) => {
                    const currentStatus =
                      getStatus(
                        fee
                      );

                    return (
                      <tr
                        key={
                          fee._id ||
                          `${getStudentId(
                            fee
                          )}-${index}`
                        }
                      >

                        <td>
                          <input
                            type="checkbox"
                          />
                        </td>

                        <td>
                          {start +
                            index +
                            1}
                        </td>

                        <td>
                          <strong className="roll-number">
                            {getRollNumber(
                              fee
                            )}
                          </strong>
                        </td>

                        <td>

                          <div className="student-cell">

                            <div className="student-avatar">
                              {getName(
                                fee
                              )
                                .charAt(
                                  0
                                )
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {getName(
                                  fee
                                )}
                              </strong>

                              <small>
                                {getStudentId(
                                  fee
                                )}
                              </small>
                            </div>

                          </div>

                        </td>

                        <td>
                          <span className="department-badge">
                            {getDepartment(
                              fee
                            )}
                          </span>
                        </td>

                        <td>
                          <strong>
                            {getSemester(
                              fee
                            )}
                          </strong>
                        </td>

                        <td>
                          <strong>
                            {getAmount(
                              fee
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </strong>
                        </td>

                        <td className="paid-amount">
                          {getPaid(
                            fee
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </td>

                        <td className="pending-amount">
                          {getPending(
                            fee
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </td>

                        <td>
                          <span
                            className={`fee-status ${currentStatus}`}
                          >
                            <i />

                            {currentStatus ===
                            "partial"
                              ? "Partially Paid"
                              : currentStatus
                                  .charAt(
                                    0
                                  )
                                  .toUpperCase() +
                                currentStatus.slice(
                                  1
                                )}
                          </span>
                        </td>

                        <td>
                          {formatDate(
                            getLastPayment(
                              fee
                            )
                          )}
                        </td>

                        <td>

                          <div className="fee-actions">

                            <button
                              title="View"
                              onClick={() =>
                                handleView(
                                  fee
                                )
                              }
                            >
                              👁
                            </button>

                            <button
                              title="Edit"
                              onClick={() =>
                                openEditModal(
                                  fee
                                )
                              }
                            >
                              ✎
                            </button>

                            <button
                              title="Delete"
                              onClick={() =>
                                handleDelete(
                                  fee
                                )
                              }
                            >
                              🗑
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

        <div className="fees-table-footer">

          <span>
            Showing{" "}
            {filteredFees.length ===
            0
              ? 0
              : start + 1}
            –
            {Math.min(
              start +
                perPage,
              filteredFees.length
            )}{" "}
            of{" "}
            {
              filteredFees.length
            }{" "}
            records
          </span>

          <div className="fee-pagination">

            <button
              disabled={
                currentPage ===
                1
              }
              onClick={() =>
                setPage(
                  Math.max(
                    1,
                    currentPage -
                      1
                  )
                )
              }
            >
              ‹
            </button>

            {Array.from(
              {
                length:
                  Math.min(
                    5,
                    totalPages
                  ),
              },
              (_, i) =>
                i + 1
            ).map(
              (number) => (
                <button
                  key={
                    number
                  }
                  className={
                    currentPage ===
                    number
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    setPage(
                      number
                    )
                  }
                >
                  {
                    number
                  }
                </button>
              )
            )}

            {totalPages >
              5 && (
              <>
                <span>
                  ...
                </span>

                <button
                  onClick={() =>
                    setPage(
                      totalPages
                    )
                  }
                >
                  {
                    totalPages
                  }
                </button>
              </>
            )}

            <button
              disabled={
                currentPage ===
                totalPages
              }
              onClick={() =>
                setPage(
                  Math.min(
                    totalPages,
                    currentPage +
                      1
                  )
                )
              }
            >
              ›
            </button>

          </div>

        </div>

      </div>

      {/* BOTTOM ACTIONS */}

      <div className="fee-bottom-actions">

        <button
          onClick={
            exportCSV
          }
        >
          ↓ Export to CSV
        </button>

        <button
          onClick={() =>
            alert(
              "Use Export to CSV for the current fee report."
            )
          }
        >
          📄 Generate Fee Report
        </button>

      </div>

      {/* ANALYTICS */}

      <div className="fee-analytics-grid">

        {/* COLLECTION TREND */}

        <div className="fee-chart-card">

          <h3>
            Fee Collection Trend
          </h3>

          <div className="fake-bar-chart">

            {[
              35, 45, 50,
              62, 60, 72,
              76, 82, 94,
            ].map(
              (
                height,
                index
              ) => (
                <div
                  className="bar-item"
                  key={
                    index
                  }
                >

                  <div
                    className="bar"
                    style={{
                      height: `${height}%`,
                    }}
                  />

                  <span>
                    {
                      [
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                        "Aug",
                        "Sep",
                      ][
                        index
                      ]
                    }
                  </span>

                </div>
              )
            )}

          </div>

        </div>

        {/* STATUS */}

        <div className="fee-chart-card">

          <h3>
            Fee Status Distribution
          </h3>

          <div className="fee-status-chart">

            <div className="fee-donut">
              <strong>
                {
                  fees.length
                }
              </strong>

              <span>
                Records
              </span>
            </div>

            <div className="fee-legend">

              <div>
                <i className="green" />
                Paid
              </div>

              <div>
                <i className="yellow" />
                Partially Paid
              </div>

              <div>
                <i className="red" />
                Pending
              </div>

            </div>

          </div>

        </div>

        {/* DEPARTMENT COLLECTION */}

        <div className="fee-chart-card">

          <h3>
            Department-wise Collection
          </h3>

          <div className="department-bars">

            {departments
              .slice(0, 6)
              .map(
                (dept) => {
                  const amount =
                    fees
                      .filter(
                        (fee) =>
                          getDepartment(
                            fee
                          ) ===
                          dept
                      )
                      .reduce(
                        (
                          sum,
                          fee
                        ) =>
                          sum +
                          getPaid(
                            fee
                          ),
                        0
                      );

                  const max =
                    Math.max(
                      ...departments.map(
                        (
                          item
                        ) =>
                          fees
                            .filter(
                              (
                                fee
                              ) =>
                                getDepartment(
                                  fee
                                ) ===
                                item
                            )
                            .reduce(
                              (
                                sum,
                                fee
                              ) =>
                                sum +
                                getPaid(
                                  fee
                                ),
                              0
                            )
                      ),
                      1
                    );

                  return (
                    <div
                      className="department-bar-row"
                      key={
                        dept
                      }
                    >

                      <span>
                        {
                          dept
                        }
                      </span>

                      <div>
                        <i
                          style={{
                            width: `${Math.min(
                              100,
                              (amount /
                                max) *
                                100
                            )}%`,
                          }}
                        />
                      </div>

                      <strong>
                        {
                          money(
                            amount
                          )
                        }
                      </strong>

                    </div>
                  );
                }
              )}

            {departments.length ===
              0 && (
              <p className="no-chart-data">
                No department
                data
                available.
              </p>
            )}

          </div>

        </div>

      </div>

      {/* FOOTER */}

      <div className="fees-footer">

        <div>
          🎓

          <strong>
            SmartCampus
          </strong>

          <span>
            |
          </span>

          <span>
            Empowering Education
            Through Technology
          </span>
        </div>

        <div>

          <span>
            v1.0.0
          </span>

          <span>
            |
          </span>

          <strong>
            Gandhi Engineering
            College
          </strong>

        </div>

      </div>

      {/* MODALS */}

      {showModal &&
        modalType ===
          "view" &&
        renderViewModal()}

      {showModal &&
        (modalType ===
          "add" ||
          modalType ===
            "edit") &&
        renderFormModal()}

    </div>
  );
};

// =========================================================
// STAT CARD COMPONENT
// =========================================================

const FeeStat = ({
  type,
  icon,
  title,
  value,
  subtitle,
}) => {
  return (
    <div
      className={`fee-stat ${type}`}
    >
      <div className="fee-stat-icon">
        {icon}
      </div>

      <div>
        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>

        <small>
          {subtitle}
        </small>
      </div>
    </div>
  );
};

export default Fees;