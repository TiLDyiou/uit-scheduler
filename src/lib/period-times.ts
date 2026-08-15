export interface PeriodTime {
  period: number;
  startTime: string; // "07:30"
  endTime: string; // "08:15"
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
}

// Start times for periods 1 to 10
const START_TIMES: Record<number, { hour: number; min: number; str: string }> = {
  1: { hour: 7, min: 30, str: "07:30" },
  2: { hour: 8, min: 15, str: "08:15" },
  3: { hour: 9, min: 0, str: "09:00" },
  4: { hour: 9, min: 55, str: "09:55" },
  5: { hour: 10, min: 40, str: "10:40" },
  6: { hour: 13, min: 0, str: "13:00" },
  7: { hour: 13, min: 45, str: "13:45" },
  8: { hour: 14, min: 30, str: "14:30" },
  9: { hour: 15, min: 25, str: "15:25" },
  10: { hour: 16, min: 10, str: "16:10" },
};

/**
 * Calculate end time of a period based on the start of next period,
 * with period 5 ending at 11:25 and period 10 ending at 17:00.
 */
function computePeriodTimes(): Record<number, PeriodTime> {
  const result: Record<number, PeriodTime> = {};

  for (let p = 1; p <= 10; p++) {
    const start = START_TIMES[p];
    let endHour: number;
    let endMin: number;
    let endStr: string;

    if (p === 10) {
      // Period 10 ends at 17:00 as specified
      endHour = 17;
      endMin = 0;
      endStr = "17:00";
    } else if (p === 5) {
      // Period 5 ends the morning session (45 minutes lesson) at 11:25
      endHour = 11;
      endMin = 25;
      endStr = "11:25";
    } else {
      // End time is start of next period
      const nextStart = START_TIMES[p + 1];
      endHour = nextStart.hour;
      endMin = nextStart.min;
      endStr = nextStart.str;
    }

    result[p] = {
      period: p,
      startTime: start.str,
      endTime: endStr,
      startHour: start.hour,
      startMin: start.min,
      endHour,
      endMin,
    };
  }

  return result;
}

export const UIT_PERIOD_SCHEDULE: Record<number, PeriodTime> = computePeriodTimes();

/**
 * Returns formatted period time string, e.g. "07:30 - 08:15"
 */
export function getPeriodTime(p: number): string {
  const info = UIT_PERIOD_SCHEDULE[p];
  if (!info) return "";
  return `${info.startTime} - ${info.endTime}`;
}
