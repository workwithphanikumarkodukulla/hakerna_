// Faculty Dashboard JavaScript

let selectedStudent = null;
let facultyReviewQueue = [];
let allBootstrapStudents = [];

// ─────────────────────────────────────────
// Boot
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async function () {
    if (!checkAuth() || currentUserType !== 'faculty') {
        window.location.href = 'index.html';
        return;
    }

    initializeFacultyDashboard();
    await refreshFacultyQueue();
});

// ─────────────────────────────────────────
// Live Data Refresh
// ─────────────────────────────────────────
async function refreshFacultyQueue() {
    try {
        const queue = await window.api.getReviewQueue();
        facultyReviewQueue = Array.isArray(queue) ? queue : [];
        renderFacultyQueue(facultyReviewQueue);
        // Update badge count in sidebar
        const pendingCount = facultyReviewQueue.length;
        const badge = document.getElementById('pendingBadge');
        if (badge) badge.textContent = pendingCount > 0 ? pendingCount : '';
    } catch (error) {
        console.warn('Unable to load faculty review queue:', error.message);
        renderFacultyQueue([]);
    }
}

async function refreshBootstrapStudents() {
    try {
        const bootstrap = await hydrateBootstrapData();
        allBootstrapStudents = (bootstrap && bootstrap.students) ? bootstrap.students : (dummyData.students || []);
    } catch {
        allBootstrapStudents = dummyData.students || [];
    }
}

// ─────────────────────────────────────────
// Init
// ─────────────────────────────────────────
function initializeFacultyDashboard() {
    loadFacultyData();
    loadRecentActivities();
    loadStudentsList();
    loadFacultyArticles();
}

// ─────────────────────────────────────────
// Load Faculty Data
// ─────────────────────────────────────────
function loadFacultyData() {
    if (!currentUser) return;

    const facultyImage = (currentUser.profileImage && !currentUser.profileImage.includes('via.placeholder.com'))
        ? currentUser.profileImage
        : dataManager.getDefaultProfileImage('faculty', currentUser.name);

    const teacherCode = currentUser.teacherCode
        || currentUser.facultyProfile?.teacherCode
        || 'Not Assigned';

    // Sidebar
    document.getElementById('facultyName').textContent = currentUser.name;
    document.getElementById('facultyDesignation').textContent = `${currentUser.designation || ''}, ${currentUser.department || ''}`.replace(/^, |, $/, '');
    document.getElementById('facultyCollege').textContent = currentUser.college || currentUser.institution || '';
    document.getElementById('facultyAvatar').src = facultyImage;

    // Overview card
    document.getElementById('profileImage').src = facultyImage;
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('profileDesignation').textContent = `${currentUser.designation || ''}, ${currentUser.department || ''}`.replace(/^, |, $/, '');
    document.getElementById('experienceYears').textContent = currentUser.experience || currentUser.facultyProfile?.experience || '0';
    document.getElementById('totalArticles').textContent = currentUser.articles?.length || 0;

    // Profile form
    document.getElementById('facultyFullName').value = currentUser.name;
    document.getElementById('facultyDesignationInput').value = currentUser.designation || '';
    document.getElementById('facultyDepartment').value = currentUser.department || '';
    document.getElementById('facultyEmail').value = currentUser.email;
    document.getElementById('facultyExperience').value = currentUser.experience || currentUser.facultyProfile?.experience || '';
    const tcField = document.getElementById('teacherCode');
    if (tcField) tcField.value = teacherCode;
    document.getElementById('editFacultyImage').src = facultyImage;

    // Count assigned students from bootstrapData or dummyData
    const collegeStudents = (window.dummyData?.students || []).filter(s => s.college === currentUser.college);
    document.getElementById('totalStudents').textContent = collegeStudents.length || '—';
    document.getElementById('creditsGiven').textContent = '—';
}

