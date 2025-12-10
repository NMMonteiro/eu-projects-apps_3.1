import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  HeadingLevel,
  PageBreak,
  ImageRun,
  convertInchesToTwip,
} from "docx";
import { saveAs } from "file-saver";
import { FullProposal } from "../types/proposal";

// ============================================================================
// HELPER FUNCTIONS FOR CONSISTENT STYLING
// ============================================================================

const HEADER_SIZE = 28;
const SUBHEADER_SIZE = 24;
const BODY_SIZE = 22;
const FONT = "Arial";

/**
 * Creates a section header (H1)
 */
function createSectionHeader(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: HEADER_SIZE,
        font: FONT,
        color: "1F4788",
      }),
    ],
    spacing: { before: 400, after: 200 },
    heading: HeadingLevel.HEADING_1,
  });
}

/**
 * Creates a subsection header (H2)
 */
function createSubHeader(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: SUBHEADER_SIZE,
        font: FONT,
        color: "2E5C8A",
      }),
    ],
    spacing: { before: 300, after: 150 },
    heading: HeadingLevel.HEADING_2,
  });
}

/**
 * Creates a regular paragraph
 */
function createParagraph(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        size: BODY_SIZE,
        font: FONT,
      }),
    ],
    spacing: { before: 100, after: 100 },
  });
}

/**
 * Converts HTML content to paragraphs
 * Strips HTML tags and splits by line breaks
 */
function convertHtmlToParagraphs(html: string | undefined | null): Paragraph[] {
  if (!html) return [createParagraph("")];

  // Strip HTML tags and convert <br> to newlines
  let cleanText = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>?/gm, "")
    .trim();

  if (!cleanText) return [createParagraph("")];

  // Split by newlines and create paragraphs
  return cleanText
    .split(/\n+/)
    .filter((line) => line.trim())
    .map((line) => createParagraph(line.trim()));
}

/**
 * Creates a page break
 */
function createPageBreak(): Paragraph {
  return new Paragraph({
    children: [new PageBreak()],
  });
}

/**
 * Fetches an image from a URL and converts it to base64
 */
async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data:image/...;base64, prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
}

/**
 * Creates a table with header row
 */
function createTable(headers: string[], rows: string[][]): Table {
  const headerRow = new TableRow({
    children: headers.map(
      (header) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: header,
                  bold: true,
                  size: BODY_SIZE,
                  font: FONT,
                }),
              ],
            }),
          ],
          shading: { fill: "E7E6E6" },
        })
    ),
  });

  const dataRows = rows.map(
    (row) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              children: [createParagraph(cell)],
            })
        ),
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    },
    rows: [headerRow, ...dataRows],
  });
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

/**
 * Generates a DOCX document from proposal data
 */
