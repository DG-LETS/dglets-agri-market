const fs = require('fs');
const path = require('path');

const replacements = [
  { file: 'mobile/src/components/ui/Input.tsx', find: "{revealed ? '🙈' : '👁️'}", replace: "{revealed ? <EyeOff size={20} color=\"#666\" /> : <Eye size={20} color=\"#666\" />}", icons: ['Eye', 'EyeOff'] },
  { file: 'mobile/src/screens/auth/HaulageProfileSetupScreen.tsx', find: "emoji: '🏍️'", replace: "emoji: <Truck size={20} color=\"#666\" />", icons: ['Truck'] },
  { file: 'mobile/src/screens/auth/HaulageProfileSetupScreen.tsx', find: "emoji: '🚐'", replace: "emoji: <Truck size={20} color=\"#666\" />", icons: ['Truck'] },
  { file: 'mobile/src/screens/auth/HaulageProfileSetupScreen.tsx', find: "emoji: '🚚'", replace: "emoji: <Truck size={20} color=\"#666\" />", icons: ['Truck'] },
  { file: 'mobile/src/screens/auth/HaulageProfileSetupScreen.tsx', find: "emoji: '🏗️'", replace: "emoji: <Truck size={20} color=\"#666\" />", icons: ['Truck'] },
  { file: 'mobile/src/screens/auth/HaulageProfileSetupScreen.tsx', find: "emoji: '🚜'", replace: "emoji: <Truck size={20} color=\"#666\" />", icons: ['Truck'] },
  { file: 'mobile/src/screens/auth/HaulageProfileSetupScreen.tsx', find: "<Text>🏢</Text>", replace: "<Store size={24} color=\"#666\" />", icons: ['Store'] },
  { file: 'mobile/src/screens/auth/HaulageProfileSetupScreen.tsx', find: "<Text>⚖️</Text>", replace: "<Scale size={24} color=\"#666\" />", icons: ['Scale'] },
  { file: 'mobile/src/screens/auth/HaulageProfileSetupScreen.tsx', find: "<Text>📅</Text>", replace: "<Calendar size={24} color=\"#666\" />", icons: ['Calendar'] },
  { file: 'mobile/src/screens/auth/HaulageProfileSetupScreen.tsx', find: "📋 What happens next?", replace: "<ClipboardList size={20} color=\"#666\" /> What happens next?", icons: ['ClipboardList'] },
  { file: 'mobile/src/screens/main/HaulageProviderDashboardScreen.tsx', find: "emoji: '📋'", replace: "icon: 'ClipboardList'", icons: [] },
  { file: 'mobile/src/screens/main/HaulageProviderDashboardScreen.tsx', find: "emoji: '🚚'", replace: "icon: 'Truck'", icons: [] },
  { file: 'mobile/src/screens/main/HaulageProviderDashboardScreen.tsx', find: "emoji: '✅'", replace: "icon: 'CheckCircle'", icons: [] },
  { file: 'mobile/src/screens/main/HaulageProviderDashboardScreen.tsx', find: "emoji: '❌'", replace: "icon: 'XCircle'", icons: [] },
  { file: 'mobile/src/screens/main/HomeScreen.tsx', find: "emoji: '🚚'", replace: "icon: 'Truck'", icons: [] },
];

replacements.forEach(({ file, find, replace, icons }) => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(find)) {
    content = content.replace(find, replace);
    
    // Add imports
    if (icons.length > 0) {
      let importRegex = /import\s+{(.*?)}\s+from\s+["']lucide-react-native["']/g;
      let match = importRegex.exec(content);
      
      if (match) {
        let existingIcons = match[1].split(',').map(s => s.trim());
        let toAdd = icons.filter(i => !existingIcons.includes(i));
        if (toAdd.length > 0) {
          let newImportStr = `import { ${[...existingIcons, ...toAdd].join(', ')} } from "lucide-react-native"`;
          content = content.replace(match[0], newImportStr);
        }
      } else {
        content = `import { ${icons.join(', ')} } from "lucide-react-native";\n` + content;
      }
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
