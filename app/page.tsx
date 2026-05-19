"use client";
import { useState, useMemo } from 'react';
import { 
  Home, Calendar, Users, CheckSquare, FileText,
  Plus, Edit, Trash2, Download, FileSpreadsheet
} from 'lucide-react';

// ==========================================
// 📊 ฐานข้อมูลอ้างอิงโครงสร้างไฟล์ CSV จริง สปสช. เขต 4
// ==========================================
const INITIAL_COMMITTEES = [
  { id: "C001", name: "คณะกรรมการบริหาร", quorum: 5 },
  { id: "C002", name: "คณะกรรมการตรวจสอบ", quorum: 5 },
  { id: "C003", name: "คณะกรรมการพัฒนา", quorum: 5 }
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

const INITIAL_ATTENDANCE: Record<string, Record<string, { status: string; type: string; reason?: string; personType: string; name?: string; role?: string; dept?: string }>> = {
  "MT001": {
    "M001": { status: "มาประชุม", type: "onsite", personType: "member" },
    "M002": { status: "มาประชุม", type: "online", personType: "member" },
    "M003": { status: "ลา", type: "-", reason: "ติดภารกิจเร่งด่วน", personType: "member" }
  }
};

export default function App() {
  // --- UI Views & Control State ---
  const [currentTab, setCurrentTab] = useState<string>('manage_committees');
  
  // --- Database States ---
  const [committees, setCommittees] = useState(INITIAL_COMMITTEES);
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [memberships, setMemberships] = useState(INITIAL_MEMBERSHIPS);
  const [meetings, setMeetings] = useState(INITIAL_MEETINGS);
  const [attendance, setAttendance] = useState(INITIAL_ATTENDANCE);

  // --- Filtering & Active Selectors ---
  const [fiscalYear, setFiscalYear] = useState<string>('2569');
  const [selectedCommittee, setSelectedCommittee] = useState<string>('C001');
  const [activeMeetingId, setActiveMeetingId] = useState<string>('MT001');

  // --- หน้ารายชื่อคณะกรรมการ Form States ---
  const [minQuorum, setMinQuorum] = useState<string>('5');
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [newMemberRole, setNewMemberRole] = useState<string>('');
  const [newMemberDept, setNewMemberDept] = useState<string>('');
  const [selectedExistingMemberId, setSelectedExistingMemberId] = useState<string>('M004');

  // --- Form States สำหรับเพิ่ม/แก้ไขการประชุม ---
  const [formMeetingName, setFormMeetingName] = useState('');
  const [formRound, setFormRound] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formPlace, setFormPlace] = useState('');
  const [formCommId, setFormCommId] = useState('C001');
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);

  // ==========================================
  // ⚡ ฟังก์ชันดาวน์โหลดไฟล์ Word จริงจากข้อมูลในระบบ
  // ==========================================
  const handleDownloadWord = (meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return alert("ไม่พบข้อมูลการประชุม");

    const commName = committees.find(c => c.id === meeting.committeeId)?.name || "";
    const attRecords = attendance[meetingId] || {};

    // แยกรายชื่อสถานะผู้เข้าประชุม
    const attendList: string[] = [];
    const leaveList: string[] = [];
    const absentList: string[] = [];

    // ดึงรายชื่อกรรมการในคณะนั้น ๆ
    const commMembers = getCommitteeMembers(meeting.committeeId);
    commMembers.forEach(m => {
      const record = attRecords[m.id];
      if (record) {
        if (record.status === "มาประชุม") {
          attendList.push(`${m.name} (${record.type})`);
        } else if (record.status === "ลา") {
          leaveList.push(`${m.name} ${record.reason ? `(ลา: ${record.reason})` : '(ลา)'}`);
        } else {
          absentList.push(m.name);
        }
      } else {
        absentList.push(m.name); // ค่าเริ่มต้นถ้าไม่ได้ลงบันทึกคือขาดประชุม
      }
    });

    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>รายงานการบันทึกเข้าร่วมประชุม</title></head>
      <body style='font-family: "TH Sarabun New", "Arial", sans-serif; font-size: 16pt; line-height: 1.5;'>
        <div style='text-align: center; font-weight: bold; font-size: 18pt;'>รายงานผลการลงทะเบียนเข้าร่วมประชุม</div>
        <div style='text-align: center; font-weight: bold;'>คณะอนุกรรมการหลักประกันสุขภาพแห่งชาติ เขต 4 สระบุรี</div>
        <br/>
        <p><b>ชื่อการประชุม:</b> ${meeting.name}</p>
        <p><b>สังกัดคณะ:</b> ${commName}</p>
        <p><b>ครั้งที่ประชุม:</b> ${meeting.round} | <b>ปีงบประมาณ:</b> ${meeting.fiscalYear}</p>
        <p><b>วันที่ประชุม:</b> ${meeting.date} | <b>สถานที่:</b> ${meeting.place}</p>
        <p><b>ผู้บันทึกระบบ:</b> ${meeting.recorder}</p>
        <hr/>
        
        <h3>1. รายชื่อผู้มาประชุม (จำนวน ${attendList.length} ท่าน)</h3>
        <ol>${attendList.map(name => `<li>${name}</li>`).join('')}</ol>
        
        <h3>2. รายชื่อผู้ลาประชุม (จำนวน ${leaveList.length} ท่าน)</h3>
        <ol>${leaveList.map(name => `<li>${name}</li>`).join('')}</ol>

        <h3>3. รายชื่อผู้ขาดประชุม (จำนวน ${absentList.length} ท่าน)</h3>
        <ol>${absentList.map(name => `<li>${name}</li>`).join('')}</ol>
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

  // --- คำนวณรายชื่อคณะกรรมการชุดปัจจุบัน ---
  const currentCommitteeMembers = useMemo(() => {
    const rels = memberships.filter(ms => ms.committeeId === selectedCommittee);
    return rels.map(r => {
      const info = members.find(m => m.id === r.memberId);
      return {
        membershipId: r.id,
        memberId: r.memberId,
        name: info?.name || "ไม่ทราบชื่อ",
        position: r.role || info?.position || "กรรมการ",
        department: info?.department || "-"
      };
    });
  }, [memberships, selectedCommittee, members]);

  const currentCommitteeInfo = useMemo(() => {
    return committees.find(c => c.id === selectedCommittee);
  }, [committees, selectedCommittee]);

  // --- Actions สำหรับหน้ารายชื่อคณะกรรมการ ---
  const handleSaveQuorum = () => {
    setCommittees(prev => prev.map(c => c.id === selectedCommittee ? { ...c, quorum: Number(minQuorum) } : c));
    alert("บันทึกองค์ประชุมขั้นต่ำเรียบร้อยแล้ว");
  };

  const handleAddNewMemberToCommittee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return alert("กรุณากรอกชื่อ-นามสกุล");
    const newId = `M${String(members.length + 1).padStart(3, '0')}`;
    const newMemberObj = {
      id: newId,
      name: newMemberName,
      position: newMemberRole || "กรรมการ",
      department: newMemberDept || "สำนักงานใหญ่",
      status: "ใช้งาน"
    };
    const newMembershipObj = {
      id: `MS${String(memberships.length + 1).padStart(3, '0')}`,
      memberId: newId,
      committeeId: selectedCommittee,
      role: newMemberRole || "กรรมการ"
    };

    setMembers([...members, newMemberObj]);
    setMemberships([...memberships, newMembershipObj]);
    
    setNewMemberName('');
    setNewMemberRole('');
    setNewMemberDept('');
    alert("เพิ่มรายชื่อเข้าคณะกรรมการสำเร็จ");
  };

  const handleAddExistingMemberToCommittee = () => {
    const alreadyInComm = memberships.some(ms => ms.committeeId === selectedCommittee && ms.memberId === selectedExistingMemberId);
    if (alreadyInComm) return alert("บุคคลนี้อยู่ในคณะกรรมการชุดนี้อยู่แล้ว");

    const targetMember = members.find(m => m.id === selectedExistingMemberId);
    const newMembershipObj = {
      id: `MS${String(memberships.length + 1).padStart(3, '0')}`,
      memberId: selectedExistingMemberId,
      committeeId: selectedCommittee,
      role: targetMember?.position || "กรรมการ"
    };

    setMemberships([...memberships, newMembershipObj]);
    alert("เพิ่มจากรายชื่อเดิมเข้าสู่คณะนี้สำเร็จ");
  };

  const handleRemoveMemberFromCommittee = (mId: string) => {
    setMemberships(prev => prev.filter(ms => ms.id !== mId));
    alert("ลบออกจากคณะเรียบร้อยแล้ว");
  };

  const handleImportCSVFake = () => {
    const fakeImported = [
      { id: `M_IMP1`, name: "นายสมศักดิ์ รักชาติ", position: "กรรมการ", department: "ฝ่ายยุทธศาสตร์" },
      { id: `M_IMP2`, name: "นางสาวทิพย์วรรณ มีแก้ว", position: "ผู้ทรงคุณวุฒิ", department: "หน่วยงานภายนอก" }
    ];
    const newMembers = [...members];
    const newMemberships = [...memberships];

    fakeImported.forEach((item, idx) => {
      newMembers.push({ ...item, status: "ใช้งาน" });
      newMemberships.push({
        id: `MS_IMP_${Date.now()}_${idx}`,
        memberId: item.id,
        committeeId: selectedCommittee,
        role: item.position
      });
    });
    setMembers(newMembers);
    setMemberships(newMemberships);
    alert("ระบบจำลอง: Import รายชื่อจากไฟล์ CSV เข้าสู่คณะนี้สำเร็จเรียบร้อยแล้ว!");
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

  // --- Actions สำหรับจัดการประชุม (เพิ่ม / แก้ไข / ลบ) ---
  const handleCreateOrUpdateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRound || !formDate || !formMeetingName.trim()) return alert("กรุณากรอกข้อมูลให้ครบถ้วน");

    if (editingMeetingId) {
      // โหมดแก้ไขข้อมูลประชุม
      setMeetings(prev => prev.map(m => m.id === editingMeetingId ? {
        ...m,
        committeeId: formCommId,
        name: formMeetingName,
        round: formRound,
        date: formDate,
        place: formPlace || "ห้องประชุม สปสช. เขต 4"
      } : m));
      alert("แก้ไขข้อมูลการประชุมเรียบร้อยแล้ว");
      setEditingMeetingId(null);
    } else {
      // โหมดเพิ่มรอบประชุมใหม่
      const nextId = `MT${String(meetings.length + 1).padStart(3, '0')}`;
      const newMeeting = {
        id: nextId,
        committeeId: formCommId,
        name: formMeetingName,
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
      alert(`สร้างกำหนดการรหัส ${nextId} สำเร็จ`);
      setCurrentTab('check_attendance');
    }

    // ล้างค่าฟอร์มการประชุม
    setFormMeetingName('');
    setFormRound('');
    setFormDate('');
    setFormPlace('');
  };

  const handleEditClick = (meeting: any) => {
    setEditingMeetingId(meeting.id);
    setFormCommId(meeting.committeeId);
    setFormMeetingName(meeting.name);
    setFormRound(meeting.round);
    setFormDate(meeting.date);
    setFormPlace(meeting.place);
  };

  const handleDeleteMeeting = (meetingId: string) => {
    if (confirm("คุณต้องการลบรายการประชุมนี้ใช่หรือไม่?")) {
      setMeetings(prev => prev.filter(m => m.id !== meetingId));
      alert("ลบข้อมูลการประชุมเรียบร้อย");
    }
  };

  //คำนวณสถิติ
  const dynamicStats = useMemo(() => {
    let filtered = meetings.filter(m => m.fiscalYear === fiscalYear);
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
  }, [meetings, attendance, fiscalYear]);

  return (
    <div className="flex min-h-screen bg-[#f4f6f8] text-slate-800 antialiased font-sans text-xs">
      
      {/* 🏙️ SIDEBAR DESIGN */}
      <aside className="w-60 bg-[#0f172a] text-slate-200 flex flex-col fixed h-full z-20 shadow-xl">
        <div className="p-4 bg-[#1e293b] border-b border-slate-800 flex items-center gap-2">
          <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center font-bold text-[#0f172a] text-xs">nn</div>
          <div>
            <div className="text-xs font-bold text-slate-100 tracking-tight">ระบบลงทะเบียนเข้าร่วมประชุม</div>
            <div className="text-[10px] text-blue-400 font-semibold tracking-wider">คณะอนุกรรมการ เขต 4 สระบุรี</div>
          </div>
        </div>
        
        <nav className="flex-1 p-2 space-y-0.5">
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
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs font-medium transition-all ${
                  isActive 
                ? 'bg-blue-600/10 text-blue-400 font-bold border-l-4 border-blue-500 rounded-l-none' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="p-4 text-[10px] text-slate-600 font-medium bg-[#090d16] border-t border-slate-900 leading-relaxed">
          ระบบสารสนเทศติดตามงบและรายงานองค์ประชุม สปสช. เขต 4 สระบุรี
        </div>
      </aside>

      {/* 📦 MAIN CONTENT */}
      <div className="flex-1 ml-60 p-6 min-h-screen bg-[#f8fafc]">
        
        {/* TOP USER STATE BAR */}
        <div className="flex justify-end items-center mb-4 text-slate-500 font-medium">
          <span className="bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-[10px] text-slate-600">
            ผู้บันทึก: <strong className="text-slate-800">admin@nhso.go.th</strong>
          </span>
        </div>

        {/* ---------------- VIEW: DASHBOARD ---------------- */}
        {currentTab === 'dashboard' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">ภาพรวมข้อมูลการเข้าประชุม</h2>
              <p className="text-slate-400 text-[11px] mt-0.5">สรุปสถิติจำนวนครั้งและจำนวนผู้มาประชุมของระบบงวดปัจจุบัน</p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'การประชุมทั้งหมด', val: `${dynamicStats.total} ครั้ง`, color: 'bg-blue-50 border-blue-200 text-blue-700' },
                { label: 'มาประชุม ( onsite )', val: `${dynamicStats.onsite} คน`, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                { label: 'มาประชุม ( online )', val: `${dynamicStats.online} คน`, color: 'bg-sky-50 border-sky-200 text-sky-700' },
                { label: 'ลาประชุม', val: `${dynamicStats.leave} คน`, color: 'bg-amber-50 border-amber-200 text-amber-700' },
                { label: 'ขาดประชุม', val: `${dynamicStats.absent} คน`, color: 'bg-rose-50 border-rose-200 text-rose-700' },
              ].map((card, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${card.color} shadow-sm`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">{card.label}</span>
                  <span className="text-lg font-black mt-2 block tracking-tight">{card.val}</span>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 text-slate-400 text-center">
              เลือกดูระบบงานที่แถบเมนูด้านซ้ายเพื่อเริ่มต้นจัดการกระบวนการประชุม
            </div>
          </div>
        )}

        {/* ---------------- VIEW: MANAGE MEETINGS (ปรับเพิ่ม ครั้งที่พิมพ์เพิ่มได้ + แก้ไขและลบ) ---------------- */}
        {currentTab === 'manage_meetings' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ฟอร์มสร้าง/แก้ไขกำหนดการ */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit space-y-4">
              <div className="font-bold text-xs uppercase text-slate-400 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <Plus size={14} className="text-blue-600" /> {editingMeetingId ? 'แก้ไขข้อมูลการประชุม' : 'นัดหมายเพิ่มรอบใหม่'}
              </div>
              <form onSubmit={handleCreateOrUpdateMeeting} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">ชื่อรายการประชุมคณะกรรมการ</label>
                  <input type="text" required placeholder="เช่น ประชุมคณะกรรมการบริหาร คณะอนุกรรมการฯ" value={formMeetingName} onChange={(e) => setFormMeetingName(e.target.value)} className="w-full border border-slate-200 text-xs rounded-xl p-2 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">เลือกสังกัดชุดคณะอนุกรรมการ</label>
                  <select value={formCommId} onChange={(e) => setFormCommId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-2.5 bg-white">
                    {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">ครั้งที่จัด (สามารถพิมพ์เพิ่ม/ระบุเองได้)</label>
                  <input type="text" required placeholder="เช่น 1/2569 หรือ พิเศษ 2" value={formRound} onChange={(e) => setFormRound(e.target.value)} className="w-full border border-slate-200 text-xs rounded-xl p-2 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">วันที่ประชุม</label>
                  <input type="date" required value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full border border-slate-200 text-xs rounded-xl p-2" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">สถานที่จัดประชุม</label>
                  <input type="text" placeholder="ระบุห้องประชุม หรือ ลิงก์ระบบซูม" value={formPlace} onChange={(e) => setFormPlace(e.target.value)} className="w-full border border-slate-200 text-xs rounded-xl p-2" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all">
                    {editingMeetingId ? 'บันทึกการแก้ไข' : 'สร้างกำหนดการประชุม'}
                  </button>
                  {editingMeetingId && (
                    <button type="button" onClick={() => { setEditingMeetingId(null); setFormMeetingName(''); setFormRound(''); setFormDate(''); setFormPlace(''); }} className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs py-2.5 rounded-xl px-4">
                      ยกเลิก
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* ตารางรายการประชุมทั้งหมดพร้อมปุ่มแก้ไขและลบ */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 overflow-hidden">
              <div className="font-bold text-xs text-slate-800 pb-3 border-b">รายการนัดหมายการประชุมในระบบ</div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs mt-2">
                  <thead className="bg-slate-50 border-b text-slate-400 font-bold">
                    <tr>
                      <th className="p-2.5">ชื่อการประชุม / ครั้งที่</th>
                      <th className="p-2.5">วันที่จัด</th>
                      <th className="p-2.5 text-center w-28">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium text-slate-700">
                    {meetings.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        <td className="p-2.5">
                          <div className="font-bold text-slate-900">{m.name}</div>
                          <div className="text-[10px] text-blue-500 font-bold mt-0.5">ครั้งที่: {m.round}</div>
                        </td>
                        <td className="p-2.5 text-slate-500">{m.date}</td>
                        <td className="p-2.5 text-center flex items-center justify-center gap-1.5 pt-4">
                          <button onClick={() => handleEditClick(m)} className="p-1.5 border rounded-lg hover:bg-amber-50 text-amber-600 transition-colors" title="แก้ไข">
                            <Edit size={13} />
                          </button>
                          <button onClick={() => handleDeleteMeeting(m.id)} className="p-1.5 border rounded-lg hover:bg-rose-50 text-rose-600 transition-colors" title="ลบ">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {meetings.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center p-4 text-slate-400">ไม่มีข้อมูลการประชุมในระบบ</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- VIEW: รายชื่อคณะ (ตามโครงสร้างรหัสเดิม) ---------------- */}
        {currentTab === 'manage_committees' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">แก้ไขรายชื่อคณะกรรมการ</h2>
              <p className="text-slate-400 text-[11px] mt-0.5">จัดการสมาชิกและองค์ประชุมของแต่ละคณะ</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">เลือกคณะกรรมการ</label>
                <select value={selectedCommittee} onChange={(e) => { setSelectedCommittee(e.target.value); const comm = committees.find(c => c.id === e.target.value); if (comm) setMinQuorum(String(comm.quorum)); }} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-700 focus:outline-none">
                  {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">องค์ประชุมขั้นต่ำ</label>
                <input type="number" value={minQuorum} onChange={(e) => setMinQuorum(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold text-slate-700 text-center focus:outline-none" />
              </div>
              <button type="button" onClick={handleSaveQuorum} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-lg transition-colors w-fit">บันทึกองค์ประชุม</button>
            </div>

            <form onSubmit={handleAddNewMemberToCommittee} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">ชื่อ-นามสกุล</label>
                <input type="text" placeholder="ชื่อ-นามสกุล" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">ตำแหน่ง</label>
                <input type="text" placeholder="เช่น กรรมการ, เลขานุการ" value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">หน่วยงาน</label>
                <input type="text" placeholder="หน่วยงาน" value={newMemberDept} onChange={(e) => setNewMemberDept(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-blue-500" />
              </div>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-lg transition-colors w-fit">เพิ่มเข้าคณะ</button>
            </form>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Import รายชื่อเข้าคณะนี้ (.csv)</label>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => document.getElementById('csv-file')?.click()} className="border border-slate-300 rounded-lg bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 font-semibold text-xs">เลือกไฟล์</button>
                  <span className="text-slate-400 text-[11px]">ไม่ได้เลือกไฟล์ใด</span>
                  <input type="file" id="csv-file" accept=".csv" className="hidden" onChange={handleImportCSVFake} />
                </div>
              </div>
              <div className="flex gap-2 pt-4 md:pt-0">
                <button type="button" onClick={handleImportCSVFake} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-lg transition-colors">Import รายชื่อ</button>
                <button type="button" onClick={() => alert("ดาวน์โหลดไฟล์ตัวอย่างฟอร์แมต CSV เรียบร้อย")} className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs py-2 px-3 rounded-lg transition-colors">ดาวน์โหลดไฟล์ตัวอย่าง</button>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">รูปแบบไฟล์</label>
                <div className="bg-slate-50 border border-slate-200 text-slate-600 text-center rounded-lg p-2 font-mono font-bold tracking-tight text-[11px]">ชื่อ_นามสกุล,ตำแหน่ง,หน่วยงาน</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-3 bg-slate-50/50 border-b border-slate-200 font-bold text-slate-800 text-xs flex justify-between items-center">
                  <span>{currentCommitteeInfo?.name || 'คณะกรรมการ'}</span>
                  <span className="bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2 py-0.5 text-[10px] font-bold">{currentCommitteeMembers.length} คน</span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-bold text-slate-400 border-b border-slate-100 text-[10px] uppercase">
                    <tr>
                      <th className="p-3">ชื่อ-นามสกุล</th>
                      <th className="p-3">ตำแหน่ง</th>
                      <th className="p-3">หน่วยงาน</th>
                      <th className="p-3 text-center w-32">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {currentCommitteeMembers.map(m => (
                      <tr key={m.membershipId} className="hover:bg-slate-50/40">
                        <td className="p-3 font-bold text-slate-900">{m.name}<div className="text-[9px] text-slate-400 font-mono mt-0.5">{m.memberId}</div></td>
                        <td className="p-3 text-amber-600 font-semibold">{m.position}</td>
                        <td className="p-3 text-slate-500">{m.department}</td>
                        <td className="p-3 text-center">
                          <button type="button" onClick={() => handleRemoveMemberFromCommittee(m.membershipId)} className="border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-[11px] font-bold py-1 px-2.5 rounded-lg transition-all">ลบออกจากคณะ</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm h-fit space-y-3">
                <div className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-2">เพิ่มจากรายชื่อเดิม</div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">เลือกกรรมการ</label>
                  <select value={selectedExistingMemberId} onChange={(e) => setSelectedExistingMemberId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 font-medium text-slate-700 focus:outline-none">
                    {members.map(m => <option key={m.id} value={m.id}>{m.name} - {m.position}</option>)}
                  </select>
                </div>
                <button type="button" onClick={handleAddExistingMemberToCommittee} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-lg transition-colors">เพิ่มเข้าคณะนี้</button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- VIEW: ATTENDANCE SYSTEM (ตามโครงสร้างรหัสเดิม) ---------------- */}
        {currentTab === 'check_attendance' && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase">เลือกหัวข้อการประชุมเพื่อเช็คชื่อผู้เข้าร่วม</label>
              <select value={activeMeetingId} onChange={(e) => setActiveMeetingId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 p-2.5 rounded-xl">
                {meetings.map(m => <option key={m.id} value={m.id}>{m.name} (รอบครั้งที่ {m.round})</option>)}
              </select>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-3">ชื่อ-นามสกุลอนุกรรมการ</th>
                    <th className="p-3">บทบาทหน้าที่</th>
                    <th className="p-3 text-center w-80">เลือกวิธีเช็คชื่อเข้าประชุม (Hybrid Model)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {getCommitteeMembers(meetings.find(m => m.id === activeMeetingId)?.committeeId || '').map((m) => {
                    const currentRecord = attendance[activeMeetingId]?.[m.id] || { status: 'ขาด', type: '-' };
                    const updateStatus = (st: string, tp: string) => {
                      const currentMeetingAtt = attendance[activeMeetingId] || {};
                      
                      // กรณีระบุสัญญาน "ลา" ให้ถามเหตุผลย่อยสั้น ๆ
                      let reasonStr = "";
                      if (st === "ลา") {
                        reasonStr = prompt("กรุณาระบุเหตุผลการลาประชุม:", "ติดภารกิจ") || "ติดภารกิจ";
                      }

                      setAttendance({
                        ...attendance,
                        [activeMeetingId]: { 
                          ...currentMeetingAtt, 
                          [m.id]: { status: st, type: tp, personType: 'member', reason: reasonStr } 
                        }
                      });
                    };

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-800">{m.name}<div className="text-[10px] text-slate-400 font-normal">{m.department}</div></td>
                        <td className="p-3 text-slate-500 font-semibold">{m.role || 'กรรมการ'}</td>
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
                                  className={`py-1 rounded-md font-bold text-[10px] text-center transition-all ${
                                    isSelected ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 text-slate-400 border border-slate-200'
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
          </div>
        )}

        {/* ---------------- VIEW: PRINT REPORT (ทำปุ่มให้ดาวน์โหลดไฟล์เอกสารได้จริงแล้ว) ---------------- */}
        {currentTab === 'generate_report' && (
          <div className="max-w-md mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
            <FileSpreadsheet size={36} className="text-blue-600 mx-auto bg-blue-50 p-2 rounded-xl" />
            <div>
              <h3 className="font-bold text-slate-800 text-xs">เครื่องมือส่งออกประวัติรายงานเข้าประชุม</h3>
              <p className="text-[11px] text-slate-400 mt-1">ดาวน์โหลดเอกสารสรุปผลอิงตามสถานะที่บันทึกจริงในเมนูเช็คชื่อ</p>
            </div>
            
            <div className="text-left">
              <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">เลือกรายการรอบประชุม</label>
              <select value={activeMeetingId} onChange={(e) => setActiveMeetingId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold p-2 rounded-xl">
                {meetings.map(m => <option key={m.id} value={m.id}>{m.name} (ครั้งที่ {m.round})</option>)}
              </select>
            </div>

            <button 
              onClick={() => handleDownloadWord(activeMeetingId)} 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <Download size={14} /> ดาวน์โหลดรายงาน Microsoft Word (.doc)
            </button>
          </div>
        )}

      </div>
    </div>
  );
}