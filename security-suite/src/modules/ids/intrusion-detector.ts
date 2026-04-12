// ============================================================================
// Intrusion Detection System - Log Monitoring & Anomaly Detection
// ============================================================================

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger';
import { CryptoUtils } from '../../utils/crypto-utils';
import { IntrusionAlert, IDSStatus, IDSConfig, IDSRule, Severity } from '../../types';

const logger = new Logger('IDS');

// Default detection rules
const DEFAULT_RULES: IDSRule[] = [
  {
    id: 'ids-001',
    name: 'SSH Brute Force',
    pattern: 'Failed password.*ssh|authentication failure.*sshd',
    severity: 'high',
    description: 'Multiple failed SSH authentication attempts detected',
    enabled: true,
  },
  {
    id: 'ids-002',
    name: 'SQL Injection Attempt',
    pattern: "(?:UNION\\s+SELECT|OR\\s+1\\s*=\\s*1|'\\s*OR\\s*'|DROP\\s+TABLE|;\\s*DELETE|xp_cmdshell)",
    severity: 'critical',
    description: 'SQL injection pattern detected in request',
    enabled: true,
  },
  {
    id: 'ids-003',
    name: 'XSS Attack',
    pattern: '<script[^>]*>|javascript:|on(?:error|load|click|mouseover)\\s*=',
    severity: 'high',
    description: 'Cross-site scripting (XSS) pattern detected',
    enabled: true,
  },
  {
    id: 'ids-004',
    name: 'Directory Traversal',
    pattern: '(?:\\.\\.[\\/\\\\]){2,}|(?:%2e%2e[\\/\\\\])|(?:etc[\\/\\\\]passwd|etc[\\/\\\\]shadow)',
    severity: 'critical',
    description: 'Directory traversal attempt detected',
    enabled: true,
  },
  {
    id: 'ids-005',
    name: 'Command Injection',
    pattern: '(?:;|\\||`|\\$\\()\\s*(?:cat|ls|pwd|whoami|id|uname|wget|curl|nc|netcat)',
    severity: 'critical',
    description: 'OS command injection attempt detected',
    enabled: true,
  },
  {
    id: 'ids-006',
    name: 'Port Scan Detection',
    pattern: 'SYN.*DPT=(?:\\d+ ){5,}|port scan detected|scanlogd',
    severity: 'medium',
    description: 'Potential port scan activity detected',
    enabled: true,
  },
  {
    id: 'ids-007',
    name: 'Suspicious User Agent',
    pattern: '(?:sqlmap|nikto|nmap|masscan|dirbuster|gobuster|hydra|metasploit)',
    severity: 'high',
    description: 'Known attack tool user agent detected',
    enabled: true,
  },
  {
    id: 'ids-008',
    name: 'Failed Login Flood',
    pattern: '(?:authentication failed|invalid user|login failed)',
    severity: 'medium',
    description: 'Multiple failed login attempts detected',
    enabled: true,
  },
  {
    id: 'ids-009',
    name: 'Privilege Escalation',
    pattern: '(?:sudo.*FAILED|su.*authentication failure|COMMAND=.*\\/bin\\/(?:sh|bash))',
    severity: 'critical',
    description: 'Potential privilege escalation attempt detected',
    enabled: true,
  },
  {
    id: 'ids-010',
    name: 'Malware Communication',
    pattern: '(?:reverse shell|bind shell|meterpreter|c2 beacon|callback)',
    severity: 'critical',
    description: 'Potential malware command and control communication detected',
    enabled: true,
  },
  {
    id: 'ids-011',
    name: 'Data Exfiltration',
    pattern: '(?:base64.*pipe|curl.*POST.*-d|wget.*--post)',
    severity: 'high',
    description: 'Potential data exfiltration activity detected',
    enabled: true,
  },
  {
    id: 'ids-012',
    name: 'Unauthorized Access',
    pattern: '(?:403.*Forbidden|401.*Unauthorized){5,}|access denied.*repeated',
    severity: 'medium',
    description: 'Multiple unauthorized access attempts detected',
    enabled: true,
  },
];

export class IntrusionDetector extends EventEmitter {
  private running: boolean = false;
  private alerts: IntrusionAlert[] = [];
  private rules: IDSRule[];
  private watchers: fs.FSWatcher[] = [];
  private logPaths: string[];
  private alertThreshold: number;
  private alertCounts: Map<string, { count: number; firstSeen: Date }> = new Map();
  private startTime?: Date;

  constructor(config?: IDSConfig) {
    super();
    this.rules = config?.rules || DEFAULT_RULES;
    this.alertThreshold = config?.alertThreshold || 5;
    this.logPaths = config?.logPath ? [config.logPath] : this.getDefaultLogPaths();
  }