// ─────────────────────────────────────────
// Recent Activities (live from review queue)
// ─────────────────────────────────────────
function loadRecentActivities() {
    const container = document.getElementById('recentActivities');
    if (facultyReviewQueue.length) {
        container.innerHTML = facultyReviewQueue.slice(0, 5).map(item => {
            const student = item.ownerUserId || {};
            return `
            <div class="d-flex align-items-center mb-3 pb-3 border-bottom">
                <div class="me-3">
                    <div class="rounded-circle bg-primary bg-opacity-10 p-2">
                        <i class="fas fa-trophy text-primary"></i>
                    </div>
                </div>
                <div class="flex-grow-1">
                    <div class="fw-semibold">${student.name || 'Student'}</div>
                    <div class="text-muted small">submitted <em>${item.title}</em> for verification</div>
                    <div class="text-muted small">${new Date(item.createdAt || Date.now()).toLocaleString()}</div>
                </div>
                <span class="badge bg-warning text-dark">Pending</span>
            </div>`;
        }).join('');
    } else {
        const collegeStudents = (window.dummyData?.students || []).filter(s => s.college === currentUser.college);
        const activities = [
            { student: collegeStudents[0]?.name || 'Student A', action: 'uploaded a new certificate', time: '2 hours ago', icon: 'certificate', color: 'success' },
            { student: collegeStudents[1]?.name || 'Student B', action: 'added internship experience', time: '5 hours ago', icon: 'briefcase', color: 'info' },
        ];
        container.innerHTML = activities.map(a => `
            <div class="d-flex align-items-center mb-3 pb-3 border-bottom">
                <div class="me-3"><div class="rounded-circle bg-${a.color} bg-opacity-10 p-2"><i class="fas fa-${a.icon} text-${a.color}"></i></div></div>
                <div class="flex-grow-1">
                    <div class="fw-semibold">${a.student}</div>
                    <div class="text-muted small">${a.action}</div>
                    <div class="text-muted small">${a.time}</div>
                </div>
            </div>`).join('');
    }
}

// ─────────────────────────────────────────
// Section Switching
// ─────────────────────────────────────────
function showSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
    document.getElementById(sectionName).style.display = 'block';
    if (event && event.target) event.target.closest('.sidebar-item')?.classList.add('active');

    // Lazy-load notifications when section opened
    if (sectionName === 'notifications') refreshFacultyQueue();
}

// ─────────────────────────────────────────
// Students List
// ─────────────────────────────────────────
async function loadStudentsList() {
    searchStudents();
}

async function searchStudents() {
    const container = document.getElementById('studentsList');
    container.innerHTML = '<p class="text-muted">Loading students...</p>';
    
    const term = document.getElementById('studentSearchInput')?.value || '';
    const academicYear = document.getElementById('filterAcademicYear')?.value || '';
    const certName = document.getElementById('filterCertName')?.value || '';
    const certStart = document.getElementById('filterCertStart')?.value || '';
    const certEnd = document.getElementById('filterCertEnd')?.value || '';
    
    try {
        const queryParams = new URLSearchParams({ role: 'student', limit: 50 });
        if (term) queryParams.append('search', term);
        if (academicYear) queryParams.append('academicYear', academicYear);
        if (certName) queryParams.append('certName', certName);
        if (certStart) queryParams.append('certStart', certStart);
        if (certEnd) queryParams.append('certEnd', certEnd);

        const response = await window.api.request(`/users?${queryParams.toString()}`);
        renderStudentCards(container, response.items || []);
    } catch (err) {
        console.error('Error fetching students:', err);
        container.innerHTML = '<p class="text-danger">Failed to load students.</p>';
    }
}

