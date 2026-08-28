const fs = require('fs');
let c = fs.readFileSync('src/screens/main/AnalyticsScreen.tsx', 'utf8');
c = c.replace('import { useState, useMemo, useEffect } from "react";', 'import { useState, useMemo, useEffect, useCallback } from "react";');
c = c.replace('const loadData = async () => {', 'const loadData = useCallback(async () => {');
c = c.replace(/    } catch \(error\) \{\r?\n      console\.warn\("Failed to load analytics data", error\);\r?\n    \}\r?\n  \};/, '    } catch (error) {\n      console.warn("Failed to load analytics data", error);\n    }\n  }, [selectedPeriod]);');
fs.writeFileSync('src/screens/main/AnalyticsScreen.tsx', c);
