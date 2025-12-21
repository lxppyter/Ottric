import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');

@Injectable()
export class ReportService {
  async generateReport(auditPack: any): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve(Buffer.concat(buffers));
      });

      // --- Title Page ---
      doc.fontSize(25).text('Security Audit Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(16).text(`Product: ${auditPack.product.name} (v${auditPack.product.version})`, { align: 'center' });
      doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center', color: 'grey' });
      doc.moveDown(3);

      // --- Executive Summary (Scorecard) ---
      doc.fontSize(18).text('Executive Summary', { underline: true });
      doc.moveDown();
      
      const summary = auditPack.summary;
      doc.fontSize(12).fillColor('black');
      doc.text(`Total Components: ${summary.totalComponents}`);
      doc.text(`Total Vulnerabilities: ${summary.totalVulnerabilities}`);
      doc.moveDown(0.5);
      
      doc.fillColor('red').text(`Critical/Affected: ${summary.affected}`);
      doc.fillColor('green').text(`Fixed: ${summary.fixed}`);
      doc.fillColor('orange').text(`Under Investigation: ${summary.underInvestigation}`);
      doc.fillColor('blue').text(`Clean/Not Affected: ${summary.notAffected}`);
      
      doc.moveDown(2);

      // --- CRITICAL VULNERABILITIES ---
      doc.fillColor('black').fontSize(18).text('Critical Vulnerabilities (Top 10)', { underline: true });
      doc.moveDown();

      const criticals = auditPack.vex.filter((v: any) => v.vulnerability.severity === 'CRITICAL').slice(0, 10);

      if (criticals.length === 0) {
          doc.fontSize(12).text('No critical vulnerabilities found.');
      } else {
          criticals.forEach((v: any) => {
              doc.fontSize(12).font('Helvetica-Bold').text(`${v.vulnerability.id} (${v.status})`);
              doc.fontSize(10).font('Helvetica').text(`Component: ${v.componentPurl}`);
              doc.text(`Justification: ${v.justification || 'N/A'}`);
              doc.moveDown(0.5);
          });
      }

      doc.end();
    });
  }
}
