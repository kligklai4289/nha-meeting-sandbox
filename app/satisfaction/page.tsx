'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, Building2, CalendarDays, CheckCircle2, Clock3, ExternalLink, MessageSquareText, RefreshCw, Star, Target, TrendingUp, Users } from 'lucide-react';
import { summarizeResponses } from './metrics.js';
import './dashboard.css';

const SHEET_ID = '1RFzHpDKLDNZSvd20nMoZIqeLo0Zt9LOGrI6YPPQclJ8';
const SHEET_NAME = 'Form Responses 1';
const SOURCE_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`;
const REFRESH_MS = 15000;

type SheetResponse = {
  status?: string;
  errors?: Array<{ message?: string; detailed_message?: string }>;
  table?: {
    rows?: Array<{ c?: Array<{ v?: unknown; f?: string } | null> }>;
  };
};

function loadGoogleSheet(): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const callbackName = `__satisfactionSheet_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    const tqx = `out:json;responseHandler:${callbackName}`;
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${encodeURIComponent(SHEET_NAME)}&tqx=${encodeURIComponent(tqx)}&_=${Date.now()}`;
    let settled = false;

    const cleanup = () => {
      delete (window as unknown as Record<string, unknown>)[callbackName];
      script.remove();
    };

    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('หมดเวลารอข้อมูลจาก Google Sheet'));
    }, 10000);

    (window as unknown as Record<string, unknown>)[callbackName] = (response: SheetResponse) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      try {
        if (response?.status === 'error') {
          const errorText = response.errors?.map((e) => e.detailed_message || e.message).filter(Boolean).join(' · ');
          throw new Error(errorText || 'Google Sheet ไม่อนุญาตให้อ่านข้อมูล');
        }
        const rows = (response?.table?.rows || []).map((row) =>
          Array.from({ length: 11 }, (_, index) => {
            const cell = row.c?.[index];
            if (!cell) return '';
            const value = cell.f ?? cell.v ?? '';
            return String(value);
          })
        );
        resolve(rows.filter((row) => row.some((value) => value.trim() !== '')));
      } catch (error) {
        reject(error);
      } finally {
        cleanup();
      }
    };

    script.onerror = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      cleanup();
      reject(new Error('ไม่สามารถเชื่อม Google Sheet ได้ กรุณาตรวจสิทธิ์การแชร์ชีต'));
    };
    script.src = url;
    script.async = true;
    document.head.appendChild(script);
  });
}

function parseTimestamp(value: string) {
  if (!value) return null;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;
  const match = value.match(/Date\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6]));
  }
  return null;
}

function dateKey(value: string) {
  const date = parseTimestamp(value);
  if (!date) return value.slice(0, 10) || 'ไม่ระบุวันที่';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function thaiDateLabel(key: string) {
  const date = new Date(`${key}T00:00:00`);
  if (Number.isNaN(date.getTime())) return key;
  return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }).format(date);
}

function scoreLevel(percent: number) {
  if (percent >= 90) return { label: 'ดีเยี่ยม', tone: 'excellent' };
  if (percent >= 80) return { label: 'ดีมาก', tone: 'good' };
  if (percent >= 70) return { label: 'ดี', tone: 'fair' };
  if (percent > 0) return { label: 'ควรปรับปรุง', tone: 'warning' };
  return { label: 'รอข้อมูล', tone: 'neutral' };
}

function KpiCard({ icon, label, value, sub, tone = '' }: { icon: React.ReactNode; label: string; value: string; sub: string; tone?: string }) {
  return (
    <div className={`sat-kpi ${tone}`}>
      <div className="sat-kpi-icon">{icon}</div>
      <div>
        <div className="sat-kpi-label">{label}</div>
        <div className="sat-kpi-value">{value}</div>
        <div className="sat-kpi-sub">{sub}</div>
      </div>
    </div>
  );
}

export default function SatisfactionDashboard() {
  const [rows, setRows] = useState<string[][]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('all');
  const [selectedOrg, setSelectedOrg] = useState('all');

  const refresh = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await loadGoogleSheet();
      setRows(data);
      setLastUpdated(new Date());
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถอ่านข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const timer = window.setInterval(() => refresh(true), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, []);

  const dates = useMemo(() => Array.from(new Set(rows.map((row) => dateKey(row[0])).filter(Boolean))).sort().reverse(), [rows]);
  const organizations = useMemo(() => Array.from(new Set(rows.map((row) => row[1]?.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'th')), [rows]);

  const filteredRows = useMemo(() => rows.filter((row) => {
    const dateOk = selectedDate === 'all' || dateKey(row[0]) === selectedDate;
    const orgOk = selectedOrg === 'all' || row[1]?.trim() === selectedOrg;
    return dateOk && orgOk;
  }), [rows, selectedDate, selectedOrg]);

  const summary = useMemo(() => summarizeResponses(filteredRows), [filteredRows]);
  const level = scoreLevel(summary.satisfactionPercent);
  const maxDistribution = Math.max(1, ...summary.distribution.map((item: { count: number }) => item.count));

  const orgCounts = useMemo(() => {
    const counts = new Map<string, number>();
    filteredRows.forEach((row) => {
      const org = row[1]?.trim() || 'ไม่ระบุหน่วยงาน';
      counts.set(org, (counts.get(org) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [filteredRows]);

  const comments = useMemo(() => filteredRows.flatMap((row) => {
    const items = [row[9], row[10]].filter((text) => text?.trim());
    return items.map((text) => ({ text: text.trim(), org: row[1]?.trim() || 'ไม่ระบุหน่วยงาน', time: row[0] }));
  }).slice(-10).reverse(), [filteredRows]);

  return (
    <main className="sat-page">
      <div className="sat-shell">
        <header className="sat-header">
          <div>
            <div className="sat-eyebrow"><Activity size={15} /> LIVE SATISFACTION DASHBOARD</div>
            <h1>ผลประเมินความพึงพอใจการจัดประชุม</h1>
            <p>คณะอนุกรรมการ อปสข./อคม. เขต 4 สระบุรี · 27 ส.ค. 2569</p>
          </div>
          <div className="sat-live-wrap">
            <div className={`sat-live ${error ? 'offline' : ''}`}><span />{error ? 'เชื่อมต่อไม่ได้' : 'LIVE'}</div>
            <div className="sat-updated"><Clock3 size={14} /> อัปเดตล่าสุด {lastUpdated ? lastUpdated.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}</div>
          </div>
        </header>

        {error && (
          <div className="sat-alert">
            <div><strong>เชื่อมข้อมูล Google Sheet ยังไม่ได้</strong><br />{error} — หากต้องการให้ Dashboard เปิดได้ทุกเครื่อง ให้ตั้ง Google Sheet เป็น “ทุกคนที่มีลิงก์ · ผู้มีสิทธิ์อ่าน”</div>
            <a href={SOURCE_URL} target="_blank" rel="noreferrer">เปิดชีต <ExternalLink size={15} /></a>
          </div>
        )}

        <section className="sat-toolbar">
          <div className="sat-filter"><CalendarDays size={17} /><label>วันที่</label><select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}><option value="all">ทั้งหมด</option>{dates.map((date) => <option key={date} value={date}>{thaiDateLabel(date)}</option>)}</select></div>
          <div className="sat-filter"><Building2 size={17} /><label>หน่วยงาน</label><select value={selectedOrg} onChange={(e) => setSelectedOrg(e.target.value)}><option value="all">ทุกหน่วยงาน</option>{organizations.map((org) => <option key={org} value={org}>{org}</option>)}</select></div>
          <button className="sat-refresh" onClick={() => refresh()} disabled={loading}><RefreshCw size={16} className={loading ? 'spin' : ''} /> อัปเดตตอนนี้</button>
          <a className="sat-source" href={SOURCE_URL} target="_blank" rel="noreferrer">Google Sheet <ExternalLink size={15} /></a>
        </section>

        <section className="sat-kpis">
          <KpiCard icon={<Users size={22} />} label="ผู้ตอบแบบประเมิน" value={`${summary.respondents.toLocaleString('th-TH')} คน`} sub={rows.length ? `จากข้อมูลทั้งหมด ${rows.length.toLocaleString('th-TH')} รายการ` : 'ยังไม่มีคำตอบใน Google Form'} />
          <KpiCard icon={<Star size={22} />} label="คะแนนเฉลี่ย" value={summary.respondents ? `${summary.average.toFixed(2)} / 5` : '— / 5'} sub="เฉลี่ยจาก 7 ประเด็นประเมิน" tone="primary" />
          <KpiCard icon={<Target size={22} />} label="ความพึงพอใจ" value={summary.respondents ? `${summary.satisfactionPercent.toFixed(1)}%` : '—%'} sub={level.label} tone={level.tone} />
          <KpiCard icon={<CheckCircle2 size={22} />} label="Positive Rate" value={summary.respondents ? `${summary.positiveRate.toFixed(1)}%` : '—%'} sub="สัดส่วนคะแนนระดับ 4–5" tone="positive" />
        </section>

        {!summary.respondents && !error ? (
          <section className="sat-empty">
            <div className="sat-empty-icon"><TrendingUp size={34} /></div>
            <h2>Dashboard พร้อมรับผลแบบเรียลไทม์</h2>
            <p>ขณะนี้ Google Sheet ยังไม่มีคำตอบ เมื่อมีผู้ตอบ Google Form รายการแรก หน้านี้จะเริ่มคำนวณและแสดงกราฟอัตโนมัติภายในประมาณ 15 วินาที</p>
          </section>
        ) : (
          <>
            <section className="sat-grid sat-grid-main">
              <article className="sat-card sat-wide">
                <div className="sat-card-head"><div><span className="sat-card-kicker">SCORE BY DIMENSION</span><h2>คะแนนเฉลี่ยรายประเด็น</h2></div><span className="sat-badge">เต็ม 5 คะแนน</span></div>
                <div className="sat-bars">
                  {summary.questionAverages.map((item: { index: number; label: string; average: number; count: number }) => (
                    <div className="sat-bar-row" key={item.index}>
                      <div className="sat-bar-label"><span>{item.index + 1}</span><p>{item.label}</p></div>
                      <div className="sat-bar-track"><div className="sat-bar-fill" style={{ width: `${Math.max(0, Math.min(100, (item.average / 5) * 100))}%` }} /></div>
                      <strong>{item.count ? item.average.toFixed(2) : '—'}</strong>
                    </div>
                  ))}
                </div>
              </article>

              <article className="sat-card">
                <div className="sat-card-head"><div><span className="sat-card-kicker">RATING MIX</span><h2>การกระจายคะแนน</h2></div></div>
                <div className="sat-distribution">
                  {[...summary.distribution].reverse().map((item: { score: number; count: number }) => {
                    const total = summary.distribution.reduce((sum: number, row: { count: number }) => sum + row.count, 0);
                    const percent = total ? (item.count / total) * 100 : 0;
                    return <div className="sat-dist-row" key={item.score}><span className={`score-pill score-${item.score}`}>{item.score}</span><div className="sat-dist-track"><div style={{ width: `${(item.count / maxDistribution) * 100}%` }} /></div><strong>{item.count}</strong><em>{percent.toFixed(0)}%</em></div>;
                  })}
                </div>
                <div className="sat-scale-note">5 = มากที่สุด · 4 = มาก · 3 = ปานกลาง · 2 = น้อย · 1 = น้อยที่สุด</div>
              </article>
            </section>

            <section className="sat-insights">
              <article className="sat-insight best">
                <div className="sat-insight-icon"><Star size={22} /></div>
                <div><span>จุดเด่นสูงสุด</span><h3>{summary.best?.label || '—'}</h3><p>{summary.best ? `${summary.best.average.toFixed(2)} / 5 · ควรรักษามาตรฐาน` : 'ยังไม่มีข้อมูล'}</p></div>
              </article>
              <article className="sat-insight improve">
                <div className="sat-insight-icon"><TrendingUp size={22} /></div>
                <div><span>ประเด็นที่ควรติดตาม</span><h3>{summary.worst?.label || '—'}</h3><p>{summary.worst ? `${summary.worst.average.toFixed(2)} / 5 · ใช้เป็นหัวข้อปรับปรุงครั้งถัดไป` : 'ยังไม่มีข้อมูล'}</p></div>
              </article>
            </section>

            <section className="sat-grid sat-grid-bottom">
              <article className="sat-card">
                <div className="sat-card-head"><div><span className="sat-card-kicker">RESPONDENTS</span><h2>ผู้ตอบแยกตามหน่วยงาน</h2></div><Building2 size={20} /></div>
                <div className="sat-org-list">
                  {orgCounts.length ? orgCounts.slice(0, 10).map(([org, count], index) => <div className="sat-org-row" key={org}><span>{index + 1}</span><p>{org}</p><strong>{count} คน</strong></div>) : <p className="sat-muted">ยังไม่มีข้อมูลหน่วยงาน</p>}
                </div>
              </article>

              <article className="sat-card sat-comments">
                <div className="sat-card-head"><div><span className="sat-card-kicker">VOICE OF PARTICIPANTS</span><h2>ข้อเสนอแนะล่าสุด</h2></div><MessageSquareText size={20} /></div>
                <div className="sat-comment-list">
                  {comments.length ? comments.map((comment, index) => <div className="sat-comment" key={`${comment.time}-${index}`}><p>“{comment.text}”</p><span>{comment.org}{comment.time ? ` · ${comment.time}` : ''}</span></div>) : <div className="sat-no-comment">ยังไม่มีข้อเสนอแนะปลายเปิด</div>}
                </div>
              </article>
            </section>
          </>
        )}

        <footer className="sat-footer"><span>แหล่งข้อมูล: Google Forms → Google Sheet</span><span>รีเฟรชอัตโนมัติทุก 15 วินาที</span><span>สูตรความพึงพอใจ = คะแนนเฉลี่ย ÷ 5 × 100</span></footer>
      </div>
    </main>
  );
}
