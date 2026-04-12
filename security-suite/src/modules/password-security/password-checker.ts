// ============================================================================
// Password Security - Strength Analysis & Breach Checking
// ============================================================================

import * as crypto from 'crypto';
import * as https from 'https';
import { Logger } from '../../utils/logger';
import { CryptoUtils } from '../../utils/crypto-utils';
import { PasswordAnalysis, BreachCheckResult } from '../../types';

const logger = new Logger('PasswordChecker');

// Common password patterns that weaken security
const COMMON_PATTERNS = [
  /^(password|passwd|pass)/i,
  /^(qwerty|asdf|zxcv)/i,
  /^(123|abc|111|000)/i,
  /^(admin|root|user|login)/i,
  /^(welcome|letmein|monkey|dragon)/i,
  /(.)\1{2,}/,                    // Repeated characters (aaa, 111)
  /^(0[1-9]|1[0-2])\d{2}\d{4}$/, // Date patterns
  /(19|20)\d{2}/,                 // Year patterns
  /^[a-z]+$/,                     // Only lowercase
  /^[A-Z]+$/,                     // Only uppercase
  /^[0-9]+$/,                     // Only numbers
];

// Top 100 most common passwords
const COMMON_PASSWORDS = new Set([
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', '1234567',
  'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
  'ashley', 'michael', 'shadow', '123123', '654321', 'superman', 'qazwsx',
  'michael', 'football', 'password1', 'password123', 'batman', 'login',
  'princess', 'admin', 'welcome', 'hello', 'charlie', 'donald', 'passw0rd',
  'whatever', 'qwerty123', '1q2w3e4r', '1qaz2wsx', '123456789', '1234567890',
  'hunter2', 'starwars', 'access', 'master', 'killer', 'google', 'jordan',
]);

function estimateCrackTime(entropy: number): string {
  // Assuming 10 billion guesses per second (modern GPU)
  const guessesPerSecond = 10_000_000_000;
  const totalGuesses = Math.pow(2, entropy);
  const seconds = totalGuesses / guessesPerSecond;

  if (seconds < 0.001) return 'Instant';
  if (seconds < 1) return 'Less than a second';
  if (seconds < 60) return `${Math.ceil(seconds)} seconds`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.ceil(seconds / 3600)} hours`;
  if (seconds < 2592000) return `${Math.ceil(seconds / 86400)} days`;
  if (seconds < 31536000) return `${Math.ceil(seconds / 2592000)} months`;
  if (seconds < 31536000 * 100) return `${Math.ceil(seconds / 31536000)} years`;
  if (seconds < 31536000 * 1000000) return `${Math.ceil(seconds / 31536000).toLocaleString()} years`;
  return 'Centuries';
}

export function analyzePassword(password: string): PasswordAnalysis {
  const length = password.length;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[^a-zA-Z0-9]/.test(password);
  const hasCommonPatterns = COMMON_PATTERNS.some(p => p.test(password));
  const isCommonPassword = COMMON_PASSWORDS.has(password.toLowerCase());

  const entropy = CryptoUtils.calculateEntropy(password);
  const suggestions: string[] = [];

  // Calculate score (0-100)
  let score = 0;

  // Length scoring (0-30)
  score += Math.min(30, length * 2);

  // Character variety (0-25)
  const charTypes = [hasUppercase, hasLowercase, hasNumbers, hasSymbols].filter(Boolean).length;
  score += charTypes * 6.25;

  // Entropy bonus (0-25)
  score += Math.min(25, entropy / 4);

  // Penalties
  if (isCommonPassword) {
    score = Math.min(score, 5);
    suggestions.push('This is one of the most common passwords. Choose something unique.');
  }
  if (hasCommonPatterns) {
    score = Math.max(0, score - 20);
    suggestions.push('Avoid common patterns like sequential characters or repeated characters.');
  }
  if (length < 8) {
    score = Math.max(0, score - 15);
    suggestions.push('Use at least 12 characters for a strong password.');
  }

  // Generate suggestions
  if (!hasUppercase) suggestions.push('Add uppercase letters (A-Z).');
  if (!hasLowercase) suggestions.push('Add lowercase letters (a-z).');
  if (!hasNumbers) suggestions.push('Add numbers (0-9).');
  if (!hasSymbols) suggestions.push('Add special characters (!@#$%^&*).');
  if (length < 12) suggestions.push('Increase password length to at least 12 characters.');
  if (length < 16 && score > 60) suggestions.push('Consider using a passphrase of 16+ characters.');

  // Determine strength
  let strength: PasswordAnalysis['strength'];
  if (score >= 80) strength = 'very-strong';
  else if (score >= 60) strength = 'strong';
  else if (score >= 40) strength = 'fair';
  else if (score >= 20) strength = 'weak';
  else strength = 'very-weak';

  const crackTime = estimateCrackTime(entropy);

  return {
    password: '*'.repeat(password.length),
    score: Math.round(Math.min(100, Math.max(0, score))),
    strength,
    entropy,
    crackTime,
    length,
    hasUppercase,
    hasLowercase,
    hasNumbers,
    hasSymbols,
    hasCommonPatterns: hasCommonPatterns || isCommonPassword,
    suggestions,
  };
}

export async function checkBreach(password: string): Promise<BreachCheckResult> {
  // Use k-anonymity model (only send first 5 chars of SHA1 hash)
  const sha1Hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = sha1Hash.substring(0, 5);
  const suffix = sha1Hash.substring(5);

  logger.info('Checking password against breach database (k-anonymity model)');

  return new Promise((resolve) => {
    const req = https.get({
      hostname: 'api.pwnedpasswords.com',
      path: `/range/${prefix}`,
      headers: {
        'User-Agent': 'SecuritySuite-PasswordChecker',
        'Add-Padding': 'true',
      },
      timeout: 5000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const lines = data.split('\n');
        for (const line of lines) {
          const [hashSuffix, count] = line.trim().split(':');
          if (hashSuffix === suffix) {
            resolve({
              hash: sha1Hash,
              breached: true,
              occurrences: parseInt(count, 10),
            });
            return;
          }
        }
        resolve({ hash: sha1Hash, breached: false, occurrences: 0 });
      });
    });

    req.on('error', () => {
      logger.warn('Could not reach breach database. Skipping breach check.');
      resolve({ hash: sha1Hash, breached: false, occurrences: -1 });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ hash: sha1Hash, breached: false, occurrences: -1 });
    });
  });
}

export function generateSecurePassword(length: number = 20): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + numbers + symbols;

  let password = '';

  // Ensure at least one of each type
  password += uppercase[crypto.randomInt(uppercase.length)];
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += numbers[crypto.randomInt(numbers.length)];
  password += symbols[crypto.randomInt(symbols.length)];

  // Fill the rest
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(allChars.length)];
  }

  // Shuffle the password
  const arr = password.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr.join('');
}
