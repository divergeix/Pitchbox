// ============================================================================
// Security Suite - Dashboard Application
// ============================================================================

const API_BASE = window.location.origin + '/api';
let ws = null;

// --- Navigation ---
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    item.classList.add('active');
    document.getElementById('page-' + item.dataset.page).classList.add('active');
  });
});

// --- WebSocket ---
function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${protocol}//${window.location.host}`);

  ws.onopen = () => {
    document.querySelector('.status-dot').classList.add('connected');
    document.getElementById('ws-status-text').textContent = 'Connected';
  };

  ws.onclose = () => {
    document.querySelector('.status-dot').classList.remove('connected');
    document.getElementById('ws-status-text').textContent = 'Disconnected';
    setTimeout(connectWebSocket, 3000);
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    switch (message.type) {
      case 'stats':
        updateDashboard(message.data);
        break;
      case 'alert':
        addAlertToUI(message.data);
        break;
      case 'scan_result':
        // Results auto-refresh on next stats update
        break;
    }
  };
}

// --- Dashboard Updates ---
function updateDashboard(stats) {
  document.getElementById('stat-scans').textContent = stats.totalScans;
  document.getElementById('stat-findings').textContent = stats.totalFindings;
  document.getElementById('stat-critical').textContent = stats.criticalFindings;
  document.getElementById('stat-alerts').textContent = stats.activeAlerts;

  // System status
  const statusBadge = document.getElementById('system-status');
  statusBadge.textContent = stats.systemStatus.charAt(0).toUpperCase() + stats.systemStatus.slice(1);
  statusBadge.className = 'badge badge-' + stats.systemStatus;

  // Threat level
  const threatLevel = document.getElementById('threat-level');
  threatLevel.dataset.level = stats.threatLevel;

  // Module list
  const moduleList = document.getElementById('module-list');
  moduleList.innerHTML = stats.modules.map(m => `
    <div class="module-item">
      <span class="module-name">${m.name}</span>
      <div>
        ${m.findingsCount > 0 ? `<span style="font-size:11px;color:var(--text-muted);margin-right:8px;">${m.findingsCount} findings</span>` : ''}
        <span class="module-badge ${m.status}">${m.status}</span>
      </div>
    </div>
  `).join('');

  // Recent scans
  const recentScans = document.getElementById('recent-scans');
  if (stats.recentScans.length === 0) {
    recentScans.innerHTML = '<tr><td colspan="6" class="no-data">No scans yet. Run a scan to see results.</td></tr>';
  } else {
    recentScans.innerHTML = stats.recentScans.map(s => `
      <tr>
        <td>${s.module}</td>
        <td>${s.target}</td>
        <td>${s.summary.totalFindings}</td>
        <td><span class="badge badge-${s.summary.riskLevel}">${s.summary.riskLevel}</span></td>
        <td>${s.duration}ms</td>
        <td>${new Date(s.startTime).toLocaleTimeString()}</td>
      </tr>
    `).join('');
  }
}

function refreshStats() {
  fetch(API_BASE + '/stats')
    .then(r => r.json())
    .then(updateDashboard)
    .catch(console.error);
}

// --- Utility Functions ---
function showLoading(text) {
  document.getElementById('loading-text').textContent = text || 'Scanning...';
  document.getElementById('loading').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loading').style.display = 'none';
}

function renderFindings(findings) {
  if (findings.length === 0) return '<p style="color:var(--success);">No issues found!</p>';
  return findings.map(f => `
    <div class="finding ${f.severity}">
      <div class="finding-title"><span class="badge badge-${f.severity}">${f.severity}</span> ${f.title}</div>
      <div class="finding-desc">${f.description}</div>
      <div class="finding-rec">Recommendation: ${f.recommendation}</div>
    </div>
  `).join('');
}

