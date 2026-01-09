# 🤖 AI-Powered GitHub Pull Request Review Bot

An enterprise-grade, production-ready Node.js application that automatically reviews GitHub pull requests using AI. Built with GitHub Apps, OpenAI, and a multi-agent architecture inspired by Model Context Protocol (MCP) principles.

---

## 🎯 Project Overview

This bot automatically analyzes pull requests when they are opened or updated, providing comprehensive feedback on:

- **Code Quality** - Readability, maintainability, and best practices
- **Security** - Vulnerability detection and security risks
- **Performance** - Optimization opportunities and bottlenecks

The review is posted directly as a comment on the pull request, providing immediate, actionable feedback to developers.

---

## 🏗️ Architecture

### System Flow

```
GitHub PR Event → Webhook → Signature Verification → 
GitHub App Auth → Fetch PR Diff → Multi-Agent AI Review → 
Post Review Comment
```

### Component Architecture

```
src/
├── index.js              # Express server & entry point
├── webhook.js            # Webhook event handling & orchestration
├── verifySignature.js    # HMAC SHA-256 signature verification
├── installationToken.js  # GitHub App JWT & token generation
├── github.js             # GitHub API interactions (Octokit)
└── aiReviewer.js         # Multi-agent AI review system (MCP-inspired)
```

### Key Technologies

- **Node.js 18+** - Runtime environment with ES modules
- **Express.js** - Web server for webhook handling
- **GitHub Apps API** - Secure, scalable GitHub integration
- **OpenAI GPT-4** - Large language model for code analysis
- **JWT** - GitHub App authentication
- **HMAC SHA-256** - Webhook signature verification

---

## 🤖 MCP-Inspired Multi-Agent System

The AI review system implements a **Model Context Protocol (MCP)** inspired architecture with specialized agents:

### Agent Architecture

```
┌─────────────────────────────────────────┐
│     AI Review Orchestrator              │
└─────────────────────────────────────────┘
              │
     ┌────────┼────────┐
     ▼        ▼        ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Code    │ │Security │ │Perform- │
│ Quality │ │ Agent   │ │ance     │
│ Agent   │ │         │ │ Agent   │
└─────────┘ └─────────┘ └─────────┘
     │        │        │
     └────────┴────────┘
              │
         ┌────▼────┐
         │Aggregate│
         │ Results │
         └─────────┘
```

### How MCP Concepts Are Applied

1. **Specialized Agents** - Each agent focuses on a single domain (quality, security, performance)
2. **Parallel Execution** - All agents run concurrently using `Promise.all()`
3. **Context Isolation** - Each agent receives the same diff but applies domain-specific analysis
4. **Result Aggregation** - Individual agent outputs are combined into comprehensive review
5. **Graceful Degradation** - If one agent fails, others continue processing

### Agent Implementations

**Code Quality Agent**
- Analyzes readability, naming conventions, and best practices
- Checks SOLID principles and DRY violations
- Temperature: 0.3 (focused, consistent feedback)

**Security Agent**
- Scans for SQL injection, XSS, authentication issues
- Identifies exposed secrets and insecure dependencies
- Temperature: 0.2 (very low for security consistency)

**Performance Agent**
- Evaluates algorithmic complexity and inefficiencies
- Detects N+1 queries, blocking operations
- Suggests caching and optimization opportunities
- Temperature: 0.3 (balanced analysis)

---

## 🔐 Security Implementation

### 1. Webhook Signature Verification

Every webhook request is verified using HMAC SHA-256:

```javascript
// Timing-safe comparison prevents timing attacks
crypto.timingSafeEqual(signatureBuffer, calculatedBuffer)
```

**Why this matters:**
- Prevents unauthorized webhook spoofing
- Ensures requests actually come from GitHub
- Uses timing-safe comparison to prevent side-channel attacks

### 2. GitHub App Authentication (Not Personal Tokens)

Uses the GitHub App authentication flow:

```
Private Key → JWT (10 min expiry) → Installation Token (1 hr expiry)
```

