/**
 * Utility functions for JWT token management
 */

/**
 * Decode a JWT token without verification (client-side only)
 * Returns the payload or null if invalid
 */
export function decodeJWT(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Check if a JWT token is expired or will expire soon
 * @param token - JWT token string
 * @param bufferSeconds - Buffer time in seconds before expiration (default: 60)
 * @returns true if token is expired or will expire within buffer time
 */
export function isTokenExpired(token: string | null, bufferSeconds: number = 60): boolean {
  if (!token) {
    return true;
  }

  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) {
    // If we can't decode or there's no expiration, treat as expired for safety
    return true;
  }

  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = decoded.exp * 1000;
  const currentTime = Date.now();
  const bufferTime = bufferSeconds * 1000;

  // Token is expired if current time + buffer >= expiration time
  return currentTime + bufferTime >= expirationTime;
}

/**
 * Get the expiration time of a token in milliseconds
 */
export function getTokenExpiration(token: string | null): number | null {
  if (!token) {
    return null;
  }

  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) {
    return null;
  }

  return decoded.exp * 1000;
}