function renderStudentCards(container, students) {
    if (!students.length) {
        container.innerHTML = '<p class="text-muted">No students match your search.</p>';
        return;
    }
    container.innerHTML = students.map(student => `
        <div class="student-card mb-3">
            <div class="row align-items-center">
                <div class="col-md-1">
                    <img src="${student.profileImage || dataManager.getDefaultProfileImage('student', student.name)}" alt="${student.name}" class="rounded-circle" style="width:50px;height:50px;object-fit:cover;">
                </div>
                <div class="col-md-4">
                    <h6 class="mb-0">${student.name}</h6>
                    <small class="text-muted">${student.course} · ${student.year}</small><br>
                    <small class="text-muted">${student.email}</small>
                </div>
                <div class="col-md-2 text-center">
                    <div class="fw-bold text-primary">${student.cgpa || '—'}</div>
                    <small class="text-muted">CGPA</small>
                </div>
                <div class="col-md-2 text-center">
                    <div class="fw-bold text-success">${student.credits || 0}</div>
                    <small class="text-muted">Credits</small>
                </div>
                <div class="col-md-3">
                    <button class="btn btn-sm btn-outline-primary me-1" onclick="viewStudentProfile('${student.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// ─────────────────────────────────────────
// Student Profile View
// ─────────────────────────────────────────
async function viewStudentProfile(studentId) {
    const modal = new bootstrap.Modal(document.getElementById('studentDetailModal'));
    document.getElementById('studentDetailContent').innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 text-muted">Loading student profile...</p>
        </div>`;
    modal.show();

    try {
        const portfolio = await window.api.request(`/portfolio/${studentId}`);
        const profile = portfolio.profile || {};
        const items = portfolio.items || [];
        selectedStudent = profile;

        document.getElementById('studentDetailContent').innerHTML = `
            <div class="row">
                <div class="col-md-4 text-center">
                    <img src="${profile.profileImage || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile.name) + '&background=f97316&color=fff&size=150'}"
                         alt="${profile.name}" class="rounded-circle mb-3" style="width:110px;height:110px;object-fit:cover;border:3px solid var(--primary);">
                    <h5>${profile.name || '—'}</h5>
                    <p class="text-muted small">${profile.headline || ''}</p>
                    <span class="badge rounded-pill" style="background:rgba(249,115,22,0.2);border:1px solid rgba(249,115,22,0.4);color:var(--primary-light);">
                        <i class="fas fa-star me-1"></i>${profile.cgpa || '—'} CGPA
                    </span>
                </div>
                <div class="col-md-8">
                    <div class="row g-2 mb-3">
                        <div class="col-6"><strong>Course:</strong> ${profile.course || '—'}</div>
                        <div class="col-6"><strong>Year:</strong> ${profile.year || '—'}</div>
                        <div class="col-6"><strong>College:</strong> ${profile.college || '—'}</div>
                        <div class="col-6"><strong>Email:</strong> <span class="text-muted small">${profile.id || ''}</span></div>
                    </div>
                    <div class="mb-3">
                        <strong>Skills:</strong><br>
                        ${(profile.skills || []).map(s => `<span class="skill-tag">${s}</span>`).join('') || '<span class="text-muted small">No skills listed</span>'}
                    </div>
                    <div class="mb-2"><strong>Verified Achievements (${items.length}):</strong></div>
                    <div style="max-height:200px;overflow-y:auto;">
                        ${items.length ? items.map(a => `
                            <div class="d-flex align-items-center mb-2 p-2 rounded" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);">
                                <i class="fas fa-trophy text-warning me-2"></i>
                                <div>
                                    <div class="small fw-semibold">${a.title}</div>
                                    <div class="text-muted" style="font-size:.78rem;">${a.category} &bull; ${a.date ? new Date(a.date).toLocaleDateString() : ''}</div>
                                </div>
                            </div>`).join('') : '<p class="text-muted small">No verified achievements yet.</p>'}
                    </div>
                </div>
            </div>`;
    } catch (e) {
        document.getElementById('studentDetailContent').innerHTML = `<div class="alert alert-danger">Could not load student profile. ${e.message}</div>`;
    }
}

