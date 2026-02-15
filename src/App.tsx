import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  FileImage, 
  CheckCircle2, 
  Clock, 
  Download, 
  MessageSquare, 
  ChevronRight,
  Video,
  Image as ImageIcon,
  Menu,
  X,
  PieChart,
  ThumbsUp,
  AlertCircle,
  Plus,
  UserCircle,
  Building2,
  Upload,
  Edit3,
  Link as LinkIcon,
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  CalendarDays,
  LogOut,
  Lock,
  Trash2
} from 'lucide-react';

/* CATATAN KEAMANAN:
  Aplikasi ini berjalan sepenuhnya offline-first di browser.
  - Tidak ada panggilan API ke Google (Sheets/Drive).
  - Tidak ada database backend.
  - Upload file diproses secara lokal menggunakan blob URL.
*/

// --- Mock Data ---
const BRANDS = [
  { id: 'dconsul', name: 'Dconsul', logo: 'DC', color: 'bg-blue-600', target: 11 },
  { id: 'd2d', name: 'D2D', logo: 'D2', color: 'bg-emerald-600', target: 4 }
];

interface Task {
  id: number;
  brandId: string;
  title: string;
  type: string;
  date: string;
  status: string;
  visualDueDate: string;
  script: string;
  source: string;
  fileLink: string;
  caption: string;
  feedback: string;
  clientNotes: string;
  image: string | null;
}

const INITIAL_TASKS: Task[] = [
  {
    id: 1,
    brandId: 'dconsul',
    title: 'Tips Pajak Tahunan untuk UMKM',
    type: 'Reels',
    date: '2023-10-05',
    status: 'video_done', 
    visualDueDate: '2023-09-25', 
    script: 'Scene 1: Host masuk frame, bawa tumpukan kertas. \nScene 2: Text overlay "Pusing lapor pajak?". \nScene 3: Host senyum, tunjuk aplikasi.',
    source: 'UU PPh Terbaru',
    fileLink: 'https://example.com/file-final-v1',
    caption: 'Sudah lapor pajak? Jangan sampai telat ya! Berikut tips mudahnya...',
    feedback: '',
    clientNotes: '', 
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=300&h=200'
  },
  {
    id: 2,
    brandId: 'dconsul',
    title: 'Testimoni Klien - PT Maju Jaya',
    type: 'Feed',
    date: '2023-10-07',
    status: 'wording_approve',
    visualDueDate: '2023-09-30',
    script: 'Slide 1: Foto Klien & Logo. \nSlide 2: Quote testimoni. \nSlide 3: Call to Action.',
    source: 'Wawancara Client tgl 1 Okt',
    fileLink: '',
    caption: 'Terima kasih PT Maju Jaya atas kepercayaannya...',
    feedback: 'Tolong logo digedein dikit ya.',
    clientNotes: 'Logo di slide 1 kurang besar.',
    image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=300&h=200'
  },
  {
    id: 3,
    brandId: 'dconsul',
    title: 'QnA: Apa itu Konsultan Pajak?',
    type: 'Reels',
    date: '2023-10-10',
    status: 'need_approval',
    visualDueDate: '',
    script: 'Host duduk santai. Q: Apa sih konsultan pajak? A: Teman bisnis kamu!',
    source: 'Internal Knowledge Base',
    fileLink: '',
    caption: 'Banyak yang tanya, sebenernya ngapain aja sih konsultan pajak?',
    feedback: '',
    clientNotes: '',
    image: null
  },
  {
    id: 4,
    brandId: 'dconsul',
    title: 'Infografis PPh 21',
    type: 'Feed',
    date: '2023-10-15',
    status: 'draft',
    visualDueDate: '',
    script: '',
    source: '',
    fileLink: '',
    caption: '',
    feedback: '',
    clientNotes: '',
    image: null
  }
];

// --- Helper Functions ---

const calculateWordingDeadline = (taskDateStr: string) => {
  if (!taskDateStr || taskDateStr === 'To be decided') return null;
  const date = new Date(taskDateStr);
  date.setMonth(date.getMonth() - 1);
  date.setDate(15);
  return date.toISOString().split('T')[0];
};

