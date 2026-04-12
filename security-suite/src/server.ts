// ============================================================================
// Security Suite - Express API Server with WebSocket Support
// ============================================================================

import express = require('express');
import * as http from 'http';
import * as path from 'path';
import cors = require('cors');
import { WebSocketServer, WebSocket } from 'ws';
import { Logger } from './utils/logger';
import { Reporter } from './utils/reporter';
import { scanNetwork } from './modules/network-scanner/port-scanner';
import { analyzeSSL } from './modules/ssl-analyzer/ssl-checker';
import { checkHeaders } from './modules/header-analyzer/header-checker';
import { checkDNS } from './modules/dns-security/dns-checker';
import { analyzePassword, checkBreach, generateSecurePassword } from './modules/password-security/password-checker';
import { scanVulnerabilities } from './modules/vulnerability-scanner/vuln-scanner';
import { scanMalware, createBaseline } from './modules/malware-scanner/malware-scanner';
import { getFirewallStatus, addRule, removeRule, toggleRule, getRecommendedRules, auditFirewall } from './modules/firewall/firewall-manager';
import { IntrusionDetector } from './modules/ids/intrusion-detector';
import { checkIPReputation, checkDomainReputation } from './modules/threat-intel/threat-feed';
import { ScanResult, DashboardStats, WebSocketMessage } from './types';

const logger = new Logger('Server');

// Global state
const scanHistory: ScanResult[] = [];
const ids = new IntrusionDetector();
let wsClients: Set<WebSocket> = new Set();

