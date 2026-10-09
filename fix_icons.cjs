const fs = require('fs');

// Fix ProfileScreen
let c = fs.readFileSync('./mobile/src/screens/main/ProfileScreen.tsx', 'utf8');
c = c.replace('<Text style={s.verifyIcon}>{item.icon}</Text>', '<View style={s.verifyIcon}>{item.icon}</View>');
c = c.replace('<Text style={s.avatarEditIcon}>{uploading ? <Hourglass size={24} color="#666" /> : <Camera size={24} color="#666" />}</Text>', '<View style={s.avatarEditIcon}>{uploading ? <Hourglass size={24} color="#666" /> : <Camera size={24} color="#666" />}</View>');
fs.writeFileSync('./mobile/src/screens/main/ProfileScreen.tsx', c, 'utf8');

// Fix MarketScreen - EmptyState icon prop
let m = fs.readFileSync('./mobile/src/screens/main/MarketScreen.tsx', 'utf8');
m = m.replace('icon={nearMe ? <MapPin size={48} color="#666" /> : <Search size={48} color="#666" />}', 'icon={nearMe ? <MapPin size={48} color="#666" /> : <Search size={48} color="#666" />}');
fs.writeFileSync('./mobile/src/screens/main/MarketScreen.tsx', m, 'utf8');

console.log('ProfileScreen and MarketScreen fixed');
