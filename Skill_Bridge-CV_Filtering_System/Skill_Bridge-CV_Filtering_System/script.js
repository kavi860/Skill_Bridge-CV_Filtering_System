// PURE QUALIFICATION MATCHING (no AI)
const PRE_LOADED_VACANCIES = [
  { id: "v1", title: "Senior Frontend Engineer", description: "React, TypeScript, Tailwind, AI integrations", requiredSkills: ["React","TypeScript","Tailwind CSS","Framer Motion"] },
  { id: "v2", title: "Backend Developer (Node.js)", description: "Node.js, Express, PostgreSQL, Microservices", requiredSkills: ["Node.js","Express","PostgreSQL","Microservices","Redis"] },
  { id: "v3", title: "Product Designer", description: "Figma, User Research, Design Systems", requiredSkills: ["Figma","User Research","Prototyping","Design Systems","UI/UX"] }
];

const PRE_LOADED_CANDIDATES = [
  { id: "c1", name: "Alex Rivera", email: "alex.rivera@example.com", rawText: "Senior Software Engineer with 6 years experience. Expert in React, TypeScript, Tailwind CSS.", experienceYears: 6 },
  { id: "c2", name: "Sarah Chen", email: "sarah.chen@example.com", rawText: "Full Stack Developer. 4 years React, Node.js, Figma, UI/UX.", experienceYears: 4 },
  { id: "c3", name: "Marcus Johnson", email: "marcus.johnson@example.com", rawText: "Backend specialist. 8 years Node.js, PostgreSQL, Kubernetes, Microservices.", experienceYears: 8 },
  { id: "c4", name: "Elena Rodriguez", email: "elena.rodriguez@example.com", rawText: "UI/UX Designer. 5 years Figma, User Research, Design Systems.", experienceYears: 5 },
  { id: "c5", name: "David Kim", email: "david.kim@example.com", rawText: "Frontend Developer. 3 years React, JavaScript, Tailwind.", experienceYears: 3 }
];

let selectedVacancyId = null;
let rankedCandidates = [];
let shortlisted = [];
let isShortlistView = false;
let selectedCandidateId = null;
let currentSortBy = 'score';
let currentSearchTerm = '';
let isFullscreenMode = false;

function computeMatchScore(text, skills) {
  const lower = text.toLowerCase();
  let hits = 0;
  const found = [];
  skills.forEach(s => {
    if (lower.includes(s.toLowerCase())) { hits++; found.push(s); }
  });
  return { score: skills.length ? Math.round((hits/skills.length)*100) : 0, found };
}

function renderVacancies() {
  const html = PRE_LOADED_VACANCIES.map(v => `
    <div 
      onclick="selectVacancy('${v.id}')" 
      class="group p-6 rounded-3xl border-2 cursor-pointer transition-all ${selectedVacancyId === v.id ? 'border-[#1E40AF] bg-blue-50' : 'border-slate-200 hover:border-[#1E40AF]'}"
    >
      <p class="font-semibold text-lg ${selectedVacancyId === v.id ? 'text-[#1E40AF]' : 'group-hover:text-[#1E40AF]'}">${v.title}</p>
      <p class="text-slate-500 text-sm mt-2">${v.description}</p>
    </div>
  `).join('');
  document.getElementById('vacancy-list').innerHTML = html;
}

function renderStats() {
  const totalCandidates = rankedCandidates.length;
  const avgScore = Math.round(rankedCandidates.reduce((sum, c) => sum + c.matchScore, 0) / totalCandidates);
  const topScore = rankedCandidates.length ? Math.max(...rankedCandidates.map(c => c.matchScore)) : 0;

  document.getElementById('stats-section').innerHTML = `
    <div class="flex flex-col md:flex-row gap-6 justify-center">
      <div class="stat-card bg-gradient-to-b from-blue-100 to-blue-50">
        <p class="text-5xl font-extrabold text-[#1E40AF]">${totalCandidates}</p>
        <p class="text-sm text-slate-600 mt-2">Total Candidates</p>
      </div>
      <div class="stat-card bg-gradient-to-b from-green-100 to-green-50">
        <p class="text-5xl font-extrabold text-green-700">${avgScore}%</p>
        <p class="text-sm text-slate-600 mt-2">Avg Match Score</p>
      </div>
      <div class="stat-card bg-gradient-to-b from-purple-100 to-purple-50">
        <p class="text-5xl font-extrabold text-purple-700">${topScore}%</p>
        <p class="text-sm text-slate-600 mt-2">Top Match</p>
      </div>
    </div>
  `;
}

