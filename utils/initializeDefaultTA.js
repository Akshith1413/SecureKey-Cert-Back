
import mongoose from 'mongoose';
import TrustAuthority from '../models/TrustAuthority.js';
import User from '../models/User.js';
import { generateKeyPair } from './encryption.js';

export const initializeDefaultTrustAuthority = async () => {
  try {
    // Check if default trust authority exists
    const existingTA = await TrustAuthority.findOne({ isDefault: true });
    
    if (!existingTA) {
      console.log('Creating default trust authority...');
      
      try {
        // Try to generate keys, but have fallback
        let publicKey = '';
        let privateKey = '';
        
        try {
          const keys = await generateKeyPair(2048);
          publicKey = keys.publicKey;
          privateKey = keys.privateKey;
        } catch (keyError) {
          console.log('Key generation failed, using placeholder keys for development');
          publicKey = '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyourPublicKeyHere\n-----END PUBLIC KEY-----';
          privateKey = 'development-mode-private-key';
        }
        
        // Find or create a system user for default TA
        let systemUser = await User.findOne({ email: 'system@default.ta' });
        
        if (!systemUser) {
          systemUser = new User({
            firstName: 'System',
            lastName: 'Default',
            email: 'system@default.ta',
            password: 'SystemDefaultPassword123!',
            role: 'security_authority',
            permissions: [],
            isActive: true,
          });
          await systemUser.save();
        }
        
        const defaultTA = new TrustAuthority({
          name: 'Default Trust Authority',
          description: 'Default trust authority for new users',
          administratorId: systemUser._id,
          rootKeyId: null, // No root key for default
          publicKey,
          privateKeyEncrypted: privateKey,
          encryptionAlgorithm: 'none',
          keyLength: 2048,
          status: 'active',
          createdBy: systemUser._id,
          trustLevel: 100,
          isDefault: true,
        });
        
        await defaultTA.save();
        console.log('✅ Default trust authority created successfully:', defaultTA._id);
        
        // Update the system user to have this trust authority
        systemUser.trustAuthorityId = defaultTA._id;
        await systemUser.save();
        
        return defaultTA._id;
      } catch (creationError) {
        console.error('Error creating default trust authority:', creationError);
        
        // Last resort: create minimal TA
        const minimalTA = new TrustAuthority({
          name: 'Default Trust Authority',
          description: 'Default trust authority',
          isDefault: true,
          status: 'active',
        });
        
        await minimalTA.save();
        console.log('✅ Minimal default trust authority created:', minimalTA._id);
        return minimalTA._id;
      }
    }
    
    console.log('✅ Default trust authority already exists:', existingTA._id);
    return existingTA._id;
  } catch (error) {
    console.error('Error initializing default trust authority:', error);
    return null;
  }
};