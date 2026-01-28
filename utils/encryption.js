import crypto from 'crypto';

// Generate a proper encryption key if not provided
const generateEncryptionKey = () => {
  const key = crypto.randomBytes(32).toString('hex'); // 64 character hex string
  console.log('Generated encryption key:', key);
  return key;
};

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || generateEncryptionKey();
const ALGORITHM = 'aes-256-gcm';
const SALT = 'scklms_salt_2024';

// Helper function to ensure key is proper length
const ensureKeyLength = (key) => {
  if (!key) {
    // Generate a new key
    return crypto.randomBytes(32).toString('hex');
  }

  // If key is already hex, use it
  if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
    return key;
  }

  // If key is not hex, create a hash from it
  return crypto.createHash('sha256').update(key).digest('hex');
};

export const generateKeyPair = (keyLength = 2048) => {
  return new Promise((resolve, reject) => {
    crypto.generateKeyPair(
      'rsa',
      {
        modulusLength: keyLength,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      },
      (err, publicKey, privateKey) => {
        if (err) reject(err);
        else resolve({ publicKey, privateKey });
      }
    );
  });
};

export const generateSymmetricKey = (length = 256) => {
  return crypto.randomBytes(length / 8).toString('hex');
};

// Generate ECDSA key pair for digital signatures
export const generateECDSAKeyPair = (keyLength = 256) => {
  return new Promise((resolve, reject) => {
    // Map key length to named curve
    let namedCurve;
    switch (keyLength) {
      case 256:
        namedCurve = 'prime256v1'; // P-256
        break;
      case 384:
        namedCurve = 'secp384r1'; // P-384
        break;
      case 521:
        namedCurve = 'secp521r1'; // P-521
        break;
      default:
        namedCurve = 'prime256v1'; // Default to P-256
    }

    crypto.generateKeyPair(
      'ec',
      {
        namedCurve,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem',
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem',
        },
      },
      (err, publicKey, privateKey) => {
        if (err) reject(err);
        else resolve({ publicKey, privateKey });
      }
    );
  });
};

export const encryptAES256 = (plaintext, key = ENCRYPTION_KEY) => {
  try {
    const iv = crypto.randomBytes(16);
    const keyBuffer = Buffer.from(ensureKeyLength(key).substring(0, 64), 'hex');

    if (keyBuffer.length !== 32) {
      throw new Error(`Invalid key length: ${keyBuffer.length} bytes (expected 32 bytes)`);
    }

    const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString('hex'),
      encryptedData: encrypted,
      authTag: authTag.toString('hex'),
      algorithm: 'AES-256-GCM',
    };
  } catch (error) {
    console.error('[ENCRYPTION ERROR]', error);
    throw new Error(`Encryption failed: ${error.message}`);
  }
};

export const decryptAES256 = (encryptedData, key = ENCRYPTION_KEY) => {
  try {
    const keyBuffer = Buffer.from(ensureKeyLength(key).substring(0, 64), 'hex');

    if (keyBuffer.length !== 32) {
      throw new Error(`Invalid key length: ${keyBuffer.length} bytes (expected 32 bytes)`);
    }

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      keyBuffer,
      Buffer.from(encryptedData.iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[DECRYPTION ERROR]', error);
    throw new Error(`Decryption failed: ${error.message}`);
  }
};

export const hashData = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

export const signData = (data, privateKey) => {
  try {
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(data);
    return sign.sign(privateKey, 'hex');
  } catch (error) {
    console.error('[SIGNING ERROR]', error);
    throw new Error('Signing failed');
  }
};

export const verifySignature = (data, signature, publicKey) => {
  try {
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(data);
    return verify.verify(publicKey, Buffer.from(signature, 'hex'));
  } catch (error) {
    console.error('[VERIFICATION ERROR]', error);
    return false;
  }
};

export const generateMACAddress = () => {
  return Array.from({ length: 6 })
    .map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, '0'))
    .join(':');
};

export const generateSecureRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Advanced ST-CIMP Encryption Features
export const generateRSAKeyPairWithEncryption = async (keyLength = 2048, masterKey = ENCRYPTION_KEY) => {
  const { publicKey, privateKey } = await generateKeyPair(keyLength);
  const encryptedPrivateKey = encryptAES256(privateKey, masterKey);
  return {
    publicKey,
    privateKeyEncrypted: encryptedPrivateKey,
  };
};

