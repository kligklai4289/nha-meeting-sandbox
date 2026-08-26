'use client';

import { BarChart3, Building2, CalendarDays, ListFilter, MessageSquareText, Tags } from 'lucide-react';
import './field-analytics.css';

type FieldValue = { value: string; count: number; percent: number };
type FieldSummary = {
  index: number;
  label: string;
  role: 'time' | 'organization' | 'score' | 'comment' | 'category';
  responses: number;
  responseRate: number;
  uniqueCount: number;
  average?: number;
  satisfactionPercent?: number;
  positiveRate?: number;
  distribution?: Array<{ score: number; count: number }>;
  values?: FieldValue[];
};

const ROLE_LABELS: Record<FieldSummary['role'], string> = {
  time: 'วันที่ / เวลา',
  organization: 'หน่วยงาน / หมวดหมู่',
  score: 'คะแนน 1–5',
  comment: 'ข้อความปลายเปิด',
  category: 'ข้อมูลหมวดหมู่',
};

function FieldIcon({ role }: { role: FieldSummary['role'] }) {
  if (role === 'time') return <CalendarDays size={18}/>;
  if (role === 'organization') return <Building2 size={18}/>;
  if (role === 'score') return <BarChart3 size={18}/>;
  if (role === 'comment') return <MessageSquareText size={18}/>;
  return <Tags size={18}/>;
}

function ScoreDetails({ field }: { field: FieldSummary }) {
  const total = field.distribution?.reduce((sum, item) => sum + item.count, 0) || 0;
  return <>
    <div className="satv2-field-score-stats">
      <div><span>เฉลี่ย</span><strong>{field.responses ? `${(field.average || 0).toFixed(2)} / 5` : '—'}</strong></div>
      <div><span>ความพึงพอใจ</span><strong>{field.responses ? `${(field.satisfactionPercent || 0).toFixed(1)}%` : '—'}</strong></div>
      <div><span>Positive 4–5</span><strong>{field.responses ? `${(field.positiveRate || 0).toFixed(1)}%` : '—'}</strong></div>
    </div>
    <div className="satv2-field-score-mix">
      {[5, 4, 3, 2, 1].map((score) => {
        const count = field.distribution?.find((item) => item.score === score)?.count || 0;
        const percent = total ? (count / total) * 100 : 0;
        return <div key={score}><span>ระดับ {score}</span><i><b style={{ width: `${percent}%` }}/></i><strong>{count}</strong></div>;
      })}
    </div>
  </>;
}

function CategoryDetails({ field }: { field: FieldSummary }) {
  const values = field.values?.slice(0, 8) || [];
  if (!values.length) return <div className="satv2-field-no-data">ยังไม่มีข้อมูลในฟิลด์นี้</div>;
  return <div className="satv2-field-values">{values.map((item) => <div key={item.value}><div><span>{item.value}</span><strong>{item.count.toLocaleString('th-TH')}</strong></div><i><b style={{ width: `${item.percent}%` }}/></i><small>{item.percent.toFixed(1)}%</small></div>)}</div>;
}

function FieldCard({ field, totalRows }: { field: FieldSummary; totalRows: number }) {
  return <article className={`satv2-field-card role-${field.role}`}>
    <div className="satv2-field-card-head"><div className="satv2-field-icon"><FieldIcon role={field.role}/></div><div><span>FIELD {field.index + 1} · {ROLE_LABELS[field.role]}</span><h3>{field.label}</h3></div></div>
    <div className="satv2-field-meta"><span>ตอบ <b>{field.responses.toLocaleString('th-TH')}</b>/{totalRows.toLocaleString('th-TH')}</span><span>Response Rate <b>{field.responseRate.toFixed(1)}%</b></span>{field.role !== 'score' && <span>ค่าที่พบ <b>{field.uniqueCount.toLocaleString('th-TH')}</b></span>}</div>
    {field.role === 'score' && <ScoreDetails field={field}/>} 
    {(field.role === 'organization' || field.role === 'category') && <CategoryDetails field={field}/>} 
    {field.role === 'time' && <div className="satv2-field-simple"><strong>{field.responses.toLocaleString('th-TH')}</strong><span>รายการวัน/เวลาที่บันทึก · พบ {field.uniqueCount.toLocaleString('th-TH')} ค่า</span></div>}
    {field.role === 'comment' && <div className="satv2-field-simple"><strong>{field.responses.toLocaleString('th-TH')}</strong><span>ข้อความที่ได้รับ · อัตราการตอบ {field.responseRate.toFixed(1)}%</span></div>}
  </article>;
}

export default function FieldAnalyticsPanel({ fields, totalRows }: { fields: FieldSummary[]; totalRows: number }) {
  return <section className="satv2-fields-section">
    <div className="satv2-fields-head"><div><span><ListFilter size={14}/> FIELD-BY-FIELD ANALYSIS</span><h2>วิเคราะห์ข้อมูลรายฟิลด์</h2><p>ดึงแต่ละคอลัมน์มาประมวลผลตามชนิดข้อมูลโดยอัตโนมัติ เหมือนเวอร์ชันเดิม แต่ไม่ล็อกตำแหน่งหรือจำนวนฟิลด์</p></div><strong>{fields.length.toLocaleString('th-TH')} ฟิลด์</strong></div>
    <div className="satv2-fields-grid">{fields.map((field) => <FieldCard key={`${field.index}-${field.label}`} field={field} totalRows={totalRows}/>)}</div>
  </section>;
}