function renderSummary(summary) {
  return `
    <div class="summary-box">
      <div class="summary-item"><div class="number" style="color:var(--danger)">${summary.critical}</div><div class="label">Critical</div></div>
      <div class="summary-item"><div class="number" style="color:var(--orange)">${summary.high}</div><div class="label">High</div></div>
      <div class="summary-item"><div class="number" style="color:var(--warning)">${summary.medium}</div><div class="label">Medium</div></div>
      <div class="summary-item"><div class="number" style="color:#22d3ee">${summary.low}</div><div class="label">Low</div></div>
      <div class="summary-item"><div class="number" style="color:var(--text-muted)">${summary.info}</div><div class="label">Info</div></div>
      <div class="summary-item"><div class="number"><span class="badge badge-${summary.riskLevel}">${summary.riskLevel}</span></div><div class="label">Risk Level</div></div>
    </div>
  `;
}

async function apiPost(endpoint, body) {
  const resp = await fetch(API_BASE + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return resp.json();
}

// --- Network Scanner ---
async function runNetworkScan() {
  const host = document.getElementById('net-host').value.trim();
  if (!host) return alert('Please enter a host');

  showLoading('Scanning ports...');
  try {
    const result = await apiPost('/scan/network', {
      host,
      ports: document.getElementById('net-ports').value || undefined,
      timeout: parseInt(document.getElementById('net-timeout').value) || 3000,
      concurrency: parseInt(document.getElementById('net-concurrency').value) || 50,
    });

    const openPorts = result.raw.ports.filter(p => p.state === 'open');
    const filteredPorts = result.raw.ports.filter(p => p.state === 'filtered');

    document.getElementById('net-results').style.display = 'block';
    document.getElementById('net-results-body').innerHTML = `
      ${renderSummary(result.summary)}
      <p style="margin-bottom:10px;"><strong>${openPorts.length}</strong> open, <strong>${filteredPorts.length}</strong> filtered, <strong>${result.raw.ports.length - openPorts.length - filteredPorts.length}</strong> closed</p>
      ${openPorts.length > 0 ? `
        <table class="data-table">
          <thead><tr><th>Port</th><th>State</th><th>Service</th><th>Banner</th></tr></thead>
          <tbody>${openPorts.map(p => `
            <tr>
              <td><strong>${p.port}</strong></td>
              <td class="port-${p.state}">${p.state}</td>
              <td>${p.service}</td>
              <td style="font-size:11px;color:var(--text-muted)">${p.banner || '-'}</td>
            </tr>
          `).join('')}</tbody>
        </table>
      ` : ''}
      <h3 style="margin:15px 0 10px;">Findings</h3>
      ${renderFindings(result.findings)}
    `;
  } catch (e) {
    alert('Scan failed: ' + e.message);
  }
  hideLoading();
}

// --- SSL Analyzer ---
async function runSSLScan() {
  const host = document.getElementById('ssl-host').value.trim();
  if (!host) return alert('Please enter a host');

  showLoading('Analyzing SSL/TLS...');
  try {
    const result = await apiPost('/scan/ssl', {
      host,
      port: parseInt(document.getElementById('ssl-port').value) || 443,
    });

    const cert = result.raw.certificate;
    document.getElementById('ssl-results').style.display = 'block';
    document.getElementById('ssl-results-body').innerHTML = `
      ${renderSummary(result.summary)}
      ${cert ? `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:15px;">
          <div class="summary-item">
            <div class="label">Protocol</div>
            <div style="font-size:16px;font-weight:600;color:var(--accent)">${result.raw.protocol}</div>
          </div>
          <div class="summary-item">
            <div class="label">Cipher</div>
            <div style="font-size:13px;font-weight:600;color:var(--text-primary)">${result.raw.cipher}</div>
          </div>
          <div class="summary-item">
            <div class="label">Expires In</div>
            <div style="font-size:16px;font-weight:600;color:${cert.daysUntilExpiry > 30 ? 'var(--success)' : 'var(--danger)'}">${cert.daysUntilExpiry} days</div>
          </div>
          <div class="summary-item">
            <div class="label">Key Size</div>
            <div style="font-size:16px;font-weight:600;color:${cert.keySize >= 2048 ? 'var(--success)' : 'var(--danger)'}">${cert.keySize} bits</div>
          </div>
        </div>
        <p><strong>Subject:</strong> ${JSON.stringify(cert.subject)}</p>
        <p><strong>Issuer:</strong> ${JSON.stringify(cert.issuer)}</p>
        <p><strong>Valid From:</strong> ${new Date(cert.validFrom).toLocaleDateString()}</p>
        <p><strong>Valid To:</strong> ${new Date(cert.validTo).toLocaleDateString()}</p>
        <p><strong>Self-Signed:</strong> ${cert.isSelfSigned ? 'Yes' : 'No'}</p>
        <p><strong>HSTS:</strong> ${result.raw.hasHSTS ? 'Yes' : 'No'}</p>
        <p><strong>Supported Protocols:</strong> ${result.raw.supportedProtocols.join(', ') || 'N/A'}</p>
      ` : '<p style="color:var(--danger)">Could not retrieve certificate information.</p>'}
      <h3 style="margin:15px 0 10px;">Findings</h3>
      ${renderFindings(result.findings)}
    `;
  } catch (e) {
    alert('Scan failed: ' + e.message);
  }
  hideLoading();
}

// --- Header Checker ---
async function runHeaderScan() {
  const url = document.getElementById('hdr-url').value.trim();
  if (!url) return alert('Please enter a URL');

  showLoading('Checking security headers...');
  try {
    const result = await apiPost('/scan/headers', { url });
    const grade = result.raw.grade;
    const gradeClass = grade.startsWith('A') ? 'A' : grade.startsWith('B') ? 'B' : grade.startsWith('C') ? 'C' : grade.startsWith('D') ? 'D' : 'F';

    document.getElementById('hdr-results').style.display = 'block';
    document.getElementById('hdr-results-body').innerHTML = `
      <div style="text-align:center;margin-bottom:20px;">
        <div class="grade-circle grade-${gradeClass}">${grade}</div>
        <p style="color:var(--text-muted);margin-top:5px;">Score: ${result.raw.score}/${result.raw.maxScore}</p>
      </div>
      ${renderSummary(result.summary)}
      <h3 style="margin:15px 0 10px;">Header Checks</h3>
      <table class="data-table">
        <thead><tr><th>Header</th><th>Status</th><th>Value</th></tr></thead>
        <tbody>${result.raw.checks.map(c => `
          <tr>
            <td><strong>${c.header}</strong></td>
            <td>${c.present ? '<span style="color:var(--success)">Present</span>' : `<span class="badge badge-${c.severity}">Missing</span>`}</td>
            <td style="font-size:12px;max-width:300px;overflow:hidden;text-overflow:ellipsis;">${c.value || '-'}</td>
          </tr>
        `).join('')}</tbody>
      </table>
      <h3 style="margin:15px 0 10px;">Findings</h3>
      ${renderFindings(result.findings)}
    `;
  } catch (e) {
    alert('Scan failed: ' + e.message);
  }
  hideLoading();
}

// --- DNS Checker ---
async function runDNSScan() {
  const domain = document.getElementById('dns-domain').value.trim();
  if (!domain) return alert('Please enter a domain');

  showLoading('Checking DNS security...');
  try {
    const result = await apiPost('/scan/dns', { domain });

    document.getElementById('dns-results').style.display = 'block';
    document.getElementById('dns-results-body').innerHTML = `
      ${renderSummary(result.summary)}
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:15px;">
        <div class="summary-item">
          <div class="label">SPF</div>
          <div style="font-size:18px;color:${result.raw.hasSPF ? 'var(--success)' : 'var(--danger)'}">${result.raw.hasSPF ? 'Yes' : 'No'}</div>
        </div>
        <div class="summary-item">
          <div class="label">DMARC</div>
          <div style="font-size:18px;color:${result.raw.hasDMARC ? 'var(--success)' : 'var(--danger)'}">${result.raw.hasDMARC ? 'Yes' : 'No'}</div>
        </div>
        <div class="summary-item">
          <div class="label">DKIM</div>
          <div style="font-size:18px;color:${result.raw.hasDKIM ? 'var(--success)' : 'var(--danger)'}">${result.raw.hasDKIM ? 'Yes' : 'No'}</div>
        </div>
      </div>
      <h3 style="margin:10px 0;">DNS Records (${result.raw.records.length})</h3>
      <table class="data-table">
        <thead><tr><th>Type</th><th>Name</th><th>Value</th></tr></thead>
        <tbody>${result.raw.records.map(r => `
          <tr>
            <td><span class="badge badge-info">${r.type}</span></td>
            <td>${r.name}</td>
            <td style="font-size:12px;word-break:break-all;">${r.value}</td>
          </tr>
        `).join('')}</tbody>
      </table>
      <h3 style="margin:15px 0 10px;">Findings</h3>
      ${renderFindings(result.findings)}
    `;
  } catch (e) {
    alert('Scan failed: ' + e.message);
  }
  hideLoading();
}

// --- Vulnerability Scanner ---
async function runVulnScan() {
  const target = document.getElementById('vuln-target').value.trim();
  if (!target) return alert('Please enter a target URL');

  showLoading('Scanning for vulnerabilities...');
  try {
    const result = await apiPost('/scan/vulnerabilities', { target });

    document.getElementById('vuln-results').style.display = 'block';
    document.getElementById('vuln-results-body').innerHTML = `
      ${renderSummary(result.summary)}
      <p style="margin-bottom:10px;">Checked categories: ${result.raw.checkedCategories.join(', ')}</p>
      ${renderFindings(result.findings)}
    `;
  } catch (e) {
    alert('Scan failed: ' + e.message);
  }
  hideLoading();
}

// --- Malware Scanner ---
async function runMalwareScan() {
  const scanPath = document.getElementById('mal-path').value.trim();
  if (!scanPath) return alert('Please enter a path');

  showLoading('Scanning files for malware...');
  try {
    const result = await apiPost('/scan/malware', {
      path: scanPath,
      recursive: document.getElementById('mal-recursive').checked,
      checkSignatures: document.getElementById('mal-signatures').checked,
    });

    document.getElementById('mal-results').style.display = 'block';
    document.getElementById('mal-results-body').innerHTML = `
      ${renderSummary(result.summary)}
      <div class="summary-box">
        <div class="summary-item"><div class="number">${result.raw.scannedFiles}</div><div class="label">Scanned</div></div>
        <div class="summary-item"><div class="number" style="color:var(--success)">${result.raw.cleanFiles}</div><div class="label">Clean</div></div>
        <div class="summary-item"><div class="number" style="color:var(--danger)">${result.raw.suspiciousFiles.length}</div><div class="label">Suspicious</div></div>
        <div class="summary-item"><div class="number" style="color:var(--text-muted)">${result.raw.skippedFiles}</div><div class="label">Skipped</div></div>
      </div>
      ${renderFindings(result.findings)}
    `;
  } catch (e) {
    alert('Scan failed: ' + e.message);
  }
  hideLoading();
}

// --- Password Security ---
function togglePassword() {
  const input = document.getElementById('pwd-input');
  const btn = input.nextElementSibling;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = 'Hide';
  } else {
    input.type = 'password';
    btn.textContent = 'Show';
  }
}

