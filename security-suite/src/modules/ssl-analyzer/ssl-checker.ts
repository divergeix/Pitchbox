// ============================================================================
// SSL/TLS Analyzer - Certificate & Protocol Analysis
// ============================================================================

import * as tls from 'tls';
import * as https from 'https';
import { Logger } from '../../utils/logger';
import { CryptoUtils } from '../../utils/crypto-utils';
import {
  CertificateInfo,
  SSLScanResult,
  SSLScanOptions,
  SecurityFinding,
} from '../../types';

const logger = new Logger('SSLAnalyzer');

// Weak cipher suites that should be avoided
const WEAK_CIPHERS = [
  'RC4', 'DES', 'MD5', '3DES', 'NULL', 'EXPORT', 'anon',
  'RC2', 'IDEA', 'SEED', 'CAMELLIA128',
];

// Deprecated protocols
const DEPRECATED_PROTOCOLS = ['SSLv2', 'SSLv3', 'TLSv1', 'TLSv1.1'];

function extractCertInfo(cert: tls.PeerCertificate): CertificateInfo {
  const validFrom = new Date(cert.valid_from);
  const validTo = new Date(cert.valid_to);
  const now = new Date();
  const daysUntilExpiry = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const subjectEntries = cert.subject || {};
  const issuerEntries = cert.issuer || {};

  return {
    subject: subjectEntries as unknown as Record<string, string>,
    issuer: issuerEntries as unknown as Record<string, string>,
    validFrom,
    validTo,
    serialNumber: cert.serialNumber || '',
    fingerprint: cert.fingerprint || '',
    fingerprintSha256: cert.fingerprint256 || '',
    version: 3,
    signatureAlgorithm: '',
    keySize: cert.bits || 0,
    san: cert.subjectaltname ? cert.subjectaltname.split(', ').map(s => s.replace('DNS:', '')) : [],
    isExpired: now > validTo,
    daysUntilExpiry,
    isSelfSigned: JSON.stringify(cert.subject) === JSON.stringify(cert.issuer),
  };
}

async function checkProtocol(
  host: string,
  port: number,
  protocol: string,
  timeout: number
): Promise<boolean> {
  return new Promise((resolve) => {
    const minMax = protocol === 'TLSv1.3' ? 'TLSv1.3' :
                   protocol === 'TLSv1.2' ? 'TLSv1.2' :
                   protocol === 'TLSv1.1' ? 'TLSv1.1' :
                   protocol === 'TLSv1' ? 'TLSv1' : undefined;

    if (!minMax) {
      resolve(false);
      return;
    }

    try {
      const socket = tls.connect({
        host,
        port,
        minVersion: minMax as tls.SecureVersion,
        maxVersion: minMax as tls.SecureVersion,
        rejectUnauthorized: false,
        timeout,
      }, () => {
        socket.destroy();
        resolve(true);
      });

      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
    } catch {
      resolve(false);
    }
  });
}

