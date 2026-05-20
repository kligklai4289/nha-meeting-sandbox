"use client";
import { useState, useMemo } from 'react';
import { 
  Home, Calendar, Users, CheckSquare, FileText,
  Plus, Edit, Trash2, Download, FileSpreadsheet, Search, Filter
} from 'lucide-react';

// ==========================================
// ๐“ เธเธฒเธเธเนเธญเธกเธนเธฅเธญเนเธฒเธเธญเธดเธเนเธเธฃเธเธชเธฃเนเธฒเธ เธชเธเธชเธ. เน€เธเธ• 4 (2 เธเธ“เธฐเธซเธฅเธฑเธ)
// ==========================================
const INITIAL_COMMITTEES = [
  { id: "C001", name: "เธเธ“เธฐเธญเธเธธเธเธฃเธฃเธกเธเธฒเธฃเธซเธฅเธฑเธเธเธฃเธฐเธเธฑเธเธชเธธเธเธ เธฒเธเนเธซเนเธเธเธฒเธ•เธด เน€เธเธ• 4 เธชเธฃเธฐเธเธธเธฃเธต", quorum: 5 },
  { id: "C002", name: "เธเธ“เธฐเธญเธเธธเธเธฃเธฃเธกเธเธฒเธฃเธเธงเธเธเธธเธกเธเธธเธ“เธ เธฒเธเนเธฅเธฐเธกเธฒเธ•เธฃเธเธฒเธเธเธฃเธดเธเธฒเธฃเธชเธฒเธเธฒเธฃเธ“เธชเธธเธ เน€เธเธ• 4 เธชเธฃเธฐเธเธธเธฃเธต", quorum: 5 }
];

const INITIAL_MEMBERS = [
  { id: "M001", name: "เธเธฒเธขเธชเธกเธเธฒเธข เนเธเธ”เธต", position: "เธเธฃเธฃเธกเธเธฒเธฃ", department: "เธชเธณเธเธฑเธเธเธฒเธเนเธซเธเน", status: "เนเธเนเธเธฒเธ" },
  { id: "M002", name: "เธเธฒเธเธชเธฒเธงเธชเธกเธซเธเธดเธ เธกเธตเธชเธธเธ", position: "เธเธฃเธฐเธเธฒเธ", department: "เธชเธณเธเธฑเธเธเธฒเธเนเธซเธเน", status: "เนเธเนเธเธฒเธ" },
  { id: "M003", name: "เธเธฒเธขเธงเธดเธเธฑเธข เธจเธฃเธตเธชเธงเธฑเธชเธ”เธดเน", position: "เธเธฃเธฃเธกเธเธฒเธฃ", department: "เธเนเธฒเธขเธเธฒเธฃเน€เธเธดเธ", status: "เนเธเนเธเธฒเธ" },
  { id: "M004", name: "เธเธฒเธเธกเธฒเธฅเธต เธฃเธฑเธเธ”เธต", position: "เน€เธฅเธเธฒเธเธธเธเธฒเธฃ", department: "เธเนเธฒเธขเธเธฒเธฃเน€เธเธดเธ", status: "เนเธเนเธเธฒเธ" },
  { id: "M005", name: "เธเธฒเธขเธเธฃเธฐเธชเธดเธ—เธเธดเน เธ”เธตเธเธฒเธก", position: "เธเธฃเธฃเธกเธเธฒเธฃ", department: "เธเนเธฒเธขเธเธฑเธ’เธเธฒเธเธธเธฃเธเธดเธ", status: "เนเธเนเธเธฒเธ" },
  { id: "M007", name: "เธเธฒเธขเธเธเธเธฃ เธเธฑเธ’เธเธฒ", position: "เธฃเธญเธเธเธฃเธฐเธเธฒเธ", department: "เธชเธณเธเธฑเธเธเธฒเธเนเธซเธเน", status: "เนเธเนเธเธฒเธ" }
];

const INITIAL_MEMBERSHIPS = [
  { id: "MS001", memberId: "M001", committeeId: "C001", role: "เธเธฃเธฃเธกเธเธฒเธฃ" },
  { id: "MS002", memberId: "M002", committeeId: "C001", role: "เธเธฃเธฐเธเธฒเธ" },
  { id: "MS003", memberId: "M003", committeeId: "C001", role: "เธเธฃเธฃเธกเธเธฒเธฃ" },
  { id: "MS005", memberId: "M005", committeeId: "C001", role: "เธเธฃเธฃเธกเธเธฒเธฃ" },
  { id: "MS007", memberId: "M007", committeeId: "C001", role: "เธฃเธญเธเธเธฃเธฐเธเธฒเธ" },
  { id: "MS004", memberId: "M004", committeeId: "C002", role: "เน€เธฅเธเธฒเธเธธเธเธฒเธฃ" }
];

const INITIAL_MEETINGS = [
  { 
    id: "MT001", 
    committeeId: "C001", 
    name: "เธเธฃเธฐเธเธธเธกเธเธ“เธฐเธญเธเธธเธเธฃเธฃเธกเธเธฒเธฃเธซเธฅเธฑเธเธเธฃเธฐเธเธฑเธเธชเธธเธเธ เธฒเธเนเธซเนเธเธเธฒเธ•เธด เน€เธเธ• 4 เธชเธฃเธฐเธเธธเธฃเธต", 
    round: "1/2569", 
    fiscalYear: "2569", 
    date: "2026-05-17", 
    startTime: "09:30", 
    endTime: "12:00", 
    place: "เธซเนเธญเธเธเธฃเธฐเธเธธเธก เธชเธเธชเธ. เน€เธเธ• 4 เธชเธฃเธฐเธเธธเธฃเธต", 
    chairId: "M002", 
    recorder: "backoffice.nhso4@gmail.com", 
    status: "เธฃเนเธฒเธ" 
  }
];