async function analyzePasswordUI() {
  const password = document.getElementById('pwd-input').value;
  if (!password) return alert('Please enter a password');

  const result = await apiPost('/password/analyze', { password });
  document.getElementById('pwd-results').innerHTML = `
    <div class="strength-bar"><div class="strength-fill ${result.strength}"></div></div>
    <p><strong>Strength:</strong> ${result.strength.replace('-', ' ')} (${result.score}/100)</p>
    <p><strong>Entropy:</strong> ${result.entropy} bits</p>
    <p><strong>Crack Time:</strong> ${result.crackTime}</p>
    <p><strong>Length:</strong> ${result.length} characters</p>
    <p style="margin-top:5px;">
      ${result.hasUppercase ? '&#10003;' : '&#10007;'} Uppercase
      ${result.hasLowercase ? '&#10003;' : '&#10007;'} Lowercase
      ${result.hasNumbers ? '&#10003;' : '&#10007;'} Numbers
      ${result.hasSymbols ? '&#10003;' : '&#10007;'} Symbols
    </p>
    ${result.suggestions.length > 0 ? `
      <h4 style="margin-top:10px;">Suggestions:</h4>
      <ul style="margin-left:20px;font-size:13px;color:var(--text-secondary);">
        ${result.suggestions.map(s => `<li>${s}</li>`).join('')}
      </ul>
    ` : ''}
  `;
}

