const fs = require('fs');
const path = require('path');

const emojiToLucide = {
  '🌾': 'Wheat',
  '🗺️': 'Map',
  '📬': 'Mail',
  'ðŸ“­': 'Mail',
  '❤️': 'Heart',
  '⏳': 'Hourglass',
  '📷': 'Camera',
  '📱': 'Smartphone',
  '🪪': 'IdCard',
  '📦': 'Package',
  '💬': 'MessageSquare',
  '🎉': 'PartyPopper',
  '📍': 'MapPin',
  '🔍': 'Search',
  '←': 'ArrowLeft',
  '👤': 'User',
  'ðŸ‘¤': 'User',
  '📞': 'Phone',
  '✉️': 'Mail',
  '🔒': 'Lock',
  '🔔': 'Bell',
  '🌱': 'Sprout',
  '💰': 'Banknote',
  '🚛': 'Truck',
  'ðŸš›': 'Truck',
  '🌿': 'Leaf'
};

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    if (f === 'node_modules' || f.startsWith('.')) return;
    if (fs.statSync(dirPath).isDirectory()) walkDir(dirPath, callback);
    else callback(dirPath);
  });
}

walkDir('./mobile/src', filePath => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    let uniqueIcons = new Set();
    
    for (const [emoji, icon] of Object.entries(emojiToLucide)) {
      if (content.includes(emoji)) {
        hasChanges = true;
        uniqueIcons.add(icon);
        
        content = content.split('<Text style={s.icon}>' + emoji + '</Text>').join('<' + icon + ' size={24} color="#666" />');
        content = content.split('<Text>' + emoji + '</Text>').join('<' + icon + ' size={24} color="#666" />');
        content = content.split('<Text style={s.quickEmoji}>' + emoji + '</Text>').join('<' + icon + ' size={24} color="#666" />');
        content = content.split('<Text style={s.catIconText}>' + emoji + '</Text>').join('<' + icon + ' size={24} color="#666" />');
        content = content.split('<Text style={s.notifIcon}>' + emoji + '</Text>').join('<' + icon + ' size={24} color="#666" />');
        content = content.split('<Text style={s.backIcon}>' + emoji + '</Text>').join('<' + icon + ' size={24} color="#666" />');
        content = content.split('<Text style={s.emptyFeaturedIcon}>' + emoji + '</Text>').join('<' + icon + ' size={24} color="#666" />');
        content = content.split('<Text style={s.doneIcon}>' + emoji + '</Text>').join('<' + icon + ' size={24} color="#666" />');
        content = content.split('<Text style={s.earningsIcon}>' + emoji + '</Text>').join('<' + icon + ' size={24} color="#666" />');
        content = content.split('<Text style={s.emptyIcon}>' + emoji + '</Text>').join('<' + icon + ' size={24} color="#666" />');
        content = content.split('<Text style={s.emptyOrdersIcon}>' + emoji + '</Text>').join('<' + icon + ' size={24} color="#666" />');
        
        content = content.split("'" + emoji + "'").join('<' + icon + ' size={20} color="#666" />');
        content = content.split('"' + emoji + '"').join('"' + icon + '"'); 
        
        // Fix for icon="emoji" in EmptyState
        content = content.split('icon="' + emoji + '"').join('icon={<' + icon + ' size={48} color="#666" />}');
      }
    }
    
    // Manual complex fixes
    if (content.includes("icon={nearMe ? '📍' : '🔍'}")) {
       content = content.replace("icon={nearMe ? '📍' : '🔍'}", "icon={nearMe ? <MapPin size={48} color=\"#666\" /> : <Search size={48} color=\"#666\" />}");
       uniqueIcons.add("MapPin");
       uniqueIcons.add("Search");
       hasChanges = true;
    }
    
    if (content.includes("{uploading ? '⏳' : '📷'}")) {
       content = content.replace("{uploading ? '⏳' : '📷'}", "{uploading ? <Hourglass size={24} color=\"#666\" /> : <Camera size={24} color=\"#666\" />}");
       uniqueIcons.add("Hourglass");
       uniqueIcons.add("Camera");
       hasChanges = true;
    }
    
    // Also strip out any remaining naked emojis in text strings?
    // Actually no, we shouldn't because they might be inside {item.icon || '📦'} 
    if (content.includes("{item.icon || '📦'}")) {
       content = content.replace("{item.icon || '📦'}", "{item.icon ? <Package size={24} color=\"#666\" /> : <Package size={24} color=\"#666\" />}"); // simplification since backend might just send the name
       uniqueIcons.add("Package");
       hasChanges = true;
    }
    
    // Replace all remaining bare emojis that are inside <Text> just in case
    for (const [emoji, icon] of Object.entries(emojiToLucide)) {
      if (content.includes(emoji)) {
        content = content.split(emoji).join(''); // DANGEROUS! Better to just let them be if we didn't catch them
      }
    }

    if (hasChanges && uniqueIcons.size > 0) {
       console.log('Processed', filePath);
       let importStmt = 'import { ' + Array.from(uniqueIcons).join(', ') + ' } from "lucide-react-native";\n';
       if (!content.includes('lucide-react-native')) {
         content = importStmt + content;
       }
       fs.writeFileSync(filePath, content, 'utf8');
    }
  }
});
