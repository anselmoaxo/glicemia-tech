// Conversões entre data/hora digitadas (fuso do usuário) e instante UTC.
function parts(ts: number, tz: string) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return Object.fromEntries(f.formatToParts(ts).map((p) => [p.type, p.value]));
}

function offsetMs(ts: number, tz: string) {
  const p = parts(ts, tz);
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - Math.floor(ts / 1000) * 1000;
}

export function localToDate(date: string, time: string, tz: string): Date {
  const guess = Date.parse(`${date}T${time}:00Z`);
  let t = guess - offsetMs(guess, tz);
  t = guess - offsetMs(t, tz);
  return new Date(t);
}

export function dateToLocalInputs(d: Date, tz: string) {
  const p = parts(d.getTime(), tz);
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

export function formatDateTime(d: Date, tz: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** Ex.: "quarta-feira, 30 de setembro". */
export function formatLongDate(d: Date, tz: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: tz, weekday: "long", day: "numeric", month: "long" }).format(d);
}
