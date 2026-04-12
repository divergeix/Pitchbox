// ============================================================================
// Security Suite - Cryptographic Utilities
// ============================================================================

import * as crypto from 'crypto';

export class CryptoUtils {
  static sha256(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  static sha1(data: string): string {
    return crypto.createHash('sha1').update(data).digest('hex');
  }

  static md5(data: string): string {
    return crypto.createHash('md5').update(data).digest('hex');
  }

  static hashFile(filePath: string, algorithm: string = 'sha256'): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash(algorithm);
      const fs = require('fs');
      const stream = fs.createReadStream(filePath);
      stream.on('data', (data: Buffer) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  static generateId(): string {
    return crypto.randomUUID();
  }

  static calculateEntropy(password: string): number {
    const charsets: { test: RegExp; size: number }[] = [
      { test: /[a-z]/, size: 26 },
      { test: /[A-Z]/, size: 26 },
      { test: /[0-9]/, size: 10 },
      { test: /[^a-zA-Z0-9]/, size: 33 },
    ];

    let poolSize = 0;
    for (const charset of charsets) {
      if (charset.test.test(password)) {
        poolSize += charset.size;
      }
    }

    if (poolSize === 0) return 0;
    return Math.floor(password.length * Math.log2(poolSize));
  }

  static encrypt(text: string, key: string): string {
    const iv = crypto.randomBytes(16);
    const keyHash = crypto.createHash('sha256').update(key).digest();
    const cipher = crypto.createCipheriv('aes-256-cbc', keyHash, iv);
    let encrypted = cipher.update(text, 'utf-8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  static decrypt(encryptedText: string, key: string): string {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const keyHash = crypto.createHash('sha256').update(key).digest();
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyHash, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
  }
}
