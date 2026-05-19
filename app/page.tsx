"use client";
import { useState, useMemo } from 'react';
import { 
  Home, Calendar, Users, CheckSquare, FileText,
  Plus, Edit, Trash2, Download, FileSpreadsheet, Search, Filter, Upload
} from 'lucide-react';

// ==========================================
// 📊 ฐานข้อมูลอ้างอิงโครงสร้าง สปสช. เขต 4 (คงเดิม)
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

const INITIAL_MEETINGS = [{ id: "MT001", committeeId: "C001", name: "ประชุมคณะอนุกรรมการหลักประกันสุขภาพแห่งชาติ เขต 4 สระบุรี", round: "1/2569", fiscalYear: "2569", date: "2026-05-17", startTime: "09:30", endTime: "12:00", place: "ห้องประชุม สปสช. เขต 4 สระบุรี", chairId: "M002", recorder: "backoffice.nhso4@gmail.com", status: "ร่าง" }];
const INITIAL_ATTENDANCE: Record<string, Record<string, { status: string; type: string; note: string }>> = { "MT001": { "M001": { status: "เข้าร่วม", type: "Onsite", note: "" }, "M002": { status: "เข้าร่วม", type: "Online", note: "" }, "M003": { status: "ลา", type: "Onsite", note: "ติดภารกิจ" } } };

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard'); 
  const [committees, setCommittees] = useState(INITIAL_COMMITTEES);
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [memberships, setMemberships] = useState(INITIAL_MEMBERSHIPS);
  const [meetings, setMeetings] = useState(INITIAL_MEETINGS);
  const [attendance, setAttendance] = useState(INITIAL_ATTENDANCE);
  const [selectedCommittee, setSelectedCommittee] = useState<string>('C001');

  // ⚡ ฟังก์ชัน Import CSV แบบอ่านข้อมูลทั้งหมด (แก้ปัญหา 3 รายชื่อ)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').slice(1); // ข้ามหัวตาราง (Header)
      
      const newMembers = lines.filter(line => line.trim() !== "").map((line, idx) => {
        const [name, pos, dept] = line.split(',');
        return { 
          id: `M_IMP_${Date.now()}_${idx}`, 
          name: name?.trim() || "ไม่ระบุชื่อ", 
          position: pos?.trim() || "กรรมการ", 
          department: dept?.trim() || "-", 
          status: "ใช้งาน" 
        };
      });
      
      const newMemberships = newMembers.map((m, idx) => ({
        id: `MS_IMP_${Date.now()}_${idx}`, 
        memberId: m.id, 
        committeeId: selectedCommittee, 
        role: m.position
      }));

      setMembers(prev => [...prev, ...newMembers]);
      setMemberships(prev => [...prev, ...newMemberships]);
      alert(`นำเข้าไฟล์สำเร็จ! เพิ่มรายชื่อใหม่จำนวน ${newMembers.length} ท่าน เข้าสู่คณะเรียบร้อยแล้ว`);
    };
    reader.readAsText(file);
    e.target.value = ''; // รีเซ็ต input ให้เลือกไฟล์เดิมซ้ำได้
  };

  // ... (ส่วนของฟังก์ชันอื่นๆ ของเดิม เช่น handleDownloadWord, handleCreateOrUpdateMeeting คงเดิมไว้ทั้งหมด)
  // หมายเหตุ: ในที่นี้ผมย่อส่วนที่เหลือไว้ แต่เมื่อวางจริงคุณสามารถวางฟังก์ชันเดิมต่อท้ายได้เลยครับ

  return (
    <div className="flex min-h-screen bg-[#f4f6f8] text-slate-800">
      {/* ... โครงสร้าง Layout คงเดิม ... */}
      
      {/* เมื่ออยู่ในหน้าจัดการรายชื่อ ให้ใช้ปุ่ม Import ที่แก้ไขแล้ว */}
      {currentTab === 'manage_committees' && (
        <label className="inline-flex items-center gap-2 bg-[#107c41] hover:bg-[#0b592e] text-white font-bold text-xs py-2 px-4 rounded-lg cursor-pointer">
          <Upload size={15} />
          <span>Import รายชื่อกรรมการ (CSV)</span>
          <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
        </label>
      )}
      
      {/* ... โครงสร้างอื่นๆ ของคุณที่เหลือ คงไว้ตามเดิมทั้งหมดครับ ... */}
    </div>
  );
}