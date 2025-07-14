const reviewerInput = document.getElementById('reviewer-name');
const reviewerSelect = document.getElementById('reviewer-select');
const addReviewerBtn = document.getElementById('add-reviewer');
// const reviewerKeyInput = document.getElementById('reviewer-key');
// const validateKeyBtn = document.getElementById('validate-key');
// const toggleKeyVisibilityBtn = document.getElementById('toggle-key-visibility');
// const keyStatus = document.getElementById('key-status');
const fileInput = document.getElementById('file-input');
const loadFileBtn = document.getElementById('load-file');
const fileStatus = document.getElementById('file-status');
const searchInput = document.getElementById('search');
const userSelect = document.getElementById('user-select');
const filterSelect = document.getElementById('filter');
const cardsContainer = document.getElementById('cards');
const summaryDiv = document.getElementById('summary');
const showSummaryBtn = document.getElementById('show-summary');

let responses = [];
let currentView = 'list';
let ratings = JSON.parse(localStorage.getItem('ratings_v1') || '{}');
let reviewers = JSON.parse(localStorage.getItem('reviewers') || '[]');
// let reviewerKeys = JSON.parse(localStorage.getItem('reviewer_keys') || '{}');
let selectedFile = null;
// let currentReviewerValidated = false;
// let keyVisible = false;

window.addEventListener('DOMContentLoaded', () => {
  loadReviewers();
  if (!fileInput.files.length) {
    loadDefaultFile();
  }
});

function loadReviewers() {
  reviewerSelect.innerHTML = '<option value="">Select a reviewer</option>';
  reviewers.forEach(reviewer => {
    const option = document.createElement('option');
    option.value = reviewer;
    option.textContent = reviewer;
    reviewerSelect.appendChild(option);
  });
}

function addReviewer() {
  const name = reviewerInput.value.trim();
  if (!name) {
    alert('Please enter a reviewer name');
    return;
  }
  if (!reviewers.includes(name)) {
    reviewers.push(name);
    // Generate a unique key for the reviewer
    // const key = generateReviewerKey();
    // reviewerKeys[name] = key;
    
    localStorage.setItem('reviewers', JSON.stringify(reviewers));
    // localStorage.setItem('reviewer_keys', JSON.stringify(reviewerKeys));
    
    loadReviewers();
    reviewerInput.value = '';
    
    // Show the generated key to the user
    alert(`Reviewer "${name}" added successfully!`);
  } else {
    alert('Reviewer already exists');
  }
}

// function generateReviewerKey() {
//   // Generate a 6-character alphanumeric key
//   const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
//   let result = '';
//   for (let i = 0; i < 6; i++) {
//     result += chars.charAt(Math.floor(Math.random() * chars.length));
//   }
//   return result;
// }

// function validateReviewerKey() {
//   const reviewer = reviewerInput.value.trim();
//   const key = reviewerKeyInput.value.trim();
//   
//   if (!reviewer) {
//     alert('Please select a reviewer first');
//     return;
//   }
//   
//   if (!key) {
//     alert('Please enter your reviewer key');
//     return;
//   }
//   
//   if (reviewerKeys[reviewer] === key) {
//     currentReviewerValidated = true;
//     keyStatus.textContent = '✅ Key validated';
//     keyStatus.style.color = '#4CAF50';
//     reviewerKeyInput.style.border = '2px solid #4CAF50';
//     reviewerKeyInput.style.background = '#E8F5E8';
//     
//     // Enable reviewing functionality
//     renderCards();
//     alert('Key validated successfully! You can now review responses.');
//   } else {
//     currentReviewerValidated = false;
//     keyStatus.textContent = '❌ Invalid key';
//     keyStatus.style.color = '#F44336';
//     reviewerKeyInput.style.border = '2px solid #F44336';
//     reviewerKeyInput.style.background = '#FFEBEE';
//     alert('Invalid key. Please check your key and try again.');
//   }
// }

// function resetKeyValidation() {
//   currentReviewerValidated = false;
//   keyStatus.textContent = 'No key entered';
//   keyStatus.style.color = '#666';
//   reviewerKeyInput.style.border = '';
//   reviewerKeyInput.style.background = '';
//   reviewerKeyInput.value = '';
//   // Reset key visibility to hidden
//   reviewerKeyInput.type = 'password';
//   keyVisible = false;
//   toggleKeyVisibilityBtn.textContent = '👁️';
// }

// function toggleKeyVisibility() {
//   keyVisible = !keyVisible;
//   if (keyVisible) {
//     reviewerKeyInput.type = 'text';
//     toggleKeyVisibilityBtn.textContent = '🙈';
//   } else {
//     reviewerKeyInput.type = 'password';
//     toggleKeyVisibilityBtn.textContent = '👁️';
//   }
// }