**Benefits over Personal Access Tokens:**
- Scoped to specific repositories
- Automatic token rotation
- Granular permissions
- Organization-wide deployment
- Doesn't expire when user leaves

### 3. Environment Variable Security

All secrets are stored in environment variables:
- Never committed to version control
- `.env.example` provides template without real values
- Private key supports both escaped (`\n`) and actual newlines

---

## 🚀 How to Run Locally

### Prerequisites

- Node.js 18 or higher
- A GitHub account
- An OpenAI API key
- ngrok (for webhook testing)

### Step 1: Clone and Install

```bash
cd ai-pr-review-bot
npm install
```

### Step 2: Create GitHub App

1. Go to GitHub Settings → Developer Settings → GitHub Apps → **New GitHub App**

2. **Configure the app:**
   - **Name**: AI PR Review Bot (must be unique)
   - **Homepage URL**: `http://localhost:3000`
   - **Webhook URL**: `https://YOUR_NGROK_URL.ngrok.io/webhook`
   - **Webhook Secret**: Generate a random string (save this)
   - **Permissions**:
     - Repository permissions:
       - Pull requests: **Read & Write**
       - Contents: **Read-only**
   - **Subscribe to events**:
     - ☑️ Pull request

3. **Generate private key:**
   - Scroll down and click "Generate a private key"
   - Download the `.pem` file

4. **Note your App ID** (shown at top of app settings page)

### Step 3: Install GitHub App on Repository

1. Go to your GitHub App settings
2. Click "Install App" in left sidebar
3. Select repositories where you want the bot active
4. Note the installation ID from the URL (e.g., `/settings/installations/12345678`)

### Step 4: Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
GITHUB_APP_ID=123456
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
YOUR_ACTUAL_PRIVATE_KEY_CONTENT_HERE
-----END RSA PRIVATE KEY-----"
WEBHOOK_SECRET=your_webhook_secret_from_step2
OPENAI_API_KEY=sk-proj-your-openai-api-key
PORT=3000
NODE_ENV=development
```

**Tip:** You can use the entire `.pem` file content for `GITHUB_PRIVATE_KEY`

### Step 5: Start ngrok (for webhook access)

In a separate terminal:

```bash
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

Update your GitHub App's webhook URL to:
```
https://abc123.ngrok.io/webhook
```

### Step 6: Start the Server

```bash
npm start
```

You should see:

```
╔════════════════════════════════════════════╗
║   🤖 AI PR Review Bot Started           ║
╚════════════════════════════════════════════╝

🚀 Server running on port 3000
📍 Webhook URL: http://localhost:3000/webhook
🏥 Health check: http://localhost:3000/health
🔧 Environment: development
✅ GitHub App ID: 123456

💡 Waiting for webhook events from GitHub...
```

### Step 7: Test with a Pull Request

1. Create a pull request in a repository where the app is installed
2. Watch the terminal for webhook events
3. The bot will post a review comment within ~30 seconds

---

## 📡 GitHub Webhooks Explained

### What Are Webhooks?

Webhooks are HTTP callbacks that GitHub sends to your server when events occur. Think of them as "push notifications for servers."

### How They Work

1. **Event occurs** (e.g., PR opened)
2. **GitHub sends POST request** to your webhook URL
3. **Your server processes** the event
4. **Your server responds** with HTTP 200 (within 10 seconds)

### Webhook Payload Structure

```json
{
  "action": "opened",
  "pull_request": {
    "number": 42,
    "title": "Add new feature",
    "user": { "login": "developer" }
  },
  "repository": {
    "name": "my-repo",
    "owner": { "login": "owner" }
  },
  "installation": {
    "id": 12345678
  }
}
```

### Important Headers

- `X-GitHub-Event` - Event type (e.g., `pull_request`)
- `X-Hub-Signature-256` - HMAC signature for verification
- `X-GitHub-Delivery` - Unique ID for this webhook delivery

### Why Async Processing?

