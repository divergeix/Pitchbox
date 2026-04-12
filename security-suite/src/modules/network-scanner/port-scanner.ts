// ============================================================================
// Network Scanner - Port Scanner & Service Detection
// ============================================================================

import * as net from 'net';
import { Logger } from '../../utils/logger';
import { CryptoUtils } from '../../utils/crypto-utils';
import { COMMON_PORTS } from '../../config';
import {
  PortResult,
  NetworkScanResult,
  NetworkScanOptions,
  SecurityFinding,
  Severity,
} from '../../types';

const logger = new Logger('NetworkScanner');

// Ports that should generally not be exposed to the internet
const DANGEROUS_PORTS: Record<number, { service: string; severity: Severity; reason: string }> = {
  21: { service: 'FTP', severity: 'high', reason: 'FTP transmits credentials in plaintext' },
  23: { service: 'Telnet', severity: 'critical', reason: 'Telnet is unencrypted and highly insecure' },
  135: { service: 'MS RPC', severity: 'high', reason: 'MS RPC is commonly exploited' },
  137: { service: 'NetBIOS', severity: 'high', reason: 'NetBIOS exposes sensitive system information' },
  138: { service: 'NetBIOS', severity: 'high', reason: 'NetBIOS datagram service should not be exposed' },
  139: { service: 'NetBIOS', severity: 'high', reason: 'NetBIOS session service enables file sharing attacks' },
  445: { service: 'SMB', severity: 'critical', reason: 'SMB is a primary target for ransomware and worms' },
  1433: { service: 'MSSQL', severity: 'critical', reason: 'Database port should not be publicly accessible' },
  1434: { service: 'MSSQL Browser', severity: 'high', reason: 'Database service browser should not be exposed' },
  3306: { service: 'MySQL', severity: 'critical', reason: 'Database port should not be publicly accessible' },
  3389: { service: 'RDP', severity: 'high', reason: 'RDP is frequently targeted for brute-force attacks' },
  5432: { service: 'PostgreSQL', severity: 'critical', reason: 'Database port should not be publicly accessible' },
  5900: { service: 'VNC', severity: 'high', reason: 'VNC may transmit data without encryption' },
  6379: { service: 'Redis', severity: 'critical', reason: 'Redis often has no authentication by default' },
  11211: { service: 'Memcached', severity: 'high', reason: 'Memcached can be used for amplification attacks' },
  27017: { service: 'MongoDB', severity: 'critical', reason: 'MongoDB often has no authentication by default' },
};

// Default scan ports (top 100 most common)
const DEFAULT_PORTS = [
  20, 21, 22, 23, 25, 53, 67, 68, 69, 80, 110, 119, 123, 135, 137, 138, 139,
  143, 161, 162, 389, 443, 445, 465, 514, 515, 587, 636, 993, 995, 1080, 1433,
  1434, 1521, 1723, 2049, 2082, 2083, 3306, 3389, 3690, 4443, 5432, 5672, 5900,
  5984, 6379, 6443, 8000, 8080, 8443, 8888, 9090, 9200, 9300, 11211, 27017,
];

function parsePorts(portsInput: number[] | string | undefined): number[] {
  if (!portsInput) return DEFAULT_PORTS;
  if (Array.isArray(portsInput)) return portsInput;

  const ports: number[] = [];
  const parts = portsInput.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(Number);
      for (let i = start; i <= Math.min(end, 65535); i++) {
        ports.push(i);
      }
    } else {
      const port = Number(trimmed);
      if (port >= 1 && port <= 65535) ports.push(port);
    }
  }

  return ports;
}

async function scanPort(
  host: string,
  port: number,
  timeout: number
): Promise<PortResult> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let banner = '';

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      const service = COMMON_PORTS[port] || 'Unknown';
      // Try to grab banner
      socket.once('data', (data) => {
        banner = data.toString('utf-8', 0, 200).trim();
        socket.destroy();
        resolve({ port, state: 'open', service, banner });
      });

      // If no banner comes in 1 second, resolve without it
      setTimeout(() => {
        socket.destroy();
        resolve({ port, state: 'open', service, banner: banner || undefined });
      }, 1000);
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ port, state: 'filtered', service: COMMON_PORTS[port] || 'Unknown' });
    });

    socket.on('error', (err: NodeJS.ErrnoException) => {
      socket.destroy();
      if (err.code === 'ECONNREFUSED') {
        resolve({ port, state: 'closed', service: COMMON_PORTS[port] || 'Unknown' });
      } else {
        resolve({ port, state: 'filtered', service: COMMON_PORTS[port] || 'Unknown' });
      }
    });

    socket.connect(port, host);
  });
}

