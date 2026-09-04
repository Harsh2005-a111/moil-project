import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
from pathlib import Path
import datetime

def create_element(name):
    return OxmlElement(name)

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=140, bottom=140, left=180, right=180):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color="D3D3D3"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'  <w:top w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'  <w:bottom w:val="single" w:sz="6" w:space="0" w:color="{color}"/>'
        f'  <w:insideH w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'  <w:insideV w:val="none"/>'
        f'  <w:left w:val="none"/>'
        f'  <w:right w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def make_callout(doc, text_list, title="KEY TAKEAWAY", accent_color="1F4E79", bg_color="F0F4F8"):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = tbl.cell(0, 0)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=160, bottom=160, left=220, right=200)
    
    # Left border only
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(
        f'<w:tcBorders {nsdecls("w")}>'
        f'  <w:left w:val="single" w:sz="24" w:space="0" w:color="{accent_color}"/>'
        f'  <w:top w:val="none"/>'
        f'  <w:right w:val="none"/>'
        f'  <w:bottom w:val="none"/>'
        f'</w:tcBorders>'
    )
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_before = Pt(2)
    p.paragraph_format.space_after = Pt(4)
    run_t = p.add_run(f"📌 {title}\n")
    run_t.font.bold = True
    run_t.font.size = Pt(10.5)
    run_t.font.color.rgb = RGBColor(0x1F, 0x4E, 0x79)
    
    for item in text_list:
        p_item = cell.add_paragraph()
        p_item.paragraph_format.space_before = Pt(2)
        p_item.paragraph_format.space_after = Pt(2)
        run_i = p_item.add_run(item)
        run_i.font.size = Pt(10)
        run_i.font.color.rgb = RGBColor(0x33, 0x33, 0x33)
    
    doc.add_paragraph() # Spacing

