import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

async function prepareAwesomePR(myRepo, myDescription, targetAwesomeRepo, sectionHeading) {
  console.log(`📦 Preparing Pull Request for Awesome List: ${targetAwesomeRepo}...`);
  
  const tempDir = join(tmpdir(), `awesome-pr-${Date.now()}`);
  mkdirSync(tempDir, { recursive: true });

  try {
    // 1. Fork and Clone the target Awesome List
    console.log(`🔄 Forking and cloning ${targetAwesomeRepo} to temporary folder...`);
    execSync(`gh repo fork ${targetAwesomeRepo} --clone --dir="${tempDir}"`, { stdio: 'inherit' });

    // 2. Read README.md
    const readmePath = join(tempDir, 'README.md');
    let readmeContent = readFileSync(readmePath, 'utf8');

    // 3. Find the correct section and insert
    // e.g. sectionHeading is "### MCP Servers" or "## Tools"
    const headingIndex = readmeContent.indexOf(sectionHeading);
    if (headingIndex === -1) {
      throw new Error(`Could not find section "${sectionHeading}" in README.md`);
    }

    console.log(`✏️ Inserting entry into README under "${sectionHeading}"...`);
    const linkEntry = `- [${myRepo.split('/')[1]}](https://github.com/${myRepo}) - ${myDescription}`;
    
    // Find next heading or end of list to insert in alphabetical order
    // A simple insertion at the top of the section for now:
    const insertPosition = headingIndex + sectionHeading.length;
    const updatedContent = 
      readmeContent.slice(0, insertPosition) + 
      `\n${linkEntry}` + 
      readmeContent.slice(insertPosition);

    writeFileSync(readmePath, updatedContent);

    // 4. Show git diff
    console.log('\n🔍 Preview of changes (git diff):');
    execSync('git diff', { cwd: tempDir, stdio: 'inherit' });

    // 5. Build instruction commands
    const branchName = `add-${myRepo.split('/')[1].toLowerCase()}`;
    console.log('\n========================================');
    console.log('🎉 PULL REQUEST PREPARED!');
    console.log('========================================');
    console.log('To submit this pull request, run the following commands:');
    console.log(`  cd "${tempDir}"`);
    console.log(`  git checkout -b ${branchName}`);
    console.log(`  git add README.md`);
    console.log(`  git commit -m "Add ${myRepo.split('/')[1]} to awesome list"`);
    console.log(`  git push origin ${branchName}`);
    console.log(`  gh pr create --title "Add ${myRepo.split('/')[1]}" --body "Please add my tool to the awesome list! Thank you."`);
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Failed to prepare Awesome PR:', error.message);
    rmSync(tempDir, { recursive: true, force: true });
  }
}

const args = process.argv.slice(2);
const myRepo = args[0] || 'Rishiidev/claude-github-launch';
const myDescription = args[1] || 'Full GitHub launch pipeline for Claude Code skills and any project.';
const targetAwesomeRepo = args[2] || 'punkpeye/awesome-mcp';
const sectionHeading = args[3] || '### Tools';

prepareAwesomePR(myRepo, myDescription, targetAwesomeRepo, sectionHeading);
