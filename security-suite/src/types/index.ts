// ============================================================================
// Security Suite - Type Definitions
// ============================================================================

// --- Severity & Risk Levels ---
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'safe';

// --- Common Result Types ---
export interface SecurityFinding {
  id: string;
  module: string;
  severity: Severity;
  title: string;
  description: string;
  recommendation: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ScanResult {
  module: string;
  target: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  findings: SecurityFinding[];
  summary: ScanSummary;
  raw?: Record<string, unknown>;
}

export interface ScanSummary {
  totalFindings: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  riskLevel: RiskLevel;
}

// --- Network Scanner Types ---
export interface PortResult {
  port: number;
  state: 'open' | 'closed' | 'filtered';
  service: string;
  version?: string;
  banner?: string;
}

export interface NetworkScanResult extends ScanResult {
  raw: {
    host: string;
    ports: PortResult[];
    openPorts: number[];
    os?: string;
  };
}

export interface NetworkScanOptions {
  host: string;
  ports?: number[] | string;
  timeout?: number;
  concurrency?: number;
}

// --- SSL/TLS Analyzer Types ---
export interface CertificateInfo {
  subject: Record<string, string>;
  issuer: Record<string, string>;
  validFrom: Date;
  validTo: Date;
  serialNumber: string;
  fingerprint: string;
  fingerprintSha256: string;
  version: number;
  signatureAlgorithm: string;
  keySize: number;
  san: string[];
  isExpired: boolean;
  daysUntilExpiry: number;
  isSelfSigned: boolean;
}

export interface SSLScanResult extends ScanResult {
  raw: {
    host: string;
    port: number;
    certificate: CertificateInfo | null;
    protocol: string;
    cipher: string;
    supportedProtocols: string[];
    hasHSTS: boolean;
  };
}

export interface SSLScanOptions {
  host: string;
  port?: number;
  timeout?: number;
}

// --- HTTP Header Types ---
export interface HeaderCheckResult {
  header: string;
  present: boolean;
  value?: string;
  severity: Severity;
  description: string;
  recommendation: string;
}

export interface HeaderScanResult extends ScanResult {
  raw: {
    url: string;
    statusCode: number;
    headers: Record<string, string>;
    checks: HeaderCheckResult[];
    score: number;
    maxScore: number;
    grade: string;
  };
}

export interface HeaderScanOptions {
  url: string;
  timeout?: number;
  followRedirects?: boolean;
}

// --- DNS Security Types ---
export interface DNSRecord {
  type: string;
  name: string;
  value: string;
  ttl: number;
}

export interface DNSScanResult extends ScanResult {
  raw: {
    domain: string;
    records: DNSRecord[];
    hasDNSSEC: boolean;
    hasSPF: boolean;
    hasDMARC: boolean;
    hasDKIM: boolean;
    nameservers: string[];
    mxRecords: string[];
  };
}

export interface DNSScanOptions {
  domain: string;
  checkDNSSEC?: boolean;
  recordTypes?: string[];
}

// --- Password Security Types ---
export interface PasswordAnalysis {
  password: string;
  score: number;
  strength: 'very-weak' | 'weak' | 'fair' | 'strong' | 'very-strong';
  entropy: number;
  crackTime: string;
  length: number;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumbers: boolean;
  hasSymbols: boolean;
  hasCommonPatterns: boolean;
  suggestions: string[];
}

export interface BreachCheckResult {
  hash: string;
  breached: boolean;
  occurrences: number;
}

// --- Vulnerability Scanner Types ---
export interface Vulnerability {
  id: string;
  name: string;
  severity: Severity;
  category: string;
  description: string;
  affected: string;
  recommendation: string;
  references: string[];
}

export interface VulnScanResult extends ScanResult {
  raw: {
    target: string;
    vulnerabilities: Vulnerability[];
    checkedCategories: string[];
  };
}

export interface VulnScanOptions {
  target: string;
  categories?: string[];
  timeout?: number;
}

// --- Malware Scanner Types ---
export interface FileIntegrityResult {
  filePath: string;
  hash: string;
  algorithm: string;
  size: number;
  modified: Date;
  isSuspicious: boolean;
  reason?: string;
}

export interface MalwareScanResult extends ScanResult {
  raw: {
    scannedFiles: number;
    suspiciousFiles: FileIntegrityResult[];
    cleanFiles: number;
    skippedFiles: number;
    scanPath: string;
  };
}

export interface MalwareScanOptions {
  path: string;
  recursive?: boolean;
  extensions?: string[];
  maxFileSize?: number;
  checkSignatures?: boolean;
}

// --- Firewall Types ---
export interface FirewallRule {
  id: string;
  chain: 'INPUT' | 'OUTPUT' | 'FORWARD';
  action: 'ACCEPT' | 'DROP' | 'REJECT' | 'LOG';
  protocol: 'tcp' | 'udp' | 'icmp' | 'all';
  source?: string;
  destination?: string;
  port?: number | string;
  description: string;
  enabled: boolean;
  createdAt: Date;
}

export interface FirewallStatus {
  enabled: boolean;
  defaultPolicy: {
    input: string;
    output: string;
    forward: string;
  };
  rules: FirewallRule[];
  totalRules: number;
}

// --- IDS Types ---
export interface IntrusionAlert {
  id: string;
  timestamp: Date;
  severity: Severity;
  type: string;
  source: string;
  destination?: string;
  description: string;
  rawLog?: string;
  actionTaken: string;
}

export interface IDSStatus {
  running: boolean;
  monitoredInterfaces: string[];
  totalAlerts: number;
  alertsByType: Record<string, number>;
  recentAlerts: IntrusionAlert[];
  uptime: number;
}

export interface IDSConfig {
  interfaces?: string[];
  logPath?: string;
  alertThreshold?: number;
  rules?: IDSRule[];
}

export interface IDSRule {
  id: string;
  name: string;
  pattern: string;
  severity: Severity;
  description: string;
  enabled: boolean;
}

// --- Threat Intelligence Types ---
export interface ThreatIndicator {
  type: 'ip' | 'domain' | 'url' | 'hash';
  value: string;
  threat: boolean;
  riskScore: number;
  categories: string[];
  source: string;
  lastSeen?: Date;
  description?: string;
}

export interface ThreatIntelResult {
  query: string;
  indicators: ThreatIndicator[];
  overallRisk: RiskLevel;
  recommendations: string[];
}

// --- Dashboard / WebSocket Types ---
export interface DashboardStats {
  totalScans: number;
  totalFindings: number;
  criticalFindings: number;
  activeAlerts: number;
  systemStatus: 'healthy' | 'warning' | 'critical';
  modules: ModuleStatus[];
  recentScans: ScanResult[];
  threatLevel: RiskLevel;
}

export interface ModuleStatus {
  name: string;
  status: 'active' | 'inactive' | 'error';
  lastRun?: Date;
  findingsCount: number;
}

export interface WebSocketMessage {
  type: 'scan_result' | 'alert' | 'status_update' | 'stats';
  data: unknown;
  timestamp: Date;
}

// --- Configuration ---
export interface SecuritySuiteConfig {
  server: {
    port: number;
    host: string;
  };
  scanning: {
    defaultTimeout: number;
    maxConcurrency: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    file?: string;
  };
  modules: {
    networkScanner: boolean;
    sslAnalyzer: boolean;
    headerChecker: boolean;
    dnsChecker: boolean;
    passwordChecker: boolean;
    vulnScanner: boolean;
    malwareScanner: boolean;
    firewall: boolean;
    ids: boolean;
    threatIntel: boolean;
  };
}
