import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { FullProposal } from '../types/proposal';

export async function exportToDocx(proposal: FullProposal) {
  const PRIMARY_COLOR = "4472C4";

  // Helper to create basic paragraphs
  const createPara = (text: string) => new Paragraph({ text });
  const createHeading = (text: string, level: HeadingLevel) => new Paragraph({
      text,
      heading: level,
      spacing: { before: 200, after: 100 }
  });

  // Simple HTML to text/paragraph converter (naive implementation for demo)
  // In a real app, you'd use 'html-to-docx' or parse properly
  const convertHtml = (html: string) => {
      const tmp = document.createElement("DIV");
      tmp.innerHTML = html;
      return [new Paragraph({ text: tmp.textContent || "" })];
  };

  const sections = [
    { title: 'Executive Summary', content: proposal.summary },
    { title: 'Relevance', content: proposal.relevance },
    { title: 'Impact', content: proposal.impact },
    { title: 'Methodology', content: proposal.methods },
    { title: 'Work Plan', content: proposal.workPlan }
  ];

  const children: any[] = [
    new Paragraph({
        text: proposal.title,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
    }),
    new Paragraph({
        text: `Generated on ${new Date().toLocaleDateString()}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 800 }
    })
  ];

  sections.forEach(s => {
      children.push(createHeading(s.title, HeadingLevel.HEADING_1));
      children.push(...convertHtml(s.content));
  });

  // Budget Table
  children.push(createHeading("Budget", HeadingLevel.HEADING_1));
  const budgetRows = proposal.budget.map(item => 
    new TableRow({
        children: [
            new TableCell({ children: [new Paragraph(item.item)] }),
            new TableCell({ children: [new Paragraph(`€${item.cost}`)] }),
            new TableCell({ children: [new Paragraph(item.description)] }),
        ]
    })
  );

  const budgetTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
          new TableRow({
              children: [
                  new TableCell({ children: [new Paragraph({ text: "Item", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Cost", bold: true })] }),
                  new TableCell({ children: [new Paragraph({ text: "Description", bold: true })] }),
              ]
          }),
          ...budgetRows
      ]
  });
  children.push(budgetTable);

  const doc = new Document({
    sections: [{
      properties: {},
      children: children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${proposal.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`;
  link.click();
}