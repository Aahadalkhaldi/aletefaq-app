import { jsPDF } from "npm:jspdf@4.0.0";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.23";

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { reportData, month } = body;

    if (!reportData) {
      return Response.json({ error: "بيانات التقرير مفقودة" }, { status: 400 });
    }

    // Create PDF
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 10;

    // Set font
    doc.setFont("helvetica");

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("تقرير الأداء الشهري", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;

    // Month info
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`الشهر: ${reportData.month}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 12;

    // Main Metrics Section
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("المؤشرات الرئيسية", 10, yPosition);
    yPosition += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    
    const metricsData = [
      [`القضايا المغلقة: ${reportData.closedCases}`, `القضايا النشطة: ${reportData.activeCases}`, `إجمالي القضايا: ${reportData.totalCases}`],
      [`المبالغ المحصلة: ${reportData.totalRevenue.toLocaleString()} ر.ق`, `المستحق: ${reportData.pendingRevenue.toLocaleString()} ر.ق`, `الفواتير: ${reportData.totalInvoices}`],
    ];

    metricsData.forEach((row) => {
      row.forEach((metric) => {
        doc.text(metric, 10, yPosition);
        yPosition += 6;
      });
      yPosition += 2;
    });

    yPosition += 5;

    // Invoice Summary
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("ملخص الفواتير", 10, yPosition);
    yPosition += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const invoiceStatus = [
      `المدفوعة: ${reportData.invoicesByStatus.paid}`,
      `المعلقة: ${reportData.invoicesByStatus.pending}`,
      `المتأخرة: ${reportData.invoicesByStatus.overdue}`,
    ];

    invoiceStatus.forEach((status) => {
      doc.text(status, 10, yPosition);
      yPosition += 6;
    });

    yPosition += 5;

    // Follow-ups Summary
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("ملخص المتابعات", 10, yPosition);
    yPosition += 8;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const followupStats = [
      `المنجزة: ${reportData.completedFollowups}`,
      `الإجمالية: ${reportData.totalFollowups}`,
      `نسبة الإنجاز: ${reportData.totalFollowups > 0 ? Math.round((reportData.completedFollowups / reportData.totalFollowups) * 100) : 0}%`,
    ];

    followupStats.forEach((stat) => {
      doc.text(stat, 10, yPosition);
      yPosition += 6;
    });

    // Footer
    yPosition = pageHeight - 15;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`تم إنشاء التقرير: ${new Date().toLocaleDateString("ar-SA")}`, 10, yPosition);
    doc.text("تقرير معتمد من نظام إدارة القضايا", pageWidth - 10, yPosition, { align: "right" });

    // Save to buffer
    const pdfBuffer = doc.output("arraybuffer");
    
    // Upload to Base44
    const base44 = createClientFromRequest(req);
    const uploadRes = await base44.integrations.Core.UploadFile({
      file: new Blob([pdfBuffer], { type: "application/pdf" }),
    });

    return Response.json({ file_url: uploadRes.file_url });
  } catch (error) {
    console.error("خطأ في توليد PDF:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});