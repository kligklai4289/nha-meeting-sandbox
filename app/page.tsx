"use client";
import { useState, useMemo } from 'react';
import { 
  Home, Calendar, Users, CheckSquare, FileText,
  Plus, Search, Edit, Trash, Download, UserPlus,
  ChevronDown, CheckCircle, Video, FileSpreadsheet, Filter,
  UserCheck, AlertCircle, Clock, MapPin, User
} from 'lucide-react';

// ==========================================
// 📊 ฐานข้อมูลอ้างอิงโครงสร้างไฟล์ CSV จริง สปสช. เขต 4
// ==========================================
const INITIAL_COMMITTEES = [
  { id: "C001", name: "คณะอนุกรรมการหลักประกันสุขภาพแห่งชาติเขต 4สระบุรี", quorum: 20, dept: "สำนักงานใหญ่" },
  { id: "C002", name: "คณะอนุกรรมการควบคุม คุณภาพและมาตรฐานบริการสาธารณสุขระดับเขตพื้นที่ เขต4 สระบุรี", quorum: 20, dept: "ฝ่ายการเงิน" }
];

const INITIAL_MEMBERS = [
  { id: "M001", name: "นายสมชาย ใจดี", position: "กรรมการ", department: "สำนักงานใหญ่", status: "ใช้งาน" },
  { id: "M002", name: "นางสาวสมหญิง มีสุข", position: "ประธาน", department: "สำนักงานใหญ่", status: "ใช้งาน" },
  { id: "M003", name: "นายวิชัย ศรีสวัสดิ์", position: "กรรมการ", department: "ฝ่ายการเงิน", status: "ใช้งาน" },
  { id: "M004", name: "นางมาลี รักดี", position: "เลขานุการ", department: "ฝ่ายการเงิน", status: "ใช้งาน" },
  { id: "M005", name: "นายประสิทธิ์ ดีงาม", position: "กรรมการ", department: "ฝ่ายพัฒนาธุรกิจ", status: "ใช้งาน" }
];

const INITIAL_MEMBERSHIPS = [
  { id: "MS001", memberId: "M001", committeeId: "C001", role: "กรรมการ" },
  { id: "MS002", memberId: "M002", committeeId: "C001", role: "ประธาน" },
  { id: "MS003", memberId: "M003", committeeId: "C001", role: "กรรมการ" },
  { id: "MS004", memberId: "M004", committeeId: "C002", role: "เลขานุการ" },
  { id: "MS005", memberId: "M003", committeeId: "C002", role: "กรรมการ" },
  { id: "MS006", memberId: "M001", committeeId: "C002", role: "กรรมการ" }
];

const INITIAL_MEETINGS = [
  { 
    id: "MT001", 
    committeeId: "C001", 
    name: "ประชุมคณะกรรมการบริหาร คณะอนุกรรมการหลักประกันสุขภาพแห่งชาติเขต 4 สระบุรี", 
    round: "1/2569", 
    fiscalYear: "2569", 
    date: "2026-05-17", 
    startTime: "09:30", 
    endTime: "12:00", 
    place: "ห้องประชุม 1 สปสช. เขต 4 สระบุรี", 
    chairId: "M002", 
    recorder: "backoffice.nhso4@gmail.com", 
    status: "ร่าง" 
  }
];

// โครงสร้างบันทึกผู้เข้าร่วมประชุม (Attendance Log)
const INITIAL_ATTENDANCE: Record<string, Record<string, { status: string; type: string; reason?: string; personType: string; name?: string; role?: string; dept?: string }>> = {
  "MT001": {
    "M001": { status: "มาประชุม", type: "onsite", personType: "member" },
    "M002": { status: "มาประชุม", type: "online", personType: "member" },
    "M003": { status: "ลา", type: "-", reason: "ติดภารกิจเร่งด่วน", personType: "member" }
  }
};