// ─────────────────────────────────────────
// Verification Queue (Notifications)
// ─────────────────────────────────────────
function renderFacultyQueue(queue) {
    const container = document.getElementById('notificationsList');
    if (!container) return;

    if (!queue.length) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
                <h6 class="text-muted">No pending verification requests</h6>
                <p class="text-muted">All student submissions have been reviewed.</p>
            </div>`;
        return;
    }

    container.innerHTML = queue.map(item => {
        const student = item.ownerUserId || {};
        const proofCount = (item.proofUploads || []).length;
        return `
        <div class="card mb-3 border-start border-warning border-3" data-achievement-id="${item._id}">
            <div class="card-body">
                <div class="d-flex align-items-start">
                    <div class="me-3">
                        <div class="rounded-circle bg-warning bg-opacity-10 p-2">
                            <i class="fas fa-user-check text-warning"></i>
                        </div>
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-center">
                            <h6 class="mb-1">${item.title}</h6>
                            <span class="badge bg-secondary">${item.category}</span>
                        </div>
                        <p class="text-muted mb-1 small">${item.description || ''}</p>
                        <small class="text-muted">
                            <i class="fas fa-user me-1"></i>${student.name || 'Student'} &nbsp;
                            <i class="fas fa-star me-1"></i>${item.credits || 0} credits &nbsp;
                            <i class="fas fa-paperclip me-1"></i>${proofCount} proof(s) &nbsp;
                            <i class="fas fa-clock me-1"></i>${new Date(item.createdAt || Date.now()).toLocaleDateString()}
                        </small>
                        <div class="mt-2 d-flex gap-2 flex-wrap">
                            <button class="btn btn-outline-primary btn-sm" onclick="viewVerificationRequest('${item._id}')">
                                <i class="fas fa-eye me-1"></i>Review Details
                            </button>
                            <button class="btn btn-success btn-sm" onclick="handleVerificationAction('${item._id}', 'approve')">
                                <i class="fas fa-check me-1"></i>Approve
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="handleVerificationAction('${item._id}', 'reject')">
                                <i class="fas fa-times me-1"></i>Reject
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

// ─────────────────────────────────────────
// View Achievement Detail Modal
// ─────────────────────────────────────────
function viewVerificationRequest(achievementId) {
    const item = facultyReviewQueue.find(r => String(r._id) === String(achievementId));
    if (!item) return;

    const student = item.ownerUserId || {};
    const proofMarkup = Array.isArray(item.proofUploads) && item.proofUploads.length
        ? item.proofUploads.map(file => {
            const isImage = file.mimeType && file.mimeType.startsWith('image/');
            const url = file.path ? `/${file.path}` : '#';
            return isImage
                ? `<img src="${url}" class="img-fluid rounded mb-2 me-2" style="max-height:200px;" alt="proof">`
                : `<a class="btn btn-outline-primary btn-sm mb-2 me-2" href="${url}" target="_blank"><i class="fas fa-file me-1"></i>View Proof</a>`;
        }).join('')
        : '<p class="text-muted small">No proof uploaded.</p>';

    document.getElementById('studentDetailContent').innerHTML = `
        <div class="row g-3">
            <div class="col-md-4 text-center">
                <img src="${student.profileImage || dataManager.getDefaultProfileImage('student', student.name || 'Student')}"
                     alt="${student.name || 'Student'}" class="rounded-circle mb-3" style="width:100px;height:100px;object-fit:cover;">
                <h5>${student.name || 'Unknown Student'}</h5>
                <p class="text-muted small">${student.email || ''}</p>
                <span class="badge bg-warning text-dark">Pending Review</span>
            </div>
            <div class="col-md-8">
                <h5 class="mb-1">${item.title}</h5>
                <p class="text-muted">${item.description || ''}</p>
                <div class="row mb-3 g-2">
                    <div class="col-sm-6"><strong>Category:</strong> ${item.category}</div>
                    <div class="col-sm-6"><strong>Credits:</strong> ${item.credits || 0}</div>
                    <div class="col-sm-6"><strong>Department:</strong> ${item.department || 'N/A'}</div>
                    <div class="col-sm-6"><strong>Date:</strong> ${item.startDate ? new Date(item.startDate).toLocaleDateString() : 'N/A'}</div>
                    <div class="col-sm-6"><strong>Organizer:</strong> ${item.organizer || 'N/A'}</div>
                    <div class="col-sm-6"><strong>Class Teacher Code:</strong> ${student.studentProfile?.classTeacherCode || 'N/A'}</div>
                </div>
                <div class="mb-3">
                    <strong>Proof Documents:</strong>
                    <div class="mt-2">${proofMarkup}</div>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-success" onclick="handleVerificationAction('${item._id}', 'approve')">
                        <i class="fas fa-check me-1"></i>Approve
                    </button>
                    <button class="btn btn-danger" onclick="handleVerificationAction('${item._id}', 'reject')">
                        <i class="fas fa-times me-1"></i>Reject
                    </button>
                </div>
            </div>
        </div>
    `;

    // Reuse the student detail modal as achievement review modal
    document.querySelector('#studentDetailModal .modal-title').textContent = 'Achievement Verification';
    document.querySelector('#studentDetailModal .modal-footer').innerHTML = '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>';
    new bootstrap.Modal(document.getElementById('studentDetailModal')).show();
}

// ─────────────────────────────────────────
// Approve / Reject Handler
// ─────────────────────────────────────────
async function handleVerificationAction(achievementId, decision) {
    try {
        await window.api.reviewAchievement(
            achievementId,
            decision,
            decision === 'approve' ? 'Verified by class teacher' : 'Rejected by class teacher'
        );

        showToast(
            decision === 'approve'
                ? '✅ Achievement approved and forwarded to college for final verification.'
                : '❌ Achievement rejected. Student has been notified.',
            decision === 'approve' ? 'success' : 'warning'
        );

        // Close modal if open
        const modalEl = document.getElementById('studentDetailModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        await refreshFacultyQueue();
        loadRecentActivities();
    } catch (error) {
        showToast(error.message || 'Unable to update verification status', 'danger');
    }
}

// Legacy alias
async function handleNotificationAction(id, action) { return handleVerificationAction(id, action); }

// ─────────────────────────────────────────
// Publish Article
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    const articleForm = document.getElementById('articleForm');
    if (articleForm) {
        articleForm.addEventListener('submit', function (e) {
            e.preventDefault();
            publishArticle();
        });
    }
});

