import { format } from 'date-fns';
import prisma from '@/lib/prisma';

/**
 * Working days for daily reports. Saturdays, Sundays and Director-marked holidays are days off:
 * no report is due, streaks don't break, nobody is flagged or reminded.
 *
 * Daily reports are stored against the server's local midnight (see /api/reports/daily), so every
 * comparison here uses the server's local calendar date as the key ("yyyy-MM-dd").
 */

export type HolidayMap = Map<string, string>; // dayKey -> holiday name

export const dayKey = (d: Date) => format(d, 'yyyy-MM-dd');

/** Holiday.date is a Postgres DATE, which Prisma returns as UTC midnight: read it in UTC. */
const holidayKey = (d: Date) => d.toISOString().slice(0, 10);

export const isWeekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

/** Holidays between two dates (inclusive), keyed by day. */
export async function getHolidays(from: Date, to: Date): Promise<HolidayMap> {
    const rows = await prisma.holiday.findMany({
        where: { date: { gte: new Date(dayKey(from)), lte: new Date(dayKey(to)) } },
        select: { date: true, name: true },
    });
    return new Map(rows.map(h => [holidayKey(h.date), h.name]));
}

/** Why no report is due on this day, or null if it's a working day. */
export function dayOffReason(d: Date, holidays: HolidayMap): string | null {
    const holiday = holidays.get(dayKey(d));
    if (holiday) return holiday;
    if (d.getDay() === 0) return 'Sunday';
    if (d.getDay() === 6) return 'Saturday';
    return null;
}

/** Today's status in one call, for crons and dashboards. */
export async function todayStatus(now = new Date()) {
    const holidays = await getHolidays(now, now);
    const reason = dayOffReason(now, holidays);
    return { isWorkingDay: !reason, reason, isHoliday: holidays.has(dayKey(now)) };
}

/**
 * Consecutive working days with a report, counting back from today.
 * - Today counts if submitted; if not yet submitted it's skipped (the window may still be open).
 * - Days off are skipped without breaking the streak; a report filed on a day off still counts.
 * - The first working day without a report ends the streak.
 */
export function computeStreak(reportDays: Set<string>, holidays: HolidayMap, today = new Date(), lookbackDays = 120) {
    let streak = 0;
    for (let i = 0; i < lookbackDays; i++) {
        const d = new Date(today);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        const key = dayKey(d);
        if (reportDays.has(key)) { streak++; continue; }
        if (i === 0) continue;
        if (dayOffReason(d, holidays)) continue;
        break;
    }
    return streak;
}

/** Number of working days (Mon-Fri, not a holiday) between two dates, inclusive. */
export function countWorkingDays(from: Date, to: Date, holidays: HolidayMap) {
    let n = 0;
    const d = new Date(from); d.setHours(0, 0, 0, 0);
    const end = new Date(to); end.setHours(0, 0, 0, 0);
    while (d <= end) {
        if (!dayOffReason(d, holidays)) n++;
        d.setDate(d.getDate() + 1);
    }
    return n;
}
