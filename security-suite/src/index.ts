#!/usr/bin/env node
// ============================================================================
// Security Suite - Main Entry Point & CLI Interface
// ============================================================================

import { Command } from 'commander';
import { Logger } from './utils/logger';
import { Reporter } from './utils/reporter';
import { createServer } from './server';
import { scanNetwork } from './modules/network-scanner/port-scanner';
import { analyzeSSL } from './modules/ssl-analyzer/ssl-checker';
import { checkHeaders } from './modules/header-analyzer/header-checker';
import { checkDNS } from './modules/dns-security/dns-checker';
import { analyzePassword, checkBreach, generateSecurePassword } from './modules/password-security/password-checker';
import { scanVulnerabilities } from './modules/vulnerability-scanner/vuln-scanner';
import { scanMalware } from './modules/malware-scanner/malware-scanner';
import { auditFirewall, getFirewallStatus, getRecommendedRules } from './modules/firewall/firewall-manager';
import { IntrusionDetector } from './modules/ids/intrusion-detector';
import { checkIPReputation, checkDomainReputation } from './modules/threat-intel/threat-feed';
import { loadConfig } from './config';

const logger = new Logger('Main');
const program = new Command();

program
  .name('security-suite')
  .description('Comprehensive Internet Security Software Suite')
  .version('1.0.0');

// --- Dashboard Command ---
program
  .command('dashboard')
  .description('Start the web dashboard and API server')
  .option('-p, --port <port>', 'Server port', '3000')
  .option('-h, --host <host>', 'Server host', '127.0.0.1')
  .action((opts) => {
    createServer(parseInt(opts.port), opts.host);
  });

// --- Network Scan Command ---
program
  .command('scan:network <host>')
  .description('Scan network ports on a target host')
  .option('-p, --ports <ports>', 'Ports to scan (e.g., 80,443 or 1-1024)')
  .option('-t, --timeout <ms>', 'Timeout per port', '3000')
  .option('-c, --concurrency <n>', 'Concurrent connections', '50')
  .action(async (host, opts) => {
    logger.banner('Network Scanner');
    const result = await scanNetwork({
      host,
      ports: opts.ports,
      timeout: parseInt(opts.timeout),
      concurrency: parseInt(opts.concurrency),
    });
    printResult(result);
  });

// --- SSL Scan Command ---
program
  .command('scan:ssl <host>')
  .description('Analyze SSL/TLS configuration')
  .option('-p, --port <port>', 'Port number', '443')
  .action(async (host, opts) => {
    logger.banner('SSL/TLS Analyzer');
    const result = await analyzeSSL({ host, port: parseInt(opts.port) });
    printResult(result);
    if (result.raw.certificate) {
      const cert = result.raw.certificate;
      console.log('\n  Certificate Details:');
      console.log(`  Subject:     ${JSON.stringify(cert.subject)}`);
      console.log(`  Issuer:      ${JSON.stringify(cert.issuer)}`);
      console.log(`  Valid Until:  ${cert.validTo}`);
      console.log(`  Days Left:   ${cert.daysUntilExpiry}`);
      console.log(`  Key Size:    ${cert.keySize} bits`);
      console.log(`  Self-Signed: ${cert.isSelfSigned}`);
      console.log(`  Protocol:    ${result.raw.protocol}`);
      console.log(`  Cipher:      ${result.raw.cipher}`);
      console.log(`  Protocols:   ${result.raw.supportedProtocols.join(', ')}`);
      console.log(`  HSTS:        ${result.raw.hasHSTS}`);
    }
  });

// --- Header Check Command ---
program
  .command('scan:headers <url>')
  .description('Check HTTP security headers')
  .action(async (url) => {
    logger.banner('HTTP Security Headers');
    const result = await checkHeaders({ url });
    printResult(result);
    console.log(`\n  Grade: ${result.raw.grade} (${result.raw.score}/${result.raw.maxScore})`);
    console.log('\n  Header Status:');
    for (const check of result.raw.checks) {
      const icon = check.present ? '\x1b[32m+\x1b[0m' : '\x1b[31m-\x1b[0m';
      console.log(`  ${icon} ${check.header.padEnd(35)} ${check.present ? check.value?.substring(0, 50) || 'Present' : 'MISSING'}`);
    }
  });

// --- DNS Check Command ---
program
  .command('scan:dns <domain>')
  .description('Check DNS security configuration')
  .action(async (domain) => {
    logger.banner('DNS Security Checker');
    const result = await checkDNS({ domain });
    printResult(result);
    console.log(`\n  SPF:   ${result.raw.hasSPF ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m'}`);
    console.log(`  DMARC: ${result.raw.hasDMARC ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m'}`);
    console.log(`  DKIM:  ${result.raw.hasDKIM ? '\x1b[32mYes\x1b[0m' : '\x1b[31mNo\x1b[0m'}`);
    console.log(`  NS:    ${result.raw.nameservers.join(', ')}`);
    console.log(`  MX:    ${result.raw.mxRecords.join(', ') || 'None'}`);
  });

