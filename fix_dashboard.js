const fs = require('fs');

let c = fs.readFileSync('src/screens/main/DashboardScreen.tsx', 'utf8');

c = c.replace(
`  const changeDate = (days: number) => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const newDate = new Date(y, m - 1, d);
    newDate.setDate(newDate.getDate() + days);
    
    const yyyy = newDate.getFullYear();
    const mm = String(newDate.getMonth() + 1).padStart(2, "0");
    const dd = String(newDate.getDate()).padStart(2, "0");
    setSelectedDate(\`\${yyyy}-\${mm}-\${dd}\`);
  };`,
`  const changeDate = React.useCallback((days: number) => {
    const [y, m, d] = selectedDate.split("-").map(Number);
    const newDate = new Date(y, m - 1, d);
    newDate.setDate(newDate.getDate() + days);
    
    const yyyy = newDate.getFullYear();
    const mm = String(newDate.getMonth() + 1).padStart(2, "0");
    const dd = String(newDate.getDate()).padStart(2, "0");
    setSelectedDate(\`\${yyyy}-\${mm}-\${dd}\`);
  }, [selectedDate]);`
);

const statsOld = `  // --- Calculate Stats ---
  const defaultThreshold = 75; // Or avg of subjects
  let totalConducted = records.filter((r) => r.status !== "cancelled").length;
  let totalAttended = records.filter((r) => r.status === "present").length;
  let totalMissed = records.filter((r) => r.status === "absent").length;
  let totalCancelled = records.filter((r) => r.status === "cancelled").length;

  const stats = {
    overallPercentage: calculatePercentage(totalAttended, totalConducted),
    totalAttended,
    totalConducted,
    totalMissed,
    totalCancelled,
    totalSubjects: subjects.length,
    defaultThreshold,
  };

  const overallStatus = getAttendanceStatus(
    stats.overallPercentage,
    stats.defaultThreshold,
  );
  const _overallCanMiss = lecturesCanMiss(
    stats.totalAttended,
    stats.totalConducted,
    stats.defaultThreshold,
  );`;

const statsNew = `  // --- Calculate Stats ---
  const { stats, overallStatus, _overallCanMiss } = useMemo(() => {
    const defaultThreshold = 75; // Or avg of subjects
    let totalConducted = records.filter((r) => r.status !== "cancelled").length;
    let totalAttended = records.filter((r) => r.status === "present").length;
    let totalMissed = records.filter((r) => r.status === "absent").length;
    let totalCancelled = records.filter((r) => r.status === "cancelled").length;

    const statsObj = {
      overallPercentage: calculatePercentage(totalAttended, totalConducted),
      totalAttended,
      totalConducted,
      totalMissed,
      totalCancelled,
      totalSubjects: subjects.length,
      defaultThreshold,
    };

    const statusObj = getAttendanceStatus(
      statsObj.overallPercentage,
      statsObj.defaultThreshold,
    );
    const canMissObj = lecturesCanMiss(
      statsObj.totalAttended,
      statsObj.totalConducted,
      statsObj.defaultThreshold,
    );
    return { stats: statsObj, overallStatus: statusObj, _overallCanMiss: canMissObj };
  }, [records, subjects.length]);`;

c = c.replace(statsOld, statsNew);

fs.writeFileSync('src/screens/main/DashboardScreen.tsx', c);
