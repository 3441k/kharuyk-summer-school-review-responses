const reviewerInput = document.getElementById('reviewer-name');
const fileInput = document.getElementById('file-input');
const searchInput = document.getElementById('search');
const userSelect = document.getElementById('user-select');
const filterSelect = document.getElementById('filter');
const cardsContainer = document.getElementById('cards');
const summaryDiv = document.getElementById('summary');
const showSummaryBtn = document.getElementById('show-summary');

let responses = [];
let currentView = 'list';
let ratings = JSON.parse(localStorage.getItem('ratings_v1') || '{}');

window.addEventListener('DOMContentLoaded', () => {
  if (!fileInput.files.length) {
    loadDefaultFile();
  }
});

function loadDefaultFile() {
  fetch('data/example.xlsx')
    .then(res => res.arrayBuffer())
    .then(data => {
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      responses = XLSX.utils.sheet_to_json(sheet);
      populateUserSelect();
      renderCards();
    })
    .catch(err => console.error('Failed to load default file:', err));
}



fileInput.addEventListener('change', handleFile);
searchInput.addEventListener('input', () => {
  userSelect.value = '';
  renderCards();
});
userSelect.addEventListener('change', () => {
  searchInput.value = userSelect.value;
  renderCards();
});
filterSelect.addEventListener('change', renderCards);
showSummaryBtn.addEventListener('click', renderSummaryTable);

function handleFile(e) {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    responses = XLSX.utils.sheet_to_json(sheet);
    populateUserSelect();
    renderCards();
  };
  reader.readAsArrayBuffer(file);
}

function populateUserSelect() {
  userSelect.innerHTML = '<option value="">Select a user</option>';
  const names = Array.from(new Set(responses.map(r => r.Name).filter(Boolean)));
  names.sort().forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    userSelect.appendChild(option);
  });
}

function getResponseId(res) {
  return res.Name;
}

function saveRatings() {
  localStorage.setItem('ratings_v1', JSON.stringify(ratings));
}

function renderCards() {
  if (currentView !== 'list') return;
  summaryDiv.innerHTML = '';
  const searchVal = searchInput.value.toLowerCase();
  const filterVal = filterSelect.value;
  cardsContainer.innerHTML = '';

  responses.filter(res => {
    const nameMatch = res.Name?.toLowerCase().includes(searchVal);
    const allRatings = ratings[getResponseId(res)] || {};
    const reviewerRatings = Object.values(allRatings);
    const statusMatch = filterVal === 'All' || reviewerRatings.some(r => r.status === filterVal);
    return nameMatch && statusMatch;
  }).forEach((res, idx) => {
    const card = document.createElement('div');
    card.className = 'card';

    const allRatings = ratings[getResponseId(res)] || {};
    const reviewer = reviewerInput.value.trim();
    const reviewerRating = allRatings[reviewer];
    const latest = reviewerRating || Object.values(allRatings).slice(-1)[0];

    if (latest?.status === 'Approved') card.style.borderLeftColor = '#4CAF50';
    else if (latest?.status === 'Declined') card.style.borderLeftColor = '#F44336';
    else if (latest?.status === 'Tentative') card.style.borderLeftColor = '#2196F3';
    else card.style.borderLeftColor = '#ccc';

    const name = document.createElement('h3');
    name.textContent = res.Name || `Respondent ${idx + 1}`;

    const qaBlock = document.createElement('div');
    Object.entries(res).forEach(([key, val]) => {
      if (key !== 'Name') {
        const qa = document.createElement('p');
        qa.className = 'qa';
        qa.innerHTML = `<strong>${key}:</strong> ${val}`;
        qaBlock.appendChild(qa);
      }
    });

    card.appendChild(name);
    if (reviewer && allRatings[reviewer]) {
      const badge = document.createElement('div');
      badge.style.fontSize = '0.85rem';
      badge.style.marginTop = '4px';
      badge.style.color = '#666';
      badge.textContent = `Your rating: ${allRatings[reviewer].status || '—'}`;
      card.appendChild(badge);
    }
    card.appendChild(qaBlock);
    card.addEventListener('click', () => showDetail(res));

    cardsContainer.appendChild(card);
  });
}

