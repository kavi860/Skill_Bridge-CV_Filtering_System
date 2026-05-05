let ALL_VACANCIES = [];
let selectedVacancyId = null;
let rankedCandidates = [];
let shortlisted = [];
let currentSortBy = 'score';
let currentSearchTerm = '';
let isFullscreenMode = false;

// 1. Fetch Vacancies from Backend
async function loadVacancies() {
  try {
    const response = await fetch('http://localhost:8080/api/vacancies');
    if (!response.ok) throw new Error('Network response was not ok');
    ALL_VACANCIES = await response.json();
    
    renderVacancies();
    if (ALL_VACANCIES.length > 0) {
      selectedVacancyId = ALL_VACANCIES[0].id;
      selectVacancy(selectedVacancyId);
    }
  } catch (error) {
    console.error('Error fetching vacancies:', error);
    document.getElementById('vacancy-list').innerHTML = '<p class="text-red-500 text-sm p-4">Failed to load vacancies from backend.</p>';
  }
}

// 2. Render Vacancy List on Left Sidebar
function renderVacancies() {
  const html = ALL_VACANCIES.map(v => `
    <div 
      onclick="selectVacancy('${v.id}')" 
      class="p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
        selectedVacancyId === v.id 
          ? 'bg-indigo-50/50 border-indigo-400 shadow-sm' 
          : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-sm hover:bg-slate-50'
      }"
    >
      <div class="flex justify-between items-start">
        <p class="font-bold text-slate-800 ${selectedVacancyId === v.id ? 'text-indigo-700' : ''}">${v.title}</p>
        ${selectedVacancyId === v.id ? '<div class="w-2 h-2 rounded-full bg-indigo-500 mt-1.5"></div>' : ''}
      </div>
      <p class="text-slate-500 text-xs mt-1.5 leading-relaxed">${v.description}</p>
    </div>
  `).join('');
  document.getElementById('vacancy-list').innerHTML = html;
}

// 3. User Clicks a Vacancy -> Fetch Rankings from Backend
window.selectVacancy = function(id) {
  selectedVacancyId = id;
  currentSearchTerm = '';
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  
  renderVacancies();
  const vacancy = ALL_VACANCIES.find(v => v.id === id);
  if (!vacancy) return;
  
  document.getElementById('selected-vacancy-name').textContent = `Matching against: ${vacancy.title}`;
  document.getElementById('vacancy-requirements').classList.remove('hidden');
  
  // Format the skills string from DB into array if it's stored as comma separated
  const skillsArray = typeof vacancy.requiredSkills === 'string' 
    ? vacancy.requiredSkills.split(',').map(s=>s.trim()) 
    : vacancy.requiredSkills;

  document.getElementById('req-skills').innerHTML = skillsArray.map(s => `
    <span class="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-md">${s}</span>
  `).join('');
  
  fetchRankings(vacancy.id);
};

async function fetchRankings(vacancyId) {
  document.getElementById('analysis-status').classList.remove('hidden');
  
  try {
    const response = await fetch(`http://localhost:8080/api/candidates/rank/${vacancyId}`);
    if (!response.ok) throw new Error('Network error');
    
    // The backend CandidateRankingDTO returns { candidate: {...}, matchScore: 75, matchedSkills: [...] }
    const rankings = await response.json();
    
    rankedCandidates = rankings.map(r => ({
      id: r.candidate.id,
      name: r.candidate.name,
      email: r.candidate.email,
      rawText: r.candidate.rawText,
      experienceYears: r.candidate.experienceYears,
      matchScore: r.matchScore,
      skills: r.matchedSkills || []
    }));
    
    renderStats();
    renderRankingTable();
  } catch (error) {
    console.error("Error fetching rankings:", error);
  } finally {
    document.getElementById('analysis-status').classList.add('hidden');
  }
}

