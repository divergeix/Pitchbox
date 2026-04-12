// ============================================================================
// HTTP Security Headers Checker
// ============================================================================

import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import { Logger } from '../../utils/logger';
import { CryptoUtils } from '../../utils/crypto-utils';
import {
  HeaderCheckResult,
  HeaderScanResult,
  HeaderScanOptions,
  SecurityFinding,
  Severity,
} from '../../types';

const logger = new Logger('HeaderChecker');

interface HeaderDefinition {
  name: string;
  severity: Severity;
  description: string;
  recommendation: string;
  validate?: (value: string) => { valid: boolean; message?: string };
}

const SECURITY_HEADERS: HeaderDefinition[] = [
  {
    name: 'Strict-Transport-Security',
    severity: 'high',
    description: 'HSTS ensures browsers only connect via HTTPS, preventing downgrade attacks.',
    recommendation: 'Add header: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
    validate: (value) => {
      const maxAge = value.match(/max-age=(\d+)/);
      if (!maxAge) return { valid: false, message: 'Missing max-age directive' };
      if (parseInt(maxAge[1]) < 31536000) return { valid: false, message: 'max-age should be at least 31536000 (1 year)' };
      if (!value.includes('includeSubDomains')) return { valid: false, message: 'Missing includeSubDomains directive' };
      return { valid: true };
    },
  },
  {
    name: 'Content-Security-Policy',
    severity: 'high',
    description: 'CSP prevents XSS attacks by controlling which resources can be loaded.',
    recommendation: "Add a strict Content-Security-Policy. Start with: Content-Security-Policy: default-src 'self'",
    validate: (value) => {
      if (value.includes("'unsafe-inline'")) return { valid: false, message: "Uses 'unsafe-inline' which weakens XSS protection" };
      if (value.includes("'unsafe-eval'")) return { valid: false, message: "Uses 'unsafe-eval' which allows code injection" };
      if (value.includes('*')) return { valid: false, message: 'Uses wildcard sources which weaken the policy' };
      return { valid: true };
    },
  },
  {
    name: 'X-Content-Type-Options',
    severity: 'medium',
    description: 'Prevents browsers from MIME-sniffing, reducing drive-by download attacks.',
    recommendation: 'Add header: X-Content-Type-Options: nosniff',
    validate: (value) => {
      if (value.toLowerCase() !== 'nosniff') return { valid: false, message: 'Value should be "nosniff"' };
      return { valid: true };
    },
  },
  {
    name: 'X-Frame-Options',
    severity: 'medium',
    description: 'Prevents clickjacking attacks by controlling framing of the page.',
    recommendation: 'Add header: X-Frame-Options: DENY (or SAMEORIGIN if framing is needed)',
    validate: (value) => {
      const upper = value.toUpperCase();
      if (upper !== 'DENY' && upper !== 'SAMEORIGIN') {
        return { valid: false, message: 'Value should be DENY or SAMEORIGIN' };
      }
      return { valid: true };
    },
  },
  {
    name: 'X-XSS-Protection',
    severity: 'low',
    description: 'Legacy XSS filter. Modern browsers use CSP instead, but it provides defense-in-depth.',
    recommendation: 'Add header: X-XSS-Protection: 0 (rely on CSP instead)',
  },
  {
    name: 'Referrer-Policy',
    severity: 'medium',
    description: 'Controls how much referrer information is sent with requests.',
    recommendation: 'Add header: Referrer-Policy: strict-origin-when-cross-origin',
    validate: (value) => {
      const valid = ['no-referrer', 'no-referrer-when-downgrade', 'origin', 'origin-when-cross-origin', 'same-origin', 'strict-origin', 'strict-origin-when-cross-origin'];
      if (!valid.includes(value.toLowerCase())) return { valid: false, message: 'Invalid or unsafe referrer policy' };
      return { valid: true };
    },
  },
  {
    name: 'Permissions-Policy',
    severity: 'medium',
    description: 'Controls which browser features and APIs can be used (replaces Feature-Policy).',
    recommendation: 'Add header: Permissions-Policy: camera=(), microphone=(), geolocation=()',
  },
  {
    name: 'Cross-Origin-Embedder-Policy',
    severity: 'low',
    description: 'Prevents loading cross-origin resources without explicit permission.',
    recommendation: 'Add header: Cross-Origin-Embedder-Policy: require-corp',
  },
  {
    name: 'Cross-Origin-Opener-Policy',
    severity: 'low',
    description: 'Isolates the browsing context to prevent cross-origin attacks.',
    recommendation: 'Add header: Cross-Origin-Opener-Policy: same-origin',
  },
  {
    name: 'Cross-Origin-Resource-Policy',
    severity: 'low',
    description: 'Controls which origins can read the resource.',
    recommendation: 'Add header: Cross-Origin-Resource-Policy: same-origin',
  },
];

