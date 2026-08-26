'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, BarChart3, Building2, CalendarDays, CheckCircle2, Clock3, ExternalLink, LineChart, MessageSquareText, PieChart, RefreshCw, Settings2, Sparkles, Star, Target, TrendingUp, Users } from 'lucide-react';
import { detectSchema, summarizeDynamic } from './dynamic-schema.mjs';
import { buildExecutiveInsight, summarizeByDate, summarizeByOrganization, summarizeComments, summarizeQuestionDistribution } from './chart-analytics.mjs';
import { parseGvizTable } from './gviz-table.mjs';
import { DEFAULT_SOURCE, buildGvizUrl, normalizeSource } from './source-config.mjs';
import './v2.css';

const REFRESH_MS = 15000;

type SourceConfig = { sheetId: string; sheetName: string; title: string; subtitle: string };
type SheetResponse = {
  status?: string;
  errors?: Array<{ message?: string; detailed_message?: string }>;
  table?: {
    cols?: Array<{ label?: string; id?: string }>;
    rows?: Array<{ c?: Array<{ v?: unknown; f?: string } | null> }>;
  };
};
type SheetData = { headers: string[]; rows: string[][] };
type QuestionAverage = { index: number; label: string; average: number; count: number };
type DistributionItem = { score: number; count: number };
type QuestionDistribution = { index: number; label: string; total: number; scores: Array<{ score: number; count: number; percent: number }> };
type GroupSummary = { organization?: string; label?: string; dateKey?: string; respondents: number; average: number; satisfactionPercent: number };
type CommentItem = { text: string; intent: 'positive' | 'suggestion' | 'general'; timestamp: string; organization: string };

function sourceFromLocation(): SourceConfig {
  const params = new URLSearchParams(window.location.search);
  const savedRaw = window.localStorage.getItem('satisfaction-v2-source');
  let saved: Partial<SourceConfig> = {};
  try { saved = savedRaw ? JSON.parse(savedRaw) : {}; } catch { saved = {}; }
  return normalizeSource({
    ...saved,
    sheetId: params.get('sheetId') || saved.sheetId,
    sheetName: params.get('sheetName') || saved.sheetName,
    title: params.get('title') || saved.title,
    subtitle: params.get('subtitle') || saved.subtitle,
  }) as SourceConfig;
}