async function publishArticle() {
    const title = document.getElementById('articleTitle').value.trim();
    const content = document.getElementById('articleContent').value.trim();
    const tags = document.getElementById('articleTags').value;
    const category = document.getElementById('articleCategory').value;
    const readingTime = document.getElementById('readingTime').value;

    if (!title || !content) {
        showToast('Please fill in all required fields', 'danger');
        return;
    }

    const achievementPayload = {
        category: 'article',
        title,
        description: content,
        organizer: currentUser.name,
        remarks: tags,
        department: currentUser.department || '',
    };

    try {
        const saved = await window.api.createAchievement(achievementPayload);

        // Also update local state
        if (!currentUser.articles) currentUser.articles = [];
        currentUser.articles.push({ title, content, tags: tags.split(',').map(t => t.trim()), category, readingTime: parseInt(readingTime), date: new Date().toISOString().split('T')[0], author: currentUser.name, id: saved._id });
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        document.getElementById('articleForm').reset();
        document.getElementById('totalArticles').textContent = currentUser.articles.length;
        loadFacultyArticles();
        showToast('Article published successfully! Pending college approval.', 'success');
        showSection('articles');
    } catch (error) {
        showToast(error.message || 'Failed to publish article.', 'danger');
    }
}

// ─────────────────────────────────────────
// Faculty Articles List
// ─────────────────────────────────────────
function loadFacultyArticles() {
    const container = document.getElementById('facultyArticlesList');
    const articles = currentUser.articles || [];

    if (!articles.length) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-newspaper fa-3x text-muted mb-3"></i>
                <h6 class="text-muted">No articles published yet</h6>
                <p class="text-muted">Share your knowledge with students</p>
                <button class="btn btn-success" onclick="showSection('publish')">
                    <i class="fas fa-pen me-1"></i>Write Your First Article
                </button>
            </div>`;
        return;
    }

    container.innerHTML = articles.map((article, index) => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="card-title">${article.title}</h6>
                        <p class="card-text text-muted">${(article.content || '').substring(0, 200)}${article.content?.length > 200 ? '...' : ''}</p>
                        <small class="text-muted"><i class="fas fa-calendar me-1"></i>${formatDate(article.date)}</small>
                        ${article.status === 'approved' ? '<span class="badge bg-success ms-2"><i class="fas fa-check-circle me-1"></i>Verified</span>' :
                          article.status === 'rejected' ? '<span class="badge bg-danger ms-2">Rejected</span>' :
                          '<span class="badge bg-warning text-dark ms-2">Pending College Review</span>'}
                    </div>
                    <div class="dropdown ms-3">
                        <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown"><i class="fas fa-ellipsis-v"></i></button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="#" onclick="editArticle(${index})"><i class="fas fa-edit me-2"></i>Edit</a></li>
                            <li><a class="dropdown-item text-danger" href="#" onclick="deleteArticle(${index})"><i class="fas fa-trash me-2"></i>Delete</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>`).join('');
}

