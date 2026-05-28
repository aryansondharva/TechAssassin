const fs = require('fs');
let content = fs.readFileSync('Client/src/components/CommunitySection.tsx', 'utf-8');
content = content.replace('flex h-40 max-w-xl items-center justify-center md:h-48', 'flex h-56 max-w-xl items-center justify-center md:h-64');
content = content.replace('relative h-40 w-40', 'relative h-56 w-56 md:h-64 md:w-64');
content = content.replace('className="h-full w-full object-contain"', 'className="h-full w-full object-contain scale-[1.3] md:scale-[1.5]"');
fs.writeFileSync('Client/src/components/CommunitySection.tsx', content);
console.log('Replaced successfully');
