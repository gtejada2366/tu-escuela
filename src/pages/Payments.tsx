import { useState, useMemo, useEffect } from "react";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { SortableHeader, sortData, getNextSort, type SortDirection } from "../components/SortableHeader";
import { TrendingUp, AlertCircle, CheckCircle2, Search, Filter, ChevronDown, Download, Printer } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { usePaymentsData, type PaymentLocal } from "../hooks/usePaymentsData";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useSchoolConfig } from "../contexts/SchoolConfigContext";

type PaymentRecord = PaymentLocal;

const chartData = [
  { month: "Ene", paid: 168750, pending: 34200, overdue: 12450 },
  { month: "Feb", paid: 172500, pending: 28900, overdue: 8200 },
  { month: "Mar", paid: 168750, pending: 34200, overdue: 12450 },
];

type StatusFilter = "all" | "paid" | "pending" | "overdue";

const ITEMS_PER_PAGE = 7;

function getTodayString(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const statusLabelMap: Record<string, string> = {
  paid: "Pagado",
  pending: "Pendiente",
  overdue: "Vencido",
};

const filterLabels: Record<StatusFilter, string> = {
  all: "Todos",
  paid: "Pagado",
  pending: "Pendiente",
  overdue: "Vencido",
};

export function Payments() {
  const { showToast } = useToast();
  const { schoolName } = useSchoolConfig();
  const { payments, loading, error, registerPayment, totalPaid, totalPending, totalOverdue } = usePaymentsData();

  useEffect(() => { if (error) showToast(error, "error"); }, [error]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  // Modal states
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const totalAll = totalPaid + totalPending + totalOverdue;
  const collectionRate = totalAll > 0 ? ((totalPaid / totalAll) * 100).toFixed(1) : "0.0";

  // Filtered + searched payments
  const filteredPayments = useMemo(() => {
    let result = payments;
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((p) => p.student.toLowerCase().includes(term));
    }
    return result;
  }, [payments, statusFilter, searchTerm]);

  const handleSort = (key: string) => {
    const next = getNextSort(key, sortKey, sortDir);
    setSortKey(next.key);
    setSortDir(next.direction);
  };

  const sortedPayments = sortData(filteredPayments, sortKey, sortDir);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedPayments.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedPayments = sortedPayments.slice(
    (safeCurrentPage - 1) * ITEMS_PER_PAGE,
    safeCurrentPage * ITEMS_PER_PAGE
  );
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(safeCurrentPage * ITEMS_PER_PAGE, sortedPayments.length);

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge variant="success">Pagado</Badge>;
      case "pending": return <Badge variant="warning">Pendiente</Badge>;
      case "overdue": return <Badge variant="danger">Vencido</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ["ID", "Estudiante", "Grado", "Monto", "Vencimiento", "Fecha Pago", "Estado"];
    const rows = payments.map((p) => [
      p.id,
      p.student,
      p.grade,
      `S/ ${p.amount}`,
      p.dueDate,
      p.paidDate,
      statusLabelMap[p.status] || p.status,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reporte_pagos.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Reporte exportado exitosamente", "success");
  };

  // Status filter toggle
  const handleFilterSelect = (filter: StatusFilter) => {
    setStatusFilter(filter);
    setFilterOpen(false);
    setCurrentPage(1);
  };

  // Register payment
  const handleOpenConfirmModal = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setConfirmModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedPayment) return;
    try {
      await registerPayment(selectedPayment.id);
      showToast("Pago registrado exitosamente", "success");
    } catch {
      showToast("Error al guardar. Intenta de nuevo.", "error");
      return;
    }
    setConfirmModalOpen(false);
    setSelectedPayment(null);
  };

  // View receipt
  const handleOpenReceipt = (payment: PaymentRecord) => {
    setSelectedPayment(payment);
    setReceiptModalOpen(true);
  };

  // Pagination helpers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  if (loading) return <LoadingSpinner />;

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push("...");
      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalPages - 1, safeCurrentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safeCurrentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-[#1e293b] mb-2">Gestión de Pagos</h1>
          <p className="text-sm text-[#64748b]">Control de pensiones y pagos escolares</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors"
        >
          <Download className="w-4 h-4" /> Exportar Reporte
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[#d1fae5]"><CheckCircle2 className="w-5 h-5 text-[#10b981]" /></div>
            <span className="text-sm text-[#64748b]">Pagos Recibidos</span>
          </div>
          <p className="text-2xl text-[#1e293b] mb-1">S/ {totalPaid.toLocaleString()}</p>
          <p className="text-xs text-[#10b981]">Marzo 2026</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[#fef3c7]"><AlertCircle className="w-5 h-5 text-[#f59e0b]" /></div>
            <span className="text-sm text-[#64748b]">Pagos Pendientes</span>
          </div>
          <p className="text-2xl text-[#1e293b] mb-1">S/ {totalPending.toLocaleString()}</p>
          <p className="text-xs text-[#f59e0b]">Por cobrar</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[#fee2e2]"><AlertCircle className="w-5 h-5 text-[#dc2626]" /></div>
            <span className="text-sm text-[#64748b]">Pagos Vencidos</span>
          </div>
          <p className="text-2xl text-[#1e293b] mb-1">S/ {totalOverdue.toLocaleString()}</p>
          <p className="text-xs text-[#dc2626]">Requiere acción</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[#eff6ff]"><TrendingUp className="w-5 h-5 text-[#2563eb]" /></div>
            <span className="text-sm text-[#64748b]">Tasa de Cobranza</span>
          </div>
          <p className="text-2xl text-[#1e293b] mb-1">{collectionRate}%</p>
          <div className="w-full h-2 bg-[#f1f5f9] rounded-full overflow-hidden mt-2">
            <div className="h-full bg-[#10b981] rounded-full" style={{ width: `${collectionRate}%` }}></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
        <h3 className="text-lg text-[#1e293b] mb-4">Evolución de Pagos - 2026</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
            <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
            <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
            <Bar dataKey="paid" fill="#10b981" radius={[8, 8, 0, 0]} name="Pagados" />
            <Bar dataKey="pending" fill="#f59e0b" radius={[8, 8, 0, 0]} name="Pendientes" />
            <Bar dataKey="overdue" fill="#dc2626" radius={[8, 8, 0, 0]} name="Vencidos" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg p-4 border border-border shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input
              type="text"
              placeholder="Buscar por estudiante..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setFilterOpen((prev) => !prev)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white hover:bg-[#f8fafc] transition-colors"
            >
              <Filter className="w-4 h-4 text-[#64748b]" />
              <span className="text-sm text-[#1e293b]">{filterLabels[statusFilter]}</span>
              <ChevronDown className="w-4 h-4 text-[#64748b]" />
            </button>
            {filterOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-border rounded-lg shadow-lg z-10">
                {(["all", "paid", "pending", "overdue"] as StatusFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => handleFilterSelect(filter)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-[#f8fafc] transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      statusFilter === filter ? "bg-[#eff6ff] text-[#2563eb]" : "text-[#1e293b]"
                    }`}
                  >
                    {filterLabels[filter]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8fafc] border-b border-border">
              <tr>
                <SortableHeader label="Estudiante" sortKey="student" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} />
                <SortableHeader label="Grado" sortKey="grade" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} className="hidden md:table-cell" />
                <SortableHeader label="Monto" sortKey="amount" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} />
                <SortableHeader label="Vencimiento" sortKey="dueDate" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} className="hidden lg:table-cell" />
                <SortableHeader label="Fecha Pago" sortKey="paidDate" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} className="hidden lg:table-cell" />
                <SortableHeader label="Estado" sortKey="status" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} />
                <th className="px-6 py-3 text-left text-xs text-[#64748b] uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="px-6 py-4"><span className="text-sm text-[#1e293b]">{payment.student}</span></td>
                  <td className="px-6 py-4 hidden md:table-cell"><span className="text-sm text-[#64748b]">{payment.grade}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-[#1e293b]">S/ {payment.amount}</span></td>
                  <td className="px-6 py-4 hidden lg:table-cell"><span className="text-sm text-[#64748b]">{payment.dueDate}</span></td>
                  <td className="px-6 py-4 hidden lg:table-cell"><span className={`text-sm ${payment.paidDate === '-' ? 'text-[#64748b]' : 'text-[#1e293b]'}`}>{payment.paidDate}</span></td>
                  <td className="px-6 py-4">{getPaymentBadge(payment.status)}</td>
                  <td className="px-6 py-4">
                    {payment.status !== "paid" ? (
                      <button
                        onClick={() => handleOpenConfirmModal(payment)}
                        className="text-sm text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
                      >
                        Registrar Pago
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenReceipt(payment)}
                        className="text-sm text-[#64748b] hover:text-[#1e293b] transition-colors"
                      >
                        Ver Recibo
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-border bg-[#f8fafc]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[#64748b]">
              Mostrando <span className="text-[#1e293b]">{filteredPayments.length > 0 ? startIndex : 0}-{endIndex}</span> de <span className="text-[#1e293b]">{filteredPayments.length}</span> pagos
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(safeCurrentPage - 1)}
                disabled={safeCurrentPage <= 1}
                className={`px-3 py-1.5 rounded-lg border border-border bg-white text-sm transition-colors ${
                  safeCurrentPage <= 1 ? "text-[#cbd5e1] cursor-not-allowed" : "text-[#64748b] hover:bg-[#f8fafc]"
                }`}
              >
                Anterior
              </button>
              {getPageNumbers().map((page, idx) =>
                typeof page === "string" ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-sm text-[#64748b]">...</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      page === safeCurrentPage
                        ? "bg-[#2563eb] text-white"
                        : "border border-border bg-white text-[#64748b] hover:bg-[#f8fafc]"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() => goToPage(safeCurrentPage + 1)}
                disabled={safeCurrentPage >= totalPages}
                className={`px-3 py-1.5 rounded-lg border border-border bg-white text-sm transition-colors ${
                  safeCurrentPage >= totalPages ? "text-[#cbd5e1] cursor-not-allowed" : "text-[#64748b] hover:bg-[#f8fafc]"
                }`}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Payment Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => { setConfirmModalOpen(false); setSelectedPayment(null); }}
        title="Registrar Pago"
        size="sm"
      >
        {selectedPayment && (
          <div className="space-y-4">
            <p className="text-sm text-[#64748b]">
              Confirmar el registro de pago para el siguiente estudiante:
            </p>
            <div className="bg-[#f8fafc] rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[#64748b]">Estudiante</span>
                <span className="text-sm text-[#1e293b] font-medium">{selectedPayment.student}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#64748b]">Grado</span>
                <span className="text-sm text-[#1e293b]">{selectedPayment.grade}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#64748b]">Monto</span>
                <span className="text-sm text-[#1e293b] font-medium">S/ {selectedPayment.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#64748b]">Vencimiento</span>
                <span className="text-sm text-[#1e293b]">{selectedPayment.dueDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[#64748b]">Fecha de Pago</span>
                <span className="text-sm text-[#1e293b]">{getTodayString()}</span>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setConfirmModalOpen(false); setSelectedPayment(null); }}
                className="flex-1 px-4 py-2 rounded-lg border border-border bg-white text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPayment}
                className="flex-1 px-4 py-2 rounded-lg bg-[#2563eb] text-white text-sm hover:bg-[#1d4ed8] transition-colors"
              >
                Confirmar Pago
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Receipt Modal */}
      <Modal
        isOpen={receiptModalOpen}
        onClose={() => { setReceiptModalOpen(false); setSelectedPayment(null); }}
        title="Recibo de Pago"
        size="md"
      >
        {selectedPayment && (
          <div className="space-y-6">
            <div className="text-center border-b border-border pb-4">
              <h3 className="text-xl text-[#1e293b] font-semibold">{schoolName}</h3>
              <p className="text-xs text-[#64748b] mt-1">Recibo de Pago de Pensión Escolar</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-dashed border-[#e2e8f0]">
                <span className="text-sm text-[#64748b]">N° Recibo</span>
                <span className="text-sm text-[#1e293b] font-medium">REC-{String(selectedPayment.id).padStart(4, "0")}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-[#e2e8f0]">
                <span className="text-sm text-[#64748b]">Estudiante</span>
                <span className="text-sm text-[#1e293b] font-medium">{selectedPayment.student}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-[#e2e8f0]">
                <span className="text-sm text-[#64748b]">Grado</span>
                <span className="text-sm text-[#1e293b]">{selectedPayment.grade}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-[#e2e8f0]">
                <span className="text-sm text-[#64748b]">Concepto</span>
                <span className="text-sm text-[#1e293b]">Pensión Escolar</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-[#e2e8f0]">
                <span className="text-sm text-[#64748b]">Fecha de Vencimiento</span>
                <span className="text-sm text-[#1e293b]">{selectedPayment.dueDate}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-[#e2e8f0]">
                <span className="text-sm text-[#64748b]">Fecha de Pago</span>
                <span className="text-sm text-[#1e293b]">{selectedPayment.paidDate}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-dashed border-[#e2e8f0]">
                <span className="text-sm text-[#64748b]">Estado</span>
                {getPaymentBadge(selectedPayment.status)}
              </div>
              <div className="flex justify-between py-3 bg-[#f8fafc] rounded-lg px-3 mt-2">
                <span className="text-sm text-[#64748b] font-medium">Monto Total</span>
                <span className="text-lg text-[#1e293b] font-semibold">S/ {selectedPayment.amount}</span>
              </div>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-[#94a3b8]">Este recibo es un comprobante de pago emitido por {schoolName}.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setReceiptModalOpen(false); setSelectedPayment(null); }}
                className="flex-1 px-4 py-2 rounded-lg border border-border bg-white text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#2563eb] text-white text-sm hover:bg-[#1d4ed8] transition-colors"
              >
                <Printer className="w-4 h-4" /> Imprimir
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