function broadcast(message: WebSocketMessage): void {
  const data = JSON.stringify(message);
  for (const client of wsClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

function addScanResult(result: ScanResult): void {
  scanHistory.push(result);
  if (scanHistory.length > 100) scanHistory.shift();
  broadcast({ type: 'scan_result', data: result, timestamp: new Date() });
}

function getDashboardStats(): DashboardStats {
  const totalFindings = scanHistory.reduce((s, r) => s + r.findings.length, 0);
  const criticalFindings = scanHistory.reduce(
    (s, r) => s + r.findings.filter(f => f.severity === 'critical').length, 0
  );
  const idsStatus = ids.getStatus();

  return {
    totalScans: scanHistory.length,
    totalFindings,
    criticalFindings,
    activeAlerts: idsStatus.totalAlerts,
    systemStatus: criticalFindings > 0 ? 'critical' : totalFindings > 10 ? 'warning' : 'healthy',
    modules: [
      { name: 'Network Scanner', status: 'active', findingsCount: scanHistory.filter(s => s.module === 'Network Scanner').reduce((sum, s) => sum + s.findings.length, 0) },
      { name: 'SSL Analyzer', status: 'active', findingsCount: scanHistory.filter(s => s.module === 'SSL Analyzer').reduce((sum, s) => sum + s.findings.length, 0) },
      { name: 'Header Checker', status: 'active', findingsCount: scanHistory.filter(s => s.module === 'Header Checker').reduce((sum, s) => sum + s.findings.length, 0) },
      { name: 'DNS Checker', status: 'active', findingsCount: scanHistory.filter(s => s.module === 'DNS Checker').reduce((sum, s) => sum + s.findings.length, 0) },
      { name: 'Vulnerability Scanner', status: 'active', findingsCount: scanHistory.filter(s => s.module === 'Vulnerability Scanner').reduce((sum, s) => sum + s.findings.length, 0) },
      { name: 'Malware Scanner', status: 'active', findingsCount: scanHistory.filter(s => s.module === 'Malware Scanner').reduce((sum, s) => sum + s.findings.length, 0) },
      { name: 'Firewall', status: 'active', findingsCount: 0 },
      { name: 'IDS', status: idsStatus.running ? 'active' : 'inactive', findingsCount: idsStatus.totalAlerts },
      { name: 'Threat Intel', status: 'active', findingsCount: 0 },
      { name: 'Password Checker', status: 'active', findingsCount: 0 },
    ],
    recentScans: scanHistory.slice(-10).reverse(),
    threatLevel: criticalFindings > 5 ? 'critical' : criticalFindings > 0 ? 'high' : totalFindings > 20 ? 'medium' : 'safe',
  };
}

export function createServer(port: number = 3000, host: string = '127.0.0.1'): http.Server {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'dashboard')));

  // --- Dashboard Stats ---
  app.get('/api/stats', (_req, res) => {
    res.json(getDashboardStats());
  });

  app.get('/api/history', (_req, res) => {
    res.json(scanHistory.slice(-50).reverse());
  });

  // --- Network Scanner ---
  app.post('/api/scan/network', async (req, res) => {
    try {
      const { host: targetHost, ports, timeout, concurrency } = req.body;
      if (!targetHost) return res.status(400).json({ error: 'host is required' });

      logger.info(`API: Network scan requested for ${targetHost}`);
      const result = await scanNetwork({ host: targetHost, ports, timeout, concurrency });
      addScanResult(result);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Scan failed' });
    }
  });

  // --- SSL Analyzer ---
  app.post('/api/scan/ssl', async (req, res) => {
    try {
      const { host: targetHost, port, timeout } = req.body;
      if (!targetHost) return res.status(400).json({ error: 'host is required' });

      logger.info(`API: SSL scan requested for ${targetHost}`);
      const result = await analyzeSSL({ host: targetHost, port, timeout });
      addScanResult(result);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Scan failed' });
    }
  });

  // --- Header Checker ---
  app.post('/api/scan/headers', async (req, res) => {
    try {
      const { url, timeout, followRedirects } = req.body;
      if (!url) return res.status(400).json({ error: 'url is required' });

      logger.info(`API: Header scan requested for ${url}`);
      const result = await checkHeaders({ url, timeout, followRedirects });
      addScanResult(result);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Scan failed' });
    }
  });

  // --- DNS Checker ---
  app.post('/api/scan/dns', async (req, res) => {
    try {
      const { domain, checkDNSSEC } = req.body;
      if (!domain) return res.status(400).json({ error: 'domain is required' });

      logger.info(`API: DNS scan requested for ${domain}`);
      const result = await checkDNS({ domain, checkDNSSEC });
      addScanResult(result);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Scan failed' });
    }
  });

  // --- Vulnerability Scanner ---
  app.post('/api/scan/vulnerabilities', async (req, res) => {
    try {
      const { target, categories, timeout } = req.body;
      if (!target) return res.status(400).json({ error: 'target is required' });

      logger.info(`API: Vulnerability scan requested for ${target}`);
      const result = await scanVulnerabilities({ target, categories, timeout });
      addScanResult(result);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Scan failed' });
    }
  });

  // --- Malware Scanner ---
  app.post('/api/scan/malware', async (req, res) => {
    try {
      const { path: scanPath, recursive, extensions, maxFileSize, checkSignatures } = req.body;
      if (!scanPath) return res.status(400).json({ error: 'path is required' });

      logger.info(`API: Malware scan requested for ${scanPath}`);
      const result = await scanMalware({ path: scanPath, recursive, extensions, maxFileSize, checkSignatures });
      addScanResult(result);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Scan failed' });
    }
  });

  app.post('/api/scan/malware/baseline', async (req, res) => {
    try {
      const { path: dirPath } = req.body;
      if (!dirPath) return res.status(400).json({ error: 'path is required' });

      const baseline = await createBaseline(dirPath);
      res.json(baseline);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  });

  // --- Password Security ---
  app.post('/api/password/analyze', (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'password is required' });

    const result = analyzePassword(password);
    res.json(result);
  });

  app.post('/api/password/breach-check', async (req, res) => {
    try {
      const { password } = req.body;
      if (!password) return res.status(400).json({ error: 'password is required' });

      const result = await checkBreach(password);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Check failed' });
    }
  });

  app.get('/api/password/generate', (req, res) => {
    const length = parseInt(req.query.length as string) || 20;
    const password = generateSecurePassword(Math.min(128, Math.max(8, length)));
    const analysis = analyzePassword(password);
    res.json({ password, analysis });
  });

  // --- Firewall ---
  app.get('/api/firewall/status', (_req, res) => {
    res.json(getFirewallStatus());
  });

  app.post('/api/firewall/rules', (req, res) => {
    try {
      const rule = addRule(req.body);
      res.json(rule);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed' });
    }
  });

  app.delete('/api/firewall/rules/:id', (req, res) => {
    const success = removeRule(req.params.id);
    res.json({ success });
  });

  app.put('/api/firewall/rules/:id/toggle', (req, res) => {
    const rule = toggleRule(req.params.id);
    res.json(rule || { error: 'Rule not found' });
  });

  app.get('/api/firewall/recommended', (_req, res) => {
    res.json(getRecommendedRules());
  });

  app.get('/api/firewall/audit', (_req, res) => {
    res.json(auditFirewall());
  });

  // --- IDS ---
  app.get('/api/ids/status', (_req, res) => {
    res.json(ids.getStatus());
  });

  app.post('/api/ids/start', (_req, res) => {
    ids.start();
    res.json({ status: 'started' });
  });

  app.post('/api/ids/stop', (_req, res) => {
    ids.stop();
    res.json({ status: 'stopped' });
  });

  app.get('/api/ids/alerts', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    res.json(ids.getAlerts(limit));
  });

  app.post('/api/ids/analyze', (req, res) => {
    const { text, source } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const alerts = ids.analyzeText(text, source);
    res.json(alerts);
  });

  app.delete('/api/ids/alerts', (_req, res) => {
    ids.clearAlerts();
    res.json({ status: 'cleared' });
  });

  app.get('/api/ids/rules', (_req, res) => {
    res.json(ids.getRules());
  });

  // --- Threat Intelligence ---
  app.post('/api/threat/ip', async (req, res) => {
    try {
      const { ip } = req.body;
      if (!ip) return res.status(400).json({ error: 'ip is required' });

      const result = await checkIPReputation(ip);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Check failed' });
    }
  });

  app.post('/api/threat/domain', async (req, res) => {
    try {
      const { domain } = req.body;
      if (!domain) return res.status(400).json({ error: 'domain is required' });

      const result = await checkDomainReputation(domain);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Check failed' });
    }
  });

  // --- Full Scan ---
  app.post('/api/scan/full', async (req, res) => {
    try {
      const { target } = req.body;
      if (!target) return res.status(400).json({ error: 'target is required' });

      logger.info(`API: Full scan requested for ${target}`);

      // Determine target type
      const isURL = target.startsWith('http://') || target.startsWith('https://');
      const isDomain = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/.test(target);
      const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(target);

      const results: ScanResult[] = [];
      const reporter = new Reporter();

      const domain = isURL ? new URL(target).hostname : target;
      const url = isURL ? target : `https://${target}`;

      // Run applicable scans in parallel
      const scanPromises: Promise<ScanResult>[] = [];

      if (isIP || isDomain) {
        scanPromises.push(
          scanNetwork({ host: domain, timeout: 5000 }).catch(e => ({
            module: 'Network Scanner', target: domain, startTime: new Date(), endTime: new Date(),
            duration: 0, findings: [], summary: { totalFindings: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0, riskLevel: 'safe' as const },
          }))
        );
      }

      scanPromises.push(
        analyzeSSL({ host: domain, timeout: 5000 }).catch(e => ({
          module: 'SSL Analyzer', target: domain, startTime: new Date(), endTime: new Date(),
          duration: 0, findings: [], summary: { totalFindings: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0, riskLevel: 'safe' as const },
        }))
      );

      scanPromises.push(
        checkHeaders({ url, timeout: 5000 }).catch(e => ({
          module: 'Header Checker', target: url, startTime: new Date(), endTime: new Date(),
          duration: 0, findings: [], summary: { totalFindings: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0, riskLevel: 'safe' as const },
        }))
      );

      if (isDomain || isURL) {
        scanPromises.push(
          checkDNS({ domain }).catch(e => ({
            module: 'DNS Checker', target: domain, startTime: new Date(), endTime: new Date(),
            duration: 0, findings: [], summary: { totalFindings: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0, riskLevel: 'safe' as const },
          }))
        );
      }

      scanPromises.push(
        scanVulnerabilities({ target: url, timeout: 5000 }).catch(e => ({
          module: 'Vulnerability Scanner', target: url, startTime: new Date(), endTime: new Date(),
          duration: 0, findings: [], summary: { totalFindings: 0, critical: 0, high: 0, medium: 0, low: 0, info: 0, riskLevel: 'safe' as const },
        }))
      );

      const scanResults = await Promise.all(scanPromises);

      for (const result of scanResults) {
        results.push(result);
        addScanResult(result);
        reporter.addResult(result);
      }

      res.json({
        target,
        results,
        report: {
          text: reporter.generateTextReport(),
        },
        summary: {
          totalModules: results.length,
          totalFindings: results.reduce((s, r) => s + r.findings.length, 0),
          critical: results.reduce((s, r) => s + r.summary.critical, 0),
          high: results.reduce((s, r) => s + r.summary.high, 0),
          medium: results.reduce((s, r) => s + r.summary.medium, 0),
          low: results.reduce((s, r) => s + r.summary.low, 0),
        },
      });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Full scan failed' });
    }
  });

  // --- Report Generation ---
  app.get('/api/report/:format', (req, res) => {
    const reporter = new Reporter();
    for (const result of scanHistory) {
      reporter.addResult(result);
    }

    const format = req.params.format;
    switch (format) {
      case 'json':
        res.setHeader('Content-Type', 'application/json');
        res.send(reporter.generateJSONReport());
        break;
      case 'html':
        res.setHeader('Content-Type', 'text/html');
        res.send(reporter.generateHTMLReport());
        break;
      case 'text':
      default:
        res.setHeader('Content-Type', 'text/plain');
        res.send(reporter.generateTextReport());
        break;
    }
  });

  // --- Create HTTP server ---
  const server = http.createServer(app);

  // --- WebSocket server ---
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    wsClients.add(ws);
    logger.info(`WebSocket client connected (${wsClients.size} total)`);

    // Send initial stats
    ws.send(JSON.stringify({
      type: 'stats',
      data: getDashboardStats(),
      timestamp: new Date(),
    }));

    ws.on('close', () => {
      wsClients.delete(ws);
      logger.info(`WebSocket client disconnected (${wsClients.size} total)`);
    });
  });

  // IDS alerts forwarding
  ids.on('alert', (alert) => {
    broadcast({ type: 'alert', data: alert, timestamp: new Date() });
  });

  // Periodic stats broadcast
  setInterval(() => {
    broadcast({ type: 'stats', data: getDashboardStats(), timestamp: new Date() });
  }, 5000);

  server.listen(port, host, () => {
    logger.banner('Security Suite Server');
    logger.info(`Dashboard: http://${host}:${port}`);
    logger.info(`API Base:  http://${host}:${port}/api`);
    logger.info(`WebSocket: ws://${host}:${port}`);
    logger.separator();
  });

  return server;
}