// --- Vulnerability Scan Command ---
program
  .command('scan:vuln <target>')
  .description('Scan target for web vulnerabilities')
  .option('-c, --categories <cats>', 'Comma-separated categories')
  .action(async (target, opts) => {
    logger.banner('Vulnerability Scanner');
    const categories = opts.categories?.split(',');
    const result = await scanVulnerabilities({ target, categories });
    printResult(result);
  });

// --- Malware Scan Command ---
program
  .command('scan:malware <path>')
  .description('Scan files for malware and suspicious content')
  .option('--no-recursive', 'Do not scan subdirectories')
  .option('--no-signatures', 'Skip signature-based detection')
  .action(async (scanPath, opts) => {
    logger.banner('Malware & File Integrity Scanner');
    const result = await scanMalware({
      path: scanPath,
      recursive: opts.recursive !== false,
      checkSignatures: opts.signatures !== false,
    });
    printResult(result);
    console.log(`\n  Files Scanned:    ${result.raw.scannedFiles}`);
    console.log(`  Clean Files:      ${result.raw.cleanFiles}`);
    console.log(`  Suspicious Files: ${result.raw.suspiciousFiles.length}`);
    console.log(`  Skipped Files:    ${result.raw.skippedFiles}`);
  });

// --- Password Commands ---
program
  .command('password:check <password>')
  .description('Analyze password strength')
  .action(async (password) => {
    logger.banner('Password Security');
    const result = analyzePassword(password);
    console.log(`  Strength:   ${result.strength} (${result.score}/100)`);
    console.log(`  Entropy:    ${result.entropy} bits`);
    console.log(`  Crack Time: ${result.crackTime}`);
    console.log(`  Length:     ${result.length}`);
    console.log(`  Uppercase:  ${result.hasUppercase ? 'Yes' : 'No'}`);
    console.log(`  Lowercase:  ${result.hasLowercase ? 'Yes' : 'No'}`);
    console.log(`  Numbers:    ${result.hasNumbers ? 'Yes' : 'No'}`);
    console.log(`  Symbols:    ${result.hasSymbols ? 'Yes' : 'No'}`);
    if (result.suggestions.length > 0) {
      console.log('\n  Suggestions:');
      result.suggestions.forEach(s => console.log(`    - ${s}`));
    }

    // Breach check
    console.log('\n  Checking breach database...');
    const breach = await checkBreach(password);
    if (breach.breached) {
      console.log(`\x1b[31m  WARNING: Password found in ${breach.occurrences.toLocaleString()} data breaches!\x1b[0m`);
    } else if (breach.occurrences === -1) {
      console.log('  Could not reach breach database.');
    } else {
      console.log('\x1b[32m  Password not found in known breaches.\x1b[0m');
    }
  });

program
  .command('password:generate')
  .description('Generate a secure password')
  .option('-l, --length <length>', 'Password length', '20')
  .action((opts) => {
    const password = generateSecurePassword(parseInt(opts.length));
    const analysis = analyzePassword(password);
    console.log(`\n  Generated Password: ${password}`);
    console.log(`  Strength: ${analysis.strength} (${analysis.score}/100)`);
    console.log(`  Entropy:  ${analysis.entropy} bits`);
  });

// --- Firewall Commands ---
program
  .command('firewall:status')
  .description('Show firewall status')
  .action(() => {
    logger.banner('Firewall Manager');
    const status = getFirewallStatus();
    console.log(`  Status:          ${status.enabled ? '\x1b[32mActive\x1b[0m' : '\x1b[31mInactive\x1b[0m'}`);
    console.log(`  Input Policy:    ${status.defaultPolicy.input}`);
    console.log(`  Output Policy:   ${status.defaultPolicy.output}`);
    console.log(`  Forward Policy:  ${status.defaultPolicy.forward}`);
    console.log(`  Total Rules:     ${status.totalRules}`);
  });

program
  .command('firewall:audit')
  .description('Audit firewall configuration')
  .action(() => {
    logger.banner('Firewall Audit');
    const findings = auditFirewall();
    if (findings.length === 0) {
      console.log('\x1b[32m  No issues found. Firewall appears properly configured.\x1b[0m');
    } else {
      printFindings(findings);
    }
  });

