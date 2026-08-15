// src/lib/__tests__/period-times.test.ts
import { describe, it, expect } from 'vitest';
import { UIT_PERIOD_SCHEDULE, getPeriodTime } from '../period-times';

describe('UIT_PERIOD_SCHEDULE', () => {
  it('has exactly 10 periods', () => {
    const keys = Object.keys(UIT_PERIOD_SCHEDULE).map(Number);
    expect(keys).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('period 1 starts at 07:30', () => {
    const p = UIT_PERIOD_SCHEDULE[1];
    expect(p.startTime).toBe('07:30');
    expect(p.startHour).toBe(7);
    expect(p.startMin).toBe(30);
  });

  it('period 1 ends at start of period 2 (08:15)', () => {
    const p = UIT_PERIOD_SCHEDULE[1];
    expect(p.endTime).toBe('08:15');
    expect(p.endHour).toBe(8);
    expect(p.endMin).toBe(15);
  });

  it('period 5 ends at 11:25 (morning session boundary)', () => {
    const p = UIT_PERIOD_SCHEDULE[5];
    expect(p.startTime).toBe('10:40');
    expect(p.endTime).toBe('11:25');
  });

  it('period 6 starts at 13:00 (afternoon session)', () => {
    const p = UIT_PERIOD_SCHEDULE[6];
    expect(p.startTime).toBe('13:00');
  });

  it('period 10 ends at 17:00 (end of day)', () => {
    const p = UIT_PERIOD_SCHEDULE[10];
    expect(p.startTime).toBe('16:10');
    expect(p.endTime).toBe('17:00');
  });

  it('morning chain: each period ends at start of next (1→4)', () => {
    for (let i = 1; i <= 4; i++) {
      expect(UIT_PERIOD_SCHEDULE[i].endTime).toBe(
        UIT_PERIOD_SCHEDULE[i + 1].startTime
      );
    }
  });

  it('afternoon chain: each period ends at start of next (6→9)', () => {
    for (let i = 6; i <= 9; i++) {
      expect(UIT_PERIOD_SCHEDULE[i].endTime).toBe(
        UIT_PERIOD_SCHEDULE[i + 1].startTime
      );
    }
  });

  it('morning and afternoon are not adjacent (gap between period 5 and 6)', () => {
    const endMorning = UIT_PERIOD_SCHEDULE[5];
    const startAfternoon = UIT_PERIOD_SCHEDULE[6];
    const endMinutes = endMorning.endHour * 60 + endMorning.endMin;
    const startMinutes = startAfternoon.startHour * 60 + startAfternoon.startMin;
    expect(startMinutes - endMinutes).toBe(95); // 11:25 → 13:00 = 95 min lunch
  });
});

describe('getPeriodTime', () => {
  it('returns formatted time for valid period', () => {
    expect(getPeriodTime(1)).toBe('07:30 - 08:15');
    expect(getPeriodTime(5)).toBe('10:40 - 11:25');
    expect(getPeriodTime(6)).toBe('13:00 - 13:45');
    expect(getPeriodTime(10)).toBe('16:10 - 17:00');
  });

  it('returns empty string for out-of-range period', () => {
    expect(getPeriodTime(0)).toBe('');
    expect(getPeriodTime(11)).toBe('');
    expect(getPeriodTime(-1)).toBe('');
  });
});