function loadGoogleSheet(source: SourceConfig): Promise<SheetData> {
  return new Promise((resolve, reject) => {
    const callbackName = `__satisfactionV2_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    let settled = false;
    const cleanup = () => { delete (window as unknown as Record<string, unknown>)[callbackName]; script.remove(); };
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
          const message = response.errors?.map((item) => item.detailed_message || item.message).filter(Boolean).join(' · ');
          throw new Error(message || 'Google Sheet ไม่อนุญาตให้อ่านข้อมูล');
        }
        const parsed = parseGvizTable(response);
        resolve({ headers: parsed.headers, rows: parsed.rows });
      } catch (error) { reject(error); } finally { cleanup(); }
    };

    script.onerror = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      cleanup();
      reject(new Error('ไม่สามารถเชื่อม Google Sheet ได้ กรุณาตรวจสิทธิ์การแชร์ชีต'));
    };
    script.src = buildGvizUrl(source, callbackName);
    script.async = true;
    document.head.appendChild(script);
  });
}

function parseTimestamp(value: string) {
  if (!value) return null;
  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) return direct;
  const match = value.match(/Date\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/);
  return match ? new Date(Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6])) : null;
}

function dateKey(value: string) {
  const date = parseTimestamp(value);
  if (!date) return value.slice(0, 10) || 'ไม่ระบุวันที่';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function thaiDateLabel(key: string) {
  const date = new Date(`${key}T00:00:00`);
  return Number.isNaN(date.getTime()) ? key : new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }).format(date);
}

function commentTimeLabel(value: string) {
  const date = parseTimestamp(value);
  if (!date) return value || 'ไม่ระบุเวลา';
  return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

function scoreLevel(percent: number) {
  if (percent >= 90) return 'ดีเยี่ยม';
  if (percent >= 80) return 'ดีมาก';
  if (percent >= 70) return 'ดี';
  if (percent > 0) return 'ควรปรับปรุง';
  return 'รอข้อมูล';
}

function Kpi({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return <div className="satv2-kpi"><div className="satv2-kpi-icon">{icon}</div><div><span>{label}</span><strong>{value}</strong><small>{sub}</small></div></div>;
}

function DistributionChart({ items }: { items: DistributionItem[] }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  const weights = items.map((item) => total ? (item.count / total) * 100 : 0);
  let cursor = 0;
  const segments = weights.map((weight, index) => {
    const start = cursor; cursor += weight;
    return `var(--score-${index + 1}) ${start}% ${cursor}%`;
  }).join(', ');
  return <div className="satv2-dist-wrap"><div className="satv2-donut" style={{ background: total ? `conic-gradient(${segments})` : '#edf2f5' }}><div><strong>{total.toLocaleString('th-TH')}</strong><span>คะแนนทั้งหมด</span></div></div><div className="satv2-legend">{items.slice().reverse().map((item) => <div key={item.score}><i className={`score-${item.score}`}/><span>ระดับ {item.score}</span><strong>{item.count.toLocaleString('th-TH')}</strong><small>{total ? `${((item.count / total) * 100).toFixed(1)}%` : '0%'}</small></div>)}</div></div>;
}

function StackedQuestionChart({ data }: { data: QuestionDistribution[] }) {
  return <div className="satv2-stacked"><div className="satv2-stack-legend">{[5, 4, 3, 2, 1].map((score) => <span key={score}><i className={`score-${score}`}/>ระดับ {score}</span>)}</div>{data.map((item) => <div className="satv2-stack-row" key={`${item.index}-${item.label}`}><div className="satv2-stack-label"><span>{item.index + 1}. {item.label}</span><small>{item.total.toLocaleString('th-TH')} คำตอบ</small></div><div className="satv2-stack-track">{item.scores.map((score) => <i key={score.score} className={`score-${score.score}`} style={{ width: `${score.percent}%` }} title={`ระดับ ${score.score}: ${score.percent.toFixed(1)}% (${score.count} คำตอบ)`}>{score.percent >= 9 ? <b>{score.percent.toFixed(0)}%</b> : null}</i>)}</div></div>)}</div>;
}

function TrendChart({ data }: { data: GroupSummary[] }) {
  if (data.length < 2) return null;
  const width = 640, height = 210, padX = 42, padY = 26;
  const points = data.map((item, index) => {
    const x = padX + (index * (width - padX * 2)) / Math.max(1, data.length - 1);
    const y = height - padY - ((item.satisfactionPercent || 0) / 100) * (height - padY * 2);
    return { x, y, item };
  });
  return <div className="satv2-trend"><svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="แนวโน้มความพึงพอใจตามวัน"><line x1={padX} x2={width - padX} y1={height - padY} y2={height - padY}/><line x1={padX} x2={padX} y1={padY} y2={height - padY}/><polyline points={points.map((p) => `${p.x},${p.y}`).join(' ')} fill="none"/><polygon points={`${padX},${height - padY} ${points.map((p) => `${p.x},${p.y}`).join(' ')} ${width - padX},${height - padY}`}/>{points.map((p, i) => <g key={`${p.item.dateKey}-${i}`}><circle cx={p.x} cy={p.y} r="5"/><text x={p.x} y={height - 6} textAnchor="middle">{p.item.label}</text><text x={p.x} y={Math.max(14, p.y - 10)} textAnchor="middle" className="value">{p.item.satisfactionPercent.toFixed(1)}%</text></g>)}</svg></div>;
}

function CommentBadge({ intent }: { intent: CommentItem['intent'] }) {
  const label = intent === 'positive' ? 'เชิงบวก' : intent === 'suggestion' ? 'ข้อเสนอแนะ' : 'ทั่วไป';
  return <span className={`satv2-comment-badge ${intent}`}>{label}</span>;
}

export default function SatisfactionV2Dashboard() {
  const [source, setSource] = useState<SourceConfig>(DEFAULT_SOURCE as SourceConfig);
  const [sheetData, setSheetData] = useState<SheetData>({ headers: [], rows: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState('all');
  const [selectedOrg, setSelectedOrg] = useState('all');

  useEffect(() => { setSource(sourceFromLocation()); }, []);
  const refresh = async (silent = false, config = source) => {
    if (!silent) setLoading(true);
    try { const data = await loadGoogleSheet(config); setSheetData(data); setError(''); setLastUpdated(new Date()); }
    catch (err) { setError(err instanceof Error ? err.message : 'ไม่สามารถอ่านข้อมูลได้'); }
    finally { setLoading(false); }
  };
  useEffect(() => { refresh(false, source); const timer = window.setInterval(() => refresh(true, source), REFRESH_MS); return () => window.clearInterval(timer); }, [source]);

  const schema = useMemo(() => detectSchema(sheetData.headers, sheetData.rows), [sheetData]);
  const dates = useMemo(() => Array.from(new Set(sheetData.rows.map((row) => dateKey(row[schema.timestampIndex] || '')).filter(Boolean))).sort().reverse(), [sheetData.rows, schema.timestampIndex]);
  const organizations = useMemo(() => Array.from(new Set(sheetData.rows.map((row) => row[schema.organizationIndex]?.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'th')), [sheetData.rows, schema.organizationIndex]);
  const filteredRows = useMemo(() => sheetData.rows.filter((row) => {
    const dateValue = row[schema.timestampIndex] || '';
    const orgValue = row[schema.organizationIndex]?.trim() || '';
    return (selectedDate === 'all' || dateKey(dateValue) === selectedDate) && (selectedOrg === 'all' || orgValue === selectedOrg);
  }), [sheetData.rows, schema.timestampIndex, schema.organizationIndex, selectedDate, selectedOrg]);
  const summary = useMemo(() => summarizeDynamic(filteredRows, schema), [filteredRows, schema]);
  const questionDistribution = useMemo(() => summarizeQuestionDistribution(filteredRows, schema) as QuestionDistribution[], [filteredRows, schema]);
  const commentSummary = useMemo(() => summarizeComments(filteredRows, schema), [filteredRows, schema]);
  const executiveInsight = useMemo(() => buildExecutiveInsight(summary, commentSummary), [summary, commentSummary]);
  const orgSummary = useMemo(() => summarizeByOrganization(filteredRows, schema) as GroupSummary[], [filteredRows, schema]);
  const dateSummary = useMemo(() => summarizeByDate(filteredRows, schema) as GroupSummary[], [filteredRows, schema]);
  const sourceUrl = `https://docs.google.com/spreadsheets/d/${source.sheetId}/edit`;
  const maxQuestionAverage = Math.max(5, ...summary.questionAverages.map((item: QuestionAverage) => item.average || 0));

  return <main className="satv2-page"><div className="satv2-shell">
    <div className="satv2-note"><strong>V2 TEST MODE</strong><span>กราฟและ Insight ปรับตามข้อมูลและหัวข้อ Google Sheet อัตโนมัติ · ระบบเดิม `/satisfaction` ไม่ถูกแก้ไข</span><Link href="/admin/satisfaction-v2"><Settings2 size={16}/> ตั้งค่า V2</Link></div>
    <header className="satv2-header"><div><div className="satv2-eyebrow"><Activity size={15}/> LIVE SATISFACTION DASHBOARD V2</div><h1>{source.title}</h1><p>{source.subtitle}</p></div><div className="satv2-live"><span className={error ? 'bad' : ''}/><strong>{error ? 'เชื่อมต่อไม่ได้' : 'LIVE'}</strong><small><Clock3 size={13}/> {lastUpdated ? lastUpdated.toLocaleTimeString('th-TH') : '—'}</small></div></header>
    {error && <div className="satv2-alert"><div><strong>เชื่อมข้อมูลไม่ได้</strong><br/>{error}</div><a href={sourceUrl} target="_blank" rel="noreferrer">เปิด Google Sheet <ExternalLink size={15}/></a></div>}
    <section className="satv2-toolbar"><div><CalendarDays size={16}/><select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}><option value="all">ทุกวันที่</option>{dates.map((d) => <option key={d} value={d}>{thaiDateLabel(d)}</option>)}</select></div><div><Building2 size={16}/><select value={selectedOrg} onChange={(e) => setSelectedOrg(e.target.value)}><option value="all">ทุกหน่วยงาน</option>{organizations.map((org) => <option key={org} value={org}>{org}</option>)}</select></div><button onClick={() => refresh()} disabled={loading}><RefreshCw className={loading ? 'spin' : ''} size={16}/> อัปเดต</button><a href={sourceUrl} target="_blank" rel="noreferrer">Google Sheet <ExternalLink size={14}/></a></section>
    <section className="satv2-kpis"><Kpi icon={<Users size={22}/>} label="ผู้ตอบ" value={`${summary.respondents.toLocaleString('th-TH')} คน`} sub={`ข้อมูลทั้งหมด ${sheetData.rows.length.toLocaleString('th-TH')} รายการ`}/><Kpi icon={<Star size={22}/>} label="คะแนนเฉลี่ย" value={summary.respondents && schema.questionIndexes.length ? `${summary.average.toFixed(2)} / 5` : '— / 5'} sub={`${schema.questionIndexes.length.toLocaleString('th-TH')} ประเด็นประเมิน`}/><Kpi icon={<Target size={22}/>} label="ความพึงพอใจ" value={summary.respondents && schema.questionIndexes.length ? `${summary.satisfactionPercent.toFixed(1)}%` : '—%'} sub={scoreLevel(summary.satisfactionPercent)}/><Kpi icon={<CheckCircle2 size={22}/>} label="Positive Rate" value={summary.respondents && schema.questionIndexes.length ? `${summary.positiveRate.toFixed(1)}%` : '—%'} sub="คะแนนระดับ 4–5"/></section>

    {!summary.respondents && !error ? <section className="satv2-empty"><TrendingUp size={38}/><h2>V2 พร้อมรับข้อมูล</h2><p>ตรวจพบ {schema.questionIndexes.length.toLocaleString('th-TH')} ประเด็นประเมินจากหัวคอลัมน์ เมื่อ Google Sheet มีคำตอบ ระบบจะอัปเดตอัตโนมัติประมาณทุก 15 วินาที</p></section> : <>
      <section className="satv2-executive"><Sparkles size={24}/><div><span>EXECUTIVE INSIGHT</span><h2>{executiveInsight.headline}</h2><p>{executiveInsight.detail}</p><small><MessageSquareText size={14}/>{executiveInsight.commentNote}</small></div></section>

      <section className="satv2-chart-grid primary-charts">
        <article className="satv2-card satv2-chart-card"><div className="satv2-card-title"><div><span>QUESTION PERFORMANCE</span><h2>คะแนนเฉลี่ยรายประเด็น</h2></div><BarChart3 size={21}/></div><p className="satv2-card-desc">เหมาะสำหรับเทียบว่าประเด็นใดได้คะแนนสูงหรือต่ำกว่ากัน</p><div className="satv2-question-chart">{summary.questionAverages.map((item: QuestionAverage) => <div className="satv2-qbar" key={`${item.index}-${item.label}`}><div className="satv2-qbar-head"><span>{item.index + 1}. {item.label}</span><strong>{item.count ? item.average.toFixed(2) : '—'} / 5</strong></div><div className="satv2-qbar-track"><i style={{ width: `${Math.max(0, Math.min(100, (item.average / maxQuestionAverage) * 100))}%` }}/></div><small>{item.count.toLocaleString('th-TH')} คำตอบ</small></div>)}</div></article>
        <article className="satv2-card satv2-chart-card"><div className="satv2-card-title"><div><span>SCORE MIX</span><h2>การกระจายระดับคะแนน</h2></div><PieChart size={21}/></div><p className="satv2-card-desc">ดูสัดส่วนคะแนน 1–5 เพื่อเห็นว่าคำตอบกระจุกตัวอยู่ระดับใด</p><DistributionChart items={summary.distribution}/></article>
      </section>

      <section className="satv2-card satv2-chart-card satv2-wide-chart"><div className="satv2-card-title"><div><span>QUESTION SCORE MIX</span><h2>สัดส่วนคะแนน 1–5 รายประเด็น</h2></div><BarChart3 size={21}/></div><p className="satv2-card-desc">กราฟ 100% Stacked ช่วยเห็นทันทีว่าคะแนนสูงหรือต่ำของแต่ละข้อกระจายตัวอย่างไร แม้ค่าเฉลี่ยใกล้เคียงกัน</p><StackedQuestionChart data={questionDistribution}/></section>

      {dateSummary.length > 1 && <section className="satv2-card satv2-chart-card satv2-wide-chart"><div className="satv2-card-title"><div><span>TIME TREND</span><h2>แนวโน้มความพึงพอใจตามวัน</h2></div><LineChart size={21}/></div><p className="satv2-card-desc">จะแสดงเมื่อมีข้อมูลมากกว่า 1 วัน เพื่อดูทิศทางคะแนนตามเวลา</p><TrendChart data={dateSummary}/></section>}

      {orgSummary.length > 1 && selectedOrg === 'all' && <section className="satv2-card satv2-chart-card satv2-wide-chart"><div className="satv2-card-title"><div><span>ORGANIZATION COMPARISON</span><h2>เปรียบเทียบความพึงพอใจตามหน่วยงาน</h2></div><Building2 size={21}/></div><p className="satv2-card-desc">แสดงเฉพาะเมื่อพบมากกว่า 1 หน่วยงาน และยังไม่ได้กรองหน่วยงาน</p><div className="satv2-org-chart">{orgSummary.map((item) => <div className="satv2-org-row" key={item.organization}><div><span>{item.organization}</span><small>{item.respondents.toLocaleString('th-TH')} คน</small></div><div className="satv2-org-track"><i style={{ width: `${Math.max(0, Math.min(100, item.satisfactionPercent))}%` }}/></div><strong>{item.satisfactionPercent.toFixed(1)}%</strong></div>)}</div></section>}

      <section className="satv2-comments-grid">
        <article className="satv2-card"><div className="satv2-card-title"><div><span>COMMENT ANALYSIS</span><h2>ภาพรวมข้อเสนอแนะและความคิดเห็น</h2></div><MessageSquareText size={21}/></div><p className="satv2-card-desc">จำแนกเบื้องต้นด้วยคำสำคัญ เพื่อช่วยมองแนวโน้ม ไม่ใช่การวิเคราะห์ Sentiment ด้วย AI</p><div className="satv2-comment-stats"><div><span>ทั้งหมด</span><strong>{commentSummary.total.toLocaleString('th-TH')}</strong></div><div className="positive"><span>เชิงบวก</span><strong>{commentSummary.positiveCount.toLocaleString('th-TH')}</strong></div><div className="suggestion"><span>ข้อเสนอแนะ</span><strong>{commentSummary.suggestionCount.toLocaleString('th-TH')}</strong></div><div><span>ทั่วไป</span><strong>{commentSummary.generalCount.toLocaleString('th-TH')}</strong></div></div><h3>คำ/ประเด็นที่พบ</h3>{commentSummary.topTerms.length ? <div className="satv2-term-cloud">{commentSummary.topTerms.map((item: { term: string; count: number }) => <span key={item.term}>{item.term}<b>{item.count}</b></span>)}</div> : <div className="satv2-comment-empty">ยังไม่มีคำสำคัญเพียงพอ</div>}</article>
        <article className="satv2-card"><div className="satv2-card-title"><div><span>LATEST COMMENTS</span><h2>ความคิดเห็นล่าสุด</h2></div><Clock3 size={21}/></div>{commentSummary.recent.length ? <div className="satv2-comment-list">{(commentSummary.recent as CommentItem[]).map((item, index) => <div className="satv2-comment-item" key={`${item.timestamp}-${index}`}><div><CommentBadge intent={item.intent}/><small>{item.organization} · {commentTimeLabel(item.timestamp)}</small></div><p>{item.text}</p></div>)}</div> : <div className="satv2-comment-empty">ยังไม่มีความคิดเห็นหรือข้อเสนอแนะในข้อมูลที่เลือก</div>}</article>
      </section>

      <section className="satv2-insight-grid"><article className="satv2-card"><h2>ประเด็นเด่น</h2><div className="satv2-insight best"><span>คะแนนสูงสุด</span><strong>{summary.best?.label || '—'}</strong><b>{summary.best ? `${summary.best.average.toFixed(2)} / 5` : '—'}</b></div><div className="satv2-insight watch"><span>ควรติดตาม</span><strong>{summary.worst?.label || '—'}</strong><b>{summary.worst ? `${summary.worst.average.toFixed(2)} / 5` : '—'}</b></div></article><article className="satv2-card"><h2>โครงสร้างข้อมูล</h2><dl><div><dt>Sheet Tab</dt><dd>{source.sheetName}</dd></div><div><dt>ประเด็นคะแนน</dt><dd>{schema.questionIndexes.length.toLocaleString('th-TH')} ข้อ</dd></div><div><dt>ช่องข้อเสนอแนะ</dt><dd>{schema.commentIndexes.length.toLocaleString('th-TH')} ช่อง</dd></div><div><dt>จำนวนรายการ</dt><dd>{sheetData.rows.length.toLocaleString('th-TH')}</dd></div></dl></article></section>
    </>}
  </div></main>;
}