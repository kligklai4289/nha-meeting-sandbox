'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Copy, ExternalLink, FlaskConical, Link2, RefreshCw, RotateCcw, Save, Settings2, ShieldCheck, XCircle } from 'lucide-react';
import { detectSchema } from '../../satisfaction-v2/dynamic-schema.mjs';
import { DEFAULT_SOURCE, buildGvizUrl, buildShareParams, extractSheetId, normalizeSource } from '../../satisfaction-v2/source-config.mjs';
import './admin.css';

type SourceConfig = { sheetId: string; sheetName: string; title: string; subtitle: string };
type TestResult = { ok: boolean; message: string; rows?: number; columns?: number; questions?: number; comments?: number } | null;
type SheetResponse = {
  status?: string;
  errors?: Array<{ message?: string; detailed_message?: string }>;
  table?: {
    cols?: Array<{ label?: string; id?: string }>;
    rows?: Array<{ c?: Array<{ v?: unknown; f?: string } | null> }>;
  };
};

function testGoogleSheet(source: SourceConfig): Promise<{ rows: number; columns: number; headers: string[]; dataRows: string[][] }> {
  return new Promise((resolve, reject) => {
    const callbackName = `__satisfactionV2Admin_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    let settled = false;
    const cleanup = () => { delete (window as unknown as Record<string, unknown>)[callbackName]; script.remove(); };
    const timeout = window.setTimeout(() => { if (!settled) { settled = true; cleanup(); reject(new Error('หมดเวลารอ Google Sheet')); } }, 10000);
    (window as unknown as Record<string, unknown>)[callbackName] = (response: SheetResponse) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      try {
        if (response?.status === 'error') {
          const message = response.errors?.map((item) => item.detailed_message || item.message).filter(Boolean).join(' · ');
          throw new Error(message || 'Google Sheet ไม่อนุญาตให้อ่านข้อมูล');
        }
        const headers = (response.table?.cols || []).map((column, index) => String(column.label || column.id || `คอลัมน์ ${index + 1}`).trim());
        const width = Math.max(headers.length, ...(response.table?.rows || []).map((row) => row.c?.length || 0), 0);
        const normalizedHeaders = Array.from({ length: width }, (_, index) => headers[index] || `คอลัมน์ ${index + 1}`);
        const dataRows = (response.table?.rows || []).map((row) => Array.from({ length: width }, (_, index) => {
          const cell = row.c?.[index];
          return cell ? String(cell.f ?? cell.v ?? '') : '';
        }));
        resolve({ rows: dataRows.length, columns: width, headers: normalizedHeaders, dataRows });
      } catch (error) { reject(error); } finally { cleanup(); }
    };
    script.onerror = () => { if (!settled) { settled = true; window.clearTimeout(timeout); cleanup(); reject(new Error('เชื่อมต่อไม่ได้ กรุณาตรวจสิทธิ์การแชร์ Google Sheet')); } };
    script.src = buildGvizUrl(source, callbackName);
    script.async = true;
    document.head.appendChild(script);
  });
}

export default function SatisfactionV2Admin() {
  const [sheetUrl, setSheetUrl] = useState<string>(`https://docs.google.com/spreadsheets/d/${DEFAULT_SOURCE.sheetId}/edit`);
  const [sheetName, setSheetName] = useState<string>(DEFAULT_SOURCE.sheetName);
  const [title, setTitle] = useState<string>(DEFAULT_SOURCE.title);
  const [subtitle, setSubtitle] = useState<string>(DEFAULT_SOURCE.subtitle);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem('satisfaction-v2-source');
    if (!raw) return;
    try {
      const source = normalizeSource(JSON.parse(raw)) as SourceConfig;
      setSheetUrl(`https://docs.google.com/spreadsheets/d/${source.sheetId}/edit`);
      setSheetName(source.sheetName);
      setTitle(source.title);
      setSubtitle(source.subtitle);
    } catch { /* keep defaults */ }
  }, []);

  const source = useMemo(() => normalizeSource({ sheetUrl, sheetName, title, subtitle }) as SourceConfig, [sheetUrl, sheetName, title, subtitle]);
  const validSheetId = extractSheetId(sheetUrl);
  const shareUrl = useMemo(() => typeof window === 'undefined' ? '' : `${window.location.origin}/satisfaction-v2?${buildShareParams(source)}`, [source]);

  const handleTest = async () => {
    if (!validSheetId) { setResult({ ok: false, message: 'รูปแบบ Google Sheet URL หรือ Sheet ID ไม่ถูกต้อง' }); return; }
    setTesting(true); setResult(null);
    try {
      const info = await testGoogleSheet(source);
      const schema = detectSchema(info.headers, info.dataRows);
      const ok = schema.questionIndexes.length > 0;
      const message = ok
        ? `เชื่อมต่อสำเร็จ · ตรวจพบประเด็นประเมิน ${schema.questionIndexes.length} ข้อ และช่องข้อเสนอแนะ ${schema.commentIndexes.length} ช่อง`
        : 'เชื่อมต่อสำเร็จ แต่ยังตรวจไม่พบคอลัมน์คะแนน 1–5 กรุณาตรวจหัวคอลัมน์และข้อมูล';
      setResult({ ok, message, rows: info.rows, columns: info.columns, questions: schema.questionIndexes.length, comments: schema.commentIndexes.length });
    } catch (error) {
      setResult({ ok: false, message: error instanceof Error ? error.message : 'ทดสอบการเชื่อมต่อไม่สำเร็จ' });
    } finally { setTesting(false); }
  };

  const handleSave = () => {
    if (!validSheetId) { setResult({ ok: false, message: 'ยังบันทึกไม่ได้: Google Sheet URL ไม่ถูกต้อง' }); return; }
    window.localStorage.setItem('satisfaction-v2-source', JSON.stringify(source));
    setSaved(true); window.setTimeout(() => setSaved(false), 1800);
  };

  const handleReset = () => {
    window.localStorage.removeItem('satisfaction-v2-source');
    setSheetUrl(`https://docs.google.com/spreadsheets/d/${DEFAULT_SOURCE.sheetId}/edit`);
    setSheetName(DEFAULT_SOURCE.sheetName); setTitle(DEFAULT_SOURCE.title); setSubtitle(DEFAULT_SOURCE.subtitle); setResult(null);
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true); window.setTimeout(() => setCopied(false), 1800);
  };

  return <main className="satadmin-page"><div className="satadmin-shell">
    <header className="satadmin-header"><div><span><Settings2 size={15}/> SATISFACTION V2 ADMIN</span><h1>ตั้งค่าแหล่งข้อมูลสำหรับระบบทดสอบ</h1><p>V2 จะอ่านชื่อและจำนวนประเด็นจากหัวคอลัมน์ Google Sheet อัตโนมัติ โดยไม่แก้ `/satisfaction` เดิม</p></div><div className="satadmin-shield"><ShieldCheck size={24}/><strong>Legacy Safe</strong><small>แยกจากระบบใช้งานจริง</small></div></header>

    <section className="satadmin-layout">
      <article className="satadmin-card">
        <div className="satadmin-card-head"><div><span>DATA SOURCE</span><h2>Google Sheet</h2></div><FlaskConical size={22}/></div>
        <label>Google Sheet URL หรือ Sheet ID<input value={sheetUrl} onChange={(e) => { setSheetUrl(e.target.value); setResult(null); }} placeholder="https://docs.google.com/spreadsheets/d/.../edit"/></label>
        <label>ชื่อ Sheet / Tab<input value={sheetName} onChange={(e) => { setSheetName(e.target.value); setResult(null); }} placeholder="Form Responses 1"/></label>
        <div className="satadmin-two"><label>ชื่อ Dashboard<input value={title} onChange={(e) => setTitle(e.target.value)}/></label><label>รายละเอียดการประชุม<input value={subtitle} onChange={(e) => setSubtitle(e.target.value)}/></label></div>
        <div className="satadmin-actions"><button className="secondary" onClick={handleTest} disabled={testing}><RefreshCw className={testing ? 'spin' : ''} size={16}/>{testing ? 'กำลังทดสอบ...' : 'ทดสอบการเชื่อมต่อ'}</button><button className="primary" onClick={handleSave}><Save size={16}/>{saved ? 'บันทึกแล้ว' : 'บันทึกสำหรับเครื่องนี้'}</button><button className="ghost" onClick={handleReset}><RotateCcw size={15}/>คืนค่าเดิม</button></div>
        {result && <div className={`satadmin-result ${result.ok ? 'ok' : 'bad'}`}>{result.ok ? <CheckCircle2 size={19}/> : <XCircle size={19}/>}<div><strong>{result.ok ? 'พร้อมทดสอบ Dynamic Questions' : 'ต้องตรวจสอบ'}</strong><p>{result.message}</p>{typeof result.rows === 'number' && <small>ข้อมูล {result.rows.toLocaleString('th-TH')} แถว · {result.columns} คอลัมน์{typeof result.questions === 'number' ? ` · ประเด็น ${result.questions} ข้อ` : ''}{typeof result.comments === 'number' ? ` · ข้อเสนอแนะ ${result.comments} ช่อง` : ''}</small>}</div></div>}
      </article>

      <aside className="satadmin-side">
        <article className="satadmin-card"><div className="satadmin-card-head"><div><span>SHARE TEST</span><h2>ลิงก์สำหรับทดสอบ V2</h2></div><Link2 size={21}/></div><p className="satadmin-muted">ลิงก์นี้ฝังค่าของ Google Sheet ไว้ใน URL จึงเปิดจากเครื่องอื่นได้โดยไม่กระทบระบบเดิม</p><div className="satadmin-share">{shareUrl}</div><div className="satadmin-actions vertical"><button className="primary" onClick={handleCopy}><Copy size={16}/>{copied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์ทดสอบ'}</button><a href={shareUrl || '/satisfaction-v2'} target="_blank" rel="noreferrer"><ExternalLink size={16}/>เปิด Dashboard V2</a><Link href="/satisfaction"><ShieldCheck size={16}/>เปิดระบบเดิม</Link></div></article>
        <article className="satadmin-card satadmin-check"><h2>หลักการตรวจจับอัตโนมัติ</h2><ul><li>Timestamp/วันที่ → ใช้สำหรับตัวกรองวันที่</li><li>หน่วยงาน/สังกัด → ใช้สำหรับตัวกรองหน่วยงาน</li><li>คอลัมน์คะแนน 1–5 → สร้างเป็นประเด็นกราฟอัตโนมัติ</li><li>ข้อเสนอแนะ/ข้อคิดเห็น → ไม่นำมาคำนวณคะแนน</li><li>ระบบเดิมยังอยู่ที่ <code>/satisfaction</code> และไม่ถูกแก้ไข</li></ul></article>
      </aside>
    </section>
  </div></main>;
}