function renderStats() {
  const totalCandidates = rankedCandidates.length;
  const avgScore = totalCandidates ? Math.round(rankedCandidates.reduce((sum, c) => sum + c.matchScore, 0) / totalCandidates) : 0;
  const topScore = totalCandidates ? Math.max(...rankedCandidates.map(c => c.matchScore)) : 0;

  document.getElementById('stats-section').innerHTML = `
    <div class="glass-card flex-1 p-5 rounded-2xl flex flex-col relative overflow-hidden bg-gradient-to-br from-indigo-50/40 to-white">
      <div class="absolute -right-4 -top-4 w-16 h-16 bg-indigo-100/50 rounded-full blur-xl"></div>
      <p class="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1 relative z-10">Total Candidates</p>
      <p class="text-4xl font-extrabold text-slate-800 relative z-10">${totalCandidates}</p>
    </div>
    
    <div class="glass-card flex-1 p-5 rounded-2xl flex flex-col relative overflow-hidden bg-gradient-to-br from-emerald-50/40 to-white">
      <div class="absolute -right-4 -top-4 w-16 h-16 bg-emerald-100/50 rounded-full blur-xl"></div>
      <p class="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1 relative z-10">Avg Match Score</p>
      <p class="text-4xl font-extrabold text-slate-800 relative z-10">${avgScore}%</p>
    </div>
    
    <div class="glass-card flex-1 p-5 rounded-2xl flex flex-col relative overflow-hidden bg-gradient-to-br from-amber-50/40 to-white">
      <div class="absolute -right-4 -top-4 w-16 h-16 bg-amber-100/50 rounded-full blur-xl"></div>
      <p class="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1 relative z-10">Top Match</p>
      <p class="text-4xl font-extrabold text-slate-800 relative z-10">${topScore}%</p>
    </div>
  `;
}

function getFilteredAndSortedCandidates() {
  let candidates = [...rankedCandidates];
  
  if (currentSearchTerm.trim()) {
    const term = currentSearchTerm.toLowerCase();
    candidates = candidates.filter(c => 
      c.name.toLowerCase().includes(term) || 
      c.email.toLowerCase().includes(term)
    );
  }
  
  if (currentSortBy === 'score') {
    candidates.sort((a, b) => b.matchScore - a.matchScore);
  } else if (currentSortBy === 'name') {
    candidates.sort((a, b) => a.name.localeCompare(b.name));
  } else if (currentSortBy === 'exp') {
    candidates.sort((a, b) => b.experienceYears - a.experienceYears);
  }
  
  return candidates;
}

