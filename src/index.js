import 'dotenv/config';
import express from 'express';
import { handleWebhook, handlePingEvent } from './webhook.js';

/**
 * AI-Powered GitHub PR Review Bot
 * 
 * This server receives GitHub webhook events when pull requests are opened
 * or updated, performs AI-powered code review using multiple specialized agents,
 * and posts comprehensive feedback directly on the PR.
 * 
 * Architecture:
 * - Express server for webhook handling
 * - GitHub App authentication for secure API access
 * - Multi-agent AI system (MCP-inspired) for comprehensive reviews
 * - Webhook signature verification for security
 */

// Validate required environment variables
const requiredEnvVars = [
  'GITHUB_APP_ID',
  'GITHUB_PRIVATE_KEY',
  'WEBHOOK_SECRET',
  'OPENAI_API_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  console.error('\nPlease check your .env file or environment configuration.');
  process.exit(1);
}

// Configuration object (loaded from environment)
const config = {
  appId: process.env.GITHUB_APP_ID,
  privateKey: process.env.GITHUB_PRIVATE_KEY.replace(/\\n/g, '\n'), // Handle escaped newlines
  webhookSecret: process.env.WEBHOOK_SECRET,
  openaiApiKey: process.env.OPENAI_API_KEY,
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development'
};

// Initialize Express application
const app = express();

// Middleware to parse JSON payloads
// Also preserve raw body for signature verification
app.use(express.json({
  verify: (req, res, buf) => {
    // Store raw body for signature verification
    req.rawBody = buf.toString('utf8');
  }
}));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    service: 'AI PR Review Bot',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    environment: config.nodeEnv
  });
});

// GitHub webhook endpoint
// This is where GitHub sends pull request events
app.post('/webhook', async (req, res) => {
  const event = req.headers['x-github-event'];

  console.log('\n========================================');
  console.log(`📥 Incoming webhook: ${event}`);
  console.log('========================================\n');

  // Handle ping event (webhook verification)
  if (event === 'ping') {
    return handlePingEvent(req, res);
  }

  // Handle pull request events
  if (event === 'pull_request') {
    return handleWebhook(req, res, config);
  }

  // Ignore other events
  console.log(`Ignoring event: ${event}`);
  res.status(200).json({ message: 'Event ignored' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' ? err.message : 'An error occurred'
  });
});

// Start the server
const server = app.listen(config.port, () => {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   🤖 AI PR Review Bot Started           ║');
  console.log('╚════════════════════════════════════════════╝\n');
  console.log(`🚀 Server running on port ${config.port}`);
  console.log(`📍 Webhook URL: http://localhost:${config.port}/webhook`);
  console.log(`🏥 Health check: http://localhost:${config.port}/health`);
  console.log(`🔧 Environment: ${config.nodeEnv}`);
  console.log(`✅ GitHub App ID: ${config.appId}`);
  console.log('\n💡 Waiting for webhook events from GitHub...\n');
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, shutting down gracefully...');
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

export default app;
