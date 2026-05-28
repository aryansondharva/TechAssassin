const fs = require('fs');
const path = require('path');

function addImportAndReplaceSrc(filePath, assetName, importName, regex) {
  let content = fs.readFileSync(filePath, 'utf-8');
  if (content.includes(importName)) return; // Already imported
  
  // Find the last import statement
  const lastImportIndex = content.lastIndexOf('import ');
  let endOfImports = 0;
  if (lastImportIndex !== -1) {
    endOfImports = content.indexOf('\n', lastImportIndex) + 1;
  }
  
  let relativePath = '@/assets/' + assetName;
  
  const importStatement = `import ${importName} from '${relativePath}';\n`;
  
  content = content.slice(0, endOfImports) + importStatement + content.slice(endOfImports);
  content = content.replace(regex, `{${importName}}`);
  
  fs.writeFileSync(filePath, content);
}

// Logo replacements
const logoFiles = [
  'Client/src/pages/SignIn.tsx',
  'Client/src/pages/SignUp.tsx',
  'Client/src/pages/ForgotPassword.tsx',
  'Client/src/pages/Aura.tsx',
  'Client/src/components/Navbar.tsx',
  'Client/src/components/Footer.tsx'
];
logoFiles.forEach(f => {
  addImportAndReplaceSrc(f, 'logo.png', 'logoImg', /"\/logo\.png"/g);
});

// CommunitySection replacements
let communityContent = fs.readFileSync('Client/src/components/CommunitySection.tsx', 'utf-8');
communityContent = `import founderImg from '@/assets/founder.png';\nimport manthanImg from '@/assets/manthan.png';\nimport flagImg from '@/assets/flag.webp';\n` + communityContent;
communityContent = communityContent.replace(/"\/founder\.png"/g, '{founderImg}');
communityContent = communityContent.replace(/"\/manthan\.png"/g, '{manthanImg}');
communityContent = communityContent.replace(/"\/flag\.webp"/g, '{flagImg}');
fs.writeFileSync('Client/src/components/CommunitySection.tsx', communityContent);

// aboutData.ts replacements
let aboutDataContent = fs.readFileSync('Client/src/components/about/aboutData.ts', 'utf-8');
aboutDataContent = `import founderImg from '@/assets/founder.png';\nimport manthanImg from '@/assets/manthan.png';\n` + aboutDataContent;
aboutDataContent = aboutDataContent.replace(/"\/founder\.png"/g, 'founderImg');
aboutDataContent = aboutDataContent.replace(/"\/manthan\.png"/g, 'manthanImg');
fs.writeFileSync('Client/src/components/about/aboutData.ts', aboutDataContent);

console.log('Images replaced successfully');