async function checkBreachUI() {
  const password = document.getElementById('pwd-input').value;
  if (!password) return alert('Please enter a password');

  showLoading('Checking breach database...');
  try {
    const result = await apiPost('/password/breach-check', { password });
    const el = document.getElementById('pwd-results');
    if (result.breached) {
      el.innerHTML += `<div class="finding critical" style="margin-top:10px;">
        <div class="finding-title">Password found in data breach!</div>
        <div class="finding-desc">This password appeared ${result.occurrences.toLocaleString()} times in known data breaches.</div>
        <div class="finding-rec">Do NOT use this password. Change it immediately if in use.</div>
      </div>`;
    } else if (result.occurrences === -1) {
      el.innerHTML += `<div class="finding info" style="margin-top:10px;">
        <div class="finding-title">Could not check breach database</div>
        <div class="finding-desc">The breach check service is unavailable. Try again later.</div>
      </div>`;
    } else {
      el.innerHTML += `<div class="finding" style="margin-top:10px;border-color:var(--success);">
        <div class="finding-title" style="color:var(--success)">Password not found in breaches</div>
        <div class="finding-desc">This password was not found in known data breach databases.</div>
      </div>`;
    }
  } catch (e) {
    alert('Check failed: ' + e.message);
  }
  hideLoading();
}