function switchReviewer() {
  const selected = reviewerSelect.value;
  if (selected) {
    reviewerInput.value = selected;
    // Reset key validation when switching reviewers
    // resetKeyValidation();
    // Clear any existing reviewer-specific data display
    currentView = 'list';
    // Force complete re-render by clearing containers first
    cardsContainer.innerHTML = '';
    summaryDiv.innerHTML = '';
    // Use setTimeout to ensure DOM updates before re-rendering
    setTimeout(() => {
      renderCards();
      highlightCurrentReviewer();
    }, 10);
  }
}

function handleFileSelect() {
  const file = fileInput.files[0];
  if (file) {
    selectedFile = file;
    fileStatus.textContent = `Selected: ${file.name}`;
    loadFileBtn.disabled = false;
  } else {
    selectedFile = null;
    fileStatus.textContent = 'No file selected';
    loadFileBtn.disabled = true;
  }
}

function loadSelectedFile() {
  if (!selectedFile) {
    alert('Please select a file first');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const parsed = parseSheetWithHeaders(sheet);
    responses = parsed.responses;
    window._questionHeaders = parsed.questionHeaders;
    window._colMeta = parsed.colMeta;
    populateUserSelect();
    renderCards();
    fileStatus.textContent = `Loaded: ${selectedFile.name}`;
  };
  reader.readAsArrayBuffer(selectedFile);
}

function parseSheetWithHeaders(sheet) {
  // Get merges info from SheetJS
  const merges = sheet['!merges'] || [];
  // Get the range of the sheet
  const ref = sheet['!ref'];
  if (!ref) return { responses: [], columns: [] };
  const [start, end] = ref.split(':');
  const startCol = start.replace(/\d+/g, '');
  const startRow = parseInt(start.replace(/\D+/g, ''));
  const endCol = end.replace(/\d+/g, '');
  const endRow = parseInt(end.replace(/\D+/g, ''));

  // Helper to convert col number to letter and vice versa
  function colToNum(col) {
    let num = 0;
    for (let i = 0; i < col.length; i++) {
      num = num * 26 + (col.charCodeAt(i) - 64);
    }
    return num;
  }
  function numToCol(num) {
    let col = '';
    while (num > 0) {
      let rem = (num - 1) % 26;
      col = String.fromCharCode(65 + rem) + col;
      num = Math.floor((num - 1) / 26);
    }
    return col;
  }

  // Build column list
  const columns = [];
  for (let c = colToNum(startCol); c <= colToNum(endCol); c++) {
    columns.push(numToCol(c));
  }

  // Parse categories and subcategories
  const categoryRow = startRow;
  const subcategoryRow = startRow + 1;
  const colMeta = {};
  
  // Initialize colMeta for all columns
  columns.forEach(col => {
    colMeta[col] = {
      category: '',
      subcategory: ''
    };
  });

  // Fill in category and subcategory values
  columns.forEach(col => {
    const catCell = sheet[col + categoryRow];
    const subcatCell = sheet[col + subcategoryRow];
    if (catCell) colMeta[col].category = catCell.v;
    if (subcatCell) colMeta[col].subcategory = subcatCell.v;
  });

  // Apply merges to fill down category/subcategory
  merges.forEach(m => {
    if (m.s.r === categoryRow - 1) { // category row
      const sourceCol = numToCol(m.s.c + 1);
      const val = sheet[sourceCol + categoryRow]?.v || '';
      for (let c = m.s.c + 1; c <= m.e.c + 1; c++) {
        const targetCol = numToCol(c);
        if (colMeta[targetCol]) {
          colMeta[targetCol].category = val;
        }
      }
    }
    if (m.s.r === subcategoryRow - 1) { // subcategory row
      const sourceCol = numToCol(m.s.c + 1);
      const val = sheet[sourceCol + subcategoryRow]?.v || '';
      for (let c = m.s.c + 1; c <= m.e.c + 1; c++) {
        const targetCol = numToCol(c);
        if (colMeta[targetCol]) {
          colMeta[targetCol].subcategory = val;
        }
      }
    }
  });

  // Parse responses (from row 3 onward)
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: startRow + 1 });
  // First row in data is header (question names)
  const questionHeaders = data[0];
  const responses = data.slice(1).map(row => {
    const obj = {};
    row.forEach((val, idx) => {
      const col = columns[idx];
      const meta = colMeta[col] || { category: '', subcategory: '' };
      obj[questionHeaders[idx]] = {
        value: val,
        category: meta.category || '',
        subcategory: meta.subcategory || ''
      };
    });
    return obj;
  });
  return { responses, questionHeaders, colMeta };
}

function loadDefaultFile() {
  fetch('data/test_table.xlsx')
    .then(res => res.arrayBuffer())
    .then(data => {
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const parsed = parseSheetWithHeaders(sheet);
      responses = parsed.responses;
      window._questionHeaders = parsed.questionHeaders;
      window._colMeta = parsed.colMeta;
      populateUserSelect();
      renderCards();
    })
    .catch(err => console.error('Failed to load default file:', err));
}