  private getDefaultLogPaths(): string[] {
    const paths: string[] = [];
    const possiblePaths = [
      '/var/log/auth.log',
      '/var/log/secure',
      '/var/log/syslog',
      '/var/log/messages',
      '/var/log/apache2/access.log',
      '/var/log/apache2/error.log',
      '/var/log/nginx/access.log',
      '/var/log/nginx/error.log',
      '/var/log/httpd/access_log',
      '/var/log/httpd/error_log',
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        paths.push(p);
      }
    }

    return paths;
  }

  start(): void {
    if (this.running) {
      logger.warn('IDS is already running');
      return;
    }

    this.running = true;
    this.startTime = new Date();
    logger.info('Intrusion Detection System started');
    logger.info(`Monitoring ${this.logPaths.length} log files`);
    logger.info(`${this.rules.filter(r => r.enabled).length} detection rules active`);

    // Watch each log file
    for (const logPath of this.logPaths) {
      this.watchLogFile(logPath);
    }

    this.emit('started');
  }

  stop(): void {
    if (!this.running) return;

    this.running = false;
    for (const watcher of this.watchers) {
      watcher.close();
    }
    this.watchers = [];
    logger.info('Intrusion Detection System stopped');
    this.emit('stopped');
  }

  private watchLogFile(logPath: string): void {
    try {
      let fileSize = 0;
      try {
        fileSize = fs.statSync(logPath).size;
      } catch {
        return;
      }

      const watcher = fs.watch(logPath, (eventType) => {
        if (eventType === 'change') {
          try {
            const newSize = fs.statSync(logPath).size;
            if (newSize > fileSize) {
              const stream = fs.createReadStream(logPath, {
                start: fileSize,
                end: newSize,
                encoding: 'utf-8',
              });

              let buffer = '';
              stream.on('data', (chunk) => {
                buffer += chunk;
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                  if (line.trim()) {
                    this.analyzeLine(line, logPath);
                  }
                }
              });

              fileSize = newSize;
            }
          } catch {
            // File might have been rotated
          }
        }
      });

      this.watchers.push(watcher);
      logger.info(`Watching: ${logPath}`);
    } catch (error) {
      logger.warn(`Cannot watch ${logPath}: ${error instanceof Error ? error.message : error}`);
    }
  }

  analyzeLine(line: string, source: string): IntrusionAlert | null {
    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      try {
        const regex = new RegExp(rule.pattern, 'i');
        if (regex.test(line)) {
          return this.createAlert(rule, line, source);
        }
      } catch {
        // Invalid regex pattern
      }
    }
    return null;
  }

  // Analyze arbitrary text (for API/manual analysis)
  analyzeText(text: string, source: string = 'manual'): IntrusionAlert[] {
    const alerts: IntrusionAlert[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.trim()) {
        const alert = this.analyzeLine(line, source);
        if (alert) alerts.push(alert);
      }
    }

    return alerts;
  }

  private createAlert(rule: IDSRule, rawLog: string, source: string): IntrusionAlert {
    // Rate limiting / flood detection
    const key = `${rule.id}:${source}`;
    const existing = this.alertCounts.get(key);
    const now = new Date();

    if (existing) {
      existing.count++;
      const timeDiff = now.getTime() - existing.firstSeen.getTime();
      if (existing.count >= this.alertThreshold && timeDiff < 60000) {
        // Escalate severity for flood
        rule = { ...rule, severity: 'critical' as Severity };
      }
    } else {
      this.alertCounts.set(key, { count: 1, firstSeen: now });
    }

    // Extract source IP if present
    const ipMatch = rawLog.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);

    const alert: IntrusionAlert = {
      id: CryptoUtils.generateId(),
      timestamp: now,
      severity: rule.severity,
      type: rule.name,
      source: ipMatch ? ipMatch[1] : source,
      description: rule.description,
      rawLog: rawLog.substring(0, 500), // Truncate long lines
      actionTaken: 'Alert generated',
    };

    this.alerts.push(alert);

    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    logger.warn(`ALERT [${rule.severity.toUpperCase()}] ${rule.name}: ${rule.description}`);
    this.emit('alert', alert);

    return alert;
  }

  getStatus(): IDSStatus {
    const alertsByType: Record<string, number> = {};
    for (const alert of this.alerts) {
      alertsByType[alert.type] = (alertsByType[alert.type] || 0) + 1;
    }

    return {
      running: this.running,
      monitoredInterfaces: this.logPaths,
      totalAlerts: this.alerts.length,
      alertsByType,
      recentAlerts: this.alerts.slice(-20),
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
    };
  }

  getAlerts(limit: number = 50): IntrusionAlert[] {
    return this.alerts.slice(-limit);
  }

  clearAlerts(): void {
    this.alerts = [];
    this.alertCounts.clear();
    logger.info('All alerts cleared');
  }

  addRule(rule: IDSRule): void {
    this.rules.push(rule);
    logger.info(`Rule added: ${rule.name}`);
  }

  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index === -1) return false;
    this.rules.splice(index, 1);
    return true;
  }

  getRules(): IDSRule[] {
    return [...this.rules];
  }
}