export const decryptPrivateKey = (encryptedPrivateKey, masterKey = ENCRYPTION_KEY) => {
  try {
    return decryptAES256(encryptedPrivateKey, masterKey);
  } catch (error) {
    console.error('[PRIVATE KEY DECRYPTION ERROR]', error);
    throw new Error('Failed to decrypt private key');
  }
};

export const encryptKeyWithRSAWrapping = (symmetricKey, rsaPublicKey) => {
  try {
    const buffer = Buffer.from(symmetricKey, 'hex');
    const encrypted = crypto.publicEncrypt(
      {
        key: rsaPublicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      buffer
    );
    return encrypted.toString('base64');
  } catch (error) {
    console.error('[RSA WRAPPING ERROR]', error);
    throw new Error('RSA key wrapping failed');
  }
};

export const decryptKeyWithRSAUnwrapping = (wrappedKey, rsaPrivateKey) => {
  try {
    const buffer = Buffer.from(wrappedKey, 'base64');
    const decrypted = crypto.privateDecrypt(
      {
        key: rsaPrivateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      buffer
    );
    return decrypted.toString('hex');
  } catch (error) {
    console.error('[RSA UNWRAPPING ERROR]', error);
    throw new Error('RSA key unwrapping failed');
  }
};

export const generateDerivedKey = (password, salt, iterations = 100000, keyLength = 32) => {
  try {
    return crypto.pbkdf2Sync(password, salt, iterations, keyLength, 'sha256').toString('hex');
  } catch (error) {
    console.error('[KEY DERIVATION ERROR]', error);
    throw new Error('Key derivation failed');
  }
};

export const generateSalt = (length = 16) => {
  return crypto.randomBytes(length).toString('hex');
};

export const base64EncodeData = (data) => {
  return Buffer.from(data).toString('base64');
};

export const base64DecodeData = (encoded) => {
  return Buffer.from(encoded, 'base64').toString('utf8');
};

export const generateQRCode = async (data) => {
  // QR code generation wrapper for certificate encoding
  // Requires qrcode library in package.json
  return data; // Placeholder - implement with qrcode library
};

export const verifyFileIntegrity = (fileData, expectedHash) => {
  const computedHash = hashData(fileData);
  return {
    computed: computedHash,
    expected: expectedHash,
    match: computedHash === expectedHash,
    tampered: computedHash !== expectedHash,
  };
};

export const detectMITMAttack = (requestData, expectedData) => {
  const requestHash = hashData(JSON.stringify(requestData));
  const expectedHash = hashData(JSON.stringify(expectedData));
  return {
    detected: requestHash !== expectedHash,
    riskLevel: requestHash !== expectedHash ? 'high' : 'low',
    indicators: requestHash !== expectedHash ? ['Data mismatch detected', 'Possible man-in-the-middle attack'] : [],
  };
};

export const detectReplayAttack = (nonce, previousNonces = []) => {
  const isReplay = previousNonces.includes(nonce);
  return {
    isReplay,
    riskLevel: isReplay ? 'critical' : 'low',
    newNonce: !isReplay ? nonce : null,
  };
};

export const generateNonce = () => {
  return crypto.randomBytes(16).toString('hex');
};

export const createDigitalSignatureWithTimestamp = (data, privateKey) => {
  const timestamp = new Date().toISOString();
  const dataWithTimestamp = `${data}::${timestamp}`;
  const signature = signData(dataWithTimestamp, privateKey);
  return {
    signature,
    timestamp,
    data: dataWithTimestamp,
  };
};

export const verifyDigitalSignatureWithTimestamp = (data, timestamp, signature, publicKey, maxAge = 3600000) => {
  const dataWithTimestamp = `${data}::${timestamp}`;
  const isValid = verifySignature(dataWithTimestamp, signature, publicKey);
  const age = Date.now() - new Date(timestamp).getTime();
  const isExpired = age > maxAge;

  return {
    signatureValid: isValid,
    timestampValid: !isExpired,
    age,
    maxAge,
    overallValid: isValid && !isExpired,
  };
};