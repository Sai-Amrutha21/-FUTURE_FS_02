const API = 'http://localhost:5000/api';
let allLeads = [];
let isLoggedIn = false;

// ============ LOGIN ============
async function doLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value.trim();
  const errEl = document.getElementById('login-error');
  errEl.classList.add('hidden');

  if (!username || !password) {
    errEl.textContent = 'Please enter username and password.';
    errEl.classList.remove('hidden');
    return;
  }

  try {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (data.success) {
      isLoggedIn = true;
      sessionStorage.setItem('crm_logged_in', 'true');
      document.getElementById('login-page').classList.add('hidden');
      document.getElementById('dashboard').classList.remove('hidden');
      loadLeads();
    } else {
      errEl.textContent = data.message || 'Invalid credentials';
      errEl.classList.remove('hidden');
    }
  } catch (err) {
    errEl.textContent = 'Cannot connect to server. Is it running?';
    errEl.classList.remove('hidden');
  }
}

function doLogout() {
  sessionStorage.removeItem('crm_logged_in');
  isLoggedIn = false;
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('login-page').classList.remove('hidden');
  document.getElementById('login-password').value = '';
}

// Allow pressing Enter on login form
document.addEventListener('DOMContentLoaded', () => {
  ['login-username', 'login-password'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
      if (e.key === 'Enter') doLogin();
    });
  });

  // Auto-login if session exists
  if (sessionStorage.getItem('crm_logged_in')) {
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    loadLeads();
  }
});

// ============ LOAD LEADS ============
async function loadLeads() {
  try {
    const res = await fetch(`${API}/leads`);
    allLeads = await res.json();
    updateStats();
    renderTable();
  } catch (err) {
    document.getElementById('leads-tbody').innerHTML =
      `<tr><td colspan="7" class="empty-row">⚠ Could not load leads. Is the server running?</td></tr>`;
  }
}

function updateStats() {
  document.getElementById('stat-total').textContent = allLeads.length;
  document.getElementById('stat-new').textContent = allLeads.filter(l => l.status === 'New').length;
  document.getElementById('stat-converted').textContent = allLeads.filter(l => l.status === 'Converted').length;
}

// ============ RENDER TABLE ============
function renderTable() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const statusF = document.getElementById('filter-status').value;
  const sourceF = document.getElementById('filter-source').value;

  let filtered = allLeads.filter(lead => {
    const matchSearch = !search ||
      lead.name.toLowerCase().includes(search) ||
      lead.email.toLowerCase().includes(search);
    const matchStatus = !statusF || lead.status === statusF;
    const matchSource = !sourceF || lead.source === sourceF;
    return matchSearch && matchStatus && matchSource;
  });

  const tbody = document.getElementById('leads-tbody');

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-row">No leads found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(lead => {
    const badgeClass = {
      'New': 'badge-new',
      'Contacted': 'badge-contacted',
      'Converted': 'badge-converted'
    }[lead.status] || 'badge-new';

    const date = new Date(lead.createdAt).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: '2-digit'
    });

    return `
      <tr>
        <td class="lead-name">${escHtml(lead.name)}</td>
        <td class="lead-email">${escHtml(lead.email)}</td>
        <td><span class="tag">${escHtml(lead.source)}</span></td>
        <td><span class="badge ${badgeClass}">${lead.status}</span></td>
        <td class="lead-notes" title="${escHtml(lead.notes || '')}">${escHtml(lead.notes || '—')}</td>
        <td class="lead-date">${date}</td>
        <td>
          <div class="action-btns">
            <button class="btn-edit" onclick="openEditModal('${lead._id}')">Edit</button>
            <button class="btn-delete" onclick="deleteLead('${lead._id}')">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============ MODAL ============
function openModal() {
  document.getElementById('modal-title').textContent = 'Add New Lead';
  document.getElementById('lead-id').value = '';
  document.getElementById('f-name').value = '';
  document.getElementById('f-email').value = '';
  document.getElementById('f-source').value = 'Website';
  document.getElementById('f-status').value = 'New';
  document.getElementById('f-notes').value = '';
  document.getElementById('modal-error').classList.add('hidden');
  document.getElementById('modal-overlay').classList.remove('hidden');
  document.getElementById('f-name').focus();
}

function openEditModal(id) {
  const lead = allLeads.find(l => l._id === id);
  if (!lead) return;
  document.getElementById('modal-title').textContent = 'Edit Lead';
  document.getElementById('lead-id').value = lead._id;
  document.getElementById('f-name').value = lead.name;
  document.getElementById('f-email').value = lead.email;
  document.getElementById('f-source').value = lead.source;
  document.getElementById('f-status').value = lead.status;
  document.getElementById('f-notes').value = lead.notes || '';
  document.getElementById('modal-error').classList.add('hidden');
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

// ============ SAVE LEAD ============
async function saveLead() {
  const id = document.getElementById('lead-id').value;
  const name = document.getElementById('f-name').value.trim();
  const email = document.getElementById('f-email').value.trim();
  const source = document.getElementById('f-source').value;
  const status = document.getElementById('f-status').value;
  const notes = document.getElementById('f-notes').value.trim();
  const errEl = document.getElementById('modal-error');

  if (!name || !email) {
    errEl.classList.remove('hidden');
    return;
  }
  errEl.classList.add('hidden');

  const body = { name, email, source, status, notes };

  try {
    if (id) {
      // Update
      const res = await fetch(`${API}/leads/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const updated = await res.json();
      allLeads = allLeads.map(l => l._id === id ? updated : l);
    } else {
      // Create
      const res = await fetch(`${API}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const created = await res.json();
      allLeads.unshift(created);
    }
    updateStats();
    renderTable();
    closeModal();
  } catch (err) {
    errEl.textContent = 'Failed to save. Check server connection.';
    errEl.classList.remove('hidden');
  }
}

// ============ DELETE ============
async function deleteLead(id) {
  if (!confirm('Delete this lead? This cannot be undone.')) return;
  try {
    await fetch(`${API}/leads/${id}`, { method: 'DELETE' });
    allLeads = allLeads.filter(l => l._id !== id);
    updateStats();
    renderTable();
  } catch (err) {
    alert('Failed to delete. Check server connection.');
  }
}