export async function generateDocx(
  proposal: FullProposal
): Promise<{ blob: Blob; fileName: string }> {
  const docChildren: (Paragraph | Table)[] = [];

  // ============================================================================
  // TITLE PAGE - Vertically centered with prominent logo
  // ============================================================================

  // Add top spacing to center content vertically (approximately 1/4 page)
  docChildren.push(
    new Paragraph({
      children: [new TextRun({ text: "" })],
      spacing: { before: 2000 }, // Large top margin for vertical centering
    })
  );

  if (proposal.funding_scheme?.logo_url) {
    console.log("Attempting to load logo from:", proposal.funding_scheme.logo_url);
    try {
      const logoBase64 = await fetchImageAsBase64(proposal.funding_scheme.logo_url);
      if (logoBase64) {
        console.log("Logo loaded successfully, base64 length:", logoBase64.length);
        docChildren.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: Uint8Array.from(atob(logoBase64), c => c.charCodeAt(0)),
                transformation: {
                  width: 200,  // Increased from 100 to 200
                  height: 200, // Increased from 100 to 200
                },
                type: "png",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 600 }, // More spacing around logo
          })
        );
      } else {
        console.warn("fetchImageAsBase64 returned null/false for logo");
      }
    } catch (error) {
      console.error('Error loading logo:', error);
    }
  } else {
    console.warn("No logo_url found in proposal.funding_scheme", proposal.funding_scheme);
  }

  // Proposal title
  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: proposal.title || "Untitled Proposal",
          bold: true,
          size: 36,
          font: FONT,
          color: "1F4788",
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
    })
  );

  // Generation date
  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated on ${new Date().toLocaleDateString()}`,
          size: BODY_SIZE,
          font: FONT,
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    })
  );

  // Funding scheme name (if available)
  if (proposal.funding_scheme?.name) {
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Funding Scheme: ${proposal.funding_scheme.name}`,
            size: BODY_SIZE,
            font: FONT,
            bold: true,
            color: "2E5C8A",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );
  }

  // Page break after title page
  docChildren.push(createPageBreak());

  // ============================================================================
  // EXECUTIVE SUMMARY
  // ============================================================================
  if (proposal.summary) {
    docChildren.push(createSectionHeader("Executive Summary"));
    docChildren.push(...convertHtmlToParagraphs(proposal.summary));
    // Page break after executive summary
    docChildren.push(createPageBreak());
  }

  // ============================================================================
  // DYNAMIC SECTIONS (if using funding scheme templates)
  // ============================================================================
  if (proposal.dynamic_sections && Object.keys(proposal.dynamic_sections).length > 0) {
    Object.entries(proposal.dynamic_sections).forEach(([key, content], idx) => {
      const title = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

      docChildren.push(createSectionHeader(`${idx + 1}. ${title}`));
      docChildren.push(...convertHtmlToParagraphs(content as string));
    });
  } else {
    // ============================================================================
    // LEGACY SECTIONS (fallback for older proposals)
    // ============================================================================
    const sections = [
      { title: "Introduction", content: proposal.introduction },
      { title: "Relevance", content: proposal.relevance },
      { title: "Objectives", content: proposal.objectives },
      { title: "Methodology", content: proposal.methodology || proposal.methods },
      { title: "Work Plan", content: proposal.workPlan },
      { title: "Expected Results", content: proposal.expectedResults },
      { title: "Impact", content: proposal.impact },
      { title: "Innovation", content: proposal.innovation },
      { title: "Sustainability", content: proposal.sustainability },
      { title: "Consortium", content: proposal.consortium },
      { title: "Risk Management", content: proposal.riskManagement },
      { title: "Dissemination & Communication", content: proposal.dissemination },
    ];

    sections.forEach((section, idx) => {
      if (section.content) {
        docChildren.push(createSectionHeader(`${idx + 1}. ${section.title}`));
        docChildren.push(...convertHtmlToParagraphs(section.content));
      }
    });
  }

  // ============================================================================
  // PARTNERS
  // ============================================================================
  // No page break - let content flow naturally
  if (proposal.partners && proposal.partners.length > 0) {
    docChildren.push(createSectionHeader("Partners"));
    const partnerRows = proposal.partners.map((p) => [
      p.name || "N/A",
      p.role || "N/A",
    ]);
    docChildren.push(createTable(["Partner Name", "Role"], partnerRows));
  }

  // ============================================================================
  // WORK PACKAGES
  // ============================================================================
  if (proposal.workPackages && proposal.workPackages.length > 0) {
    docChildren.push(createSectionHeader("Work Packages"));
    proposal.workPackages.forEach((wp, idx) => {
      // Check if name already starts with "WP" to avoid duplication
      const wpName = wp.name || "Unnamed";
      const wpTitle = wpName.match(/^WP\d+:/i) ? wpName : `WP${idx + 1}: ${wpName}`;
      docChildren.push(createSubHeader(wpTitle));
      docChildren.push(createParagraph(wp.description || "No description"));
      if (wp.deliverables && wp.deliverables.length > 0) {
        docChildren.push(createParagraph("Deliverables:"));
        wp.deliverables.forEach((d) => {
          docChildren.push(createParagraph(`  • ${d}`));
        });
      }
    });
  }

  // ============================================================================
  // MILESTONES
  // ============================================================================
  if (proposal.milestones && proposal.milestones.length > 0) {
    docChildren.push(createSectionHeader("Milestones"));
    const milestoneRows = proposal.milestones.map((m) => [
      m.milestone || "N/A",
      m.workPackage || "N/A",
      m.dueDate || "N/A",
    ]);
    docChildren.push(
      createTable(["Milestone", "Work Package", "Due Date"], milestoneRows)
    );
  }

  // ============================================================================
  // RISKS
  // ============================================================================
  if (proposal.risks && proposal.risks.length > 0) {
    docChildren.push(createSectionHeader("Risk Management"));
    const riskRows = proposal.risks.map((r) => [
      r.risk || "N/A",
      r.likelihood || "N/A",
      r.impact || "N/A",
      r.mitigation || "N/A",
    ]);
    docChildren.push(
      createTable(["Risk", "Likelihood", "Impact", "Mitigation"], riskRows)
    );
  }

  // ============================================================================
  // BUDGET (Redesigned with Summary Table + Detailed Breakdown)
  // ============================================================================
  if (proposal.budget && proposal.budget.length > 0) {
    // Budget section (no page break - let it flow naturally)
    docChildren.push(createSectionHeader("6. Budget Summary"));

    // Calculate totals for each category
    let grandTotal = 0;
    const categoryTotals = proposal.budget.map((item) => {
      let categoryTotal = 0;
      if (item.breakdown && item.breakdown.length > 0) {
        categoryTotal = item.breakdown.reduce(
          (sum, subItem) => sum + ((subItem.quantity || 0) * (subItem.unitCost || 0)),
          0
        );
      } else {
        categoryTotal = item.cost || 0;
      }
      grandTotal += categoryTotal;
      return {
        category: item.item || "Budget Category",
        total: categoryTotal,
        description: item.description,
        breakdown: item.breakdown
      };
    });

    // ============================================================================
    // SUMMARY TABLE - All categories with totals
    // ============================================================================
    const summaryRows = categoryTotals.map((cat) => [
      cat.category,
      `€${cat.total.toLocaleString()}`,
    ]);

    docChildren.push(
      createTable(
        ["Budget Category", "Total Amount"],
        summaryRows
      )
    );

    // Grand total row (reduced spacing to keep with table)
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `TOTAL PROJECT BUDGET: €${grandTotal.toLocaleString()}`,
            bold: true,
            size: HEADER_SIZE,
            font: FONT,
            color: "1F4788",
          }),
        ],
        spacing: { before: 150, after: 300 },
        alignment: AlignmentType.RIGHT,
        keepNext: true,
      })
    );

    // ============================================================================
    // DETAILED BREAKDOWN - Category by category
    // ============================================================================
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Detailed Budget Breakdown",
            bold: true,
            size: SUBHEADER_SIZE,
            font: FONT,
            color: "2E5C8A",
          }),
        ],
        spacing: { before: 400, after: 200 },
      })
    );

    categoryTotals.forEach((cat, idx) => {
      // Category header
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${idx + 1}. ${cat.category}`,
              bold: true,
              size: BODY_SIZE,
              font: FONT,
              color: "1F4788",
            }),
          ],
          spacing: { before: 300, after: 100 },
        })
      );

      // Description if available
      if (cat.description) {
        docChildren.push(createParagraph(cat.description));
      }

      // Detailed breakdown table if available
      if (cat.breakdown && cat.breakdown.length > 0) {
        const breakdownRows = cat.breakdown.map((subItem) => {
          const itemTotal = (subItem.quantity || 0) * (subItem.unitCost || 0);
          return [
            subItem.subItem || "N/A",
            subItem.quantity?.toString() || "0",
            `€${subItem.unitCost?.toLocaleString() || "0"}`,
            `€${itemTotal.toLocaleString()}`,
          ];
        });

        docChildren.push(
          createTable(
            ["Item", "Quantity", "Unit Cost", "Total"],
            breakdownRows
          )
        );

        // Category subtotal
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Category Total: €${cat.total.toLocaleString()}`,
                bold: true,
                size: BODY_SIZE,
                font: FONT,
              }),
            ],
            spacing: { before: 100, after: 200 },
            alignment: AlignmentType.RIGHT,
          })
        );
      } else {
        // Simple cost display if no breakdown
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Amount: €${cat.total.toLocaleString()}`,
                size: BODY_SIZE,
                font: FONT,
              }),
            ],
            spacing: { before: 50, after: 150 },
          })
        );
      }
    });
  }

  // ============================================================================
  // TIMELINE
  // ============================================================================
  if (proposal.timeline && proposal.timeline.length > 0) {
    docChildren.push(createSectionHeader("Timeline"));
    proposal.timeline.forEach((phase) => {
      // Check if phase name already contains month information
      const hasMonthInfo = /\(Months?\s+\d+/i.test(phase.phase);
      const phaseTitle = hasMonthInfo
        ? phase.phase
        : `${phase.phase} (Month ${phase.startMonth}-${phase.endMonth})`;

      docChildren.push(createSubHeader(phaseTitle));

      if (phase.activities && phase.activities.length > 0) {
        phase.activities.forEach((activity) => {
          docChildren.push(createParagraph(`  • ${activity}`));
        });
      }
    });
  }

  // ============================================================================
  // CREATE DOCUMENT
  // ============================================================================
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: docChildren,
      },
    ],
  });

  // ============================================================================
  // PACK TO BLOB
  // ============================================================================
  const blob = await Packer.toBlob(doc);

  const fileName = `${proposal.title?.replace(/[^a-z0-9]/gi, "_") || "proposal"}_${Date.now()}.docx`;

  return {
    blob: new Blob([blob], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }),
    fileName,
  };
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

/**
 * Main export function - generates and downloads DOCX
 * Uses file-saver library for reliable cross-browser downloads
 */
export async function exportToDocx(proposal: FullProposal): Promise<void> {
  console.log("=== STARTING DOCX EXPORT ===");
  console.log("Proposal title:", proposal.title);

  try {
    console.log("Generating DOCX document...");
    const { blob, fileName } = await generateDocx(proposal);
    console.log(`DOCX generated: ${fileName}, size: ${blob.size} bytes, type: ${blob.type}`);

    console.log("Calling saveAs to trigger download...");
    saveAs(blob, fileName);
    console.log("saveAs called successfully!");

    // Note: We don't show an alert here because saveAs handles the download UI

  } catch (error) {
    console.error("=== EXPORT FAILED ===");
    console.error("Error details:", error);
    alert(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}