async function generatePasswordUI() {
  const length = parseInt(document.getElementById('pwd-length').value);
  const resp = await fetch(API_BASE + '/password/generate?length=' + length);
  const result = await resp.json();
  document.getElementById('pwd-generated').innerHTML = `
    <div class="generated-password" onclick="navigator.clipboard.writeText('${result.password}').then(()=>alert('Copied!'))" title="Click to copy">
      ${result.password}
    </div>
    <p style="font-size:11px;color:var(--text-muted);margin-top:5px;">Click to copy. Strength: ${result.analysis.strength} (${result.analysis.score}/100)</p>
  `;
}

// --- Firewall ---
async function loadFirewallStatus() {
  const resp = await fetch(API_BASE + '/firewall/status');
  const status = await resp.json();
  document.getElementById('fw-status').innerHTML = `
    <div class="summary-box">
      <div class="summary-item">
        <div style="font-size:16px;font-weight:600;color:${status.enabled ? 'var(--success)' : 'var(--danger)'}">${status.enabled ? 'Active' : 'Inactive'}</div>
        <div class="label">Status</div>
      </div>
      <div class="summary-item"><div class="number">${status.totalRules}</div><div class="label">Rules</div></div>
      <div class="summary-item"><div style="font-size:14px;font-weight:600;">${status.defaultPolicy.input}</div><div class="label">Input Policy</div></div>
      <div class="summary-item"><div style="font-size:14px;font-weight:600;">${status.defaultPolicy.output}</div><div class="label">Output Policy</div></div>
    </div>
  `;

  document.getElementById('fw-rules').innerHTML = status.rules.length === 0
    ? '<p class="no-data">No managed rules. Add rules or load recommended rules.</p>'
    : `<table class="data-table">
        <thead><tr><th>Chain</th><th>Action</th><th>Protocol</th><th>Port</th><th>Source</th><th>Description</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${status.rules.map(r => `
          <tr>
            <td>${r.chain}</td>
            <td><span class="badge badge-${r.action === 'DROP' ? 'critical' : r.action === 'REJECT' ? 'high' : 'safe'}">${r.action}</span></td>
            <td>${r.protocol}</td>
            <td>${r.port || 'any'}</td>
            <td>${r.source || 'any'}</td>
            <td>${r.description}</td>
            <td>${r.enabled ? '<span style="color:var(--success)">On</span>' : '<span style="color:var(--text-muted)">Off</span>'}</td>
            <td>
              <button class="btn btn-small" onclick="toggleRuleUI('${r.id}')">Toggle</button>
              <button class="btn btn-small btn-danger" onclick="deleteRuleUI('${r.id}')">Delete</button>
            </td>
          </tr>
        `).join('')}</tbody>
       </table>`;
}