// Headers that should NOT be present (information disclosure)
const HEADERS_TO_REMOVE = [
  { name: 'Server', severity: 'low' as Severity, description: 'Reveals web server software and version' },
  { name: 'X-Powered-By', severity: 'medium' as Severity, description: 'Reveals backend technology stack' },
  { name: 'X-AspNet-Version', severity: 'medium' as Severity, description: 'Reveals ASP.NET version' },
  { name: 'X-AspNetMvc-Version', severity: 'medium' as Severity, description: 'Reveals ASP.NET MVC version' },
  { name: 'Via', severity: 'low' as Severity, description: 'May reveal proxy infrastructure details' },
];

function calculateGrade(score: number, maxScore: number): string {
  const percentage = (score / maxScore) * 100;
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

export async function checkHeaders(options: HeaderScanOptions): Promise<HeaderScanResult> {
  const { url, timeout = 10000, followRedirects = true } = options;
  const startTime = new Date();
  const findings: SecurityFinding[] = [];
  const checks: HeaderCheckResult[] = [];
  let maxScore = 0;
  let score = 0;

  logger.info(`Checking security headers for ${url}`);

  let headers: Record<string, string> = {};
  let statusCode = 0;

  try {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const response = await new Promise<http.IncomingMessage>((resolve, reject) => {
      const req = client.get({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.pathname + parsedUrl.search,
        timeout,
        rejectUnauthorized: false,
        headers: {
          'User-Agent': 'SecuritySuite/1.0 Header-Checker',
        },
      }, (res) => {
        if (followRedirects && res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectUrl = new URL(res.headers.location, url);
          const redirectClient = redirectUrl.protocol === 'https:' ? https : http;
          const redirectReq = redirectClient.get({
            hostname: redirectUrl.hostname,
            port: redirectUrl.port,
            path: redirectUrl.pathname + redirectUrl.search,
            timeout,
            rejectUnauthorized: false,
          }, resolve);
          redirectReq.on('error', reject);
          redirectReq.on('timeout', () => { redirectReq.destroy(); reject(new Error('Redirect timed out')); });
        } else {
          resolve(res);
        }
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });
    });

    statusCode = response.statusCode || 0;

    // Normalize headers to lowercase keys
    for (const [key, value] of Object.entries(response.headers)) {
      headers[key.toLowerCase()] = Array.isArray(value) ? value.join(', ') : value || '';
    }

    // Check security headers
    for (const headerDef of SECURITY_HEADERS) {
      const headerKey = headerDef.name.toLowerCase();
      const headerValue = headers[headerKey];
      const present = !!headerValue;
      const weight = headerDef.severity === 'high' ? 3 : headerDef.severity === 'medium' ? 2 : 1;
      maxScore += weight;

      if (present) {
        let validationMsg: string | undefined;
        if (headerDef.validate) {
          const result = headerDef.validate(headerValue);
          if (result.valid) {
            score += weight;
          } else {
            score += Math.floor(weight / 2);
            validationMsg = result.message;
          }
        } else {
          score += weight;
        }

        checks.push({
          header: headerDef.name,
          present: true,
          value: headerValue,
          severity: 'info',
          description: validationMsg ? `Present but: ${validationMsg}` : 'Present and properly configured',
          recommendation: validationMsg ? headerDef.recommendation : 'No action needed',
        });

        if (validationMsg) {
          findings.push({
            id: CryptoUtils.generateId(),
            module: 'Header Checker',
            severity: 'low',
            title: `${headerDef.name} misconfigured`,
            description: validationMsg,
            recommendation: headerDef.recommendation,
            timestamp: new Date(),
          });
        }
      } else {
        checks.push({
          header: headerDef.name,
          present: false,
          severity: headerDef.severity,
          description: headerDef.description,
          recommendation: headerDef.recommendation,
        });

        findings.push({
          id: CryptoUtils.generateId(),
          module: 'Header Checker',
          severity: headerDef.severity,
          title: `Missing ${headerDef.name} header`,
          description: headerDef.description,
          recommendation: headerDef.recommendation,
          timestamp: new Date(),
        });
      }
    }

    // Check for information disclosure headers
    for (const badHeader of HEADERS_TO_REMOVE) {
      const headerKey = badHeader.name.toLowerCase();
      const headerValue = headers[headerKey];
      if (headerValue) {
        findings.push({
          id: CryptoUtils.generateId(),
          module: 'Header Checker',
          severity: badHeader.severity,
          title: `Information disclosure: ${badHeader.name} header present`,
          description: `${badHeader.description}. Value: "${headerValue}"`,
          recommendation: `Remove the ${badHeader.name} header to prevent information disclosure.`,
          timestamp: new Date(),
        });
      }
    }

    // Check for cookies without security flags
    const setCookie = headers['set-cookie'];
    if (setCookie) {
      if (!setCookie.toLowerCase().includes('secure')) {
        findings.push({
          id: CryptoUtils.generateId(),
          module: 'Header Checker',
          severity: 'medium',
          title: 'Cookie missing Secure flag',
          description: 'Cookies are set without the Secure flag, allowing transmission over HTTP.',
          recommendation: 'Add the Secure flag to all cookies.',
          timestamp: new Date(),
        });
      }
      if (!setCookie.toLowerCase().includes('httponly')) {
        findings.push({
          id: CryptoUtils.generateId(),
          module: 'Header Checker',
          severity: 'medium',
          title: 'Cookie missing HttpOnly flag',
          description: 'Cookies are set without the HttpOnly flag, making them accessible to JavaScript.',
          recommendation: 'Add the HttpOnly flag to session cookies.',
          timestamp: new Date(),
        });
      }
      if (!setCookie.toLowerCase().includes('samesite')) {
        findings.push({
          id: CryptoUtils.generateId(),
          module: 'Header Checker',
          severity: 'medium',
          title: 'Cookie missing SameSite attribute',
          description: 'Cookies are set without SameSite attribute, potentially vulnerable to CSRF.',
          recommendation: 'Add SameSite=Strict or SameSite=Lax to cookies.',
          timestamp: new Date(),
        });
      }
    }

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    findings.push({
      id: CryptoUtils.generateId(),
      module: 'Header Checker',
      severity: 'high',
      title: 'Failed to retrieve headers',
      description: `Could not connect to ${url}: ${errMsg}`,
      recommendation: 'Verify the URL is accessible and the server is running.',
      timestamp: new Date(),
    });
  }

  const grade = calculateGrade(score, maxScore || 1);
  const endTime = new Date();
  const duration = endTime.getTime() - startTime.getTime();

  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const highCount = findings.filter(f => f.severity === 'high').length;

  return {
    module: 'Header Checker',
    target: url,
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
      url,
      statusCode,
      headers,
      checks,
      score,
      maxScore,
      grade,
    },
  };
}
