import { Client, Databases, ID, Query } from 'appwrite';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '');

const databases = new Databases(client);

// Constants
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '';
const COUPONS_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COUPONS_COLLECTION_ID || '';
const COUPON_USAGES_COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_COUPON_USAGES_COLLECTION_ID || '';

// Types
export interface CouponConditions {
  requires2FA?: boolean;
  regions?: string[];
  minAccountAgeInDays?: number;
  isNew?: boolean;
  seasonalType?: 'summer' | 'winter' | 'spring' | 'fall' | 'festival';
  festivalName?: string;
  minPreviousPurchases?: number;
  showToAll?: boolean;
}

export interface Coupon {
  $id?: string;
  name: string;
  code: string;
  description: string;
  discount: number;
  expiresAt: string;
  isActive: boolean;
  conditions: CouponConditions;
  maxUses: number;
  currentUses: number;
  createdAt: string;
  isOneTimeUse?: boolean;
  minimumOrderValue?: number;
}

export interface CouponUsage {
  $id?: string;
  couponId: string;
  userId: string;
  usedAt: string;
}

const ADMIN_USER_ID = 'user_2yfihsCUpfg5wM2Le7letlXwj2C';

// Create a new coupon (Admin only)
export const createCoupon = async (
  coupon: Omit<Coupon, '$id' | 'currentUses' | 'createdAt'>,
  currentUserId: string
) => {
  if (currentUserId !== ADMIN_USER_ID) {
    throw new Error('Unauthorized: Only admin can create coupons');
  }
  return databases.createDocument(
    DATABASE_ID,
    COUPONS_COLLECTION_ID,
    ID.unique(),
    {
      ...coupon,
      currentUses: 0,
      createdAt: new Date().toISOString(),
    }
  );
};

// Check if a user has used a specific coupon
export const hasUserUsedCoupon = async (couponId: string, userId: string): Promise<boolean> => {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      COUPON_USAGES_COLLECTION_ID,
      [Query.equal('couponId', couponId), Query.equal('userId', userId)]
    );
    
    return result.total > 0;
  } catch (error) {
    console.error('Error checking coupon usage:', error);
    return false;
  }
};

// Record that a user has used a coupon
export const recordCouponUsage = async (couponId: string, userId: string) => {
  try {
    // 1. Record the usage
    await databases.createDocument(
      DATABASE_ID,
      COUPON_USAGES_COLLECTION_ID,
      ID.unique(),
      {
        couponId,
        userId,
        usedAt: new Date().toISOString(),
      }
    );

    // 2. Increment the coupon's currentUses
    const coupon = await databases.getDocument(DATABASE_ID, COUPONS_COLLECTION_ID, couponId);
    await databases.updateDocument(DATABASE_ID, COUPONS_COLLECTION_ID, couponId, {
      currentUses: (coupon.currentUses || 0) + 1,
    });

    return true;
  } catch (error) {
    console.error('Error recording coupon usage:', error);
    return false;
  }
};

// Get a coupon by its code
export const getCouponByCode = async (code: string): Promise<Coupon | null> => {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      COUPONS_COLLECTION_ID,
      [Query.equal('code', code), Query.equal('isActive', true), Query.greaterThan('expiresAt', new Date().toISOString())]
    );
    
    if (result.total === 0) return null;
    return result.documents[0] as unknown as Coupon;
  } catch (error) {
    console.error('Error finding coupon by code:', error);
    return null;
  }
};

// Get coupons available for a user based on their profile and conditions
export const getAvailableCouponsForUser = async (
  userId: string,
  userProfile: {
    has2FA: boolean;
    region?: string;
    createdAt: string;
    purchaseCount: number;
  }
): Promise<Coupon[]> => {
  try {
    // Get all active, non-expired coupons
    const result = await databases.listDocuments(
      DATABASE_ID,
      COUPONS_COLLECTION_ID,
      [
        Query.equal('isActive', true),
        Query.greaterThan('expiresAt', new Date().toISOString()),
      ]
    );
    
    // Check which coupons the user has already used
    const usages = await databases.listDocuments(
      DATABASE_ID,
      COUPON_USAGES_COLLECTION_ID,
      [Query.equal('userId', userId)]
    );
    
    const usedCouponIds = usages.documents.map((usage) => usage.couponId);
    
    // Filter coupons based on conditions and usage
    return result.documents
      .map(doc => doc as unknown as Coupon)
      .filter((coupon: Coupon) => {
        // Skip if user already used this coupon
        if (usedCouponIds.includes(coupon.$id!)) return false;
        
        // Skip if coupon reached max uses
        if (coupon.maxUses > 0 && coupon.currentUses >= coupon.maxUses) return false;
        
        const conditions = coupon.conditions;
        
        // Show to all overrides other conditions
        if (conditions.showToAll) return true;
        
        // Check 2FA requirement
        if (conditions.requires2FA && !userProfile.has2FA) return false;
        
        // Check region requirement
        if (conditions.regions && conditions.regions.length > 0) {
          if (!userProfile.region || !conditions.regions.includes(userProfile.region.toLowerCase())) {
            return false;
          }
        }
        
        // Check account age requirement
        if (conditions.minAccountAgeInDays) {
          const accountAgeInDays = (Date.now() - new Date(userProfile.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          if (accountAgeInDays < conditions.minAccountAgeInDays) return false;
        }
        
        // Check if new user requirement
        if (conditions.isNew !== undefined) {
          const accountAgeInDays = (Date.now() - new Date(userProfile.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          if (conditions.isNew && accountAgeInDays > 30) return false;
          if (!conditions.isNew && accountAgeInDays <= 30) return false;
        }
        
        // Check minimum purchases
        if (conditions.minPreviousPurchases !== undefined && 
            userProfile.purchaseCount < conditions.minPreviousPurchases) {
          return false;
        }
        
        // Passed all condition checks
        return true;
      }) as Coupon[];
  } catch (error) {
    console.error('Error getting available coupons:', error);
    return [];
  }
};

// Get all coupons (Admin only)
export const getAllCoupons = async (): Promise<Coupon[]> => {
  try {
    const result = await databases.listDocuments(
      DATABASE_ID,
      COUPONS_COLLECTION_ID,
      [Query.orderDesc('createdAt')]
    );
    
    return result.documents.map(doc => doc as unknown as Coupon);
  } catch (error) {
    console.error('Error getting all coupons:', error);
    return [];
  }
};

// Update a coupon (Admin only)
export const updateCoupon = async (
  couponId: string,
  updates: Partial<Coupon>,
  currentUserId: string
) => {
  if (currentUserId !== ADMIN_USER_ID) {
    throw new Error('Unauthorized: Only admin can update coupons');
  }
  try {
    return await databases.updateDocument(DATABASE_ID, COUPONS_COLLECTION_ID, couponId, updates);
  } catch (error) {
    console.error('Error updating coupon:', error);
    return null;
  }
};

// Delete a coupon (Admin only)
export const deleteCoupon = async (couponId: string, currentUserId: string) => {
  if (currentUserId !== ADMIN_USER_ID) {
    throw new Error('Unauthorized: Only admin can delete coupons');
  }
  try {
    return await databases.deleteDocument(DATABASE_ID, COUPONS_COLLECTION_ID, couponId);
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return null;
  }
};
