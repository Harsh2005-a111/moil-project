import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export function generateGovtReportPDF(report, selectedMineName) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const mineContext = selectedMineName || "Balaghat Mining Lease (Active)";
  const pillars = report.govPillars || {};

  const primaryNavy = [15, 44, 89];      // #0F2C59
  const secondaryNavy = [26, 86, 160];   // #1A56A0
  const emeraldGreen = [5, 150, 105];    // #059669
  const purpleAccent = [126, 34, 206];   // #7E22CE
  const slateDark = [30, 41, 59];        // #1E293B
  const slateMuted = [100, 116, 139];    // #64748B
  const bgLight = [248, 250, 252];       // #F8FAFC

  let cursorY = margin;

  const renderHeader = () => {
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.rect(0, 0, pageWidth, 28, "F");

    doc.setFillColor(217, 119, 6);
    doc.rect(0, 28, pageWidth, 1.5, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("GOVERNMENT OF INDIA • MINISTRY OF STEEL & MINISTRY OF MINES", margin, 10);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(
      "INDIAN BUREAU OF MINES (IBM) & GEOLOGICAL SURVEY OF INDIA (GSI) STATUTORY DOSSIER",
      margin,
      16
    );

    doc.setFontSize(7.5);
    doc.setTextColor(147, 197, 253);
    doc.text(
      "MOIL AI-Space Platform • Smart India Hackathon (SIH) National Mineral Security Initiative",
      margin,
      22
    );

    doc.setFillColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
    doc.roundedRect(pageWidth - margin - 44, 6, 44, 15, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text("UNFC COMPLIANT", pageWidth - margin - 41, 11.5);
    doc.setFontSize(6.5);
    doc.text(report.badge || "STATUTORY", pageWidth - margin - 41, 17);
  };

  const renderFooter = (pageNumber, totalPages) => {
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(
      "Conforms to IBM Mineral Conservation & Development Rules (MCDR 2017) & UNFC Standards",
      margin,
      pageHeight - 7
    );

    const pageStr = `Page ${pageNumber} of ${totalPages}`;
    doc.text(pageStr, pageWidth - margin - doc.getTextWidth(pageStr), pageHeight - 7);
  };

  const checkPageBreak = (neededHeight) => {
    if (cursorY + neededHeight > pageHeight - 18) {
      doc.addPage();
      renderHeader();
      cursorY = 36;
    }
  };

  const renderSectionHeading = (title, color = primaryNavy) => {
    checkPageBreak(12);
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(margin, cursorY, 3.5, 6.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(title, margin + 6, cursorY + 5);
    cursorY += 9;
  };

  const renderBulletPoint = (label, text) => {
    checkPageBreak(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    doc.text(`• ${label}:`, margin + 2, cursorY);

    const labelWidth = doc.getTextWidth(`• ${label}: `);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);

    const splitText = doc.splitTextToSize(text || "Official survey record.", contentWidth - 6 - labelWidth);
    if (splitText.length > 0) {
      doc.text(splitText[0], margin + 2 + labelWidth, cursorY);
      if (splitText.length > 1) {
        cursorY += 4.5;
        for (let i = 1; i < splitText.length; i++) {
          checkPageBreak(5);
          doc.text(splitText[i], margin + 6, cursorY);
          cursorY += 4.5;
        }
      } else {
        cursorY += 5;
      }
    } else {
      cursorY += 5;
    }
  };

  renderHeader();
  cursorY = 36;

  // Title Box
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, cursorY, contentWidth, 20, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text(report.title || "Section Technical Dossier", margin + 4, cursorY + 7);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
  doc.text(
    `CONCESSION: ${mineContext.toUpperCase()}  |  CATEGORY: ${report.category}  |  DATE: ${new Date().toLocaleDateString("en-IN")}`,
    margin + 4,
    cursorY + 14
  );
  cursorY += 25;

  // Executive Objective & XAI Rationale Box
  checkPageBreak(28);
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(148, 163, 184);
  doc.roundedRect(margin, cursorY, contentWidth, 24, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text("EXPLAINABLE AI (XAI) OPERATIONAL OBJECTIVE & RATIONALE", margin + 4, cursorY + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  const execSummaryLines = doc.splitTextToSize(report.executiveSummary || "", contentWidth - 8);
  doc.text(execSummaryLines.slice(0, 2), margin + 4, cursorY + 11);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
  doc.text("Decision Rationale: ", margin + 4, cursorY + 19);
  const rationaleLines = doc.splitTextToSize(report.explainableAiRationale || "", contentWidth - 40);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(rationaleLines.slice(0, 1), margin + 35, cursorY + 19);

  cursorY += 29;

  // 1. Geological & Spatial Mapping
  renderSectionHeading("1. Geological & Spatial Mapping", primaryNavy);
  renderBulletPoint("Geographical Boundaries", pillars.geologicalMapping?.geographicalBoundaries);
  renderBulletPoint("Lithology & Stratigraphy", pillars.geologicalMapping?.lithologyStratigraphy);
  renderBulletPoint("Structural Geology (Faults, Folds, Dip & Strike)", pillars.geologicalMapping?.structuralGeology);
  cursorY += 2;

  // 2. Mineralogical & Chemical Composition
  renderSectionHeading("2. Mineralogical & Chemical Composition (Ore Quality)", purpleAccent);
  renderBulletPoint("Certified Manganese Grade", pillars.mineralogicalComposition?.manganeseGrade);
  renderBulletPoint("Mineral Forms Present", pillars.mineralogicalComposition?.mineralForms);
  renderBulletPoint("Impurities & Elemental Ratios (Mn/Fe, SiO2, P, S)", pillars.mineralogicalComposition?.impuritiesAndRatios);
  cursorY += 2;

  // 3. Resource Estimation & UNFC Framework
  renderSectionHeading("3. Resource Estimation & UNFC Classification", emeraldGreen);
  renderBulletPoint("UNFC Framework Stage", pillars.resourceEstimation?.unfcFramework);
  renderBulletPoint("Tonnage & Volume Quantification", pillars.resourceEstimation?.tonnageVolume);
  cursorY += 2;

  // 4. Metallurgical & Beneficiation Potential
  renderSectionHeading("4. Metallurgical & Beneficiation Potential", [217, 119, 6]);
  renderBulletPoint("Processing Viability (Crushing, Washing, Jigging)", pillars.metallurgicalBeneficiation?.processingViability);
  renderBulletPoint("Bulk Sampling & Recovery", pillars.metallurgicalBeneficiation?.bulkSampling);
  cursorY += 2;

  // 5. Environmental, Infrastructure & Socio-Economic Baselines
  renderSectionHeading("5. Environmental, Infrastructure & Socio-Economic Baselines", [13, 148, 136]);
  renderBulletPoint("Ecological Sensitivity & Forest Buffers", pillars.environmentalSocioEconomic?.ecologicalSensitivity);
  renderBulletPoint("Regional Rail & Road Infrastructure", pillars.environmentalSocioEconomic?.infrastructureLogistics);
  renderBulletPoint("Health, Safety & DGMS Dust Norms", pillars.environmentalSocioEconomic?.healthSafetyDust);

  // --- PAGE 2: PARAMETERS TABLE & OUTPUT INTERPRETATION ---
  doc.addPage();
  renderHeader();
  cursorY = 36;

  renderSectionHeading("Explainable AI (XAI) Parameter Dictionary", primaryNavy);

  const parameterRows = (report.parametersTable || []).map((p) => [
    p.name,
    p.unit,
    p.range,
    p.default,
    p.operationalImpact,
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [["Parameter Name", "Unit", "Mining Range", "Default", "Operational Role & Geological Impact"]],
    body: parameterRows,
    theme: "striped",
    headStyles: {
      fillColor: [15, 44, 89],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 42 },
      1: { cellWidth: 16 },
      2: { cellWidth: 26 },
      3: { fontStyle: "bold", textColor: [5, 150, 105], cellWidth: 20 },
      4: { cellWidth: "auto" },
    },
    margin: { left: margin, right: margin },
  });

  cursorY = (doc.lastAutoTable?.finalY || cursorY + 45) + 8;

  // --- OUTPUT GUIDE TABLE ---
  checkPageBreak(25);
  renderSectionHeading("How to Read & Interpret Operational Outputs", secondaryNavy);

  const outputRows = (report.outputGuide || []).map((o) => [
    o.outputName,
    o.interpretation,
    o.normalVsAlert,
  ]);

  autoTable(doc, {
    startY: cursorY,
    head: [["Metric / Visual Output", "Operational & Physical Interpretation", "Statutory Threshold / Action Rule"]],
    body: outputRows,
    theme: "striped",
    headStyles: {
      fillColor: [26, 86, 160],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 44 },
      1: { cellWidth: 78 },
      2: { cellWidth: "auto", textColor: [153, 27, 27], fontStyle: "bold" },
    },
    margin: { left: margin, right: margin },
  });

  cursorY = (doc.lastAutoTable?.finalY || cursorY + 45) + 8;

  // --- JURY DEFENSE & DEPENDENCIES ---
  checkPageBreak(30);
  renderSectionHeading("Cross-Module Dependencies & Jury Defense Script", purpleAccent);

  (report.judgePitch || []).forEach((pitch, i) => {
    checkPageBreak(8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(purpleAccent[0], purpleAccent[1], purpleAccent[2]);
    doc.text(`[Defense Note ${i + 1}]`, margin + 2, cursorY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 41, 59);
    const pitchLines = doc.splitTextToSize(pitch, contentWidth - 35);
    doc.text(pitchLines, margin + 30, cursorY);
    cursorY += pitchLines.length * 4.2 + 2;
  });

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    renderFooter(i, totalPages);
  }

  const sanitizedTitle = (report.title || "Report")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .slice(0, 30);
  const timestamp = new Date().toISOString().slice(0, 10);
  doc.save(`MOIL_STATUTORY_REPORT_${sanitizedTitle}_${timestamp}.pdf`);
}
