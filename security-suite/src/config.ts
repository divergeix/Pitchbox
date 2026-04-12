// ============================================================================
// Security Suite - Configuration
// ============================================================================

import { SecuritySuiteConfig } from './types';

export const DEFAULT_CONFIG: SecuritySuiteConfig = {
  server: {
    port: 3000,
    host: '127.0.0.1',
  },
  scanning: {
    defaultTimeout: 10000,
    maxConcurrency: 50,
  },
  logging: {
    level: 'info',
  },
  modules: {
    networkScanner: true,
    sslAnalyzer: true,
    headerChecker: true,
    dnsChecker: true,
    passwordChecker: true,
    vulnScanner: true,
    malwareScanner: true,
    firewall: true,
    ids: true,
    threatIntel: true,
  },
};

export function loadConfig(overrides?: Partial<SecuritySuiteConfig>): SecuritySuiteConfig {
  const config = { ...DEFAULT_CONFIG };
  if (overrides) {
    if (overrides.server) Object.assign(config.server, overrides.server);
    if (overrides.scanning) Object.assign(config.scanning, overrides.scanning);
    if (overrides.logging) Object.assign(config.logging, overrides.logging);
    if (overrides.modules) Object.assign(config.modules, overrides.modules);
  }
  return config;
}

// Well-known ports database
export const COMMON_PORTS: Record<number, string> = {
  20: 'FTP Data', 21: 'FTP Control', 22: 'SSH', 23: 'Telnet',
  25: 'SMTP', 53: 'DNS', 67: 'DHCP Server', 68: 'DHCP Client',
  69: 'TFTP', 80: 'HTTP', 110: 'POP3', 119: 'NNTP',
  123: 'NTP', 135: 'MS RPC', 137: 'NetBIOS Name', 138: 'NetBIOS Datagram',
  139: 'NetBIOS Session', 143: 'IMAP', 161: 'SNMP', 162: 'SNMP Trap',
  389: 'LDAP', 443: 'HTTPS', 445: 'SMB', 465: 'SMTPS',
  514: 'Syslog', 515: 'LPD', 587: 'SMTP Submission', 636: 'LDAPS',
  993: 'IMAPS', 995: 'POP3S', 1080: 'SOCKS Proxy', 1433: 'MSSQL',
  1434: 'MSSQL Browser', 1521: 'Oracle DB', 1723: 'PPTP',
  2049: 'NFS', 2082: 'cPanel', 2083: 'cPanel SSL', 2181: 'ZooKeeper',
  3306: 'MySQL', 3389: 'RDP', 3690: 'SVN', 4443: 'HTTPS Alt',
  5432: 'PostgreSQL', 5672: 'AMQP', 5900: 'VNC', 5984: 'CouchDB',
  6379: 'Redis', 6443: 'Kubernetes API', 6660: 'IRC',
  8000: 'HTTP Alt', 8080: 'HTTP Proxy', 8443: 'HTTPS Alt',
  8888: 'HTTP Alt', 9090: 'Prometheus', 9200: 'Elasticsearch',
  9300: 'Elasticsearch Transport', 11211: 'Memcached',
  27017: 'MongoDB', 27018: 'MongoDB', 50000: 'SAP',
};

// Suspicious file extensions
export const SUSPICIOUS_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.vbs', '.vbe', '.js', '.jse',
  '.wsf', '.wsh', '.ps1', '.psc1', '.scr', '.pif', '.hta',
  '.cpl', '.msi', '.msp', '.mst', '.inf', '.reg', '.rgs',
];

// Common malware signatures (SHA256 prefixes for demo)
export const KNOWN_MALWARE_SIGNATURES = [
  'e3b0c44298fc1c149afbf4c8996fb924',  // empty file hash prefix
  'a94a8fe5ccb19ba61c4c0873d391e987',  // known test pattern
];