function showDetail(res) {
  const reviewer = reviewerInput.value.trim();
  if (!reviewer) return alert('Please enter your name before reviewing.');

  currentView = 'detail';
  cardsContainer.innerHTML = '';
  summaryDiv.innerHTML = '';

  const backBtn = document.createElement('button');
  backBtn.className = 'back-button';
  backBtn.textContent = '← Back to All Responses';
  backBtn.onclick = () => {
    currentView = 'list';
    renderCards();
  };

  const detail = document.createElement('div');
  detail.className = 'detail-view';
  const name = document.createElement('h2');
  name.textContent = res.Name;

  const qaBlock = document.createElement('div');
  Object.entries(res).forEach(([key, val]) => {
    if (key !== 'Name') {
      const qa = document.createElement('p');
      qa.className = 'qa';
      qa.innerHTML = `<strong>${key}:</strong> ${val}`;
      qaBlock.appendChild(qa);
    }
  });

  const statusButtons = document.createElement('div');
  statusButtons.className = 'status-buttons';
  ['Approved', 'Declined', 'Tentative'].forEach(status => {
    const btn = document.createElement('button');
    btn.textContent = status === 'Approved' ? '✅' : status === 'Declined' ? '❌' : '🔵';
    btn.className = status.toLowerCase();
    btn.onclick = () => {
      const id = getResponseId(res);
      ratings[id] = ratings[id] || {};
      ratings[id][reviewer] = ratings[id][reviewer] || {};
      ratings[id][reviewer].status = status;
      saveRatings();
    
      // Visual indicator (update button state)
      Array.from(statusButtons.children).forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    
      // Re-render card color in list view
      currentView = 'list';
      renderCards();
      showDetail(res);
    };
    
    statusButtons.appendChild(btn);
  });

  const commentBox = document.createElement('textarea');
  commentBox.className = 'comment-box';
  commentBox.placeholder = 'Add comment...';
  const existing = (ratings[getResponseId(res)] || {})[reviewer];
  commentBox.value = existing?.comment || '';
  commentBox.oninput = (e) => {
    const id = getResponseId(res);
    ratings[id] = ratings[id] || {};
    ratings[id][reviewer] = ratings[id][reviewer] || {};
    ratings[id][reviewer].comment = e.target.value;
    saveRatings();
  };

  const otherReviews = document.createElement('div');
  otherReviews.className = 'reviewer-info';
  const all = ratings[getResponseId(res)] || {};
  otherReviews.innerHTML = '<strong>All Reviews:</strong><br>' +
    Object.entries(all).map(([rev, info]) =>
      `<div><strong>${rev}</strong>: ${info.status || 'No status'}<br>📝 ${info.comment || ''}</div>`
    ).join('<hr>');

  detail.appendChild(name);
  detail.appendChild(qaBlock);
  detail.appendChild(statusButtons);
  detail.appendChild(commentBox);
  detail.appendChild(otherReviews);

  cardsContainer.appendChild(backBtn);
  cardsContainer.appendChild(detail);
}

function renderSummaryTable() {
  currentView = 'summary';
  cardsContainer.innerHTML = '';
  summaryDiv.innerHTML = '';

  const allReviewers = new Set();
  Object.values(ratings).forEach(responseReviews => {
    Object.keys(responseReviews).forEach(reviewerName => allReviewers.add(reviewerName));
  });
  const reviewers = Array.from(allReviewers).sort();

  let html = '<button class="back-button" id="back-from-summary">← Back to Main Page</button>';
  html += '<table class="summary-table"><thead><tr><th>Name</th>';
  reviewers.forEach(reviewer => {
    html += `<th>${reviewer} (Status)</th><th>${reviewer} (Comment)</th>`;
  });
  html += '</tr></thead><tbody>';

  responses.forEach(res => {
    const id = getResponseId(res);
    html += `<tr><td>${res.Name}</td>`;
    reviewers.forEach(reviewer => {
      const review = ratings[id]?.[reviewer] || {};
      html += `<td>${review.status || ''}</td><td>${review.comment || ''}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table>';
  summaryDiv.innerHTML = html;

  document.getElementById('back-from-summary').addEventListener('click', () => {
    currentView = 'list';
    summaryDiv.innerHTML = '';
    renderCards();
  });
}