// ─────────────────────────────────────────
// Profile Edit
// ─────────────────────────────────────────
function editFacultyProfile() {
    const form = document.getElementById('facultyProfileForm');
    form.querySelectorAll('input:not([readonly])').forEach(i => i.disabled = false);
}

function cancelFacultyEdit() {
    loadFacultyData();
}

document.addEventListener('DOMContentLoaded', function () {
    const profileForm = document.getElementById('facultyProfileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            // Profile update currently just saves locally — extend with PATCH /api/users/:id if needed
            currentUser.name = document.getElementById('facultyFullName').value;
            currentUser.designation = document.getElementById('facultyDesignationInput').value;
            currentUser.department = document.getElementById('facultyDepartment').value;
            currentUser.experience = document.getElementById('facultyExperience').value;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            loadFacultyData();
            showToast('Profile updated successfully!', 'success');
        });
    }
});

// ─────────────────────────────────────────
// Article Edit / Delete
// ─────────────────────────────────────────
function editArticle(index) {
    const article = currentUser.articles[index];
    document.getElementById('articleTitle').value = article.title;
    document.getElementById('articleContent').value = article.content;
    document.getElementById('articleTags').value = article.tags ? article.tags.join(', ') : '';
    document.getElementById('articleCategory').value = article.category || 'technology';
    document.getElementById('readingTime').value = article.readingTime || 5;
    showSection('publish');
}

function deleteArticle(index) {
    if (confirm('Are you sure you want to delete this article?')) {
        currentUser.articles.splice(index, 1);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        loadFacultyArticles();
        document.getElementById('totalArticles').textContent = currentUser.articles.length;
        showToast('Article deleted', 'success');
    }
}

// ─────────────────────────────────────────
// Export
// ─────────────────────────────────────────
function exportStudentData() {
    const students = (window.dummyData?.students || []).filter(s => s.college === currentUser.college);
    const rows = [['Name', 'Course', 'Year', 'CGPA', 'Email', 'Credits'],
        ...students.map(s => [s.name, s.course, s.year, s.cgpa, s.email, s.credits])];
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    showToast('Student data exported!', 'success');
}

// ─────────────────────────────────────────
// Utility
// ─────────────────────────────────────────
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function showToast(message, type = 'info') {
    const existing = document.querySelectorAll('.toast-notify');
    existing.forEach(t => t.remove());

    const bgClass = type === 'success' ? 'bg-success'
        : type === 'danger' || type === 'error' ? 'bg-danger'
        : type === 'warning' ? 'bg-warning text-dark'
        : 'bg-info';

    document.body.insertAdjacentHTML('beforeend', `
        <div class="toast align-items-center text-white ${bgClass} border-0 position-fixed toast-notify"
             style="top:20px;right:20px;z-index:9999;" role="alert">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>`);
    new bootstrap.Toast(document.querySelector('.toast-notify')).show();
    setTimeout(() => document.querySelectorAll('.toast-notify').forEach(t => t.remove()), 5000);
}