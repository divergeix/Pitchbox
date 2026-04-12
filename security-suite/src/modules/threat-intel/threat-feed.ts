// ============================================================================
// Threat Intelligence - IP Reputation & Blocklist Checking
// ============================================================================

import * as dns from 'dns';
import * as https from 'https';
import { promisify } from 'util';
import { Logger } from '../../utils/logger';
import { CryptoUtils } from '../../utils/crypto-utils';
import { ThreatIndicator, ThreatIntelResult, SecurityFinding, RiskLevel } from '../../types';

const logger = new Logger('ThreatIntel');

const resolve4 = promisify(dns.resolve4);

// DNS-based blocklists (DNSBL)
const DNS_BLOCKLISTS = [
  { name: 'Spamhaus ZEN', zone: 'zen.spamhaus.org', type: 'spam/malware' },
  { name: 'Barracuda', zone: 'b.barracudacentral.org', type: 'spam' },
  { name: 'SpamCop', zone: 'bl.spamcop.net', type: 'spam' },
  { name: 'SORBS', zone: 'dnsbl.sorbs.net', type: 'spam/proxy' },
  { name: 'UCEPROTECT L1', zone: 'dnsbl-1.uceprotect.net', type: 'spam' },
];

// Known malicious IP ranges (private/reserved ranges that shouldn't appear in public traffic)
const SUSPICIOUS_RANGES = [
  { range: '0.0.0.0/8', description: 'Invalid source address' },
  { range: '100.64.0.0/10', description: 'Carrier-grade NAT' },
  { range: '169.254.0.0/16', description: 'Link-local address' },
  { range: '192.0.0.0/24', description: 'IANA reserved' },
  { range: '198.18.0.0/15', description: 'Benchmarking' },
  { range: '224.0.0.0/4', description: 'Multicast' },
  { range: '240.0.0.0/4', description: 'Reserved' },
];

function reverseIP(ip: string): string {
  return ip.split('.').reverse().join('.');
}

function ipToLong(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function cidrContains(cidr: string, ip: string): boolean {
  const [rangeIP, bits] = cidr.split('/');
  const mask = ~(Math.pow(2, 32 - parseInt(bits)) - 1) >>> 0;
  return (ipToLong(rangeIP) & mask) === (ipToLong(ip) & mask);
}

function isPrivateIP(ip: string): boolean {
  return cidrContains('10.0.0.0/8', ip) ||
         cidrContains('172.16.0.0/12', ip) ||
         cidrContains('192.168.0.0/16', ip) ||
         cidrContains('127.0.0.0/8', ip);
}

async function checkDNSBL(ip: string): Promise<ThreatIndicator[]> {
  const indicators: ThreatIndicator[] = [];
  const reversed = reverseIP(ip);

  for (const bl of DNS_BLOCKLISTS) {
    try {
      const lookup = `${reversed}.${bl.zone}`;
      await resolve4(lookup);
      // If it resolves, the IP is listed
      indicators.push({
        type: 'ip',
        value: ip,
        threat: true,
        riskScore: 70,
        categories: [bl.type],
        source: bl.name,
        description: `IP is listed on ${bl.name} blocklist`,
        lastSeen: new Date(),
      });
    } catch {
      // Not listed (NXDOMAIN), which is good
      indicators.push({
        type: 'ip',
        value: ip,
        threat: false,
        riskScore: 0,
        categories: [],
        source: bl.name,
        description: `Not listed on ${bl.name}`,
      });
    }
  }

  return indicators;
}

function checkSuspiciousRange(ip: string): ThreatIndicator | null {
  for (const range of SUSPICIOUS_RANGES) {
    if (cidrContains(range.range, ip)) {
      return {
        type: 'ip',
        value: ip,
        threat: true,
        riskScore: 80,
        categories: ['suspicious-range'],
        source: 'Internal',
        description: `IP belongs to ${range.description} range (${range.range})`,
      };
    }
  }
  return null;
}

export async function checkIPReputation(ip: string): Promise<ThreatIntelResult> {
  logger.info(`Checking IP reputation: ${ip}`);

  const indicators: ThreatIndicator[] = [];
  const recommendations: string[] = [];

  // Validate IP format
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(ip)) {
    return {
      query: ip,
      indicators: [{
        type: 'ip',
        value: ip,
        threat: false,
        riskScore: 0,
        categories: ['invalid'],
        source: 'Validation',
        description: 'Invalid IP address format',
      }],
      overallRisk: 'low',
      recommendations: ['Provide a valid IPv4 address'],
    };
  }

  // Check private IP
  if (isPrivateIP(ip)) {
    indicators.push({
      type: 'ip',
      value: ip,
      threat: false,
      riskScore: 0,
      categories: ['private'],
      source: 'Internal',
      description: 'This is a private/internal IP address',
    });
    return {
      query: ip,
      indicators,
      overallRisk: 'safe',
      recommendations: ['This is a private IP address. No external threat data available.'],
    };
  }

  // Check suspicious ranges
  const rangeResult = checkSuspiciousRange(ip);
  if (rangeResult) {
    indicators.push(rangeResult);
    recommendations.push(`Block traffic from ${ip} - it belongs to a suspicious IP range.`);
  }

  // Check DNS blocklists
  const dnsblResults = await checkDNSBL(ip);
  indicators.push(...dnsblResults);

  const listedCount = dnsblResults.filter(i => i.threat).length;
  if (listedCount > 0) {
    recommendations.push(`IP ${ip} is listed on ${listedCount} blocklist(s). Consider blocking this IP.`);
  }

  // Perform reverse DNS lookup
  try {
    const hostnames = await new Promise<string[]>((resolve, reject) => {
      dns.reverse(ip, (err, hostnames) => {
        if (err) reject(err);
        else resolve(hostnames);
      });
    });

    if (hostnames.length > 0) {
      indicators.push({
        type: 'ip',
        value: ip,
        threat: false,
        riskScore: 0,
        categories: ['dns'],
        source: 'Reverse DNS',
        description: `Reverse DNS: ${hostnames.join(', ')}`,
      });

      // Check for suspicious hostnames
      const suspiciousHostPatterns = [
        /(?:tor|proxy|vpn|anon)/i,
        /(?:bot|crawler|spider|scan)/i,
        /(?:\.ru|\.cn|\.kp)\./i,
      ];

      for (const hostname of hostnames) {
        for (const pattern of suspiciousHostPatterns) {
          if (pattern.test(hostname)) {
            indicators.push({
              type: 'ip',
              value: ip,
              threat: true,
              riskScore: 50,
              categories: ['suspicious-hostname'],
              source: 'Reverse DNS Analysis',
              description: `Suspicious hostname detected: ${hostname}`,
            });
            break;
          }
        }
      }
    }
  } catch {
    // No reverse DNS
  }

  // Calculate overall risk
  const maxRiskScore = Math.max(...indicators.map(i => i.riskScore), 0);
  const threatCount = indicators.filter(i => i.threat).length;

  let overallRisk: RiskLevel = 'safe';
  if (maxRiskScore >= 80 || threatCount >= 3) overallRisk = 'critical';
  else if (maxRiskScore >= 60 || threatCount >= 2) overallRisk = 'high';
  else if (maxRiskScore >= 40 || threatCount >= 1) overallRisk = 'medium';
  else if (maxRiskScore >= 20) overallRisk = 'low';

  if (overallRisk === 'safe') {
    recommendations.push('IP address appears clean. No threats detected.');
  }

  return {
    query: ip,
    indicators,
    overallRisk,
    recommendations,
  };
}

