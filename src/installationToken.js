import jwt from 'jsonwebtoken';
import { Octokit } from '@octokit/rest';

/**
 * Generates a JWT (JSON Web Token) to authenticate as a GitHub App
 * The JWT is short-lived and used to obtain installation access tokens
 * 
 * @param {string} appId - GitHub App ID
 * @param {string} privateKey - GitHub App Private Key (PEM format)
 * @returns {string} - Signed JWT token
 */
function generateGitHubAppJWT(appId, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  
  const payload = {
    // Issued at time (current time)
    iat: now - 60, // 60 seconds in the past to allow for clock drift
    // JWT expiration time (10 minutes maximum allowed by GitHub)
    exp: now + (10 * 60),
    // GitHub App's identifier
    iss: appId
  };

  // Sign JWT with RS256 algorithm using the private key
  const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
  
  return token;
}

/**
 * Exchanges GitHub App JWT for an installation access token
 * Installation tokens are scoped to specific repository installations
 * and have permissions based on the GitHub App configuration
 * 
 * @param {number} installationId - The installation ID for the repository
 * @param {string} appId - GitHub App ID
 * @param {string} privateKey - GitHub App Private Key
 * @returns {Promise<string>} - Installation access token
 */
export async function getInstallationAccessToken(installationId, appId, privateKey) {
  // Generate JWT to authenticate as the GitHub App
  const jwtToken = generateGitHubAppJWT(appId, privateKey);
  
  // Create Octokit instance authenticated with JWT
  const appOctokit = new Octokit({
    auth: jwtToken
  });

  try {
    // Exchange JWT for installation access token
    const { data } = await appOctokit.apps.createInstallationAccessToken({
      installation_id: installationId
    });

    console.log(`Generated installation token for installation ${installationId}`);
    
    // Token is valid for 1 hour by default
    return data.token;
  } catch (error) {
    console.error('Failed to generate installation access token:', error.message);
    throw new Error(`GitHub App authentication failed: ${error.message}`);
  }
}

/**
 * Creates an authenticated Octokit instance for a specific installation
 * This is the primary method to interact with GitHub API on behalf of the app
 * 
 * @param {number} installationId - The installation ID
 * @param {string} appId - GitHub App ID
 * @param {string} privateKey - GitHub App Private Key
 * @returns {Promise<Octokit>} - Authenticated Octokit instance
 */
export async function getAuthenticatedOctokit(installationId, appId, privateKey) {
  const token = await getInstallationAccessToken(installationId, appId, privateKey);
  
  return new Octokit({
    auth: token
  });
}
