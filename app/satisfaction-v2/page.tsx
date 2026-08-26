'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Activity, Building2, CalendarDays, CheckCircle2, Clock3, ExternalLink, RefreshCw, Settings2, Star, Target, TrendingUp, Users } from 'lucide-react';
import { summarizeResponses } from '../satisfaction/metrics.js';
import { DEFAULT_SOURCE, buildGvizUrl, normalizeSource } from './source-config.mjs';
import './v2.css';

const REFRESH_MS = 15000;

type SourceConfig = { sheetId: string; sheetName: string; title: string; subtitle: string };
type SheetResponse = { status?: string; errors?: Array<{ message?: string; detailed_message?: string }>; table?: { rows?: Array<{ c?: Array<{ v?: unknown; f?: string } | null> }> } };

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

function loadGoogleSheet(source: SourceConfig): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const callbackName = `__satisfactionV2_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
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
          const message = response.errors?.map((item) => item.detailed_message || item.message).filter(Boolean).join(' · ');
          throw new Error(message || 'Google Sheet ไม่อนุญาตให้อ่านข้อมูล');
        }
        const rows = (response?.table?.rows || []).map((row) => Array.from({ length: 11 }, (_, index) => {
          const cell = row.c?.[index];
          return cell ? String(cell.f ?? cell.v ?? '') : '';
        }));
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

export default function SatisfactionV2Dashboard() {
  const [source, setSource] = useState<SourceConfig>(DEFAULT_SOURCE as SourceConfig);
  const [rows, setRows] = useState<string[][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedDate, setSelectedDate] = useState('all');
  const [selectedOrg, setSelectedOrg] = useState('all');

  useEffect(() => { setSource(sourceFromLocation()); }, []);

  const refresh = async (silent = false, config = source) => {
    if (!silent) setLoading(true);
    try {
      const data = await loadGoogleSheet(config);
      setRows(data);
      setError('');
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถอ่านข้อมูลได้');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    refresh(false, source);
    const timer = window.setInterval(() => refresh(true, source), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [source]);

  const dates = useMemo(() => Array.from(new Set(rows.map((row) => dateKey(row[0])).filter(Boolean))).sort().reverse(), [rows]);
  const organizations = useMemo(() => Array.from(new Set(rows.map((row) => row[1]?.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'th')), [rows]);
  const filteredRows = useMemo(() => rows.filter((row) => (selectedDate === 'all' || dateKey(row[0]) === selectedDate) && (selectedOrg === 'all' || row[1]?.trim() === selectedOrg)), [rows, selectedDate, selectedOrg]);
  const summary = useMemo(() => summarizeResponses(filteredRows), [filteredRows]);
  const sourceUrl = `https://docs.google.com/spreadsheets/d/${source.sheetId}/edit`;

  return <main className="satv2-page"><div className="satv2-shell">
    <div className="satv2-note"><strong>V2 TEST MODE</strong><span>ระบบนี้แยกจาก `/satisfaction` เดิมโดยสมบูรณ์</span><Link href="/admin/satisfaction-v2"><Settings2 size={16}/> ตั้งค่า V2</Link></div>
    <header className="satv2-header"><div><div className="satv2-eyebrow"><Activity size={15}/> LIVE SATISFACTION DASHBOARD V2</div><h1>{source.title}</h1><p>{source.subtitle}</p></div><div className="satv2-live"><span className={error ? 'bad' : ''}/><strong>{error ? 'เชื่อมต่อไม่ได้' : 'LIVE'}</strong><small><Clock3 size={13}/> {lastUpdated ? lastUpdated.toLocaleTimeString('th-TH') : '—'}</small></div></header>
    {error && <div className="satv2-alert"><div><strong>เชื่อมข้อมูลไม่ได้</strong><br/>{error}</div><a href={sourceUrl} target="_blank" rel="noreferrer">เปิด Google Sheet <ExternalLink size={15}/></a></div>}
    <section className="satv2-toolbar"><div><CalendarDays size={16}/><select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}><option value="all">ทุกวันที่</option>{dates.map((d) => <option key={d} value={d}>{thaiDateLabel(d)}</option>)}</select></div><div><Building2 size={16}/><select value={selectedOrg} onChange={(e) => setSelectedOrg(e.target.value)}><option value="all">ทุกหน่วยงาน</option>{organizations.map((org) => <option key={org} value={org}>{org}</option>)}</select></div><button onClick={() => refresh()} disabled={loading}><RefreshCw className={loading ? 'spin' : ''} size={16}/> อัปเดต</button><a href={sourceUrl} target="_blank" rel="noreferrer">Google Sheet <ExternalLink size={14}/></a></section>
    <section className="satv2-kpis"><Kpi icon={<Users size={22}/>} label="ผู้ตอบ" value={`${summary.respondents.toLocaleString('th-TH')} คน`} sub={`ข้อมูลทั้งหมด ${rows.length.toLocaleString('th-TH')} รายการ`}/><Kpi icon={<Star size={22}/>} label="คะแนนเฉลี่ย" value={summary.respondents ? `${summary.average.toFixed(2)} / 5` : '— / 5'} sub="7 ประเด็นประเมิน"/><Kpi icon={<Target size={22}/>} label="ความพึงพอใจ" value={summary.respondents ? `${summary.satisfactionPercent.toFixed(1)}%` : '—%'} sub={scoreLevel(summary.satisfactionPercent)}/><Kpi icon={<CheckCircle2 size={22}/>} label="Positive Rate" value={summary.respondents ? `${summary.positiveRate.toFixed(1)}%` : '—%'} sub="คะแนนระดับ 4–5"/></section>
    {!summary.respondents && !error ? <section className="satv2-empty"><TrendingUp size={38}/><h2>V2 พร้อมรับข้อมูล</h2><p>เมื่อ Google Sheet มีคำตอบ ระบบจะอัปเดตอัตโนมัติประมาณทุก 15 วินาที</p></section> : <section className="satv2-grid"><article className="satv2-card"><h2>คะแนนเฉลี่ยรายประเด็น</h2>{summary.questionAverages.map((item: { index: number; label: string; average: number; count: number }) => <div className="satv2-bar-row" key={item.index}><span>{item.index + 1}. {item.label}</span><div><i style={{ width: `${Math.max(0, Math.min(100, (item.average / 5) * 100))}%` }}/></div><strong>{item.count ? item.average.toFixed(2) : '—'}</strong></div>)}</article><article className="satv2-card"><h2>สรุปการทดสอบแหล่งข้อมูล</h2><dl><div><dt>Sheet ID</dt><dd>{source.sheetId}</dd></div><div><dt>Sheet Tab</dt><dd>{source.sheetName}</dd></div><div><dt>สถานะ</dt><dd>{error ? 'ต้องตรวจสอบ' : 'เชื่อมต่อสำเร็จ'}</dd></div><div><dt>จำนวนรายการ</dt><dd>{rows.length.toLocaleString('th-TH')}</dd></div></dl></article></section>}
  </div></main>;
}
