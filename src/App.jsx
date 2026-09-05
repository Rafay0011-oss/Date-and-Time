import { useState, useEffect, useMemo, useRef } from "react";

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  const cells = [];

  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({ dateObj: new Date(year, month - 1, daysInPrevMonth - i), currentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ dateObj: new Date(year, month, d), currentMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].dateObj;
    const next = new Date(last);
    next.setDate(next.getDate() + 1);
    cells.push({ dateObj: next, currentMonth: false });
  }
  return cells;
}

const isSameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export default function TimeDateApp() {
  const [view, setView] = useState("clock"); // "clock" | "stopwatch" | "calendar"
  const [now, setNow] = useState(new Date());
  const [is24Hour, setIs24Hour] = useState(false);
  const [isDark, setIsDark] = useState(true);

  // ---- Clock tick ----
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // ---- Stopwatch state ----
  const [swElapsed, setSwElapsed] = useState(0);
  const [swRunning, setSwRunning] = useState(false);
  const [laps, setLaps] = useState([]);
  const startRef = useRef(0);
  const accumRef = useRef(0);

  useEffect(() => {
    if (!swRunning) return;
    const interval = setInterval(() => setSwElapsed(Date.now() - startRef.current + accumRef.current), 30);
    return () => clearInterval(interval);
  }, [swRunning]);

  const handleStartPause = () => {
    if (swRunning) {
      accumRef.current = swElapsed;
      setSwRunning(false);
    } else {
      startRef.current = Date.now();
      setSwRunning(true);
    }
  };
  const handleLap = () => {
    if (swElapsed === 0) return;
    setLaps((prev) => [{ id: prev.length + 1, total: swElapsed, split: swElapsed - (prev[0]?.total ?? 0) }, ...prev]);
  };
  const handleReset = () => {
    setSwRunning(false);
    setSwElapsed(0);
    accumRef.current = 0;
    setLaps([]);
  };

  // ---- Calendar state ----
  const [calendarCursor, setCalendarCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const monthGrid = useMemo(
    () => buildMonthGrid(calendarCursor.getFullYear(), calendarCursor.getMonth()),
    [calendarCursor]
  );
  const monthLabel = calendarCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const goPrevMonth = () => setCalendarCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNextMonth = () => setCalendarCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goToday = () => {
    const today = new Date();
    setCalendarCursor(today);
    setSelectedDate(today);
  };

  const pad = (n, len = 2) => String(n).padStart(len, "0");

  const formatStopwatch = (ms) => {
    const totalCs = Math.floor(ms / 10);
    const cs = totalCs % 100;
    const totalSec = Math.floor(totalCs / 100);
    const s = totalSec % 60;
    const totalMin = Math.floor(totalSec / 60);
    const m = totalMin % 60;
    const h = Math.floor(totalMin / 60);
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}.${pad(cs)}` : `${pad(m)}:${pad(s)}.${pad(cs)}`;
  };

  const hours24 = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const hue = useMemo(() => {
    const fraction = (hours24 * 60 + minutes) / 1440;
    return Math.round(215 + fraction * 170);
  }, [hours24, minutes]);

  const accent = `hsl(${hue}, 72%, ${isDark ? 62 : 42}%)`;
  const accentSoft = `hsla(${hue}, 72%, ${isDark ? 62 : 42}%, 0.16)`;
  const accentGlow = `hsla(${hue}, 85%, ${isDark ? 55 : 60}%, 0.35)`;
  const warn = isDark ? "hsl(6, 70%, 65%)" : "hsl(6, 65%, 48%)";

  const formatTime = () => {
    let h = hours24;
    if (is24Hour) return { main: `${pad(h)}:${pad(minutes)}`, suffix: null };
    const suffix = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return { main: `${h}:${pad(minutes)}`, suffix };
  };

  const { main, suffix } = formatTime();
  const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
  const fullDate = now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const greeting =
    hours24 < 5 ? "Still up" : hours24 < 12 ? "Good morning" : hours24 < 18 ? "Good afternoon" : hours24 < 22 ? "Good evening" : "Good night";

  const circumference = 2 * Math.PI * 46;
  const secondsOffset = circumference * (1 - seconds / 60);
  const swLoopOffset = circumference * (1 - (swElapsed % 60000) / 60000);

  const theme = isDark
    ? { bg: "#0C0D12", panel: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.09)", primary: "#F3F1EC", secondary: "#8D91A0", track: "rgba(255,255,255,0.08)" }
    : { bg: "#F6F4EF", panel: "rgba(255,255,255,0.6)", border: "rgba(20,20,20,0.08)", primary: "#1D1E24", secondary: "#6B6E7A", track: "rgba(0,0,0,0.06)" };

  const fastestId = laps.length > 1 ? laps.reduce((a, b) => (a.split < b.split ? a : b)).id : null;
  const slowestId = laps.length > 1 ? laps.reduce((a, b) => (a.split > b.split ? a : b)).id : null;

  const selectedFull = selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-6 relative overflow-hidden transition-colors duration-700"
      style={{ backgroundColor: theme.bg }}
    >
      <style>{`
        @keyframes driftA { 0%,100% { transform: translate(-10%, -10%) scale(1); } 50% { transform: translate(5%, 8%) scale(1.15); } }
        @keyframes driftB { 0%,100% { transform: translate(8%, 5%) scale(1.1); } 50% { transform: translate(-6%, -8%) scale(1); } }
        @keyframes tickPulse { 0% { transform: scale(1); } 30% { transform: scale(1.08); } 100% { transform: scale(1); } }
        @keyframes lapIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeSwap { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .tick { animation: tickPulse 1s ease-out; }
        .lap-row { animation: lapIn 0.3s ease-out; }
        .month-grid { animation: fadeSwap 0.25s ease-out; }
        .sw-scroll::-webkit-scrollbar { width: 6px; }
        .sw-scroll::-webkit-scrollbar-thumb { background: ${theme.track}; border-radius: 999px; }
      `}</style>

      <div
        className="absolute w-[38rem] h-[38rem] rounded-full blur-3xl opacity-40 pointer-events-none"
        style={{ background: accentGlow, top: "-8rem", left: "-8rem", animation: "driftA 18s ease-in-out infinite" }}
      />
      <div
        className="absolute w-[30rem] h-[30rem] rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ background: accentGlow, bottom: "-6rem", right: "-6rem", animation: "driftB 22s ease-in-out infinite" }}
      />

      <div
        className="relative w-full max-w-md rounded-[28px] px-8 py-10 sm:px-12 sm:py-12 backdrop-blur-xl border transition-colors duration-700"
        style={{ backgroundColor: theme.panel, borderColor: theme.border, boxShadow: `0 20px 60px -20px ${accentGlow}` }}
      >
        {/* Header row: greeting + view switch */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <span className="font-serif text-lg" style={{ color: theme.secondary }}>
            {view === "clock" ? greeting : view === "stopwatch" ? "Stopwatch" : "Calendar"}
          </span>

          <div className="flex rounded-full p-1" style={{ backgroundColor: theme.track }}>
            {[
              { key: "clock", label: "Clock" },
              { key: "stopwatch", label: "Timer" },
              { key: "calendar", label: "Calendar" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2"
                style={{
                  color: view === key ? (isDark ? "#0C0D12" : "#FFFFFF") : theme.secondary,
                  backgroundColor: view === key ? accent : "transparent",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {view === "clock" && (
          <>
            <div className="relative flex items-center justify-center py-4">
              <svg viewBox="0 0 100 100" className="w-56 h-56 sm:w-64 sm:h-64 -rotate-90">
                <circle cx="50" cy="50" r="46" fill="none" stroke={theme.track} strokeWidth="3" />
                <circle
                  cx="50" cy="50" r="46" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={circumference} strokeDashoffset={secondsOffset}
                  style={{ transition: "stroke-dashoffset 0.9s linear" }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <div key={seconds} className="tick flex items-baseline gap-2">
                  <span className="font-mono tabular-nums text-5xl sm:text-6xl font-semibold tracking-tight" style={{ color: theme.primary }}>
                    {main}
                  </span>
                  {suffix && <span className="font-mono text-lg" style={{ color: theme.secondary }}>{suffix}</span>}
                </div>
                <span className="font-mono text-sm mt-1" style={{ color: accent }}>:{pad(seconds)}</span>
              </div>
            </div>

            <p className="font-serif text-2xl text-center mt-2" style={{ color: theme.primary }}>{fullDate}</p>

            <div className="mt-6 flex items-center justify-center">
              <span className="text-xs font-semibold tracking-wide px-3 py-1 rounded-full" style={{ color: accent, backgroundColor: accentSoft }}>
                {weekday}
              </span>
            </div>
          </>
        )}

        {view === "stopwatch" && (
          <>
            <div className="relative flex items-center justify-center py-4">
              <svg viewBox="0 0 100 100" className="w-56 h-56 sm:w-64 sm:h-64 -rotate-90">
                <circle cx="50" cy="50" r="46" fill="none" stroke={theme.track} strokeWidth="3" />
                <circle
                  cx="50" cy="50" r="46" fill="none" stroke={accent} strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={circumference} strokeDashoffset={swLoopOffset}
                  style={{ transition: swRunning ? "stroke-dashoffset 0.05s linear" : "none" }}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="font-mono tabular-nums text-4xl sm:text-5xl font-semibold tracking-tight" style={{ color: theme.primary }}>
                  {formatStopwatch(swElapsed)}
                </span>
                <span className="text-xs mt-2 font-medium" style={{ color: swRunning ? accent : theme.secondary }}>
                  {swRunning ? "Running" : swElapsed > 0 ? "Paused" : "Ready"}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={handleReset}
                disabled={swElapsed === 0}
                className="text-sm font-medium px-4 py-2.5 rounded-full border transition-all duration-300 hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 focus:outline-none focus-visible:ring-2"
                style={{ borderColor: theme.border, color: theme.secondary }}
              >
                Reset
              </button>
              <button
                onClick={handleStartPause}
                className="text-sm font-semibold px-6 py-2.5 rounded-full transition-all duration-300 hover:scale-105 focus:outline-none focus-visible:ring-2"
                style={{ backgroundColor: accent, color: isDark ? "#0C0D12" : "#FFFFFF", boxShadow: `0 8px 20px -6px ${accentGlow}` }}
              >
                {swRunning ? "Pause" : swElapsed > 0 ? "Resume" : "Start"}
              </button>
              <button
                onClick={handleLap}
                disabled={!swRunning}
                className="text-sm font-medium px-4 py-2.5 rounded-full border transition-all duration-300 hover:scale-105 disabled:opacity-30 disabled:hover:scale-100 focus:outline-none focus-visible:ring-2"
                style={{ borderColor: theme.border, color: theme.secondary }}
              >
                Lap
              </button>
            </div>

            {laps.length > 0 && (
              <div className="mt-8 max-h-40 overflow-y-auto sw-scroll pr-1 space-y-1.5">
                {laps.map((lap) => (
                  <div key={lap.id} className="lap-row flex items-center justify-between text-sm py-1.5 px-3 rounded-lg" style={{ backgroundColor: theme.track }}>
                    <span style={{ color: theme.secondary }}>Lap {lap.id}</span>
                    <span className="font-mono tabular-nums" style={{ color: lap.id === fastestId ? accent : lap.id === slowestId ? warn : theme.primary }}>
                      {formatStopwatch(lap.split)}
                    </span>
                    <span className="font-mono tabular-nums" style={{ color: theme.secondary }}>{formatStopwatch(lap.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {view === "calendar" && (
          <>
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={goPrevMonth}
                aria-label="Previous month"
                className="h-8 w-8 flex items-center justify-center rounded-full border transition-all duration-300 hover:scale-110 focus:outline-none focus-visible:ring-2"
                style={{ borderColor: theme.border, color: theme.secondary }}
              >
                ‹
              </button>
              <button onClick={goToday} className="font-serif text-lg transition-colors duration-300" style={{ color: theme.primary }}>
                {monthLabel}
              </button>
              <button
                onClick={goNextMonth}
                aria-label="Next month"
                className="h-8 w-8 flex items-center justify-center rounded-full border transition-all duration-300 hover:scale-110 focus:outline-none focus-visible:ring-2"
                style={{ borderColor: theme.border, color: theme.secondary }}
              >
                ›
              </button>
            </div>

            {/* Weekday labels */}
            <div className="grid grid-cols-7 mb-2">
              {WEEKDAY_LABELS.map((d) => (
                <div key={d} className="text-center text-xs font-semibold" style={{ color: theme.secondary }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div key={monthLabel} className="month-grid grid grid-cols-7 gap-y-1.5">
              {monthGrid.map(({ dateObj, currentMonth }, i) => {
                const isToday = isSameDay(dateObj, now);
                const isSelected = isSameDay(dateObj, selectedDate);
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(dateObj)}
                    className="h-9 w-9 mx-auto flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200 hover:scale-110 focus:outline-none focus-visible:ring-2"
                    style={{
                      color: isSelected ? (isDark ? "#0C0D12" : "#FFFFFF") : currentMonth ? theme.primary : theme.secondary,
                      backgroundColor: isSelected ? accent : "transparent",
                      opacity: currentMonth ? 1 : 0.35,
                      boxShadow: isToday && !isSelected ? `inset 0 0 0 1.5px ${accent}` : "none",
                    }}
                  >
                    {dateObj.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Selected date readout */}
            <div className="mt-7 flex items-center justify-between">
              <p className="font-serif text-base" style={{ color: theme.primary }}>{selectedFull}</p>
              <button
                onClick={goToday}
                className="text-xs font-semibold px-3 py-1 rounded-full transition-all duration-300 hover:scale-105"
                style={{ color: accent, backgroundColor: accentSoft }}
              >
                Today
              </button>
            </div>
          </>
        )}

        {/* Global settings */}
        <div className="mt-10 pt-6 flex items-center justify-between border-t" style={{ borderColor: theme.border }}>
          <button
            onClick={() => setIs24Hour((v) => !v)}
            className="text-sm font-medium px-4 py-2 rounded-full border transition-all duration-300 hover:scale-105 focus:outline-none focus-visible:ring-2"
            style={{ borderColor: theme.border, color: theme.secondary }}
            onMouseEnter={(e) => (e.currentTarget.style.color = accent)}
            onMouseLeave={(e) => (e.currentTarget.style.color = theme.secondary)}
          >
            {is24Hour ? "12-hour" : "24-hour"}
          </button>

          <button
            onClick={() => setIsDark((v) => !v)}
            aria-label="Toggle dark mode"
            className="relative h-8 w-14 rounded-full border transition-all duration-300 focus:outline-none focus-visible:ring-2"
            style={{ borderColor: theme.border, backgroundColor: theme.track }}
          >
            <span
              className="absolute top-0.5 h-6 w-6 rounded-full transition-all duration-300"
              style={{ backgroundColor: accent, left: isDark ? "1.75rem" : "0.15rem", boxShadow: `0 0 12px ${accentGlow}` }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
