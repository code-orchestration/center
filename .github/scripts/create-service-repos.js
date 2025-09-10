#!/usr/bin/env node
// Script to create service repositories with CI/CD templates

const { Octokit } = require('@octokit/rest');
const fs = require('fs').promises;
const path = require('path');

async function createServiceRepo(octokit, org, repoName, description) {
  try {
    // Create repository
    const { data: repo } = await octokit.repos.createInOrg({
      org: org,
      name: repoName,
      description: description,
      private: false,
      auto_init: true,
      has_issues: true,
      has_projects: true,
      has_wiki: false
    });
    
    console.log(`Created repository: ${repo.full_name}`);
    
    // Copy workflow templates
    const workflows = [
      'developer-workflow-template.yml',
      'qa-reviewer.yml'
    ];
    
    for (const workflow of workflows) {
      const content = await fs.readFile(
        path.join(__dirname, '..', 'workflows', workflow),
        'utf8'
      );
      
      const workflowName = workflow.replace('-template', '');
      
      // Create workflow file in new repo
      await octokit.repos.createOrUpdateFileContents({
        owner: org,
        repo: repoName,
        path: `.github/workflows/${workflowName}`,
        message: `Add ${workflowName} workflow`,
        content: Buffer.from(content).toString('base64')
      });
      
      console.log(`Added workflow: ${workflowName}`);
    }
    
    // Add initial labels
    const labels = [
      { name: 'feature', color: '0e8a16', description: 'New feature' },
      { name: 'bug', color: 'd73a4a', description: 'Something isn\'t working' },
      { name: 'implementation', color: '7057ff', description: 'Implementation task' },
      { name: 'automated', color: 'f9d0c4', description: 'Automated by SuperClaude' },
      { name: 'qa-approved', color: '0e8a16', description: 'Approved by QA' },
      { name: 'needs-work', color: 'fbca04', description: 'Needs improvements' }
    ];
    
    for (const label of labels) {
      await octokit.issues.createLabel({
        owner: org,
        repo: repoName,
        ...label
      });
    }
    
    console.log('Added issue labels');
    
    return repo;
  } catch (error) {
    console.error(`Error creating repository ${repoName}:`, error.message);
    throw error;
  }
}

// Main execution
if (require.main === module) {
  const org = process.env.GITHUB_ORG || 'code-orchestration';
  const token = process.env.ORG_ADMIN_TOKEN;
  const repoName = process.argv[2];
  const description = process.argv[3] || 'Service repository';
  
  if (!token) {
    console.error('ORG_ADMIN_TOKEN environment variable is required');
    process.exit(1);
  }
  
  if (!repoName) {
    console.error('Repository name is required as first argument');
    process.exit(1);
  }
  
  const octokit = new Octokit({ auth: token });
  
  createServiceRepo(octokit, org, repoName, description)
    .then(() => console.log('Repository creation complete'))
    .catch(error => {
      console.error('Failed to create repository:', error);
      process.exit(1);
    });
}

module.exports = { createServiceRepo };