fileInput.addEventListener('change', handleFileSelect);
loadFileBtn.addEventListener('click', loadSelectedFile);
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
addReviewerBtn.addEventListener('click', addReviewer);
// validateKeyBtn.addEventListener('click', validateReviewerKey);
reviewerSelect.addEventListener('change', switchReviewer);
// toggleKeyVisibilityBtn.addEventListener('click', toggleKeyVisibility);

// Highlight current reviewer in the dropdown and input
function highlightCurrentReviewer() {
  const current = reviewerInput.value.trim();
  // Highlight in dropdown
  Array.from(reviewerSelect.options).forEach(opt => {
    if (opt.value === current) {
      opt.style.background = '#2196F3';
      opt.style.color = 'white';
      opt.style.fontWeight = 'bold';
    } else {
      opt.style.background = '';
      opt.style.color = '';
      opt.style.fontWeight = '';
    }
  });
  // Highlight input
  if (current) {
    reviewerInput.style.background = '#E3F2FD';
    reviewerInput.style.border = '2px solid #2196F3';
    reviewerInput.style.fontWeight = 'bold';
  } else {
    reviewerInput.style.background = '';
    reviewerInput.style.border = '';
    reviewerInput.style.fontWeight = '';
  }
}

// Call highlight on relevant events
reviewerInput.addEventListener('input', highlightCurrentReviewer);
reviewerSelect.addEventListener('change', highlightCurrentReviewer);
document.addEventListener('DOMContentLoaded', highlightCurrentReviewer);

// Legacy function - kept for backward compatibility
function handleFile(e) {
  const file = e.target.files[0];
  if (file) {
    selectedFile = file;
    fileStatus.textContent = `Selected: ${file.name}`;
    loadFileBtn.disabled = false;
    loadSelectedFile();
  }
}

function populateUserSelect() {
  userSelect.innerHTML = '<option value="">Select a user</option>';
  const names = Array.from(new Set(responses.map(r => r['Name']?.value || r['Name']).filter(Boolean)));
  names.sort().forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    userSelect.appendChild(option);
  });
}

