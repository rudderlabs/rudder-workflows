const { Octokit } = require('@octokit/rest');
const yaml = require('js-yaml');
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = process.env.GITHUB_REPOSITORY.split('/')[0];
const repo = process.env.GITHUB_REPOSITORY.split('/')[1];
const prNumber = process.env.GITHUB_REF.split('/')[2];

// Recursive function to extract keys
function extractKeys(obj, keys) {
    let values = [];
    for (let key in obj) {
        if (obj.hasOwnProperty(key) && keys.includes(key)) {
            values.push(obj[key]);
        }
        if (typeof obj[key] === 'object') {
            values = values.concat(extractKeys(obj[key], keys));
        }
    }
    return values;
}

async function run() {
    try {
        const { data: files } = await octokit.pulls.listFiles({
            owner,
            repo,
            pull_number: prNumber
        });

        for (const file of files) {
            if (!file.filename.includes('/') && (file.filename.endsWith('.yaml') || file.filename.endsWith('.yml'))) {
                const { data: contents } = await octokit.repos.getContent({
                    owner,
                    repo,
                    path: file.filename,
                    ref: 'refs/pull/' + prNumber + '/head'
                });

                const content = Buffer.from(contents.content, 'base64').toString();
                const doc = yaml.load(content);  // changed from yaml.safeLoad to yaml.load

                const keysToExtract = ['image', 'tag', 'version', 'repository'];
                let extractedValues = extractKeys(doc, keysToExtract);

                // ensure the values are unique
                let uniqueValues = [...new Set(extractedValues)];

                console.log(`Values from ${file.filename}: `, uniqueValues);
            }
        }
    } catch (error) {
        console.error("Error: ", error);
    }
}

run();