```javascript
// Respond immediately
res.status(200).json({ message: 'Processing...' });

// Process in background
processPullRequestReview(...).catch(error => {
  console.error(error);
});
```

**Reason:** GitHub expects a response within 10 seconds. AI review can take 30+ seconds, so we:
1. Respond immediately to acknowledge receipt
2. Process review asynchronously in background
3. Post results when complete

---

## 🎓 Interview-Ready Explanations

### Q: Why use GitHub Apps instead of Personal Access Tokens?

**Answer:**

GitHub Apps are superior for organization-wide integrations because:

1. **Granular Permissions** - Apps request specific permissions (e.g., "read pull requests") rather than full repo access
2. **Installation-Based** - Scoped to specific repos, not tied to individual users
3. **Scalability** - Can be installed across entire organizations
4. **Security** - Tokens are short-lived (1 hour) and automatically rotated
5. **Audit Trail** - All actions attributed to the app, not a user
6. **User Independence** - Doesn't break when employees leave

### Q: Explain the authentication flow

**Answer:**

Three-step authentication process:

```
1. Private Key (stored securely)
   ↓
2. JWT (signed token, 10 min expiry)
   ↓ (exchange with GitHub)
3. Installation Access Token (1 hr expiry, scoped to repos)
```

**Implementation:**
- JWT is signed with RS256 using the app's private key
- JWT is exchanged for installation token via GitHub API
- Installation token is used for all subsequent API calls
- Tokens are regenerated as needed (stateless)

### Q: How does the multi-agent architecture work?

**Answer:**

Inspired by Model Context Protocol (MCP), the system uses specialized agents:

1. **Separation of Concerns** - Each agent has a focused responsibility
2. **Parallel Execution** - Agents run concurrently for performance
3. **Independent Context** - Each receives the same input but different prompts
4. **Aggregation** - Results combined into comprehensive review
5. **Resilience** - Agent failures don't crash the system

**Code Example:**
```javascript
const [quality, security, performance] = await Promise.all([
  qualityAgent.review(diff),
  securityAgent.review(diff),
  performanceAgent.review(diff)
]);
```

This is MCP-inspired because:
- Agents are isolated processes with specific domains
- Each agent could theoretically be a separate service
- Clear interfaces between components
- Orchestrator coordinates without tight coupling

### Q: How do you handle rate limits and costs?

**Answer:**

Cost and rate limit management strategies:

1. **Diff Truncation**
   ```javascript
   if (estimatedTokens > 6000) {
     diffToReview = diff.substring(0, maxChars);
   }
   ```
   Only review first ~6000 tokens of large PRs

2. **Event Filtering**
   Only process `opened` and `synchronize` events, not `closed`, `labeled`, etc.

3. **Low Temperature**
   Temperature 0.2-0.3 for consistent, concise responses

4. **Parallel Agents**
   All agents run simultaneously (3 API calls, not sequential)

5. **Caching Opportunity** (Future)
   Cache reviews for unchanged files across PR updates

### Q: What security measures are implemented?

**Answer:**

**Defense in Depth:**

1. **Signature Verification**
   - HMAC SHA-256 validation of all webhooks
   - Timing-safe comparison prevents timing attacks
   - Rejects unsigned/invalid requests

2. **Environment Variables**
   - All secrets in environment, never in code
   - `.gitignore` prevents accidental commits
   - Validates required vars on startup

3. **Input Validation**
   - Checks event types before processing
   - Validates webhook structure
   - Error boundaries prevent crashes

4. **Token Security**
   - Short-lived tokens (10 min JWT, 1 hr installation)
   - Tokens scoped to specific installations
   - Private key never transmitted

5. **Error Handling**
   - No sensitive data in error messages
   - Graceful degradation
   - Proper HTTP status codes

### Q: How would you scale this for production?

**Answer:**

**Scaling strategies:**

1. **Horizontal Scaling**
   - Stateless design allows multiple instances
   - Load balancer distributes webhooks
   - Each instance generates its own tokens

