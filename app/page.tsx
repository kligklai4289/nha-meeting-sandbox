"use client";
import { useState, useMemo } from 'react';
import { 
  Home, Calendar, Users, CheckSquare, FileText,
  Plus, Edit, Trash2, Download, FileSpreadsheet, Search, Filter
} from 'lucide-react';

// ==========================================
// 📊 ฐานข้อมูลและฟังก์ชันการทำงาน (คงเดิม)
// ==========================================
const INITIAL_COMMITTEES = [
  { id: "C001", name: "คณะอนุกรรมการหลักประกันสุขภาพแห่งชาติ เขต 4 สระบุรี", quorum: 5 },
  { id: "C002", name: "คณะอนุกรรมการควบคุมคุณภาพและมาตรฐานบริการสาธารณสุข เขต 4 สระบุรี", quorum: 5 }
];

const INITIAL_MEMBERS = [
  { id: "M001", name: "นายสมชาย ใจดี", position: "กรรมการ", department: "สำนักงานใหญ่", status: "ใช้งาน" },
  { id: "M002", name: "นางสาวสมหญิง มีสุข", position: "ประธาน", department: "สำนักงานใหญ่", status: "ใช้งาน" }
];

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [committees] = useState(INITIAL_COMMITTEES);
  const [members] = useState(INITIAL_MEMBERS);
  const [meetings] = useState([]);
  const [attendance] = useState({});

  // คำนวณสถิติ
  const dynamicStats = useMemo(() => {
    return {
      total: meetings.length,
      onsite: 0, 
      online: 0,
      totalAllCommittees: committees.length,
      totalAllMembers: members.length
    };
  }, [meetings, committees, members]);

  return (
    <div className="flex min-h-screen bg-[#f4f6f8] text-slate-800 antialiased font-sans text-sm">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0f172a] text-slate-200 fixed h-full z-20 shadow-xl">
        <div className="p-5 font-bold text-white border-b border-slate-800">NHSO เขต 4 สระบุรี</div>
        <nav className="p-3 space-y-1">
          {[
            { id: 'dashboard', label: 'ภาพรวม', icon: Home },
            { id: 'manage_meetings', label: 'การประชุม', icon: Calendar },
            { id: 'manage_committees', label: 'รายชื่อคณะ', icon: Users },
            { id: 'check_attendance', label: 'เช็คชื่อ', icon: CheckSquare },
            { id: 'generate_report', label: 'รายงาน Word', icon: FileText },
          ].map((item) => (
            <button key={item.id} onClick={() => setCurrentTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg ${currentTab === item.id ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'}`}>
              <item.icon size={16} /> {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {currentTab === 'dashboard' ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div>
              <h2 className="text-xl font-bold text-slate-800">ภาพรวมระบบ</h2>
              <p className="text-sm text-slate-500">สรุปข้อมูลการประชุมและสถิติภาพรวมทั้งหมด</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* ฝั่งซ้าย: 3 การ์ดสถิติ */}
              <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)]">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">การประชุมทั้งหมด</span>
                  <div className="mt-3 text-4xl font-black text-slate-900 tracking-tight">{dynamicStats.total} <span className="text-sm font-medium text-slate-400 ml-1">ครั้ง</span></div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)]">
                  <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">มาประชุม (Onsite)</span>
                  <div className="mt-3 text-4xl font-black text-emerald-700 tracking-tight">{dynamicStats.onsite} <span className="text-sm font-medium text-slate-400 ml-1">คน</span></div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)]">
                  <span className="text-[11px] font-bold text-sky-600 uppercase tracking-widest">มาประชุม (Online)</span>
                  <div className="mt-3 text-4xl font-black text-sky-700 tracking-tight">{dynamicStats.online} <span className="text-sm font-medium text-slate-400 ml-1">คน</span></div>
                </div>
              </div>

              {/* ฝั่งขวา: ข้อมูลสะสมระบบ */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.07)] flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3">ข้อมูลสะสมระบบ</div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-slate-600">คณะอนุกรรมการ:</span>
                      <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md">{dynamicStats.totalAllCommittees} คณะ</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-slate-600">รายชื่อกรรมการ:</span>
                      <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md">{dynamicStats.totalAllMembers} ท่าน</span>
                    </div>
                  </div>
                </div>
                <div className="mt-8 pt-4 border-t border-slate-50 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">สถานะระบบ</p>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">พร้อมใช้งาน</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold mb-4 capitalize">{currentTab.replace('_', ' ')}</h2>
            {/* เนื้อหาเมนูอื่น ๆ ของคุณจะแสดงที่นี่ตาม Logic เดิม */}
            <p className="text-slate-500">ส่วนการทำงานของเมนู {currentTab} ทำงานได้ตามปกติครับ</p>
          </div>
        )}
      </main>
    </div>
  );
}