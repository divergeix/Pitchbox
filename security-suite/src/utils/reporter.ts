// ============================================================================
// Security Suite - Report Generator
// ============================================================================

import * as fs from 'fs';
import * as path from 'path';
import { ScanResult, SecurityFinding, Severity } from '../types';

const SEVERITY_ICONS: Record<Severity, string> = {
  critical: '[!!!]',
  high: '[!!]',
  medium: '[!]',
  low: '[~]',
  info: '[i]',
};

export class Reporter {
  private results: ScanResult[] = [];

  addResult(result: ScanResult): void {
    this.results.push(result);
  }

  generateTextReport(): string {
    const lines: string[] = [];
    const now = new Date();

    lines.push('='.repeat(70));
    lines.push('  SECURITY SCAN REPORT');
    lines.push(`  Generated: ${now.toISOString()}`);
    lines.push('='.repeat(70));
    lines.push('');

    // Executive Summary
    const totalFindings = this.results.reduce((s, r) => s + r.findings.length, 0);
    const criticalCount = this.countBySeverity('critical');
    const highCount = this.countBySeverity('high');
    const mediumCount = this.countBySeverity('medium');
    const lowCount = this.countBySeverity('low');
    const infoCount = this.countBySeverity('info');

    lines.push('  EXECUTIVE SUMMARY');
    lines.push('-'.repeat(70));
    lines.push(`  Total Modules Run:    ${this.results.length}`);
    lines.push(`  Total Findings:       ${totalFindings}`);
    lines.push(`  Critical:             ${criticalCount}`);
    lines.push(`  High:                 ${highCount}`);
    lines.push(`  Medium:               ${mediumCount}`);
    lines.push(`  Low:                  ${lowCount}`);
    lines.push(`  Informational:        ${infoCount}`);
    lines.push('');

    // Overall Risk Assessment
    let overallRisk = 'SAFE';
    if (criticalCount > 0) overallRisk = 'CRITICAL';
    else if (highCount > 0) overallRisk = 'HIGH';
    else if (mediumCount > 0) overallRisk = 'MEDIUM';
    else if (lowCount > 0) overallRisk = 'LOW';

    lines.push(`  OVERALL RISK LEVEL:   ${overallRisk}`);
    lines.push('');

    // Module Details
    for (const result of this.results) {
      lines.push('='.repeat(70));
      lines.push(`  MODULE: ${result.module.toUpperCase()}`);
      lines.push(`  Target: ${result.target}`);
      lines.push(`  Duration: ${result.duration}ms`);
      lines.push(`  Findings: ${result.findings.length}`);
      lines.push('-'.repeat(70));

      if (result.findings.length === 0) {
        lines.push('  No issues found.');
      }

      for (const finding of result.findings) {
        lines.push('');
        lines.push(`  ${SEVERITY_ICONS[finding.severity]} ${finding.title}`);
        lines.push(`     Severity:       ${finding.severity.toUpperCase()}`);
        lines.push(`     Description:    ${finding.description}`);
        lines.push(`     Recommendation: ${finding.recommendation}`);
      }
      lines.push('');
    }

    lines.push('='.repeat(70));
    lines.push('  END OF REPORT');
    lines.push('='.repeat(70));

    return lines.join('\n');
  }

  generateJSONReport(): string {
    return JSON.stringify({
      reportDate: new Date().toISOString(),
      summary: {
        totalModules: this.results.length,
        totalFindings: this.results.reduce((s, r) => s + r.findings.length, 0),
        critical: this.countBySeverity('critical'),
        high: this.countBySeverity('high'),
        medium: this.countBySeverity('medium'),
        low: this.countBySeverity('low'),
        info: this.countBySeverity('info'),
      },
      results: this.results,
    }, null, 2);
  }

  generateHTMLReport(): string {
    const totalFindings = this.results.reduce((s, r) => s + r.findings.length, 0);

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Security Scan Report</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #0a0e17; color: #e0e6ed; }
  .header { text-align: center; padding: 30px; border-bottom: 2px solid #1a2332; }
  .header h1 { color: #00d4ff; margin: 0; font-size: 28px; }
  .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 25px 0; }
  .stat { background: #111827; border-radius: 10px; padding: 20px; text-align: center; border: 1px solid #1f2937; }
  .stat .number { font-size: 36px; font-weight: bold; }
  .stat .label { font-size: 12px; text-transform: uppercase; color: #6b7280; margin-top: 5px; }
  .critical .number { color: #ef4444; }
  .high .number { color: #f97316; }
  .medium .number { color: #eab308; }
  .low .number { color: #22d3ee; }
  .info .number { color: #6b7280; }
  .module { background: #111827; border-radius: 10px; margin: 15px 0; padding: 20px; border: 1px solid #1f2937; }
  .module h2 { color: #00d4ff; margin-top: 0; }
  .finding { padding: 12px; margin: 8px 0; border-radius: 6px; border-left: 4px solid; }
  .finding.critical { background: #1a0505; border-color: #ef4444; }
  .finding.high { background: #1a0f05; border-color: #f97316; }
  .finding.medium { background: #1a1805; border-color: #eab308; }
  .finding.low { background: #051a1a; border-color: #22d3ee; }
  .finding.info { background: #0a0f1a; border-color: #6b7280; }
  .finding h3 { margin: 0 0 5px 0; font-size: 14px; }
  .finding p { margin: 3px 0; font-size: 13px; color: #9ca3af; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
</style>
</head>
<body>
<div class="header">
  <h1>Security Scan Report</h1>
  <p>Generated: ${new Date().toISOString()}</p>
</div>
<div class="summary">
  <div class="stat"><div class="number">${this.results.length}</div><div class="label">Modules</div></div>
  <div class="stat"><div class="number">${totalFindings}</div><div class="label">Findings</div></div>
  <div class="stat critical"><div class="number">${this.countBySeverity('critical')}</div><div class="label">Critical</div></div>
  <div class="stat high"><div class="number">${this.countBySeverity('high')}</div><div class="label">High</div></div>
  <div class="stat medium"><div class="number">${this.countBySeverity('medium')}</div><div class="label">Medium</div></div>
  <div class="stat low"><div class="number">${this.countBySeverity('low')}</div><div class="label">Low</div></div>
</div>
${this.results.map(r => `
<div class="module">
  <h2>${r.module}</h2>
  <p>Target: ${r.target} | Duration: ${r.duration}ms | Findings: ${r.findings.length}</p>
  ${r.findings.length === 0 ? '<p style="color:#22c55e;">No issues found.</p>' : ''}
  ${r.findings.map(f => `
  <div class="finding ${f.severity}">
    <h3>${f.title}</h3>
    <p><strong>Severity:</strong> ${f.severity.toUpperCase()}</p>
    <p>${f.description}</p>
    <p><strong>Recommendation:</strong> ${f.recommendation}</p>
  </div>`).join('')}
</div>`).join('')}
</body>
</html>`;
  }

  saveReport(filePath: string, format: 'text' | 'json' | 'html' = 'text'): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let content: string;
    switch (format) {
      case 'json': content = this.generateJSONReport(); break;
      case 'html': content = this.generateHTMLReport(); break;
      default: content = this.generateTextReport(); break;
    }

    fs.writeFileSync(filePath, content, 'utf-8');
  }

  private countBySeverity(severity: Severity): number {
    return this.results.reduce(
      (sum, r) => sum + r.findings.filter(f => f.severity === severity).length,
      0
    );
  }
}
