"use client";
import { useState, useMemo } from 'react';
import { 
  Home, Calendar, Users, CheckSquare, FileText,
  Plus, Search, Download, RotateCcw, Check, ChevronRight, Filter
} from 'lucide-react';

// =========================================================
// 📑 ฐานข้อมูลจำลอง (Mock Data)
// =========================================================
const INITIAL_COMMITTEES = [
  { id: "C001", name: "คณะกรรมการบริหาร", quorum: 5 },
  { id: "C002", name: "คณะกรรมการตรวจสอบ", quorum: 5 },
  { id: "C003", name: "คณะกรรมการพัฒนา", quorum: 5 }
];

const INITIAL_MEMBERS = [
  { id: "M001", name: "นายสมชาย ใจดี", position: "กรรมการ", department: "สำนักงานใหญ่" },
  { id: "M002", name: "นางสาวสมหญิง มีสุข", position: "ประธาน", department: "สำนักงานใหญ่" },
  { id: "M003", name: "นายวิชัย ศรีสวัสดิ์", position: "กรรมการ", department: "ฝ่ายการเงิน" },
  { id: "M005", name: "นายประสิทธิ์ ดีงาม", position: "กรรมการ", department: "ฝ่ายพัฒนาธุรกิจ" },
  { id: "M007", name: "นายธนกร พัฒนา", position: "รองประธาน", department: "สำนักงานใหญ่" },
  { id: "M004", name: "นางมาลี รักดี", position: "เลขานุการ", department: "ฝ่ายการเงิน" }
];

const INITIAL_MEMBERSHIPS = [
  { id: "MS001", memberId: "M001", committeeId: "C001", role: "กรรมการ" },
  { id: "MS002", memberId: "M002", committeeId: "C001", role: "ประธาน" },
  { id: "MS003", memberId: "M003", committeeId: "C001", role: "กรรมการ" },
  { id: "MS005", memberId: "M005", committeeId: "C001", role: "กรรมการ" },
  { id: "MS007", memberId: "M007", committeeId: "C001", role: "รองประธาน" },
  { id: "MS004", memberId: "M004", committeeId: "C002", role: "เลขานุการ" }
];

const INITIAL_MEETINGS = [
  { id: "MT001", committeeId: "C001", name: "ประชุมคณะกรรมการบริหาร", round: "1/2569", date: "2026-05-17", place: "ห้องประชุม 1", chair: "นางสาวสมหญิง มีสุข", recorder: "backoffice.nhso4@gmail.com", status: "ร่าง" },
  { id: "MT002", committeeId: "C002", name: "ประชุมคณะกรรมการตรวจสอบ", round: "1/2569", date: "2026-05-20", place: "ห้องประชุม 2", chair: "นางมาลี รักดี", recorder: "admin@nhso.go.th", status: "ร่าง" },
  { id: "MT003", committeeId: "C003", name: "ประชุมคณะกรรมการพัฒนา", round: "2/2569", date: "2026-05-24", place: "ห้องประชุม 1", chair: "นายสมชาย ใจดี", recorder: "backoffice.nhso4@gmail.com", status: "ร่าง" }
];

