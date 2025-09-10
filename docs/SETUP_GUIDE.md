# Setup Guide for SuperClaude Code Orchestration

## Prerequisites

1. GitHub Organization with admin access
2. Anthropic API Key (with opus model access)
3. GitHub Personal Access Token with following permissions:
   - repo (all)
   - admin:org (all)
   - workflow

## Setup Steps

### 1. Configure GitHub Secrets

Go to your repository settings → Secrets and variables → Actions, and add:

1. **ANTHROPIC_API_KEY**
   - Your Anthropic API key
   - Must have access to opus model

2. **ORG_ADMIN_TOKEN**
   - GitHub Personal Access Token
   - Needs org admin permissions for creating repositories

### 2. Manual Secret Setup (if CLI fails)

```bash
# Navigate to: https://github.com/code-orchestration/center/settings/secrets/actions

# Click "New repository secret" and add:
# Name: ANTHROPIC_API_KEY
# Value: [Your API Key]

# Name: ORG_ADMIN_TOKEN  
# Value: [Your GitHub Token]
```

### 3. Test the Pipeline

Create a test issue using the service-type template:

```bash
gh issue create \
  --repo code-orchestration/center \
  --title "[SERVICE] Test User Service" \
  --label "service-type,architect,automation" \
  --body "Service Name: user-service
Service Description: A microservice for user management
Required Features:
- User registration and authentication
- User profile management
- JWT token generation
- Password reset functionality
Priority: Medium"
```

### 4. Monitor Workflow Execution

1. Go to Actions tab in the repository
2. Watch the "Architect Orchestrator" workflow
3. Check for any errors in the workflow logs

## Troubleshooting

### Common Issues

1. **Workflow not triggering**
   - Ensure the issue has the `service-type` label
   - Check if GitHub Actions is enabled for the repository

2. **Authentication errors**
   - Verify ANTHROPIC_API_KEY is correctly set
   - Ensure ORG_ADMIN_TOKEN has proper permissions

3. **Repository creation fails**
   - Check if the token has org admin permissions
   - Verify the organization name is correct

## Manual Testing

If you want to test locally before deploying:

```bash
# Install dependencies
cd /Users/choegwang-won/center
npm install

# Test repository creation script
export ORG_ADMIN_TOKEN="your_token_here"
node .github/scripts/create-service-repos.js test-repo "Test repository"
```

## Next Steps

After successful setup:
1. Create service-type issues to generate new services
2. Monitor the automated workflows
3. Review generated code and PRs
4. Customize workflows as needed