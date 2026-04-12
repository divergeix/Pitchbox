// ============================================================================
// Firewall Manager - Rule Management & Monitoring
// ============================================================================

import { execSync } from 'child_process';
import { Logger } from '../../utils/logger';
import { CryptoUtils } from '../../utils/crypto-utils';
import { FirewallRule, FirewallStatus, SecurityFinding } from '../../types';

const logger = new Logger('FirewallManager');

// In-memory rule store (for cross-platform compatibility)
let managedRules: FirewallRule[] = [];

function isLinux(): boolean {
  return process.platform === 'linux';
}

function executeCommand(cmd: string): string {
  try {
    return execSync(cmd, { encoding: 'utf-8', timeout: 5000 });
  } catch (error) {
    const err = error as { stderr?: string; message?: string };
    return err.stderr || err.message || '';
  }
}

export function getFirewallStatus(): FirewallStatus {
  if (!isLinux()) {
    return {
      enabled: false,
      defaultPolicy: { input: 'UNKNOWN', output: 'UNKNOWN', forward: 'UNKNOWN' },
      rules: managedRules,
      totalRules: managedRules.length,
    };
  }

  try {
    const output = executeCommand('iptables -L -n --line-numbers 2>/dev/null || echo "NOT_AVAILABLE"');

    if (output.includes('NOT_AVAILABLE')) {
      return {
        enabled: false,
        defaultPolicy: { input: 'UNKNOWN', output: 'UNKNOWN', forward: 'UNKNOWN' },
        rules: managedRules,
        totalRules: managedRules.length,
      };
    }

    // Parse default policies
    const inputPolicy = output.match(/Chain INPUT \(policy (\w+)\)/)?.[1] || 'UNKNOWN';
    const outputPolicy = output.match(/Chain OUTPUT \(policy (\w+)\)/)?.[1] || 'UNKNOWN';
    const forwardPolicy = output.match(/Chain FORWARD \(policy (\w+)\)/)?.[1] || 'UNKNOWN';

    // Count rules
    const ruleLines = output.split('\n').filter(l => /^\d+/.test(l.trim()));

    return {
      enabled: true,
      defaultPolicy: {
        input: inputPolicy,
        output: outputPolicy,
        forward: forwardPolicy,
      },
      rules: managedRules,
      totalRules: ruleLines.length + managedRules.length,
    };
  } catch {
    return {
      enabled: false,
      defaultPolicy: { input: 'UNKNOWN', output: 'UNKNOWN', forward: 'UNKNOWN' },
      rules: managedRules,
      totalRules: managedRules.length,
    };
  }
}

export function addRule(rule: Omit<FirewallRule, 'id' | 'createdAt'>): FirewallRule {
  const newRule: FirewallRule = {
    ...rule,
    id: CryptoUtils.generateId(),
    createdAt: new Date(),
  };

  if (isLinux() && newRule.enabled) {
    const cmd = buildIptablesCommand(newRule, 'A');
    logger.info(`Applying firewall rule: ${cmd}`);
    executeCommand(cmd);
  }

  managedRules.push(newRule);
  logger.info(`Rule added: ${newRule.description} (${newRule.id})`);
  return newRule;
}

export function removeRule(ruleId: string): boolean {
  const ruleIndex = managedRules.findIndex(r => r.id === ruleId);
  if (ruleIndex === -1) return false;

  const rule = managedRules[ruleIndex];

  if (isLinux() && rule.enabled) {
    const cmd = buildIptablesCommand(rule, 'D');
    logger.info(`Removing firewall rule: ${cmd}`);
    executeCommand(cmd);
  }

  managedRules.splice(ruleIndex, 1);
  logger.info(`Rule removed: ${rule.description} (${ruleId})`);
  return true;
}

export function toggleRule(ruleId: string): FirewallRule | null {
  const rule = managedRules.find(r => r.id === ruleId);
  if (!rule) return null;

  if (isLinux()) {
    if (rule.enabled) {
      executeCommand(buildIptablesCommand(rule, 'D'));
    } else {
      executeCommand(buildIptablesCommand(rule, 'A'));
    }
  }

  rule.enabled = !rule.enabled;
  logger.info(`Rule ${rule.enabled ? 'enabled' : 'disabled'}: ${rule.description}`);
  return rule;
}