async function toggleRuleUI(id) {
  await fetch(API_BASE + '/firewall/rules/' + id + '/toggle', { method: 'PUT' });
  loadFirewallStatus();
}

async function deleteRuleUI(id) {
  await fetch(API_BASE + '/firewall/rules/' + id, { method: 'DELETE' });
  loadFirewallStatus();
}

function showAddRuleForm() {
  const body = document.getElementById('fw-rules');
  body.innerHTML = `
    <div style="margin-bottom:15px;">
      <div class="form-row">
        <div class="form-group"><label>Chain</label><select class="input" id="rule-chain"><option>INPUT</option><option>OUTPUT</option><option>FORWARD</option></select></div>
        <div class="form-group"><label>Action</label><select class="input" id="rule-action"><option>DROP</option><option>ACCEPT</option><option>REJECT</option></select></div>
        <div class="form-group"><label>Protocol</label><select class="input" id="rule-protocol"><option>tcp</option><option>udp</option><option>icmp</option><option>all</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Port</label><input type="text" class="input" id="rule-port" placeholder="e.g., 80"></div>
        <div class="form-group"><label>Source IP</label><input type="text" class="input" id="rule-source" placeholder="e.g., 10.0.0.0/8"></div>
      </div>
      <div class="form-group"><label>Description</label><input type="text" class="input" id="rule-desc" placeholder="Rule description"></div>
      <button class="btn btn-primary" onclick="addRuleUI()">Add Rule</button>
      <button class="btn btn-secondary" onclick="loadFirewallStatus()">Cancel</button>
    </div>
  ` + body.innerHTML;
}

async function addRuleUI() {
  const rule = {
    chain: document.getElementById('rule-chain').value,
    action: document.getElementById('rule-action').value,
    protocol: document.getElementById('rule-protocol').value,
    port: document.getElementById('rule-port').value || undefined,
    source: document.getElementById('rule-source').value || undefined,
    description: document.getElementById('rule-desc').value || 'Custom rule',
    enabled: true,
  };
  await apiPost('/firewall/rules', rule);
  loadFirewallStatus();
}

async function auditFirewallUI() {
  const resp = await fetch(API_BASE + '/firewall/audit');
  const findings = await resp.json();
  document.getElementById('fw-audit').innerHTML = renderFindings(findings);
}

// --- IDS ---
async function startIDS() {
  await apiPost('/ids/start', {});
  loadIDSStatus();
}

async function stopIDS() {
  await apiPost('/ids/stop', {});
  loadIDSStatus();
}

