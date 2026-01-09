import crypto from 'crypto';

/**
 * Verifies GitHub webhook signature to ensure request authenticity
 * Uses HMAC SHA-256 algorithm as specified by GitHub
 * 
 * @param {string} payload - Raw request body as string
 * @param {string} signature - GitHub signature from X-Hub-Signature-256 header
 * @param {string} secret - Webhook secret configured in GitHub App
 * @returns {boolean} - True if signature is valid
 */
export function verifyWebhookSignature(payload, signature, secret) {
  if (!signature) {
    console.error('No signature provided in request');
    return false;
  }

  if (!secret) {
    console.error('No webhook secret configured');
    return false;
  }

  // GitHub sends signature as "sha256=<hash>"
  const signatureBuffer = Buffer.from(signature);
  
  // Compute HMAC SHA-256 hash of payload using webhook secret
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload, 'utf8');
  const calculatedSignature = 'sha256=' + hmac.digest('hex');
  const calculatedBuffer = Buffer.from(calculatedSignature);

  // Use timing-safe comparison to prevent timing attacks
  // Both buffers must be same length for comparison
  if (signatureBuffer.length !== calculatedBuffer.length) {
    console.error('Signature length mismatch');
    return false;
  }

  // crypto.timingSafeEqual prevents timing attacks
  const isValid = crypto.timingSafeEqual(signatureBuffer, calculatedBuffer);
  
  if (!isValid) {
    console.error('Invalid webhook signature');
  }

  return isValid;
}
