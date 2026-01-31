import { EncryptionService, PrivacyManager } from '../security/SecurityServices';
import { SecurityConfig, PrivacySettings } from '../types';

describe('EncryptionService', () => {
  let encryptionService: EncryptionService;
  let securityConfig: SecurityConfig;

  beforeEach(async () => {
    securityConfig = {
      enableEncryption: true,
      encryptionAlgorithm: 'AES-256',
      enableSecureChannel: true,
      certificatePinning: true
    };
    encryptionService = new EncryptionService(securityConfig);
    await encryptionService.initialize('test-passphrase');
  });

  it('should encrypt and decrypt data correctly', () => {
    const plaintext = 'Hello, DOGE Spatial Explorer!';
    const encrypted = encryptionService.encrypt(plaintext);
    
    expect(encrypted.encrypted).not.toBe(plaintext);
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.authTag).toBeDefined();

    const decrypted = encryptionService.decrypt(
      encrypted.encrypted,
      encrypted.iv,
      encrypted.authTag
    );
    
    expect(decrypted).toBe(plaintext);
  });

  it('should handle encryption disabled', async () => {
    const disabledConfig: SecurityConfig = {
      ...securityConfig,
      enableEncryption: false
    };
    const service = new EncryptionService(disabledConfig);
    await service.initialize();

    const plaintext = 'test data';
    const result = service.encrypt(plaintext);
    
    expect(result.encrypted).toBe(plaintext);
    expect(result.iv).toBe('');
    expect(result.authTag).toBe('');
  });
});

describe('PrivacyManager', () => {
  let privacyManager: PrivacyManager;
  let encryptionService: EncryptionService;
  let privacySettings: PrivacySettings;

  beforeEach(async () => {
    const securityConfig: SecurityConfig = {
      enableEncryption: true,
      encryptionAlgorithm: 'AES-256',
      enableSecureChannel: true,
      certificatePinning: true
    };
    privacySettings = {
      encryptData: true,
      anonymizeData: true,
      localProcessingOnly: true,
      dataRetentionDays: 1
    };
    
    encryptionService = new EncryptionService(securityConfig);
    await encryptionService.initialize('test-passphrase');
    privacyManager = new PrivacyManager(encryptionService, privacySettings);
  });

  it('should store and retrieve data', () => {
    const testData = { userId: '12345', name: 'Test User', value: 42 };
    privacyManager.storeData('test-id', testData);
    
    const retrieved = privacyManager.retrieveData('test-id');
    expect(retrieved).toBeDefined();
  });

  it('should anonymize sensitive data', () => {
    const testData = { 
      userId: '12345', 
      email: 'test@example.com',
      name: 'Test User',
      value: 42 
    };
    
    privacyManager.storeData('test-id', testData);
    const retrieved = privacyManager.retrieveData('test-id');
    
    expect(retrieved.email).toBeUndefined();
    expect(retrieved.name).toBeUndefined();
    expect(retrieved.userId).not.toBe(testData.userId); // Should be hashed
    expect(retrieved.value).toBe(42); // Non-PII preserved
  });

  it('should return null for non-existent data', () => {
    const result = privacyManager.retrieveData('non-existent');
    expect(result).toBeNull();
  });

  it('should clear all data', () => {
    privacyManager.storeData('test-1', { value: 1 });
    privacyManager.storeData('test-2', { value: 2 });
    
    privacyManager.clearAllData();
    
    expect(privacyManager.retrieveData('test-1')).toBeNull();
    expect(privacyManager.retrieveData('test-2')).toBeNull();
  });
});
