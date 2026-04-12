// ============================================================================
// DNS Security Checker - DNS Records & Email Security Analysis
// ============================================================================

import * as dns from 'dns';
import { promisify } from 'util';
import { Logger } from '../../utils/logger';
import { CryptoUtils } from '../../utils/crypto-utils';
import {
  DNSRecord,
  DNSScanResult,
  DNSScanOptions,
  SecurityFinding,
} from '../../types';

const logger = new Logger('DNSChecker');

const resolve4 = promisify(dns.resolve4);
const resolve6 = promisify(dns.resolve6);
const resolveMx = promisify(dns.resolveMx);
const resolveNs = promisify(dns.resolveNs);
const resolveTxt = promisify(dns.resolveTxt);
const resolveCname = promisify(dns.resolveCname);
const resolveSoa = promisify(dns.resolveSoa);

async function safeResolve<T>(fn: () => Promise<T>, defaultValue: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return defaultValue;
  }
}

export async function checkDNS(options: DNSScanOptions): Promise<DNSScanResult> {
  const { domain, checkDNSSEC = true } = options;
  const startTime = new Date();
  const findings: SecurityFinding[] = [];
  const records: DNSRecord[] = [];

  logger.info(`Checking DNS security for ${domain}`);

  // Resolve A records
  const aRecords = await safeResolve(() => resolve4(domain), [] as string[]);
  for (const ip of aRecords) {
    records.push({ type: 'A', name: domain, value: ip, ttl: 0 });
  }

  // Resolve AAAA records
  const aaaaRecords = await safeResolve(() => resolve6(domain), [] as string[]);
  for (const ip of aaaaRecords) {
    records.push({ type: 'AAAA', name: domain, value: ip, ttl: 0 });
  }

  if (aaaaRecords.length === 0) {
    findings.push({
      id: CryptoUtils.generateId(),
      module: 'DNS Checker',
      severity: 'low',
      title: 'No IPv6 (AAAA) records found',
      description: 'The domain does not have IPv6 records configured.',
      recommendation: 'Consider adding AAAA records for IPv6 connectivity.',
      timestamp: new Date(),
    });
  }

  // Resolve NS records
  const nsRecords = await safeResolve(() => resolveNs(domain), [] as string[]);
  for (const ns of nsRecords) {
    records.push({ type: 'NS', name: domain, value: ns, ttl: 0 });
  }

  if (nsRecords.length < 2) {
    findings.push({
      id: CryptoUtils.generateId(),
      module: 'DNS Checker',
      severity: 'medium',
      title: 'Insufficient nameservers',
      description: `Only ${nsRecords.length} nameserver(s) found. At least 2 are recommended for redundancy.`,
      recommendation: 'Add at least 2 geographically distributed nameservers for reliability.',
      timestamp: new Date(),
    });
  }

  // Resolve MX records
  const mxRecords = await safeResolve(() => resolveMx(domain), [] as dns.MxRecord[]);
  const mxValues = mxRecords.map(r => r.exchange);
  for (const mx of mxRecords) {
    records.push({ type: 'MX', name: domain, value: `${mx.priority} ${mx.exchange}`, ttl: 0 });
  }

  // Resolve TXT records
  const txtRecords = await safeResolve(() => resolveTxt(domain), [] as string[][]);
  const flatTxt = txtRecords.map(r => r.join(''));
  for (const txt of flatTxt) {
    records.push({ type: 'TXT', name: domain, value: txt, ttl: 0 });
  }

  // Check SPF
  const spfRecord = flatTxt.find(t => t.startsWith('v=spf1'));
  const hasSPF = !!spfRecord;

  if (!hasSPF) {
    findings.push({
      id: CryptoUtils.generateId(),
      module: 'DNS Checker',
      severity: 'high',
      title: 'Missing SPF record',
      description: 'No SPF (Sender Policy Framework) record found. Email spoofing is possible.',
      recommendation: 'Add an SPF TXT record. Example: v=spf1 include:_spf.google.com -all',
      timestamp: new Date(),
    });
  } else {
    // Validate SPF
    if (spfRecord.includes('+all') || spfRecord.includes('?all')) {
      findings.push({
        id: CryptoUtils.generateId(),
        module: 'DNS Checker',
        severity: 'high',
        title: 'Weak SPF policy',
        description: 'SPF record uses +all or ?all which allows any server to send email for this domain.',
        recommendation: 'Change SPF policy to use -all (hard fail) or ~all (soft fail).',
        timestamp: new Date(),
      });
    }

    // Check for too many DNS lookups in SPF
    const lookupMechanisms = (spfRecord.match(/(include:|a:|mx:|ptr:|redirect=)/g) || []).length;
    if (lookupMechanisms > 10) {
      findings.push({
        id: CryptoUtils.generateId(),
        module: 'DNS Checker',
        severity: 'medium',
        title: 'SPF record exceeds 10 DNS lookup limit',
        description: `SPF record has ${lookupMechanisms} DNS lookups. RFC 7208 limits to 10.`,
        recommendation: 'Flatten SPF record or reduce the number of includes.',
        timestamp: new Date(),
      });
    }
  }

  // Check DMARC
  const dmarcRecords = await safeResolve(() => resolveTxt(`_dmarc.${domain}`), [] as string[][]);
  const dmarcFlat = dmarcRecords.map(r => r.join(''));
  const dmarcRecord = dmarcFlat.find(t => t.startsWith('v=DMARC1'));
  const hasDMARC = !!dmarcRecord;

  if (!hasDMARC) {
    findings.push({
      id: CryptoUtils.generateId(),
      module: 'DNS Checker',
      severity: 'high',
      title: 'Missing DMARC record',
      description: 'No DMARC record found. Domain is vulnerable to email spoofing and phishing.',
      recommendation: 'Add a DMARC TXT record at _dmarc.yourdomain.com. Example: v=DMARC1; p=reject; rua=mailto:dmarc@yourdomain.com',
      timestamp: new Date(),
    });
  } else {
    // Check DMARC policy
    const policyMatch = dmarcRecord.match(/p=(none|quarantine|reject)/);
    if (policyMatch && policyMatch[1] === 'none') {
      findings.push({
        id: CryptoUtils.generateId(),
        module: 'DNS Checker',
        severity: 'medium',
        title: 'DMARC policy set to "none"',
        description: 'DMARC is configured but not enforcing. Spoofed emails will still be delivered.',
        recommendation: 'Gradually move DMARC policy from p=none to p=quarantine, then p=reject.',
        timestamp: new Date(),
      });
    }

    if (!dmarcRecord.includes('rua=')) {
      findings.push({
        id: CryptoUtils.generateId(),
        module: 'DNS Checker',
        severity: 'low',
        title: 'DMARC missing aggregate report address',
        description: 'No rua= tag in DMARC record. You won\'t receive DMARC aggregate reports.',
        recommendation: 'Add rua=mailto:dmarc-reports@yourdomain.com to your DMARC record.',
        timestamp: new Date(),
      });
    }
  }

  // Check DKIM
  const dkimSelectors = ['default', 'google', 'selector1', 'selector2', 'k1', 'mail', 'dkim'];
  let hasDKIM = false;
  for (const selector of dkimSelectors) {
    const dkimRecords = await safeResolve(() => resolveTxt(`${selector}._domainkey.${domain}`), [] as string[][]);
    const dkimFlat = dkimRecords.map(r => r.join(''));
    if (dkimFlat.some(t => t.includes('v=DKIM1') || t.includes('p='))) {
      hasDKIM = true;
      records.push({ type: 'TXT', name: `${selector}._domainkey.${domain}`, value: dkimFlat[0], ttl: 0 });
      break;
    }
  }

  if (!hasDKIM) {
    findings.push({
      id: CryptoUtils.generateId(),
      module: 'DNS Checker',
      severity: 'medium',
      title: 'No DKIM record found',
      description: 'Could not find DKIM records for common selectors. Email authentication may be incomplete.',
      recommendation: 'Configure DKIM signing for your email service and publish the public key as a DNS TXT record.',
      timestamp: new Date(),
    });
  }

  // Check SOA record
  const soaRecord = await safeResolve(() => resolveSoa(domain), null as dns.SoaRecord | null);
  if (soaRecord) {
    records.push({
      type: 'SOA',
      name: domain,
      value: `${soaRecord.nsname} ${soaRecord.hostmaster}`,
      ttl: soaRecord.minttl,
    });
  }

  // Check CNAME
  const cnameRecords = await safeResolve(() => resolveCname(domain), [] as string[]);
  for (const cname of cnameRecords) {
    records.push({ type: 'CNAME', name: domain, value: cname, ttl: 0 });
  }

  // Check for dangling CNAME (potential subdomain takeover indicator)
  if (cnameRecords.length > 0) {
    for (const cname of cnameRecords) {
      const cnameResolved = await safeResolve(() => resolve4(cname), [] as string[]);
      if (cnameResolved.length === 0) {
        findings.push({
          id: CryptoUtils.generateId(),
          module: 'DNS Checker',
          severity: 'high',
          title: 'Dangling CNAME detected',
          description: `CNAME ${cname} does not resolve. This could indicate a subdomain takeover vulnerability.`,
          recommendation: 'Remove the dangling CNAME record or ensure the target is properly configured.',
          timestamp: new Date(),
        });
      }
    }
  }

  // Check CAA records
  const caaRecords = await safeResolve(
    () => new Promise<dns.AnyRecord[]>((resolve, reject) => {
      dns.resolveAny(domain, (err, records) => err ? reject(err) : resolve(records));
    }),
    [] as dns.AnyRecord[]
  );

  const hasCAARecords = caaRecords.some((r: any) => r.type === 'CAA');
  if (!hasCAARecords) {
    findings.push({
      id: CryptoUtils.generateId(),
      module: 'DNS Checker',
      severity: 'low',
      title: 'No CAA records found',
      description: 'No Certificate Authority Authorization records. Any CA can issue certificates for this domain.',
      recommendation: 'Add CAA records to restrict which CAs can issue certificates for your domain.',
      timestamp: new Date(),
    });
  }

  const endTime = new Date();
  const duration = endTime.getTime() - startTime.getTime();

  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const highCount = findings.filter(f => f.severity === 'high').length;

  return {
    module: 'DNS Checker',
    target: domain,
    startTime,
    endTime,
    duration,
    findings,
    summary: {
      totalFindings: findings.length,
      critical: criticalCount,
      high: highCount,
      medium: findings.filter(f => f.severity === 'medium').length,
      low: findings.filter(f => f.severity === 'low').length,
      info: findings.filter(f => f.severity === 'info').length,
      riskLevel: criticalCount > 0 ? 'critical' : highCount > 0 ? 'high' : findings.length > 3 ? 'medium' : 'low',
    },
    raw: {
      domain,
      records,
      hasDNSSEC: false, // Would need DNSSEC-specific resolver
      hasSPF,
      hasDMARC,
      hasDKIM,
      nameservers: nsRecords,
      mxRecords: mxValues,
    },
  };
}
