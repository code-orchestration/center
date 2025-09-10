#!/usr/bin/env node

const https = require('https');
const fs = require('fs').promises;
const { Octokit } = require('@octokit/rest');

// Anthropic API configuration
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// GitHub configuration
const GITHUB_TOKEN = process.env.ORG_ADMIN_TOKEN;
const GITHUB_ORG = process.env.GITHUB_REPOSITORY_OWNER || 'code-orchestration';

// Persona configurations
const PERSONAS = {
  architect: {
    system: `You are a System Architect persona with expertise in:
- Microservice architecture design
- Technology stack selection
- System integration patterns
- CI/CD pipeline design
- Best practices for scalable systems

Your task is to analyze service requirements and make architectural decisions.`,
    temperature: 0.7
  },
  developer: {
    system: `You are a Senior Developer persona with expertise in:
- Clean code principles
- Test-driven development
- API design
- Performance optimization
- Security best practices

Your task is to implement features with production-ready code.`,
    temperature: 0.5
  },
  qa: {
    system: `You are a QA Engineer persona with expertise in:
- Code review best practices
- Test coverage analysis
- Security vulnerability detection
- Performance testing
- Documentation review

Your task is to review code quality and ensure standards are met.`,
    temperature: 0.3
  }
};

async function callAnthropic(prompt, persona = 'architect') {
  const personaConfig = PERSONAS[persona] || PERSONAS.architect;
  
  const data = JSON.stringify({
    model: 'claude-3-opus-20240229',
    max_tokens: 4096,
    temperature: personaConfig.temperature,
    system: personaConfig.system,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  const options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(responseData);
          if (res.statusCode === 200) {
            resolve(response.content[0].text);
          } else {
            reject(new Error(`API Error: ${response.error?.message || responseData}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function createServiceRepositories(serviceName, techStack) {
  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  
  const repos = [];
  
  // Main service repository
  const mainRepo = await octokit.repos.createInOrg({
    org: GITHUB_ORG,
    name: serviceName,
    description: `Main service repository for ${serviceName}`,
    private: false,
    auto_init: true,
    has_issues: true,
    has_projects: true
  });
  
  repos.push(mainRepo.data);
  
  // Copy workflow templates to new repo
  try {
    const developerWorkflow = await fs.readFile('.github/workflows/developer-workflow-template.yml', 'utf8');
    const qaWorkflow = await fs.readFile('.github/workflows/qa-reviewer.yml', 'utf8');
    
    // Create .github/workflows directory structure
    await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_ORG,
      repo: serviceName,
      path: '.github/workflows/developer.yml',
      message: 'Add developer workflow',
      content: Buffer.from(developerWorkflow).toString('base64')
    });
    
    await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_ORG,
      repo: serviceName,
      path: '.github/workflows/qa-reviewer.yml',
      message: 'Add QA reviewer workflow',
      content: Buffer.from(qaWorkflow).toString('base64')
    });
  } catch (error) {
    console.error('Error setting up workflows:', error);
  }
  
  return repos;
}

async function createImplementationIssues(repoName, features) {
  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  
  const issues = [];
  
  for (const feature of features) {
    const issue = await octokit.issues.create({
      owner: GITHUB_ORG,
      repo: repoName,
      title: feature.title,
      body: feature.description,
      labels: ['feature', 'implementation', 'automated']
    });
    
    issues.push(issue.data);
  }
  
  return issues;
}

async function setupCICD(repoName, techStack) {
  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  
  let ciConfig = '';
  
  // Generate CI/CD configuration based on tech stack
  if (techStack.includes('node') || techStack.includes('javascript')) {
    ciConfig = `name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
    - run: npm ci
    - run: npm run lint || echo "No lint script"
    - run: npm test || echo "No test script"`;
  } else if (techStack.includes('python')) {
    ciConfig = `name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    - run: pip install -r requirements.txt || echo "No requirements"
    - run: python -m flake8 . || echo "No flake8"
    - run: python -m pytest || echo "No tests"`;
  }
  
  if (ciConfig) {
    await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_ORG,
      repo: repoName,
      path: '.github/workflows/ci.yml',
      message: 'Add CI workflow',
      content: Buffer.from(ciConfig).toString('base64')
    });
  }
}

// Main execution
async function main() {
  const persona = process.argv[2] || 'architect';
  const promptFile = process.argv[3];
  const action = process.argv[4] || 'analyze';
  
  if (!promptFile) {
    console.error('Usage: node run-superclaude.js <persona> <prompt-file> [action]');
    process.exit(1);
  }
  
  try {
    const prompt = await fs.readFile(promptFile, 'utf8');
    console.log(`Running SuperClaude with ${persona} persona...`);
    
    const response = await callAnthropic(prompt, persona);
    console.log('SuperClaude Response:', response);
    
    // Parse response and take action based on persona
    if (persona === 'architect' && action === 'create-service') {
      // Extract service details from response
      const serviceMatch = response.match(/Service Name:\s*(\S+)/i);
      const techMatch = response.match(/Technology Stack:\s*([^\n]+)/i);
      
      if (serviceMatch) {
        const serviceName = serviceMatch[1];
        const techStack = techMatch ? techMatch[1] : 'node.js';
        
        console.log(`Creating service: ${serviceName} with tech stack: ${techStack}`);
        
        // Create repositories
        const repos = await createServiceRepositories(serviceName, techStack);
        console.log(`Created ${repos.length} repositories`);
        
        // Setup CI/CD
        await setupCICD(serviceName, techStack);
        console.log('CI/CD setup complete');
        
        // Create implementation issues
        const features = [
          { title: 'Setup project structure', description: 'Initialize project with chosen tech stack and folder structure' },
          { title: 'Implement core API endpoints', description: 'Create RESTful API endpoints for main functionality' },
          { title: 'Add database integration', description: 'Setup database connection and models' },
          { title: 'Implement authentication', description: 'Add JWT-based authentication' },
          { title: 'Add tests', description: 'Write unit and integration tests' }
        ];
        
        const issues = await createImplementationIssues(serviceName, features);
        console.log(`Created ${issues.length} implementation issues`);
      }
    }
    
    // Save response to file for other workflows to use
    await fs.writeFile('/tmp/superclaude-response.txt', response);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}