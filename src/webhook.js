import { getPullRequestDiff, getPullRequestInfo, getPullRequestFiles, postReviewComment, postInlineReviewComments } from './github.js';
import { performAIReview } from './aiReviewer.js';
import { verifyWebhookSignature } from './verifySignature.js';

/**
 * Main webhook handler for GitHub pull request events
 * Orchestrates the entire PR review workflow
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} config - Configuration object with secrets
 */
export async function handleWebhook(req, res, config) {
  const signature = req.headers['x-hub-signature-256'];
  const payload = JSON.stringify(req.body);

  // Step 1: Verify webhook signature for security
  const isValid = verifyWebhookSignature(payload, signature, config.webhookSecret);
  
  if (!isValid) {
    console.error('Invalid webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  console.log('Webhook signature verified ✓');

  // Step 2: Extract event information
  const event = req.headers['x-github-event'];
  const { action, pull_request, installation, repository } = req.body;

  // Log event details
  console.log(`Received GitHub event: ${event}`);
  console.log(`Action: ${action}`);

  // Step 3: Filter for relevant pull request events
  // Only process when PR is opened or synchronized (new commits)
  if (event !== 'pull_request') {
    console.log(`Ignoring non-PR event: ${event}`);
    return res.status(200).json({ message: 'Event ignored (not a pull_request event)' });
  }

  if (action !== 'opened' && action !== 'synchronize') {
    console.log(`Ignoring PR action: ${action}`);
    return res.status(200).json({ message: `Event ignored (action: ${action})` });
  }

  // Step 4: Extract necessary information
  const owner = repository.owner.login;
  const repo = repository.name;
  const pullNumber = pull_request.number;
  const installationId = installation.id;

  console.log(`Processing PR #${pullNumber} in ${owner}/${repo}`);
  console.log(`Installation ID: ${installationId}`);

  // Respond immediately to GitHub (async processing continues in background)
  res.status(200).json({ message: 'Webhook received, processing PR review...' });

  // Step 5: Process PR review asynchronously
  // Don't await - let it run in background to avoid webhook timeout
  processPullRequestReview({
    owner,
    repo,
    pullNumber,
    installationId,
    config
  }).catch(error => {
    console.error('Error processing PR review:', error);
  });
}

/**
 * Processes pull request review asynchronously
 * Fetches diff, runs AI analysis, posts review
 * 
 * @param {Object} params - Processing parameters
 */
async function processPullRequestReview({ owner, repo, pullNumber, installationId, config }) {
  try {
    console.log(`Starting review for PR #${pullNumber}...`);

    // Step 1: Fetch PR metadata
    console.log('Fetching PR information...');
    const prInfo = await getPullRequestInfo({
      owner,
      repo,
      pullNumber,
      installationId,
      appId: config.appId,
      privateKey: config.privateKey
    });

    // Step 2: Fetch PR diff (code changes)
    console.log('Fetching PR diff...');
    const diff = await getPullRequestDiff({
      owner,
      repo,
      pullNumber,
      installationId,
      appId: config.appId,
      privateKey: config.privateKey
    });

    // Step 3: Fetch detailed file information
    console.log('Fetching changed files...');
    const files = await getPullRequestFiles({
      owner,
      repo,
      pullNumber,
      installationId,
      appId: config.appId,
      privateKey: config.privateKey
    });

    // Check if there are actual changes to review
    if (!diff || diff.trim().length === 0) {
      console.log('No changes found in PR, skipping review');
      return;
    }

    // Step 4: Perform AI-powered review using multi-agent system
    console.log('Running AI review (multi-agent analysis)...');
    const reviewResult = await performAIReview(
      diff,
      prInfo,
      files,
      config.openaiApiKey
    );

    // Step 5: Post review with inline comments
    console.log('Posting review to GitHub...');
    
    // If we have inline comments, use the inline comment API
    if (reviewResult.comments && reviewResult.comments.length > 0) {
      await postInlineReviewComments({
        owner,
        repo,
        pullNumber,
        commitId: prInfo.head_sha,
        comments: reviewResult.comments,
        reviewBody: reviewResult.body,
        installationId,
        appId: config.appId,
        privateKey: config.privateKey
      });
    } else {
      // Fallback to general comment if no inline comments
      await postReviewComment({
        owner,
        repo,
        pullNumber,
        reviewBody: reviewResult.body,
        installationId,
        appId: config.appId,
        privateKey: config.privateKey
      });
    }

    console.log(`✅ Successfully completed review for PR #${pullNumber}`);

  } catch (error) {
    console.error(`Failed to process PR #${pullNumber}:`, error.message);
    console.error(error.stack);

    // Attempt to post error notification on PR (optional)
    try {
      await postReviewComment({
        owner,
        repo,
        pullNumber,
        reviewBody: `# 🤖 AI Code Review\n\n⚠️ **Review Failed**\n\nThe automated review encountered an error:\n\`\`\`\n${error.message}\n\`\`\`\n\nPlease proceed with manual review.`,
        installationId,
        appId: config.appId,
        privateKey: config.privateKey
      });
    } catch (postError) {
      console.error('Could not post error comment:', postError.message);
    }
  }
}

/**
 * Handles ping events from GitHub (webhook health check)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export function handlePingEvent(req, res) {
  const { zen, hook_id } = req.body;
  
  console.log('Received ping event from GitHub');
  console.log(`Zen: ${zen}`);
  console.log(`Hook ID: ${hook_id}`);
  
  res.status(200).json({
    message: 'Pong! Webhook is configured correctly.',
    zen: zen
  });
}