2. **Queue System**
   - Redis/RabbitMQ for job queue
   - Webhook handler pushes to queue immediately
   - Worker processes consume from queue
   - Handles traffic spikes gracefully

3. **Database**
   - Store review history, metrics
   - Track processed PRs to avoid duplicates
   - Analytics and reporting

4. **Caching**
   - Cache unchanged file reviews
   - Cache installation tokens until expiry
   - Redis for distributed cache

5. **Observability**
   - Structured logging (JSON logs)
   - Metrics (Prometheus/Grafana)
   - Distributed tracing (OpenTelemetry)
   - Error tracking (Sentry)

6. **Infrastructure**
   - Container orchestration (Kubernetes)
   - Auto-scaling based on queue depth
   - Health checks and liveness probes
   - Circuit breakers for external APIs

---

## 🧪 Testing the Bot

### Manual Testing

1. Create a test PR with intentional issues:

```javascript
// Bad example - has security and quality issues
app.get('/user', (req, res) => {
  const userId = req.query.id;
  const sql = `SELECT * FROM users WHERE id = ${userId}`; // SQL injection!
  db.query(sql, (err, result) => {
    res.send(result);
  });
});
```

2. Watch for AI review comment pointing out:
   - SQL injection vulnerability
   - Missing error handling
   - No input validation
   - Callback instead of async/await

### Webhook Delivery Debugging

GitHub provides webhook delivery logs:

1. Go to GitHub App settings
2. Click "Advanced" tab
3. View recent deliveries with request/response details

---

## 📦 Project Structure Summary

```
ai-pr-review-bot/
│
├── src/
│   ├── index.js              # Express server, entry point
│   ├── webhook.js            # Event handling & orchestration  
│   ├── github.js             # GitHub API (fetch diff, post review)
│   ├── aiReviewer.js         # Multi-agent AI system
│   ├── verifySignature.js    # HMAC SHA-256 verification
│   └── installationToken.js  # GitHub App authentication
│
├── package.json              # Dependencies & scripts
├── .env.example              # Environment variable template
├── .env                      # Your actual secrets (gitignored)
└── README.md                 # This file
```

---

## 🔧 Troubleshooting

### "Invalid signature" error

- Verify `WEBHOOK_SECRET` matches GitHub App settings
- Check that webhook URL is correct in GitHub
- Ensure raw body is preserved for signature verification

### "GitHub App authentication failed"

- Verify `GITHUB_PRIVATE_KEY` is correct (check for `\n` escaping)
- Confirm `GITHUB_APP_ID` matches your app
- Check that app is installed on the repository

### "AI review failed"

- Verify `OPENAI_API_KEY` is valid
- Check OpenAI API quota/billing
- Review token limits (max 6000 tokens for diff)

### Webhook not received

- Confirm ngrok is running and URL is updated
- Check GitHub webhook delivery logs
- Verify firewall/network settings
- Test with `curl` to webhook endpoint

---

## 🚀 Production Deployment

### Environment Options

- **AWS Lambda + API Gateway** - Serverless, auto-scaling
- **Google Cloud Run** - Container-based, pay-per-request
- **Heroku** - Simple deployment, good for MVPs
- **DigitalOcean App Platform** - Balanced option
- **Kubernetes** - Full control, high complexity

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use managed secrets (AWS Secrets Manager, etc.)
- [ ] Configure structured logging
- [ ] Set up error tracking (Sentry)
- [ ] Enable rate limiting
- [ ] Add health check monitoring
- [ ] Configure HTTPS (required by GitHub)
- [ ] Set up CI/CD pipeline
- [ ] Add automated tests
- [ ] Document runbooks for on-call

---

## 📚 Additional Resources

- [GitHub Apps Documentation](https://docs.github.com/en/apps)
- [GitHub Webhooks Guide](https://docs.github.com/en/webhooks)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Octokit.js Documentation](https://octokit.github.io/rest.js/)
- [Model Context Protocol](https://modelcontextprotocol.io/)

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

**Built with ❤️ for developers who value automated code quality**
