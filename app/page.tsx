"use client";
import { useState, useMemo } from 'react';
import { 
  Home, Calendar, Users, CheckSquare, FileText,
  Plus, Search, Edit2, Trash2, Download, UserPlus,
  ChevronDown, CheckCircle, Video, FileSpreadsheet, ListFilter,
  UserCheck, AlertCircle, Clock, MapPin, User
} from 'lucide-react';

// =================================================================
// 📊 ฐานข้อมูลเริ่มต้นดึงมาจากโครงสร้างไฟล์ CSV ของ สปสช. เขต 4 สระบุรี 100%
// =================================================================

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

// เก็บสถานะแบบ Relational: [meetingId]: { [personId]: { status: "มาประชุม"|"ลา"|"ขาด", type: "onsite"|"online"|"-", reason?: string, personType: "member"|"guest" } }
const INITIAL_ATTENDANCE: Record<string, Record<string, { status: string; type: string; reason?: string; personType: string; name?: string; role?: string; dept?: string }>> = {
  "MT001": {
    "M001": { status: "มาประชุม", type: "onsite", personType: "member" },
    "M002": { status: "มาประชุม", type: "online", personType: "member" },
    "M003": { status: "ลา", type: "-", reason: "ติดราชการด่วน", personType: "member" }
  }
};

