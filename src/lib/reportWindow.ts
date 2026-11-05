// Daily reports are accepted 5:00 PM - 11:59 PM India time, whatever timezone the server runs in.
export const REPORT_WINDOW_LABEL = '5:00 PM - 11:59 PM IST';
const OPENS_AT_HOUR = 17;

/** Current hour (0-23) in Asia/Kolkata. */
export function istHour(now = new Date()): number {
    const hour = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', hour12: false }).format(now), 10);
    return hour === 24 ? 0 : hour;
}

export const isReportWindowOpen = (now = new Date()) => istHour(now) >= OPENS_AT_HOUR;