// --- Helper Components ---

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { label: string; color: string }> = {
    draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600' },
    need_approval: { label: 'Need Approval', color: 'bg-yellow-100 text-yellow-700' },
    wording_approve: { label: 'Wording Approve', color: 'bg-blue-100 text-blue-700' },
    illustration_done: { label: 'Illustration Done', color: 'bg-purple-100 text-purple-700' },
    video_done: { label: 'Video Done', color: 'bg-purple-100 text-purple-700' },
    posted: { label: 'Posted', color: 'bg-green-100 text-green-700' },
  };

  const current = config[status] || config.draft;

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${current.color}`}>
      {current.label}
    </span>
  );
};

const TypeIcon = ({ type }: { type: string }) => {
  return type === 'Reels' ? (
    <div className="flex items-center gap-1 text-pink-600 bg-pink-50 px-2 py-0.5 rounded text-xs font-medium border border-pink-100">
      <Video size={12} /> Reels
    </div>
  ) : (
    <div className="flex items-center gap-1 text-purple-600 bg-purple-50 px-2 py-0.5 rounded text-xs font-medium border border-purple-100">
      <ImageIcon size={12} /> Feed
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  // Login State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState('client'); // 'client' or 'agency'
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // App State
  const [activeBrandId, setActiveBrandId] = useState('dconsul');
  const [activeTab, setActiveTab] = useState('dashboard'); 
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date(2023, 9, 1)); 
  
  const [newTaskData, setNewTaskData] = useState({ 
    title: '', type: 'Feed', date: '', script: '', source: '', caption: '', fileLink: '', image: null as string | null, visualDueDate: ''
  });

  const activeBrand = BRANDS.find(b => b.id === activeBrandId) || BRANDS[0];
  const filteredTasks = useMemo(() => tasks.filter(t => t.brandId === activeBrandId), [tasks, activeBrandId]);

  const totalTarget = activeBrand.target;
  const completed = filteredTasks.filter(t => t.status === 'posted').length;
  const progress = Math.round((completed / totalTarget) * 100);
  const pendingReview = filteredTasks.filter(t => t.status === 'need_approval').length;

  // --- Login Handlers ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const { username, password } = loginForm;

    // Hardcoded auth - no API calls
    if (username === 'agency' && password === 'agency') {
      setUserRole('agency');
      setIsAuthenticated(true);
      setLoginError('');
    } else if (username === 'client' && password === 'client') {
      setUserRole('client');
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Username atau Password salah!');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('client');
    setLoginForm({ username: '', password: '' });
    setActiveTab('dashboard');
  };

  // --- Task Handlers ---

  const handleDeleteTask = (taskId: number) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(null);
    }
  };

  const handleMarkDone = (taskId: number, type: string) => {
    if (userRole !== 'agency') return;
    const nextStatus = type === 'Reels' ? 'video_done' : 'illustration_done';
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: nextStatus, image: t.image || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=300&h=200' } : t));
    
    // Also update selected task if it's open
    if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(prev => prev ? ({ ...prev, status: nextStatus, image: prev.image || 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=300&h=200' }) : null);
    }
  };

  const handleMarkPosted = (taskId: number) => {
     setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'posted' } : t));
     
     // Also update selected task if it's open
     if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(prev => prev ? ({ ...prev, status: 'posted' }) : null);
     }
  };

  // Handles file uploads strictly within the browser
  const handleFileUpload = (taskId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Creates a temporary local URL for the file
      const imageUrl = URL.createObjectURL(file);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, image: imageUrl } : t));
      if(selectedTask && selectedTask.id === taskId) {
        setSelectedTask(prev => prev ? ({ ...prev, image: imageUrl }) : null);
      }
    }
  };

  const handleNewTaskFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setNewTaskData(prev => ({ ...prev, image: imageUrl }));
    }
  };

  const handleClientStatusChange = (taskId: number, newStatus: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    if(selectedTask && selectedTask.id === taskId) {
        setSelectedTask(prev => prev ? ({ ...prev, status: newStatus }) : null);
    }
  };

  const handleTaskUpdate = (taskId: number, field: string, value: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, [field]: value } : t));
    if(selectedTask && selectedTask.id === taskId) {
        setSelectedTask(prev => prev ? ({ ...prev, [field]: value }) : null);
    }
  };

  const handleDueDateChange = (taskId: number, newDate: string) => {
    handleTaskUpdate(taskId, 'visualDueDate', newDate);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === 'files') {
      const newTask: Task = {
        id: Date.now(),
        brandId: activeBrandId,
        title: newTaskData.title,
        type: 'Feed',
        date: new Date().toISOString().split('T')[0],
        script: '', source: '', caption: '', feedback: '', clientNotes: '', image: null,
        fileLink: newTaskData.fileLink,
        status: 'draft',
        visualDueDate: ''
      };
      setTasks([newTask, ...tasks]);
    } else {
      const newTask: Task = {
        id: Date.now(),
        brandId: activeBrandId,
        title: newTaskData.title,
        type: newTaskData.type,
        date: newTaskData.date || 'To be decided',
        script: newTaskData.script,
        source: newTaskData.source,
        caption: newTaskData.caption,
        fileLink: newTaskData.fileLink,
        status: 'need_approval',
        feedback: '',
        clientNotes: '',
        image: newTaskData.image,
        visualDueDate: newTaskData.visualDueDate 
      };
      setTasks([newTask, ...tasks]);
    }
    
    setIsAddTaskOpen(false);
    setNewTaskData({ title: '', type: 'Feed', date: '', script: '', source: '', caption: '', fileLink: '', image: null, visualDueDate: '' });
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-slate-50 border border-slate-100"></div>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayTasks = filteredTasks.filter(t => t.date === dateStr);
      
      days.push(
        <div key={day} className="h-24 border border-slate-100 bg-white p-2 overflow-y-auto hover:bg-slate-50 transition-colors">
          <div className="text-xs font-bold text-slate-400 mb-1">{day}</div>
          <div className="space-y-1">
            {dayTasks.map(task => (
              <button 
                key={task.id} 
                onClick={() => setSelectedTask(task)}
                className={`w-full text-left text-[10px] p-1 rounded truncate block border ${task.type === 'Reels' ? 'bg-pink-50 text-pink-700 border-pink-100' : 'bg-purple-50 text-purple-700 border-purple-100'}`}
              >
                {task.title}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
           <h2 className="font-bold text-lg text-slate-800">
             {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
           </h2>
           <div className="flex gap-2">
             <button className="p-1 hover:bg-slate-100 rounded" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}><ChevronLeft size={20}/></button>
             <button className="p-1 hover:bg-slate-100 rounded" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}><ChevronRightIcon size={20}/></button>
           </div>
        </div>
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-2 text-center text-xs font-bold text-slate-500 uppercase">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days}
        </div>
      </div>
    );
  };

  // --- Login Screen ---
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-indigo-200">
              M
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">Media Manager Portal</h2>
          <p className="text-center text-slate-500 mb-8 text-sm">Masuk untuk mengelola konten media sosial Anda</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400"><UserCircle size={20}/></span>
                <input 
                  type="text" 
                  className="w-full border border-slate-300 rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Masukkan username"
                  value={loginForm.username}
                  onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400"><Lock size={20}/></span>
                <input 
                  type="password" 
                  className="w-full border border-slate-300 rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Masukkan password"
                  value={loginForm.password}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                />
              </div>
            </div>

            {loginError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle size={16} /> {loginError}
              </div>
            )}

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-200 mt-2">
              Masuk Portal
            </button>
            
            <div className="text-center text-xs text-slate-400 mt-4">
              <p>Demo Credentials:</p>
              <p>Agency: <strong>agency / agency</strong></p>
              <p>Client: <strong>client / client</strong></p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- Authenticated App ---
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-20 shadow-sm`}>
        <div className="p-4 flex items-center justify-between border-b border-slate-100">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center w-full'}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold shadow-md ${userRole === 'agency' ? 'bg-purple-600 shadow-purple-200' : 'bg-indigo-600 shadow-indigo-200'}`}>
              M
            </div>
            {sidebarOpen && <span className="font-bold text-lg text-slate-800">MediaMgr</span>}
          </div>
          {sidebarOpen && (
             <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
               <Menu size={18} />
             </button>
          )}
        </div>

        {/* Brand Switcher */}
        <div className="p-4">
          {sidebarOpen && <p className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Select Brand</p>}
          <div className="space-y-2">
            {BRANDS.map(brand => (
              <button
                key={brand.id}
                onClick={() => setActiveBrandId(brand.id)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  activeBrandId === brand.id 
                    ? 'bg-slate-100 border border-slate-200 shadow-sm' 
                    : 'hover:bg-slate-50'
                } ${!sidebarOpen ? 'justify-center' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full ${brand.color} text-white flex items-center justify-center text-xs font-bold shrink-0`}>
                  {brand.logo}
                </div>
                {sidebarOpen && (
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium">{brand.name}</p>
                    <p className="text-xs text-slate-500">{brand.target} Posts/mo</p>
                  </div>
                )}
                {sidebarOpen && activeBrandId === brand.id && <CheckCircle2 size={16} className="text-green-500" />}
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'calendar', icon: CalendarIcon, label: 'Jadwal Post' },
            { id: 'files', icon: LinkIcon, label: 'Asset Links' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm transition-all ${
                activeTab === item.id 
                  ? 'bg-indigo-50 text-indigo-700 font-medium' 
                  : 'text-slate-600 hover:bg-slate-50'
              } ${!sidebarOpen ? 'justify-center' : ''}`}
            >
              <item.icon size={20} />
              {sidebarOpen && item.label}
            </button>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
           <div className={`flex flex-col gap-3 ${!sidebarOpen ? 'items-center' : ''}`}>
             
             {sidebarOpen && (
                <div className="flex items-center gap-3 px-2">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${userRole === 'agency' ? 'bg-purple-600' : 'bg-indigo-600'}`}>
                      {userRole === 'agency' ? 'AG' : 'CL'}
                   </div>
                   <div className="overflow-hidden">
                      <p className="text-sm font-bold text-slate-700 capitalize">{userRole} Admin</p>
                      <p className="text-xs text-slate-400 truncate">Logged in</p>
                   </div>
                </div>
             )}

             <button 
                onClick={handleLogout}
                className={`flex items-center gap-2 p-2 rounded text-xs font-medium w-full text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors ${!sidebarOpen ? 'justify-center' : ''}`}
             >
               <LogOut size={16} /> {sidebarOpen && "Logout"}
             </button>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        {!sidebarOpen && (
           <button 
             onClick={() => setSidebarOpen(true)}
             className="absolute top-4 left-4 p-2 bg-white shadow rounded-md z-10"
           >
             <ChevronRight size={16} />
           </button>
        )}

        <header className="px-8 py-6 bg-white border-b border-slate-100 sticky top-0 z-10 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
               <h1 className="text-2xl font-bold text-slate-800">
                {activeTab === 'dashboard' && 'Dashboard Overview'}
                {activeTab === 'calendar' && 'Editorial Calendar'}
                {activeTab === 'files' && 'Asset Links'}
              </h1>
              {userRole === 'agency' && <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">AGENCY MODE</span>}
            </div>
            <p className="text-slate-500 text-sm mt-1">Mengelola konten untuk <span className="font-semibold text-indigo-600">{activeBrand.name}</span></p>
          </div>
          
          <div className="flex gap-3">
             <button 
               onClick={() => setIsAddTaskOpen(true)}
               className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg shadow-slate-200 transition-all"
             >
               <Plus size={16} /> {activeTab === 'files' ? 'Add Link' : 'New Task'}
             </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          
          {/* DASHBOARD VIEW */}
          {activeTab === 'dashboard' && (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Total Progress</p>
                    <div className="flex items-baseline gap-2">
                       <h3 className="text-3xl font-bold text-slate-800">{completed}<span className="text-lg text-slate-400 font-normal">/{totalTarget}</span></h3>
                       <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">On Track</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                      <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                  <div className="h-12 w-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                    <PieChart size={24} />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Menunggu Approval</p>
                    <h3 className="text-3xl font-bold text-yellow-600">{pendingReview}</h3>
                    <p className="text-xs text-slate-400 mt-1">Need Approval</p>
                  </div>
                  <div className="h-12 w-12 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-600">
                    <AlertCircle size={24} />
                  </div>
                </div>

                {/* New: Upcoming Caption Deadlines Widget */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Deadline Caption Bulan Depan</p>
                    <h3 className="text-3xl font-bold text-blue-600">
                      Tgl 15
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Setiap bulan</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                    <CalendarDays size={24} />
                  </div>
                </div>
              </div>

              {/* Task List */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <div className="col-span-4">Konten</div>
                  <div className="col-span-3">Jadwal Tayang</div>
                  <div className="col-span-3">Deadlines (Caption / Visual)</div>
                  <div className="col-span-2 text-right">Action</div>
                </div>

                <div className="divide-y divide-slate-100">
                  {filteredTasks.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                      Belum ada task untuk brand ini.
                    </div>
                  ) : (
                    filteredTasks.map((task) => {
                      const wordingDue = calculateWordingDeadline(task.date);
                      return (
                      <div key={task.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-slate-50 transition-colors items-center group">
                        <div className="col-span-4">
                          <div className="flex items-center gap-2 mb-1">
                             <StatusBadge status={task.status} />
                          </div>
                          <p className="font-medium text-slate-800 truncate">{task.title}</p>
                          <p className="text-xs text-slate-500 truncate mt-1">{task.caption || 'No caption draft'}</p>
                        </div>
                        
                        <div className="col-span-3">
                          <div className="flex flex-col gap-1 items-start">
                            <TypeIcon type={task.type} />
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock size={10} /> {task.date}
                            </span>
                          </div>
                        </div>

                        {/* Due Dates Column */}
                        <div className="col-span-3 text-xs">
                           <div className="flex items-center gap-2 mb-1" title="Caption Deadline (15th of prev month)">
                             <span className="w-16 text-slate-400">Caption:</span>
                             <span className="font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                               {wordingDue || '-'}
                             </span>
                           </div>
                           <div className="flex items-center gap-2" title="Visual Due Date">
                             <span className="w-16 text-slate-400">Visual:</span>
                             <span className={`font-medium px-1.5 py-0.5 rounded ${task.visualDueDate ? 'bg-indigo-50 text-indigo-700' : 'text-slate-400 italic'}`}>
                               {task.visualDueDate || 'Not set'}
                             </span>
                           </div>
                        </div>

                        <div className="col-span-2 text-right flex justify-end gap-2">
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleDeleteTask(task.id); }}
                             className="text-slate-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-md transition-colors"
                             title="Hapus Task"
                           >
                             <Trash2 size={18} />
                           </button>
                           <button 
                             onClick={() => setSelectedTask(task)}
                             className="text-indigo-600 hover:text-indigo-800 text-sm font-medium px-3 py-1.5 rounded-md hover:bg-indigo-50 transition-colors"
                           >
                             View Details
                           </button>
                        </div>
                      </div>
                    )}) 
                  )}
                </div>
              </div>
            </>
          )}

          {/* CALENDAR VIEW */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              {renderCalendar()}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3 items-start">
                <AlertCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-blue-800">Catatan Jadwal</h4>
                  <p className="text-xs text-blue-600 mt-1">Pastikan konten diupload sesuai tanggal yang tertera. Klik tanggal untuk melihat detail konten.</p>
                </div>
              </div>
            </div>
          )}

          {/* FILES LINKS VIEW */}
          {activeTab === 'files' && (
            <div className="space-y-6">
              
              {/* Task Links Table */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <h3 className="font-bold text-slate-700 text-sm">Daftar Link Asset & File</h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {filteredTasks.filter(t => t.fileLink).length > 0 ? (
                    filteredTasks.filter(t => t.fileLink).map(task => (
                      <div key={task.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center">
                              {task.type === 'Reels' ? <Video size={16}/> : <ImageIcon size={16}/>}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">{task.title}</p>
                              <p className="text-xs text-slate-500">{task.date}</p>
                            </div>
                         </div>
                         <a 
                           href={task.fileLink} 
                           target="_blank" 
                           rel="noreferrer"
                           className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1 hover:underline"
                         >
                           <LinkIcon size={14}/> Open Link
                         </a>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-400 text-sm">
                      Belum ada link yang ditambahkan.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ADD TASK MODAL */}
      {isAddTaskOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-slate-700">
                  {activeTab === 'files' ? 'Add New Link' : 'Add New Content Task'}
               </h3>
               <button onClick={() => setIsAddTaskOpen(false)}><X size={20} className="text-slate-400 hover:text-red-500" /></button>
            </div>
            
            <form onSubmit={handleAddTask} className="p-6 overflow-y-auto">
               {/* --- FORM JIKA DI TAB FILES (Simple) --- */}
               {activeTab === 'files' ? (
                 <>
                   <div className="mb-4">
                     <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Nama Judul</label>
                     <input 
                       required
                       type="text" 
                       className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                       placeholder="e.g., File Materi Oktober"
                       value={newTaskData.title}
                       onChange={e => setNewTaskData({...newTaskData, title: e.target.value})}
                     />
                   </div>
                   <div className="mb-6">
                     <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Link URL</label>
                     <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
                       <span className="px-3 bg-slate-100 text-slate-500 border-r border-slate-300"><LinkIcon size={14} /></span>
                       <input 
                         required
                         type="text" 
                         className="w-full p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                         placeholder="https://..."
                         value={newTaskData.fileLink}
                         onChange={e => setNewTaskData({...newTaskData, fileLink: e.target.value})}
                       />
                     </div>
                   </div>
                 </>
               ) : (
                 /* --- FORM DEFAULT (Full Task) --- */
                 <>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                     <div>
                       <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Judul Konten</label>
                       <input 
                         required
                         type="text" 
                         className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                         placeholder="e.g., Promo Gajian"
                         value={newTaskData.title}
                         onChange={e => setNewTaskData({...newTaskData, title: e.target.value})}
                       />
                     </div>
                     <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Jenis Konten</label>
                        <select 
                          className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none"
                          value={newTaskData.type}
                          onChange={e => setNewTaskData({...newTaskData, type: e.target.value})}
                        >
                          <option value="Feed">Instagram Feed</option>
                          <option value="Reels">Instagram Reels</option>
                        </select>
                     </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tanggal Tayang</label>
                        <input 
                          type="date" 
                          className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none"
                          value={newTaskData.date}
                          onChange={e => setNewTaskData({...newTaskData, date: e.target.value})}
                        />
                     </div>
                     <div>
                       <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Target Visual Selesai (Agency)</label>
                       <input 
                         type="date" 
                         className="w-full border border-slate-300 rounded-lg p-2 text-sm outline-none"
                         value={newTaskData.visualDueDate}
                         onChange={e => setNewTaskData({...newTaskData, visualDueDate: e.target.value})}
                       />
                     </div>
                   </div>

                   <div className="mb-4">
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Upload Visual (Optional)</label>
                      <div className="border border-slate-300 border-dashed rounded-lg p-4 bg-slate-50 text-center">
                        {newTaskData.image ? (
                          <div className="relative inline-block group">
                             <img src={newTaskData.image} alt="Preview" className="h-32 w-auto object-contain rounded" />
                             <button 
                               type="button"
                               onClick={() => setNewTaskData({...newTaskData, image: null})}
                               className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600"
                             >
                               <X size={12} />
                             </button>
                          </div>
                        ) : (
                          <label className="cursor-pointer flex flex-col items-center justify-center gap-2">
                             <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                               <Upload size={20} />
                             </div>
                             <span className="text-sm text-slate-600 font-medium">Click to upload image</span>
                             <span className="text-xs text-slate-400">SVG, PNG, JPG or GIF</span>
                             <input type="file" className="hidden" accept="image/*,video/*" onChange={handleNewTaskFileUpload} />
                          </label>
                        )}
                      </div>
                   </div>

                   <div className="mb-4">
                     <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Skript (Deskripsi Panjang)</label>
                     <textarea 
                       className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none"
                       placeholder="Tulis skrip detail, scene per scene..."
                       value={newTaskData.script}
                       onChange={e => setNewTaskData({...newTaskData, script: e.target.value})}
                     ></textarea>
                   </div>

                   <div className="mb-4">
                     <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Caption (Deskripsi Panjang)</label>
                     <textarea 
                       className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none"
                       placeholder="Caption untuk Instagram..."
                       value={newTaskData.caption}
                       onChange={e => setNewTaskData({...newTaskData, caption: e.target.value})}
                     ></textarea>
                   </div>

                   <div className="mb-6">
                     <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Link File</label>
                     <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden">
                       <span className="px-3 bg-slate-100 text-slate-500 border-r border-slate-300"><LinkIcon size={14} /></span>
                       <input 
                         type="text" 
                         className="w-full p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                         placeholder="https://..."
                         value={newTaskData.fileLink}
                         onChange={e => setNewTaskData({...newTaskData, fileLink: e.target.value})}
                       />
                     </div>
                   </div>
                 </>
               )}

               <button type="submit" className="w-full bg-slate-800 text-white py-2.5 rounded-lg font-medium hover:bg-slate-900 transition-colors">
                 {activeTab === 'files' ? 'Add Link' : 'Create Task'}
               </button>
            </form>
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row">
            
            {/* Left: Preview & Actions */}
            <div className="md:w-5/12 bg-slate-100 p-6 flex flex-col border-r border-slate-200 overflow-y-auto">
              <div className="flex-1 flex flex-col items-center justify-center mb-6 relative">
                {selectedTask.image ? (
                  <div className="relative shadow-lg rounded-lg overflow-hidden w-full group">
                     <img src={selectedTask.image} alt="Preview" className="w-full h-auto object-cover" />
                     <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
                       Preview
                     </div>
                     {/* AGENCY RE-UPLOAD OVERLAY */}
                     {userRole === 'agency' && (
                        <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <div className="bg-white text-slate-800 px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2">
                             <Upload size={14} /> Change Image
                          </div>
                          <input type="file" className="hidden" accept="image/*,video/*" onChange={(e) => handleFileUpload(selectedTask.id, e)} />
                        </label>
                     )}
                  </div>
                ) : (
                  <div className="text-center text-slate-400 w-full py-10 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center">
                    <FileImage size={40} className="mx-auto mb-2" />
                    <p className="text-sm mb-3">Visual belum ready</p>
                    {userRole === 'agency' && (
                       <label className="cursor-pointer bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-700 transition-colors">
                          <Upload size={14} /> Upload Visual
                          <input type="file" className="hidden" accept="image/*,video/*" onChange={(e) => handleFileUpload(selectedTask.id, e)} />
                       </label>
                    )}
                  </div>
                )}
              </div>

              {/* Status Actions Panel */}
              <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 space-y-3">
                 <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase">Current Status</span>
                    {/* CLIENT: Select Dropdown for Manual Status */}
                    {userRole === 'client' ? (
                       <select 
                         className="text-xs border border-slate-300 rounded p-1 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                         value={selectedTask.status}
                         onChange={(e) => handleClientStatusChange(selectedTask.id, e.target.value)}
                       >
                         <option value="draft">Draft</option>
                         <option value="need_approval">Need Approval</option>
                         <option value="wording_approve">Wording Approved</option>
                         <option value="illustration_done">Illustration Done</option>
                         <option value="video_done">Video Done</option>
                         <option value="posted">Posted</option>
                       </select>
                    ) : (
                       <StatusBadge status={selectedTask.status} />
                    )}
                 </div>
                 
                 <div className="space-y-2">
                    {/* Client Approval Button Removed - Use Status Dropdown */}

                    {/* Agency Mark Done */}
                    {selectedTask.status === 'wording_approve' && (
                       userRole === 'agency' ? (
                          <button onClick={() => handleMarkDone(selectedTask.id, selectedTask.type)} className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                             <CheckCircle2 size={16} /> Mark {selectedTask.type} Done
                          </button>
                       ) : (
                          <div className="text-xs text-slate-500 text-center py-2 bg-slate-50 rounded">Agency is working on Visuals</div>
                       )
                    )}

                    {/* Posted */}
                    {(selectedTask.status === 'illustration_done' || selectedTask.status === 'video_done') && (
                       <button onClick={() => handleMarkPosted(selectedTask.id)} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                          <CheckCircle2 size={16} /> Mark as Posted
                       </button>
                    )}
                 </div>

                 {/* Agency Due Dates Panel */}
                 <div className="pt-3 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Deadlines</p>
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-xs text-slate-600">Caption Due:</span>
                       <span className="text-xs font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                         {calculateWordingDeadline(selectedTask.date) || '-'}
                       </span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-xs text-slate-600">Visual Due:</span>
                       {userRole === 'agency' ? (
                         <input 
                           type="date" 
                           className="text-xs border border-slate-300 rounded px-1 py-0.5 w-24"
                           value={selectedTask.visualDueDate || ''}
                           onChange={(e) => handleDueDateChange(selectedTask.id, e.target.value)}
                         />
                       ) : (
                         <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                           {selectedTask.visualDueDate || 'Not set'}
                         </span>
                       )}
                    </div>
                 </div>
              </div>
            </div>

            {/* Right: Details Info */}
            <div className="md:w-7/12 flex flex-col h-full">
              <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                 <div>
                   <div className="flex items-center gap-2 mb-2">
                     <TypeIcon type={selectedTask.type} />
                     <span className="text-xs text-slate-400">|</span>
                     <span className="text-xs text-slate-500 flex items-center gap-1"><Clock size={12}/> {selectedTask.date}</span>
                   </div>
                   <h2 className="text-xl font-bold text-slate-800">{selectedTask.title}</h2>
                 </div>
                 <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600">
                   <X size={24} />
                 </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                
                {/* Client Notes (New Field) */}
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                   <h4 className="text-xs font-bold text-orange-700 uppercase mb-1 flex items-center gap-2">
                      <Edit3 size={12} /> Catatan Khusus (Client Notes)
                   </h4>
                   {userRole === 'client' ? (
                     <textarea 
                       className="w-full text-sm bg-white border border-orange-200 rounded p-2 focus:ring-2 focus:ring-orange-300 outline-none"
                       placeholder="Tambahkan catatan revisi atau instruksi khusus..."
                       rows={3}
                       value={selectedTask.clientNotes || ''}
                       onChange={(e) => handleTaskUpdate(selectedTask.id, 'clientNotes', e.target.value)}
                     />
                   ) : (
                     <p className="text-sm text-orange-900 italic">
                        {selectedTask.clientNotes || 'Tidak ada catatan khusus.'}
                     </p>
                   )}
                </div>

                {/* Sumber & Link */}
                <div className="flex gap-4">
                  <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                     <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Sumber / Referensi</h4>
                     <p className="text-sm text-slate-700">{selectedTask.source || '-'}</p>
                  </div>
                  {selectedTask.fileLink && (
                    <div className="flex-1 bg-indigo-50 p-3 rounded-lg border border-indigo-100 cursor-pointer hover:bg-indigo-100 transition-colors">
                       <h4 className="text-xs font-bold text-indigo-500 uppercase mb-1 flex items-center gap-1"><LinkIcon size={12}/> Link File</h4>
                       <a href={selectedTask.fileLink} target="_blank" rel="noreferrer" className="text-sm text-indigo-700 font-medium truncate block">
                         Open Link
                       </a>
                    </div>
                  )}
                </div>

                {/* Skript (Editable for Client) */}
                <div>
                   <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-2">
                     <FileText size={16} /> Script & Konsep
                     {userRole === 'client' && <span className="text-[10px] bg-slate-100 text-slate-500 px-1 rounded font-normal normal-case ml-auto">Bisa diedit</span>}
                   </h3>
                   {userRole === 'client' ? (
                      <textarea 
                        className="w-full bg-white p-4 rounded-lg border border-slate-300 text-sm text-slate-700 leading-relaxed shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        rows={4}
                        value={selectedTask.script || ''}
                        onChange={(e) => handleTaskUpdate(selectedTask.id, 'script', e.target.value)}
                      />
                   ) : (
                      <div className="bg-white p-4 rounded-lg border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-line shadow-sm">
                        {selectedTask.script || 'Belum ada script detail.'}
                      </div>
                   )}
                </div>

                {/* Caption (Editable for Client) */}
                <div>
                   <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-2">
                     <MessageSquare size={16} /> Caption
                     {userRole === 'client' && <span className="text-[10px] bg-slate-100 text-slate-500 px-1 rounded font-normal normal-case ml-auto">Bisa diedit</span>}
                   </h3>
                   {userRole === 'client' ? (
                      <textarea 
                        className="w-full bg-white p-4 rounded-lg border border-slate-300 text-sm text-slate-700 leading-relaxed shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        rows={4}
                        value={selectedTask.caption || ''}
                        onChange={(e) => handleTaskUpdate(selectedTask.id, 'caption', e.target.value)}
                      />
                   ) : (
                      <div className="bg-white p-4 rounded-lg border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-line shadow-sm">
                        {selectedTask.caption}
                      </div>
                   )}
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}