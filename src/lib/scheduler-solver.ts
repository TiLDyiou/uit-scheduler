import { Section, TimeSlot, ScheduleSolution, SolveRequest, SolveResult } from "@/types/scheduler";

export interface CourseOption {
  sections: Section[];
  course_code: string;
}

export function getBaseCourseCode(code: string): string {
  return code.replace(/\.[12]$/, "").trim();
}

export function getBaseSectionCode(sectionCode: string): string {
  const parts = sectionCode.split(".");
  if (parts.length > 1 && !isNaN(parseInt(parts[parts.length - 1], 10))) {
    return parts.slice(0, -1).join(".");
  }
  return sectionCode;
}

/**
 * Check if a candidate option overlaps with already occupied time slots
 */
function hasTimeConflict(
  occupiedSlots: Set<string>,
  sections: Section[]
): boolean {
  for (const s of sections) {
    for (const p of s.periods) {
      if (occupiedSlots.has(`${s.day_of_week}-${p}`)) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if two sections conflict in time
 */
export function doSectionsOverlap(a: Section, b: Section): boolean {
  if (a.day_of_week !== b.day_of_week) return false;
  return a.periods.some((p) => b.periods.includes(p));
}

/**
 * Calculate quality score and metrics for a solution to rank best options first
 */
export function calculateSolutionStats(sections: Section[]): {
  study_days_count: number;
  free_days: number[];
  morning_classes_count: number;
  afternoon_classes_count: number;
  total_credits: number;
  score: number;
} {
  const daysUsed = new Set<number>();
  let morningCount = 0;
  let afternoonCount = 0;

  // Track periods by day to calculate gaps
  const dayPeriods: Record<number, number[]> = {};

  for (const s of sections) {
    if (
      typeof s.day_of_week === "number" &&
      s.day_of_week >= 2 &&
      s.day_of_week <= 8 &&
      Array.isArray(s.periods) &&
      s.periods.length > 0
    ) {
      daysUsed.add(s.day_of_week);

      if (!dayPeriods[s.day_of_week]) {
        dayPeriods[s.day_of_week] = [];
      }
      dayPeriods[s.day_of_week].push(...s.periods);

      for (const p of s.periods) {
        if (p <= 5) morningCount++;
        else afternoonCount++;
      }
    }
  }

  const freeDays: number[] = [];
  for (let d = 2; d <= 8; d++) {
    if (!daysUsed.has(d)) {
      freeDays.push(d);
    }
  }

  // Calculate unique course credits (avoid double counting when theory and lab each have full credits)
  const courseCredits: Record<string, number> = {};
  for (const s of sections) {
    const baseCode = getBaseCourseCode(s.course_code);
    if (!courseCredits[baseCode] || s.credits > courseCredits[baseCode]) {
      courseCredits[baseCode] = s.credits;
    }
  }
  const totalCredits = Object.values(courseCredits).reduce((a, b) => a + b, 0);

  // Calculate gaps between periods on the same day
  let totalGaps = 0;
  for (const periods of Object.values(dayPeriods)) {
    const sorted = Array.from(new Set(periods)).sort((a, b) => a - b);
    for (let i = 0; i < sorted.length - 1; i++) {
      const gap = sorted[i + 1] - sorted[i] - 1;
      if (gap > 0) totalGaps += gap;
    }
  }

  // Higher score = better schedule:
  // - Reward free days (+30 pts per full day off)
  // - Penalize awkward gaps between classes (-5 pts per empty period)
  // - Prefer weekend off (Saturday/Sunday free +20 pts)
  let score = 100;
  score += freeDays.length * 30;
  score -= totalGaps * 5;
  if (!daysUsed.has(7)) score += 20; // Thứ 7 rảnh
  if (!daysUsed.has(8)) score += 20; // Chủ nhật rảnh

  return {
    study_days_count: daysUsed.size,
    free_days: freeDays,
    morning_classes_count: morningCount,
    afternoon_classes_count: afternoonCount,
    total_credits: totalCredits,
    score,
  };
}

const scoreSolution = calculateSolutionStats;

/**
 * Pure client-side CSP Solver with Theory-Lab pairing, busy slot avoidance,
 * conflict diagnosis, and multi-objective ranking.
 */
export function solveSchedule({
  course_codes,
  sections,
  available_slots,
  pinned_sections = {},
  pinned_section_codes = [],
  max_solutions = 100,
}: SolveRequest): SolveResult {
  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  const warnings: string[] = [];

  if (!course_codes || course_codes.length === 0) {
    return {
      solutions: [],
      warnings: ["Vui lòng chọn ít nhất 1 môn học để tiến hành xếp lịch."],
      stats: { total_options_considered: 0, execution_time_ms: 0 },
    };
  }

  const cleanCourseCodes = Array.from(
    new Set(course_codes.map(getBaseCourseCode))
  );

  // Map course codes to human-readable full course names
  const courseNamesByCode: Record<string, string> = {};
  for (const s of sections) {
    const baseCode = getBaseCourseCode(s.course_code);
    if (!courseNamesByCode[baseCode] || (!s.is_lab && s.course_name)) {
      courseNamesByCode[baseCode] = s.course_name || baseCode;
    }
  }
  const getCourseDisplayName = (code: string) =>
    courseNamesByCode[getBaseCourseCode(code)] || code;

  // 1. Group raw sections by base course code
  const rawSectionsByCourse: Record<string, Section[]> = {};
  for (const s of sections) {
    const baseCode = getBaseCourseCode(s.course_code);
    if (cleanCourseCodes.includes(baseCode)) {
      if (!rawSectionsByCourse[baseCode]) {
        rawSectionsByCourse[baseCode] = [];
      }
      rawSectionsByCourse[baseCode].push(s);
    }
  }

  // 2. Filter sections matching user available time slots
  const availableSet = available_slots
    ? new Set(available_slots.map((s) => `${s.day}-${s.period}`))
    : null;

  const validSectionsByCourse: Record<string, Section[]> = {};
  for (const [baseCC, sects] of Object.entries(rawSectionsByCourse)) {
    for (const s of sects) {
      if (availableSet) {
        const fits = s.periods.every((p) =>
          availableSet.has(`${s.day_of_week}-${p}`)
        );
        if (!fits) continue;
      }
      if (!validSectionsByCourse[baseCC]) {
        validSectionsByCourse[baseCC] = [];
      }
      validSectionsByCourse[baseCC].push(s);
    }
  }

  // 3. Pre-calculate which theory sections ACTUALLY require lab classes in the dataset
  const theoryRequiresLab = new Set<string>();
  for (const rawS of sections) {
    if (rawS.is_lab) {
      const baseSec = getBaseSectionCode(rawS.section_code);
      theoryRequiresLab.add(baseSec);
    }
  }

  // 4. Build compatible CourseOption items (Theory + Lab pairs)
  const courseOptions: Record<string, CourseOption[]> = {};
  const courseLevelWarnings: Record<string, string> = {};
  let totalOptionsCount = 0;

  for (const cc of cleanCourseCodes) {
    const sects = validSectionsByCourse[cc] || [];
    if (sects.length === 0) {
      const ccName = getCourseDisplayName(cc);
      const msg = `Không thể xếp môn ${ccName !== cc ? `${cc} (${ccName})` : cc} vì toàn bộ các lớp của môn này đều trùng với khung giờ bận của bạn.`;
      warnings.push(msg);
      courseLevelWarnings[cc] = msg;
      continue;
    }

    const theorySections: Record<string, Section> = {};
    const labSections: Record<string, Section[]> = {};

    for (const s of sects) {
      if (s.is_lab) {
        const baseSec = getBaseSectionCode(s.section_code);
        if (!labSections[baseSec]) labSections[baseSec] = [];
        labSections[baseSec].push(s);
      } else {
        theorySections[s.section_code] = s;
      }
    }

    const options: CourseOption[] = [];

    if (Object.keys(theorySections).length > 0) {
      for (const [sc, ts] of Object.entries(theorySections)) {
        const matchingLabs = labSections[sc] || [];

        if (theoryRequiresLab.has(sc)) {
          // Both theory and lab are mandatory for this section
          if (matchingLabs.length > 0) {
            for (const lab of matchingLabs) {
              // Ensure theory and lab do not collide with each other
              const collides = doSectionsOverlap(ts, lab);
              if (!collides) {
                options.push({
                  course_code: cc,
                  sections: [ts, lab],
                });
              }
            }
          }
        } else {
          // Pure theory course without required lab
          options.push({
            course_code: cc,
            sections: [ts],
          });
        }
      }
    } else if (Object.keys(labSections).length > 0) {
      // Pure lab course (no separate theory)
      for (const labList of Object.values(labSections)) {
        for (const lab of labList) {
          options.push({
            course_code: cc,
            sections: [lab],
          });
        }
      }
    }

    // 5. Apply pinned/selected specific sections if any
    let finalOptions = options;
    const baseCC = getBaseCourseCode(cc);
    const pinnedCourse =
      pinned_sections?.[cc] ||
      pinned_sections?.[baseCC] ||
      Object.entries(pinned_sections || {}).find(([k]) => {
        const baseK = getBaseCourseCode(k);
        return (
          baseK === baseCC ||
          k === cc ||
          k.startsWith(baseCC) ||
          cc.startsWith(baseK)
        );
      })?.[1] ||
      Object.values(pinned_sections || {}).find(
        (p) =>
          (p.theorySectionCode &&
            sects.some((s) => s.section_code === p.theorySectionCode)) ||
          (p.labSectionCode &&
            sects.some((s) => s.section_code === p.labSectionCode))
      );

    if (
      pinnedCourse &&
      (pinnedCourse.theorySectionCode || pinnedCourse.labSectionCode)
    ) {
      const targetCodes = [
        pinnedCourse.theorySectionCode,
        pinnedCourse.labSectionCode,
      ].filter(Boolean) as string[];

      finalOptions = finalOptions.filter((opt) =>
        targetCodes.every((tCode) =>
          opt.sections.some((s) => s.section_code === tCode)
        )
      );

      if (finalOptions.length === 0) {
        const pinnedDesc = [
          pinnedCourse.theorySectionCode
            ? `LT: ${pinnedCourse.theorySectionCode}`
            : "",
          pinnedCourse.labSectionCode
            ? `TH: ${pinnedCourse.labSectionCode}`
            : "",
        ]
          .filter(Boolean)
          .join(", ");
        const ccName = getCourseDisplayName(cc);
        const msg = `Lớp cố định của môn ${ccName !== cc ? `${cc} (${ccName})` : cc} (${pinnedDesc}) bị trùng lịch học hoặc rơi vào khung giờ bận của bạn.`;
        warnings.push(msg);
        courseLevelWarnings[cc] = msg;
      }
    } else if (pinned_section_codes.length > 0) {
      const pinnedForCourse = pinned_section_codes.filter((p) =>
        options.some((opt) => opt.sections.some((s) => s.section_code === p))
      );
      if (pinnedForCourse.length > 0) {
        finalOptions = options.filter((opt) =>
          pinnedForCourse.some((p) => opt.sections.some((s) => s.section_code === p))
        );
      }
    }

    if (finalOptions.length > 0) {
      courseOptions[cc] = finalOptions;
      totalOptionsCount += finalOptions.length;
    } else {
      courseOptions[cc] = [];
    }
  }

  // 5. Backtracking CSP solver
  const orderedCourses = Object.keys(courseOptions);
  if (orderedCourses.length === 0) {
    return {
      solutions: [],
      warnings,
      stats: {
        total_options_considered: totalOptionsCount,
        execution_time_ms: Math.round(
          (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime
        ),
      },
    };
  }

  // Heuristic: sort courses with fewest options first (MRV - Minimum Remaining Values)
  orderedCourses.sort(
    (a, b) => courseOptions[a].length - courseOptions[b].length
  );

  const rawSolutions: { sections: Section[]; missing_courses: string[] }[] = [];
  const seenSolutionSignatures = new Set<string>();
  const deadline = (typeof performance !== "undefined" ? performance.now() : Date.now()) + 6000; // 6s timeout

  function backtrack(
    idx: number,
    currentSections: Section[],
    occupiedSlots: Set<string>,
    skipsCount: number,
    allowedSkips: number,
    missingCourses: string[]
  ): void {
    if (rawSolutions.length >= max_solutions * 3) return;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now > deadline) return;

    if (skipsCount > allowedSkips) return;
    if (skipsCount + (orderedCourses.length - idx) < allowedSkips) return;

    if (idx === orderedCourses.length) {
      if (skipsCount === allowedSkips && currentSections.length > 0) {
        const sig = currentSections
          .map((s) => s.section_code)
          .sort()
          .join("|");
        if (!seenSolutionSignatures.has(sig)) {
          seenSolutionSignatures.add(sig);
          rawSolutions.push({
            sections: currentSections,
            missing_courses: missingCourses,
          });
        }
      }
      return;
    }

    const cc = orderedCourses[idx];

    // Branch 1: Try assigning each valid course option
    for (const option of courseOptions[cc]) {
      if (hasTimeConflict(occupiedSlots, option.sections)) {
        continue;
      }

      const newOccupied = new Set(occupiedSlots);
      for (const s of option.sections) {
        for (const p of s.periods) {
          newOccupied.add(`${s.day_of_week}-${p}`);
        }
      }

      backtrack(
        idx + 1,
        [...currentSections, ...option.sections],
        newOccupied,
        skipsCount,
        allowedSkips,
        missingCourses
      );
    }

    // Branch 2: Skip this course if necessary
    if (skipsCount < allowedSkips) {
      // Find specific conflicting courses in the currently scheduled list
      const conflictingCourseNames = new Set<string>();
      for (const opt of courseOptions[cc]) {
        for (const optSec of opt.sections) {
          for (const schedSec of currentSections) {
            if (doSectionsOverlap(optSec, schedSec)) {
              const fullCourseName =
                schedSec.course_name ||
                getCourseDisplayName(schedSec.course_code);
              conflictingCourseNames.add(fullCourseName);
            }
          }
        }
      }

      const ccName = getCourseDisplayName(cc);
      const ccLabel = ccName !== cc ? `${cc} (${ccName})` : cc;
      const reason =
        courseLevelWarnings[cc] ||
        (conflictingCourseNames.size > 0
          ? `Môn ${ccLabel} bị trùng lịch với: ${Array.from(conflictingCourseNames).join(", ")}`
          : `Không thể xếp môn ${ccLabel} do trùng giờ học`);

      backtrack(
        idx + 1,
        currentSections,
        occupiedSlots,
        skipsCount + 1,
        allowedSkips,
        [...missingCourses, reason]
      );
    }
  }

  // Run with 0 skips first (complete solutions), then allow 1 skip, 2 skips...
  for (let allowedSkips = 0; allowedSkips <= orderedCourses.length; allowedSkips++) {
    if (rawSolutions.length >= max_solutions) break;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now > deadline) break;

    backtrack(0, [], new Set(), 0, allowedSkips, []);
    if (rawSolutions.length > 0) break;
  }

  // 6. Enrich generic missing_courses messages with actual conflict details
  for (const sol of rawSolutions) {
    sol.missing_courses = sol.missing_courses.map((reason) => {
      if (reason.includes("bị trùng lịch với") || reason.includes("khung giờ bận")) {
        return reason;
      }
      const codeMatch = reason.match(/môn (\S+)/);
      if (!codeMatch) return reason;
      const cc = getBaseCourseCode(codeMatch[1]);
      const opts = courseOptions[cc];
      if (!opts || opts.length === 0) return reason;

      const conflictNames = new Set<string>();
      for (const opt of opts) {
        for (const optSec of opt.sections) {
          for (const solSec of sol.sections) {
            if (doSectionsOverlap(optSec, solSec)) {
              conflictNames.add(
                solSec.course_name || getCourseDisplayName(solSec.course_code)
              );
            }
          }
        }
      }

      if (conflictNames.size > 0) {
        const ccName = getCourseDisplayName(cc);
        const ccLabel = ccName !== cc ? `${cc} (${ccName})` : cc;
        return `Môn ${ccLabel} bị trùng lịch với: ${Array.from(conflictNames).join(", ")}`;
      }
      return reason;
    });
  }

  // 7. Enrich, score and rank solutions
  const scoredSolutions: ScheduleSolution[] = rawSolutions.map((sol, index) => {
    const analysis = scoreSolution(sol.sections);
    return {
      id: `sol-${index + 1}`,
      sections: sol.sections,
      missing_courses: sol.missing_courses,
      conflict_free: sol.missing_courses.length === 0,
      total_credits: analysis.total_credits,
      study_days_count: analysis.study_days_count,
      free_days: analysis.free_days,
      morning_classes_count: analysis.morning_classes_count,
      afternoon_classes_count: analysis.afternoon_classes_count,
      score: analysis.score,
    };
  });

  // Sort by score desc, then fewer study days
  scoredSolutions.sort((a, b) => {
    if ((b.score || 0) !== (a.score || 0)) {
      return (b.score || 0) - (a.score || 0);
    }
    return a.study_days_count - b.study_days_count;
  });

  const finalSolutions = scoredSolutions.slice(0, max_solutions);

  const executionTimeMs = Math.round(
    (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime
  );

  return {
    solutions: finalSolutions,
    warnings,
    stats: {
      total_options_considered: totalOptionsCount,
      execution_time_ms: executionTimeMs,
    },
  };
}
