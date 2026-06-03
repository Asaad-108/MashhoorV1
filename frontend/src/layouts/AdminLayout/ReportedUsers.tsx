function ReportedUsers() {
  // Mock data based on screenshots
  const reports = [
    {
      id: 1,
      username: "@fake_influencer123",
      priority: "high",
      reportedBy: "TechStyle Co.",
      time: "1 day ago",
      reason: "Fake engagement metrics",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop"
    },
    {
      id: 2,
      username: "@spam_account",
      priority: "medium",
      reportedBy: "BeautyPro",
      time: "2 days ago",
      reason: "Spam messages to brands",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop"
    }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-10 flex items-center gap-4">
        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shadow-sm border border-red-100">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-1">Reported Users</h1>
          <p className="text-gray-500 text-lg">Review and take action on reported violations</p>
        </div>
      </div>

      <div className="space-y-8">
        {reports.map((report) => (
          <div key={report.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex">
            {/* Left Priority Accent */}
            <div className={`w-1.5 ${report.priority === 'high' ? 'bg-red-500' : 'bg-yellow-400'}`}></div>
            
            <div className="p-8 flex-1">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-5">
                    <img src={report.avatar} alt={report.username} className="w-16 h-16 rounded-2xl object-cover shadow-sm" />
                    <div>
                       <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-xl font-bold text-gray-900">{report.username}</h3>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            report.priority === 'high' ? 'bg-red-50 text-red-500' : 'bg-yellow-50 text-yellow-600'
                          }`}>
                            {report.priority} priority
                          </span>
                       </div>
                       <div className="text-gray-400 text-sm font-medium">
                          Reported by <span className="text-gray-900">{report.reportedBy}</span> • {report.time}
                       </div>
                    </div>
                  </div>
               </div>

               <div className="bg-red-50/50 rounded-2xl p-6 mb-8 border border-red-50">
                  <h4 className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3">Reason:</h4>
                  <p className="text-gray-700 font-medium leading-relaxed">{report.reason}</p>
               </div>

               <div className="flex items-center gap-4">
                  <button className="px-6 py-3 border border-yellow-200 text-yellow-600 rounded-xl font-bold hover:bg-yellow-50 transition-all flex items-center gap-2">
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                     Issue Warning
                  </button>
                  <button className="px-6 py-3 border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-all flex items-center gap-2">
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                     Suspend Account
                  </button>
                  <button className="px-6 py-3 border border-gray-200 text-gray-500 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center gap-2">
                     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                     Dismiss Report
                  </button>
                  <button className="px-6 py-3 bg-gray-50 text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-all ml-auto">
                     View Evidence
                  </button>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ReportedUsers;
