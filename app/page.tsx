// app/page.tsx
"use client";
import { useState } from 'react';
import { 
  LayoutDashboard, CalendarDays, Users, ClipboardCheck, FileWord, 
  ChevronDown, RefreshCw, Plus, CheckCircle, Clock, UserPlus, 
  ShieldAlert, FileSpreadsheet, Radio, Laptop, FileText, Download, CheckCircle2, UserCircle
} from 'lucide-react';

export default function InteractiveSandboxMockup() {
  // 1. State สำหรับเปลี่ยนหน้าจอ (Mockup Navigation)
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'meetings' | 'committees' | 'attendance' | 'report'>('dashboard');

  // 2. States สำหรับระบบจัดการข้อมูลและ Validation
  const [inputName, setInputName] = useState("");
  const [inputError, setInputError] = useState("");
  const [fiscalYear, setFiscalYear] = useState("2569");
  
  // ข้อมูลคณะกรรมการทดสอบ
  const [members, setMembers] = useState([
    { id: 1, name: 'นายสมชาย ดีพร้อม', position: 'ประธานกรรมการ', department: 'ฝ่ายยุทธศาสตร์', status: 'มา', type: 'Onsite' },
    { id: 2, name: 'นางสาววิภา รักดี', position: 'กรรมการ', department: 'สำนักเทคโนโลยีสารสนเทศ', status: 'มา', type: 'Online' },
    { id: 3, name: 'ดร.นพดล ยั่งยืน', position: 'กรรมการ', department: 'กองกลาง', status: 'ลา', type: '-' },
  ]);

  // ข้อมูลการประชุมทดสอบ
  const meetingData = [
    { id: 1, title: 'ประชุมคณะกรรมการบริหารการเคหะแห่งชาติ', times: 'ครั้งที่ 1/2569', date: '17 พ.ค. 2569', status: 'กำลังดำเนินการ', attendance: `${members.filter(m => m.status === 'มา').length}/${members.length}`, statusColor: 'bg-amber-100 text-amber-700' },
    { id: 2, title: 'ประชุมประเมินผลตัวชี้วัดความรอบรู้ดิจิทัล (Digital Literacy)', times: 'ครั้งที่ 1/2569', date: '20 พ.ค. 2569', status: 'ว่าง', attendance: '0/3', statusColor: 'bg-blue-100 text-blue-700' },
    { id: 3, title: 'ประชุมคณะกรรมการพิจารณาพัฒนาบิ๊กดาต้า', times: 'ครั้งที่ 2/2569', date: '24 พ.ค. 2569', status: 'ว่าง', attendance: '0/4', statusColor: 'bg-blue-100 text-blue-700' },
  ];

  // ฟังก์ชันเพิ่มรายชื่อพร้อมตรวจสอบความถูกต้อง (Inline Validation)
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim() || inputName.length < 4) {
      setInputError("❌ กรุณากรอกชื่อ-นามสกุลจริงให้ถูกต้อง (อย่างน้อย 4 ตัวอักษร)");
      return;
    }
    setInputError("");
    setMembers([...members, { 
      id: Date.now(), 
      name: inputName, 
      position: 'กรรมการ', 
      department: 'หน่วยงานจำลอง', 
      status: 'มา', 
      type: 'Onsite' 
    }]);
    setInputName("");
  };

  // ฟังก์ชันอัปเดตสถานะเช็คชื่อแบบเรียลไทม์
  const updateAttendanceStatus = (id: number, status: 'มา' | 'ไม่มา' | 'ลา') => {
    setMembers(members.map(m => m.id === id ? { ...m, status, type: status === 'มา' ? 'Onsite' : '-' } : m));
  };

  const updateAttendanceType = (id: number, type: 'Onsite' | 'Online') => {
    setMembers(members.map(m => m.id === id && m.status === 'มา' ? { ...m, type } : m));
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* ---------------- SIDEBAR NAVIGATION ---------------- */}
      <div className="w-64 bg-slate-900 text-white p-4 flex flex-col fixed h-full left-0 top-0 z-50">
        <div className="text-xl font-bold mb-8 p-2 border-b border-slate-700 flex flex-col">
          <span>NHA Meeting</span>
          <span className="text-xs text-blue-400 font-normal mt-1">ระบบจัดการประชุม ศพส.</span>
        </div>
        
        <nav className="flex-1 space-y-1">
          {[
            { id: 'dashboard', name: 'หน้าแรก (Dashboard)', icon: LayoutDashboard },
            { id: 'meetings', name: 'จัดการการประชุม', icon: CalendarDays },
            { id: 'committees', name: 'รายชื่อคณะกรรมการ', icon: Users },
            { id: 'attendance', name: 'ระบบเช็คชื่อ (Hybrid)', icon: ClipboardCheck },
            { id: 'report', name: 'รายงาน Word', icon: FileWord },
          ].map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id as any)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all text-sm font-medium ${
                  isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon size={18} />
                {item.name}
              </button>
            );
          })}
        </nav>

        <div className="text-xs text-center p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-slate-400">
          <div className="flex items-center justify-center gap-1.5 font-bold text-amber-400 mb-0.5">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
            Interactive Mockup
          </div>
          ทดลองคลิกสลับหน้าจอได้จริง
        </div>
      </div>

      {/* ---------------- MAIN CONTENT AREA ---------------- */}
      <div className="flex-1 ml-64 p-8">
        
        {/* Global Header */}
        <header className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
          <div>
            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">การเคหะแห่งชาติ (NHA)</div>
            <h1 className="text-2xl font-bold text-slate-800">
              {currentTab === 'dashboard' && 'ตารางการประชุมประจำปี'}
              {currentTab === 'meetings' && 'ระบบจัดการการประชุม'}
              {currentTab === 'committees' && 'ทำเนียบคณะกรรมการ'}
              {currentTab === 'attendance' && 'บันทึกองค์ประชุม (Hybrid)'}
              {currentTab === 'report' && 'ระบบออกเอกสารรายงาน'}
            </h1>
          </div>
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-slate-200 text-sm">
            <UserCircle className="text-slate-400" size={24} />
            <span className="font-semibold text-slate-700">admin@nha.go.th</span>
          </div>
        </header>

        {/* ---------------- PAGE 1: DASHBOARD ---------------- */}
        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">ปีงบประมาณ</label>
                <div className="relative">
                  <select value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg appearance-none outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="2569">2569</option>
                    <option value="2568">2568</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">ประเภทคณะกรรมการ</label>
                <div className="relative">
                  <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg appearance-none outline-none">
                    <option>ทุกคณะกรรมการ</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => alert(`ดึงข้อมูลปีงบประมาณ ${fiscalYear} สำเร็จ`)} className="flex-1 bg-blue-600 text-white p-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors">เรียกดูข้อมูล</button>
                <button onClick={() => setCurrentTab('report')} className="p-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">ดูรายงาน</button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'การประชุมทั้งหมด', val: meetingData.length, color: 'border-l-blue-500' },
                { label: 'มาประชุม (คน)', val: members.filter(m => m.status === 'มา').length, color: 'border-l-green-500' },
                { label: 'ขาด/ลา (คน)', val: members.filter(m => m.status !== 'มา').length, color: 'border-l-rose-500' },
                { label: 'ปีงบประมาณปัจจุบัน', val: fiscalYear, color: 'border-l-purple-500' },
              ].map((s, idx) => (
                <div key={idx} className={`bg-white p-5 rounded-xl border border-slate-200 border-l-4 ${s.color} shadow-sm`}>
                  <div className="text-xs font-medium text-slate-400 mb-1">{s.label}</div>
                  <div className="text-2xl font-bold text-slate-800">{s.val}</div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800">ตารางสิทธิ์และรายชื่อการประชุม</h3>
                <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md font-semibold">ข้อมูลแบบ Real-time</span>
              </div>
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-4">ชื่อการประชุม</th>
                    <th className="p-4">วาระการประชุม</th>
                    <th className="p-4">วันที่จัด</th>
                    <th className="p-4">สถานะการจัด</th>
                    <th className="p-4 text-center">องค์ประชุม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {meetingData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-semibold text-slate-800 max-w-xs truncate">{item.title}</td>
                      <td className="p-4 text-slate-600">{item.times}</td>
                      <td className="p-4 text-slate-600">{item.date}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.statusColor}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{item.attendance}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------- PAGE 2: MEETINGS ---------------- */}
        {currentTab === 'meetings' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">รายการห้องและนัดหมายการประชุม</h3>
              <button onClick={() => alert('ฟังก์ชันการสร้างบอร์ดการประชุมเปิดใช้งานในเวอร์ชันเต็ม')} className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700">
                <Plus size={16} /> นัดหมายประชุมล่วงหน้า
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meetingData.map((m) => (
                <div key={m.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">ID: NHA-00{m.id}</span>
                    <span className="text-xs text-slate-400 font-medium">{m.date}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 mb-2 line-clamp-1">{m.title}</h4>
                  <p className="text-xs text-slate-500 mb-4">สถานที่: อาคารสำนักงานใหญ่ การเคหะแห่งชาติ หรือ ระบบออนไลน์</p>
                  <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-500">จำนวนบอร์ดที่จัดตั้ง: 1 ชุด</span>
                    <button onClick={() => setCurrentTab('attendance')} className="text-xs font-bold text-blue-600 hover:underline">บันทึกองค์ประชุม →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------- PAGE 3: COMMITTEES ---------------- */}
        {currentTab === 'committees' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Side Form */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-fit">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-1.5 text-sm">
                <UserPlus size={16} className="text-blue-600" /> ลงทะเบียนบอร์ดคณะกรรมการ
              </h3>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">ชื่อ-นามสกุลคณะกรรมการ</label>
                  <input 
                    type="text" 
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    placeholder="กรอกชื่อและนามสกุลจริง"
                    className={`w-full p-2.5 bg-slate-50 border rounded-lg text-sm outline-none focus:ring-2 ${inputError ? 'border-red-400 focus:ring-red-100' : 'border-slate-200 focus:ring-blue-100'}`}
                  />
                  {inputError && (
                    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1 font-medium">
                      <ShieldAlert size={12}/> {inputError}
                    </p>
                  )}
                </div>
                <button type="submit" className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">
                  บันทึกเข้าระบบ Sandbox
                </button>
              </form>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <button onClick={() => alert('ระบบนำเข้าจาก Excel (.xlsx) กำลังจำลองโครงสร้างข้อมูล')} className="w-full py-2.5 border border-dashed border-emerald-500 text-emerald-600 bg-emerald-50/30 rounded-lg text-xs font-bold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1.5">
                  <FileSpreadsheet size={14}/> นำเข้าผ่าน Excel (Bulk Import)
                </button>
              </div>
            </div>

            {/* Table Area */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-sm">รายชื่อคณะกรรมการที่โหลดเข้า Sandbox</h3>
              </div>
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-4">ชื่อ-นามสกุล</th>
                    <th className="p-4">ตำแหน่งงาน</th>
                    <th className="p-4">ฝ่ายงานสังกัด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-medium text-slate-900">{m.name}</td>
                      <td className="p-4 text-xs font-semibold text-slate-500">{m.position}</td>
                      <td className="p-4 text-xs text-slate-400">{m.department}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------- PAGE 4: ATTENDANCE ---------------- */}
        {currentTab === 'attendance' && (
          <div className="space-y-4">
            <div className="bg-blue-900 text-white p-5 rounded-xl flex justify-between items-center shadow-md">
              <div>
                <h3 className="font-bold text-base">ระบบลงมติเช็คชื่อองค์ประชุมแบบเรียลไทม์</h3>
                <p className="text-xs text-blue-200 mt-1">กดเปลี่ยนสถานะเพื่อทดสอบแถบประเมินผลความถูกต้อง (Data Integrity)</p>
              </div>
              <div className="bg-slate-900/60 px-4 py-2 rounded-lg border border-slate-700 text-right">
                <span className="text-xs text-blue-400 font-bold block uppercase">สรุปองค์ประชุม</span>
                <span className="text-base font-bold">เข้าร่วม {members.filter(m => m.status === 'มา').length} / {members.length} ท่าน</span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-400 text-xs font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="p-4">รายชื่อคณะกรรมการ</th>
                    <th className="p-4 text-center">การเข้าร่วม</th>
                    <th className="p-4 text-center">รูปแบบการประชุม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {members.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 font-semibold text-slate-800">{c.name}</td>
                      <td className="p-4 text-center">
                        <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 gap-1">
                          {(['มา', 'ไม่มา', 'ลา'] as const).map((st) => (
                            <button
                              key={st}
                              onClick={() => updateAttendanceStatus(c.id, st)}
                              className={`px-3 py-1 text-xs rounded-md font-bold transition-all ${
                                c.status === st 
                                  ? st === 'มา' ? 'bg-green-600 text-white shadow-sm' : st === 'ไม่มา' ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-400 text-white shadow-sm'
                                  : 'text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {c.status === 'มา' ? (
                          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 gap-1">
                            <button
                              onClick={() => updateAttendanceType(c.id, 'Onsite')}
                              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-bold ${c.type === 'Onsite' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
                            >
                              <Radio size={12}/> Onsite
                            </button>
                            <button
                              onClick={() => updateAttendanceType(c.id, 'Online')}
                              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-md font-bold ${c.type === 'Online' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
                            >
                              <Laptop size={12}/> Online
                            </button>
                          </div>
                        ) : <span className="text-slate-400 text-xs">- ไม่ระบุ -</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ---------------- PAGE 5: REPORT ---------------- */}
        {currentTab === 'report' && (
          <div className="max-w-xl bg-white p-6 rounded-xl border border-slate-200 shadow-sm mx-auto">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <FileText size={28} />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-800">เครื่องมือส่งออกเอกสารราชการ (.docx)</h3>
                <p className="text-xs text-slate-500 mt-0.5">ดึงชุดข้อมูลจากผลการลงทะเบียนและเช็คชื่อในหน้า Sandbox ไปสตรีมลงหน้าฟอร์มรายงาน Word อัตโนมัติ</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-2 mb-6 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-500"/> ผ่านการตรวจสอบโครงสร้างข้อมูลส่วนแรก (Zero-Error Guard)</div>
              <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-green-500"/> ตรวจสอบสรุปยอดมาประชุมล่าสุด: ยืนยันเรียบร้อย</div>
            </div>

            <button 
              onClick={() => alert(`🎉 ดาวน์โหลดเอกสารสรุปองค์ประชุมประจำปีงบประมาณ ${fiscalYear} สำเร็จ (ไฟล์จำลอง)`)} 
              className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-md"
            >
              <Download size={16} /> ดาวน์โหลดไฟล์รายงาน Word (.docx)
            </button>
          </div>
        )}

      </div>
    </div>
  );
}