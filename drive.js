// -------------------- Account Utilities --------------------

function getAccounts() {
  return JSON.parse(localStorage.getItem('goldriveAccounts') || '[]');
}

function saveAccounts(accounts) {
  localStorage.setItem('goldriveAccounts', JSON.stringify(accounts));
}

function getCurrentUser() {
  return localStorage.getItem('goldriveCurrentUser');
}

function setCurrentUser(username) {
  localStorage.setItem('goldriveCurrentUser', username);
}

function removeCurrentUser() {
  localStorage.removeItem('goldriveCurrentUser');
}

// -------------------- File Utilities --------------------

function getUserFiles() {
  const user = getCurrentUser();
  return JSON.parse(localStorage.getItem(`goldriveFiles_${user}`) || '[]');
}

function saveUserFiles(files) {
  const user = getCurrentUser();
  localStorage.setItem(`goldriveFiles_${user}`, JSON.stringify(files));
}

// -------------------- File Manager Logic --------------------

function uploadFiles() {
  const files = document.getElementById('fileInput').files;
  if (files.length === 0) {
    alert('Please select files first');
    return;
  }

  let fileList = getUserFiles();

  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = function (e) {
      fileList.push({
        name: file.name,
        size: file.size,
        type: file.type,
        data: e.target.result,
        uploaded: new Date().toISOString()
      });
      saveUserFiles(fileList);
      displayFiles();
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('fileInput').value = '';
}

function displayFiles() {
  const fileList = getUserFiles();
  const filesList = document.getElementById('filesList');

  if (fileList.length === 0) {
    filesList.innerHTML = '<p>No files uploaded yet</p>';
    return;
  }

  filesList.innerHTML = fileList.map((file, index) => `
    <div class="file-item">
      <div class="file-info">
        <strong>${file.name}</strong>
        <br><small>${formatFileSize(file.size)} • ${new Date(file.uploaded).toLocaleDateString()}</small>
      </div>
      <div class="file-actions">
        <button class="btn" onclick="downloadFile(${index})">Download</button>
        <button class="btn delete-btn" onclick="deleteFile(${index})">Delete</button>
      </div>
    </div>
  `).join('');
}

function downloadFile(index) {
  const fileList = getUserFiles();
  const file = fileList[index];

  const a = document.createElement('a');
  a.href = file.data;
  a.download = file.name;
  a.click();
}

function deleteFile(index) {
  if (!confirm('Delete this file?')) return;

  const fileList = getUserFiles();
  fileList.splice(index, 1);
  saveUserFiles(fileList);
  displayFiles();
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// -------------------- Account Page Logic --------------------

function createAccount() {
  const username = document.getElementById('newAccount').value.trim();
  if (!username) return alert('Enter a valid username');

  let accounts = getAccounts();
  if (accounts.includes(username)) return alert('Account already exists');

  accounts.push(username);
  saveAccounts(accounts);
  renderAccounts();
  document.getElementById('newAccount').value = '';
}

function switchAccount(username) {
  setCurrentUser(username);
  window.location.href = 'index.html';
}

function deleteAccount(username) {
  if (!confirm(`Delete account "${username}" and all its files?`)) return;

  let accounts = getAccounts().filter(acc => acc !== username);
  saveAccounts(accounts);
  localStorage.removeItem(`goldriveFiles_${username}`);

  if (getCurrentUser() === username) {
    removeCurrentUser();
  }

  renderAccounts();
}

function renderAccounts() {
  const accounts = getAccounts();
  const list = document.getElementById('accountList');
  if (!list) return;

  list.innerHTML = accounts.map(username => `
    <li>
      <strong>${username}</strong>
      <button class="btn" onclick="switchAccount('${username}')">Login</button>
      <button class="btn delete-btn" onclick="deleteAccount('${username}')">Delete</button>
    </li>
  `).join('');
}

// -------------------- Page Initialization --------------------

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('filesList')) {
    if (!getCurrentUser()) {
      window.location.href = 'accounts.html';
    } else {
      displayFiles();
    }
  }

  if (document.getElementById('accountList')) {
    renderAccounts();
  }
});