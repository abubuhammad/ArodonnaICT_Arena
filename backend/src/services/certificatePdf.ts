import PDFDocument from "pdfkit";

export interface CertificatePdfData {
  learnerName: string;
  courseTitle: string;
  instructorName: string;
  serial: string;
  issuedAt: Date;
  template?: { title?: string; subtitle?: string; accentColor?: string; signatureLabel?: string } | null;
}

export const certificatePdfBuffer = (data: CertificatePdfData): Promise<Buffer> => new Promise((resolve, reject) => {
  const document = new PDFDocument({ size: "A4", layout: "landscape", margin: 0 });
  const chunks: Buffer[] = [];
  document.on("data", (chunk: Buffer) => chunks.push(chunk));
  document.on("end", () => resolve(Buffer.concat(chunks)));
  document.on("error", reject);

  const template = data.template || {};
  const accent = template.accentColor || "#1d4ed8";
  document.rect(0, 0, 841.89, 595.28).fill("#f8fafc");
  document.rect(28, 28, 785.89, 539.28).lineWidth(3).stroke(accent);
  document.rect(42, 42, 757.89, 511.28).lineWidth(1).stroke("#cbd5e1");
  document.fillColor(accent).fontSize(16).font("Helvetica-Bold").text("ARODONNA ICT ARENA", 0, 92, { align: "center" });
  document.fillColor("#0f172a").fontSize(38).font("Helvetica-Bold").text(template.title || "Certificate of Completion", 70, 145, { align: "center", width: 701.89 });
  document.fillColor("#475569").fontSize(16).font("Helvetica").text(template.subtitle || "This certificate is proudly presented to", 70, 215, { align: "center", width: 701.89 });
  document.fillColor("#0f172a").fontSize(32).font("Helvetica-Bold").text(data.learnerName, 70, 255, { align: "center", width: 701.89 });
  document.moveTo(220, 300).lineTo(622, 300).stroke("#cbd5e1");
  document.fillColor("#475569").fontSize(15).font("Helvetica").text("for successfully completing", 70, 325, { align: "center", width: 701.89 });
  document.fillColor(accent).fontSize(24).font("Helvetica-Bold").text(data.courseTitle, 70, 355, { align: "center", width: 701.89 });
  document.fillColor("#475569").fontSize(12).font("Helvetica").text(`Instructor: ${data.instructorName}`, 90, 475);
  document.text(`${template.signatureLabel || "Issued"}: ${data.issuedAt.toLocaleDateString()}`, 90, 495);
  document.text(`Certificate ID: ${data.serial}`, 0, 495, { align: "right", width: 751.89 });
  document.end();
});