const INITIAL_ATTENDANCE: Record<string, Record<string, { status: string; type: string; note: string }>> = {
  "MT001": {
    "M001": { status: "เน€เธเนเธฒเธฃเนเธงเธก", type: "Onsite", note: "" },
    "M002": { status: "เน€เธเนเธฒเธฃเนเธงเธก", type: "Online", note: "" },
    "M003": { status: "เธฅเธฒ", type: "Onsite", note: "เธ•เธดเธ”เธ เธฒเธฃเธเธดเธเน€เธฃเนเธเธ”เนเธงเธ" }
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

  // --- เธซเธเนเธฒเธฃเธฒเธขเธเธทเนเธญเธเธ“เธฐเธเธฃเธฃเธกเธเธฒเธฃ States & Filters ---
  const [minQuorum, setMinQuorum] = useState<string>('5');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('เธ—เธฑเนเธเธซเธกเธ”');
  
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [newMemberRole, setNewMemberRole] = useState<string>('');
  const [newMemberDept, setNewMemberDept] = useState<string>('');

  // --- เธเธญเธฃเนเธกเน€เธเธดเนเธกเธ”เนเธงเธเธซเธเนเธฒเน€เธเนเธเธเธทเนเธญ ---
  const [quickName, setQuickName] = useState('');
  const [quickRole, setQuickRole] = useState('');
  const [quickDept, setQuickDept] = useState('');

  // --- เธเธฑเธ”เธเธฒเธฃเธเธฃเธฐเธเธธเธก เธเธญเธฃเนเธก ---
  const [formMeetingName, setFormMeetingName] = useState('');
  const [formRound, setFormRound] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formPlace, setFormPlace] = useState('');
  const [formCommId, setFormCommId] = useState('C001');
  const [editingMeetingId, setEditingMeetingId] = useState<string | null>(null);

  // ==========================================
  // โก เธเธฑเธเธเนเธเธฑเธเธ”เธฒเธงเธเนเนเธซเธฅเธ”เธฃเธฒเธขเธเธฒเธ Word
  // ==========================================
  const handleDownloadWord = (meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return alert("เนเธกเนเธเธเธเนเธญเธกเธนเธฅเธเธฒเธฃเธเธฃเธฐเธเธธเธก");

    const commName = committees.find(c => c.id === meeting.committeeId)?.name || "";
    const attRecords = attendance[meetingId] || {};

    const attendList: string[] = [];
    const leaveList: string[] = [];

    const commMembers = getCommitteeMembers(meeting.committeeId);
    commMembers.forEach(m => {
      const record = attRecords[m.id] || { status: 'เธฅเธฒ', type: 'Onsite', note: '' };
      if (record.status === "เน€เธเนเธฒเธฃเนเธงเธก") {
        attendList.push(`${m.name} (${record.type}) ${record.note ? `[เธซเธกเธฒเธขเน€เธซเธ•เธธ: ${record.note}]` : ''}`);
      } else {
        leaveList.push(`${m.name} ${record.note ? `(เธฅเธฒเน€เธเธฃเธฒเธฐ: ${record.note})` : '(เธฅเธฒ)'}`);
      }
    });

    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>เธฃเธฒเธขเธเธฒเธเธเธฒเธฃเธเธฑเธเธ—เธถเธเน€เธเนเธฒเธฃเนเธงเธกเธเธฃเธฐเธเธธเธก</title></head>
      <body style='font-family: "TH Sarabun New", "Arial", sans-serif; font-size: 16pt; line-height: 1.5;'>
        <div style='text-align: center; font-weight: bold; font-size: 18pt;'>เธฃเธฒเธขเธเธฒเธเธเธฅเธเธฒเธฃเธฅเธเธ—เธฐเน€เธเธตเธขเธเน€เธเนเธฒเธฃเนเธงเธกเธเธฃเธฐเธเธธเธก</div>
        <div style='text-align: center; font-weight: bold;'>เธเธ“เธฐเธญเธเธธเธเธฃเธฃเธกเธเธฒเธฃ เน€เธเธ• 4 เธชเธฃเธฐเธเธธเธฃเธต</div>
        <br/>
        <p><b>เธเธทเนเธญเธเธฒเธฃเธเธฃเธฐเธเธธเธก:</b> ${meeting.name}</p>
        <p><b>เธชเธฑเธเธเธฑเธ”เธเธ“เธฐ:</b> ${commName}</p>
        <p><b>เธเธฃเธฑเนเธเธ—เธตเนเธเธฃเธฐเธเธธเธก:</b> ${meeting.round} | <b>เธเธตเธเธเธเธฃเธฐเธกเธฒเธ“:</b> ${meeting.fiscalYear}</p>
        <p><b>เธงเธฑเธเธ—เธตเนเธเธฃเธฐเธเธธเธก:</b> ${meeting.date} | <b>เธชเธ–เธฒเธเธ—เธตเน:</b> ${meeting.place}</p>
        <hr/>
        <h3>1. เธฃเธฒเธขเธเธทเนเธญเธเธนเนเน€เธเนเธฒเธฃเนเธงเธกเธเธฃเธฐเธเธธเธก (เธเธณเธเธงเธ ${attendList.length} เธ—เนเธฒเธ)</h3>
        <ol>${attendList.map(name => `<li>${name}</li>`).join('')}</ol>
        <h3>2. เธฃเธฒเธขเธเธทเนเธญเธเธนเนเธฅเธฒเธเธฃเธฐเธเธธเธก (เธเธณเธเธงเธ ${leaveList.length} เธ—เนเธฒเธ)</h3>
        <ol>${leaveList.map(name => `<li>${name}</li>`).join('')}</ol>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `เธฃเธฒเธขเธเธฒเธเธเธฒเธฃเธเธฃเธฐเธเธธเธก_เธเธฃเธฑเนเธเธ—เธตเน_${meeting.round.replace('/', '_')}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // --- เธเธณเธเธงเธ“เธฃเธฒเธขเธเธทเนเธญเนเธฅเธฐเธเธฑเธ”เธเธฃเธญเธเธเนเธญเธกเธนเธฅเธเธ“เธฐเธเธฃเธฃเธกเธเธฒเธฃ ---
  const currentCommitteeMembers = useMemo(() => {
    const rels = memberships.filter(ms => ms.committeeId === selectedCommittee);
    const mapped = rels.map(r => {
      const info = members.find(m => m.id === r.memberId);
      return {
        membershipId: r.id,
        memberId: r.memberId,
        name: info?.name || "เนเธกเนเธ—เธฃเธฒเธเธเธทเนเธญ",
        position: r.role || info?.position || "เธเธฃเธฃเธกเธเธฒเธฃ",
        department: info?.department || "-",
        status: info?.status || "เนเธเนเธเธฒเธ"
      };
    });

    return mapped.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'เธ—เธฑเนเธเธซเธกเธ”' || m.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [memberships, selectedCommittee, members, searchQuery, statusFilter]);

  const currentCommitteeInfo = useMemo(() => {
    return committees.find(c => c.id === selectedCommittee);
  }, [committees, selectedCommittee]);

  const handleSaveQuorum = () => {
    setCommittees(prev => prev.map(c => c.id === selectedCommittee ? { ...c, quorum: Number(minQuorum) } : c));
    alert("เธเธฑเธเธ—เธถเธเธญเธเธเนเธเธฃเธฐเธเธธเธกเธเธฑเนเธเธ•เนเธณเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง");
  };

  const handleAddNewMemberToCommittee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return alert("เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธเธทเนเธญ-เธเธฒเธกเธชเธเธธเธฅ");
    const newId = `M${String(members.length + 1).padStart(3, '0')}`;
    setMembers([...members, { id: newId, name: newMemberName, position: newMemberRole || "เธเธฃเธฃเธกเธเธฒเธฃ", department: newMemberDept || "เธชเธณเธเธฑเธเธเธฒเธเนเธซเธเน", status: "เนเธเนเธเธฒเธ" }]);
    setMemberships([...memberships, { id: `MS${String(memberships.length + 1).padStart(3, '0')}`, memberId: newId, committeeId: selectedCommittee, role: newMemberRole || "เธเธฃเธฃเธกเธเธฒเธฃ" }]);
    setNewMemberName(''); setNewMemberRole(''); setNewMemberDept('');
    alert("เน€เธเธดเนเธกเธฃเธฒเธขเธเธทเนเธญเน€เธเนเธฒเธเธ“เธฐเธเธฃเธฃเธกเธเธฒเธฃเธชเธณเน€เธฃเนเธ");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fakeCSVData = [
      { name: "เธ”เธฃ.เธเธ.เธชเธธเธฃเธงเธดเธเธเน เน€เธเธฉเธกเธชเธธเธ", position: "เธเธนเนเธ—เธฃเธเธเธธเธ“เธงเธธเธ’เธด", department: "เนเธฃเธเธเธขเธฒเธเธฒเธฅเธชเธฃเธฐเธเธธเธฃเธต" },
      { name: "เธเธฒเธเธชเธธเธกเธฒเธฅเธต เธงเธเธจเนเธเธฃเธฐเน€เธชเธฃเธดเธ", position: "เธเธฃเธฃเธกเธเธฒเธฃเธเธนเนเนเธ—เธเธเธธเธกเธเธ", department: "เน€เธเธฃเธทเธญเธเนเธฒเธขเธ เธฒเธเธเธฃเธฐเธเธฒเธเธ เน€เธเธ• 4" },
      { name: "เธ เธ.เธงเธดเน€เธเธตเธขเธฃ เธเธเธเธ”เธตเธญเธเธฑเธเธ•เน", position: "เธเธฃเธฃเธกเธเธฒเธฃ", department: "เธชเธชเธ.เธเธเธ—เธเธธเธฃเธต" }
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
        status: "เนเธเนเธเธฒเธ"
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
    alert(`เธเธณเน€เธเนเธฒเนเธเธฅเน [ ${file.name} ] เธชเธณเน€เธฃเนเธ! เน€เธเธดเนเธกเธฃเธฒเธขเธเธทเนเธญเนเธซเธกเนเธเธณเธเธงเธ ${fakeCSVData.length} เธ—เนเธฒเธ เน€เธเนเธฒเธชเธนเนเธเธ“เธฐเธเธตเนเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง`);
    e.target.value = '';
  };

  const handleAddQuickMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) return alert("เธเธฃเธธเธ“เธฒเธฃเธฐเธเธธเธเธทเนเธญ-เธเธฒเธกเธชเธเธธเธฅ");
    const currentMeeting = meetings.find(m => m.id === activeMeetingId);
    if (!currentMeeting) return;

    const newId = `M_Q${Date.now()}`;
    setMembers(prev => [...prev, { id: newId, name: quickName, position: quickRole || "เธเธฃเธฃเธกเธเธฒเธฃ", department: quickDept || "เธซเธเนเธงเธขเธเธฒเธเธ เธฒเธขเธเธญเธ", status: "เนเธเนเธเธฒเธ" }]);
    setMemberships(prev => [...prev, { id: `MS_Q${Date.now()}`, memberId: newId, committeeId: currentMeeting.committeeId, role: quickRole || "เธเธฃเธฃเธกเธเธฒเธฃ" }]);
    
    setAttendance(prev => ({
      ...prev,
      [activeMeetingId]: {
        ...(prev[activeMeetingId] || {}),
        [newId]: { status: "เน€เธเนเธฒเธฃเนเธงเธก", type: "Onsite", note: "" }
      }
    }));

    setQuickName(''); setQuickRole(''); setQuickDept('');
    alert("เน€เธเธดเนเธกเธเธทเนเธญเธญเธเธธเธเธฃเธฃเธกเธเธฒเธฃเน€เธเนเธฒเธ•เธฒเธฃเธฒเธเน€เธเนเธเธเธทเนเธญเธเธฑเธเธเธธเธเธฑเธเธชเธณเน€เธฃเนเธ");
  };

  const getCommitteeMembers = (cId: string) => {
    const rels = memberships.filter(ms => ms.committeeId === cId);
    return rels.map(r => {
      const info = members.find(m => m.id === r.memberId);
      return {
        id: r.memberId,
        name: info?.name || "เนเธกเนเธ—เธฃเธฒเธเธเธทเนเธญ",
        department: info?.department || "-",
        role: r.role
      };
    });
  };

  const handleCreateOrUpdateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRound || !formDate || !formMeetingName.trim()) return alert("เธเธฃเธธเธ“เธฒเธเธฃเธญเธเธเนเธญเธกเธนเธฅเนเธซเนเธเธฃเธเธ–เนเธงเธ");

    if (editingMeetingId) {
      setMeetings(prev => prev.map(m => m.id === editingMeetingId ? { ...m, committeeId: formCommId, name: formMeetingName, round: formRound, date: formDate, place: formPlace || "เธซเนเธญเธเธเธฃเธฐเธเธธเธก เธชเธเธชเธ. เน€เธเธ• 4" } : m));
      alert("เนเธเนเนเธเธเนเธญเธกเธนเธฅเธเธฒเธฃเธเธฃเธฐเธเธธเธกเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง");
      setEditingMeetingId(null);
    } else {
      const nextId = `MT${String(meetings.length + 1).padStart(3, '0')}`;
      setMeetings([...meetings, { id: nextId, committeeId: formCommId, name: formMeetingName, round: formRound, fiscalYear: fiscalYear, date: formDate, startTime: "09:30", endTime: "12:00", place: formPlace || "เธซเนเธญเธเธเธฃเธฐเธเธธเธก เธชเธเธชเธ. เน€เธเธ• 4 เธชเธฃเธฐเธเธธเธฃเธต", chairId: "M002", recorder: "backoffice.nhso4@gmail.com", status: "เธฃเนเธฒเธ" }]);
      setActiveMeetingId(nextId);
      alert(`เธชเธฃเนเธฒเธเธเธณเธซเธเธ”เธเธฒเธฃเธฃเธซเธฑเธช ${nextId} เธชเธณเน€เธฃเนเธ`);
      setCurrentTab('check_attendance');
    }
    setFormMeetingName(''); setFormRound(''); setFormDate(''); setFormPlace('');
  };

  const handleEditClick = (meeting: any) => {
    setEditingMeetingId(meeting.id); setFormCommId(meeting.committeeId); setFormMeetingName(meeting.name); setFormRound(meeting.round); setFormDate(meeting.date); setFormPlace(meeting.place);
  };

  const handleDeleteMeeting = (meetingId: string) => {
    if (confirm("เธเธธเธ“เธ•เนเธญเธเธเธฒเธฃเธฅเธเธฃเธฒเธขเธเธฒเธฃเธเธฃเธฐเธเธธเธกเธเธตเนเนเธเนเธซเธฃเธทเธญเนเธกเน?")) {
      setMeetings(prev => prev.filter(m => m.id !== meetingId));
      alert("เธฅเธเธเนเธญเธกเธนเธฅเธเธฒเธฃเธเธฃเธฐเธเธธเธกเน€เธฃเธตเธขเธเธฃเนเธญเธข");
    }
  };

  // --- เธเธณเธเธงเธ“เธชเธ–เธดเธ•เธดเน€เธเธทเนเธญเธเธณเธกเธฒเธเธฑเธ”เธเธญเธฃเนเธ”เธ•เธฒเธกเธซเธเนเธฒ เธ เธฒเธเธฃเธงเธก (1.jpg) 100% ---
  const dynamicStats = useMemo(() => {
    let filtered = meetings.filter(m => m.fiscalYear === fiscalYear);
    let total = filtered.length;
    let onsite = 0, online = 0, leave = 0;
    
    filtered.forEach(m => {
      const records = attendance[m.id] || {};
      Object.values(records).forEach(r => {
        if (r.status === "เน€เธเนเธฒเธฃเนเธงเธก") {
          if (r.type === "Onsite") onsite++;
          if (r.type === "Online") online++;
        }
        if (r.status === "เธฅเธฒ") leave++;
      });
    });
    
    // เธเธณเธเธงเธ“เธชเธ–เธดเธ•เธดเธชเธฐเธชเธกเธ เธฒเธเธฃเธงเธกเธ—เธฑเนเธเธซเธกเธ”เนเธเธเธฒเธเธเนเธญเธกเธนเธฅ
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
      const record = records[m.id] || { status: 'เธเธฒเธ”', type: 'Onsite' };
      if (record.status === 'เน€เธเนเธฒเธฃเนเธงเธก') {
        totalJoined++;
        if (record.type === 'Onsite') totalOnsite++;
        if (record.type === 'Online') totalOnline++;
      } else if (record.status === 'เธฅเธฒ') {
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
      statusText: isQuorumComplete ? "เธเธฃเธเธญเธเธเนเธเธฃเธฐเธเธธเธก" : "เธขเธฑเธเนเธกเนเธเธฃเธเธญเธเธเนเธเธฃเธฐเธเธธเธก"
    };
  }, [activeMeetingId, meetings, attendance, committees]);

  const handleRemoveMemberFromCommittee = (mId: string) => {
    if (confirm("เธเธธเธ“เธ•เนเธญเธเธเธฒเธฃเธฅเธเธฃเธฒเธขเธเธทเนเธญเธเธตเนเธญเธญเธเธเธฒเธเธเธ“เธฐเธเธฃเธฃเธกเธเธฒเธฃเนเธเนเธซเธฃเธทเธญเนเธกเน?")) {
      setMemberships(prev => prev.filter(ms => ms.id !== mId));
      alert("เธฅเธเธญเธญเธเธเธฒเธเธเธ“เธฐเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธง");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f4f6f8] text-slate-800 antialiased font-sans text-sm">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0f172a] text-slate-200 flex flex-col fixed h-full z-20 shadow-xl">
        <div className="p-4 bg-[#1e293b] border-b border-slate-800 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center font-bold text-white text-sm">NH4</div>
          <div>
            <div className="text-xs font-bold text-slate-100 tracking-tight">เธฃเธฐเธเธเธฅเธเธ—เธฐเน€เธเธตเธขเธเน€เธเนเธฒเธฃเนเธงเธกเธเธฃเธฐเธเธธเธก</div>
            <div className="text-[11px] text-blue-400 font-semibold tracking-wider">เธเธ“เธฐเธญเธเธธเธเธฃเธฃเธกเธเธฒเธฃ เน€เธเธ• 4 เธชเธฃเธฐเธเธธเธฃเธต</div>
          </div>
        </div>
        
        <nav className="flex-1 p-3 space-y-1">
          {[
            { id: 'dashboard', label: 'เธ เธฒเธเธฃเธงเธก', icon: Home },
            { id: 'manage_meetings', label: 'เธเธฒเธฃเธเธฃเธฐเธเธธเธก', icon: Calendar },
            { id: 'manage_committees', label: 'เธฃเธฒเธขเธเธทเนเธญเธเธ“เธฐ', icon: Users },
            { id: 'check_attendance', label: 'เน€เธเนเธเธเธทเนเธญ', icon: CheckSquare },
            { id: 'generate_report', label: 'เธฃเธฒเธขเธเธฒเธ Word', icon: FileText },
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
            เธเธนเนเธเธฑเธเธ—เธถเธ: <strong className="text-slate-800">admin@nhso.go.th</strong>
          </span>
        </div>

        {/* ---------------- VIEW: DASHBOARD (เธเธฃเธฑเธเนเธเธฃเธเธชเธฃเนเธฒเธเธ•เธฒเธกเธ เธฒเธ 1.jpg 100%) ---------------- */}
        {currentTab === 'dashboard' && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">เธ เธฒเธเธฃเธงเธกเธเนเธญเธกเธนเธฅเธเธฒเธฃเน€เธเนเธฒเธเธฃเธฐเธเธธเธก</h2>
            </div>

            {/* เธเธฒเธฃเนเธเนเธ Grid เธเนเธฒเธข-เธเธงเธฒ เนเธเธเนเธเธ เธฒเธ 1.jpg */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5๐“">
              
              {/* เธเธฑเนเธเธเนเธฒเธข: เธเธฅเธธเนเธกเธเธฒเธฃเนเธ”เนเธชเธ”เธเธ•เธฑเธงเน€เธฅเธเธชเธ–เธดเธ•เธดเธเธฒเธฃเธเธฃเธฐเธเธธเธกเธซเธฅเธฑเธ (3 เธชเนเธงเธเธขเนเธญเธข) */}
              <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4 h-fit">
                <div className="p-5 rounded-xl border bg-blue-50 border-blue-200 text-blue-700 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider block opacity-75">เธเธฒเธฃเธเธฃเธฐเธเธธเธกเธ—เธฑเนเธเธซเธกเธ”</span>
                  <span className="text-3xl font-black mt-3 block">{dynamicStats.total} <span className="text-sm font-medium opacity-80">เธเธฃเธฑเนเธ</span></span>
                </div>

                <div className="p-5 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider block opacity-75">เธกเธฒเธเธฃเธฐเธเธธเธก ( Onsite )</span>
                  <span className="text-3xl font-black mt-3 block">{dynamicStats.onsite} <span className="text-sm font-medium opacity-80">เธเธ</span></span>
                </div>

                <div className="p-5 rounded-xl border bg-sky-50 border-sky-200 text-sky-700 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider block opacity-75">เธกเธฒเธเธฃเธฐเธเธธเธก ( Online )</span>
                  <span className="text-3xl font-black mt-3 block">{dynamicStats.online} <span className="text-sm font-medium opacity-80">เธเธ</span></span>
                </div>
              </div>

              {/* เธเธฑเนเธเธเธงเธฒ: เธเธฅเนเธญเธเนเธชเธ”เธเธชเธ–เธดเธ•เธดเธชเธฐเธชเธกเธฃเธฐเธเธ (เธเธฅเนเธญเธเธชเธตเธเธฒเธงเธเธงเธฒเธชเธธเธ”เธ•เธฒเธกเธ เธฒเธ 1.jpg) */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-full space-y-4">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-1.5">เธชเธ–เธดเธ•เธดเธชเธฐเธชเธกเธฃเธฐเธเธ</div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold text-xs">เธเธ“เธฐเธญเธเธธเธเธฃเธฃเธกเธเธฒเธฃเธ—เธฑเนเธเธซเธกเธ”:</span>
                  <span className="text-base font-bold text-slate-800">{dynamicStats.totalAllCommittees} เธเธ“เธฐ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold text-xs">เธฃเธฒเธขเธเธทเนเธญเธเธฃเธฃเธกเธเธฒเธฃเธฃเธงเธก:</span>
                  <span className="text-base font-bold text-slate-800">{dynamicStats.totalAllMembers} เธ—เนเธฒเธ</span>
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
                <Plus size={16} className="text-blue-600" /> {editingMeetingId ? 'เนเธเนเนเธเธเนเธญเธกเธนเธฅเธเธฒเธฃเธเธฃเธฐเธเธธเธก' : 'เธเธฑเธ”เธซเธกเธฒเธขเน€เธเธดเนเธกเธฃเธญเธเนเธซเธกเน'}
              </div>
              <form onSubmit={handleCreateOrUpdateMeeting} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">เธเธทเนเธญเธฃเธฒเธขเธเธฒเธฃเธเธฃเธฐเธเธธเธกเธเธ“เธฐเธเธฃเธฃเธกเธเธฒเธฃ</label>
                  <input type="text" required placeholder="เน€เธเนเธ เธเธฃเธฐเธเธธเธกเธเธ“เธฐเธญเธเธธเธเธฃเธฃเธกเธเธฒเธฃเธฏ" value={formMeetingName} onChange={(e) => setFormMeetingName(e.target.value)} className="w-full border border-slate-200 text-sm rounded-xl p-2.5 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">เน€เธฅเธทเธญเธเธชเธฑเธเธเธฑเธ”เธเธธเธ”เธเธ“เธฐเธญเธเธธเธเธฃเธฃเธกเธเธฒเธฃ</label>
                  <select value={formCommId} onChange={(e) => setFormCommId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl p-2.5">
                    {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">เธเธฃเธฑเนเธเธ—เธตเนเธเธฑเธ”</label>
                  <input type="text" required placeholder="เน€เธเนเธ 1/2569" value={formRound} onChange={(e) => setFormRound(e.target.value)} className="w-full border border-slate-200 text-sm rounded-xl p-2.5 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">เธงเธฑเธเธ—เธตเนเธเธฃเธฐเธเธธเธก</label>
                  <input type="date" required value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full border border-slate-200 text-sm rounded-xl p-2.5" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">เธชเธ–เธฒเธเธ—เธตเนเธเธฑเธ”เธเธฃเธฐเธเธธเธก</label>
                  <input type="text" placeholder="เธฃเธฐเธเธธเธซเนเธญเธเธเธฃเธฐเธเธธเธก เธชเธเธชเธ." value={formPlace} onChange={(e) => setFormPlace(e.target.value)} className="w-full border border-slate-200 text-sm rounded-xl p-2.5" />
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-2.5 rounded-xl transition-all">
                  {editingMeetingId ? 'เธเธฑเธเธ—เธถเธเธเธฒเธฃเนเธเนเนเธ' : 'เธชเธฃเนเธฒเธเธเธณเธซเธเธ”เธเธฒเธฃเธเธฃเธฐเธเธธเธก'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 overflow-hidden">
              <div className="font-bold text-sm text-slate-800 pb-3 border-b">เธฃเธฒเธขเธเธฒเธฃเธเธฑเธ”เธซเธกเธฒเธขเธเธฒเธฃเธเธฃเธฐเธเธธเธกเนเธเธฃเธฐเธเธ</div>
              <table className="w-full text-left text-sm mt-2">
                <thead className="bg-slate-50 text-slate-400 font-bold">
                  <tr>
                    <th className="p-3">เธเธทเนเธญเธเธฒเธฃเธเธฃเธฐเธเธธเธก / เธเธฃเธฑเนเธเธ—เธตเน</th>
                    <th className="p-3">เธงเธฑเธเธ—เธตเนเธเธฑเธ”</th>
                    <th className="p-3 text-center w-32">เธเธฑเธ”เธเธฒเธฃ</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-medium text-slate-700">
                  {meetings.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/50">
                      <td className="p-3">
                        <div className="font-bold text-slate-900 text-sm">{m.name}</div>
                        <div className="text-xs text-blue-500 font-bold mt-1">เธเธฃเธฑเนเธเธ—เธตเน: {m.round}</div>
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

        {/* ---------------- VIEW: เธฃเธฒเธขเธเธทเนเธญเธเธ“เธฐ ---------------- */}
        {currentTab === 'manage_committees' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">เธฃเธฒเธขเธเธทเนเธญเธเธ“เธฐเธเธฃเธฃเธกเธเธฒเธฃ</h2>
              <p className="text-slate-400 text-xs mt-0.5">เธเธฑเธ”เธเธฒเธฃเธชเธกเธฒเธเธดเธเนเธฅเธฐเธญเธเธเนเธเธฃเธฐเธเธธเธกเธเธญเธเนเธ•เนเธฅเธฐเธเธ“เธฐ</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">เน€เธฅเธทเธญเธเธเธ“เธฐเธเธฃเธฃเธกเธเธฒเธฃ</label>
                <select value={selectedCommittee} onChange={(e) => { setSelectedCommittee(e.target.value); const comm = committees.find(c => c.id === e.target.value); if (comm) setMinQuorum(String(comm.quorum)); }} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-semibold text-slate-700 text-sm focus:outline-none">
                  {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">เธญเธเธเนเธเธฃเธฐเธเธธเธกเธเธฑเนเธเธ•เนเธณ</label>
                <input type="number" value={minQuorum} onChange={(e) => setMinQuorum(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center text-sm focus:outline-none" />
              </div>
              <button type="button" onClick={handleSaveQuorum} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-2.5 px-5 rounded-lg transition-colors w-fit">เธเธฑเธเธ—เธถเธเธญเธเธเนเธเธฃเธฐเธเธธเธก</button>
            </div>

            <form onSubmit={handleAddNewMemberToCommittee} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">เธเธทเนเธญ-เธเธฒเธกเธชเธเธธเธฅ</label>
                <input type="text" placeholder="เธเธทเนเธญ-เธเธฒเธกเธชเธเธธเธฅ" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">เธ•เธณเนเธซเธเนเธ</label>
                <input type="text" placeholder="เน€เธเนเธ เธเธฃเธฃเธกเธเธฒเธฃ" value={newMemberRole} onChange={(e) => setNewMemberRole(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">เธซเธเนเธงเธขเธเธฒเธ</label>
                <input type="text" placeholder="เธซเธเนเธงเธขเธเธฒเธ" value={newMemberDept} onChange={(e) => setNewMemberDept(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none" />
              </div>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-2.5 px-5 rounded-lg transition-colors w-fit">เน€เธเธดเนเธกเน€เธเนเธฒเธเธ“เธฐ</button>
            </form>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="เธเนเธเธซเธฒเธฃเธฒเธขเธเธทเนเธญ..." 
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
                  <option value="เธ—เธฑเนเธเธซเธกเธ”">เธ—เธฑเนเธเธซเธกเธ”</option>
                  <option value="เนเธเนเธเธฒเธ">เนเธเนเธเธฒเธ</option>
                  <option value="เธฃเธฐเธเธฑเธ">เธฃเธฐเธเธฑเธ</option>
                </select>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50/50 border-b border-slate-200 font-bold text-slate-800 text-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="text-slate-800 font-bold max-w-xl truncate">{currentCommitteeInfo?.name || 'เธเธ“เธฐเธเธฃเธฃเธกเธเธฒเธฃ'}</div>
                <div className="flex items-center gap-3 shrink-0 ml-auto sm:ml-0">
                  <span className="bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-3 py-1 text-xs font-bold">{currentCommitteeMembers.length} เธเธ</span>
                  <label className="inline-flex items-center gap-2 bg-[#107c41] hover:bg-[#0b592e] text-white font-bold text-xs py-2 px-4 rounded-lg transition-all shadow-sm cursor-pointer select-none">
                    <FileSpreadsheet size={15} />
                    <span>Import เธฃเธฒเธขเธเธทเนเธญเธเธฃเธฃเธกเธเธฒเธฃ (CSV)</span>
                    <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 font-bold text-slate-400 border-b text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-3.5">เธเธทเนเธญ-เธเธฒเธกเธชเธเธธเธฅ</th>
                      <th className="p-3.5">เธ•เธณเนเธซเธเนเธ</th>
                      <th className="p-3.5">เธซเธเนเธงเธขเธเธฒเธ</th>
                      <th className="p-3.5 text-center w-36">เธเธฑเธ”เธเธฒเธฃ</th>
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
                            <button type="button" onClick={() => handleRemoveMemberFromCommittee(m.membershipId)} className="border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-xs font-bold py-1.5 px-3 rounded-lg transition-all text-slate-600">เธฅเธเธญเธญเธเธเธฒเธเธเธ“เธฐ</button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400 font-medium bg-slate-50/20">เนเธกเนเธเธเธเนเธญเธกเธนเธฅเธฃเธฒเธขเธเธทเนเธญเธเธ“เธฐเธเธฃเธฃเธกเธเธฒเธฃเธ—เธตเนเธเนเธเธซเธฒ</td>
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
              <label className="text-xs font-bold text-slate-400 uppercase">เน€เธฅเธทเธญเธเธเธฒเธฃเธเธฃเธฐเธเธธเธก</label>
              <select value={activeMeetingId} onChange={(e) => setActiveMeetingId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 p-2.5 rounded-xl focus:outline-none">
                {meetings.map(m => <option key={m.id} value={m.id}>{m.name} (เธเธฃเธฑเนเธเธ—เธตเน {m.round})</option>)}
              </select>
            </div>

            <form onSubmit={handleAddQuickMember} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-end gap-3">
              <div className="flex-1 w-full">
                <label className="block text-xs font-bold text-slate-400 mb-1">เธเธทเนเธญ-เธเธฒเธกเธชเธเธธเธฅ</label>
                <input type="text" placeholder="เธเธฃเธญเธเธเธทเนเธญ-เธเธฒเธกเธชเธเธธเธฅ" value={quickName} onChange={(e) => setQuickName(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none" />
              </div>
              <div className="w-full md:w-48">
                <label className="block text-xs font-bold text-slate-400 mb-1">เธ•เธณเนเธซเธเนเธ</label>
                <input type="text" placeholder="เธ•เธณเนเธซเธเนเธ" value={quickRole} onChange={(e) => setQuickRole(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none" />
              </div>
              <div className="w-full md:w-56">
                <label className="block text-xs font-bold text-slate-400 mb-1">เธซเธเนเธงเธขเธเธฒเธ</label>
                <input type="text" placeholder="เธซเธเนเธงเธขเธเธฒเธเธ—เธตเนเธชเธฑเธเธเธฑเธ”" value={quickDept} onChange={(e) => setQuickDept(e.target.value)} className="w-full border border-slate-200 rounded-lg p-2 text-sm focus:outline-none" />
              </div>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-2 px-6 rounded-lg transition-colors w-full md:w-auto h-[38px] flex items-center justify-center gap-1.5"><Plus size={16} /> เน€เธเธดเนเธกเธฃเธฒเธขเธเธทเนเธญ</button>
            </form>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase block">เน€เธเนเธฒเธฃเนเธงเธก</span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">{activeAttendanceStats.joined} <span className="text-xs font-medium text-slate-400">เธเธ</span></span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase block">เธฅเธฒ</span>
                <span className="text-2xl font-black text-amber-500 mt-1 block">{activeAttendanceStats.leave} <span className="text-xs font-medium text-slate-400">เธเธ</span></span>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase block">online / onsite</span>
                <div className="text-sm font-bold text-slate-700 mt-2 flex justify-between">
                  <span>Onsite: <strong className="text-blue-600 text-base">{activeAttendanceStats.onsite}</strong></span>
                  <span>Online: <strong className="text-sky-500 text-base">{activeAttendanceStats.online}</strong></span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <span className="text-xs font-bold text-slate-400 uppercase block">เธชเธ–เธฒเธเธฐเธญเธเธเนเธเธฃเธฐเธเธธเธก</span>
                <span className={`text-base font-black mt-2 block ${activeAttendanceStats.joined >= activeAttendanceStats.quorumLimit ? 'text-emerald-600' : 'text-rose-600'}`}>{activeAttendanceStats.statusText}<span className="text-xs font-normal text-slate-400 block mt-0.5">(เน€เธเธ“เธ‘เนเธเธฑเนเธเธ•เนเธณ {activeAttendanceStats.quorumLimit} เธเธ)</span></span>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 font-bold text-slate-500 border-b text-xs">
                  <tr>
                    <th className="p-3.5">เธเธทเนเธญเธเธฃเธฃเธกเธเธฒเธฃ / เธซเธเนเธงเธขเธเธฒเธ</th>
                    <th className="p-3.5 w-44">เธ•เธณเนเธซเธเนเธ</th>
                    <th className="p-3.5 text-center w-48">เธชเธ–เธฒเธเธฐ</th>
                    <th className="p-3.5 text-center w-36">เธเธฃเธฐเน€เธ เธ— (Hybrid)</th>
                    <th className="p-3.5 w-64">เธซเธกเธฒเธขเน€เธซเธ•เธธ</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-medium text-sm">
                  {getCommitteeMembers(meetings.find(m => m.id === activeMeetingId)?.committeeId || '').map((m) => {
                    const currentRecord = attendance[activeMeetingId]?.[m.id] || { status: 'เน€เธเนเธฒเธฃเนเธงเธก', type: 'Onsite', note: '' };
                    const updateField = (field: 'status' | 'type' | 'note', value: string) => {
                      const currentMeetingAtt = attendance[activeMeetingId] || {};
                      const oldObj = currentMeetingAtt[m.id] || { status: 'เน€เธเนเธฒเธฃเนเธงเธก', type: 'Onsite', note: '' };
                      setAttendance({ ...attendance, [activeMeetingId]: { ...currentMeetingAtt, [m.id]: { ...oldObj, [field]: value } } });
                    };

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-800 text-sm">{m.name}</div>
                          <div className="text-xs text-slate-400 font-normal mt-0.5">{m.department}</div>
                        </td>
                        <td className="p-3.5 text-slate-600 font-semibold text-xs">{m.role || 'เธเธฃเธฃเธกเธเธฒเธฃ'}</td>
                        <td className="p-3.5 text-center">
                          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 gap-0.5">
                            <button type="button" onClick={() => updateField('status', 'เน€เธเนเธฒเธฃเนเธงเธก')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${currentRecord.status === 'เน€เธเนเธฒเธฃเนเธงเธก' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>เน€เธเนเธฒเธฃเนเธงเธก</button>
                            <button type="button" onClick={() => updateField('status', 'เธฅเธฒ')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${currentRecord.status === 'เธฅเธฒ' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>เธฅเธฒ</button>
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <select value={currentRecord.type} onChange={(e) => updateField('type', e.target.value)} disabled={currentRecord.status === 'เธฅเธฒ'} className="bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-700 w-28 text-center focus:outline-none disabled:opacity-50">
                            <option value="Onsite">Onsite</option>
                            <option value="Online">Online</option>
                          </select>
                        </td>
                        <td className="p-3.5">
                          <input type="text" placeholder="เธเธดเธกเธเนเธเนเธญเธเธงเธฒเธกเธเธฑเธเธ—เธถเธ / เธฅเธฒเน€เธเธฃเธฒเธฐ..." value={currentRecord.note || ''} onChange={(e) => updateField('note', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-medium focus:bg-white focus:outline-none" />
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
          <div className="max-w-md mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4 my-8">
            <FileSpreadsheet size={44} className="text-blue-600 mx-auto bg-blue-50 p-2.5 rounded-xl" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">เน€เธเธฃเธทเนเธญเธเธกเธทเธญเธชเนเธเธญเธญเธเธเธฃเธฐเธงเธฑเธ•เธดเธฃเธฒเธขเธเธฒเธเน€เธเนเธฒเธเธฃเธฐเธเธธเธก</h3>
              <p className="text-xs text-slate-400 mt-1">เธ”เธฒเธงเธเนเนเธซเธฅเธ”เน€เธญเธเธชเธฒเธฃเธชเธฃเธธเธเธเธฅเธญเธดเธเธ•เธฒเธกเธชเธ–เธฒเธเธฐเธ—เธตเนเธเธฑเธเธ—เธถเธเธเธฃเธดเธเนเธเน€เธกเธเธนเน€เธเนเธเธเธทเนเธญ</p>
            </div>
            <div className="text-left">
              <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">เน€เธฅเธทเธญเธเธฃเธฒเธขเธเธฒเธฃเธฃเธญเธเธเธฃเธฐเธเธธเธก</label>
              <select value={activeMeetingId} onChange={(e) => setActiveMeetingId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-sm font-semibold p-2.5 rounded-xl">
                {meetings.map(m => <option key={m.id} value={m.id}>{m.name} (เธเธฃเธฑเนเธเธ—เธตเน {m.round})</option>)}
              </select>
            </div>
            <button onClick={() => handleDownloadWord(activeMeetingId)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"><Download size={16} /> เธ”เธฒเธงเธเนเนเธซเธฅเธ”เธฃเธฒเธขเธเธฒเธ Microsoft Word (.doc)</button>
          </div>
        )}

      </div>
    </div>
  );
}