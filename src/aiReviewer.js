import OpenAI from 'openai';

/**
 * MCP-Inspired AI Review System
 * 
 * This module implements a multi-agent review architecture inspired by
 * Model Context Protocol (MCP) principles:
 * 
 * - Each agent is a specialized reviewer (quality, security, performance)
 * - Agents operate independently with focused prompts
 * - Results are aggregated into a comprehensive review
 * - Parallel execution for efficiency
 */

/**
 * Code Quality Agent
 * Focuses on code readability, maintainability, and best practices
 */
class CodeQualityAgent {
  constructor(openaiClient) {
    this.client = openaiClient;
    this.name = 'Code Quality Agent';
  }

  async review(diff, prInfo) {
    const prompt = `You are a senior code reviewer focusing on CODE QUALITY.

Review the following pull request changes:

**PR Title:** ${prInfo.title}
**Author:** ${prInfo.author}

**Code Changes:**
\`\`\`diff
${diff}
\`\`\`

Analyze for:
- Code readability and clarity
- Naming conventions
- Code organization and structure
- DRY principles (Don't Repeat Yourself)
- SOLID principles adherence
- Proper error handling
- Code comments and documentation
- Best practices for the language/framework

Provide concise, actionable feedback. Be constructive and specific.
If the code looks good, say so briefly.

Format your response as:
**Code Quality Review:**
[Your analysis here]`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert code reviewer specializing in code quality and best practices.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more focused, consistent reviews
        max_tokens: 1000
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error(`${this.name} failed:`, error.message);
      return `**Code Quality Review:**\n⚠️ Analysis temporarily unavailable.`;
    }
  }
}

/**
 * Security Agent
 * Identifies potential security vulnerabilities and risks
 */
class SecurityAgent {
  constructor(openaiClient) {
    this.client = openaiClient;
    this.name = 'Security Agent';
  }

  async review(diff, prInfo) {
    const prompt = `You are a security-focused code reviewer.

Review the following pull request for SECURITY CONCERNS:

**PR Title:** ${prInfo.title}
**Author:** ${prInfo.author}

**Code Changes:**
\`\`\`diff
${diff}
\`\`\`

Check for:
- SQL injection vulnerabilities
- XSS (Cross-Site Scripting) risks
- Authentication/authorization issues
- Sensitive data exposure (API keys, passwords, tokens)
- Insecure dependencies or imports
- Input validation problems
- CSRF vulnerabilities
- Insecure cryptography usage
- Path traversal vulnerabilities
- Command injection risks

Be specific about the security risk and suggest remediation.
If no security issues are found, state that clearly.

Format your response as:
**Security Review:**
[Your analysis here]`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a cybersecurity expert specializing in application security and vulnerability assessment.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2, // Very low temperature for security - need consistency
        max_tokens: 1000
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error(`${this.name} failed:`, error.message);
      return `**Security Review:**\n⚠️ Analysis temporarily unavailable.`;
    }
  }
}

/**
 * Performance Agent
 * Analyzes code for performance bottlenecks and optimization opportunities
 */
class PerformanceAgent {
  constructor(openaiClient) {
    this.client = openaiClient;
    this.name = 'Performance Agent';
  }

  async review(diff, prInfo) {
    const prompt = `You are a performance optimization expert.

Review the following pull request for PERFORMANCE CONCERNS:

**PR Title:** ${prInfo.title}
**Author:** ${prInfo.author}

**Code Changes:**
\`\`\`diff
${diff}
\`\`\`

Analyze for:
- Algorithmic complexity (time and space)
- Inefficient loops or iterations
- Unnecessary computations
- Memory leaks or excessive memory usage
- N+1 query problems (database)
- Blocking operations that should be async
- Inefficient data structures
- Redundant API calls or network requests
- Large payload sizes
- Caching opportunities

Suggest specific optimizations where applicable.
If performance looks good, acknowledge it.

Format your response as:
**Performance Review:**
[Your analysis here]`;

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a performance engineering expert specializing in code optimization and scalability.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error(`${this.name} failed:`, error.message);
      return `**Performance Review:**\n⚠️ Analysis temporarily unavailable.`;
    }
  }
}

/**
 * Orchestrates multiple AI agents to perform comprehensive code review
 * Implements MCP-style agent coordination
 * 
 * @param {string} diff - Pull request diff content
 * @param {Object} prInfo - Pull request metadata
 * @param {Array} files - Array of changed files with details
 * @param {string} apiKey - OpenAI API key
 * @returns {Promise<Object>} - Review with body and inline comments
 */