def build_word_document():
    doc = docx.Document()
    
    # Page setup - 1 inch margins
    sections = doc.sections
    for s in sections:
        s.top_margin = Inches(1.0)
        s.bottom_margin = Inches(1.0)
        s.left_margin = Inches(1.0)
        s.right_margin = Inches(1.0)
        
        # Header / Footer
        header = s.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("MOIL Smart Mining Intelligence Portal | Technical Reference")
        hrun.font.size = Pt(8.5)
        hrun.font.color.rgb = RGBColor(0x88, 0x88, 0x88)
        
        footer = s.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        frun = fp.add_run("Confidential — Ministry of Mines & MOIL Smart Mining System")
        frun.font.size = Pt(8.5)
        frun.font.color.rgb = RGBColor(0x88, 0x88, 0x88)

    # Styles
    # Title
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(4)
    r_title = title_p.add_run("MOIL SMART MINING INTELLIGENCE PORTAL")
    r_title.font.name = "Calibri"
    r_title.font.size = Pt(22)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0x0F, 0x2C, 0x59) # Deep Corporate Navy

    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_before = Pt(0)
    sub_p.paragraph_format.space_after = Pt(14)
    r_sub = sub_p.add_run("Comprehensive Glossary of Units, Remote Sensing Notations, and AI Architecture")
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(13)
    r_sub.font.color.rgb = RGBColor(0x02, 0x84, 0xC7) # Steel Blue

    # Metadata Banner
    meta_p = doc.add_paragraph()
    meta_p.paragraph_format.space_before = Pt(0)
    meta_p.paragraph_format.space_after = Pt(18)
    r_meta = meta_p.add_run("Author: Smart Mining Engineering & AI Division  |  Classification: Technical Manual  |  Date: September 2026")
    r_meta.font.size = Pt(9.5)
    r_meta.font.italic = True
    r_meta.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    # Horizontal divider rule
    p_hr = doc.add_paragraph()
    p_hr.paragraph_format.space_after = Pt(12)
    p_hr_border = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="12" w:space="1" w:color="0284C7"/></w:pBdr>')
    p_hr._p.get_or_add_pPr().append(p_hr_border)

    # Executive Summary
    h1 = doc.add_heading("Executive Summary", level=1)
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(6)
    
    p = doc.add_paragraph(
        "This document provides the definitive engineering reference for all mathematical notations, "
        "physical measurement units, satellite remote sensing indices, and machine learning architectures "
        "utilized in the MOIL Smart Mining Intelligence Portal. It is structured to provide full transparency "
        "to mine planners, geologists, and executive stakeholders regarding how space-based Copernicus Sentinel-2 "
        "data is ingested, converted into tabular geophysical features, and evaluated to predict in-situ Manganese "
        "reserves, grade percentages, and operational extraction yields."
    )
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(12)

    # =========================================================================
    # SECTION 1: MINING RESERVE & TONNAGE UNITS
    # =========================================================================
    h1 = doc.add_heading("1. Mining Reserve & Tonnage Units", level=1)
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "Accurate quantification of ore deposits requires rigorous adherence to standard mineral reporting units. "
        "The table below outlines the primary tonnage and spatial units used across the portal:"
    )

    t1 = doc.add_table(rows=1, cols=4)
    t1.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t1, "CBD5E1")
    
    hdr_cells = t1.rows[0].cells
    hdr_titles = ["Notation / Unit", "Full Name", "Standard Conversion", "Engineering Meaning in MOIL Context"]
    col_widths = [Inches(1.2), Inches(1.4), Inches(1.8), Inches(2.6)]
    
    for i, title in enumerate(hdr_titles):
        hdr_cells[i].text = title
        set_cell_background(hdr_cells[i], "0F2C59")
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
        p = hdr_cells[i].paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        p.runs[0].font.size = Pt(9.5)
        hdr_cells[i].width = col_widths[i]

    t1_data = [
        ("kt", "Kilo-tonnes (Kilotonnes)", "1 kt = 1,000 metric tonnes\n(10^6 kg = 1 Gg)", "Standard sector & block-level reserve unit. E.g., 1,094 kt = 1,094,000 tonnes of in-situ manganese ore."),
        ("t / tonne", "Metric Tonne", "1 tonne = 1,000 kg\n(1 Mg = 2,204.6 lbs)", "Base unit for weekly mining extraction targets, blast yield calculations, and daily truck dispatch logs."),
        ("MT / Mt", "Mega-tonnes (Million Tonnes)", "1 MT = 1,000,000 tonnes\n= 1,000 kt", "Used for annual mine capacities (e.g., Balaghat Mine annual production capacity of ~0.85 MT/year)."),
        ("ha", "Hectare", "1 ha = 10,000 m²\n≈ 2.471 acres", "Concession lease boundary area. E.g., Balaghat lease area covers approximately 180.5 hectares."),
        ("m (AMSL)", "Meters Above Mean Sea Level", "Elevation datum (WGS84 / SRTM DEM)", "Vertical depth and terrain elevation slice (Z-coordinate) used in 3D Block Model reserve slicing (e.g., 75m depth)."),
    ]

    for row_idx, row_data in enumerate(t1_data):
        row = t1.add_row()
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, cell_value in enumerate(row_data):
            cell = row.cells[col_idx]
            cell.text = cell_value
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
            cell.width = col_widths[col_idx]
            p = cell.paragraphs[0]
            p.paragraph_format.line_spacing = 1.15
            p.runs[0].font.size = Pt(9)
            if col_idx == 0:
                p.runs[0].font.bold = True
                p.runs[0].font.color.rgb = RGBColor(0x02, 0x84, 0xC7)

    doc.add_paragraph()

    make_callout(
        doc,
        [
            "When the portal displays 'TOTAL AVAILABLE MN RESERVES: 1,094 kt', it signifies that within the 5 km x 5 km analyzed spatial grid, there is an estimated 1,094,000 metric tonnes of in-situ manganese ore.",
            "Economically Viable Tonnage (e.g., 962 kt @ 87.9% Yield) indicates the portion recoverable after stripping ratio, pit slope bench limits, and geological dilution are accounted for."
        ],
        title="PRACTICAL INTERPRETATION OF 'kt' IN MOIL REPORTING"
    )

    # =========================================================================
    # SECTION 2: CHEMICAL QUALITY, GRADE & UNFC CLASSIFICATION
    # =========================================================================
    h1 = doc.add_heading("2. Mineral Quality, Ore Grade & UNFC Classification", level=1)
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "Manganese ore commercial value is strictly governed by its chemical purity (% Mn content) and its "
        "geological classification under international reporting standards (UNFC / JORC)."
    )

    t2 = doc.add_table(rows=1, cols=3)
    t2.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t2, "CBD5E1")
    
    hdr2_cells = t2.rows[0].cells
    hdr2_titles = ["Notation", "Meaning", "Geological & Operational Significance"]
    col2_widths = [Inches(1.5), Inches(2.0), Inches(3.5)]

    for i, title in enumerate(hdr2_titles):
        hdr2_cells[i].text = title
        set_cell_background(hdr2_cells[i], "0F2C59")
        set_cell_margins(hdr2_cells[i], top=120, bottom=120, left=140, right=140)
        p = hdr2_cells[i].paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        p.runs[0].font.size = Pt(9.5)
        hdr2_cells[i].width = col2_widths[i]

    t2_data = [
        ("% Mn (Ore Grade)", "Manganese Elemental Purity", "Weight percentage of Manganese (Mn) in the mined rock. High Grade: >= 44% Mn; Medium Grade: 35% - 43% Mn; Low/Ferro Grade: 25% - 34% Mn; Sub-grade: < 25% Mn."),
        ("Target Grade vs AI Predicted Grade", "Demand Target vs Geological Reality", "Target Grade is the smelting contract or blend specification (e.g., 36.5% Mn). AI Predicted Grade is the in-situ reality estimated by AI (e.g., 35.5% Mn). The portal's prescriptive AI bridges this gap via optimized blending."),
        ("% Yield / % Recovery", "Extraction Recovery Efficiency", "The ratio of economically extractable ore to total in-situ reserves: (Viable Ore / Total In-Situ Ore) * 100. High yield (>85%) indicates favorable pit geometry and low waste overburden."),
        ("UNFC 111", "Proven Mineral Reserve", "Highest geological confidence. Validated by dense core drilling, geological mapping, and favorable feasibility economics."),
        ("UNFC 221", "Probable Mineral Reserve", "Moderate geological confidence. Drilled on wider grid spacing with pre-feasibility economic viability confirmed."),
        ("UNFC 331", "Inferred Mineral Resource", "Exploratory confidence based on satellite multi-spectral anomalies, geological belt continuity, and geophysical surface surveys."),
    ]

    for row_idx, row_data in enumerate(t2_data):
        row = t2.add_row()
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, cell_value in enumerate(row_data):
            cell = row.cells[col_idx]
            cell.text = cell_value
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
            cell.width = col2_widths[col_idx]
            p = cell.paragraphs[0]
            p.paragraph_format.line_spacing = 1.15
            p.runs[0].font.size = Pt(9)
            if col_idx == 0:
                p.runs[0].font.bold = True
                p.runs[0].font.color.rgb = RGBColor(0x0F, 0x76, 0x6E)

    doc.add_paragraph()

    # =========================================================================
    # SECTION 3: SPACE & REMOTE SENSING MULTI-SPECTRAL BANDS
    # =========================================================================
    h1 = doc.add_heading("3. Space Remote Sensing & Multi-Spectral Satellite Indicators", level=1)
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)

    doc.add_paragraph(
        "The portal integrates European Space Agency (ESA) Copernicus Sentinel-2 Level-2A surface reflectance data. "
        "The table below details each spectral band retrieved, its physical wavelength, and how it governs Manganese deposit detection:"
    )

    t3 = doc.add_table(rows=1, cols=4)
    t3.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t3, "CBD5E1")
    
    hdr3_cells = t3.rows[0].cells
    hdr3_titles = ["Band / Index", "Wavelength / Unit", "Range", "Geological & Remote Sensing Mechanism"]
    col3_widths = [Inches(1.5), Inches(1.4), Inches(1.2), Inches(2.9)]

    for i, title in enumerate(hdr3_titles):
        hdr3_cells[i].text = title
        set_cell_background(hdr3_cells[i], "0F2C59")
        set_cell_margins(hdr3_cells[i], top=120, bottom=120, left=140, right=140)
        p = hdr3_cells[i].paragraphs[0]
        p.runs[0].font.bold = True
        p.runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        p.runs[0].font.size = Pt(9.5)
        hdr3_cells[i].width = col3_widths[i]

    t3_data = [
        ("B02, B03, B04", "490, 560, 665 nm\n(Visual spectrum)", "0.0 – 1.0\nReflectance", "Blue, Green, Red bands. Stretched and stacked to construct the true-color surface satellite scene for geological visual inspection."),
        ("B08 (NIR)", "842 nm\n(Near-Infrared)", "0.0 – 1.0\nReflectance", "Reflected strongly by cellular structure of green vegetation. Used with Red band (B04) to compute the NDVI vegetation mask."),
        ("B11 (SWIR-1)", "1610 nm\n(Short-Wave IR)", "0.0 – 1.0\nReflectance", "Primary diagnostic band for hydroxyl-bearing minerals, clay alteration halos, and manganese oxide absorption dips."),
        ("B12 (SWIR-2)", "2190 nm\n(Short-Wave IR)", "0.0 – 1.0\nReflectance", "Secondary diagnostic band. Braunite, Pyrolusite, and Psilomelane exhibit characteristic diagnostic absorption troughs across B11 & B12."),
        ("NDVI Index", "(B08 - B04) / (B08 + B04)\n(Unitless Index)", "-1.0 to +1.0", "Normalized Difference Vegetation Index. High NDVI (>0.5) indicates dense tree canopy; Low NDVI (<0.2) highlights exposed rock outcrops and open-cast pits."),
        ("LST (°C)", "Thermal Inertia Proxy\n(Degrees Celsius)", "20°C – 50°C", "Land Surface Temperature proxy. Dense metallic manganese ore bodies have distinct thermal heat capacity compared to surrounding country rocks."),
        ("Rainfall (mm/wk)", "NASA GPM Satellite\n(Millimeters / week)", "0 – 200 mm", "Precipitation index governing pit flooding risk, bench slope stability, and heavy mining equipment haul road traction loss."),
        ("Soil Moisture", "NASA SMAP Radar\n(Volumetric ratio)", "0.0 – 1.0", "Moisture saturation of surface soil. Affects drilling dust, blasting explosive performance, and mud accumulation in open-cast benches."),
        ("EMAG2 Magnetics", "NOAA Global Earth Magnetic Anomaly (nT)", "-500 to +800 nT", "Magnetic anomaly in nanoTeslas. Manganese deposits associated with Jacobsite and iron formations produce distinct positive magnetic peaks."),
    ]

    for row_idx, row_data in enumerate(t3_data):
        row = t3.add_row()
        bg = "F8FAFC" if row_idx % 2 == 1 else "FFFFFF"
        for col_idx, cell_value in enumerate(row_data):
            cell = row.cells[col_idx]
            cell.text = cell_value
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
            cell.width = col3_widths[col_idx]
            p = cell.paragraphs[0]
            p.paragraph_format.line_spacing = 1.15
            p.runs[0].font.size = Pt(9)
            if col_idx == 0:
                p.runs[0].font.bold = True
                p.runs[0].font.color.rgb = RGBColor(0x18, 0x5F, 0xA5)

    doc.add_paragraph()

    # =========================================================================
    # SECTION 4: ML ARCHITECTURE & PIPELINE
    # =========================================================================
    h1 = doc.add_heading("4. Machine Learning Pipeline: Why Tabular Data, Not Raw Images", level=1)
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)

    p_arch = doc.add_paragraph(
        "A critical architectural principle of the MOIL portal is that the machine learning models "
        "(RandomForestClassifier and LightGBMRegressor) are trained on physical tabular indicators rather than "
        "raw 2D pixel grids. This delivers three immense advantages for mining operations:\n"
        "1. Full Interpretability (SHAP & Permutation Feature Importance): Every prediction can be mathematically attributed to specific geophysical factors (e.g., +4.2% Mn grade due to B11 absorption dip).\n"
        "2. Physics & Chemistry Consistency: Spectral reflectance physics (Planck's radiation laws, absorption troughs) are preserved rather than obscured inside black-box convolutional layers.\n"
        "3. Multi-Source Fusion: Enables seamless tabular merging of optical satellite bands, radar soil moisture, precipitation logs, DEM elevation slices, and ground magnetometer surveys."
    )
    p_arch.paragraph_format.line_spacing = 1.15
    p_arch.paragraph_format.space_after = Pt(12)

    make_callout(
        doc,
        [
            "Step 1: User inputs Latitude and Longitude (or selects an existing MOIL mine).",
            "Step 2: Backend sends Process API request to Copernicus CDSE, retrieving 6 spectral bands: B02, B03, B04, B08, B11, B12.",
            "Step 3: Feature Extractor computes diagnostic ratios: NDVI = (B08-B04)/(B08+B04), SWIR B11/B12 absorption, LST (°C), and Soil Moisture.",
            "Step 4: Tabular Random Forest Model (mn_classifier.pkl) evaluates the 9 numerical features and outputs: Total Available Reserves (kt), Predicted Grade (% Mn), and Probability (%).",
            "Step 5: Operator clicks 'Auto-Fill Sliders & Inputs' to load parameters into the production simulation engine, visualizing extraction yield vs operational constraints."
        ],
        title="END-TO-END DATAFLOW PIPELINE"
    )

    # Save document
    out_path = Path("c:/Users/HARSH RAJ SRIVASTAVA/Desktop/Harsh_NSUT/Projects/SIH/moil-project/MOIL_Portal_Notations_and_Architecture_Guide.docx")
    doc.save(out_path)
    print(f"Document successfully created at: {out_path}")

if __name__ == "__main__":
    build_word_document()