function renderTopThree() {
  const topThree = rankedCandidates.slice(0, 3);
  document.getElementById('top-three-section').innerHTML = `
    <h3 class="text-2xl font-bold mb-6">Top 3 Qualified Candidates</h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      ${topThree.map((candidate, idx) => `
        <div class="bg-gradient-to-br ${idx === 0 ? 'from-yellow-100 to-yellow-50' : idx === 1 ? 'from-gray-200 to-gray-100' : 'from-orange-100 to-orange-50'} rounded-2xl p-6 border-2 ${idx === 0 ? 'border-yellow-400' : idx === 1 ? 'border-gray-400' : 'border-orange-300'}">
          <div class="flex items-center justify-between mb-4">
            <span class="text-5xl font-bold ${idx === 0 ? 'text-yellow-600' : idx === 1 ? 'text-gray-600' : 'text-orange-600'}">
              ${idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
            </span>
            <span class="text-3xl font-bold text-slate-700">${candidate.matchScore}%</span>
          </div>
          <h4 class="font-bold text-lg">${candidate.name}</h4>
          <p class="text-sm text-slate-600">${candidate.email}</p>
          <p class="text-xs text-slate-500 mt-2">${candidate.experienceYears} years experience</p>
          <div class="mt-3 flex flex-wrap gap-1">
            ${candidate.skills.slice(0, 2).map(s => `<span class="px-2 py-1 bg-white text-xs font-medium rounded">${s}</span>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function getFilteredAndSortedCandidates() {
  let candidates = [...rankedCandidates];
  
  // Filter by search term
  if (currentSearchTerm.trim()) {
    const term = currentSearchTerm.toLowerCase();
    candidates = candidates.filter(c => 
      c.name.toLowerCase().includes(term) || 
      c.email.toLowerCase().includes(term)
    );
  }
  
  // Sort
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
  const vacancy = PRE_LOADED_VACANCIES.find(v => v.id === selectedVacancyId);
  const filteredCandidates = getFilteredAndSortedCandidates();
  
  if (filteredCandidates.length === 0) {
    document.getElementById('empty-state').classList.remove('hidden');
    document.getElementById('ranking-table-section').innerHTML = '';
    return;
  } else {
    document.getElementById('empty-state').classList.add('hidden');
  }

  document.getElementById('ranking-table-section').innerHTML = `
    <div class="overflow-x-auto">
      <table class="w-full text-left">
        <thead class="bg-slate-100 border-b-2 border-slate-300">
          <tr class="text-sm font-bold text-slate-700 uppercase tracking-wider">
            <th class="px-6 py-4">Rank</th>
            <th class="px-6 py-4">Candidate Name</th>
            <th class="px-6 py-4">Email</th>
            <th class="px-6 py-4">Match Score</th>
            <th class="px-6 py-4">Matched Skills</th>
            <th class="px-6 py-4">Experience</th>
            <th class="px-6 py-4">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          ${filteredCandidates.map((candidate, idx) => `
            <tr class="hover:bg-slate-50 transition-colors ${selectedCandidateId === candidate.id ? 'bg-blue-100' : ''}">
              <td class="px-6 py-4 font-bold text-slate-700">#${idx + 1}</td>
              <td class="px-6 py-4 font-semibold">${candidate.name}</td>
              <td class="px-6 py-4 text-slate-600 text-sm">${candidate.email}</td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <div class="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div class="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600" style="width: ${candidate.matchScore}%"></div>
                  </div>
                  <span class="font-bold text-slate-700 min-w-8">${candidate.matchScore}%</span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  ${candidate.skills.map(s => `<span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">${s}</span>`).join('')}
                </div>
              </td>
              <td class="px-6 py-4 text-sm">${candidate.experienceYears} yrs</td>
              <td class="px-6 py-4">
                <button onclick="toggleShortlist('${candidate.id}')" class="px-4 py-2 rounded-lg text-sm font-semibold transition-all ${shortlisted.includes(candidate.id) ? 'bg-red-200 text-red-700 hover:bg-red-300' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}">
                  ${shortlisted.includes(candidate.id) ? '✓ Shortlisted' : 'Shortlist'}
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
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
    dashboardEl.classList.add('fixed', 'inset-0', 'z-[900]', 'bg-white', 'overflow-auto', 'p-8');
    dashboardEl.classList.remove('col-span-12', 'lg:col-span-7');
    toggleBtn.innerHTML = '<i class="fa-solid fa-compress"></i> Minimize';
  } else {
    dashboardEl.classList.remove('fixed', 'inset-0', 'z-[900]', 'bg-white', 'overflow-auto', 'p-8');
    dashboardEl.classList.add('col-span-12', 'lg:col-span-7');
    toggleBtn.innerHTML = '<i class="fa-solid fa-expand"></i> Fullscreen';
  }
};

window.selectVacancy = function(id) {
  selectedVacancyId = id;
  selectedCandidateId = null;
  renderVacancies();
  const vacancy = PRE_LOADED_VACANCIES.find(v => v.id === id);
  
  document.getElementById('vacancy-requirements').classList.remove('hidden');
  document.getElementById('req-skills').innerHTML = vacancy.requiredSkills.map(s => `
    <span class="px-5 py-2 bg-slate-100 text-xs font-medium rounded-full">${s}</span>
  `).join('');
  
  // Auto-compute ranking for selected vacancy
  performRanking();
};

window.performRanking = function() {
  const vacancy = PRE_LOADED_VACANCIES.find(v => v.id === selectedVacancyId);
  rankedCandidates = [];
  
  for (let c of PRE_LOADED_CANDIDATES) {
    const analysis = computeMatchScore(c.rawText, vacancy.requiredSkills);
    rankedCandidates.push({ ...c, matchScore: analysis.score, skills: analysis.found });
  }
  
  rankedCandidates.sort((a,b) => b.matchScore - a.matchScore);
  renderStats();
  renderTopThree();
  renderRankingTable();
};

window.toggleShortlist = function(candidateId) {
  const idx = shortlisted.indexOf(candidateId);
  if (idx > -1) {
    shortlisted.splice(idx, 1);
  } else {
    shortlisted.push(candidateId);
  }
  renderRankingTable();
};

window.startRanking = function() {
  performRanking();
};

document.addEventListener('DOMContentLoaded', () => {
  renderVacancies();
  
  // Auto-select first vacancy and show default rankings
  selectedVacancyId = PRE_LOADED_VACANCIES[0].id;
  selectVacancy(selectedVacancyId);
});