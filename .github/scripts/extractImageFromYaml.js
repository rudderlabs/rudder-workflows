const { execSync } = require('child_process');
const fs = require('fs');
const yaml = require('yaml');

function getGitDiffFiles() {
  const baseBranch = process.env['GITHUB_BASE_REF'];
  execSync(`git fetch origin ${baseBranch}`);
  const output = execSync(`git diff --name-only origin/${baseBranch} HEAD`, { encoding: 'utf-8' });
  return output.split('\n').filter(file => file.trim() !== '');
}

// function getGitDiffFiles() {
//     //Replace with the paths of your sample YAML files to test on local
//     return [
//       'sample1.yaml',
//       'sample2.yaml',
//       'image_data.yaml',
//     ];
// }

function extractImageRegistry(obj, filePath, images) {
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      extractImageRegistry(obj[key], filePath, images);
    } else if (key.toLowerCase() === 'image') {
      images.push(obj[key]);
    }
  }

  if (obj.hasOwnProperty('repository')) {
    let repository = obj.repository;
    let versionOrTag = null;

    if (obj.hasOwnProperty('version')) {
      versionOrTag = obj.version;
    } else if (obj.hasOwnProperty('tag')) {
      versionOrTag = obj.tag;
    }

    if (versionOrTag) {
      images.push(`${repository}:${versionOrTag}`);
    } else {
      const slashIndex = repository.lastIndexOf('/');
      if (slashIndex !== -1 && repository.includes(':')) {
        images.push(repository);
      }
    }
  }
}

function extractNestedImage(obj, filePath, images) {
  let repository = null;
  let tag = null;

  for (const key in obj) {
    if (key.toLowerCase() === 'repository') {
      repository = obj[key];
    } else if (key.toLowerCase() === 'tag') {
      tag = obj[key];
    }
  }

  if (repository && tag) {
    images.push(`${repository}:${tag}`);
  }
}

(async () => {
  const diffFiles = getGitDiffFiles();
  const yamlFiles = diffFiles.filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));

  let images = [];

  for (const yamlFile of yamlFiles) {
    try {
      const fileContent = fs.readFileSync(yamlFile, 'utf-8');
      const yamlObj = yaml.parse(fileContent);
      extractImageRegistry(yamlObj, yamlFile, images);
      extractNestedImage(yamlObj, yamlFile, images);
    } catch (error) {
      console.error(`Error parsing ${yamlFile}: ${error.message}`);
    }
  }
  // Remove duplicates from images array
  images = [...new Set(images)];

  // Output the images as a string with images separated by spaces

  console.log(images.join(' '));
})();
