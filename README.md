# Code Orchestration Center

## Overview
This is the central orchestration repository for automated code generation using SuperClaude personas. The system automates the entire software development lifecycle from architecture design to implementation and QA.

## How It Works

### 1. Service Creation Flow
1. Create a new issue using the "Service Creation Request" template
2. The issue must have the `service-type` label
3. SuperClaude Architect persona will:
   - Analyze requirements
   - Create service repositories
   - Set up CI/CD pipelines
   - Generate implementation issues

### 2. Development Flow
1. Issues created in service repositories trigger development
2. SuperClaude Developer persona will:
   - Implement the feature
   - Write tests
   - Create a PR

### 3. QA Flow
1. PRs trigger automatic QA review
2. SuperClaude QA persona will:
   - Review code quality
   - Run tests and linting
   - Approve or request changes
3. Approved PRs are automatically merged

## Setup Requirements

### GitHub Secrets Required
- `ANTHROPIC_API_KEY`: Your Anthropic API key for Claude
- `ORG_ADMIN_TOKEN`: GitHub token with org admin permissions

### Workflow Templates
- `architect-orchestrator.yml`: Handles service creation
- `developer-workflow-template.yml`: Template for service repos
- `qa-reviewer.yml`: Handles PR reviews

## Issue Labels
- `service-type`: Triggers architect workflow
- `implementation`: Triggers developer workflow
- `feature`: Feature implementation
- `bug`: Bug fix
- `qa-approved`: PR approved by QA
- `needs-work`: PR needs changes

## Best Practices
1. Always use issue templates for consistency
2. Provide detailed requirements in service requests
3. Monitor workflow runs for any failures
4. Review generated code before production deployment

## Monitoring
Check GitHub Actions tab for:
- Workflow execution status
- Error logs
- Performance metrics

## Support
For issues or improvements, create an issue in this repository.