function getResponseId(res) {
  // Handle both old format (res.Name) and new format (res.Name.value)
  return res.Name?.value || res.Name;
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
    const name = res['Name']?.value || res['Name'];
    const nameMatch = name?.toLowerCase().includes(searchVal);
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

    // Only use current reviewer's rating for border color, no fallback to other reviewers
    if (reviewerRating?.status === 'Green') {
      card.style.borderLeftColor = '#4CAF50';
    }
    else if (reviewerRating?.status === 'Green to Blue') {
      card.style.borderLeftColor = '#66BB6A';
    }
    else if (reviewerRating?.status === 'Blue to Green') {
      card.style.borderLeftColor = '#42A5F5';
    }
    else if (reviewerRating?.status === 'Blue') {
      card.style.borderLeftColor = '#2196F3';
    }
    else if (reviewerRating?.status === 'Blue to Black') {
      card.style.borderLeftColor = '#5C6BC0';
    }
    else if (reviewerRating?.status === 'Black to Blue') {
      card.style.borderLeftColor = '#3F51B5';
    }
    else if (reviewerRating?.status === 'Black') {
      card.style.borderLeftColor = '#212121';
    }
    else {
      card.style.borderLeftColor = '#ccc';
    }

    const name = document.createElement('h3');
    name.textContent = res['Name']?.value || res['Name'] || `Respondent ${idx + 1}`;

    // Group Q&A by category and subcategory
    const qaBlock = document.createElement('div');
    const grouped = {};
    Object.entries(res).forEach(([key, val]) => {
      if (key === 'Name') return;
      const cat = val.category || '';
      const subcat = val.subcategory || '';
      grouped[cat] = grouped[cat] || {};
      grouped[cat][subcat] = grouped[cat][subcat] || [];
      grouped[cat][subcat].push({ question: key, answer: val.value });
    });
    Object.entries(grouped).forEach(([cat, subcats]) => {
      const catDiv = document.createElement('div');
      catDiv.className = 'qa-category';
      if (cat) {
        const catTitle = document.createElement('h4');
        catTitle.textContent = cat;
        catDiv.appendChild(catTitle);
      }
      Object.entries(subcats).forEach(([subcat, qas]) => {
        const subcatDiv = document.createElement('div');
        subcatDiv.className = 'qa-subcategory';
        if (subcat) {
          const subcatTitle = document.createElement('h5');
          subcatTitle.textContent = subcat;
          subcatDiv.appendChild(subcatTitle);
        }
        qas.forEach(({ question, answer }) => {
          const qa = document.createElement('p');
          qa.className = 'qa';
          qa.innerHTML = `<strong>${question}:</strong> ${answer}`;
          subcatDiv.appendChild(qa);
        });
        catDiv.appendChild(subcatDiv);
      });
      qaBlock.appendChild(catDiv);
    });

    card.appendChild(name);
    if (reviewer && allRatings[reviewer]) {
      const badge = document.createElement('div');
      badge.style.fontSize = '0.85rem';
      badge.style.marginTop = '4px';
      badge.style.color = '#666';
      badge.textContent = `Your rating: ${allRatings[reviewer].status || '—'}`;
      card.appendChild(badge);
    } else if (reviewer) {
      const badge = document.createElement('div');
      badge.style.fontSize = '0.85rem';
      badge.style.marginTop = '4px';
      badge.style.color = '#999';
      badge.textContent = `No rating yet`;
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
  // if (!currentReviewerValidated) return alert('Please validate your reviewer key before reviewing.');

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
  name.textContent = res['Name']?.value || res['Name'];

  // Group Q&A by category and subcategory
  const qaBlock = document.createElement('div');
  const grouped = {};
  Object.entries(res).forEach(([key, val]) => {
    if (key === 'Name') return;
    const cat = val.category || '';
    const subcat = val.subcategory || '';
    grouped[cat] = grouped[cat] || {};
    grouped[cat][subcat] = grouped[cat][subcat] || [];
    grouped[cat][subcat].push({ question: key, answer: val.value });
  });
  Object.entries(grouped).forEach(([cat, subcats]) => {
    const catDiv = document.createElement('div');
    catDiv.className = 'qa-category';
    if (cat) {
      const catTitle = document.createElement('h4');
      catTitle.textContent = cat;
      catDiv.appendChild(catTitle);
    }
    Object.entries(subcats).forEach(([subcat, qas]) => {
      const subcatDiv = document.createElement('div');
      subcatDiv.className = 'qa-subcategory';
      if (subcat) {
        const subcatTitle = document.createElement('h5');
        subcatTitle.textContent = subcat;
        subcatDiv.appendChild(subcatTitle);
      }
      qas.forEach(({ question, answer }) => {
        const qa = document.createElement('p');
        qa.className = 'qa';
        qa.innerHTML = `<strong>${question}:</strong> ${answer}`;
        subcatDiv.appendChild(qa);
      });
      catDiv.appendChild(subcatDiv);
    });
    qaBlock.appendChild(catDiv);
  });

  const statusButtons = document.createElement('div');
  statusButtons.className = 'status-buttons';
  const categories = [
    'Green',
    'Green to Blue', 
    'Blue to Green',
    'Blue',
    'Blue to Black',
    'Black to Blue',
    'Black'
  ];
  
  categories.forEach(status => {
    const btn = document.createElement('button');
    btn.textContent = status;
    btn.className = status.toLowerCase().replace(/\s+/g, '-');
    btn.onclick = () => {
      const id = getResponseId(res);
      ratings[id] = ratings[id] || {};
      ratings[id][reviewer] = ratings[id][reviewer] || {};
      ratings[id][reviewer].status = status;
      saveRatings();
    
      // Update UI
      Array.from(statusButtons.children).forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    
      // Optional: Refresh other areas if needed
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
  const currentReviewer = reviewerInput.value.trim();
  
  // Show current reviewer's review first, then others
  let reviewsHtml = '<strong>All Reviews:</strong><br>';
  
  // Show current reviewer's review first
  if (all[currentReviewer]) {
    reviewsHtml += `<div style="background: #E3F2FD; padding: 0.5rem; border-radius: 4px; margin-bottom: 0.5rem;">
      <strong>${currentReviewer} (You):</strong> ${all[currentReviewer].status || 'No status'}<br>
      📝 ${all[currentReviewer].comment || ''}
    </div>`;
  }
  
  // Show other reviewers' reviews
  Object.entries(all).forEach(([rev, info]) => {
    if (rev !== currentReviewer) {
      reviewsHtml += `<div><strong>${rev}:</strong> ${info.status || 'No status'}<br>📝 ${info.comment || ''}</div><hr>`;
    }
  });
  
  otherReviews.innerHTML = reviewsHtml;

  // Add OK button
  const okButton = document.createElement('button');
  okButton.className = 'ok-button';
  okButton.textContent = 'OK';
  okButton.onclick = () => {
    currentView = 'list';
    renderCards();
  };

  detail.appendChild(name);
  detail.appendChild(qaBlock);
  detail.appendChild(statusButtons);
  detail.appendChild(commentBox);
  detail.appendChild(otherReviews);
  detail.appendChild(okButton);

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
    const name = res['Name']?.value || res['Name'] || 'Unknown';
    html += `<tr><td>${name}</td>`;
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

