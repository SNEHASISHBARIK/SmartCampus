import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiCreditCard,
  FiDownload,
  FiFileText,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";
import api from "../../services/api";
import "./Fees.css";

const formatCurrency = (amount) =>
  `₹${(Number(amount) || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const feeTypeLabel = (value) =>
  String(value || "other").replace(/\b\w/g, (letter) => letter.toUpperCase());

const getBalance = (fee) =>
  Math.max((Number(fee.amount) || 0) - (Number(fee.paidAmount) || 0), 0);

const getStatus = (fee, now) => {
  if (getBalance(fee) === 0) return "paid";
  if (fee.dueDate && new Date(fee.dueDate).getTime() < now.getTime()) return "overdue";
  return fee.status === "partial" ? "partial" : "pending";
};

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

const Fees = () => {
  const [fees, setFees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [activeTab, setActiveTab] = useState("details");
  const [selectedFee, setSelectedFee] = useState(null);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [now] = useState(() => new Date());

  useEffect(() => {
    const controller = new AbortController();

    const fetchFees = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get("/students/fees", {
          signal: controller.signal,
        });
        if (!Array.isArray(response.data?.fees)) {
          throw new Error("Fees response has an invalid format.");
        }
        setFees(response.data.fees);
        setSummary(response.data.summary || null);
      } catch (requestError) {
        if (requestError.code === "ERR_CANCELED") return;
        console.error("Student fees error:", requestError);
        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Unable to load your fee details."
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    fetchFees();
    return () => controller.abort();
  }, [reloadKey]);

  const totals = useMemo(() => {
    const totalAmount = fees.reduce(
      (sum, fee) => sum + (Number(fee.amount) || 0),
      0
    );
    const paidAmount = fees.reduce(
      (sum, fee) => sum + (Number(fee.paidAmount) || 0),
      0
    );
    const pendingAmount = fees.reduce((sum, fee) => sum + getBalance(fee), 0);
    const nextDue = fees
      .filter((fee) => getBalance(fee) > 0 && fee.dueDate)
      .sort((first, second) => new Date(first.dueDate) - new Date(second.dueDate))[0];
    return {
      totalAmount: summary?.totalAmount ?? totalAmount,
      paidAmount: summary?.paidAmount ?? paidAmount,
      pendingAmount: summary?.pendingAmount ?? pendingAmount,
      nextDueDate: summary?.nextDueDate || nextDue?.dueDate || null,
    };
  }, [fees, summary]);

  const visibleFees = useMemo(() => {
    if (activeTab === "history") {
      return fees.filter((fee) => Number(fee.paidAmount) > 0 || fee.paymentDate || fee.transactionId);
    }
    return fees;
  }, [activeTab, fees]);

  const printReceipt = (fee) => {
    const receiptWindow = window.open("", "_blank", "width=720,height=800");
    if (!receiptWindow) {
      setError("Allow pop-ups to print this payment record.");
      return;
    }
    receiptWindow.opener = null;

    const receiptHtml = `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Payment record - SmartCampus</title>
          <style>
            body { font-family: Arial, sans-serif; color: #18365e; padding: 36px; }
            h1 { margin-bottom: 4px; } .muted { color: #667b94; }
            dl { margin-top: 28px; } dl div { display:flex; padding:12px 0; border-bottom:1px solid #e4ebf4; }
            dt { width: 42%; color:#667b94; } dd { margin:0; font-weight:600; }
            .notice { margin-top:28px; padding:12px; background:#fff7e7; color:#825f20; }
          </style>
        </head>
        <body>
          <h1>SmartCampus payment record</h1>
          <p class="muted">Fee payment details recorded by the campus</p>
          <dl>
            <div><dt>Fee type</dt><dd>${escapeHtml(feeTypeLabel(fee.feeType))}</dd></div>
            <div><dt>Semester</dt><dd>${escapeHtml(fee.semester ?? "—")}</dd></div>
            <div><dt>Paid amount</dt><dd>${escapeHtml(formatCurrency(fee.paidAmount))}</dd></div>
            <div><dt>Payment date</dt><dd>${escapeHtml(formatDate(fee.paymentDate))}</dd></div>
            <div><dt>Transaction ID</dt><dd>${escapeHtml(fee.transactionId || "Not provided")}</dd></div>
          </dl>
          <p class="notice">This is a printable payment record, not an institution-certified receipt.</p>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>
    `;
    receiptWindow.document.write(receiptHtml);
    receiptWindow.document.close();
  };

  return (
    <div className="student-fees-page">
      <div className="student-fees-breadcrumb">
        <Link to="/student">Dashboard</Link>
        <span aria-hidden="true">›</span>
        <strong>Fees</strong>
      </div>

      <header className="student-fees-heading">
        <div>
          <h1>Fees</h1>
          <p>View your fee details, payment status and history.</p>
        </div>
        <button
          type="button"
          className="student-fees-pay-button"
          disabled={loading || !fees.some((fee) => getBalance(fee) > 0)}
          onClick={() => setShowPaymentInfo(true)}
        >
          <FiCreditCard aria-hidden="true" /> Pay Now
        </button>
      </header>

      {error && (
        <div className="student-fees-alert" role="alert">
          <FiAlertCircle aria-hidden="true" />
          <span>{error}</span>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
            <FiRefreshCw aria-hidden="true" /> Retry
          </button>
        </div>
      )}

      <section className="student-fees-stats" aria-label="Fee summary">
        <StatCard icon={<FiCreditCard />} tone="blue" label="Total Fee" value={loading ? "—" : formatCurrency(totals.totalAmount)} />
        <StatCard icon={<FiCheckCircle />} tone="green" label="Paid Amount" value={loading ? "—" : formatCurrency(totals.paidAmount)} />
        <StatCard icon={<FiFileText />} tone="red" label="Pending Amount" value={loading ? "—" : formatCurrency(totals.pendingAmount)} />
        <StatCard icon={<FiCalendar />} tone="purple" label="Next Due Date" value={loading ? "—" : formatDate(totals.nextDueDate)} />
      </section>

      <section className="student-fees-panel">
        <div className="student-fees-tabs" role="tablist" aria-label="Fee records">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "details"}
            className={activeTab === "details" ? "active" : ""}
            onClick={() => setActiveTab("details")}
          >
            Fee Details
            <span>{fees.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "history"}
            className={activeTab === "history" ? "active" : ""}
            onClick={() => setActiveTab("history")}
          >
            Payment History
            <span>{fees.filter((fee) => Number(fee.paidAmount) > 0).length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "receipts"}
            className={activeTab === "receipts" ? "active" : ""}
            onClick={() => setActiveTab("receipts")}
          >
            Receipts
            <span>{fees.filter((fee) => Number(fee.paidAmount) > 0).length}</span>
          </button>
        </div>

        {loading ? (
          <div className="student-fees-state" role="status">Loading your fee records…</div>
        ) : error ? (
          <div className="student-fees-state error" role="alert">
            <FiAlertCircle aria-hidden="true" />
            <strong>Fee records could not be loaded</strong>
            <span>{error}</span>
            <button type="button" onClick={() => setReloadKey((key) => key + 1)}>
              <FiRefreshCw aria-hidden="true" /> Try again
            </button>
          </div>
        ) : activeTab === "receipts" ? (
          <div className="student-fees-receipts">
            {fees.filter((fee) => Number(fee.paidAmount) > 0).length ? (
              fees.filter((fee) => Number(fee.paidAmount) > 0).map((fee) => (
                <article key={fee._id}>
                  <span className="receipt-icon"><FiFileText aria-hidden="true" /></span>
                  <div>
                    <strong>{feeTypeLabel(fee.feeType)} fee</strong>
                    <small>Paid {formatDate(fee.paymentDate)} · {fee.transactionId || "Transaction ID not recorded"}</small>
                  </div>
                  <b>{formatCurrency(fee.paidAmount)}</b>
                  <button type="button" onClick={() => printReceipt(fee)}>
                    <FiDownload aria-hidden="true" /> Print record
                  </button>
                </article>
              ))
            ) : (
              <EmptyState
                title="No payment records yet"
                description="A payment record will appear here after a payment has been recorded by the campus."
              />
            )}
            <p className="student-fees-disclaimer">
              Printable payment records are generated from fee data maintained by the campus. They are not certified receipts.
            </p>
          </div>
        ) : visibleFees.length ? (
          <div className="student-fees-table-wrap">
            <table className="student-fees-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fee Type</th>
                  <th>Amount</th>
                  {activeTab === "history" && <th>Paid</th>}
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleFees.map((fee, index) => {
                  const status = getStatus(fee, now);
                  return (
                    <tr key={fee._id}>
                      <td>{index + 1}</td>
                      <td>
                        <strong>{feeTypeLabel(fee.feeType)} Fee</strong>
                        <small>Semester {fee.semester ?? "—"}</small>
                      </td>
                      <td>{formatCurrency(fee.amount)}</td>
                      {activeTab === "history" && <td>{formatCurrency(fee.paidAmount)}</td>}
                      <td>{formatDate(fee.dueDate)}</td>
                      <td><span className={`student-fee-status ${status}`}>{status}</span></td>
                      <td>
                        {getBalance(fee) > 0 ? (
                          <button
                            type="button"
                            className="student-fee-row-pay"
                            onClick={() => setShowPaymentInfo(true)}
                          >
                            Pay Now
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="student-fee-row-receipt"
                            onClick={() => setSelectedFee(fee)}
                          >
                            View Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={activeTab === "history" ? "No payment history" : "No fee records found"}
            description={
              activeTab === "history"
                ? "Payments recorded by the campus will appear here."
                : "Your fee details will appear here when they are added by the campus."
            }
          />
        )}
      </section>

      <footer className="student-fees-footer">
        <FiCreditCard aria-hidden="true" />
        <span>“An investment in knowledge always pays the best interest.”</span>
        <em>— SmartCampus</em>
      </footer>

      {showPaymentInfo && (
        <div
          className="student-fees-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowPaymentInfo(false);
          }}
        >
          <section className="student-fees-modal" role="dialog" aria-modal="true" aria-labelledby="student-fees-payment-title">
            <header>
              <div><span>Online payments</span><h2 id="student-fees-payment-title">Payment not available yet</h2></div>
              <button type="button" aria-label="Close dialog" onClick={() => setShowPaymentInfo(false)}><FiX aria-hidden="true" /></button>
            </header>
            <p>
              Online payment processing is not connected to this application yet. No payment has been started or charged.
            </p>
            <p>Please contact the campus finance office for payment instructions.</p>
            <button className="student-fees-modal-close" type="button" onClick={() => setShowPaymentInfo(false)}>Close</button>
          </section>
        </div>
      )}

      {selectedFee && (
        <div
          className="student-fees-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedFee(null);
          }}
        >
          <section className="student-fees-modal" role="dialog" aria-modal="true" aria-labelledby="student-fees-detail-title">
            <header>
              <div><span>Fee payment record</span><h2 id="student-fees-detail-title">{feeTypeLabel(selectedFee.feeType)} Fee</h2></div>
              <button type="button" aria-label="Close details" onClick={() => setSelectedFee(null)}><FiX aria-hidden="true" /></button>
            </header>
            <dl className="student-fees-detail-list">
              <div><dt>Semester</dt><dd>{selectedFee.semester ?? "—"}</dd></div>
              <div><dt>Total amount</dt><dd>{formatCurrency(selectedFee.amount)}</dd></div>
              <div><dt>Paid</dt><dd>{formatCurrency(selectedFee.paidAmount)}</dd></div>
              <div><dt>Balance</dt><dd>{formatCurrency(getBalance(selectedFee))}</dd></div>
              <div><dt>Payment date</dt><dd>{formatDate(selectedFee.paymentDate)}</dd></div>
              <div><dt>Transaction ID</dt><dd>{selectedFee.transactionId || "Not provided"}</dd></div>
            </dl>
          </section>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, tone, label, value }) => (
  <article className="student-fees-stat-card">
    <span className={`student-fees-stat-icon ${tone}`}>{icon}</span>
    <div><span>{label}</span><strong>{value}</strong></div>
  </article>
);

const EmptyState = ({ title, description }) => (
  <div className="student-fees-state">
    <FiFileText aria-hidden="true" />
    <strong>{title}</strong>
    <span>{description}</span>
  </div>
);

export default Fees;
