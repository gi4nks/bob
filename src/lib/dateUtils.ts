export interface Week {
  id: number;
  label: string;
  start: Date;
  end: Date;
  displayStart: number;
  displayEnd: number;
}

export const formatDate = (d: Date | string) => {
    const date = typeof d === 'string' ? new Date(d) : d;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

export const getWeeksForMonth = (date: Date): Week[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const weeks: Week[] = [];
  
  // Start from the first day of the month
  for (let i = 0; i < 4; i++) {
    const start = new Date(year, month, 1 + (i * 7));
    const end = new Date(year, month, 1 + (i * 7) + 6);
    
    weeks.push({
      id: i + 1,
      label: `Week ${i + 1}`,
      start,
      end,
      displayStart: start.getDate(),
      displayEnd: end.getDate()
    });
  }
  return weeks;
};

export const isOverlapping = (start1: Date | string, end1: Date | string, start2: Date | string, end2: Date | string) => {
  const s1 = typeof start1 === 'string' ? new Date(start1) : start1;
  const e1 = typeof end1 === 'string' ? new Date(end1) : end1;
  const s2 = typeof start2 === 'string' ? new Date(start2) : start2;
  const e2 = typeof end2 === 'string' ? new Date(end2) : end2;

  return s1 <= e2 && s2 <= e1;
};

export const getBusinessDays = (start: Date | string, end: Date | string): number => {
  const startDate = typeof start === 'string' ? new Date(start) : start;
  const endDate = typeof end === 'string' ? new Date(end) : end;
  let count = 0;
  const cur = new Date(startDate);
  
  while (cur <= endDate) {
    const dayOfWeek = cur.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};