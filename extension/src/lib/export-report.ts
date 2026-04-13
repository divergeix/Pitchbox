// Generates a formatted HTML report and opens it in a new tab for PDF export

export function exportScanReport(scanResult: any, signals: any[], angles: any[]) {
  const company = scanResult.company;
  const detections = scanResult.detections || [];

  // Group detections by category
  const grouped: Record<string, any[]> = {};
  for (const d of detections) {
    const cat = d.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(d);
  }

  const ruleAngles = angles.filter((a: any) => !a.aiGenerated);
  const aiAngles = angles.filter((a: any) => a.aiGenerated);

  const socialLinks = company.socialLinks || {};
  const socialHtml = Object.entries(socialLinks)
    .filter(([_, v]) => v)
    .map(([k, v]) => `<a href="${v}" target="_blank" style="color:#4f46e5;text-decoration:none;margin-right:12px;">${k.charAt(0).toUpperCase() + k.slice(1)}</a>`)
    .join('');

  const emailsHtml = (company.emails || []).map((e: string) => `<span style="color:#4f46e5;">${e}</span>`).join(' &nbsp;|&nbsp; ');
  const phonesHtml = (company.phones || []).map((p: string) => `<span>${p}</span>`).join(' &nbsp;|&nbsp; ');

  const html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>PitchBox Report - ${company.name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',system-ui,sans-serif; color:#1e293b; background:#fff; padding:40px; max-width:800px; margin:0 auto; line-height:1.6; }
  @media print { body { padding:20px; } .no-print { display:none; } }

  .header { border-bottom:3px solid #4f46e5; padding-bottom:20px; margin-bottom:24px; }
  .header h1 { font-size:28px; font-weight:700; color:#111827; margin-bottom:4px; }
  .header .domain { font-size:14px; color:#6b7280; }
  .header .meta { display:flex; gap:12px; margin-top:8px; flex-wrap:wrap; }
  .header .tag { background:#eef2ff; color:#4338ca; padding:2px 10px; border-radius:12px; font-size:12px; font-weight:500; }

  .pitchbox-badge { float:right; background:#4f46e5; color:#fff; padding:4px 12px; border-radius:8px; font-size:11px; font-weight:600; letter-spacing:0.5px; }

  h2 { font-size:18px; font-weight:600; color:#111827; margin:28px 0 12px; padding-bottom:6px; border-bottom:1px solid #e5e7eb; }
  h3 { font-size:14px; font-weight:600; color:#374151; margin:16px 0 8px; }

  .section { margin-bottom:24px; }

  .description { font-size:13px; color:#4b5563; margin:8px 0 16px; font-style:italic; }

  .contact-row { display:flex; gap:24px; flex-wrap:wrap; margin:8px 0; font-size:13px; }
  .contact-row .label { font-weight:600; color:#374151; min-width:70px; }

  .tech-grid { display:flex; flex-wrap:wrap; gap:6px; margin:8px 0; }
  .tech-badge { background:#f3f4f6; border:1px solid #d1d5db; border-radius:6px; padding:3px 10px; font-size:12px; color:#374151; font-weight:500; }
  .tech-category { font-size:11px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px; margin:12px 0 6px; }

  .signal-card { background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:12px 16px; margin:8px 0; }
  .signal-title { font-size:13px; font-weight:600; color:#111827; }
  .signal-type { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; padding:2px 8px; border-radius:10px; float:right; }
  .signal-type.commercial { background:#dbeafe; color:#1e40af; }
  .signal-type.operational { background:#fef9c3; color:#854d0e; }
  .signal-type.gap { background:#fee2e2; color:#991b1b; }
  .signal-desc { font-size:12px; color:#4b5563; margin-top:4px; }

  .angle-card { border:1px solid #e5e7eb; border-radius:8px; padding:14px 16px; margin:10px 0; page-break-inside:avoid; }
  .angle-card.ai { border-left:3px solid #7c3aed; background:#faf5ff; }
  .angle-header { display:flex; justify-content:space-between; align-items:center; }
  .angle-title { font-size:14px; font-weight:600; color:#111827; }
  .angle-conf { font-size:11px; font-weight:600; padding:2px 8px; border-radius:10px; }
  .angle-conf.strong { background:#dcfce7; color:#166534; }
  .angle-conf.medium { background:#fef9c3; color:#854d0e; }
  .angle-conf.weak { background:#fee2e2; color:#991b1b; }
  .angle-desc { font-size:12px; color:#4b5563; margin:6px 0; }
  .angle-opener { font-size:12px; color:#4f46e5; font-style:italic; margin-top:6px; }
  .ai-badge { background:#7c3aed; color:#fff; font-size:9px; font-weight:700; padding:1px 6px; border-radius:8px; margin-left:6px; vertical-align:middle; }

  .footer { margin-top:40px; padding-top:16px; border-top:1px solid #e5e7eb; font-size:11px; color:#9ca3af; text-align:center; }

  .btn-row { display:flex; gap:10px; margin:20px 0; }
  .btn { padding:8px 20px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; border:none; }
  .btn-print { background:#4f46e5; color:#fff; display:none; }
  .btn-copy { background:#f3f4f6; color:#374151; border:1px solid #d1d5db; display:none; }
</style>
</head><body>

<div class="no-print btn-row">
  <p style="font-size:13px;color:#6b7280;margin:16px 0;">Use <strong>Ctrl+P</strong> (or <strong>Cmd+P</strong> on Mac) to save as PDF. Use <strong>Copy Report</strong> button in PitchBox sidebar to copy text.</p>
</div>

<div class="header">
  <span class="pitchbox-badge">PITCHBOX REPORT</span>
  <h1>${company.name}</h1>
  <div class="domain">${company.domain} &nbsp;|&nbsp; Scanned ${new Date(scanResult.timestamp).toLocaleDateString()}</div>
  <div class="meta">
    ${company.type && company.type !== 'unknown' ? `<span class="tag">${company.type}${company.aiClassified ? ' (AI)' : ''}</span>` : ''}
    ${company.industry && company.industry !== 'Unknown' ? `<span class="tag">${company.industry}</span>` : ''}
    ${detections.length > 0 ? `<span class="tag">${detections.length} technologies detected</span>` : ''}
  </div>
</div>

${company.description ? `<p class="description">${company.description}</p>` : ''}

<div class="section">
  <h2>Company Overview</h2>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;">
    <div><strong>Domain:</strong> ${company.domain}</div>
    ${company.type !== 'unknown' ? `<div><strong>Type:</strong> ${company.type}</div>` : ''}
    ${company.industry !== 'Unknown' ? `<div><strong>Industry:</strong> ${company.industry}</div>` : ''}
    ${''/* copyright year removed - unreliable */}
    ${company.hasCareerPage ? '<div><strong>Careers:</strong> Active hiring</div>' : ''}
    ${company.hasBlog ? '<div><strong>Blog:</strong> Active</div>' : ''}
    ${company.hasPricingPage ? '<div><strong>Pricing:</strong> Public</div>' : ''}
    ${company.hasFreeTrial ? '<div><strong>Trial:</strong> Free trial available</div>' : ''}
    ${company.hasDemoPage ? '<div><strong>Demo:</strong> Booking available</div>' : ''}
    ${company.hasCaseStudies ? '<div><strong>Case Studies:</strong> Published</div>' : ''}
    ${company.hasApiDocs ? '<div><strong>API Docs:</strong> Available</div>' : ''}
    ${company.hasIntegrationsPage ? '<div><strong>Integrations:</strong> Marketplace</div>' : ''}
  </div>

  ${socialHtml ? `<div style="margin-top:12px;"><strong style="font-size:12px;">Social:</strong> ${socialHtml}</div>` : ''}
  ${emailsHtml ? `<div style="margin-top:6px;font-size:13px;"><strong>Email:</strong> ${emailsHtml}</div>` : ''}
  ${phonesHtml ? `<div style="margin-top:6px;font-size:13px;"><strong>Phone:</strong> ${phonesHtml}</div>` : ''}
  ${company.location ? `<div style="margin-top:6px;font-size:13px;"><strong>Location:</strong> ${company.location}</div>` : ''}
</div>

<div class="section">
  <h2>Tech Stack (${detections.length})</h2>
  ${Object.entries(grouped).map(([cat, items]) => `
    <div class="tech-category">${cat}</div>
    <div class="tech-grid">
      ${(items as any[]).map((d: any) => `<span class="tech-badge">${d.name}</span>`).join('')}
    </div>
  `).join('')}
</div>

<div class="section">
  <h2>Buying Signals (${signals.length})</h2>
  ${signals.map((s: any) => `
    <div class="signal-card">
      <span class="signal-type ${s.type}">${s.type}</span>
      <div class="signal-title">${s.title}</div>
      <div class="signal-desc">${s.description}</div>
    </div>
  `).join('')}
</div>

<div class="section">
  <h2>Outreach Angles (${angles.length})</h2>

  ${ruleAngles.length > 0 ? `<h3>Strategy-Based Angles (${ruleAngles.length})</h3>` : ''}
  ${ruleAngles.map((a: any) => `
    <div class="angle-card">
      <div class="angle-header">
        <span class="angle-title">${a.title}</span>
        <span class="angle-conf ${a.strength}">${a.confidence}%</span>
      </div>
      <div class="angle-desc">${a.description}</div>
      <div class="angle-opener">"${a.suggestedOpener}"</div>
    </div>
  `).join('')}

  ${aiAngles.length > 0 ? `<h3>AI-Generated Custom Angles (${aiAngles.length})</h3>` : ''}
  ${aiAngles.map((a: any) => `
    <div class="angle-card ai">
      <div class="angle-header">
        <span class="angle-title">${a.title} <span class="ai-badge">AI</span></span>
        <span class="angle-conf ${a.strength}">${a.confidence}%</span>
      </div>
      <div class="angle-desc">${a.description}</div>
      <div class="angle-opener">"${a.suggestedOpener}"</div>
    </div>
  `).join('')}
</div>

${(company.teamMembers || []).length > 0 ? `
<div class="section">
  <h2>Team Members (${company.teamMembers.length})</h2>
  <table style="width:100%;border-collapse:collapse;font-size:13px;">
    <tr style="background:#f3f4f6;"><th style="text-align:left;padding:6px 10px;">Name</th><th style="text-align:left;padding:6px 10px;">Role</th></tr>
    ${company.teamMembers.map((m: any) => `<tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:6px 10px;">${m.name}</td><td style="padding:6px 10px;color:#6b7280;">${m.role || ''}</td></tr>`).join('')}
  </table>
</div>
` : ''}

${(company.customerLogos || []).length > 0 ? `
<div class="section">
  <h2>Customers / Partners (${company.customerLogos.length})</h2>
  <div class="tech-grid">
    ${company.customerLogos.map((l: string) => `<span class="tech-badge">${l}</span>`).join('')}
  </div>
</div>
` : ''}

<div class="footer">
  Generated by PitchBox (DivergeiX) &nbsp;|&nbsp; ${new Date().toLocaleDateString()} &nbsp;|&nbsp; ${company.domain}
</div>

</body></html>`;

  // Open in new window, write content, then trigger print
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(html);
    newWindow.document.close();
    // Auto-trigger print dialog after content renders
    setTimeout(() => {
      try { newWindow.print(); } catch {}
    }, 500);
  }
}

// Copy plain text report to clipboard (works directly from sidepanel)
export function copyReportToClipboard(scanResult: any, signals: any[], angles: any[]): string {
  const company = scanResult.company;
  const detections = scanResult.detections || [];
  const ruleAngles = angles.filter((a: any) => !a.aiGenerated);
  const aiAngles = angles.filter((a: any) => a.aiGenerated);

  let text = `PITCHBOX REPORT - ${company.name}\n`;
  text += `${'='.repeat(50)}\n`;
  text += `Domain: ${company.domain}\n`;
  if (company.type !== 'unknown') text += `Type: ${company.type}${company.aiClassified ? ' (AI)' : ''}\n`;
  if (company.industry !== 'Unknown') text += `Industry: ${company.industry}\n`;
  text += `Scanned: ${new Date(scanResult.timestamp).toLocaleDateString()}\n`;
  if (company.description) text += `\n${company.description}\n`;

  // Business context
  const ctx = [];
  if (company.hasCareerPage) ctx.push('Active hiring');
  if (company.hasBlog) ctx.push('Active blog');
  if (company.hasPricingPage) ctx.push('Public pricing');
  if (company.hasFreeTrial) ctx.push('Free trial');
  if (company.hasDemoPage) ctx.push('Demo booking');
  if (company.hasCaseStudies) ctx.push('Case studies');
  if (company.hasApiDocs) ctx.push('API docs');
  if (company.hasIntegrationsPage) ctx.push('Integrations');
  if (ctx.length > 0) text += `\nBusiness: ${ctx.join(' | ')}\n`;

  // Contact
  const socialLinks = company.socialLinks || {};
  const socials = Object.entries(socialLinks).filter(([_, v]) => v).map(([k]) => k);
  if (socials.length > 0) text += `Social: ${socials.join(', ')}\n`;
  if ((company.emails || []).length > 0) text += `Email: ${company.emails.join(', ')}\n`;
  if ((company.phones || []).length > 0) text += `Phone: ${company.phones.join(', ')}\n`;

  // Tech stack
  text += `\nTECH STACK (${detections.length})\n${'-'.repeat(30)}\n`;
  for (const d of detections) text += `  ${d.name} (${d.category})\n`;

  // Signals
  text += `\nBUYING SIGNALS (${signals.length})\n${'-'.repeat(30)}\n`;
  for (const s of signals) text += `  [${s.type.toUpperCase()}] ${s.title}\n  ${s.description}\n\n`;

  // Angles
  text += `OUTREACH ANGLES (${angles.length})\n${'-'.repeat(30)}\n`;
  for (const a of ruleAngles) {
    text += `\n  ${a.title} (${a.confidence}%)\n`;
    text += `  ${a.description}\n`;
    text += `  Opener: "${a.suggestedOpener}"\n`;
  }
  if (aiAngles.length > 0) {
    text += `\n  --- AI-Generated Angles ---\n`;
    for (const a of aiAngles) {
      text += `\n  [AI] ${a.title} (${a.confidence}%)\n`;
      text += `  ${a.description}\n`;
      text += `  Opener: "${a.suggestedOpener}"\n`;
    }
  }

  text += `\n${'='.repeat(50)}\nGenerated by PitchBox (DivergeiX) | ${new Date().toLocaleDateString()}\n`;

  navigator.clipboard.writeText(text);
  return text;
}