async function loadIDSStatus() {
  const resp = await fetch(API_BASE + '/ids/status');
  const status = await resp.json();
  document.getElementById('ids-status').innerHTML = `
    <div class="summary-box">
      <div class="summary-item">
        <div style="font-size:16px;font-weight:600;color:${status.running ? 'var(--success)' : 'var(--danger)'}">${status.running ? 'Running' : 'Stopped'}</div>
        <div class="label">Status</div>
      </div>
      <div class="summary-item"><div class="number">${status.totalAlerts}</div><div class="label">Total Alerts</div></div>
      <div class="summary-item"><div class="number">${status.monitoredInterfaces.length}</div><div class="label">Log Files</div></div>
      <div class="summary-item"><div style="font-size:13px;">${status.uptime > 0 ? Math.floor(status.uptime/60000) + 'm' : '-'}</div><div class="label">Uptime</div></div>
    </div>
  `;

  // Load alerts
  loadIDSAlerts();
}

async function loadIDSAlerts() {
  const resp = await fetch(API_BASE + '/ids/alerts?limit=20');
  const alerts = await resp.json();
  document.getElementById('ids-alerts').innerHTML = alerts.length === 0
    ? '<p class="no-data">No alerts yet.</p>'
    : alerts.reverse().map(a => `
      <div class="alert-item ${a.severity}">
        <div class="alert-time">${new Date(a.timestamp).toLocaleTimeString()}</div>
        <div class="alert-content">
          <div class="alert-type"><span class="badge badge-${a.severity}">${a.severity}</span> ${a.type}</div>
          <div class="alert-desc">${a.description}</div>
          <div style="font-size:11px;color:var(--text-muted);">Source: ${a.source}</div>
        </div>
      </div>
    `).join('');
}

function addAlertToUI(alert) {
  // Will be refreshed on next stats cycle, but immediate feedback is nice
  loadIDSAlerts();
}

async function analyzeTextIDS() {
  const text = document.getElementById('ids-text').value.trim();
  if (!text) return alert('Please enter text to analyze');

  const alerts = await apiPost('/ids/analyze', { text, source: 'manual' });
  document.getElementById('ids-analyze-results').innerHTML = alerts.length === 0
    ? '<p style="color:var(--success)">No threats detected in the provided text.</p>'
    : alerts.map(a => `
      <div class="alert-item ${a.severity}">
        <div class="alert-content">
          <div class="alert-type"><span class="badge badge-${a.severity}">${a.severity}</span> ${a.type}</div>
          <div class="alert-desc">${a.description}</div>
        </div>
      </div>
    `).join('');
}

async function clearAlertsIDS() {
  await fetch(API_BASE + '/ids/alerts', { method: 'DELETE' });
  loadIDSAlerts();
}

// --- Threat Intelligence ---
async function checkIPReputationUI() {
  const ip = document.getElementById('ti-ip').value.trim();
  if (!ip) return alert('Please enter an IP address');

  showLoading('Checking IP reputation...');
  try {
    const result = await apiPost('/threat/ip', { ip });
    document.getElementById('ti-ip-results').innerHTML = `
      <div style="text-align:center;margin-bottom:15px;">
        <span class="badge badge-${result.overallRisk}" style="font-size:16px;padding:6px 16px;">${result.overallRisk.toUpperCase()}</span>
      </div>
      ${result.indicators.filter(i => i.threat).length > 0 ? `
        <h4 style="color:var(--danger);margin-bottom:8px;">Threats Found:</h4>
        ${result.indicators.filter(i => i.threat).map(i => `
          <div class="finding high">
            <div class="finding-title">${i.source}</div>
            <div class="finding-desc">${i.description}</div>
          </div>
        `).join('')}
      ` : ''}
      <h4 style="margin:10px 0 8px;">All Checks:</h4>
      <table class="data-table">
        <thead><tr><th>Source</th><th>Status</th><th>Details</th></tr></thead>
        <tbody>${result.indicators.map(i => `
          <tr>
            <td>${i.source}</td>
            <td>${i.threat ? '<span style="color:var(--danger)">Threat</span>' : '<span style="color:var(--success)">Clean</span>'}</td>
            <td style="font-size:12px;">${i.description}</td>
          </tr>
        `).join('')}</tbody>
      </table>
      ${result.recommendations.length > 0 ? `
        <h4 style="margin:10px 0 8px;">Recommendations:</h4>
        <ul style="margin-left:20px;font-size:13px;color:var(--text-secondary);">${result.recommendations.map(r => `<li>${r}</li>`).join('')}</ul>
      ` : ''}
    `;
  } catch (e) {
    alert('Check failed: ' + e.message);
  }
  hideLoading();
}