const INITIAL_ATTENDANCE: Record<string, Record<string, { status: "เข้าร่วม" | "ลา"; type: "Online" | "OnSite"; reason: string }>> = {
  "MT001": {
    "M001": { status: "เข้าร่วม", type: "Online", reason: "หมายเหตุ" },
    "M002": { status: "เข้าร่วม", type: "OnSite", reason: "หมายเหตุ" },
    "M003": { status: "ลา", type: "OnSite", reason: "ติดภารกิจ" },
    "M005": { status: "เข้าร่วม", type: "OnSite", reason: "หมายเหตุ" },
    "M007": { status: "เข้าร่วม", type: "OnSite", reason: "หมายเหตุ" },
  }
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  
  // 💾 States
  const [committees] = useState(INITIAL_COMMITTEES);
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [memberships, setMemberships] = useState(INITIAL_MEMBERSHIPS);
  const [meetings, setMeetings] = useState(INITIAL_MEETINGS);
  const [attendance, setAttendance] = useState(INITIAL_ATTENDANCE);

  // 🔍 Filters
  const [selectedCommittee, setSelectedCommittee] = useState<string>('C001');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('MT001');
  const [fiscalYear, setFiscalYear] = useState('2569');

  // =========================================================
  // 🛠️ ฟังก์ชัน Export ไฟล์ Word (.doc) จริง
  // =========================================================
  const handleDownloadWord = () => {
    const meeting = meetings.find(m => m.id === selectedMeetingId);
    const records = attendance[selectedMeetingId] || {};
    const commName = committees.find(c => c.id === meeting?.committeeId)?.name;

    const attendList = Object.entries(records).filter(([_, r]) => r.status === "เข้าร่วม");
    const leaveList = Object.entries(records).filter(([_, r]) => r.status === "ลา");

    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>รายงานการประชุม</title></head>
      <body style='font-family: "TH Sarabun New", "Arial"'>
        <h2 style='text-align: center;'>รายงานผลการเช็คชื่อเข้าประชุม</h2>
        <p><b>ชื่อการประชุม:</b> ${meeting?.name} ครั้งที่ ${meeting?.round}</p>
        <p><b>คณะกรรมการ:</b> ${commName}</p>
        <p><b>วันที่:</b> ${meeting?.date} | <b>สถานที่:</b> ${meeting?.place}</p>
        <br/>
        <h3>รายชื่อผู้เข้าร่วมประชุม (${attendList.length} ท่าน)</h3>
        <ol>${attendList.map(([id, _]) => `<li>${members.find(m => m.id === id)?.name}</li>`).join('')}</ol>
        <br/>
        <h3>รายชื่อผู้ลา (${leaveList.length} ท่าน)</h3>
        <ol>${leaveList.map(([id, r]) => `<li>${members.find(m => m.id === id)?.name} (เหตุผล: ${r.reason})</li>`).join('')}</ol>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายงานการประชุม_${meeting?.round}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // =========================================================
  // ⚡ ฟังก์ชันจัดการข้อมูล (Manage Meetings / Memberships)
  // =========================================================
  const getMeetingQuorumStats = (mId: string) => {
    const att = attendance[mId] || {};
    const attendCount = Object.values(att).filter(v => v.status === "เข้าร่วม").length;
    const meeting = meetings.find(m => m.id === mId);
    const comm = committees.find(c => c.id === meeting?.committeeId);
    return `${attendCount} / ${comm?.quorum || 5}`;
  };

  return (
    <div className="flex min-h-screen bg-[#f1f3f6] text-slate-800 antialiased font-sans text-xs select-none">
      
      {/* 🏙️ SIDEBAR */}
      <aside className="w-56 bg-[#1a2332] text-slate-200 flex flex-col fixed h-full z-20 shadow-xl">
        <div className="p-4 bg-[#111823] flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center font-bold text-white text-[10px]">กก</div>
          <div>
            <div className="text-[10px] font-bold text-slate-100 leading-tight">ระบบลงทะเบียนเข้าร่วมประชุม</div>
            <div className="text-[9px] text-blue-400 font-bold uppercase">คณะอนุกรรมการ เขต 4 สระบุรี</div>
          </div>
        </div>
        
        <nav className="flex-1 p-2 space-y-1">
          {[
            { id: 'dashboard', label: 'ภาพรวม', icon: Home },
            { id: 'manage_meetings', label: 'การประชุม', icon: Calendar },
            { id: 'manage_committees', label: 'รายชื่อคณะ', icon: Users },
            { id: 'check_attendance', label: 'เช็คชื่อ', icon: CheckSquare },
            { id: 'generate_report', label: 'รายงาน Word', icon: FileText },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-all ${
                currentTab === item.id ? 'bg-[#243247] text-blue-400 font-bold border-r-4 border-blue-500' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <item.icon size={14} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* 📦 MAIN CONTENT */}
      <div className="flex-1 ml-56 p-6 min-h-screen">
        
        <div className="flex justify-end items-center mb-6">
          <span className="bg-white border border-slate-200 px-3 py-1 rounded text-[11px] text-slate-600">
            ผู้บันทึก: <strong>admin@nhso.go.th</strong>
          </span>
        </div>

        {/* ---------------- VIEW 1: ภาพรวม (ถอดแบบ 6.jpg) ---------------- */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">ภาพรวมการประชุม</h2>
                <p className="text-slate-400 text-[11px]">ติดตามสถานะการเข้าร่วมประชุมของคณะอนุกรรมการ</p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-end gap-3">
              <div className="w-32">
                <label className="block text-[10px] font-bold text-slate-400 mb-1">ปีงบประมาณ</label>
                <select value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} className="w-full border border-slate-200 rounded p-1.5 focus:outline-none">
                  <option value="2569">2569</option>
                  <option value="2568">2568</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-400 mb-1">คณะกรรมการ/คณะอนุกรรมการ</label>
                <select value={selectedCommittee} onChange={(e) => setSelectedCommittee(e.target.value)} className="w-full border border-slate-200 rounded p-1.5 focus:outline-none">
                  {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <button className="bg-blue-600 text-white font-bold py-1.5 px-4 rounded">เรียกข้อมูล</button>
              <button className="bg-white border border-slate-200 text-slate-600 font-bold py-1.5 px-4 rounded">ดูรายงาน</button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'การประชุมทั้งหมด', val: '3', sub: 'ครั้ง' },
                { label: 'กรรมการ/อนุกรรมการ', val: '0', sub: 'คน' },
                { label: 'เบี้ยประชุม', val: '2', sub: 'คน' },
                { label: 'งบประมาณที่ใช้ไป', val: '3', sub: 'บาท' },
              ].map((card, i) => (
                <div key={i} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{card.label}</p>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-black text-slate-800">{card.val}</span>
                    <span className="text-slate-400 text-[10px]">{card.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Table Recent Meetings */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-800">รายการประชุมล่าสุด</div>
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] text-slate-400 font-bold uppercase border-b border-slate-100">
                  <tr>
                    <th className="p-3">ชื่อรายการประชุม</th>
                    <th className="p-3">ครั้งที่</th>
                    <th className="p-3">วันที่</th>
                    <th className="p-3 text-center">สถานะ</th>
                    <th className="p-3 text-center">องค์ประชุม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {meetings.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-700">{m.name}</td>
                      <td className="p-3 text-slate-500">ครั้งที่ {m.round}</td>
                      <td className="p-3 text-slate-500">{m.date}</td>
                      <td className="p-3 text-center">
                        <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide">ร่าง</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-rose-50 text-rose-500 border border-rose-100 px-2 py-0.5 rounded font-bold text-[10px]">{getMeetingQuorumStats(m.id)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------- VIEW 2: จัดการประชุม (ถอดแบบ 7.jpg) ---------------- */}
        {currentTab === 'manage_meetings' && (
          <div className="space-y-6">
            <h2 className="text-base font-bold text-slate-900">จัดการการประชุม</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              {/* Left Column: Form & List */}
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">เลือกคณะอนุกรรมการ</label>
                    <select className="w-full border border-slate-200 rounded p-1.5 focus:outline-none">
                      {committees.map(c => <option key={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="w-40">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1">วันที่จัดประชุม</label>
                    <input type="date" className="w-full border border-slate-200 rounded p-1.5 focus:outline-none" />
                  </div>
                  <button className="bg-blue-600 text-white font-bold py-1.5 px-4 rounded flex items-center gap-2">
                    <Plus size={14} /> เพิ่มการประชุมใหม่
                  </button>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-2 px-3 bg-amber-50 text-amber-700 text-[10px] font-bold text-right border-b border-amber-100">เรียกคืนข้อมูลสำเร็จ</div>
                  <div className="divide-y divide-slate-100">
                    {meetings.map(m => (
                      <div 
                        key={m.id} 
                        onClick={() => setSelectedMeetingId(m.id)}
                        className={`p-4 hover:bg-slate-50 cursor-pointer transition-all ${selectedMeetingId === m.id ? 'bg-blue-50/50 border-l-4 border-blue-500' : ''}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs">{m.name} ครั้งที่ {m.round}</h4>
                            <p className="text-[10px] text-slate-400 mt-1">ผู้บันทึก: {m.recorder}</p>
                          </div>
                          <div className="text-right">
                            <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase">กำลังจัดทำ</span>
                            <p className="text-[10px] text-slate-400 mt-1">{m.date}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Details Card */}
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">รายละเอียด</h3>
                {(() => {
                  const m = meetings.find(x => x.id === selectedMeetingId);
                  return (
                    <div className="space-y-4 text-[11px]">
                      {[
                        { l: 'ชื่อการประชุม', v: m?.name },
                        { l: 'ครั้งที่', v: `ครั้งที่ ${m?.round}` },
                        { l: 'คณะ', v: committees.find(c => c.id === m?.committeeId)?.name },
                        { l: 'สถานที่', v: m?.place },
                        { l: 'วันที่', v: m?.date },
                        { l: 'ประธาน', v: m?.chair },
                        { l: 'ผู้บันทึก', v: m?.recorder },
                        { l: 'สถานะ', v: 'กำลังดำเนินการ' },
                        { l: 'องค์ประชุม', v: getMeetingQuorumStats(selectedMeetingId) },
                      ].map((row, i) => (
                        <div key={i} className="flex flex-col gap-0.5">
                          <span className="font-bold text-slate-400 uppercase text-[9px]">{row.l}</span>
                          <span className="font-bold text-slate-800">{row.v}</span>
                        </div>
                      ))}
                      <button onClick={() => setCurrentTab('check_attendance')} className="w-full bg-blue-600 text-white font-bold py-2 rounded shadow-sm hover:bg-blue-700">เข้าหน้าเช็คชื่อ</button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ---------------- VIEW 3: รายงาน Word (Export ได้จริง) ---------------- */}
        {currentTab === 'generate_report' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm text-center space-y-4">
              <FileText size={48} className="text-blue-600 mx-auto" />
              <div>
                <h3 className="font-bold text-slate-800 text-base">ระบบจัดการรายงานการเข้าประชุม</h3>
                <p className="text-slate-400 text-xs mt-1">ดาวน์โหลดเอกสารสรุปผลการเช็คชื่อแบบ Microsoft Word (.doc)</p>
              </div>
              <div className="w-64 mx-auto">
                <select value={selectedMeetingId} onChange={(e) => setSelectedMeetingId(e.target.value)} className="w-full border border-slate-200 rounded p-2 text-xs font-bold text-slate-700">
                  {meetings.map(m => <option key={m.id} value={m.id}>{m.name} ครั้งที่ {m.round}</option>)}
                </select>
              </div>
              <button 
                onClick={handleDownloadWord}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded shadow-md transition-all flex items-center gap-2 mx-auto"
              >
                <Download size={18} /> ดาวน์โหลด Microsoft Word
              </button>
            </div>
          </div>
        )}

        {/* ---------------- VIEW: เช็คชื่อ / รายชื่อคณะ (รักษาฟังก์ชันเดิม) ---------------- */}
        {currentTab === 'check_attendance' && (
          <div className="space-y-4 bg-white p-6 rounded-lg border border-slate-200">
             <h2 className="text-base font-bold text-slate-900 mb-4">ระบบเช็คชื่อ Hybrid (Online / OnSite)</h2>
             <p className="text-slate-400 mb-6">เลือกสถานะ [เข้าร่วม] หรือ [ลา] พร้อมระบุประเภทการเข้าประชุม</p>
             {/* ตารางเช็คชื่อจะรันข้อมูลตาม meeting ที่เลือก */}
             <div className="divide-y divide-slate-100">
                {memberships.filter(ms => ms.committeeId === meetings.find(m => m.id === selectedMeetingId)?.committeeId).map((ms, i) => {
                   const info = members.find(m => m.id === ms.memberId);
                   return (
                     <div key={i} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800">{info?.name}</div>
                          <div className="text-[10px] text-slate-400">{ms.role}</div>
                        </div>
                        <div className="flex gap-2">
                           <button className="bg-emerald-500 text-white font-bold px-3 py-1 rounded text-[10px]">เข้าร่วม</button>
                           <button className="bg-slate-100 text-slate-400 font-bold px-3 py-1 rounded text-[10px]">ลา</button>
                        </div>
                     </div>
                   )
                })}
             </div>
          </div>
        )}

      </div>
    </div>
  );
}