export default function NHSOMeetingApp() {
  // --- Navigation & UI State ---
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  
  // --- Core Database States ---
  const [committees, setCommittees] = useState(INITIAL_COMMITTEES);
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [memberships, setMemberships] = useState(INITIAL_MEMBERSHIPS);
  const [meetings, setMeetings] = useState(INITIAL_MEETINGS);
  const [attendance, setAttendance] = useState(INITIAL_ATTENDANCE);

  // --- Filter & Global States ---
  const [fiscalYear, setFiscalYear] = useState<string>('2569');
  const [selectedCommitteeFilter, setSelectedCommitteeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeMeetingId, setActiveMeetingId] = useState<string>('MT001');

  // --- Form Input States ---
  // คณะกรรมการใหม่
  const [newCommName, setNewCommName] = useState('');
  const [newCommQuorum, setNewCommQuorum] = useState('20');
  const [newCommDept, setNewCommDept] = useState('สำนักงานใหญ่');
  
  // สมาชิกใหม่ + ผูกสิทธิ์
  const [newMemName, setNewMemName] = useState('');
  const [newMemRole, setNewMemRole] = useState('กรรมการ');
  const [newMemDept, setNewMemDept] = useState('สำนักงานใหญ่');
  const [bindCommitteeId, setBindCommitteeId] = useState('C001');

  // นัดหมายประชุมใหม่
  const [meetingFormCommId, setMeetingFormCommId] = useState('C001');
  const [meetingFormRound, setMeetingFormRound] = useState('');
  const [meetingFormDate, setMeetingFormDate] = useState('');
  const [meetingFormPlace, setMeetingFormPlace] = useState('');

  // ผู้เข้าร่วมเพิ่มเติม (Guest) ในหน้าเช็คชื่อ
  const [guestName, setGuestName] = useState('');
  const [guestRole, setGuestRole] = useState('ผู้เข้าร่วมประชุมเพิ่มเติม');
  const [guestDept, setGuestDept] = useState('หน่วยงานภายนอก');

  // --- Relational Helper Functions ---
  const getMembersInCommittee = (committeeId: string) => {
    const rels = memberships.filter(m => m.committeeId === committeeId);
    return rels.map(r => {
      const info = members.find(m => m.id === r.memberId);
      return {
        id: r.memberId,
        name: info?.name || "ไม่ระบุชื่อ",
        department: info?.department || "-",
        role: r.role
      };
    });
  };

  const getCommitteeName = (id: string) => {
    return committees.find(c => c.id === id)?.name || "ไม่พบกลุ่มคณะกรรมการ";
  };

  // --- Actions ---
  const createCommittee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommName.trim()) return;
    const nextId = `C${String(committees.length + 1).padStart(3, '0')}`;
    setCommittees([...committees, { id: nextId, name: newCommName, quorum: Number(newCommQuorum), dept: newCommDept }]);
    setNewCommName('');
    alert(`สร้างคณะกรรมการรหัส ${nextId} สำเร็จ`);
  };

  const createMemberAndMembership = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemName.trim()) return;
    const nextMemId = `M${String(members.length + 1).padStart(3, '0')}`;
    const nextMsId = `MS${String(memberships.length + 1).padStart(3, '0')}`;

    setMembers([...members, { id: nextMemId, name: newMemName, position: newMemRole, department: newMemDept, status: "ใช้งาน" }]);
    setMemberships([...memberships, { id: nextMsId, memberId: nextMemId, committeeId: bindCommitteeId, role: newMemRole }]);
    
    setNewMemName('');
    alert(`ลงทะเบียนคุณ ${newMemName} เข้าสู่ระบบสำเร็จ`);
  };

  const createMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingFormRound || !meetingFormDate) {
      alert("กรุณากรอกข้อมูล ครั้งที่ประชุม และ วันที่จัด ให้ครบถ้วน");
      return;
    }
    const nextMtId = `MT${String(meetings.length + 1).padStart(3, '0')}`;
    const comm = committees.find(c => c.id === meetingFormCommId);
    
    const newMeeting = {
      id: nextMtId,
      committeeId: meetingFormCommId,
      name: `ประชุม${comm?.name || ''}`,
      round: meetingFormRound,
      fiscalYear: fiscalYear,
      date: meetingFormDate,
      startTime: "09:30",
      endTime: "12:00",
      place: meetingFormPlace || "ห้องประชุม สpสช. เขต 4",
      chairId: "M002",
      recorder: "backoffice.nhso4@gmail.com",
      status: "ร่าง"
    };

    setMeetings([...meetings, newMeeting]);
    setActiveMeetingId(nextMtId);
    setMeetingFormRound('');
    setMeetingFormDate('');
    setMeetingFormPlace('');
    alert(`สร้างวาระการประชุมรอบใหม่สำเร็จ รหัสอ้างอิง: ${nextMtId}`);
    setCurrentTab('check_attendance');
  };

  const addGuestToMeeting = () => {
    if (!guestName.trim()) return alert("กรุณาระบุชื่อผู้เข้าร่วมเพิ่มเติม");
    const guestId = `GUEST_${Date.now()}`;
    const currentMeetingAtt = attendance[activeMeetingId] || {};
    
    setAttendance({
      ...attendance,
      [activeMeetingId]: {
        ...currentMeetingAtt,
        [guestId]: {
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
    alert("เพิ่มผู้เข้าร่วมเพิ่มเติมในรอบนี้สำเร็จ");
  };

  // --- Dynamic Stat Calculations ---
  const computedStats = useMemo(() => {
    let filteredMeetings = meetings.filter(m => m.fiscalYear === fiscalYear && (selectedCommitteeFilter === 'all' || m.committeeId === selectedCommitteeFilter));
    let total = filteredMeetings.length;
    let onsite = 0, online = 0, leave = 0, absent = 0;

    filteredMeetings.forEach(m => {
      const records = attendance[m.id] || {};
      Object.values(records).forEach(r => {
        if (r.status === "มาประชุม" && r.type === "onsite") onsite++;
        if (r.status === "มาประชุม" && r.type === "online") online++;
        if (r.status === "ลา") leave++;
        if (r.status === "ขาด") absent++;
      });
    });

    return { total, onsite, online, leave, absent };
  }, [meetings, attendance, fiscalYear, selectedCommitteeFilter]);

  return (
    <div className="flex min-h-screen bg-[#f1f5f9] text-slate-800 antialiased font-sans">
      
      {/* =================================================================
          SIDEBAR: เมนูควบคุมหลักตามโครงสร้างแท็บแอปพลิเคชันองค์กร
          ================================================================= */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-10 shadow-xl border-r border-slate-800">
        <div className="p-5 bg-slate-950 border-b border-slate-800">
          <div className="text-base font-extrabold text-blue-400 tracking-wide">สปสช. เขต 4 สระบุรี</div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-medium">ระบบบริหารสถิติมติองค์ประชุม</div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'dashboard', label: 'หน้าแรก (Dashboard)', icon: Home },
            { id: 'manage_meetings', label: 'จัดการการประชุม', icon: Calendar },
            { id: 'manage_committees', label: 'รายชื่อคณะกรรมการ', icon: Users },
            { id: 'check_attendance', label: 'ระบบเช็คชื่อ (Hybrid)', icon: CheckSquare },
            { id: 'generate_report', label: 'รายงาน Word / Excel', icon: FileText },
          ].map((menu) => {
            const isCurrent = currentTab === menu.id;
            return (
              <button
                key={menu.id}
                onClick={() => setCurrentTab(menu.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all duration-200 ${
                  isCurrent 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <menu.icon size={18} className={isCurrent ? 'text-white' : 'text-slate-400'} />
                {menu.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center">
          <div className="text-[11px] font-bold text-emerald-400 flex items-center justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            CONNECTED DB REALTIME
          </div>
        </div>
      </aside>

      {/* =================================================================
          MAIN CONTAINER AREA
          ================================================================= */}
      <main className="flex-1 ml-64 p-8 min-h-screen">
        
        {/* TOP BRANDING BAR */}
        <header className="bg-white p-5 rounded-2xl border border-slate-200 mb-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {currentTab === 'dashboard' && 'ระบบวิเคราะห์สถิติองค์ประชุมประจำปี'}
              {currentTab === 'manage_meetings' && 'วางแผนวาระและรอบนัดการจัดประชุม'}
              {currentTab === 'manage_committees' && 'ทะเบียนประวัติและสส. คณะอนุกรรมการ'}
              {currentTab === 'check_attendance' && 'ระบบบันทึกบัญชีรายชื่อผู้เข้าร่วม (Hybrid Mode)'}
              {currentTab === 'generate_report' && 'เครื่องมือรวมศูนย์ออกเอกสารรายงาน พรบ.'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">สำนักงานหลักประกันสุขภาพแห่งชาติ • NHSO Area 4 Saraburi</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">ปีงบประมาณรันระบบ:</span>
            <select 
              value={fiscalYear} 
              onChange={(e) => setFiscalYear(e.target.value)}
              className="bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="2569">2569 (ปีปัจจุบัน)</option>
              <option value="2568">2568</option>
            </select>
          </div>
        </header>

        {/* ---------------- แท็บที่ 1: DASHBOARD ---------------- */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            {/* SEARCH AND FILTERS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">กรองข้อมูลชุดคณะอนุกรรมการในการแสดงผลสถิติ</label>
              <select 
                value={selectedCommitteeFilter} 
                onChange={(e) => setSelectedCommitteeFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">📊 แสดงประวัติภาพรวมรวมกันทุกคณะอนุกรรมการในคลัง</option>
                {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* KPI METRIC CARDS (ถอดสูตรคำนวณแบบ Dynamic ตามหน้าต้นฉบับรูปภาพ) */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'การประชุมทั้งหมด', val: `${computedStats.total} ครั้ง`, style: 'bg-blue-50 text-blue-700 border-blue-200' },
                { label: 'มาประชุม ( onsite )', val: `${computedStats.onsite} คน`, style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                { label: 'มาประชุม ( online )', val: `${computedStats.sky || computedStats.online} คน`, style: 'bg-sky-50 text-sky-700 border-sky-200' },
                { label: 'ลาประชุม', val: `${computedStats.leave} คน`, style: 'bg-amber-50 text-amber-700 border-amber-200' },
                { label: 'ขาดประชุม', val: `${computedStats.absent} คน`, style: 'bg-rose-50 text-rose-700 border-rose-200' },
              ].map((card, i) => (
                <div key={i} className={`bg-white p-4 rounded-xl border ${card.style} shadow-sm transition-transform hover:scale-[1.02]`}>
                  <div className="text-xs font-bold text-slate-400">{card.label}</div>
                  <div className="text-xl font-extrabold mt-3 tracking-tight">{card.val}</div>
                </div>
              ))}
            </div>

            {/* MAIN RELATIONAL LOG TABLE */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <ListFilter size={15} className="text-blue-600"/> ตารางแจกแจงจำนวนผู้เข้าร่วมประชุมแยกรายรอบการจัด
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-600 uppercase">
                    <tr>
                      <th className="p-3.5 text-center w-12">ลำดับ</th>
                      <th className="p-3.5">ชื่อรอบการประชุมอย่างเป็นทางการ</th>
                      <th className="p-3.5 w-24 text-center">ครั้งที่</th>
                      <th className="p-3.5 w-28">วันที่ประชุม</th>
                      <th className="p-3.5 text-center text-emerald-600 w-20">Onsite</th>
                      <th className="p-3.5 text-center text-sky-600 w-20">Online</th>
                      <th className="p-3.5 text-center text-amber-600 w-16">ลา</th>
                      <th className="p-3.5 text-center text-rose-600 w-16">ขาด</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {meetings
                      .filter(m => m.fiscalYear === fiscalYear && (selectedCommitteeFilter === 'all' || m.committeeId === selectedCommitteeFilter))
                      .map((meeting, idx) => {
                        const attMap = attendance[meeting.id] || {};
                        const nOnsite = Object.values(attMap).filter(v => v.status === "มาประชุม" && v.type === "onsite").length;
                        const nOnline = Object.values(attMap).filter(v => v.status === "มาประชุม" && v.type === "online").length;
                        const nLeave = Object.values(attMap).filter(v => v.status === "ลา").length;
                        const nAbsent = Object.values(attMap).filter(v => v.status === "ขาด").length;

                        return (
                          <tr key={meeting.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3.5 text-center font-bold text-slate-300">{idx + 1}</td>
                            <td className="p-3.5 font-bold text-slate-800">{meeting.name}</td>
                            <td className="p-3.5 text-center font-bold text-blue-600 bg-blue-50/30">{meeting.round}</td>
                            <td className="p-3.5 text-slate-500">{meeting.date}</td>
                            <td className="p-3.5 text-center font-bold text-emerald-600 bg-emerald-50/20">{nOnsite}</td>
                            <td className="p-3.5 text-center font-bold text-sky-600 bg-sky-50/20">{nOnline}</td>
                            <td className="p-3.5 text-center font-bold text-amber-600 bg-amber-50/20">{nLeave}</td>
                            <td className="p-3.5 text-center font-bold text-rose-600 bg-rose-50/20">{nAbsent}</td>
                          </tr>
                        );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- แท็บที่ 2: MANAGE MEETINGS ---------------- */}
        {currentTab === 'manage_meetings' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ฟอร์มสร้างนัดหมายการประชุมใหม่ */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-4">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Plus size={16} className="text-blue-600" /> วางกำหนดการนัดหมายใหม่
                </div>
                <form onSubmit={createMeeting} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">เลือกชุดคณะกรรมการหลัก</label>
                    <select 
                      value={meetingFormCommId} 
                      onChange={(e) => setMeetingFormCommId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-2 bg-white"
                    >
                      {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">ครั้งที่จัดประชุม (เช่น 1/2569)</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="เช่น 1/2569" 
                      value={meetingFormRound}
                      onChange={(e) => setMeetingFormRound(e.target.value)}
                      className="w-full border border-slate-200 text-xs rounded-xl p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">วันที่จัดประชุม</label>
                    <input 
                      type="date" 
                      required 
                      value={meetingFormDate}
                      onChange={(e) => setMeetingFormDate(e.target.value)}
                      className="w-full border border-slate-200 text-xs rounded-xl p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">สถานที่จัดหรือลิงก์ออนไลน์</label>
                    <input 
                      type="text" 
                      placeholder="เช่น ห้องประชุม 1 สปสช." 
                      value={meetingFormPlace}
                      onChange={(e) => setMeetingFormPlace(e.target.value)}
                      className="w-full border border-slate-200 text-xs rounded-xl p-2"
                    />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition-colors shadow-sm">
                    ลงระบบและเปิดสิทธิ์ลงทะเบียนทันที
                  </button>
                </form>
              </div>

              {/* รายการวาระการประชุมที่มีอยู่ทั้งหมดในคลัง */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <div className="relative w-64">
                    <input 
                      type="text" 
                      placeholder="ค้นหาชื่อนัดหมาย..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl py-1.5 pl-8 pr-3 text-xs bg-white"
                    />
                    <Search className="absolute left-2.5 top-2 text-slate-400" size={13}/>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">วาระการประชุมคณะกรรมการ</th>
                        <th className="p-3 w-24">วันที่จัด</th>
                        <th className="p-3 w-28 text-center">สถานะใช้งาน</th>
                        <th className="p-3 w-20 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {meetings
                        .filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((m) => (
                          <tr key={m.id} className="hover:bg-slate-50/60">
                            <td className="p-3 font-bold text-slate-800">
                              {m.name} 
                              <div className="text-[10px] text-blue-600 font-semibold mt-0.5">ครั้งที่ {m.round} • สถานที่: {m.place}</div>
                            </td>
                            <td className="p-3 text-slate-500">{m.date}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${m.status === 'เสร็จสิ้น' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                {m.status}
                              </span>
                            </td>
                            <td className="p-3 flex items-center justify-center gap-1.5">
                              <button 
                                onClick={() => { setActiveMeetingId(m.id); setCurrentTab('check_attendance'); }} 
                                className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all" 
                                title="เปิดเข้าเช็คชื่อกรรมการ"
                              >
                                <CheckSquare size={13}/>
                              </button>
                              <button 
                                onClick={() => setMeetings(meetings.filter(x => x.id !== m.id))} 
                                className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg"
                              >
                                <Trash2 size={13}/>
                              </button>
                            </td>
                          </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- แท็บที่ 3: MANAGE COMMITTEES ---------------- */}
        {currentTab === 'manage_committees' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ฟอร์มสร้างและผูกสมาชิก (Membership Structure Form) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-4">
              <div className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <UserPlus size={16} className="text-blue-600" /> ลงทะเบียนสมาชิกและสิทธิ์การแต่งตั้ง
              </div>
              <form onSubmit={createMemberAndMembership} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">เลือกชุดคณะอนุกรรมการที่จะแต่งตั้งเข้า</label>
                  <select 
                    value={bindCommitteeId} 
                    onChange={(e) => setBindCommitteeId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-2.5 bg-white font-semibold"
                  >
                    {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">ชื่อ - นามสกุลอนุกรรมการ</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="ระบุชื่อจริงและนามสกุล" 
                    value={newMemName}
                    onChange={(e) => setNewMemName(e.target.value)}
                    className="w-full border border-slate-200 text-xs rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">ตำแหน่งบทบาท (เช่น ประธาน, กรรมการ)</label>
                  <input 
                    type="text" 
                    value={newMemRole}
                    onChange={(e) => setNewMemRole(e.target.value)}
                    className="w-full border border-slate-200 text-xs rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">หน่วยงานสังกัด / ฝ่ายงาน</label>
                  <input 
                    type="text" 
                    value={newMemDept}
                    onChange={(e) => setNewMemDept(e.target.value)}
                    className="w-full border border-slate-200 text-xs rounded-xl p-2"
                  />
                </div>
                <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2.5 rounded-xl shadow-sm transition-all">
                  บันทึกเข้าตารางทะเบียนกลาง
                </button>
              </form>
            </div>

            {/* บัญชีทะเบียนกลางสมาชิกทั้งหมด (Member Master จากไฟล์ CSV) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-500">บัญชีทะเบียนรายชื่อบุคคลทั้งหมด (Master Member)</span>
                <span className="bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold px-3 py-0.5 rounded-full">มีข้อมูลในคลัง {members.length} ท่าน</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-3 text-center w-12">ID</th>
                      <th className="p-3">ชื่อ - นามสกุล</th>
                      <th className="p-3">บทบาทแรกรับ</th>
                      <th className="p-3">ฝ่ายงานสังกัด</th>
                      <th className="p-3 text-center w-20">สถานะคลัง</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        <td className="p-3 text-center font-bold text-slate-400 bg-slate-50/30">{m.id}</td>
                        <td className="p-3 font-bold text-slate-800">{m.name}</td>
                        <td className="p-3 text-slate-500">{m.position}</td>
                        <td className="p-3 text-slate-400">{m.department}</td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 text-[10px] rounded font-bold bg-green-50 border border-green-200 text-green-700">{m.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- แท็บที่ 4: CHECK ATTENDANCE ---------------- */}
        {currentTab === 'check_attendance' && (
          <div className="space-y-6">
            {/* ตัวเลือกนัดหมายประชุมปัจจุบันที่จะลงมติเช็คชื่อ */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">ระบุรอบการประชุมหลักประกันสุขภาพที่จะเข้าบันทึกสถิติ</label>
                <div className="relative">
                  <select 
                    value={activeMeetingId} 
                    onChange={(e) => setActiveMeetingId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 rounded-xl p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {meetings.map(m => <option key={m.id} value={m.id}>{m.name} (ครั้งที่ {m.round})</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={16}/>
                </div>
              </div>
            </div>

            {/* ส่วนที่ 1: ตารางบันทึกสถานะคณะกรรมการจริง (แต่งตั้งตามสิทธิ์ฐานข้อมูล) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-900 text-white font-bold text-xs flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div className="flex items-center gap-2 text-blue-300">
                  <UserCheck size={16} className="text-emerald-400" />
                  <span>บัญชีสิทธิ์เช็คชื่ออนุกรรมการตามสิทธิ์แต่งตั้งประจำคณะ</span>
                </div>
                <div className="text-[11px] bg-slate-800/80 px-3 py-1 rounded-lg border border-slate-700 text-slate-300 font-mono">
                  รหัสผูกความสัมพันธ์ตาราง: {meetings.find(m =>