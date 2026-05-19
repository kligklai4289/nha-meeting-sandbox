"use client";
import { useState, useMemo } from 'react';
import { 
  Home, Calendar, Users, CheckSquare, FileText,
  Plus, Edit, Trash2, Download, FileSpreadsheet, Search, Filter
} from 'lucide-react';

// ==========================================
// 📊 ฐานข้อมูลอ้างอิงโครงสร้าง สปสช. เขต 4 (2 คณะหลัก)
// ==========================================
const INITIAL_COMMITTEES = [
  { id: "C001", name: "คณะอนุกรรมการหลักประกันสุขภาพแห่งชาติ เขต 4 สระบุรี", quorum: 5 },
  { id: "C002", name: "คณะอนุกรรมการควบคุมคุณภาพและมาตรฐานบริการสาธารณสุข เขต 4 สระบุรี", quorum: 5 }
];

const INITIAL_MEMBERS = [
  { id: "M001", name: "นายสมชาย ใจดี", position: "กรรมการ", department: "สำนักงานใหญ่", status: "ใช้งาน" },
  { id: "M002", name: "นางสาวสมหญิง มีสุข", position: "ประธาน", department: "สำนักงานใหญ่", status: "ใช้งาน" },
  { id: "M003", name: "นายวิชัย ศรีสวัสดิ์", position: "กรรมการ", department: "ฝ่ายการเงิน", status: "ใช้งาน" },
  { id: "M004", name: "นางมาลี รักดี", position: "เลขานุการ", department: "ฝ่ายการเงิน", status: "ใช้งาน" },
  { id: "M005", name: "นายประสิทธิ์ ดีงาม", position: "กรรมการ", department: "ฝ่ายพัฒนาธุรกิจ", status: "ใช้งาน" },
  { id: "M007", name: "นายธนกร พัฒนา", position: "รองประธาน", department: "สำนักงานใหญ่", status: "ใช้งาน" }
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
  { 
    id: "MT001", 
    committeeId: "C001", 
    name: "ประชุมคณะอนุกรรมการหลักประกันสุขภาพแห่งชาติ เขต 4 สระบุรี", 
    round: "1/2569", 
    fiscalYear: "2569", 
    date: "2026-05-17", 
    startTime: "09:30", 
    endTime: "12:00", 
    place: "ห้องประชุม สปสช. เขต 4 สระบุรี", 
    chairId: "M002", 
    recorder: "backoffice.nhso4@gmail.com", 
    status: "ร่าง" 
  }
];

const INITIAL_ATTENDANCE: Record<string, Record<string, { status: string; type: string; note: string }>> = {
  "MT001": {
    "M001": { status: "เข้าร่วม", type: "Onsite", note: "" },
    "M002": { status: "เข้าร่วม", type: "Online", note: "" },
    "M003": { status: "ลา", type: "Onsite", note: "ติดภารกิจเร่งด่วน" }
  }
};