export async function scanNetwork(options: NetworkScanOptions): Promise<NetworkScanResult> {
  const {
    host,
    ports: portsInput,
    timeout = 3000,
    concurrency = 50,
  } = options;

  const startTime = new Date();
  const ports = parsePorts(portsInput);
  const portResults: PortResult[] = [];
  const findings: SecurityFinding[] = [];

  logger.info(`Starting port scan on ${host} (${ports.length} ports)`);

  // Scan ports with concurrency limit
  for (let i = 0; i < ports.length; i += concurrency) {
    const batch = ports.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(port => scanPort(host, port, timeout))
    );
    portResults.push(...results);
  }

  const openPorts = portResults.filter(p => p.state === 'open');
  const filteredPorts = portResults.filter(p => p.state === 'filtered');

  logger.info(`Scan complete: ${openPorts.length} open, ${filteredPorts.length} filtered`);

  // Generate findings for open ports
  for (const port of openPorts) {
    const dangerInfo = DANGEROUS_PORTS[port.port];

    if (dangerInfo) {
      findings.push({
        id: CryptoUtils.generateId(),
        module: 'Network Scanner',
        severity: dangerInfo.severity,
        title: `Dangerous port ${port.port} (${dangerInfo.service}) is open`,
        description: dangerInfo.reason,
        recommendation: `Close port ${port.port} or restrict access via firewall rules. If this service is required, ensure it is properly secured and access is limited to trusted IP addresses.`,
        timestamp: new Date(),
        metadata: { port: port.port, service: port.service, banner: port.banner },
      });
    }
  }

  // Check for too many open ports
  if (openPorts.length > 20) {
    findings.push({
      id: CryptoUtils.generateId(),
      module: 'Network Scanner',
      severity: 'medium',
      title: `Excessive number of open ports (${openPorts.length})`,
      description: 'Having many open ports increases the attack surface. Each open port is a potential entry point.',
      recommendation: 'Review all open ports and close any that are not strictly necessary. Apply the principle of least privilege.',
      timestamp: new Date(),
    });
  }

  // Check for unencrypted services when encrypted alternatives exist
  const hasHTTP = openPorts.some(p => p.port === 80);
  const hasHTTPS = openPorts.some(p => p.port === 443);
  if (hasHTTP && !hasHTTPS) {
    findings.push({
      id: CryptoUtils.generateId(),
      module: 'Network Scanner',
      severity: 'high',
      title: 'HTTP without HTTPS',
      description: 'Port 80 (HTTP) is open but port 443 (HTTPS) is not. Traffic may be unencrypted.',
      recommendation: 'Enable HTTPS on port 443 and redirect HTTP traffic to HTTPS.',
      timestamp: new Date(),
    });
  }

  const hasFTP = openPorts.some(p => p.port === 21);
  const hasSFTP = openPorts.some(p => p.port === 22);
  if (hasFTP && !hasSFTP) {
    findings.push({
      id: CryptoUtils.generateId(),
      module: 'Network Scanner',
      severity: 'high',
      title: 'FTP without SFTP/SSH',
      description: 'FTP transmits credentials in plaintext. Consider using SFTP/SSH instead.',
      recommendation: 'Replace FTP with SFTP (SSH File Transfer Protocol) for secure file transfers.',
      timestamp: new Date(),
    });
  }

  const endTime = new Date();
  const duration = endTime.getTime() - startTime.getTime();

  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const highCount = findings.filter(f => f.severity === 'high').length;
  const mediumCount = findings.filter(f => f.severity === 'medium').length;

  return {
    module: 'Network Scanner',
    target: host,
    startTime,
    endTime,
    duration,
    findings,
    summary: {
      totalFindings: findings.length,
      critical: criticalCount,
      high: highCount,
      medium: mediumCount,
      low: findings.filter(f => f.severity === 'low').length,
      info: findings.filter(f => f.severity === 'info').length,
      riskLevel: criticalCount > 0 ? 'critical' : highCount > 0 ? 'high' : mediumCount > 0 ? 'medium' : 'safe',
    },
    raw: {
      host,
      ports: portResults,
      openPorts: openPorts.map(p => p.port),
    },
  };
}