function buildIptablesCommand(rule: FirewallRule, action: 'A' | 'D'): string {
  let cmd = `iptables -${action} ${rule.chain}`;

  if (rule.protocol !== 'all') {
    cmd += ` -p ${rule.protocol}`;
  }

  if (rule.source) {
    cmd += ` -s ${rule.source}`;
  }

  if (rule.destination) {
    cmd += ` -d ${rule.destination}`;
  }

  if (rule.port) {
    cmd += ` --dport ${rule.port}`;
  }

  cmd += ` -j ${rule.action}`;

  return cmd;
}

export function getRecommendedRules(): FirewallRule[] {
  return [
    {
      id: 'rec-1',
      chain: 'INPUT',
      action: 'ACCEPT',
      protocol: 'all',
      source: '127.0.0.1',
      description: 'Allow loopback traffic',
      enabled: true,
      createdAt: new Date(),
    },
    {
      id: 'rec-2',
      chain: 'INPUT',
      action: 'ACCEPT',
      protocol: 'tcp',
      port: 22,
      description: 'Allow SSH access',
      enabled: true,
      createdAt: new Date(),
    },
    {
      id: 'rec-3',
      chain: 'INPUT',
      action: 'ACCEPT',
      protocol: 'tcp',
      port: 80,
      description: 'Allow HTTP traffic',
      enabled: true,
      createdAt: new Date(),
    },
    {
      id: 'rec-4',
      chain: 'INPUT',
      action: 'ACCEPT',
      protocol: 'tcp',
      port: 443,
      description: 'Allow HTTPS traffic',
      enabled: true,
      createdAt: new Date(),
    },
    {
      id: 'rec-5',
      chain: 'INPUT',
      action: 'DROP',
      protocol: 'tcp',
      port: 23,
      description: 'Block Telnet',
      enabled: true,
      createdAt: new Date(),
    },
    {
      id: 'rec-6',
      chain: 'INPUT',
      action: 'DROP',
      protocol: 'tcp',
      port: '135-139',
      description: 'Block NetBIOS',
      enabled: true,
      createdAt: new Date(),
    },
    {
      id: 'rec-7',
      chain: 'INPUT',
      action: 'DROP',
      protocol: 'tcp',
      port: 445,
      description: 'Block SMB',
      enabled: true,
      createdAt: new Date(),
    },
    {
      id: 'rec-8',
      chain: 'INPUT',
      action: 'DROP',
      protocol: 'tcp',
      port: 3389,
      description: 'Block RDP (if not needed)',
      enabled: true,
      createdAt: new Date(),
    },
  ];
}

export function auditFirewall(): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const status = getFirewallStatus();

  if (!status.enabled) {
    findings.push({
      id: CryptoUtils.generateId(),
      module: 'Firewall',
      severity: 'critical',
      title: 'Firewall is not active',
      description: 'No firewall is currently running. The system is exposed to all network traffic.',
      recommendation: 'Enable and configure iptables/nftables firewall with appropriate rules.',
      timestamp: new Date(),
    });
    return findings;
  }

  // Check default policies
  if (status.defaultPolicy.input === 'ACCEPT') {
    findings.push({
      id: CryptoUtils.generateId(),
      module: 'Firewall',
      severity: 'high',
      title: 'Default INPUT policy is ACCEPT',
      description: 'The default INPUT chain policy accepts all traffic. This means any port without an explicit DROP rule is accessible.',
      recommendation: 'Set default INPUT policy to DROP and explicitly allow only needed ports.',
      timestamp: new Date(),
    });
  }

  if (status.defaultPolicy.forward === 'ACCEPT') {
    findings.push({
      id: CryptoUtils.generateId(),
      module: 'Firewall',
      severity: 'medium',
      title: 'Default FORWARD policy is ACCEPT',
      description: 'The default FORWARD policy accepts all traffic, allowing the system to route packets.',
      recommendation: 'Set default FORWARD policy to DROP unless this is a router/gateway.',
      timestamp: new Date(),
    });
  }

  if (status.totalRules === 0) {
    findings.push({
      id: CryptoUtils.generateId(),
      module: 'Firewall',
      severity: 'high',
      title: 'No firewall rules configured',
      description: 'The firewall has no rules configured, effectively providing no protection.',
      recommendation: 'Configure firewall rules to control inbound and outbound traffic.',
      timestamp: new Date(),
    });
  }

  return findings;
}
