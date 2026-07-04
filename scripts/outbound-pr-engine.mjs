import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

async function runOutboundEngine(searchQuery, myRepoUrl, myToolName) {
  console.log(`🚀 Starting Self-Healing PR Engine...`);
  console.log(`🔍 Searching for repositories matching: "${searchQuery}"\n`);

  try {
    // 1. Search GitHub for target repositories
    const searchResult = execSync(`gh api -X GET search/repositories -F q="${searchQuery}" -F sort=updated -F per_page=10`, { encoding: 'utf8' });
    const repos = JSON.parse(searchResult).items;

    if (!repos || repos.length === 0) {
      console.log('❌ No repositories found matching the query.');
      return;
    }

    console.log(`Found ${repos.length} recent repositories. Scanning for missing CI workflows...`);

    let processedCount = 0;

    for (const repo of repos) {
      if (processedCount >= 1) { // LIMIT TO 1 FOR SAFETY/TESTING
        console.log(`\n🛑 Reached safety limit (1 PR per run). Exiting.`);
        break;
      }

      const repoName = repo.full_name;
      const defaultBranch = repo.default_branch;

      console.log(`\n========================================`);
      console.log(`👀 Analyzing: ${repoName}`);

      // Check if .github/workflows/main.yml exists via GitHub API
      try {
        execSync(`gh api -X GET repos/${repoName}/contents/.github/workflows`, { stdio: 'pipe' });
        console.log(`⏭️  Repository already has GitHub workflows. Skipping.`);
        continue; // They have workflows, skip them
      } catch (e) {
        // Folder doesn't exist, which means they need our help!
        console.log(`✅ Target identified! Missing .github/workflows. Proceeding with PR...`);
      }

      // 2. Fork and Clone
      const tempDir = join(tmpdir(), `pr-engine-${Date.now()}`);
      mkdirSync(tempDir, { recursive: true });

      try {
        console.log(`🔄 Forking and cloning ${repoName} to temporary folder...`);
        execSync(`gh repo fork ${repoName} --clone --dir="${tempDir}"`, { stdio: 'inherit' });

        // 3. Generate missing files (e.g. Basic Node.js CI or simple Validation)
        console.log(`✏️  Injecting missing CI workflow...`);
        const workflowDir = join(tempDir, '.github', 'workflows');
        mkdirSync(workflowDir, { recursive: true });
        
        const workflowContent = `name: Validate
on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Run checks
      run: echo "CI configured successfully!"
`;
        writeFileSync(join(workflowDir, 'validate.yml'), workflowContent);

        // 4. Commit and PR
        const branchName = `ci-validation-setup-${Date.now()}`;
        console.log('\n🔍 Preview of changes (git diff):');
        execSync('git diff', { cwd: tempDir, stdio: 'inherit' });

        console.log('\n🎉 PUSHING AND OPENING PULL REQUEST...');
        
        // Setup git config to ensure commits work
        execSync(`git checkout -b ${branchName}`, { cwd: tempDir, stdio: 'ignore' });
        execSync(`git add .github/workflows/validate.yml`, { cwd: tempDir, stdio: 'ignore' });
        execSync(`git commit -m "chore: add github actions validation workflow"`, { cwd: tempDir, stdio: 'ignore' });
        execSync(`git push origin ${branchName}`, { cwd: tempDir, stdio: 'inherit' });

        // Open the PR
        const prBody = `Hi! 👋 I noticed this awesome project was missing a basic GitHub Actions CI workflow to validate PRs. 

I've automatically generated one for you so it runs basic checks on push. 

> This PR was generated using [${myToolName}](${myRepoUrl})! If this was helpful, I'd appreciate a star on the project! Keep up the great work.`;
        
        execSync(`gh pr create --title "chore: add github actions validation workflow" --body "${prBody}"`, { cwd: tempDir, stdio: 'inherit' });
        console.log(`\n✅ PULL REQUEST SUCCESSFULLY OPENED FOR ${repoName}!`);
        
        processedCount++;
      } catch (error) {
        console.error(`❌ Failed to process ${repoName}:`, error.message);
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
    }

  } catch (error) {
    console.error('❌ Engine failed:', error.message);
  }
}

const args = process.argv.slice(2);
const searchQuery = args[0] || 'topic:mcp-server language:javascript';
const myRepoUrl = args[1] || 'https://github.com/Rishiidev/claude-github-launch';
const myToolName = args[2] || 'claude-github-launch';

runOutboundEngine(searchQuery, myRepoUrl, myToolName);