export async function checkDomainReputation(domain: string): Promise<ThreatIntelResult> {
  logger.info(`Checking domain reputation: ${domain}`);

  const indicators: ThreatIndicator[] = [];
  const recommendations: string[] = [];

  // Resolve domain to IP
  try {
    const ips = await resolve4(domain);

    if (ips.length > 0) {
      indicators.push({
        type: 'domain',
        value: domain,
        threat: false,
        riskScore: 0,
        categories: ['dns'],
        source: 'DNS Resolution',
        description: `Resolves to: ${ips.join(', ')}`,
      });

      // Check each IP
      for (const ip of ips) {
        const ipResult = await checkIPReputation(ip);
        for (const indicator of ipResult.indicators) {
          if (indicator.threat) {
            indicators.push({
              ...indicator,
              type: 'domain',
              value: domain,
              description: `Underlying IP (${ip}): ${indicator.description}`,
            });
          }
        }
      }
    }
  } catch {
    indicators.push({
      type: 'domain',
      value: domain,
      threat: false,
      riskScore: 10,
      categories: ['dns-error'],
      source: 'DNS Resolution',
      description: 'Domain does not resolve to any IP address',
    });
    recommendations.push('Domain does not resolve. It may be inactive or malicious.');
  }

  // Check for suspicious domain characteristics
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];

  // Check domain age indicators
  if (domain.length > 30) {
    indicators.push({
      type: 'domain',
      value: domain,
      threat: false,
      riskScore: 20,
      categories: ['suspicious-length'],
      source: 'Domain Analysis',
      description: 'Unusually long domain name',
    });
  }

  // Check for IP-like domain
  if (/^\d{1,3}[-\.]\d{1,3}[-\.]\d{1,3}[-\.]\d{1,3}/.test(domain)) {
    indicators.push({
      type: 'domain',
      value: domain,
      threat: true,
      riskScore: 40,
      categories: ['ip-based-domain'],
      source: 'Domain Analysis',
      description: 'Domain appears to be IP-based, which is often used by malicious actors',
    });
  }

  // Check for excessive hyphens (DGA indicator)
  const hyphenCount = (domain.match(/-/g) || []).length;
  if (hyphenCount > 3) {
    indicators.push({
      type: 'domain',
      value: domain,
      threat: false,
      riskScore: 30,
      categories: ['dga-suspect'],
      source: 'Domain Analysis',
      description: 'Domain has many hyphens, which can indicate domain generation algorithm (DGA)',
    });
  }

  const maxRiskScore = Math.max(...indicators.map(i => i.riskScore), 0);
  const threatCount = indicators.filter(i => i.threat).length;

  let overallRisk: RiskLevel = 'safe';
  if (maxRiskScore >= 80 || threatCount >= 3) overallRisk = 'critical';
  else if (maxRiskScore >= 60 || threatCount >= 2) overallRisk = 'high';
  else if (maxRiskScore >= 40 || threatCount >= 1) overallRisk = 'medium';
  else if (maxRiskScore >= 20) overallRisk = 'low';

  if (recommendations.length === 0) {
    recommendations.push(overallRisk === 'safe'
      ? 'Domain appears clean. No significant threats detected.'
      : 'Review the indicators above and consider blocking this domain if suspicious.');
  }

  return {
    query: domain,
    indicators,
    overallRisk,
    recommendations,
  };
}
