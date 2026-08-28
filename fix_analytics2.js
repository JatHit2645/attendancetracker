const fs = require('fs');

let c = fs.readFileSync('src/screens/main/AnalyticsScreen.tsx', 'utf8');

const calendarOld = `        {activeMonths.map(({ year, monthIndex }, idx) => {
          const calendarData = getCalendarMatrix(
            year,
            monthIndex,
            records,
            holidays,
          );
          const monthName = new Date(year, monthIndex).toLocaleString(
            "default",
            { month: "long", year: "numeric" },
          );
          const rows = chunkArray(calendarData, 7);

          return (
            <View key={idx} style={styles.monthSection}>`;

const calendarNew = `        {useMemo(() => activeMonths.map(({ year, monthIndex }, idx) => {
          const calendarData = getCalendarMatrix(
            year,
            monthIndex,
            records,
            holidays,
          );
          const monthName = new Date(year, monthIndex).toLocaleString(
            "default",
            { month: "long", year: "numeric" },
          );
          const rows = chunkArray(calendarData, 7);

          return (
            <View key={idx} style={styles.monthSection}>`,
calendarEndOld = `              </View>
            </View>
          );
        })}

        {/* Selected Day Details Panel */}`;
const calendarEndNew = `              </View>
            </View>
          );
        }), [activeMonths, records, holidays, selectedDay])}

        {/* Selected Day Details Panel */}`;


c = c.replace(calendarOld, calendarNew);
c = c.replace(calendarEndOld, calendarEndNew);


const heatmapColorOld = `  const getHeatmapColor = (ratio: number) => {`;
const heatmapColorNew = `  const getHeatmapColor = useCallback((ratio: number) => {`;

const heatmapColorEndOld = `      return \`rgb(\${r}, \${g}, \${b})\`;
    };`;
const heatmapColorEndNew = `      return \`rgb(\${r}, \${g}, \${b})\`;
    }, []);`;

c = c.replace(heatmapColorOld, heatmapColorNew);
c = c.replace(heatmapColorEndOld, heatmapColorEndNew);


fs.writeFileSync('src/screens/main/AnalyticsScreen.tsx', c);