// --- Threat Intel Commands ---
program
  .command('threat:ip <ip>')
  .description('Check IP address reputation')
  .action(async (ip) => {
    logger.banner('Threat Intelligence - IP Check');
    const result = await checkIPReputation(ip);
    console.log(`  Overall Risk: ${riskColor(result.overallRisk)}`);
    console.log(`  Indicators:   ${result.indicators.length}`);
    console.log(`  Threats:      ${result.indicators.filter(i => i.threat).length}`);
    console.log('');
    for (const i of result.indicators) {
      const icon = i.threat ? '\x1b[31m[!]\x1b[0m' : '\x1b[32m[+]\x1b[0m';
      console.log(`  ${icon} ${i.source.padEnd(25)} ${i.description}`);
    }
    if (result.recommendations.length > 0) {
      console.log('\n  Recommendations:');
      result.recommendations.forEach(r => console.log(`    - ${r}`));
    }
  });

program
  .command('threat:domain <domain>')
  .description('Check domain reputation')
  .action(async (domain) => {
    logger.banner('Threat Intelligence - Domain Check');
    const result = await checkDomainReputation(domain);
    console.log(`  Overall Risk: ${riskColor(result.overallRisk)}`);
    for (const i of result.indicators) {
      const icon = i.threat ? '\x1b[31m[!]\x1b[0m' : '\x1b[32m[+]\x1b[0m';
      console.log(`  ${icon} ${i.source.padEnd(25)} ${i.description}`);
    }
    if (result.recommendations.length > 0) {
      console.log('\n  Recommendations:');
      result.recommendations.forEach(r => console.log(`    - ${r}`));
    }
  });

// --- Full Scan Command ---
program
  .command('scan:full <target>')
  .description('Run a comprehensive security scan on a target')
  .option('-o, --output <file>', 'Save report to file')
  .option('-f, --format <format>', 'Report format (text, json, html)', 'text')
  .action(async (target, opts) => {
    logger.banner('Full Security Scan');
    console.log(`  Target: ${target}\n`);

    const reporter = new Reporter();
    const isURL = target.startsWith('http://') || target.startsWith('https://');
    const domain = isURL ? new URL(target).hostname : target;
    const url = isURL ? target : `https://${target}`;

    const modules = [
      { name: 'Network Scan', fn: () => scanNetwork({ host: domain, timeout: 5000 }) },
      { name: 'SSL/TLS Analysis', fn: () => analyzeSSL({ host: domain }) },
      { name: 'Header Check', fn: () => checkHeaders({ url }) },
      { name: 'DNS Security', fn: () => checkDNS({ domain }) },
      { name: 'Vulnerability Scan', fn: () => scanVulnerabilities({ target: url }) },
    ];

    for (const mod of modules) {
      process.stdout.write(`  Running ${mod.name}...`);
      try {
        const result = await mod.fn();
        reporter.addResult(result);
        console.log(` ${result.findings.length} findings`);
      } catch (e) {
        console.log(' failed');
      }
    }

    console.log('\n' + reporter.generateTextReport());

    if (opts.output) {
      reporter.saveReport(opts.output, opts.format);
      console.log(`\n  Report saved to: ${opts.output}`);
    }
  });

// --- Helper functions ---
function printResult(result: any): void {
  console.log(`\n  Target:   ${result.target}`);
  console.log(`  Duration: ${result.duration}ms`);
  console.log(`  Findings: ${result.summary.totalFindings}`);
  console.log(`  Risk:     ${riskColor(result.summary.riskLevel)}`);

  if (result.findings.length > 0) {
    console.log('\n  Findings:');
    printFindings(result.findings);
  } else {
    console.log('\n\x1b[32m  No issues found!\x1b[0m');
  }
}

function printFindings(findings: any[]): void {
  for (const f of findings) {
    const colors: Record<string, string> = {
      critical: '\x1b[31m',
      high: '\x1b[33m',
      medium: '\x1b[33m',
      low: '\x1b[36m',
      info: '\x1b[90m',
    };
    const color = colors[f.severity] || '\x1b[0m';
    console.log(`  ${color}[${f.severity.toUpperCase()}]\x1b[0m ${f.title}`);
    console.log(`           ${f.description}`);
    console.log(`           Fix: ${f.recommendation}`);
    console.log('');
  }
}

function riskColor(risk: string): string {
  const colors: Record<string, string> = {
    critical: '\x1b[31mCRITICAL\x1b[0m',
    high: '\x1b[31mHIGH\x1b[0m',
    medium: '\x1b[33mMEDIUM\x1b[0m',
    low: '\x1b[36mLOW\x1b[0m',
    safe: '\x1b[32mSAFE\x1b[0m',
  };
  return colors[risk] || risk;
}

// Parse and execute
program.parse(process.argv);

// If no command specified, start dashboard
if (process.argv.length <= 2) {
  logger.banner('Security Suite v1.0.0');
  console.log('  Starting dashboard server...\n');
  createServer(3000, '127.0.0.1');
}