export async function analyzeSSL(options: SSLScanOptions): Promise<SSLScanResult> {
  const { host, port = 443, timeout = 10000 } = options;
  const startTime = new Date();
  const findings: SecurityFinding[] = [];
  let certificate: CertificateInfo | null = null;
  let protocol = '';
  let cipher = '';
  let hasHSTS = false;

  logger.info(`Analyzing SSL/TLS for ${host}:${port}`);

  // Get certificate and connection info
  try {
    const certResult = await new Promise<{
      cert: CertificateInfo;
      protocol: string;
      cipher: string;
    }>((resolve, reject) => {
      const socket = tls.connect({
        host,
        port,
        rejectUnauthorized: false,
        timeout,
      }, () => {
        const peerCert = socket.getPeerCertificate();
        const proto = socket.getProtocol() || 'Unknown';
        const cipherInfo = socket.getCipher();

        const cert = extractCertInfo(peerCert);
        socket.destroy();
        resolve({
          cert,
          protocol: proto,
          cipher: cipherInfo ? cipherInfo.name : 'Unknown',
        });
      });

      socket.on('error', reject);
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Connection timed out'));
      });
    });

    certificate = certResult.cert;
    protocol = certResult.protocol;
    cipher = certResult.cipher;

    // Certificate findings
    if (certificate.isExpired) {
      findings.push({
        id: CryptoUtils.generateId(),
        module: 'SSL Analyzer',
        severity: 'critical',
        title: 'SSL certificate has expired',
        description: `Certificate expired on ${certificate.validTo.toISOString()}. Visitors will see security warnings.`,
        recommendation: 'Renew the SSL certificate immediately.',
        timestamp: new Date(),
      });
    } else if (certificate.daysUntilExpiry <= 30) {
      findings.push({
        id: CryptoUtils.generateId(),
        module: 'SSL Analyzer',
        severity: certificate.daysUntilExpiry <= 7 ? 'high' : 'medium',
        title: `SSL certificate expires in ${certificate.daysUntilExpiry} days`,
        description: `Certificate will expire on ${certificate.validTo.toISOString()}.`,
        recommendation: 'Renew the SSL certificate before it expires. Consider setting up auto-renewal.',
        timestamp: new Date(),
      });
    }

    if (certificate.isSelfSigned) {
      findings.push({
        id: CryptoUtils.generateId(),
        module: 'SSL Analyzer',
        severity: 'high',
        title: 'Self-signed certificate detected',
        description: 'The certificate is self-signed and will not be trusted by browsers.',
        recommendation: 'Obtain a certificate from a trusted Certificate Authority (CA). Consider Let\'s Encrypt for free certificates.',
        timestamp: new Date(),
      });
    }

    if (certificate.keySize < 2048) {
      findings.push({
        id: CryptoUtils.generateId(),
        module: 'SSL Analyzer',
        severity: 'high',
        title: `Weak key size: ${certificate.keySize} bits`,
        description: 'RSA keys smaller than 2048 bits are considered insecure.',
        recommendation: 'Generate a new certificate with at least 2048-bit (preferably 4096-bit) RSA key or use ECDSA.',
        timestamp: new Date(),
      });
    }

    // Cipher analysis
    const isWeakCipher = WEAK_CIPHERS.some(weak => cipher.toUpperCase().includes(weak));
    if (isWeakCipher) {
      findings.push({
        id: CryptoUtils.generateId(),
        module: 'SSL Analyzer',
        severity: 'high',
        title: `Weak cipher suite in use: ${cipher}`,
        description: 'The current cipher suite uses weak cryptographic algorithms.',
        recommendation: 'Configure the server to use only strong cipher suites (AES-GCM, ChaCha20-Poly1305).',
        timestamp: new Date(),
      });
    }

    // Protocol version check
    if (protocol === 'TLSv1' || protocol === 'TLSv1.1') {
      findings.push({
        id: CryptoUtils.generateId(),
        module: 'SSL Analyzer',
        severity: 'high',
        title: `Deprecated protocol version: ${protocol}`,
        description: `${protocol} is deprecated and has known vulnerabilities.`,
        recommendation: 'Configure the server to support only TLS 1.2 and TLS 1.3.',
        timestamp: new Date(),
      });
    }

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    findings.push({
      id: CryptoUtils.generateId(),
      module: 'SSL Analyzer',
      severity: 'critical',
      title: 'SSL/TLS connection failed',
      description: `Could not establish SSL/TLS connection: ${errMsg}`,
      recommendation: 'Verify that the server supports SSL/TLS and is accepting connections on the specified port.',
      timestamp: new Date(),
    });
  }

  // Check supported protocols
  const supportedProtocols: string[] = [];
  const protocolChecks = ['TLSv1', 'TLSv1.1', 'TLSv1.2', 'TLSv1.3'];

  for (const proto of protocolChecks) {
    try {
      const supported = await checkProtocol(host, port, proto, timeout);
      if (supported) {
        supportedProtocols.push(proto);
        if (DEPRECATED_PROTOCOLS.includes(proto)) {
          findings.push({
            id: CryptoUtils.generateId(),
            module: 'SSL Analyzer',
            severity: 'medium',
            title: `Deprecated protocol ${proto} is supported`,
            description: `The server still accepts connections using ${proto}, which has known vulnerabilities.`,
            recommendation: `Disable ${proto} support on the server.`,
            timestamp: new Date(),
          });
        }
      }
    } catch {
      // Protocol not supported
    }
  }

  if (!supportedProtocols.includes('TLSv1.3')) {
    findings.push({
      id: CryptoUtils.generateId(),
      module: 'SSL Analyzer',
      severity: 'low',
      title: 'TLS 1.3 is not supported',
      description: 'TLS 1.3 provides improved security and performance but is not enabled.',
      recommendation: 'Enable TLS 1.3 on the server for best security and performance.',
      timestamp: new Date(),
    });
  }

  // Check HSTS
  try {
    hasHSTS = await new Promise<boolean>((resolve) => {
      const req = https.get({
        hostname: host,
        port,
        path: '/',
        rejectUnauthorized: false,
        timeout: 5000,
      }, (res) => {
        const hstsHeader = res.headers['strict-transport-security'];
        resolve(!!hstsHeader);
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
    });

    if (!hasHSTS) {
      findings.push({
        id: CryptoUtils.generateId(),
        module: 'SSL Analyzer',
        severity: 'medium',
        title: 'HSTS header not set',
        description: 'HTTP Strict Transport Security header is not set, allowing downgrade attacks.',
        recommendation: 'Add the Strict-Transport-Security header with a long max-age (at least 31536000 seconds).',
        timestamp: new Date(),
      });
    }
  } catch {
    // Can't check HSTS
  }

  const endTime = new Date();
  const duration = endTime.getTime() - startTime.getTime();

  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const highCount = findings.filter(f => f.severity === 'high').length;

  return {
    module: 'SSL Analyzer',
    target: `${host}:${port}`,
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
      riskLevel: criticalCount > 0 ? 'critical' : highCount > 0 ? 'high' : findings.length > 0 ? 'medium' : 'safe',
    },
    raw: {
      host,
      port,
      certificate,
      protocol,
      cipher,
      supportedProtocols,
      hasHSTS,
    },
  };
}
