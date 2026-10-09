const fs = require('fs');
const path = require('path');

const emojiMap = [
  { emoji: '✅', icon: 'CheckCircle' },
  { emoji: '✓', icon: 'Check' },
  { emoji: '❌', icon: 'XCircle' },
  { emoji: '👋', icon: 'Hand' },
  { emoji: '📊', icon: 'BarChart' },
  { emoji: '💳', icon: 'CreditCard' },
  { emoji: '🚪', icon: 'LogOut' },
  { emoji: '🌍', icon: 'Globe' },
  { emoji: '🏆', icon: 'Trophy' },
  { emoji: '⚡', icon: 'Zap' },
  { emoji: '📝', icon: 'ClipboardList' },
  { emoji: '💡', icon: 'Lightbulb' },
  { emoji: '🔑', icon: 'Key' },
  { emoji: '👨‍', icon: 'User' },
  { emoji: '🛒', icon: 'ShoppingCart' },
  { emoji: '🏪', icon: 'Store' },
  { emoji: '🤝', icon: 'Handshake' },
  { emoji: '🏭', icon: 'Factory' },
  { emoji: '🌙', icon: 'Moon' },
  { emoji: '⚠️', icon: 'AlertTriangle' },
  { emoji: '🔐', icon: 'Lock' },
  { emoji: '🏠', icon: 'Home' },
  { emoji: '✕', icon: 'X' },
  { emoji: '🤍', icon: 'Heart' },
  { emoji: '➤', icon: 'Send' }
];

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
    let iconsToAdd = new Set();

    // 1. Specific string replacements
    const specificReplacements = [
      { from: "<Text style={s.nearMeBannerClose}>✕</Text>", to: "<X size={20} color=\"#666\" />", icon: "X" },
      { from: "Alert.alert('✓ Profile photo updated!')", to: "Alert.alert('Profile photo updated!')", icon: null },
      { from: "label={user.status === 'ACTIVE' ? '✓ Active' : user.status}", to: "label={user.status === 'ACTIVE' ? 'Active' : user.status}", icon: null },
      { from: "label={item.status === 'verified' ? '✓ Verified' : item.status === 'pending' ? 'Pending' : 'Not started'}", to: "label={item.status === 'verified' ? 'Verified' : item.status === 'pending' ? 'Pending' : 'Not started'}", icon: null },
      { from: "<Text style={s.menuEmoji}>🌙</Text>", to: "<Moon size={24} color=\"#666\" />", icon: "Moon" },
      { from: "'🤖 AI-powered recommendations'", to: "'AI-powered recommendations'", icon: null },
      { from: "Alert.alert('Added to Cart ✓',", to: "Alert.alert('Added to Cart',", icon: null },
      { from: "{saved ? <Heart size={20} color=\"#666\" /> : '🤍'}", to: "{saved ? <Heart size={20} color=\"#666\" /> : <Heart size={20} color=\"#999\" />}", icon: "Heart" },
      { from: "label=\"🚚 Delivery\"", to: "label=\"Delivery\"", icon: null },
      { from: "product.deliveryAvailable ? '✓ Available' : 'Pickup only'", to: "product.deliveryAvailable ? 'Available' : 'Pickup only'", icon: null },
      { from: "<Text style={s.sellerVerified}>✓ Verified seller</Text>", to: "<Text style={s.sellerVerified}>Verified seller</Text>", icon: null },
      { from: "'Good morning 👋'", to: "'Good morning'", icon: null },
      { from: "'Good afternoon 👋'", to: "'Good afternoon'", icon: null },
      { from: "'Good evening 👋'", to: "'Good evening'", icon: null },
      { from: "Alert.alert('✅ Job Completed',", to: "Alert.alert('Job Completed',", icon: null },
      { from: "Alert.alert('✅ Confirm Delivery',", to: "Alert.alert('Confirm Delivery',", icon: null },
      { from: "'Confirming…' : '✅ Mark Delivered'", to: "'Confirming…' : 'Mark Delivered'", icon: null },
      { from: "Alert.alert('⚠️ Report User',", to: "Alert.alert('Report User',", icon: null },
      { from: "Alert.alert('✓ Reported',", to: "Alert.alert('Reported',", icon: null },
      { from: "{read ? '✓✓' : '✓'}", to: "{read ? <Check size={16} color=\"#4CAF50\" /> : <Check size={16} color=\"#999\" />}", icon: "Check" },
      { from: "<Text style={s.emptyChatIcon}>👋</Text>", to: "<Hand size={48} color=\"#666\" />", icon: "Hand" },
      { from: "<Text style={s.sendBtnText}>➤</Text>", to: "<Send size={24} color=\"white\" />", icon: "Send" },
      { from: "<Text style={s.progressCheck}>✓</Text>", to: "<Check size={20} color=\"#4CAF50\" />", icon: "Check" },
      { from: "<Text style={s.feeNoteTitle}>💡 How DG-LETS fees work</Text>", to: "<Text style={s.feeNoteTitle}><Lightbulb size={20} color=\"#666\" /> How DG-LETS fees work</Text>", icon: "Lightbulb" },
      { from: "`💳 Pay ₦${feeStatus?.amount?.toLocaleString()} & Activate`", to: "`Pay ₦${feeStatus?.amount?.toLocaleString()} & Activate`", icon: null },
      { from: "<Text style={s.devHint}>💡 Development: Check server console for OTP</Text>", to: "<Text style={s.devHint}><Lightbulb size={16} color=\"#666\" /> Development: Check server console for OTP</Text>", icon: "Lightbulb" },
      { from: "<TabIcon emoji=\"🏠\" label=\"Home\" focused={focused} />", to: "<TabIcon icon=\"Home\" label=\"Home\" focused={focused} />", icon: "Home" },
      { from: "<Text style={s.otpToggleText}>{useOtp ? '🔑 Sign in with password instead' : ' Sign in with OTP instead'}</Text>", to: "<Text style={s.otpToggleText}>{useOtp ? 'Sign in with password instead' : 'Sign in with OTP instead'}</Text>", icon: null },
      { from: "<View style={s.iconWrap}><Text style={s.icon}>🔐</Text></View>", to: "<View style={s.iconWrap}><Lock size={48} color=\"#666\" /></View>", icon: "Lock" },
    ];

    for (let r of specificReplacements) {
      if (content.includes(r.from)) {
        content = content.replace(r.from, r.to);
        hasChanges = true;
        if (r.icon) iconsToAdd.add(r.icon);
      }
    }

    // Replace emoji attributes: emoji="📋" -> icon={<ClipboardList />}
    for (let { emoji, icon } of emojiMap) {
      const emojiAttr = `emoji="${emoji}"`;
      if (content.includes(emojiAttr)) {
        content = content.split(emojiAttr).join(`icon={<${icon} size={20} color="#666" />}`);
        hasChanges = true;
        iconsToAdd.add(icon);
      }
      
      const emojiPropSingle = `emoji: '${emoji}'`;
      if (content.includes(emojiPropSingle)) {
        content = content.split(emojiPropSingle).join(`icon: '${icon}'`);
        hasChanges = true;
      }
      const emojiPropDouble = `emoji: "${emoji}"`;
      if (content.includes(emojiPropDouble)) {
        content = content.split(emojiPropDouble).join(`icon: '${icon}'`);
        hasChanges = true;
      }
    }

    if (hasChanges && iconsToAdd.size > 0) {
      console.log('Processed', filePath);
      
      // Parse imports to add Lucide icons
      let importRegex = /import\s+{(.*?)}\s+from\s+["']lucide-react-native["']/g;
      let match = importRegex.exec(content);
      
      if (match) {
        let existingIcons = match[1].split(',').map(s => s.trim());
        let toAdd = Array.from(iconsToAdd).filter(i => !existingIcons.includes(i));
        if (toAdd.length > 0) {
          let newImportStr = `import { ${[...existingIcons, ...toAdd].join(', ')} } from "lucide-react-native"`;
          content = content.replace(match[0], newImportStr);
        }
      } else {
        let newImportStr = `import { ${Array.from(iconsToAdd).join(', ')} } from "lucide-react-native";\n`;
        content = newImportStr + content;
      }
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
  }
});