export default function App() {
  // --- UI Views & Control State ---
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  
  // --- Database States ---
  const [committees] = useState(INITIAL_COMMITTEES);
  const [members] = useState(INITIAL_MEMBERS);
  const [memberships] = useState(INITIAL_MEMBERSHIPS);
  const [meetings, setMeetings] = useState(INITIAL_MEETINGS);
  const [attendance, setAttendance] = useState(INITIAL_ATTENDANCE);

  // --- Filtering ---
  const [fiscalYear, setFiscalYear] = useState<string>('2569');
  const [selectedCommittee, setSelectedCommittee] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeMeetingId, setActiveMeetingId] = useState<string>('MT001');

  // --- Form States ---
  const [formRound, setFormRound] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formPlace, setFormPlace] = useState('');
  const [formCommId, setFormCommId] = useState('C001');

  // แทรกรายชื่อผู้สังเกตการณ์ (Guest)
  const [guestName, setGuestName] = useState('');
  const [guestRole, setGuestRole] = useState('ผู้เข้าร่วมประชุมเพิ่มเติม');
  const [guestDept, setGuestDept] = useState('หน่วยงานภายนอก');

  // --- Helper Query ---
  const getCommitteeMembers = (cId: string) => {
    const rels = memberships.filter(ms => ms.committeeId === cId);
    return rels.map(r => {
      const info = members.find(m => m.id === r.memberId);
      return {
        id: r.memberId,
        name: info?.name || "ไม่ทราบชื่อ",
        department: info?.department || "-",
        role: r.role
      };
    });
  };

  // --- Actions ---
  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRound || !formDate) return alert("กรุณากรอกข้อมูลให้ครบถ้วน");
    const nextId = `MT${String(meetings.length + 1).padStart(3, '0')}`;
    const targetComm = committees.find(c => c.id === formCommId);
    
    const newMeeting = {
      id: nextId,
      committeeId: formCommId,
      name: `ประชุม${targetComm?.name || ''}`,
      round: formRound,
      fiscalYear: fiscalYear,
      date: formDate,
      startTime: "09:30",
      endTime: "12:00",
      place: formPlace || "ห้องประชุม สปสช. เขต 4",
      chairId: "M002",
      recorder: "backoffice.nhso4@gmail.com",
      status: "ร่าง"
    };

    setMeetings([...meetings, newMeeting]);
    setActiveMeetingId(nextId);
    setFormRound('');
    setFormDate('');
    setFormPlace('');
    alert(`สร้างกำหนดการรหัส ${nextId} สำเร็จ`);
    setCurrentTab('check_attendance');
  };

  const handleAddGuest = () => {
    if (!guestName.trim()) return alert("กรุณากรอกชื่อผู้เข้าร่วมเพิ่มเติม");
    const gId = `GUEST_${Date.now()}`;
    const currentAtt = attendance[activeMeetingId] || {};
    
    setAttendance({
      ...attendance,
      [activeMeetingId]: {
        ...currentAtt,
        [gId]: {
          status: "มาประชุม",
          type: "onsite",
          personType: "guest",
          name: guestName,
          role: guestRole,
          dept: guestDept
        }
      }
    });
    setGuestName('');
    alert("แทรกรายชื่อผู้สังเกตการณ์สำเร็จ");
  };

  // --- Live Metrics ---
  const dynamicStats = useMemo(() => {
    let filtered = meetings.filter(m => m.fiscalYear === fiscalYear && (selectedCommittee === 'all' || m.committeeId === selectedCommittee));
    let total = filtered.length;
    let onsite = 0, online = 0, leave = 0, absent = 0;

    filtered.forEach(m => {
      const records = attendance[m.id] || {};
      Object.values(records).forEach(r => {
        if (r.status === "มาประชุม" && r.type === "onsite") onsite++;
        if (r.status === "มาประชุม" && r.type === "online") online++;
        if (r.status === "ลา") leave++;
        if (r.status === "ขาด") absent++;
      });
    });

    return { total, onsite, online, leave, absent };
  }, [meetings, attendance, fiscalYear, selectedCommittee]);

  return (
    <div className="flex min-h-screen bg-[#f4f6f8] text-slate-800 antialiased font-sans">
      
      {/* 🏙️ SIDEBAR DESIGN (สไตล์สีน้ำเงินเข้มหรูหราแบบรูปดีไซน์องค์กร) */}
      <aside className="w-64 bg-[#0f172a] text-slate-200 flex flex-col fixed h-full z-20 shadow-xl border-r border-slate-800">
        <div className="p-5 bg-[#1e293b] border-b border-slate-800">
          <div className="text-sm font-extrabold text-blue-400 uppercase tracking-wider">สปสช. เขต 4 สระบุรี</div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-medium">ระบบบริหารองค์ประชุมองค์กร</div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'dashboard', label: 'หน้าแรก (Dashboard)', icon: Home },
            { id: 'manage_meetings', label: 'จัดการการประชุม', icon: Calendar },
            { id: 'manage_committees', label: 'รายชื่อคณะกรรมการ', icon: Users },
            { id: 'check_attendance', label: 'ระบบเช็คชื่อ (Hybrid)', icon: CheckSquare },
            { id: 'generate_report', label: 'รายงาน Word / Excel', icon: FileText },
          ].map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold transition-all ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            );
          })}
        </nav>
        
        <div className="p-4 bg-[#090d16] border-t border-slate-800 text-center text-[10px] font-semibold text-emerald-400 tracking-wider">
          ● REALTIME DATABASE CONNECTED
        </div>
      </aside>

      {/* 📦 CONTENT CONTAINER */}
      <div className="flex-1 ml-64 p-8 min-h-screen flex flex-col">
        
        {/* TOP BRANDING BAR */}
        <header className="bg-white p-5 rounded-2xl border border-slate-200 mb-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {currentTab === 'dashboard' && 'แดชบอร์ดติดตามข้อมูลและสถิติองค์ประชุม'}
              {currentTab === 'manage_meetings' && 'วางแผนกำหนดการและจัดระเบียบวาระ'}
              {currentTab === 'manage_committees' && 'ทะเบียนรายชื่อและทำเนียบคณะอนุกรรมการแต่งตั้ง'}
              {currentTab === 'check_attendance' && 'บันทึกเวลาเข้าร่วมการประชุมระบบ Hybrid'}
              {currentTab === 'generate_report' && 'พิมพ์เอกสารสรุปสถิติมติที่ประชุมประจำงวด'}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">ระบบเชื่อมต่อโครงสร้างไฟล์ฐานข้อมูลหลัก สปสช.</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-[11px] font-bold text-slate-500">ปีงบประมาณประมวลผล:</span>
            <select value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} className="bg-transparent font-bold text-xs text-slate-800 focus:outline-none">
              <option value="2569">2569</option>
              <option value="2568">2568</option>
            </select>
          </div>
        </header>

        {/* ---------------- VIEW 1: DASHBOARD ---------------- */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase">กรองชุดรายชื่อคณะกรรมการเพื่อวิเคราะห์</label>
              <select 
                value={selectedCommittee} 
                onChange={(e) => setSelectedCommittee(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700"
              >
                <option value="all">📊 แสดงสถิติและประวัติรวมทุกคณะอนุกรรมการทั้งหมด</option>
                {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* KPI METRICS */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'การประชุมทั้งหมด', val: `${dynamicStats.total} ครั้ง`, color: 'bg-blue-50 border-blue-200 text-blue-700' },
                { label: 'มาประชุม ( onsite )', val: `${dynamicStats.onsite} คน`, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                { label: 'มาประชุม ( online )', val: `${dynamicStats.online} คน`, color: 'bg-sky-50 border-sky-200 text-sky-700' },
                { label: 'ลาประชุม', val: `${dynamicStats.leave} คน`, color: 'bg-amber-50 border-amber-200 text-amber-700' },
                { label: 'ขาดประชุม', val: `${dynamicStats.absent} คน`, color: 'bg-rose-50 border-rose-200 text-rose-700' },
              ].map((card, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${card.color} shadow-sm transition-transform hover:scale-[1.01]`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">{card.label}</span>
                  <span className="text-xl font-black mt-3 block tracking-tight">{card.val}</span>
                </div>
              ))}
            </div>

            {/* MAIN RELATIONAL LOG TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-600 flex items-center gap-1.5">
                <Filter size={14} className="text-blue-600" /> ทำเนียบสถิติและสถานะการเช็คชื่อแยกแต่ละรอบวาระ
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 text-center w-12">ลำดับ</th>
                    <th className="p-3.5">ชื่อวาระนัดหมายการประชุม</th>
                    <th className="p-3.5 text-center w-24">ครั้งที่</th>
                    <th className="p-3.5 w-28">วันที่จัด</th>
                    <th className="p-3.5 text-center text-emerald-600 w-16">Onsite</th>
                    <th className="p-3.5 text-center text-sky-600 w-16">Online</th>
                    <th className="p-3.5 text-center text-amber-600 w-14">ลา</th>
                    <th className="p-3.5 text-center text-rose-600 w-14">ขาด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {meetings
                    .filter(m => m.fiscalYear === fiscalYear && (selectedCommittee === 'all' || m.committeeId === selectedCommittee))
                    .map((m, index) => {
                      const att = attendance[m.id] || {};
                      const cOn = Object.values(att).filter(x => x.status === "มาประชุม" && x.type === "onsite").length;
                      const cOl = Object.values(att).filter(x => x.status === "มาประชุม" && x.type === "online").length;
                      const cLe = Object.values(att).filter(x => x.status === "ลา").length;
                      const cAb = Object.values(att).filter(x => x.status === "ขาด").length;

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/50">
                          <td className="p-3.5 text-center font-bold text-slate-300">{index + 1}</td>
                          <td className="p-3.5 font-bold text-slate-900 text-[11px]">{m.name}</td>
                          <td className="p-3.5 text-center font-bold text-blue-600 bg-blue-50/30">{m.round}</td>
                          <td className="p-3.5 text-slate-500">{m.date}</td>
                          <td className="p-3.5 text-center font-bold text-emerald-600 bg-emerald-50/20">{cOn}</td>
                          <td className="p-3.5 text-center font-bold text-sky-600 bg-sky-50/20">{cOl}</td>
                          <td className="p-3.5 text-center font-bold text-amber-600 bg-amber-50/20">{cLe}</td>
                          <td className="p-3.5 text-center font-bold text-rose-600 bg-rose-50/20">{cAb}</td>
                        </tr>
                      );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------- VIEW 2: MANAGE MEETINGS ---------------- */}
        {currentTab === 'manage_meetings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-4">
              <div className="font-bold text-xs uppercase text-slate-400 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <Plus size={15} className="text-blue-600" /> นัดหมายเพิ่มรอบใหม่
              </div>
              <form onSubmit={handleCreateMeeting} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">เลือกสังกัดชุดคณะอนุกรรมการ</label>
                  <select value={formCommId} onChange={(e) => setFormCommId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-2.5 bg-white">
                    {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">ครั้งที่จัด (เช่น 2/2569)</label>
                  <input type="text" required placeholder="เช่น 2/2569" value={formRound} onChange={(e) => setFormRound(e.target.value)} className="w-full border border-slate-200 text-xs rounded-xl p-2" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">วันที่ประชุม</label>
                  <input type="date" required value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full border border-slate-200 text-xs rounded-xl p-2" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">สถานที่จัดประชุม</label>
                  <input type="text" placeholder="ระบุห้องประชุม หรือ ลิงก์ระบบซูม" value={formPlace} onChange={(e) => setFormPlace(e.target.value)} className="w-full border border-slate-200 text-xs rounded-xl p-2" />
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all">
                  สร้างและเปิดวิวกดเช็คชื่อ
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="relative w-64">
                  <input type="text" placeholder="ค้นชื่องานนัดหมาย..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full border border-slate-200 rounded-xl py-1.5 pl-8 pr-3 text-xs" />
                  <Search className="absolute left-2.5 top-2.5 text-slate-400" size={12} />
                </div>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3">วาระนัดประชุม</th>
                    <th className="p-3 w-24">วันที่ประชุม</th>
                    <th className="p-3 w-20 text-center">สถานะ</th>
                    <th className="p-3 w-16 text-center">เปิดระบบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {meetings.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase())).map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-800">
                        {m.name}
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">ครั้งที่ {m.round} • {m.place}</div>
                      </td>
                      <td className="p-3 text-slate-500">{m.date}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.status === 'เสร็จสิ้น' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{m.status}</span>
                      </td>
                      <td className="p-3 text-center">
                        <button onClick={() => { setActiveMeetingId(m.id); setCurrentTab('check_attendance'); }} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg">
                          <CheckSquare size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------- VIEW 3: MANAGE COMMITTEES ---------------- */}
        {currentTab === 'manage_committees' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs uppercase text-slate-500">
              ทะเบียนรายชื่อบุคคลและคณะกรรมการแต่งตั้งรวมกลาง (Master Database)
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-center w-14">รหัสบุคคล</th>
                  <th className="p-3">ชื่อ - นามสกุลอนุกรรมการ</th>
                  <th className="p-3">ตำแหน่งทางการ</th>
                  <th className="p-3">ฝ่ายงานต้นสังกัด</th>
                  <th className="p-3 text-center w-24">สถานะการใช้งาน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {members.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50/50">
                    <td className="p-3 text-center font-bold text-slate-400 bg-slate-50/40">{m.id}</td>
                    <td className="p-3 font-bold text-slate-900">{m.name}</td>
                    <td className="p-3 text-slate-500">{m.position}</td>
                    <td className="p-3 text-slate-400">{m.department}</td>
                    <td className="p-3 text-center">
                      <span className="bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold px-2 py-0.5 rounded">{m.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ---------------- VIEW 4: ATTENDANCE SYSTEM ---------------- */}
        {currentTab === 'check_attendance' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase">เลือกหัวข้อการประชุมที่เปิดระบบเพื่อเช็คชื่อผู้เข้าร่วม</label>
              <select value={activeMeetingId} onChange={(e) => setActiveMeetingId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 p-2.5 rounded-xl">
                {meetings.map(m => <option key={m.id} value={m.id}>{m.name} (รอบครั้งที่ {m.round})</option>)}
              </select>
            </div>

            {/* ส่วนที่ 1: บัญชีเช็คชื่อกรรมการแต่งตั้ง */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-900 text-white flex justify-between items-center text-xs font-bold shadow-inner">
                <span className="flex items-center gap-1.5 text-blue-300">📋 รายชื่อคณะอนุกรรมการผู้มีสิทธิ์ลงชื่อและออกมติรอบนี้</span>
                <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded font-mono text-[10px]">
                  รหัสอ้างอิงคณะ: {meetings.find(m => m.id === activeMeetingId)?.committeeId}
                </span>
              </div>
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-center w-12">ที่</th>
                    <th className="p-3">ชื่อ-นามสกุลอนุกรรมการ</th>
                    <th className="p-3">บทบาทหน้าที่</th>
                    <th className="p-3 text-center w-96">เลือกวิธีเช็คชื่อเข้าประชุม (Hybrid Model)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {getCommitteeMembers(meetings.find(m => m.id === activeMeetingId)?.committeeId || '').map((m, idx) => {
                    const currentRecord = attendance[activeMeetingId]?.[m.id] || { status: 'ขาด', type: '-' };
                    
                    const updateStatus = (st: string, tp: string) => {
                      const currentMeetingAtt = attendance[activeMeetingId] || {};
                      setAttendance({
                        ...attendance,
                        [activeMeetingId]: {
                          ...currentMeetingAtt,
                          [m.id]: { status: st, type: tp, personType: 'member' }
                        }
                      });
                    };

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        <td className="p-3 text-center font-bold text-slate-300">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-800">
                          {m.name}
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5">{m.department}</div>
                        </td>
                        <td className="p-3 text-slate-500 font-semibold">{m.role || 'อนุกรรมการ'}</td>
                        <td className="p-3">
                          <div className="grid grid-cols-4 gap-1">
                            {[
                              { id: 'onsite', label: 'onsite', act: 'มาประชุม' },
                              { id: 'online', label: 'online', act: 'มาประชุม' },
                              { id: 'leave', label: 'ลา', act: 'ลา' },
                              { id: 'absent', label: 'ขาด', act: 'ขาด' },
                            ].map((btn) => {
                              const isSelected = currentRecord.status === btn.act && (btn.act === 'มาประชุม' ? currentRecord.type === btn.id : true);
                              return (
                                <button
                                  key={btn.id}
                                  type="button"
                                  onClick={() => updateStatus(btn.act, btn.act === 'มาประชุม' ? btn.id : '-')}
                                  className={`py-1.5 rounded-lg font-bold border text-[11px] text-center transition-all ${
                                    isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 border-slate-200'
                                  }`}
                                >
                                  {btn.label}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ส่วนที่ 2: ระบบแทรกรายชื่อผู้สังเกตการณ์/ผู้เข้าร่วมเพิ่มเติม */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 h-fit">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1 uppercase">
                  <Video size={14} className="text-blue-500" /> เพิ่มรายชื่อผู้สังเกตการณ์ภายนอก (Guest)
                </div>
                <div className="space-y-2">
                  <input type="text" placeholder="ชื่อ-นามสกุลผู้เข้าร่วมเพิ่ม" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="w-full border border-slate-200 p-2 text-xs rounded-lg" />
                  <input type="text" placeholder="บทบาท/ตำแหน่งงาน" value={guestRole} onChange={(e) => setGuestRole(e.target.value)} className="w-full border border-slate-200 p-2 text-xs rounded-lg" />
                  <input type="text" placeholder="หน่วยงานสังกัดภายนอก" value={guestDept} onChange={(e) => setGuestDept(e.target.value)} className="w-full border border-slate-200 p-2 text-xs rounded-lg" />
                  <button type="button" onClick={handleAddGuest} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2 rounded-lg transition-colors">
                    + แทรกรายชื่อเฉพาะวาระรอบนี้
                  </button>
                </div>
              </div>

              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-400 text-[11px]">
                  รายนามผู้เข้าร่วมประชุมเพิ่มเติมประจำวาระรอบนี้
                </div>
                <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-100 text-xs">
                  {Object.entries(attendance[activeMeetingId] || {}).filter(([_, v]) => v.personType === 'guest').length === 0 ? (
                    <div className="p-5 text-center text-slate-400 font-medium">ยังไม่มีข้อมูลรายชื่อผู้สังเกตการณ์ถูกเพิ่มเข้ามา</div>
                  ) : (
                    Object.entries(attendance[activeMeetingId] || {}).filter(([_, v]) => v.personType === 'guest').map(([id, g]) => (
                      <div key={id} className="p-3 flex justify-between items-center font-medium">
                        <div>
                          <div className="font-bold text-slate-800">{g.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{g.dept} • {g.role}</div>
                        </div>
                        <div className="flex gap-1 w-52">
                          {['onsite', 'online', 'ลา', 'ขาด'].map(st => {
                            const active = g.status === 'มาประชุม' ? g.type === st : g.status === st;
                            return (
                              <button
                                key={st}
                                onClick={() => {
                                  const attMap = attendance[activeMeetingId] || {};
                                  attMap[id] = { ...g, status: (st==='onsite'||st==='online')?'มาประชุม':st, type: (st==='onsite'||st==='online')?st:'-' };
                                  setAttendance({ ...attendance, [activeMeetingId]: { ...attMap } });
                                }}
                                className={`flex-1 font-bold text-[10px] py-0.5 border text-center rounded ${active?'bg-slate-800 text-white border-slate-800':'bg-white text-slate-400'}`}
                              >
                                {st}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button 
                type="button" 
                onClick={() => {
                  const target = meetings.find(x => x.id === activeMeetingId);
                  if (target) target.status = "เสร็จสิ้น";
                  setMeetings([...meetings]);
                  alert("บันทึกประวัติความครบถ้วนองค์ประชุม สปสช. เข้าสู่ศูนย์คลังรายงานเสร็จสิ้น!");
                  setCurrentTab('dashboard');
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-md transition-all"
              >
                บันทึกปิดรอบการจัดประชุมและยืนยันองค์ประชุม
              </button>
            </div>
          </div>
        )}

        {/* ---------------- VIEW 5: PRINT REPORT ---------------- */}
        {currentTab === 'generate_report' && (
          <div className="max-w-md mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
            <FileSpreadsheet size={40} className="text-blue-600 mx-auto bg-blue-50 p-2 rounded-xl" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">เครื่องมือแปลงส่งออกประวัติสถิติมติที่ประชุม</h3>
              <p className="text-xs text-slate-400 mt-1">สร้างไฟล์เอกสารสรุปความครบถ้วนองค์ประชุมตามแบบฟอร์ม พรบ. หลักประกันสุขภาพ</p>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-left text-xs font-semibold space-y-1.5 text-slate-600">
              <div>• สังกัดคลังข้อมูล: <span className="text-slate-900 font-bold">สำนักงาน สปสช. เขต 4 สระบุรี</span></div>
              <div>• รูปแบบเอกสารสรุป: <span className="text-blue-600 font-bold">Microsoft Word Template (.docx)</span></div>
            </div>
            <button onClick={() => alert(`ดึงสถิติงบประมาณปี ${fiscalYear} แปลงข้อมูลเพื่อดาวน์โหลด .docx สำเร็จ!`)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm">
              ดาวน์โหลดรายงานสรุปองค์ประชุม (.docx)
            </button>
          </div>
        )}

      </div>
    </div>
  );
}