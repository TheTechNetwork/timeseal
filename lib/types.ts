// Time-Seal Type Definitions
export interface TimeSeal {
  id: string;
  keyB: string;
  iv: string;
  unlockTime: number;
  createdAt: number;
  pulseToken?: string; // For dead man's switch
  pulseDuration?: number; // Duration in milliseconds
  isActive: boolean;
  // Ephemeral seal fields
  isEphemeral?: boolean;
  maxViews?: number | null;
  viewCount?: number;
  firstViewedAt?: number | null;
  firstViewerFingerprint?: string | null;
}

export interface CreateSealRequest {
  encryptedBlob: ArrayBuffer;
  keyB: string;
  iv: string;
  unlockTime: number;
  pulseToken?: string;
  pulseDuration?: number;
  // Ephemeral seal options
  isEphemeral?: boolean;
  maxViews?: number | null;
}

export interface SealStatus {
  id: string;
  isLocked: boolean;
  unlockTime: number;
  keyB?: string;
  iv?: string;
  // Ephemeral seal status
  isEphemeral?: boolean;
  viewCount?: number;
  maxViews?: number | null;
  remainingViews?: number | null;
  isExhausted?: boolean;
  firstViewedAt?: number | null;
}

export interface PulseResponse {
  success: boolean;
  newUnlockTime?: number;
}