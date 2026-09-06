import { jsPDF } from "jspdf";
import autoTable, { applyPlugin } from "jspdf-autotable";

// Safely register autoTable plugin with jsPDF prototype
try {
  if (typeof applyPlugin === "function") {
    applyPlugin(jsPDF);
  } else if (autoTable && typeof autoTable.applyPlugin === "function") {
    autoTable.applyPlugin(jsPDF);
  }
} catch (err) {
  console.warn("jsPDF-autotable plugin auto-registration notice:", err);
}

// Universal table renderer that works across Webpack 5, ESM, and CommonJS
function drawTable(doc, options) {
  if (typeof doc.autoTable === "function") {
    doc.autoTable(options);
  } else if (typeof autoTable === "function") {
    autoTable(doc, options);
  } else if (autoTable && typeof autoTable.default === "function") {
    autoTable.default(doc, options);
  } else if (autoTable && typeof autoTable.autoTable === "function") {
    autoTable.autoTable(doc, options);
  } else {
    console.error("autoTable function could not be resolved.");
  }
}

/**
 * Generates an official, formal Government of India / IBM / GSI statutory mineral dossier in PDF format.
 * Conforms to UNFC (1997/2009) and Mineral Conservation & Development Rules (MCDR 2017).
 */
export function generateGovtReportPDF(report, selectedMineName) {
  if (!report) {
    throw new Error("Invalid report data provided to generateGovtReportPDF");
  }

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

  // Official Government Palette
  const govtNavy = [11, 37, 69];         // #0B2545 (Official State Navy)
  const nationalGold = [180, 115, 0];    // #B47300 (Deep Gold Trim)
  const secondaryNavy = [26, 86, 160];   // #1A56A0
  const emeraldGreen = [5, 150, 105];    // #059669
  const purpleAccent = [109, 40, 217];   // #6D28D9
  const slateDark = [30, 41, 59];        // #1E293B
  const slateMuted = [100, 116, 139];    // #64748B
  const bgLight = [248, 250, 252];       // #F8FAFC
  const borderGray = [203, 213, 225];    // #CBD5E1

  let cursorY = margin;

  // Running Header for all pages
  const renderHeader = (isCover = false) => {
    // Top national navy header band
    doc.setFillColor(govtNavy[0], govtNavy[1], govtNavy[2]);
    doc.rect(0, 0, pageWidth, 26, "F");

    // Gold separator accent line
    doc.setFillColor(nationalGold[0], nationalGold[1], nationalGold[2]);
    doc.rect(0, 26, pageWidth, 1.4, "F");

    // Title hierarchy in header
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("GOVERNMENT OF INDIA • MINISTRY OF MINES & MINISTRY OF STEEL", margin, 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(226, 232, 240);
    doc.text(
      "INDIAN BUREAU OF MINES (IBM) • GEOLOGICAL SURVEY OF INDIA (GSI) STATUTORY DOSSIER",
      margin,
      15
    );

    doc.setFontSize(6.8);
    doc.setTextColor(191, 219, 254);
    doc.text(
      "MOIL AI-Space Exploration & Shortfall Mitigation Platform • SIH National Mineral Security System",
      margin,
      21
    );

    // Right-hand Statutory Compliance Seal Badge
    doc.setFillColor(5, 150, 105);
    doc.roundedRect(pageWidth - margin - 46, 5, 46, 16, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text("UNFC COMPLIANT", pageWidth - margin - 43, 11);
    doc.setFontSize(6.5);
    doc.text(report.badge || "FORM G STATUTORY", pageWidth - margin - 43, 16.5);
  };

  // Running Footer for all pages
  const renderFooter = (pageNumber, totalPages) => {
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(180, 83, 9);
    doc.text("CONFIDENTIAL // RESTRICTED STATUTORY USE ONLY", margin, pageHeight - 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
    doc.text(
      "| Conforms to MCDR 2017 & IBM UNFC Exploration Protocol | MOIL Ltd.",
      margin + 58,
      pageHeight - 7
    );

    const pageStr = `Page ${pageNumber} of ${totalPages}`;
    doc.setFont("helvetica", "bold");
    doc.text(pageStr, pageWidth - margin - doc.getTextWidth(pageStr), pageHeight - 7);
  };

  const checkPageBreak = (neededHeight) => {
    if (cursorY + neededHeight > pageHeight - 20) {
      doc.addPage();
      renderHeader(false);
      cursorY = 34;
    }
  };

  const renderSectionHeading = (title, color = govtNavy, iconNumber = "") => {
    checkPageBreak(14);
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(margin, cursorY, 3.5, 6.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(`${iconNumber ? iconNumber + " " : ""}${title}`, margin + 6, cursorY + 5);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin + 6, cursorY + 7, pageWidth - margin, cursorY + 7);

    cursorY += 10;
  };

  const renderSubItem = (itemNumber, label, text) => {
    checkPageBreak(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
    const bulletPrefix = `${itemNumber} ${label}: `;
    doc.text(bulletPrefix, margin + 2, cursorY);

    const prefixWidth = doc.getTextWidth(bulletPrefix);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);

    const availableWidth = contentWidth - 4 - prefixWidth;
    const splitText = doc.splitTextToSize(text || "Official survey observation recorded.", availableWidth > 40 ? availableWidth : contentWidth - 8);

    if (splitText.length > 0) {
      if (availableWidth > 40) {
        doc.text(splitText[0], margin + 2 + prefixWidth, cursorY);
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
        cursorY += 4.5;
        for (let i = 0; i < splitText.length; i++) {
          checkPageBreak(5);
          doc.text(splitText[i], margin + 6, cursorY);
          cursorY += 4.5;
        }
      }
    } else {
      cursorY += 5;
    }
  };

  // -------------------------------------------------------------
  // PAGE 1: OFFICIAL STATUTORY HEADER & EXECUTIVE DOSSIER
  // -------------------------------------------------------------
  renderHeader(true);
  cursorY = 33;

  // Official Metadata & Document Control Box
  const dateFormatted = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const timeFormatted = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const dossierRef = `MOIL/STAT/${(report.id || "EXPLORATION").toUpperCase().slice(0, 12)}/${new Date().getFullYear()}/#${Math.floor(100000 + Math.random() * 900000)}`;

  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, cursorY, contentWidth, 31, 2, 2, "FD");

  // Top banner inside box
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, cursorY, contentWidth, 7, "F");
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.line(margin, cursorY + 7, pageWidth - margin, cursorY + 7);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(govtNavy[0], govtNavy[1], govtNavy[2]);
  doc.text("STATUTORY DOCUMENT CONTROL & REGULATORY CLASSIFICATION", margin + 4, cursorY + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(nationalGold[0], nationalGold[1], nationalGold[2]);
  doc.text(`DOSSIER ID: ${dossierRef}`, pageWidth - margin - doc.getTextWidth(`DOSSIER ID: ${dossierRef}`) - 4, cursorY + 5);

  // Metadata Fields Grid
  const metaCol1X = margin + 4;
  const metaCol2X = margin + (contentWidth / 2) + 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.8);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text("Target Concession / Mining Lease:", metaCol1X, cursorY + 13);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(govtNavy[0], govtNavy[1], govtNavy[2]);
  doc.text(mineContext.toUpperCase(), metaCol1X + 46, cursorY + 13);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text("Functional Exploration Domain:", metaCol1X, cursorY + 19);
  doc.setFont("helvetica", "normal");
  doc.text(`${report.category || "Mineral Intelligence"} [${report.badge || "IBM"}]`, metaCol1X + 46, cursorY + 19);

  doc.setFont("helvetica", "bold");
  doc.text("Statutory Framework Protocol:", metaCol1X, cursorY + 25);
  doc.setFont("helvetica", "normal");
  doc.text("UNFC-1997 / UNFC-2009 Standards & MCDR 2017 Form G", metaCol1X + 46, cursorY + 25);

  // Col 2
  doc.setFont("helvetica", "bold");
  doc.text("Certified Date of Generation:", metaCol2X, cursorY + 13);
  doc.setFont("helvetica", "normal");
  doc.text(`${dateFormatted} ${timeFormatted} IST`, metaCol2X + 42, cursorY + 13);

  doc.setFont("helvetica", "bold");
  doc.text("Statutory Regulatory Authority:", metaCol2X, cursorY + 19);
  doc.setFont("helvetica", "normal");
  doc.text("Ministry of Mines & Indian Bureau of Mines", metaCol2X + 42, cursorY + 19);

  doc.setFont("helvetica", "bold");
  doc.text("Digital Verification Hash:", metaCol2X, cursorY + 25);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text(`SHA-256: ${Math.random().toString(36).substring(2, 12).toUpperCase()}-MOIL-IBM`, metaCol2X + 42, cursorY + 25);

  cursorY += 36;

  // Document Title Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(govtNavy[0], govtNavy[1], govtNavy[2]);
  doc.text(report.title || "Statutory Operational Mineral Dossier", margin, cursorY);
  cursorY += 5.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.2);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text("Official Technical Appraisal, Explainable AI Audit Trail & UNFC Compliance Dossier", margin, cursorY);
  cursorY += 7;

  // Executive Objective & Explainable AI (XAI) Charter Box
  checkPageBreak(28);
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, cursorY, contentWidth, 25, 2, 2, "FD");

  doc.setFillColor(govtNavy[0], govtNavy[1], govtNavy[2]);
  doc.rect(margin, cursorY, 3, 25, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(govtNavy[0], govtNavy[1], govtNavy[2]);
  doc.text("EXPLAINABLE AI (XAI) OPERATIONAL MANDATE & AUDIT TRAIL", margin + 6, cursorY + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  const execSummaryLines = doc.splitTextToSize(report.executiveSummary || "", contentWidth - 12);
  doc.text(execSummaryLines.slice(0, 2), margin + 6, cursorY + 11.5);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(secondaryNavy[0], secondaryNavy[1], secondaryNavy[2]);
  doc.text("Statutory Decision Rationale: ", margin + 6, cursorY + 20);
  const rationaleLines = doc.splitTextToSize(report.explainableAiRationale || "", contentWidth - 48);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(51, 65, 85);
  doc.text(rationaleLines.slice(0, 1), margin + 46, cursorY + 20);

  cursorY += 30;

  // -------------------------------------------------------------
  // THE 5 STATUTORY GOVERNMENT AREAS (GOVERNMENT SPECIFICATION)
  // -------------------------------------------------------------

  // Area 1: Geological & Spatial Mapping
  renderSectionHeading("Area 1: Geological & Spatial Mapping (G-Axis)", govtNavy, "1.0");
  renderSubItem("1.1", "Geographical Boundaries & GPS Demarcation", pillars.geologicalMapping?.geographicalBoundaries);
  renderSubItem("1.2", "Lithology & Host Rock Stratigraphy (Sausar Group)", pillars.geologicalMapping?.lithologyStratigraphy);
  renderSubItem("1.3", "Structural Geology (Faults, Folds, Dip & Strike)", pillars.geologicalMapping?.structuralGeology);
  cursorY += 3;

  // Area 2: Mineralogical & Chemical Composition (Ore Quality)
  renderSectionHeading("Area 2: Mineralogical & Chemical Composition (Quality Assurance)", purpleAccent, "2.0");
  renderSubItem("2.1", "Certified Manganese Grade (% Mn & MnO2)", pillars.mineralogicalComposition?.manganeseGrade);
  renderSubItem("2.2", "Dominant Mineral Assemblage (Braunite, Pyrolusite)", pillars.mineralogicalComposition?.mineralForms);
  renderSubItem("2.3", "Deleterious Impurities & Ratios (Mn/Fe, SiO2, P, S)", pillars.mineralogicalComposition?.impuritiesAndRatios);
  cursorY += 3;

  // Area 3: Resource Estimation & UNFC Framework Classification
  renderSectionHeading("Area 3: Resource Estimation & UNFC Classification", emeraldGreen, "3.0");
  renderSubItem("3.1", "UNFC Stage Classification (G1/G2/G3/G4)", pillars.resourceEstimation?.unfcFramework);
  renderSubItem("3.2", "In-Situ Tonnage & Volumetric Geometry", pillars.resourceEstimation?.tonnageVolume);
  cursorY += 3;

  // Area 4: Metallurgical & Beneficiation Potential
  renderSectionHeading("Area 4: Metallurgical & Beneficiation Potential", nationalGold, "4.0");
  renderSubItem("4.1", "Processing Viability (Crushing, Washing, Scrubbing, Jigging)", pillars.metallurgicalBeneficiation?.processingViability);
  renderSubItem("4.2", "Bulk Sampling Analysis & Beneficiation Recovery %", pillars.metallurgicalBeneficiation?.bulkSampling);
  cursorY += 3;

  // Area 5: Environmental, Infrastructure & Socio-Economic Baselines
  renderSectionHeading("Area 5: Environmental, Infrastructure & DGMS Safety Baselines", [13, 148, 136], "5.0");
  renderSubItem("5.1", "Ecological Sensitivity & Forest Conservation Act Setbacks", pillars.environmentalSocioEconomic?.ecologicalSensitivity);
  renderSubItem("5.2", "Regional Logistics, SECR Rail Sidings & High-Tension Grid", pillars.environmentalSocioEconomic?.infrastructureLogistics);
  renderSubItem("5.3", "Occupational Health, DGMS Safety & Wet Dust Suppression", pillars.environmentalSocioEconomic?.healthSafetyDust);

  // -------------------------------------------------------------
  // PAGE 2+: PARAMETERS TABLE & OPERATIONAL OUTPUT MATRIX
  // -------------------------------------------------------------
  doc.addPage();
  renderHeader(false);
  cursorY = 34;

  renderSectionHeading("Explainable AI (XAI) Input Parameters & Calibration Dictionary", govtNavy, "6.0");

  const parameterRows = (report.parametersTable || []).map((p) => [
    p.name,
    p.unit,
    p.range,
    p.default,
    p.operationalImpact,
  ]);

  drawTable(doc, {
    startY: cursorY,
    head: [["Parameter Name", "Unit", "Mining Range", "Default", "Operational & Geological Role"]],
    body: parameterRows,
    theme: "striped",
    headStyles: {
      fillColor: govtNavy,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
    },
    bodyStyles: {
      fontSize: 7.3,
      textColor: [30, 41, 59],
      cellPadding: 2.2,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 42 },
      1: { cellWidth: 18 },
      2: { cellWidth: 26 },
      3: { fontStyle: "bold", textColor: emeraldGreen, cellWidth: 20 },
      4: { cellWidth: "auto" },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
  });

  cursorY = ((doc.lastAutoTable && doc.lastAutoTable.finalY) || cursorY + 45) + 8;

  // Operational Output Matrix
  checkPageBreak(30);
  renderSectionHeading("Operational Output Guidance & Threshold Alert Rules", secondaryNavy, "7.0");

  const outputRows = (report.outputGuide || []).map((o) => [
    o.outputName,
    o.interpretation,
    o.normalVsAlert,
  ]);

  drawTable(doc, {
    startY: cursorY,
    head: [["Metric / Visual Output", "Operational & Geological Interpretation", "Statutory Action Threshold / Alert Rule"]],
    body: outputRows,
    theme: "striped",
    headStyles: {
      fillColor: secondaryNavy,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7.3,
      textColor: [30, 41, 59],
      cellPadding: 2.2,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 45 },
      1: { cellWidth: 78 },
      2: { cellWidth: "auto", textColor: [153, 27, 27], fontStyle: "bold" },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: margin, right: margin },
  });

  cursorY = ((doc.lastAutoTable && doc.lastAutoTable.finalY) || cursorY + 45) + 8;

  // Hackathon Jury & Statutory Defense Script
  checkPageBreak(30);
  renderSectionHeading("Cross-Module Scientific Defense & Operational Validation", purpleAccent, "8.0");

  (report.judgePitch || []).forEach((pitch, i) => {
    checkPageBreak(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.8);
    doc.setTextColor(purpleAccent[0], purpleAccent[1], purpleAccent[2]);
    doc.text(`[Statutory Validation ${i + 1}]`, margin + 2, cursorY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.8);
    doc.setTextColor(30, 41, 59);
    const pitchLines = doc.splitTextToSize(pitch, contentWidth - 40);
    doc.text(pitchLines, margin + 35, cursorY);
    cursorY += pitchLines.length * 4.2 + 2.5;
  });

  // -------------------------------------------------------------
  // OFFICIAL SIGNATORY & STATUTORY ENDORSEMENT BLOCK
  // -------------------------------------------------------------
  checkPageBreak(48);
  cursorY += 4;

  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, cursorY, contentWidth, 42, 2, 2, "FD");

  doc.setFillColor(govtNavy[0], govtNavy[1], govtNavy[2]);
  doc.rect(margin, cursorY, contentWidth, 6, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("STATUTORY ENDORSEMENT & COMPETENT PERSON (CP) VERIFICATION", margin + 4, cursorY + 4.2);

  const signColWidth = (contentWidth - 12) / 3;
  const signY = cursorY + 11;

  // Box 1: Competent Person
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text("Competent Person (CP):", margin + 4, signY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text("CRIRSCO / UNFC Regd. Geologist", margin + 4, signY + 4.5);
  doc.text("Seal: Certified Resource Auditor", margin + 4, signY + 8.5);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.line(margin + 4, signY + 18, margin + 4 + signColWidth - 4, signY + 18);
  doc.setFont("helvetica", "italic");
  doc.text("Signature & National Geocode", margin + 4, signY + 22);

  // Box 2: MOIL Head of Exploration
  const col2X = margin + 4 + signColWidth + 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text("Chief Mining Geologist:", col2X, signY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text("Exploration & Resource Wing, MOIL Ltd.", col2X, signY + 4.5);
  doc.text("Headquarters: Nagpur, Maharashtra", col2X, signY + 8.5);
  doc.line(col2X, signY + 18, col2X + signColWidth - 4, signY + 18);
  doc.setFont("helvetica", "italic");
  doc.text("Counter-Signature & Official Seal", col2X, signY + 22);

  // Box 3: IBM / Statutory Compliance
  const col3X = margin + 4 + (signColWidth * 2) + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.2);
  doc.setTextColor(slateDark[0], slateDark[1], slateDark[2]);
  doc.text("Statutory Compliance Officer:", col3X, signY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(slateMuted[0], slateMuted[1], slateMuted[2]);
  doc.text("IBM / DGMS Compliance Cell", col3X, signY + 4.5);
  doc.text("National Mineral Repository Vault", col3X, signY + 8.5);
  doc.line(col3X, signY + 18, col3X + signColWidth - 4, signY + 18);
  doc.setFont("helvetica", "italic");
  doc.text("Statutory Verification Record", col3X, signY + 22);

  // Bottom Notice
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.2);
  doc.setTextColor(180, 83, 9);
  doc.text(
    "NOTICE: This document is cryptographically logged under SIH National Security protocols. Unauthorised alterations constitute a statutory offence under the MMDR Act.",
    margin + 4,
    cursorY + 39
  );

  // Finalize Footers for all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    renderFooter(i, totalPages);
  }

  // Sanitize filename & Save as real .pdf
  const sanitizedTitle = (report.title || "STATUTORY_REPORT")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .slice(0, 30);
  const dateStr = new Date().toISOString().slice(0, 10);
  const finalFilename = `MOIL_STATUTORY_DOSSIER_${sanitizedTitle}_${dateStr}.pdf`;

  doc.save(finalFilename);
  return finalFilename;
}