function renderRankingTable() {
  const filteredCandidates = getFilteredAndSortedCandidates();
  
  if (filteredCandidates.length === 0) {
    document.getElementById('empty-state').classList.remove('hidden');
    document.getElementById('ranking-table-section').innerHTML = '';
    return;
  } else {
    document.getElementById('empty-state').classList.add('hidden');
  }

  document.getElementById('ranking-table-section').innerHTML = `
    <table class="w-full text-left border-collapse">
      <thead class="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
        <tr class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <th class="px-6 py-4 w-16 text-center">Rank</th>
          <th class="px-6 py-4">Candidate Information</th>
          <th class="px-6 py-4 w-48">Match Score</th>
          <th class="px-6 py-4 hidden md:table-cell">Matched Skills</th>
          <th class="px-6 py-4 w-24">Exp</th>
          <th class="px-6 py-4 w-32 text-center">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        ${filteredCandidates.map((candidate, idx) => `
          <tr class="data-row">
            <td class="px-6 py-4 text-center">
              <span class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 mx-auto">
                ${idx + 1}
              </span>
            </td>
            <td class="px-6 py-4">
              <p class="font-bold text-slate-800">${candidate.name}</p>
              <p class="text-xs text-slate-500 mt-0.5">${candidate.email}</p>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div class="h-full rounded-full ${candidate.matchScore >= 80 ? 'bg-emerald-500' : candidate.matchScore >= 50 ? 'bg-indigo-500' : 'bg-slate-300'}" style="width: ${candidate.matchScore}%"></div>
                </div>
                <span class="font-bold text-slate-700 w-9 text-right">${candidate.matchScore}%</span>
              </div>
            </td>
            <td class="px-6 py-4 hidden md:table-cell">
              <div class="flex flex-wrap gap-1.5">
                ${candidate.skills.slice(0, 3).map(s => `<span class="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md border border-indigo-100 whitespace-nowrap">${s}</span>`).join('')}
                ${candidate.skills.length > 3 ? `<span class="px-2 py-1 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-md border border-slate-200">+${candidate.skills.length - 3}</span>` : ''}
                ${candidate.skills.length === 0 ? `<span class="text-xs text-slate-400 italic">No matches</span>` : ''}
              </div>
            </td>
            <td class="px-6 py-4">
              <span class="text-sm font-semibold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                ${candidate.experienceYears}y
              </span>
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center justify-center gap-2">
                <button onclick="toggleShortlist('${candidate.id}')" class="w-8 h-8 rounded-full flex items-center justify-center transition hover:bg-red-50 group" title="Shortlist">
                  <i class="fa-solid fa-heart ${shortlisted.includes(candidate.id) ? 'text-red-500' : 'text-slate-300 group-hover:text-red-400'}"></i>
                </button>
                <button onclick="viewDetails('${candidate.id}')" class="px-3 py-1.5 bg-slate-50 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 text-xs font-bold rounded-lg transition border border-slate-200 hover:border-indigo-200">
                  View
                </button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

window.filterTable = function() {
  currentSearchTerm = document.getElementById('search-input').value;
  renderRankingTable();
};

window.sortTable = function() {
  currentSortBy = document.getElementById('sort-select').value;
  renderRankingTable();
};

window.toggleFullscreen = function() {
  isFullscreenMode = !isFullscreenMode;
  const dashboardEl = document.getElementById('ranking-dashboard');
  const toggleBtn = document.getElementById('fullscreen-btn');
  
  if (isFullscreenMode) {
    dashboardEl.classList.add('fixed', 'inset-0', 'z-[900]', 'bg-[#F8FAFC]', 'overflow-auto', 'p-8', 'w-full', 'max-w-none');
    dashboardEl.classList.remove('col-span-12', 'lg:col-span-8');
    toggleBtn.innerHTML = '<i class="fa-solid fa-compress"></i> Exit';
  } else {
    dashboardEl.classList.remove('fixed', 'inset-0', 'z-[900]', 'bg-[#F8FAFC]', 'overflow-auto', 'p-8', 'w-full', 'max-w-none');
    dashboardEl.classList.add('col-span-12', 'lg:col-span-8');
    toggleBtn.innerHTML = '<i class="fa-solid fa-expand"></i> Fullscreen';
  }
};

window.viewDetails = function(candidateId) {
  const c = rankedCandidates.find(x => x.id === candidateId);
  if (!c) return;
  
  const modal = document.getElementById('detail-modal');
  const content = document.getElementById('modal-content');
  
  const scoreColor = c.matchScore >= 80 ? 'emerald' : c.matchScore >= 50 ? 'indigo' : 'slate';
  
  content.innerHTML = `
    <div class="flex justify-between items-start mb-6 pb-6 border-b border-slate-100">
      <div class="flex gap-4 items-center">
        <div class="w-14 h-14 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-bold border-4 border-white shadow-sm">
          ${c.name.charAt(0)}
        </div>
        <div>
          <h2 class="text-2xl font-bold text-slate-800">${c.name}</h2>
          <p class="text-slate-500 text-sm mt-0.5">${c.email}</p>
        </div>
      </div>
      <button onclick="closeModal()" class="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition border border-slate-200">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
    
    <div class="space-y-6">
      <div class="bg-[color:var(--tw-colors-${scoreColor}-50)] p-5 rounded-2xl border border-[color:var(--tw-colors-${scoreColor}-100)]">
        <div class="flex justify-between items-center mb-2">
          <p class="text-xs font-bold text-[color:var(--tw-colors-${scoreColor}-700)] uppercase tracking-widest">Match Score</p>
          <span class="font-extrabold text-[color:var(--tw-colors-${scoreColor}-700)] text-xl">${c.matchScore}%</span>
        </div>
        <div class="w-full h-2.5 bg-white/50 rounded-full overflow-hidden">
          <div class="h-full bg-[color:var(--tw-colors-${scoreColor}-500)] rounded-full" style="width: ${c.matchScore}%"></div>
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div class="glass-card p-4 rounded-xl">
          <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Experience</p>
          <p class="text-slate-800 font-bold text-lg">${c.experienceYears} Years</p>
        </div>
        <div class="glass-card p-4 rounded-xl">
          <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Status</p>
          <p class="font-bold text-lg flex items-center gap-2 ${shortlisted.includes(c.id) ? 'text-red-500' : 'text-slate-600'}">
            ${shortlisted.includes(c.id) ? '<i class="fa-solid fa-heart"></i> Shortlisted' : '<span class="w-2 h-2 rounded-full bg-amber-400"></span> Under Review'}
          </p>
        </div>
      </div>
      
      <div>
        <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Resume Excerpt</p>
        <p class="text-slate-700 text-sm leading-relaxed p-4 rounded-xl bg-slate-50 border border-slate-100">${c.rawText}</p>
      </div>
      
      <div>
        <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Matched Skills Found</p>
        <div class="flex flex-wrap gap-2">
          ${c.skills.length > 0 
            ? c.skills.map(s => `<span class="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider rounded-md border border-indigo-100">${s}</span>`).join('')
            : '<span class="text-sm text-slate-400 italic">No exact skill matches found.</span>'}
        </div>
      </div>
    </div>
  `;
  
  let actualHtml = content.innerHTML;
  if(scoreColor === 'emerald') {
    actualHtml = actualHtml.replace(/\[color:var\(--tw-colors-emerald-50\)\]/g, '#ECFDF5').replace(/\[color:var\(--tw-colors-emerald-100\)\]/g, '#D1FAE5').replace(/\[color:var\(--tw-colors-emerald-700\)\]/g, '#047857').replace(/\[color:var\(--tw-colors-emerald-500\)\]/g, '#10B981');
  } else if(scoreColor === 'indigo') {
    actualHtml = actualHtml.replace(/\[color:var\(--tw-colors-indigo-50\)\]/g, '#EEF2FF').replace(/\[color:var\(--tw-colors-indigo-100\)\]/g, '#E0E7FF').replace(/\[color:var\(--tw-colors-indigo-700\)\]/g, '#4338CA').replace(/\[color:var\(--tw-colors-indigo-500\)\]/g, '#6366F1');
  } else {
    actualHtml = actualHtml.replace(/\[color:var\(--tw-colors-slate-50\)\]/g, '#F8FAFC').replace(/\[color:var\(--tw-colors-slate-100\)\]/g, '#F1F5F9').replace(/\[color:var\(--tw-colors-slate-700\)\]/g, '#334155').replace(/\[color:var\(--tw-colors-slate-500\)\]/g, '#64748B');
  }
  content.innerHTML = actualHtml;
  
  modal.classList.remove('hidden');
};

window.closeModal = function() {
  document.getElementById('detail-modal').classList.add('hidden');
};

window.toggleShortlist = function(candidateId) {
  const idx = shortlisted.indexOf(candidateId);
  if (idx > -1) {
    shortlisted.splice(idx, 1);
  } else {
    shortlisted.push(candidateId);
  }
  
  const modal = document.getElementById('detail-modal');
  if(!modal.classList.contains('hidden')) {
      viewDetails(candidateId);
  }
  
  renderRankingTable();
};

document.addEventListener('DOMContentLoaded', () => {
  // Load data from Backend API instead of static arrays!
  loadVacancies();
  
  document.getElementById('detail-modal').addEventListener('click', (e) => {
    if(e.target === document.getElementById('detail-modal')) {
      closeModal();
    }
  });
});