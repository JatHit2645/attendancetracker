const fs = require('fs');
let c = fs.readFileSync('src/components/AddClassSheet.tsx', 'utf8');
c = c.replace('  accent,\n  shadow,\n} from', '  accent,\n  shadow,\n  feedback,\n} from');
c = c.replace('  accent,\r\n  shadow,\r\n} from', '  accent,\r\n  shadow,\r\n  feedback,\r\n} from');
fs.writeFileSync('src/components/AddClassSheet.tsx', c);
