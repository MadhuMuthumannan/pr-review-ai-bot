import { getAuthenticatedOctokit } from './installationToken.js';

/**
 * Fetches the diff (changed files) for a pull request
 * Returns the diff in unified format showing additions/deletions
 * 
 * @param {Object} params - Parameters object
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {number} params.pullNumber - Pull request number
 * @param {number} params.installationId - GitHub App installation ID
 * @param {string} params.appId - GitHub App ID
 * @param {string} params.privateKey - GitHub App private key
 * @returns {Promise<string>} - Pull request diff content
 */
export async function getPullRequestDiff({ owner, repo, pullNumber, installationId, appId, privateKey }) {
  try {
    const octokit = await getAuthenticatedOctokit(installationId, appId, privateKey);
    
    // Fetch PR diff in unified diff format
    // Using 'diff' mediaType to get the actual diff content
    const { data } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
      mediaType: {
        format: 'diff'
      }
    });

    console.log(`Fetched diff for PR #${pullNumber} in ${owner}/${repo}`);
    
    return data;
  } catch (error) {
    console.error('Failed to fetch pull request diff:', error.message);
    throw new Error(`Could not fetch PR diff: ${error.message}`);
  }
}

/**
 * Fetches detailed information about changed files in a pull request
 * Includes filename, status, additions, deletions, and patch
 * 
 * @param {Object} params - Parameters object
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {number} params.pullNumber - Pull request number
 * @param {number} params.installationId - GitHub App installation ID
 * @param {string} params.appId - GitHub App ID
 * @param {string} params.privateKey - GitHub App private key
 * @returns {Promise<Array>} - Array of file objects with changes
 */
export async function getPullRequestFiles({ owner, repo, pullNumber, installationId, appId, privateKey }) {
  try {
    const octokit = await getAuthenticatedOctokit(installationId, appId, privateKey);
    
    // Fetch list of changed files
    const { data: files } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: pullNumber
    });

    console.log(`Found ${files.length} changed files in PR #${pullNumber}`);
    
    return files;
  } catch (error) {
    console.error('Failed to fetch pull request files:', error.message);
    throw new Error(`Could not fetch PR files: ${error.message}`);
  }
}

/**
 * Posts an AI-generated review comment on a pull request
 * Creates a review with comments and overall feedback
 * 
 * @param {Object} params - Parameters object
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {number} params.pullNumber - Pull request number
 * @param {string} params.reviewBody - The AI-generated review content
 * @param {number} params.installationId - GitHub App installation ID
 * @param {string} params.appId - GitHub App ID
 * @param {string} params.privateKey - GitHub App private key
 * @returns {Promise<Object>} - Created review object
 */
export async function postReviewComment({ owner, repo, pullNumber, reviewBody, installationId, appId, privateKey }) {
  try {
    const octokit = await getAuthenticatedOctokit(installationId, appId, privateKey);
    
    // Create a pull request review with COMMENT event
    // COMMENT = general feedback, APPROVE = approve PR, REQUEST_CHANGES = request changes
    const { data } = await octokit.pulls.createReview({
      owner,
      repo,
      pull_number: pullNumber,
      body: reviewBody,
      event: 'COMMENT' // Options: 'APPROVE', 'REQUEST_CHANGES', 'COMMENT'
    });

    console.log(`Posted review comment on PR #${pullNumber} in ${owner}/${repo}`);
    
    return data;
  } catch (error) {
    console.error('Failed to post review comment:', error.message);
    throw new Error(`Could not post review: ${error.message}`);
  }
}

/**
 * Posts inline review comments on specific lines of code
 * Creates a review with line-specific feedback
 * 
 * @param {Object} params - Parameters object
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {number} params.pullNumber - Pull request number
 * @param {string} params.commitId - The SHA of the commit to review
 * @param {Array} params.comments - Array of inline comment objects
 * @param {string} params.reviewBody - Overall review summary
 * @param {number} params.installationId - GitHub App installation ID
 * @param {string} params.appId - GitHub App ID
 * @param {string} params.privateKey - GitHub App private key
 * @returns {Promise<Object>} - Created review object
 */
export async function postInlineReviewComments({ owner, repo, pullNumber, commitId, comments, reviewBody, installationId, appId, privateKey }) {
  try {
    const octokit = await getAuthenticatedOctokit(installationId, appId, privateKey);
    
    // Create a pull request review with inline comments
    // Each comment must specify: path, position (or line), and body
    const { data } = await octokit.pulls.createReview({
      owner,
      repo,
      pull_number: pullNumber,
      commit_id: commitId,
      body: reviewBody,
      event: 'COMMENT',
      comments: comments // Array of { path, line, body } or { path, position, body }
    });

    console.log(`Posted ${comments.length} inline comments on PR #${pullNumber} in ${owner}/${repo}`);
    
    return data;
  } catch (error) {
    console.error('Failed to post inline review comments:', error.message);
    throw new Error(`Could not post inline review: ${error.message}`);
  }
}

/**
 * Fetches basic information about a pull request
 * Includes title, description, author, and metadata
 * 
 * @param {Object} params - Parameters object
 * @param {string} params.owner - Repository owner
 * @param {string} params.repo - Repository name
 * @param {number} params.pullNumber - Pull request number
 * @param {number} params.installationId - GitHub App installation ID
 * @param {string} params.appId - GitHub App ID
 * @param {string} params.privateKey - GitHub App private key
 * @returns {Promise<Object>} - Pull request information
 */
export async function getPullRequestInfo({ owner, repo, pullNumber, installationId, appId, privateKey }) {
  try {
    const octokit = await getAuthenticatedOctokit(installationId, appId, privateKey);
    
    const { data } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: pullNumber
    });

    console.log(`Fetched PR info for #${pullNumber}: "${data.title}"`);
    
    return {
      title: data.title,
      body: data.body,
      author: data.user.login,
      state: data.state,
      created_at: data.created_at,
      updated_at: data.updated_at,
      head: data.head.ref,
      base: data.base.ref,
      head_sha: data.head.sha // Include commit SHA for inline comments
    };
  } catch (error) {
    console.error('Failed to fetch pull request info:', error.message);
    throw new Error(`Could not fetch PR info: ${error.message}`);
  }
}
