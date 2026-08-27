const fs = require('fs');

function replaceFile(path, replacer) {
  const content = fs.readFileSync(path, 'utf8');
  fs.writeFileSync(path, replacer(content));
}

replaceFile('src/components/AddClassSheet.tsx', c => c.replace(', useWindowDimensions } from \'react-native\';', '  useWindowDimensions\n} from \'react-native\';').replace('import {\n  canvas,', 'import {\n  palette,\n  canvas,'));

replaceFile('src/components/HolidayManagerSheet.tsx', c => c.replace(/color=palette\.white/g, 'color={palette.white}').replace(/color=palette\.red\[600\]/g, 'color={palette.red[600]}').replace('import {\n  canvas,', 'import {\n  palette,\n  canvas,'));

replaceFile('src/components/SemesterSwitchSheet.tsx', c => c.replace(', useWindowDimensions } from \'react-native\';', '  useWindowDimensions\n} from \'react-native\';'));

replaceFile('src/components/StopwatchTimerBanner.tsx', c => c.replace(/color=palette\.white/g, 'color={palette.white}').replace('import {\n  canvas,', 'import {\n  palette,\n  canvas,'));

replaceFile('src/components/SubjectBottomSheet.tsx', c => c.replace(', useWindowDimensions } from \'react-native\';', '  useWindowDimensions\n} from \'react-native\';'));

replaceFile('src/components/TimerConfirmationSheet.tsx', c => c.replace(', useWindowDimensions } from \'react-native\';', '  useWindowDimensions\n} from \'react-native\';').replace(/color=palette\.white/g, 'color={palette.white}').replace('import {\n  canvas,', 'import {\n  palette,\n  canvas,'));

replaceFile('src/screens/main/ProfileScreen.tsx', c => c.replace(', useWindowDimensions } from \'react-native\';', '  useWindowDimensions\n} from \'react-native\';').replace(/color=palette\.white/g, 'color={palette.white}').replace(/color=palette\.red\[600\]/g, 'color={palette.red[600]}'));
