export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function calendarDays(month: string) {
  const [year, number] = month.split("-").map(Number);
  const offset = (new Date(year, number - 1, 1).getDay() + 6) % 7;
  const count = new Date(year, number, 0).getDate();
  return Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, i) => {
    const day = i - offset + 1;
    return day < 1 || day > count ? null : `${month}-${String(day).padStart(2, "0")}`;
  });
}

export function shiftMonth(month: string, amount: number) {
  const [year, number] = month.split("-").map(Number);
  return localDate(new Date(year, number - 1 + amount, 1)).slice(0, 7);
}
