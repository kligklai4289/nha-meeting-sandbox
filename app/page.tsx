"use client";
import { useState, useMemo } from 'react';
import { 
  Home, Calendar, Users, CheckSquare, FileText,
  Plus, Search, Download, Upload, Trash2, Check, RotateCcw
} from 'lucide-react';

// =========================================================
// 📑 DATA STRUCTURES (ผูกโยงตามตารางโครงสร้าง AppSheet)
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
  { id: "MT001", committeeId: "C001", name: "ประชุมคณะกรรมการบริหาร", round: "1/2569", date: "17 พ.ค. 2569", place: "ห้องประชุม 1", chair: "นางสาวสมหญิง มีสุข" },
  { id: "MT002", committeeId: "C002", name: "ประชุมคณะกรรมการตรวจสอบ", round: "1/2569", date: "18 พ.ค. 2569", place: "ห้องประชุม 2", chair: "นางมาลี รักดี" },
  { id: "MT003", committeeId: "C003", name: "ประชุมคณะกรรมการพัฒนา", round: "2/2569", date: "19 พ.ค. 2569", place: "ห้องประชุม 1", chair: "นายสมชาย ใจดี" }
];

// โครงสร้างสถานะ Attendance เริ่มต้น (ตามรูปภาพหน้า 4)
const INITIAL_ATTENDANCE: Record<string, Record<string, { status: "เข้าร่วม" | "ลา"; type: "Online" | "OnSite"; reason: string }>> = {
  "MT001": {
    "M001": { status: "เข้าร่วม", type: "Online", reason: "หมายเหตุ" },
    "M002": { status: "เข้าร่วม", type: "OnSite", reason: "หมายเหตุ" },
    "M003": { status: "ลา", type: "OnSite", reason: "ติดภารกิจ" },
    "M005": { status: "ลา", type: "OnSite", reason: "ลาประชุม" },
    "M007": { status: "เข้าร่วม", type: "OnSite", reason: "หมายเหตุ" },
  }
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('manage_committees'); // แถบแรกตามภาพคือ รายชื่อคณะ
  
  // 💾 States ฐานข้อมูล
  const [committees, setCommittees] = useState(INITIAL_COMMITTEES);
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [memberships, setMemberships] = useState(INITIAL_MEMBERSHIPS);
  const [meetings] = useState(INITIAL_MEETINGS);
  const [attendance, setAttendance] = useState(INITIAL_ATTENDANCE);

  // 🔍 คัดเลือกและคุมเงื่อนไข
  const [selectedCommittee, setSelectedCommittee] = useState<string>('C001');
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('MT001');
  const [minQuorum, setMinQuorum] = useState<number>(5);

  // ฟอร์มเพิ่มคนใหม่ (หน้า 3)
  const [addName, setAddName] = useState('');
  const [addRole, setAddRole] = useState('');
  const [addDept, setAddDept] = useState('');
  const [selectedExistingMember, setSelectedExistingMember] = useState('M004');

  // =========================================================
  // 🔄 COMPUTED PROPERTIES (ดึงและประมวลผลข้อมูลลงตาราง)
  // =========================================================
  
  // รายชื่อกรรมการที่อยู่ในคณะที่เลือกปัจจุบัน
  const currentCommitteeMembers = useMemo(() => {
    return memberships
      .filter(ms => ms.committeeId === selectedCommittee)
      .map(ms => {
        const info = members.find(m => m.id === ms.memberId);
        return {
          membershipId: ms.id,
          memberId: ms.memberId,
          name: info?.name || "ไม่ทราบชื่อ",
          position: ms.role || info?.position || "กรรมการ",
          department: info?.department || "-"
        };
      });
  }, [memberships, selectedCommittee, members]);

  // ยอดคำนวณสถิติของตารางเช็คชื่อหน้า 4
  const attendanceStats = useMemo(() => {
    const records = attendance[selectedMeetingId] || {};
    const totalMembers = Object.keys(records).length;
    let attendCount = 0;
    let leaveCount = 0;
    let onlineCount = 0;
    let onsiteCount = 0;

    Object.values(records).forEach(r => {
      if (r.status === "เข้าร่วม") {
        attendCount++;
        if (r.type === "Online") onlineCount++;
        if (r.type === "OnSite") onsiteCount++;
      } else if (r.status === "ลา") {
        leaveCount++;
      }
    });

    const currentMeeting = meetings.find(m => m.id === selectedMeetingId);
    const currentComm = committees.find(c => c.id === currentMeeting?.committeeId);
    const requiredQuorum = currentComm?.quorum || 5;
    const isQuorumComplete = attendCount >= requiredQuorum;

    return {
      total: totalMembers,
      attend: attendCount,
      leave: leaveCount,
      online: onlineCount,
      onsite: onsiteCount,
      required: requiredQuorum,
      statusText: isQuorumComplete ? "ครบองค์ประชุม" : "ยังไม่ครบ"
    };
  }, [attendance, selectedMeetingId, committees, meetings]);

  // =========================================================
  // ⚡ ACTIONS HANDLER (จัดการกิจกรรมคลิกต่าง ๆ)
  // =========================================================
  
  const handleSaveQuorum = () => {
    setCommittees(prev => prev.map(c => c.id === selectedCommittee ? { ...c, quorum: Number(minQuorum) } : c));
    alert("บันทึกองค์ประชุมขั้นต่ำเรียบร้อย");
  };

  const handleAddNewMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim()) return;
    const newId = `M${Date.now()}`;
    const newMember = { id: newId, name: addName, position: addRole || "กรรมการ", department: addDept || "สำนักงานใหญ่" };
    const newMembership = { id: `MS${Date.now()}`, memberId: newId, committeeId: selectedCommittee, role: addRole || "กรรมการ" };
    
    setMembers(prev => [...prev, newMember]);
    setMemberships(prev => [...prev, newMembership]);
    setAddName(''); setAddRole(''); setAddDept('');
  };

  const handleAddExisting = () => {
    const exist = memberships.some(ms => ms.committeeId === selectedCommittee && ms.memberId === selectedExistingMember);
    if (exist) return alert("บุคคลนี้อยู่ในคณะนี้อยู่แล้ว");
    const target = members.find(m => m.id === selectedExistingMember);
    
    setMemberships(prev => [...prev, {
      id: `MS${Date.now()}`,
      memberId: selectedExistingMember,
      committeeId: selectedCommittee,
      role: target?.position || "กรรมการ"
    }]);
  };

  const handleRemoveMembership = (id: string) => {
    setMemberships(prev => prev.filter(ms => ms.id !== id));
  };

  const handleImportCSVFake = () => {
    const fakeCSV = [
      { id: "M_IMP1", name: "นายสมศักดิ์ รักชาติ", position: "กรรมการ", department: "ฝ่ายยุทธศาสตร์" },
      { id: "M_IMP2", name: "นางสาวทิพย์วรรณ มีแก้ว", position: "ผู้ทรงคุณวุฒิ", department: "กองทุนท้องถิ่น" }
    ];
    setMembers(prev => [...prev, ...fakeCSV]);
    setMemberships(prev => [
      ...prev,
      ...fakeCSV.map(f => ({ id: `MS_${Date.now()}_${f.id}`, memberId: f.id, committeeId: selectedCommittee, role: f.position }))
    ]);
    alert("Import รายชื่อเข้าสู่คณะนี้สำเร็จ (จำลองจากรูปแบบไฟล์)");
  };

  // ปุ่มฟังก์ชันหน้าเช็คชื่อ
  const handleCheckAll = () => {
    const currentRecords = attendance[selectedMeetingId] || {};
    const updated = { ...currentRecords };
    Object.keys(updated).forEach(k => {
      updated[k] = { ...updated[k], status: "เข้าร่วม" };
    });
    setAttendance({ ...attendance, [selectedMeetingId]: updated });
  };

  const handleClearStatus = () => {
    const currentRecords = attendance[selectedMeetingId] || {};
    const updated = { ...currentRecords };
    Object.keys(updated).forEach(k => {
      updated[k] = { ...updated[k], status: "ลา", reason: "" };
    });
    setAttendance({ ...attendance, [selectedMeetingId]: updated });
  };

  return (
    <div className="flex min-h-screen bg-[#f4f6f9] text-slate-800 antialiased font-sans text-xs select-none">
      
      {/* 🏙️ SIDEBAR DESIGN (ถอดสัดส่วนสีหน้าจอตรงปก) */}
      <aside className="w-56 bg-[#1a2332] text-slate-200 flex flex-col fixed h-full z-20 shadow-xl">
        <div className="p-4 bg-[#111823] flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center font-bold text-white text-[11px]">กก</div>
          <div>
            <div className="text-[11px] font-bold text-slate-100 tracking-tight">ระบบเช็คชื่อคณะ</div>
            <div className="text-[10px] text-slate-400">กรรมการ</div>
            <div className="text-[9px] text-slate-500">Prototype สำหรับ AppSheet</div>
          </div>
        </div>
        
        <nav className="flex-1 p-2 space-y-1">
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
                className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left text-xs transition-all ${
                  isActive 
                    ? 'bg-[#243247] text-blue-400 font-bold border-r-4 border-blue-500' 
                    : 'text-slate-400 hover:bg-[#1f2939] hover:text-slate-200'
                }`}
              >
                <item.icon size={14} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        
        <div className="p-3 text-[10px] text-slate-500 bg-[#111823] leading-relaxed">
          Mockup จำลองจากฐานข้อมูล Member, Committee, Membership, Meeting และ Attendance เพื่อให้ดูรูปแบบก่อนสร้างระบบจริง
        </div>
      </aside>

      {/* 📦 MAIN CONTENT CONTAINER */}
      <div className="flex-1 ml-56 p-6 min-h-screen">
        
        {/* TOP META BAR */}
        <div className="flex justify-between items-center mb-6">
          <span className="text-slate-400 font-medium">สปสช. เขต 4 สระบุรี</span>
          <span className="bg-white border border-slate-200 px-3 py-1 rounded text-[11px] text-slate-600 font-medium">
            ผู้บันทึก: <strong className="text-slate-800">admin@nhso.go.th</strong>
          </span>
        </div>

        {/* =========================================================
            VIEW 1: รายชื่อคณะ (ถอดแบบภาพถ่าย 3.jpg 100%)
           ========================================================= */}
        {currentTab === 'manage_committees' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">แก้ไขรายชื่อคณะกรรมการ</h2>
              <p className="text-slate-400 text-[11px]">จัดการสมาชิกและองค์ประชุมของแต่ละคณะ</p>
            </div>

            {/* ส่วนสลับคณะ & ตั้งองค์ประชุมขั้นต่ำ */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">เลือกคณะกรรมการ</label>
                <select 
                  value={selectedCommittee}
                  onChange={(e) => setSelectedCommittee(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded p-1.5 font-medium text-slate-700 focus:outline-none"
                >
                  {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">องค์ประชุมขั้นต่ำ</label>
                <input 
                  type="number" 
                  value={minQuorum}
                  onChange={(e) => setMinQuorum(Number(e.target.value))}
                  className="w-full bg-white border border-slate-200 rounded p-1.5 font-medium text-slate-700 text-center focus:outline-none"
                />
              </div>
              <button 
                onClick={handleSaveQuorum}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded transition-colors w-fit h-fit"
              >
                บันทึกองค์ประชุม
              </button>
            </div>

            {/* ฟอร์มกรอกชื่อกรรมการเพิ่มเข้าคณะ */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <input 
                  type="text" 
                  placeholder="ชื่อ-นามสกุล" 
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full border border-slate-200 rounded p-1.5 focus:outline-none bg-white"
                />
              </div>
              <div>
                <input 
                  type="text" 
                  placeholder="เช่น กรรมการ, เลขานุการ" 
                  value={addRole}
                  onChange={(e) => setAddRole(e.target.value)}
                  className="w-full border border-slate-200 rounded p-1.5 focus:outline-none bg-white"
                />
              </div>
              <div>
                <input 
                  type="text" 
                  placeholder="หน่วยงาน" 
                  value={addDept}
                  onChange={(e) => setAddDept(e.target.value)}
                  className="w-full border border-slate-200 rounded p-1.5 focus:outline-none bg-white"
                />
              </div>
              <button 
                onClick={handleAddNewMember}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded transition-colors w-fit"
              >
                เพิ่มเข้าคณะ
              </button>
            </div>

            {/* ระบบ Import รายชื่อเฉพาะของคณะนี้ตามรูป */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Import รายชื่อเข้าคณะนี้ (.csv)</label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={handleImportCSVFake} className="border border-slate-300 rounded bg-slate-50 py-1 px-3 text-slate-600 hover:bg-slate-100 font-semibold">
                    เลือกไฟล์
                  </button>
                  <span className="text-slate-400">ไม่ได้เลือกไฟล์ใด</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleImportCSVFake} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded transition-colors">
                  Import รายชื่อ
                </button>
                <button onClick={() => alert("ดาวน์โหลด Template CSV แล้ว")} className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 py-1.5 px-3 rounded font-bold">
                  ดาวน์โหลดไฟล์ตัวอย่าง
                </button>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">รูปแบบไฟล์</label>
                <div className="bg-slate-50 border border-slate-200 text-slate-500 text-center rounded py-1 px-2 font-mono font-bold text-[10px]">
                  ชื่อ_นามสกุล,ตำแหน่ง,หน่วยงาน
                </div>
              </div>
            </div>

            {/* ส่วนตารางแยกรายชื่อและกล่องด้านขวา */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              
              {/* ตารางสมาชิกหลัก */}
              <div className="lg:col-span-3 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 flex justify-between items-center">
                  <span>{committees.find(c => c.id === selectedCommittee)?.name}</span>
                  <span className="bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-2 py-0.5 text-[10px] font-bold">
                    {currentCommitteeMembers.length} คน
                  </span>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-slate-50 font-bold text-slate-400 border-b border-slate-200 text-[10px]">
                    <tr>
                      <th className="p-3">ชื่อ-นามสกุล</th>
                      <th className="p-3">ตำแหน่ง</th>
                      <th className="p-3">หน่วยงาน</th>
                      <th className="p-3 text-center w-28">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {currentCommitteeMembers.map(m => (
                      <tr key={m.membershipId} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{m.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{m.memberId}</div>
                        </td>
                        <td className="p-3 text-slate-600">{m.position}</td>
                        <td className="p-3 text-slate-500">{m.department}</td>
                        <td className="p-3 text-center">
                          <button 
                            onClick={() => handleRemoveMembership(m.membershipId)}
                            className="border border-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-500 py-1 px-2 rounded transition-all"
                          >
                            ลบออกจากคณะ
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* กล่องข้างขวา: เพิ่มจากรายชื่อเดิม */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm h-fit space-y-3">
                <div className="font-bold text-slate-800 border-b border-slate-100 pb-2">
                  เพิ่มจากรายชื่อเดิม
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">เลือกกรรมการ</label>
                  <select 
                    value={selectedExistingMember}
                    onChange={(e) => setSelectedExistingMember(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded p-1.5 text-slate-700 focus:outline-none"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name} - {m.position}</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={handleAddExisting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition-colors"
                >
                  เพิ่มเข้าคณะนี้
                </button>
              </div>

            </div>
          </div>
        )}

        {/* =========================================================
            VIEW 2: เช็คชื่อคณะกรรมการ (ถอดแบบภาพถ่าย 4.jpg 100%)
           ========================================================= */}
        {currentTab === 'check_attendance' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">เช็คชื่อคณะกรรมการ</h2>
              <p className="text-slate-400 text-[11px]">เลือกเข้าร่วมประชุมหรือลา พร้อมระบุ Online หรือ OnSite</p>
            </div>

            {/* ส่วนควบคุมหลักด้านบน */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center gap-4 justify-between">
              <div className="w-80">
                <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase">เลือกการประชุม</label>
                <select 
                  value={selectedMeetingId} 
                  onChange={(e) => setSelectedMeetingId(e.target.value)} 
                  className="w-full bg-white border border-slate-200 rounded p-2 text-xs font-bold text-slate-700 focus:outline-none"
                >
                  {meetings.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ครั้งที่ {m.round}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 h-fit">
                <button onClick={handleCheckAll} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded flex items-center gap-1">
                  <Check size={12} /> เข้าร่วมทั้งหมด
                </button>
                <button onClick={handleClearStatus} className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded flex items-center gap-1">
                  <RotateCcw size={12} /> ล้างสถานะ
                </button>
                <button onClick={() => setCurrentTab('generate_report')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded">
                  ดูรายงาน Word
                </button>
              </div>
            </div>

            {/* กล่องสรุปยอดตัวเบิ้ม ๆ 4 ช่องตรงเป๊ะตามรูปภาพที่ 4 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">เข้าจัดประชุม</span>
                <span className="text-2xl font-black text-slate-800 mt-1 block">{attendanceStats.attend}</span>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">ลา</span>
                <span className="text-2xl font-black text-slate-800 mt-1 block">{attendanceStats.leave}</span>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Online / OnSite</span>
                <span className="text-2xl font-black text-slate-800 mt-1 block">{attendanceStats.online}/{attendanceStats.onsite}</span>
              </div>
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">สถานะองค์ประชุม</span>
                <span className={`text-xl font-black mt-1 block ${attendanceStats.attend >= attendanceStats.required ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {attendanceStats.statusText}
                </span>
              </div>
            </div>

            {/* ตารางประมวลผลเช็ครายชื่อหลักแบบ Hybrid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
              <div className="lg:col-span-3 bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                  {meetings.find(m => m.id === selectedMeetingId)?.name} ครั้งที่ {meetings.find(m => m.id === selectedMeetingId)?.round}
                </div>
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 font-bold">
                    <tr>
                      <th className="p-3">กรรมการ</th>
                      <th className="p-3">ตำแหน่ง</th>
                      <th className="p-3 text-center w-28">สถานะ</th>
                      <th className="p-3 w-28">ประเภท</th>
                      <th className="p-3 w-44">หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const currentMeeting = meetings.find(m => m.id === selectedMeetingId);
                      const targetCommMembers = memberships.filter(ms => ms.committeeId === currentMeeting?.committeeId);
                      
                      return targetCommMembers.map(ms => {
                        const info = members.find(m => m.id === ms.memberId);
                        if (!info) return null;

                        const record = attendance[selectedMeetingId]?.[info.id] || { status: "เข้าร่วม", type: "OnSite", reason: "หมายเหตุ" };

                        const toggleStatus = (newSt: "เข้าร่วม" | "ลา") => {
                          setAttendance(prev => ({
                            ...prev,
                            [selectedMeetingId]: {
                              ...(prev[selectedMeetingId] || {}),
                              [info.id]: { ...record, status: newSt, reason: newSt === "ลา" && record.reason === "หมายเหตุ" ? "ติดภารกิจ" : record.reason }
                            }
                          }));
                        };

                        const changeType = (newTp: "Online" | "OnSite") => {
                          setAttendance(prev => ({
                            ...prev,
                            [selectedMeetingId]: {
                              ...(prev[selectedMeetingId] || {}),
                              [info.id]: { ...record, type: newTp }
                            }
                          }));
                        };

                        const changeReason = (txt: string) => {
                          setAttendance(prev => ({
                            ...prev,
                            [selectedMeetingId]: {
                              ...(prev[selectedMeetingId] || {}),
                              [info.id]: { ...record, reason: txt }
                            }
                          }));
                        };

                        return (
                          <tr key={info.id} className={`transition-colors ${record.status === 'ลา' ? 'bg-amber-50/60 hover:bg-amber-50' : 'hover:bg-slate-50/50'}`}>
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{info.name}</div>
                              <div className="text-[10px] text-slate-400">{info.department}</div>
                            </td>
                            <td className="p-3 font-semibold text-slate-500">{ms.role}</td>
                            <td className="p-3">
                              <div className="flex border border-slate-200 rounded overflow-hidden max-w-[120px] mx-auto bg-white">
                                <button 
                                  onClick={() => toggleStatus("เข้าร่วม")}
                                  className={`flex-1 py-1 font-bold text-[10px] text-center ${record.status === 'เข้าร่วม' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                                >
                                  เข้าร่วม
                                </button>
                                <button 
                                  onClick={() => toggleStatus("ลา")}
                                  className={`flex-1 py-1 font-bold text-[10px] text-center ${record.status === 'ลา' ? 'bg-amber-500 text-white' : 'text-slate-400'}`}
                                >
                                  ลา
                                </button>
                              </div>
                            </td>
                            <td className="p-3">
                              <select 
                                value={record.type} 
                                onChange={(e) => changeType(e.target.value as "Online" | "OnSite")}
                                className="w-full bg-white border border-slate-200 rounded p-1 font-semibold text-slate-700 text-[11px] focus:outline-none"
                              >
                                <option value="Online">Online</option>
                                <option value="OnSite">OnSite</option>
                              </select>
                            </td>
                            <td className="p-3">
                              <input 
                                type="text" 
                                value={record.reason}
                                onChange={(e) => changeReason(e.target.value)}
                                disabled={record.status !== "ลา"}
                                className={`w-full border rounded p-1 text-[11px] bg-white focus:outline-none ${record.status === 'ลา' ? 'border-amber-300 font-medium text-amber-900' : 'border-slate-200 text-slate-400'}`}
                              />
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              {/* กล่องขวา: สรุปยอดประชุมครบเงื่อนไข */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
                <div className="font-bold text-slate-800">สรุปองค์ประชุม</div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full transition-all" 
                    style={{ width: `${Math.min((attendanceStats.attend / attendanceStats.required) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  คณะกรรมการบริหาร ต้องมีกรรมการเข้าร่วมอย่างน้อย **{attendanceStats.required} คน** ตอนนี้กรรมการมาแล้ว {attendanceStats.attend} คน ผู้เข้าร่วมเพิ่มเติมจะไม่ถูกนับในองค์ประชุมหลัก
                </p>
                <button onClick={() => setCurrentTab('generate_report')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition-colors shadow-sm">
                  ปิดประชุมและสร้างรายงาน
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            VIEW 3: รายงาน WORD (ถอดแบบหน้าตาใบสรุปเอกสาร 5.jpg 100%)
           ========================================================= */}
        {currentTab === 'generate_report' && (
          <div className="space-y-4">
            {/* ตัวกรองและหัวควบคุมด้านบน */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
              <select 
                value={selectedMeetingId} 
                onChange={(e) => setSelectedMeetingId(e.target.value)} 
                className="bg-white border border-slate-200 rounded p-2 text-xs font-bold text-slate-700 focus:outline-none w-72"
              >
                {meetings.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ครั้งที่ {m.round}</option>
                ))}
              </select>
              <button onClick={() => alert("ดาวน์โหลดไฟล์สรุปรายงานเรียบร้อย")} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded">
                ดาวน์โหลด Microsoft Word
              </button>
              <button onClick={() => window.print()} className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold px-4 py-2 rounded">
                พิมพ์รายงาน
              </button>
            </div>

            {/* แผ่นกระดาษตัวจำลองรายงานเอกสารสิทธิ์ราชการ (ตรงเป๊ะตามภาพ 5.jpg) */}
            <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-md max-w-4xl mx-auto space-y-6 text-slate-900">
              <h1 className="text-center font-bold text-sm tracking-wide mt-2">รายงานผลการเช็คชื่อเข้าร่วมประชุม</h1>
              
              {/* ข้อมูลทั่วไปหัวเรื่อง */}
              <div className="grid grid-cols-4 gap-y-2 text-[11px] border-b border-slate-100 pb-4">
                <div className="font-bold text-slate-400">ชื่อการประชุม</div>
                <div className="col-span-3 font-bold">{meetings.find(m => m.id === selectedMeetingId)?.name}</div>
                <div className="font-bold text-slate-400">ครั้งที่</div>
                <div className="col-span-3 font-bold">ครั้งที่ {meetings.find(m => m.id === selectedMeetingId)?.round}</div>
                <div className="font-bold text-slate-400">คณะกรรมการ</div>
                <div className="col-span-3 font-bold">{committees.find(c => c.id === meetings.find(m => m.id === selectedMeetingId)?.committeeId)?.name}</div>
                <div className="font-bold text-slate-400">วันที่ประชุม</div>
                <div className="col-span-3 font-bold">{meetings.find(m => m.id === selectedMeetingId)?.date}</div>
                <div className="font-bold text-slate-400">สถานที่</div>
                <div className="col-span-3 font-bold">{meetings.find(m => m.id === selectedMeetingId)?.place}</div>
                <div className="font-bold text-slate-400">ประธาน</div>
                <div className="col-span-3 font-bold">{meetings.find(m => m.id === selectedMeetingId)?.chair}</div>
              </div>

              {/* ตารางแจกแจงสรุปผลรวมจำนวน */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-800 border-l-4 border-blue-500 pl-2">สรุปผล</h3>
                <div className="grid grid-cols-4 gap-y-1.5 text-[11px] bg-slate-50 p-3 rounded">
                  <div className="text-slate-500">กรรมการและผู้เข้าร่วม</div>
                  <div className="font-bold text-right pr-12">{attendanceStats.total} คน</div>
                  <div className="text-slate-500">เข้าร่วมประชุม</div>
                  <div className="font-bold text-right pr-12 text-emerald-600">{attendanceStats.attend} คน</div>
                  <div className="text-slate-400 pl-4">Online</div>
                  <div className="font-bold text-right pr-12">{attendanceStats.online} คน</div>
                  <div className="text-slate-400 pl-4">OnSite</div>
                  <div className="font-bold text-right pr-12">{attendanceStats.onsite} คน</div>
                  <div className="text-slate-500">ลา</div>
                  <div className="font-bold text-right pr-12 text-amber-600">{attendanceStats.leave} คน</div>
                  <div className="text-slate-500">องค์ประชุมขั้นต่ำ</div>
                  <div className="font-bold text-right pr-12">{attendanceStats.required} คน</div>
                  <div className="text-slate-500">ผลการประชุม</div>
                  <div className={`font-bold text-right pr-12 ${attendanceStats.attend >= attendanceStats.required ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {attendanceStats.attend >= attendanceStats.required ? 'ครบองค์ประชุม' : 'ไม่ครบองค์ประชุม'}
                  </div>
                </div>
              </div>

              {/* 1. แยกตารางกลุ่มผู้เข้าร่วมประชุมตามภาพถ่าย */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-800 text-[11px]">รายชื่อผู้เข้าร่วมประชุม</h3>
                <div className="border border-slate-100 rounded overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(() => {
                        let idx = 1;
                        return Object.entries(attendance[selectedMeetingId] || {}).map(([mId, record]) => {
                          if (record.status !== "เข้าร่วม") return null;
                          const info = members.find(m => m.id === mId);
                          const msInfo = memberships.find(ms => ms.memberId === mId && ms.committeeId === meetings.find(m => m.id === selectedMeetingId)?.committeeId);
                          return (
                            <tr key={mId} className="hover:bg-slate-50/40">
                              <td className="p-2.5 w-10 text-center text-slate-400">{idx++}.</td>
                              <td className="p-2.5 font-bold text-slate-900 w-52">{info?.name}</td>
                              <td className="p-2.5 text-slate-500 w-44">ตำแหน่ง {msInfo?.role || info?.position}</td>
                              <td className="p-2.5 text-slate-500 w-44">หน่วยงาน {info?.department}</td>
                              <td className="p-2.5 text-emerald-600 font-semibold text-right pr-4">ประชุม {record.type}</td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. แยกตารางกลุ่มผู้ลาตามภาพถ่าย */}
              <div className="space-y-2">
                <h3 className="font-bold text-slate-800 text-[11px]">รายชื่อผู้ลา</h3>
                <div className="border border-slate-100 rounded overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(() => {
                        let idx = 1;
                        return Object.entries(attendance[selectedMeetingId] || {}).map(([mId, record]) => {
                          if (record.status !== "ลา") return null;
                          const info = members.find(m => m.id === mId);
                          const msInfo = memberships.find(ms => ms.memberId === mId && ms.committeeId === meetings.find(m => m.id === selectedMeetingId)?.committeeId);
                          return (
                            <tr key={mId} className="hover:bg-amber-50/20">
                              <td className="p-2.5 w-10 text-center text-slate-400">{idx++}.</td>
                              <td className="p-2.5 font-bold text-slate-900 w-52">{info?.name}</td>
                              <td className="p-2.5 text-slate-500 w-44">ตำแหน่ง {msInfo?.role || info?.position}</td>
                              <td className="p-2.5 text-slate-500 w-44">หน่วยงาน {info?.department}</td>
                              <td className="p-2.5 text-amber-600 font-semibold text-right pr-4">เหตุผล {record.reason}</td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* แถบส่วนที่เหลือเปิดโครงสร้างว่างรองรับงาน AppSheet */}
        {currentTab === 'dashboard' && <div className="p-8 text-center text-slate-400 bg-white rounded border border-slate-200">หน้าจอแดชบอร์ดสรุปผลรวม - ปรับตามผังงาน AppSheet โครงสร้างหลักเรียบร้อย</div>}
        {currentTab === 'manage_meetings' && <div className="p-8 text-center text-slate-400 bg-white rounded border border-slate-200">หน้าจอจัดการกำหนดนัดหมายรอบการประชุม - ปรับตามผังงาน AppSheet โครงสร้างหลักเรียบร้อย</div>}

      </div>
    </div>
  );
}