export async function performAIReview(diff, prInfo, files, apiKey) {
  console.log('Starting MCP-inspired multi-agent AI review...');
  
  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: apiKey
  });

  // Instantiate specialized agents
  const codeQualityAgent = new CodeQualityAgent(openai);
  const securityAgent = new SecurityAgent(openai);
  const performanceAgent = new PerformanceAgent(openai);

  // Check if diff is too large (OpenAI token limits)
  // Rough estimate: 1 token ≈ 4 characters
  const estimatedTokens = diff.length / 4;
  const maxDiffTokens = 6000; // Leave room for prompt and response
  
  let diffToReview = diff;
  let truncationNote = '';
  
  if (estimatedTokens > maxDiffTokens) {
    // Truncate diff to fit within token limits
    const maxChars = maxDiffTokens * 4;
    diffToReview = diff.substring(0, maxChars);
    truncationNote = '\n\n⚠️ **Note:** This PR is large. Review is based on the first portion of changes.\n';
    console.log(`Diff truncated from ${diff.length} to ${diffToReview.length} characters`);
  }

  try {
    // Execute all agents in parallel for efficiency (MCP-style parallel processing)
    console.log('Executing agents in parallel...');
    const [qualityReview, securityReview, performanceReview] = await Promise.all([
      codeQualityAgent.review(diffToReview, prInfo),
      securityAgent.review(diffToReview, prInfo),
      performanceAgent.review(diffToReview, prInfo)
    ]);

    // Generate inline comments for each file
    const inlineComments = await generateInlineComments(files, openai);

    // Aggregate all agent results into comprehensive review
    const aggregatedReview = `# 🤖 AI Code Review

${truncationNote}
## Pull Request: ${prInfo.title}

---

${qualityReview}

---

${securityReview}

---

${performanceReview}

---

### 📋 Review Summary
This automated review was generated by specialized AI agents analyzing code quality, security, and performance. Please use this as a guide alongside human code review.

*Powered by AI PR Review Bot* 🚀`;

    console.log('AI review completed successfully');
    return {
      body: aggregatedReview,
      comments: inlineComments
    };
    
  } catch (error) {
    console.error('AI review failed:', error.message);
    
    // Return a graceful error message
    return {
      body: `# 🤖 AI Code Review

## Pull Request: ${prInfo.title}

⚠️ **AI Review Unavailable**

The AI review system encountered an error and could not complete the analysis.

**Error:** ${error.message}

Please proceed with manual code review.

*AI PR Review Bot*`,
      comments: []
    };
  }
}

/**
 * Generates inline comments for specific lines in changed files
 * 
 * @param {Array} files - Array of changed file objects from GitHub
 * @param {OpenAI} openaiClient - OpenAI client instance
 * @returns {Promise<Array>} - Array of inline comment objects
 */
async function generateInlineComments(files, openaiClient) {
  const inlineComments = [];
  
  // Limit to first 5 files to avoid excessive API calls
  const filesToReview = files.slice(0, 5);
  
  for (const file of filesToReview) {
    // Skip deleted files and files without patches
    if (file.status === 'removed' || !file.patch) {
      continue;
    }
    
    // Parse the patch to find valid line numbers that can be commented on
    const validLines = parseValidLinesFromPatch(file.patch);
    
    if (validLines.length === 0) {
      console.log(`No valid lines to comment on in ${file.filename}`);
      continue;
    }
    
    try {
      // Ask AI to generate specific suggestions for this file
      const prompt = `You are a code reviewer. Review this file change and provide 1-2 specific, actionable suggestions.

**File:** ${file.filename}
**Changes:** ${file.additions} additions, ${file.deletions} deletions

**Valid line numbers you can comment on:** ${validLines.join(', ')}

**Patch:**
\`\`\`diff
${file.patch}
\`\`\`

Respond ONLY with a JSON array of suggestions. Each suggestion must have:
- "line": must be one of these valid line numbers: ${validLines.join(', ')}
- "suggestion": a concise, specific improvement (max 100 words)

Example format:
[
  {"line": ${validLines[0]}, "suggestion": "Consider adding input validation here."}
]

If no suggestions, return an empty array: []`;

      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a precise code reviewer. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const content = response.choices[0].message.content.trim();
      
      // Parse AI response as JSON
      let suggestions = [];
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, content];
        suggestions = JSON.parse(jsonMatch[1]);
      } catch (parseError) {
        console.warn(`Failed to parse AI response for ${file.filename}:`, content);
        continue;
      }

      // Convert suggestions to GitHub inline comment format
      for (const suggestion of suggestions) {
        if (suggestion.line && suggestion.suggestion && validLines.includes(suggestion.line)) {
          inlineComments.push({
            path: file.filename,
            line: suggestion.line,
            side: 'RIGHT', // Comment on the new version of the file
            body: `💡 **AI Suggestion:**\n\n${suggestion.suggestion}`
          });
        }
      }

    } catch (error) {
      console.warn(`Failed to generate inline comments for ${file.filename}:`, error.message);
      // Continue with other files
    }
  }

  console.log(`Generated ${inlineComments.length} inline comments across ${filesToReview.length} files`);
  return inlineComments;
}

/**
 * Parses a git patch to extract line numbers that can be commented on
 * Only lines that were added or modified (shown with +) can have comments
 * 
 * @param {string} patch - Git diff patch
 * @returns {Array<number>} - Array of valid line numbers in the new file
 */
function parseValidLinesFromPatch(patch) {
  const validLines = [];
  const lines = patch.split('\n');
  
  let currentLine = 0;
  
  for (const line of lines) {
    // Parse the hunk header to get the starting line number
    // Format: @@ -oldStart,oldCount +newStart,newCount @@
    const hunkMatch = line.match(/^@@\s+-\d+(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/);
    if (hunkMatch) {
      currentLine = parseInt(hunkMatch[1], 10);
      continue;
    }
    
    // Lines starting with + are additions (can be commented on)
    if (line.startsWith('+') && !line.startsWith('+++')) {
      validLines.push(currentLine);
      currentLine++;
    }
    // Lines starting with space are context (can be commented on)
    else if (line.startsWith(' ')) {
      validLines.push(currentLine);
      currentLine++;
    }
    // Lines starting with - are deletions (increment old line, not new line)
    else if (line.startsWith('-') && !line.startsWith('---')) {
      // Don't increment currentLine for deletions
      continue;
    }
  }
  
  return validLines;
}

/**
 * Quick health check for AI service
 * Tests OpenAI API connectivity
 * 
 * @param {string} apiKey - OpenAI API key
 * @returns {Promise<boolean>} - True if AI service is accessible
 */
export async function checkAIHealth(apiKey) {
  try {
    const openai = new OpenAI({ apiKey });
    
    await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 5
    });
    
    return true;
  } catch (error) {
    console.error('AI health check failed:', error.message);
    return false;
  }
}
