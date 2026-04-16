import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  created_at: string;
}

export function generateTransactionPdf(tx: Transaction) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header bar
  doc.setFillColor(22, 27, 34);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(0, 204, 102);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("ProfitPulse", 20, 26);

  doc.setTextColor(180, 180, 180);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Transaction Statement", pageWidth - 20, 26, { align: "right" });

  // Date
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  doc.text(
    `Generated: ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
    20,
    52
  );

  // Transaction details table
  autoTable(doc, {
    startY: 62,
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 6, textColor: [30, 30, 30] },
    headStyles: { fillColor: [240, 240, 240], textColor: [80, 80, 80], fontStyle: "bold" },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 45 } },
    body: [
      ["Transaction ID", tx.id],
      ["Type", tx.type.charAt(0).toUpperCase() + tx.type.slice(1)],
      ["Amount", `$${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`],
      ["Status", tx.status.charAt(0).toUpperCase() + tx.status.slice(1)],
      ["Date", new Date(tx.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })],
      ["Description", tx.description ?? "—"],
    ],
  });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setDrawColor(220, 220, 220);
  doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text("ProfitPulse · Institutional-Grade Crypto Investment Platform", 20, footerY);
  doc.text("This document is for informational purposes only.", pageWidth - 20, footerY, { align: "right" });

  doc.save(`ProfitPulse_TX_${tx.id.slice(0, 8)}.pdf`);
}

export function generateMonthlyReport(transactions: Transaction[], month: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(22, 27, 34);
  doc.rect(0, 0, pageWidth, 45, "F");

  doc.setTextColor(0, 204, 102);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("ProfitPulse", 20, 22);

  doc.setTextColor(180, 180, 180);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Monthly Earnings Report", 20, 34);
  doc.text(month, pageWidth - 20, 34, { align: "right" });

  // Summary
  const deposits = transactions.filter((t) => t.type === "deposit" && t.status === "confirmed").reduce((s, t) => s + t.amount, 0);
  const withdrawals = transactions.filter((t) => t.type === "withdrawal" && t.status === "confirmed").reduce((s, t) => s + t.amount, 0);
  const interest = transactions.filter((t) => t.type === "interest" && t.status === "confirmed").reduce((s, t) => s + t.amount, 0);

  autoTable(doc, {
    startY: 55,
    theme: "plain",
    styles: { fontSize: 11, cellPadding: 6, textColor: [30, 30, 30] },
    headStyles: { fillColor: [240, 240, 240], textColor: [80, 80, 80], fontStyle: "bold" },
    head: [["Summary", "Amount"]],
    body: [
      ["Total Deposits", `$${deposits.toLocaleString("en-US", { minimumFractionDigits: 2 })}`],
      ["Total Withdrawals", `$${withdrawals.toLocaleString("en-US", { minimumFractionDigits: 2 })}`],
      ["Interest Earned", `$${interest.toLocaleString("en-US", { minimumFractionDigits: 2 })}`],
      ["Net Balance", `$${(deposits - withdrawals + interest).toLocaleString("en-US", { minimumFractionDigits: 2 })}`],
    ],
  });

  // Transactions table
  const lastY = (doc as any).lastAutoTable?.finalY ?? 100;
  autoTable(doc, {
    startY: lastY + 10,
    theme: "striped",
    styles: { fontSize: 9, cellPadding: 4, textColor: [40, 40, 40] },
    headStyles: { fillColor: [22, 27, 34], textColor: [0, 204, 102], fontStyle: "bold" },
    head: [["Date", "Type", "Amount", "Status"]],
    body: transactions.map((t) => [
      new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      t.type.charAt(0).toUpperCase() + t.type.slice(1),
      `$${t.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      t.status,
    ]),
  });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setDrawColor(220, 220, 220);
  doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text("ProfitPulse · Institutional-Grade Crypto Investment Platform", 20, footerY);
  doc.text("For personal accounting purposes only.", pageWidth - 20, footerY, { align: "right" });

  doc.save(`ProfitPulse_Report_${month.replace(/\s/g, "_")}.pdf`);
}
