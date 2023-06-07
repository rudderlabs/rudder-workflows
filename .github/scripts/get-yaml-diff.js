const { Octokit } = require('@octokit/rest');
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = process.env.GITHUB_REPOSITORY.split('/')[0];
const repo = process.env.GITHUB_REPOSITORY.split('/')[1];
const prNumber = process.env.GITHUB_REF.split('/')[2];

async function run() {
    const { data: files } = await octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: prNumber
    });

    for (const file of files) {
        if (file.filename.endsWith('.yaml') || file.filename.endsWith('.yml')) {
            console.log(`Changes in file ${file.filename}:`);
            console.log(file.patch);
        }
    }
}

run();