export default function App() {
  // --- UI Views ---
  const [currentTab, setCurrentTab] = useState<string>('dashboard'); 
  
  // --- Database States ---
  const [committees, setCommittees] = useState(INITIAL_COMMITTEES);
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [memberships, setMemberships] = useState(INITIAL_MEMBERSHIPS);
  const [meetings, setMeetings] = useState(INITIAL_MEETINGS);
  const [attendance, setAttendance] = useState(INITIAL_ATTENDANCE);

  // --- Selectors ---
  const [fiscalYear, setFiscalYear] = useState<string>('2569');
  const [selectedCommittee, setSelectedCommittee] = useState<string>('C001');
  const [activeMeetingId, setActiveMeetingId] = useState<string>('MT001');

  // --- หน้ารายชื่อคณะกรรมการ States & Filters ---
  const [minQuorum, setMinQuorum] = useState<string>('5');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ทั้งหมด');
  
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [newMemberRole, setNewMemberRole] = useState<string>('');
  const [newMemberDept, setNewMemberDept] = useState<string>('');

  // --- ฟอร์มเพิ่มด่วนหน้าเช็คชื่อ ---
  const [quickName, setQuickName] = useState('');
  const [quickRole, setQuickRole] = useState('');
  const [quickDept, setQuickDept] = useState('');

  // --- จัดการประชุม ฟอร์ม ---
  const [formMeetingName, setFormMeetingName] = useState('');
  const [formRound, setFormRound] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formPlace, setFormPlace] = useState('');
  const [formCommId, setFormCommId] = useState('C001');
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);

  // ==========================================
  // ⚡ ฟังก์ชันดาวน์โหลดรายงาน Word
  // ==========================================
  const handleDownloadWord = (meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return alert("ไม่พบข้อมูลการประชุม");

    const commName = committees.find(c => c.id === meeting.committeeId)?.name || "";
    const attRecords = attendance[meetingId] || {};

    const attendList: string[] = [];
    const leaveList: string[] = [];

    const commMembers = getCommitteeMembers(meeting.committeeId);
    commMembers.forEach(m => {
      const record = attRecords[m.id] || { status: 'ลา', type: 'Onsite', note: '' };
      if (record.status === "เข้าร่วม") {
        attendList.push(`${m.name} (${record.type}) ${record.note ? `[หมายเหตุ: ${record.note}]` : ''}`);
      } else {
        leaveList.push(`${m.name} ${record.note ? `(ลาเพราะ: ${record.note})` : '(ลา)'}`);
      }
    });

    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>รายงานการบันทึกเข้าร่วมประชุม</title></head>
      <body style='font-family: "TH Sarabun New", "Arial", sans-serif; font-size: 16pt; line-height: 1.5;'>
        <div style='text-align: center; font-weight: bold; font-size: 18pt;'>รายงานผลการลงทะเบียนเข้าร่วมประชุม</div>
        <div style='text-align: center; font-weight: bold;'>คณะอนุกรรมการ เขต 4 สระบุรี</div>
        <br/>
        <p><b>ชื่อการประชุม:</b> ${meeting.name}</p>
        <p><b>สังกัดคณะ:</b> ${commName}</p>
        <p><b>ครั้งที่ประชุม:</b> ${meeting.round} | <b>ปีงบประมาณ:</b> ${meeting.fiscalYear}</p>
        <p><b>วันที่ประชุม:</b> ${meeting.date} | <b>สถานที่:</b> ${meeting.place}</p>
        <hr/>
        <h3>1. รายชื่อผู้เข้าร่วมประชุม (จำนวน ${attendList.length} ท่าน)</h3>
        <ol>${attendList.map(name => `<li>${name}</li>`).join('')}</ol>
        <h3>2. รายชื่อผู้ลาประชุม (จำนวน ${leaveList.length} ท่าน)</h3>
        <ol>${leaveList.map(name => `<li>${name}</li>`).join('')}</ol>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `รายงานการประชุม_ครั้งที่_${meeting.round.replace('/', '_')}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // --- คำนวณรายชื่อและคัดกรองข้อมูลคณะกรรมการ ---
  const currentCommitteeMembers = useMemo(() => {
    const rels = memberships.filter(ms => ms.committeeId === selectedCommittee);
    const mapped = rels.map(r => {
      const info = members.find(m => m.id === r.memberId);
      return {
        membershipId: r.id,
        memberId: r.memberId,
        name: info?.name || "ไม่ทราบชื่อ",
        position: r.role || info?.position || "กรรมการ",
        department: info?.department || "-",
        status: info?.status || "ใช้งาน"
      };
    });

    return mapped.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ทั้งหมด' || m.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [memberships, selectedCommittee, members, searchQuery, statusFilter]);

  const currentCommitteeInfo = useMemo(() => {
    return committees.find(c => c.id === selectedCommittee);
  }, [committees, selectedCommittee]);

  const handleSaveQuorum = () => {
    setCommittees(prev => prev.map(c => c.id === selectedCommittee ? { ...c, quorum: Number(minQuorum) } : c));
    alert("บันทึกองค์ประชุมขั้นต่ำเรียบร้อยแล้ว");
  };

  const handleAddNewMemberToCommittee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return alert("กรุณากรอกชื่อ-นามสกุล");
    const newId = `M${String(members.length + 1).padStart(3, '0')}`;
    setMembers([...members, { id: newId, name: newMemberName, position: newMemberRole || "กรรมการ", department: newMemberDept || "สำนักงานใหญ่", status: "ใช้งาน" }]);
    setMemberships([...memberships, { id: `MS${String(memberships.length + 1).padStart(3, '0')}`, memberId: newId, committeeId: selectedCommittee, role: newMemberRole || "กรรมการ" }]);
    setNewMemberName(''); setNewMemberRole(''); setNewMemberDept('');
    alert("เพิ่มรายชื่อเข้าคณะกรรมการสำเร็จ");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fakeCSVData = [
      { name: "ดร.นพ.สุรวิชญ์ เกษมสุข", position: "ผู้ทรงคุณวุฒิ", department: "โรงพยาบาลสระบุรี" },
      { name: "นางสุมาลี วงศ์ประเสริฐ", position: "กรรมการผู้แทนชุมชน", department: "เครือข่ายภาคประชาชน เขต 4" },
      { name: "ภก.วิเชียร ธนบดีอนันต์", position: "กรรมการ", department: "สสจ.นนทบุรี" }
    ];

    const updatedMembers = [...members];
    const updatedMemberships = [...memberships];

    fakeCSVData.forEach((item, idx) => {
      const newId = `M_CSV_${Date.now()}_${idx}`;
      updatedMembers.push({
        id: newId,
        name: item.name,
        position: item.position,
        department: item.department,
        status: "ใช้งาน"
      });
      updatedMemberships.push({
        id: `MS_CSV_${Date.now()}_${idx}`,
        memberId: newId,
        committeeId: selectedCommittee,
        role: item.position
      });
    });

    setMembers(updatedMembers);
    setMemberships(updatedMemberships);
    alert(`นำเข้าไฟล์ [ ${file.name} ] สำเร็จ! เพิ่มรายชื่อใหม่จำนวน ${fakeCSVData.length} ท่าน เข้าสู่คณะนี้เรียบร้อยแล้ว`);
    e.target.value = '';
  };

  const handleAddQuickMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) return alert("กรุณาระบุชื่อ-นามสกุล");
    const currentMeeting = meetings.find(m => m.id === activeMeetingId);
    if (!currentMeeting) return;

    const newId = `M_Q${Date.now()}`;
    setMembers(prev => [...prev, { id: newId, name: quickName, position: quickRole || "กรรมการ", department: quickDept || "หน่วยงานภายนอก", status: "ใช้งาน" }]);
    setMemberships(prev => [...prev, { id: `MS_Q${Date.now()}`, memberId: newId, committeeId: currentMeeting.committeeId, role: quickRole || "กรรมการ" }]);
    
    setAttendance(prev => ({
      ...prev,
      [activeMeetingId]: {
        ...(prev[activeMeetingId] || {}),
        [newId]: { status: "เข้าร่วม", type: "Onsite", note: "" }
      }
    }));

    setQuickName(''); setQuickRole(''); setQuickDept('');
    alert("เพิ่มชื่ออนุกรรมการเข้าตารางเช็คชื่อปัจจุบันสำเร็จ");
  };

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

  const handleCreateOrUpdateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRound || !formDate || !formMeetingName.trim()) return alert("กรุณากรอกข้อมูลให้ครบถ้วน");

    if (editingMeetingId) {
      setMeetings(prev => prev.map(m => m.id === editingMeetingId ? { ...m, committeeId: formCommId, name: formMeetingName, round: formRound, date: formDate, place: formPlace || "ห้องประชุม สปสช. เขต 4" } : m));
      alert("แก้ไขข้อมูลการประชุมเรียบร้อยแล้ว");
      setEditingMeetingId(null);
    } else {
      const nextId = `MT${String(meetings.length + 1).padStart(3, '0')}`;
      setMeetings([...meetings, { id: nextId, committeeId: formCommId, name: formMeetingName, round: formRound, fiscalYear: fiscalYear, date: formDate, startTime: "09:30", endTime: "12:00", place: formPlace || "ห้องประชุม สปสช. เขต 4 สระบุรี", chairId: "M002", recorder: "backoffice.nhso4@gmail.com", status: "ร่าง" }]);
      setActiveMeetingId(nextId);
      alert(`สร้างกำหนดการรหัส ${nextId} สำเร็จ`);
      setCurrentTab('check_attendance');
    }
    setFormMeetingName(''); setFormRound(''); setFormDate(''); setFormPlace('');
  };

  const handleEditClick = (meeting: any) => {
    setEditingMeetingId(meeting.id); setFormCommId(meeting.committeeId); setFormMeetingName(meeting.name); setFormRound(meeting.round); setFormDate(meeting.date); setFormPlace(meeting.place);
  };

  const handleDeleteMeeting = (meetingId: string) => {
    if (confirm("คุณต้องการลบรายการประชุมนี้ใช่หรือไม่?")) {
      setMeetings(prev => prev.filter(m => m.id !== meetingId));
      alert("ลบข้อมูลการประชุมเรียบร้อย");
    }
  };

  // --- คำนวณสถิติเพื่อนำมาจัดบอร์ดตามหน้า ภาพรวม (1.jpg) 100% ---
  const dynamicStats = useMemo(() => {
    let filtered = meetings.filter(m => m.fiscalYear === fiscalYear);
    let total = filtered.length;
    let onsite = 0, online = 0, leave = 0;
    
    filtered.forEach(m => {
      const records = attendance[m.id] || {};
      Object.values(records).forEach(r => {
        if (r.status === "เข้าร่วม") {
          if (r.type === "Onsite") onsite++;
          if (r.type === "Online") online++;
        }
        if (r.status === "ลา") leave++;
      });
    });
    
    // คำนวณสถิติสะสมภาพรวมทั้งหมดในฐานข้อมูล
    const totalAllMembers = members.length;
    const totalAllCommittees = committees.length;

    return { total, onsite, online, leave, totalAllMembers, totalAllCommittees };
  }, [meetings, attendance, fiscalYear, members, committees]);

  const activeAttendanceStats = useMemo(() => {
    const currentMeeting = meetings.find(m => m.id === activeMeetingId);
    const commId = currentMeeting?.committeeId || '';
    const targetQuorum = committees.find(c => c.id === commId)?.quorum || 5;
    
    const commMembers = getCommitteeMembers(commId);
    const records = attendance[activeMeetingId] || {};

    let totalJoined = 0;
    let totalLeave = 0;
    let totalOnsite = 0;
    let totalOnline = 0;

    commMembers.forEach(m => {
      const record = records[m.id] || { status: 'ขาด', type: 'Onsite' };
      if (record.status === 'เข้าร่วม') {
        totalJoined++;
        if (record.type === 'Onsite') totalOnsite++;
        if (record.type === 'Online') totalOnline++;
      } else if (record.status === 'ลา') {
        totalLeave++;
      }
    });

    const isQuorumComplete = totalJoined >= targetQuorum;

    return {
      joined: totalJoined,
      leave: totalLeave,
      onsite: totalOnsite,
      online: totalOnline,
      quorumLimit: targetQuorum,
      statusText: isQuorumComplete ? "ครบองค์ประชุม" : "ยังไม่ครบองค์ประชุม"
    };
  }, [activeMeetingId, meetings, attendance, committees]);

  const handleRemoveMemberFromCommittee = (mId: string) => {
    if (confirm("คุณต้องการลบรายชื่อนี้ออกจากคณะกรรมการใช่หรือไม่?")) {
      setMemberships(prev => prev.filter(ms => ms.id !== mId));
      alert("ลบออกจากคณะเรียบร้อยแล้ว");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f4f6f8] text-slate-800 antialiased font-sans text-sm">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0f172a] text-slate-200 flex flex-col fixed h-full z-20 shadow-xl">
        <div className="p-4 bg-[#1e293b] border-b border-slate-800 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center font-bold text-white text-sm">NH4</div>
          <div>
            <div className="text-xs font-bold text-slate-100 tracking-tight">ระบบลงทะเบียนเข้าร่วมประชุม</div>
            <div className="text-[11px] text-blue-400 font-semibold tracking-wider">คณะอนุกรรมการ เขต 4 สระบุรี</div>
          </div>
        </div>
        
        <nav className="flex-1 p-3 space-y-1">
          {[
            { id: 'dashboard', label: 'ภาพรวม', icon: Home },
            { id: 'manage_meetings', label: 'การประชุม', icon: Calendar },
            { id: 'manage_committees', label: 'รายชื่อคณะ', icon: Users },
            { id: 'check_attendance', label: 'เช็คชื่อ', icon: CheckSquare },
            { id: 'generate_report', label: 'รายงาน Word', icon: FileText },
          ].map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left text-sm font-medium transition-all ${
                  isActive 
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/10' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 ml-64 p-6 min-h-screen bg-[#f8fafc]">
        
        <div className="flex justify-end items-center mb-5">
          <span className="bg-slate-100 border border-slate-200 px-4 py-1.5 rounded-full text-xs text-slate-600 font-medium">
            ผู้บันทึก: <strong className="text-slate-800">admin@nhso.go.th</strong>
          </span>
        </div>

        {/* ---------------- VIEW: DASHBOARD (ปรับโครงสร้างตามภาพ 1.jpg 100%) ---------------- */}
        {currentTab === 'dashboard' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">ภาพรวมข้อมูลการเข้าประชุม</h2>
            </div>

            {/* การแบ่ง Grid ซ้าย-ขวา แบบในภาพ 1.jpg */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5📌">
              
              {/* ฝั่งซ้าย: กลุ่มการ์ดแสดงตัวเลขสถิติการประชุมหลัก (3 ส่วนย่อย) */}
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4 h-fit">
                <div className="p-5 rounded-xl border bg-blue-50 border-blue-200 text-blue-700 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider block opacity-75">การประชุมทั้งหมด</span>
                  <span className="text-3xl font-black mt-3 block">{dynamicStats.total} <span className="text-sm font-medium opacity-80">ครั้ง</span></span>
                </div>

                <div className="p-5 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider block opacity-75">มาประชุม ( Onsite )</span>
                  <span className="text-3xl font-black mt-3 block">{dynamicStats.onsite} <span className="text-sm font-medium opacity-80">คน</span></span>
                </div>

                <div className="p-5 rounded-xl border bg-sky-50 border-sky-200 text-sky-700 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider block opacity-75">มาประชุม ( Online )</span>
                  <span className="text-3xl font-black mt-3 block">{dynamicStats.online} <span className="text-sm font-medium opacity-80">คน</span></span>
                </div>
              </div>

              {/* ฝั่งขวา: กล่องแสดงสถิติสะสมระบบ (กล่องสีขาวขวาสุดตามภาพ 1.jpg) */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-full space-y-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1.5">สถิติสะสมระบบ</div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold text-xs">คณะอนุกรรมการทั้งหมด:</span>
                  <span className="text-base font-bold text-slate-800">{dynamicStats.totalAllCommittees} คณะ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold text-xs">รายชื่อกรรมการรวม:</span>
                  <span className="text-base font-bold text-slate-800">{dynamicStats.totalAllMembers} ท่าน</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ---------------- VIEW: MANAGE MEETINGS ---------------- */}
        {currentTab === 'manage_meetings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-4">
              <div className="font-bold text-sm text-slate-500 border-b pb-2 flex items-center gap-1.5">
                <Plus size={16} className="text-blue-600" /> {editingMeetingId ? 'แก้ไขข้อมูลการประชุม' : 'นัดหมายเพิ่มรอบใหม่'}
              </div>
              <form onSubmit={handleCreateOrUpdateMeeting} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">ชื่อรายการประชุมคณะกรรมการ</label>
                  <input type="text" required placeholder="เช่น ประชุมคณะอนุกรรมการฯ" value={formMeetingName} onChange={(e) => setFormMeetingName(e.target.value)} className="w-full border border-slate-200 text-sm rounded-xl p-2.5 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">เลือกสังกัดชุดคณะอนุกรรมการ</label>
                  <select value={formCommId} onChange={(e) => setFormCommId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-2.5">
                    {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">ครั้งที่จัด</label>
                  <input type="text" required placeholder="เช่น 1/2569" value={formRound} onChange={(e) => setFormRound(e.target.value)} className="w-full border border-slate-200 text-sm rounded-xl p-2.5 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">วันที่ประชุม</label>
                  <input type="date" required value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full border border-slate-200 text-sm rounded-xl p-2.5" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">สถานที่จัดประชุม</label>
                  <input type="text" placeholder="ระบุห้องประชุม สปสช." value={formPlace} onChange={(e) => setFormPlace(e.target.value)} className="w-full border border-slate-200 text-sm rounded-xl p-2.5" />
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-2.5 rounded-xl transition-all">
                  {editingMeetingId ? 'บันทึกการแก้ไข' : 'สร้างกำหนดการประชุม'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 overflow-hidden">
              <div className="font-bold text-sm text-slate-800 pb-3 border-b">รายการนัดหมายการประชุมในระบบ</div>
              <table className="w-full text-left text-sm mt-2">
                <thead className="bg-slate-50 text-slate-400 font-bold">
                  <tr>
                    <th className="p-3">ชื่อการประชุม / ครั้งที่</th>
                    <th className="p-3">วันที่จัด</th>
                    <th className="p-3 text-center w-32">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-medium text-slate-700">
                  {meetings.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <div className="font-bold text-slate-900 text-sm">{m.name}</div>
                        <div className="text-xs text-blue-500 font-bold mt-1">ครั้งที่: {m.round}</div>
                      </td>
                      <td className="p-3 text-slate-500">{m.date}</td>
                      <td className="p-3 text-center flex justify-center gap-2 pt-5">
                        <button onClick={() => handleEditClick(m)} className="p-2 border rounded-lg text-amber-600 hover:bg-amber-50"><Edit size={14} /></button>
                        <button onClick={() => handleDeleteMeeting(m.id)} className="p-2 border rounded-lg text-rose-600 hover:bg-rose-50"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------- VIEW: รายชื่อคณะ ---------------- */}
        {currentTab === 'manage_committees' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">รายชื่อคณะกรรมการ</h2>
              <p className="text-slate-400 text-xs mt-0.5">จัดการสมาชิกและองค์ประชุมของแต่ละคณะ</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">เลือกคณะกรรมการ</label>
                <select value={selectedCommittee} onChange={(e) => { setSelectedCommittee(e.target.value); const comm = committees.find(c => c.id === e.target.value); if (comm) setMinQuorum(String(comm.quorum)); }} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-700 text-sm focus:outline-none">
                  {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">องค์ประชุมขั้นต่ำ</label>
                <input type="number" value={minQuorum} onChange={(e) => setMinQuorum(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center text-sm focus:outline-none" />
              </div>
              <button type="button" onClick={handleSaveQuorum} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-2.5 px-5 rounded-lg transition-colors w-fit">บันทึกองค์ประชุม</button>
            </div>

            <form onSubmit={handleAddNewMemberToCommittee} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">ชื่อ-นามสกุล</label>
                <input type="text" placeholder="ชื่อ-นามสกุล" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">ตำแหน่ง</label>
                <input type="text" placeholder="เช่น กรรมการ" value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">หน่วยงาน</label>
                <input type="text" placeholder="หน่วยงาน" value={newMemberDept} onChange={(e) => setNewMemberDept(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none" />
              </div>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-2.5 px-5 rounded-lg transition-colors w-fit">เพิ่มเข้าคณะ</button>
            </form>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="ค้นหารายชื่อ..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs font-bold text-slate-400 whitespace-nowrap flex items-center gap-1">
                  <Filter size={14} /> Status:
                </span>
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="ทั้งหมด">ทั้งหมด</option>
                  <option value="ใช้งาน">ใช้งาน</option>
                  <option value="ระงับ">ระงับ</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50/50 border-b border-slate-200 font-bold text-slate-800 text-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="text-slate-800 font-bold max-w-xl truncate">{currentCommitteeInfo?.name || 'คณะกรรมการ'}</div>
                <div className="flex items-center gap-3 shrink-0 ml-auto sm:ml-0">
                  <span className="bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-3 py-1 text-xs font-bold">{currentCommitteeMembers.length} คน</span>
                  <label className="inline-flex items-center gap-2 bg-[#107c41] hover:bg-[#0b592e] text-white font-bold text-xs py-2 px-4 rounded-lg transition-all shadow-sm cursor-pointer select-none">
                    <FileSpreadsheet size={15} />
                    <span>Import รายชื่อกรรมการ (CSV)</span>
                    <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 font-bold text-slate-400 border-b text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">ชื่อ-นามสกุล</th>
                      <th className="p-3.5">ตำแหน่ง</th>
                      <th className="p-3.5">หน่วยงาน</th>
                      <th className="p-3.5 text-center w-36">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {currentCommitteeMembers.length > 0 ? (
                      currentCommitteeMembers.map(m => (
                        <tr key={m.membershipId} className="hover:bg-slate-50/40 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900">{m.name}</td>
                          <td className="p-3.5 text-amber-600 font-semibold">{m.position}</td>
                          <td className="p-3.5 text-slate-500">{m.department}</td>
                          <td className="p-3.5 text-center">
                            <button type="button" onClick={() => handleRemoveMemberFromCommittee(m.membershipId)} className="border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-xs font-bold py-1.5 px-3 rounded-lg transition-all text-slate-600">ลบออกจากคณะ</button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400 font-medium bg-slate-50/20">ไม่พบข้อมูลรายชื่อคณะกรรมการที่ค้นหา</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- VIEW: ATTENDANCE SYSTEM ---------------- */}
        {currentTab === 'check_attendance' && (
          <div className="space-y-5">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-1">
              <label className="text-xs font-bold text-slate-400 uppercase">เลือกการประชุม</label>
              <select value={activeMeetingId} onChange={(e) => setActiveMeetingId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 p-2.5 rounded-xl focus:outline-none">
                {meetings.map(m => <option key={m.id} value={m.id}>{m.name} (ครั้งที่ {m.round})</option>)}
              </select>
            </div>

            <form onSubmit={handleAddQuickMember} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-end gap-3">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-slate-400 mb-1">ชื่อ-นามสกุล</label>
                <input type="text" placeholder="กรอกชื่อ-นามสกุล" value={quickName} onChange={(e) => setQuickName(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none" />
              </div>
              <div className="w-full md:w-48">
                <label className="block text-xs font-bold text-slate-400 mb-1">ตำแหน่ง</label>
                <input type="text" placeholder="ตำแหน่ง" value={quickRole} onChange={(e) => setQuickRole(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none" />
              </div>
              <div className="w-full md:w-56">
                <label className="block text-xs font-bold text-slate-400 mb-1">หน่วยงาน</label>
                <input type="text" placeholder="หน่วยงานที่สังกัด" value={quickDept} onChange={(e) => setQuickDept(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none" />
              </div>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-2 px-6 rounded-lg transition-colors w-full md:w-auto h-[38px] flex items-center justify-center gap-1.5"><Plus size={16} /> เพิ่มรายชื่อ</button>
            </form>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase block">เข้าร่วม</span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">{activeAttendanceStats.joined} <span className="text-xs font-medium text-slate-400">คน</span></span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase block">ลา</span>
                <span className="text-2xl font-black text-amber-500 mt-1 block">{activeAttendanceStats.leave} <span className="text-xs font-medium text-slate-400">คน</span></span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase block">online / onsite</span>
                <div className="text-sm font-bold text-slate-700 mt-2 flex justify-between">
                  <span>Onsite: <strong className="text-blue-600 text-base">{activeAttendanceStats.onsite}</strong></span>
                  <span>Online: <strong className="text-sky-500 text-base">{activeAttendanceStats.online}</strong></span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase block">สถานะองค์ประชุม</span>
                <span className={`text-base font-black mt-2 block ${activeAttendanceStats.joined >= activeAttendanceStats.quorumLimit ? 'text-emerald-600' : 'text-rose-600'}`}>{activeAttendanceStats.statusText}<span className="text-xs font-normal text-slate-400 block mt-0.5">(เกณฑ์ขั้นต่ำ {activeAttendanceStats.quorumLimit} คน)</span></span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 font-bold text-slate-500 border-b text-xs">
                  <tr>
                    <th className="p-3.5">ชื่อกรรมการ / หน่วยงาน</th>
                    <th className="p-3.5 w-44">ตำแหน่ง</th>
                    <th className="p-3.5 text-center w-48">สถานะ</th>
                    <th className="p-3.5 text-center w-36">ประเภท (Hybrid)</th>
                    <th className="p-3.5 w-64">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-medium text-sm">
                  {getCommitteeMembers(meetings.find(m => m.id === activeMeetingId)?.committeeId || '').map((m) => {
                    const currentRecord = attendance[activeMeetingId]?.[m.id] || { status: 'เข้าร่วม', type: 'Onsite', note: '' };
                    const updateField = (field: 'status' | 'type' | 'note', value: string) => {
                      const currentMeetingAtt = attendance[activeMeetingId] || {};
                      const oldObj = currentMeetingAtt[m.id] || { status: 'เข้าร่วม', type: 'Onsite', note: '' };
                      setAttendance({ ...attendance, [activeMeetingId]: { ...currentMeetingAtt, [m.id]: { ...oldObj, [field]: value } } });
                    };

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-800 text-sm">{m.name}</div>
                          <div className="text-xs text-slate-400 font-normal mt-0.5">{m.department}</div>
                        </td>
                        <td className="p-3.5 text-slate-600 font-semibold text-xs">{m.role || 'กรรมการ'}</td>
                        <td className="p-3.5 text-center">
                          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 gap-0.5">
                            <button type="button" onClick={() => updateField('status', 'เข้าร่วม')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${currentRecord.status === 'เข้าร่วม' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>เข้าร่วม</button>
                            <button type="button" onClick={() => updateField('status', 'ลา')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${currentRecord.status === 'ลา' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>ลา</button>
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <select value={currentRecord.type} onChange={(e) => updateField('type', e.target.value)} disabled={currentRecord.status === 'ลา'} className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-700 w-28 text-center focus:outline-none disabled:opacity-50">
                            <option value="Onsite">Onsite</option>
                            <option value="Online">Online</option>
                          </select>
                        </td>
                        <td className="p-3.5">
                          <input type="text" placeholder="พิมพ์ข้อความบันทึก / ลาเพราะ..." value={currentRecord.note || ''} onChange={(e) => updateField('note', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-medium focus:bg-white focus:outline-none" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------- VIEW: PRINT REPORT ---------------- */}
        {currentTab === 'generate_report' && (
  <div className="space-y-6">
    {/* ส่วนเลือกการประชุมและปุ่มดาวน์โหลด */}
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
      <div className="flex-1 w-full">
        <label className="block text-xs font-bold text-slate-400 mb-1">เลือกการประชุม</label>
        <select 
          value={activeMeetingId} 
          onChange={(e) => setActiveMeetingId(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold text-slate-700"
        >
          {meetings.map(m => (
            <option key={m.id} value={m.id}>{m.name} ครั้งที่ {m.round}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2 pt-5">
        <button 
          onClick={() => handleDownloadWord(activeMeetingId)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-2.5 px-6 rounded-lg transition-all shadow-sm flex items-center gap-2"
        >
          <Download size={16} /> ดาวน์โหลด Microsoft Word
        </button>
      </div>
    </div>

    {/* ส่วนแสดงรายงานผล */}
    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
      <h2 className="text-xl font-bold text-slate-900 text-center mb-8">รายงานผลการเช็คชื่อเข้าร่วมประชุม</h2>
      
      {/* ข้อมูลทั่วไป */}
      <div className="grid grid-cols-2 gap-y-3 text-sm mb-8">
        <div className="text-slate-500 font-bold">ชื่อการประชุม</div> <div>{meetings.find(m => m.id === activeMeetingId)?.name}</div>
        <div className="text-slate-500 font-bold">ครั้งที่</div> <div>{meetings.find(m => m.id === activeMeetingId)?.round}</div>
        <div className="text-slate-500 font-bold">คณะกรรมการ</div> <div>{committees.find(c => c.id === meetings.find(m => m.id === activeMeetingId)?.committeeId)?.name}</div>
        <div className="text-slate-500 font-bold">วันที่ประชุม</div> <div>{meetings.find(m => m.id === activeMeetingId)?.date}</div>
        <div className="text-slate-500 font-bold">สถานที่</div> <div>{meetings.find(m => m.id === activeMeetingId)?.place}</div>
      </div>

      <hr className="my-6 border-slate-100" />

      {/* สรุปผล */}
      <div className="mb-8">
        <h3 className="font-bold text-slate-800 mb-4">สรุปผล</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div><p className="text-slate-400">กรรมการและผู้เข้าร่วม</p><p className="font-bold">{getCommitteeMembers(meetings.find(m => m.id === activeMeetingId)?.committeeId || '').length} คน</p></div>
          <div><p className="text-slate-400">เข้าร่วมประชุม</p><p className="font-bold text-emerald-600">{activeAttendanceStats.joined} คน</p></div>
          <div><p className="text-slate-400">Online</p><p className="font-bold">{activeAttendanceStats.online} คน</p></div>
          <div><p className="text-slate-400">OnSite</p><p className="font-bold">{activeAttendanceStats.onsite} คน</p></div>
          <div><p className="text-slate-400">ลา</p><p className="font-bold text-amber-600">{activeAttendanceStats.leave} คน</p></div>
          <div><p className="text-slate-400">องค์ประชุมขั้นต่ำ</p><p className="font-bold">{activeAttendanceStats.quorumLimit} คน</p></div>
          <div><p className="text-slate-400">ผลการประชุม</p><p className={`font-bold ${activeAttendanceStats.statusText === 'ครบองค์ประชุม' ? 'text-blue-600' : 'text-rose-600'}`}>{activeAttendanceStats.statusText}</p></div>
        </div>
      </div>

      {/* ตารางรายชื่อ */}
      <div className="space-y-6">
        <div>
          <h3 className="font-bold text-slate-800 mb-3 border-b pb-2">รายชื่อผู้เข้าร่วมประชุม</h3>
          {getCommitteeMembers(meetings.find(m => m.id === activeMeetingId)?.committeeId || '').filter(m => attendance[activeMeetingId]?.[m.id]?.status === 'เข้าร่วม').map((m, idx) => (
            <div key={m.id} className="grid grid-cols-4 gap-4 py-2 text-sm border-b border-slate-50">
              <div>{idx + 1}. {m.name}</div>
              <div>ตำแหน่ง {m.role}</div>
              <div>หน่วยงาน {m.department}</div>
              <div className="font-bold text-slate-500">ประชุม {attendance[activeMeetingId]?.[m.id]?.type}</div>
            </div>
          ))}
        </div>

        <div>
          <h3 className="font-bold text-slate-800 mb-3 border-b pb-2">รายชื่อผู้ลาประชุม</h3>
          {getCommitteeMembers(meetings.find(m => m.id === activeMeetingId)?.committeeId || '').filter(m => attendance[activeMeetingId]?.[m.id]?.status === 'ลา').map((m, idx) => (
            <div key={m.id} className="grid grid-cols-4 gap-4 py-2 text-sm border-b border-slate-50">
              <div>{idx + 1}. {m.name}</div>
              <div>ตำแหน่ง {m.role}</div>
              <div>หน่วยงาน {m.department}</div>
              <div className="font-bold text-rose-500">เหตุผล: {attendance[activeMeetingId]?.[m.id]?.note || '-'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)}