async function checkDomainReputationUI() {
  const domain = document.getElementById('ti-domain').value.trim();
  if (!domain) return alert('Please enter a domain');

  showLoading('Checking domain reputation...');
  try {
    const result = await apiPost('/threat/domain', { domain });
    document.getElementById('ti-domain-results').innerHTML = `
      <div style="text-align:center;margin-bottom:15px;">
        <span class="badge badge-${result.overallRisk}" style="font-size:16px;padding:6px 16px;">${result.overallRisk.toUpperCase()}</span>
      </div>
      ${result.indicators.filter(i => i.threat).length > 0 ? `
        <h4 style="color:var(--danger);margin-bottom:8px;">Threats Found:</h4>
        ${result.indicators.filter(i => i.threat).map(i => `
          <div class="finding high">
            <div class="finding-title">${i.source}</div>
            <div class="finding-desc">${i.description}</div>
          </div>
        `).join('')}
      ` : '<p style="color:var(--success);">No threats detected.</p>'}
      ${result.recommendations.length > 0 ? `
        <h4 style="margin:10px 0 8px;">Recommendations:</h4>
        <ul style="margin-left:20px;font-size:13px;color:var(--text-secondary);">${result.recommendations.map(r => `<li>${r}</li>`).join('')}</ul>
      ` : ''}
    `;
  } catch (e) {
    alert('Check failed: ' + e.message);
  }
  hideLoading();
}

// --- Full Scan ---
function runFullScan() {
  document.getElementById('full-scan-modal').style.display = 'flex';
  document.getElementById('full-scan-progress').innerHTML = '';
}

function closeModal() {
  document.getElementById('full-scan-modal').style.display = 'none';
}

async function executeFullScan() {
  const target = document.getElementById('full-scan-target').value.trim();
  if (!target) return alert('Please enter a target');

  const progress = document.getElementById('full-scan-progress');
  progress.innerHTML = '<div class="spinner" style="margin:20px auto;"></div><p style="text-align:center;">Running full security scan...</p>';

  try {
    const result = await apiPost('/scan/full', { target });
    progress.innerHTML = `
      <div style="text-align:center;margin-bottom:15px;">
        <h3>Scan Complete</h3>
        <p>${result.results.length} modules, ${result.summary.totalFindings} findings</p>
      </div>
      <div class="summary-box">
        <div class="summary-item"><div class="number" style="color:var(--danger)">${result.summary.critical}</div><div class="label">Critical</div></div>
        <div class="summary-item"><div class="number" style="color:var(--orange)">${result.summary.high}</div><div class="label">High</div></div>
        <div class="summary-item"><div class="number" style="color:var(--warning)">${result.summary.medium}</div><div class="label">Medium</div></div>
        <div class="summary-item"><div class="number" style="color:#22d3ee">${result.summary.low}</div><div class="label">Low</div></div>
      </div>
      <button class="btn btn-secondary btn-full" onclick="closeModal()">Close</button>
    `;
    refreshStats();
  } catch (e) {
    progress.innerHTML = `<p style="color:var(--danger)">Scan failed: ${e.message}</p>`;
  }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  connectWebSocket();
  refreshStats();
  loadFirewallStatus();
  loadIDSStatus();
});
