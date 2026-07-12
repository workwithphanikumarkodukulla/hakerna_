// College Dashboard JavaScript

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function () {
    if (!checkAuth() || (currentUserType !== 'college' && currentUserType !== 'admin')) {
        window.location.href = 'index.html';
        return;
    }

    initializeCollegeDashboard();
    refreshCollegeNotifications();
});

async function refreshCollegeNotifications() {
    try {
        const notifications = await window.api.getNotifications();
        renderCollegeNotifications(Array.isArray(notifications) ? notifications : []);
    } catch (error) {
        console.warn('Unable to load college notifications:', error.message);
        renderCollegeNotifications([]);
    }
}

async function loadCollegeReviewQueue() {
    // The college review queue shows faculty publications (institution_verification status)
    try {
        const queue = await window.api.getReviewQueue();
        const items = Array.isArray(queue) ? queue : [];
        renderCollegeReviewQueue(items);
    } catch (error) {
        console.warn('Unable to load college review queue:', error.message);
    }
}

async function loadCollegeAuditLogs() {
    try {
        const logs = await window.api.getAuditLogs(20);
        renderAuditLogs(Array.isArray(logs) ? logs : []);
    } catch (error) {
        console.warn('Unable to load audit logs:', error.message);
    }
}

function renderCollegeReviewQueue(queue) {
    const container = document.getElementById('notificationsList');
    if (!container) return;

    if (!queue.length) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-check-circle fa-3x text-success mb-3"></i>
                <h6 class="text-muted">No pending reviews</h6>
                <p class="text-muted">All faculty publications are reviewed.</p>
            </div>`;
        return;
    }

    container.innerHTML = queue.map(item => {
        const owner = item.ownerUserId || {};
        const proofCount = (item.proofUploads || []).length;
        return `
        <div class="card mb-3 border-start border-primary border-3">
            <div class="card-body">
                <div class="d-flex align-items-start">
                    <div class="me-3">
                        <div class="rounded-circle bg-primary bg-opacity-10 p-2">
                            <i class="fas fa-${item.ownerRole === 'faculty' ? 'chalkboard-teacher' : 'user'} text-primary"></i>
                        </div>
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between">
                            <h6 class="mb-1">${item.title}</h6>
                            <span class="badge bg-${item.ownerRole === 'faculty' ? 'warning text-dark' : 'secondary'}">${item.ownerRole} · ${item.category}</span>
                        </div>
                        <p class="text-muted mb-1 small">${item.description || ''}</p>
                        <small class="text-muted">
                            <i class="fas fa-user me-1"></i>${owner.name || 'Unknown'} &nbsp;
                            <i class="fas fa-star me-1"></i>${item.credits || 0} credits &nbsp;
                            <i class="fas fa-paperclip me-1"></i>${proofCount} proof(s) &nbsp;
                            <i class="fas fa-clock me-1"></i>${new Date(item.createdAt || Date.now()).toLocaleDateString()}
                        </small>
                        <div class="mt-2 d-flex gap-2">
                            <button class="btn btn-success btn-sm" onclick="approveCollegeItem('${item._id}')">
                                <i class="fas fa-check me-1"></i>Approve
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="rejectCollegeItem('${item._id}')">
                                <i class="fas fa-times me-1"></i>Reject
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    }).join('');
}

async function approveCollegeItem(id) {
    try {
        await window.api.reviewAchievement(id, 'approve', 'Approved by institution');
        showToast('✅ Item approved successfully!', 'success');
        await loadCollegeReviewQueue();
    } catch (e) { showToast(e.message || 'Failed to approve.', 'danger'); }
}

async function rejectCollegeItem(id) {
    const remarks = prompt('Please provide a reason for rejection:') || 'Rejected by institution';
    try {
        await window.api.reviewAchievement(id, 'reject', remarks);
        showToast('❌ Item rejected. Submitter notified.', 'warning');
        await loadCollegeReviewQueue();
    } catch (e) { showToast(e.message || 'Failed to reject.', 'danger'); }
}

function renderAuditLogs(logs) {
    // Reuse the recentActivities container for audit logs
    const container = document.getElementById('recentActivities');
    if (!container || !logs.length) return;

    container.innerHTML = logs.slice(0, 10).map(log => `
        <div class="d-flex align-items-center mb-3 pb-3 border-bottom">
            <div class="me-3">
                <div class="rounded-circle bg-${log.status === 'success' ? 'success' : 'danger'} bg-opacity-10 p-2">
                    <i class="fas fa-${log.status === 'success' ? 'check' : 'times'} text-${log.status === 'success' ? 'success' : 'danger'}"></i>
                </div>
            </div>
            <div class="flex-grow-1">
                <div class="fw-semibold">${log.action || 'Action'}</div>
                <div class="text-muted small">By ${log.actorRole || 'system'} · ${log.entityType || ''}</div>
                <div class="text-muted small"><i class="fas fa-clock me-1"></i>${new Date(log.createdAt || Date.now()).toLocaleString()}</div>
            </div>
            <span class="badge bg-${log.status === 'success' ? 'success' : 'danger'} text-white">${log.status}</span>
        </div>`).join('');
}

// Initialize college dashboard
function initializeCollegeDashboard() {
    loadCollegeData();
    loadRecentActivities();
    loadStudentsList();
    loadFacultyList();
    loadCoursesList();
    loadEventsList();
    loadNotifications();
    // Load live data from backend
    loadCollegeReviewQueue();
    loadCollegeAuditLogs();
}

// Load college data into UI
async function loadCollegeData() {
    if (!currentUser) return;

    // Update profile information
    document.getElementById('collegeName').textContent = currentUser.name;
    document.getElementById('collegeLocation').textContent = currentUser.location || 'Visakhapatnam, Andhra Pradesh';

    // Use government-appropriate colors for default images
    const defaultCollegeImage = dataManager.getDefaultProfileImage('college', currentUser.name);
    document.getElementById('collegeAvatar').src = defaultCollegeImage;
    document.getElementById('profileImage').src = defaultCollegeImage;
    document.getElementById('profileName').textContent = currentUser.fullName || currentUser.name;
    document.getElementById('profileDescription').textContent = currentUser.companyProfile?.description || 'Leading Educational Institution';

    // Update form fields
    document.getElementById('institutionName').value = currentUser.fullName || currentUser.name;
    document.getElementById('shortName').value = currentUser.name;
    document.getElementById('institutionEmail').value = currentUser.email;
    document.getElementById('editInstitutionImage').src = defaultCollegeImage;

    try {
        // Fetch stats from backend
        const statsData = await window.api.request('/college/department-stats');
        let totalStudents = 0;
        let totalFaculty = 0;
        
        for (const dept of Object.values(statsData.stats)) {
            totalStudents += dept.students || 0;
            totalFaculty += dept.faculty || 0;
        }

        document.getElementById('statsStudents').textContent = totalStudents;
        document.getElementById('statsFaculty').textContent = totalFaculty;
        document.getElementById('statsCourses').textContent = statsData.departmentsCount || 0;
        document.getElementById('totalStudentsCount').textContent = totalStudents;

        // Fetch students for detailed stats
        const studentRes = await window.api.request('/users?role=student&limit=1000');
        const collegeStudents = studentRes.items || [];
        
        // Update student statistics
        const bTechStudents = collegeStudents.filter(s => s.studentProfile?.course && s.studentProfile.course.includes('B.Tech')).length;
        const mTechStudents = collegeStudents.filter(s => s.studentProfile?.course && s.studentProfile.course.includes('M.Tech')).length;
        
        let validCgpaCount = 0;
        const totalCgpa = collegeStudents.reduce((sum, s) => {
            const cgpa = parseFloat(s.studentProfile?.cgpa);
            if (!isNaN(cgpa)) {
                validCgpaCount++;
                return sum + cgpa;
            }
            return sum;
        }, 0);
        
        const avgCGPA = validCgpaCount > 0 ? (totalCgpa / validCgpaCount).toFixed(1) : 0;

        document.getElementById('bTechStudents').textContent = bTechStudents;
        document.getElementById('mTechStudents').textContent = mTechStudents;
        document.getElementById('avgCGPA').textContent = avgCGPA;
        
        // Fetch NAAC report to get verification rate (dummy placement rate placeholder)
        const naacRes = await window.api.request('/reports/naac');
        document.getElementById('placementRate').textContent = `${naacRes.data.verificationRate}%`; // using verification rate as placeholder for placement
    } catch (err) {
        console.error('Failed to load college stats', err);
    }
}

// Load recent activities
async function loadRecentActivities() {
    const container = document.getElementById('recentActivities');
    container.innerHTML = '<p class="text-muted">Loading activities...</p>';
    try {
        const response = await window.api.request('/audit-logs?limit=5');
        const activities = response || [];

        if (activities.length === 0) {
            container.innerHTML = '<p class="text-muted">No recent activities found.</p>';
            return;
        }

        container.innerHTML = activities.map(activity => {
            const timeStr = new Date(activity.createdAt).toLocaleString();
            let icon = 'info-circle';
            let color = 'secondary';
            
            if (activity.action.includes('register')) { icon = 'user-plus'; color = 'primary'; }
            if (activity.action.includes('login')) { icon = 'sign-in-alt'; color = 'success'; }
            if (activity.action.includes('submission')) { icon = 'trophy'; color = 'warning'; }
            if (activity.action.includes('review')) { icon = 'check-circle'; color = 'info'; }

            return `
            <div class="d-flex align-items-center mb-3 pb-3 border-bottom">
                <div class="me-3">
                    <div class="rounded-circle bg-${color} bg-opacity-10 p-2">
                        <i class="fas fa-${icon} text-${color}"></i>
                    </div>
                </div>
                <div class="flex-grow-1">
                    <div class="fw-semibold">${activity.actorName || 'User'}</div>
                    <div class="text-muted small">${activity.action.replace('_', ' ')}</div>
                    <div class="text-muted small">${timeStr}</div>
                </div>
            </div>
            `;
        }).join('');
    } catch (err) {
        console.error('Error loading activities:', err);
        container.innerHTML = '<p class="text-danger">Failed to load recent activities.</p>';
    }
}

// Show section
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });

    // Remove active class from all sidebar items
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected section
    document.getElementById(sectionName).style.display = 'block';

    // Add active class to clicked sidebar item
    event.target.classList.add('active');
}

// Load students list
function loadStudentsList() {
    searchStudents();
    loadDepartmentStats();
}

// Search students
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
        
        if (!response.items || response.items.length === 0) {
            container.innerHTML = '<p class="text-muted">No students found matching your search.</p>';
            return;
        }

        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Student</th>
                            <th>Course & Year</th>
                            <th>CGPA</th>
                            <th>Credits</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${response.items.map(s => `
                            <tr>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <img src="${s.profileImage || 'images/profiles/default-student.svg'}" class="rounded-circle me-2" style="width:40px;height:40px;object-fit:cover;">
                                        <div>
                                            <div class="fw-bold">${s.name}</div>
                                            <small class="text-muted">${s.email}</small>
                                        </div>
                                    </div>
                                </td>
                                <td>${s.studentProfile?.course || 'N/A'} <span class="badge bg-secondary ms-1">Year ${s.studentProfile?.year || 'N/A'}</span></td>
                                <td><span class="badge ${s.studentProfile?.cgpa >= 8.5 ? 'bg-success' : 'bg-primary'}">${s.studentProfile?.cgpa || 'N/A'}</span></td>
                                <td>${s.studentProfile?.credits || 0}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary" onclick="window.open('portfolio.html?id=${s._id}', '_blank')">
                                        View Portfolio
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    } catch (err) {
        console.error('Error fetching students:', err);
        container.innerHTML = '<p class="text-danger">Failed to load students.</p>';
    }
}

async function loadDepartmentStats() {
    const container = document.getElementById('departmentStatsContainer');
    if (!container) return;
    
    try {
        const statsData = await window.api.request('/college/department-stats');
        
        if (Object.keys(statsData.stats).length === 0) {
            container.innerHTML = '<div class="col-12 text-center text-muted">No department data available.</div>';
            return;
        }
        
        let html = '';
        for (const [dept, data] of Object.entries(statsData.stats)) {
            html += `
                <div class="col-md-4 mb-3">
                    <div class="card border-0 shadow-sm">
                        <div class="card-body text-center">
                            <h6 class="fw-bold mb-3">${dept}</h6>
                            <div class="d-flex justify-content-around">
                                <div>
                                    <h4 class="text-primary mb-0">${data.students}</h4>
                                    <small class="text-muted">Students</small>
                                </div>
                                <div>
                                    <h4 class="text-success mb-0">${data.faculty}</h4>
                                    <small class="text-muted">Faculty</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
    } catch (err) {
        console.error('Error loading stats:', err);
        container.innerHTML = '<div class="col-12 text-danger">Failed to load statistics.</div>';
    }
}

function viewAllStudents() {
    // Clear filters and search
    if (document.getElementById('studentSearchInput')) document.getElementById('studentSearchInput').value = '';
    if (document.getElementById('filterAcademicYear')) document.getElementById('filterAcademicYear').value = '';
    if (document.getElementById('filterCertName')) document.getElementById('filterCertName').value = '';
    if (document.getElementById('filterCertStart')) document.getElementById('filterCertStart').value = '';
    if (document.getElementById('filterCertEnd')) document.getElementById('filterCertEnd').value = '';
    
    searchStudents();
}

async function loadFacultyList() {
    const container = document.getElementById('facultyList');
    container.innerHTML = '<p class="text-muted">Loading faculty...</p>';

    try {
        const response = await window.api.request('/users?role=faculty&limit=100');
        const collegeFaculty = response.items || [];

        if (collegeFaculty.length === 0) {
            container.innerHTML = '<p class="text-muted">No faculty members found.</p>';
            return;
        }

        container.innerHTML = collegeFaculty.map(faculty => `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex align-items-start">
                        <img src="${faculty.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(faculty.name)}&background=28a745&color=fff&size=60`}" alt="${faculty.name}" class="rounded-circle me-3" style="width: 60px; height: 60px; object-fit: cover;">
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="mb-1">${faculty.name}</h6>
                                    <p class="text-muted mb-1">${faculty.facultyProfile?.designation || faculty.designation || 'Faculty'}</p>
                                    <small class="text-muted">${faculty.facultyProfile?.department || faculty.department || 'N/A'}</small>
                                </div>
                                <div class="text-end">
                                    <small class="text-muted d-block">Experience</small>
                                    <div class="fw-bold text-primary">${faculty.facultyProfile?.experience || '0 years'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Failed to load faculty:', err);
        container.innerHTML = '<p class="text-danger">Failed to load faculty.</p>';
    }
}

// Search faculty
async function searchFaculty() {
    const searchTerm = document.getElementById('facultySearchInput')?.value.trim() || '';
    const container = document.getElementById('facultyList');
    container.innerHTML = '<p class="text-muted">Searching faculty...</p>';

    try {
        const queryParams = new URLSearchParams({ role: 'faculty', limit: 100 });
        if (searchTerm) queryParams.append('search', searchTerm);
        
        const response = await window.api.request(`/users?${queryParams.toString()}`);
        const collegeFaculty = response.items || [];

        if (collegeFaculty.length === 0) {
            container.innerHTML = '<p class="text-muted">No faculty found matching your search.</p>';
            return;
        }

        container.innerHTML = collegeFaculty.map(faculty => `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex align-items-start">
                        <img src="${faculty.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(faculty.name)}&background=28a745&color=fff&size=60`}" alt="${faculty.name}" class="rounded-circle me-3" style="width: 60px; height: 60px; object-fit: cover;">
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="mb-1">${faculty.name}</h6>
                                    <p class="text-muted mb-1">${faculty.facultyProfile?.designation || faculty.designation || 'Faculty'}</p>
                                    <small class="text-muted">${faculty.facultyProfile?.department || faculty.department || 'N/A'}</small>
                                </div>
                                <div class="text-end">
                                    <small class="text-muted d-block">Experience</small>
                                    <div class="fw-bold text-primary">${faculty.facultyProfile?.experience || '0 years'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error('Search failed:', err);
        container.innerHTML = '<p class="text-danger">Search failed.</p>';
    }
}

// Load courses list
function loadCoursesList() {
    const container = document.getElementById('coursesList');
    const courses = currentUser.courses || [];

    if (courses.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-book fa-3x text-muted mb-3"></i>
                <h6 class="text-muted">No courses published yet</h6>
                <p class="text-muted">Create learning courses for your students</p>
                <button class="btn btn-warning" onclick="addCourse()">
                    <i class="fas fa-plus me-1"></i>Add Your First Course
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = courses.map((course, index) => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="card-title">${course.title}</h6>
                        <p class="card-text">${course.description}</p>
                        ${course.youtubeLink ? `
                            <a href="${course.youtubeLink}" target="_blank" class="btn btn-sm btn-outline-danger">
                                <i class="fab fa-youtube me-1"></i>Watch on YouTube
                            </a>
                        ` : ''}
                    </div>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="#" onclick="editCourse(${index})">
                                <i class="fas fa-edit me-2"></i>Edit
                            </a></li>
                            <li><a class="dropdown-item" href="#" onclick="deleteCourse(${index})">
                                <i class="fas fa-trash me-2"></i>Delete
                            </a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Load events list
function loadEventsList() {
    const container = document.getElementById('eventsList');
    const events = currentUser.events || [];

    if (events.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-calendar fa-3x text-muted mb-3"></i>
                <h6 class="text-muted">No events scheduled</h6>
                <p class="text-muted">Create and manage institutional events</p>
                <button class="btn btn-info" onclick="addEvent()">
                    <i class="fas fa-plus me-1"></i>Create Your First Event
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = events.map((event, index) => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="card-title">
                            ${event.title}
                            <span class="badge bg-info ms-2">${event.type || 'Event'}</span>
                        </h6>
                        <p class="card-text">${event.description}</p>
                        <small class="text-muted">
                            <i class="fas fa-calendar me-1"></i>${formatDate(event.date)}
                            ${event.time ? `<i class="fas fa-clock ms-2 me-1"></i>${event.time}` : ''}
                        </small>
                    </div>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="#" onclick="editEvent(${index})">
                                <i class="fas fa-edit me-2"></i>Edit
                            </a></li>
                            <li><a class="dropdown-item" href="#" onclick="deleteEvent(${index})">
                                <i class="fas fa-trash me-2"></i>Delete
                            </a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Load notifications
function loadNotifications() {
    renderCollegeNotifications([]);
}

function renderCollegeNotifications(notifications) {
    const container = document.getElementById('notificationsList');
    if (!container) return;

    if (!notifications.length) {
        container.innerHTML = '<p class="text-muted">No college notifications yet.</p>';
        return;
    }

    container.innerHTML = notifications.map(notification => `
        <div class="card mb-3 notification-card" data-id="${notification._id}">
            <div class="card-body">
                <div class="d-flex align-items-start">
                    <div class="me-3">
                        <div class="rounded-circle bg-${notification.readAt ? 'success' : 'warning'} bg-opacity-10 p-2">
                            <i class="fas fa-bell text-${notification.readAt ? 'success' : 'warning'}"></i>
                        </div>
                    </div>
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${notification.title}</h6>
                        <p class="text-muted mb-1">${notification.message}</p>
                        <small class="text-muted"><i class="fas fa-clock me-1"></i>${new Date(notification.createdAt || Date.now()).toLocaleString()}</small>
                    </div>
                    <div class="ms-2">
                        <button class="btn btn-light btn-sm" onclick="dismissCollegeNotification('${notification._id}')" title="Dismiss Notification">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Dismiss college notification
function dismissCollegeNotification(notificationId) {
    const notificationCard = document.querySelector(`[data-id="${notificationId}"]`);

    // Remove with animation
    notificationCard.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    notificationCard.style.opacity = '0';
    notificationCard.style.transform = 'translateX(100%)';

    setTimeout(() => {
        notificationCard.remove();
    }, 300);

    // Remove from localStorage
    const collegeNotifications = JSON.parse(localStorage.getItem('collegeNotifications') || '[]');
    const updatedNotifications = collegeNotifications.filter(n => n.id != notificationId);
    localStorage.setItem('collegeNotifications', JSON.stringify(updatedNotifications));

    showToast('Notification dismissed', 'info');
}

// Modal functions
function addCourse() {
    const modal = new bootstrap.Modal(document.getElementById('addCourseModal'));
    modal.show();
}

function addEvent() {
    const modal = new bootstrap.Modal(document.getElementById('addEventModal'));
    modal.show();
}

// Save course
function saveCourse() {
    const title = document.getElementById('courseTitle').value;
    const description = document.getElementById('courseDescription').value;
    const youtubeLink = document.getElementById('courseYouTubeLink').value;
    const duration = document.getElementById('courseDuration').value;
    const level = document.getElementById('courseLevel').value;

    if (!title || !description) {
        showToast('Please fill in all required fields', 'danger');
        return;
    }

    const newCourse = {
        title,
        description,
        youtubeLink,
        duration: parseInt(duration),
        level,
        createdDate: new Date().toISOString().split('T')[0]
    };

    // Add to college courses
    if (!currentUser.courses) currentUser.courses = [];
    currentUser.courses.push(newCourse);

    // Update localStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // Reset form
    document.getElementById('courseForm').reset();

    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('addCourseModal')).hide();

    // Show success message
    showToast('Course added successfully!', 'success');

    // Update stats and refresh list
    document.getElementById('statsCourses').textContent = currentUser.courses.length;
    loadCoursesList();
}

// Save event
function saveEvent() {
    const title = document.getElementById('eventTitle').value;
    const description = document.getElementById('eventDescription').value;
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;
    const type = document.getElementById('eventType').value;

    if (!title || !description || !date) {
        showToast('Please fill in all required fields', 'danger');
        return;
    }

    const newEvent = {
        title,
        description,
        date,
        time,
        type,
        createdDate: new Date().toISOString().split('T')[0]
    };

    // Add to college events
    if (!currentUser.events) currentUser.events = [];
    currentUser.events.push(newEvent);

    // Update localStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // Reset form
    document.getElementById('eventForm').reset();

    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('addEventModal')).hide();

    // Show success message
    showToast('Event created successfully!', 'success');

    // Update stats and refresh list
    document.getElementById('statsEvents').textContent = currentUser.events.length;
    loadEventsList();
}

// Delete functions
function deleteCourse(index) {
    if (confirm('Are you sure you want to delete this course?')) {
        currentUser.courses.splice(index, 1);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        loadCoursesList();
        document.getElementById('statsCourses').textContent = currentUser.courses.length;
        showToast('Course deleted successfully!', 'success');
    }
}

function deleteEvent(index) {
    if (confirm('Are you sure you want to delete this event?')) {
        currentUser.events.splice(index, 1);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        loadEventsList();
        document.getElementById('statsEvents').textContent = currentUser.events.length;
        showToast('Event deleted successfully!', 'success');
    }
}

// View details functions
function viewStudentDetails(studentId) {
    const student = dummyData.students.find(s => s.id == studentId);
    if (student) {
        alert(`Student Details:\nName: ${student.name}\nCourse: ${student.course}\nCGPA: ${student.cgpa}\nCredits: ${student.credits}`);
    }
}

function viewFacultyDetails(facultyId) {
    const faculty = dummyData.faculty.find(f => f.id == facultyId);
    if (faculty) {
        alert(`Faculty Details:\nName: ${faculty.name}\nDesignation: ${faculty.designation}\nDepartment: ${faculty.department}\nExperience: ${faculty.experience} years`);
    }
}

// Report generation functions
function generateReport() {
    showToast('Generating comprehensive institutional report...', 'info');
}

async function generateStudentReport() {
    const modal = new bootstrap.Modal(document.getElementById('studentReportModal'));
    modal.show();
    
    const content = document.getElementById('studentReportContent');
    content.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3 text-muted">Gathering student data...</p>
        </div>
    `;

    try {
        const response = await window.api.request('/users?role=student&limit=1000');
        const students = response.items || [];
        
        let totalStudents = students.length;
        let totalCgpa = 0;
        let validCgpaCount = 0;
        let totalCredits = 0;
        let deptCounts = {};
        
        students.forEach(s => {
            const cgpa = parseFloat(s.studentProfile?.cgpa);
            if (!isNaN(cgpa)) {
                totalCgpa += cgpa;
                validCgpaCount++;
            }
            totalCredits += Number(s.studentProfile?.credits) || 0;
            
            const dept = s.department || 'Unassigned';
            deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        });
        
        const avgCGPA = validCgpaCount > 0 ? (totalCgpa / validCgpaCount).toFixed(2) : 'N/A';
        const avgCredits = totalStudents > 0 ? (totalCredits / totalStudents).toFixed(0) : 0;
        
        content.innerHTML = `
            <div class="px-3 py-2">
                <div class="row mb-4 text-center">
                    <div class="col-md-4">
                        <div class="p-3 border rounded bg-light">
                            <h3 class="text-primary">${totalStudents}</h3>
                            <small class="text-muted fw-bold">Total Students</small>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="p-3 border rounded bg-light">
                            <h3 class="text-success">${avgCGPA}</h3>
                            <small class="text-muted fw-bold">Average CGPA</small>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="p-3 border rounded bg-light">
                            <h3 class="text-info">${avgCredits}</h3>
                            <small class="text-muted fw-bold">Avg Credits</small>
                        </div>
                    </div>
                </div>
                
                <h6 class="border-bottom pb-2 mb-3">Department Breakdown</h6>
                <div class="row">
                    ${Object.entries(deptCounts).map(([dept, count]) => `
                        <div class="col-md-6 mb-2">
                            <div class="d-flex justify-content-between border-bottom pb-2">
                                <span>${dept}</span>
                                <span class="fw-bold text-primary">${count} students</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="text-end text-muted small mt-4 pt-2 border-top">
                    Generated on ${new Date().toLocaleString()} for ${currentUser.name || currentUser.fullName}
                </div>
            </div>
        `;
    } catch (err) {
        console.error('Failed to generate student report:', err);
        content.innerHTML = '<div class="alert alert-danger">Failed to generate report.</div>';
    }
}

async function generateAcademicReport() {
    const modal = new bootstrap.Modal(document.getElementById('facultyReportModal'));
    modal.show();
    
    const content = document.getElementById('facultyReportContent');
    content.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-success" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3 text-muted">Gathering faculty data...</p>
        </div>
    `;

    try {
        const response = await window.api.request('/users?role=faculty&limit=1000');
        const faculty = response.items || [];
        
        let totalFaculty = faculty.length;
        let deptCounts = {};
        let totalExperience = 0;
        let validExpCount = 0;
        
        faculty.forEach(f => {
            const dept = f.department || f.facultyProfile?.department || 'Unassigned';
            deptCounts[dept] = (deptCounts[dept] || 0) + 1;
            
            const exp = parseInt(f.experience || f.facultyProfile?.experience);
            if (!isNaN(exp)) {
                totalExperience += exp;
                validExpCount++;
            }
        });
        
        const avgExp = validExpCount > 0 ? (totalExperience / validExpCount).toFixed(1) : 'N/A';
        
        content.innerHTML = `
            <div class="px-3 py-2">
                <div class="row mb-4 text-center">
                    <div class="col-md-6">
                        <div class="p-3 border rounded bg-light">
                            <h3 class="text-success">${totalFaculty}</h3>
                            <small class="text-muted fw-bold">Total Faculty Members</small>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="p-3 border rounded bg-light">
                            <h3 class="text-primary">${avgExp} Years</h3>
                            <small class="text-muted fw-bold">Average Experience</small>
                        </div>
                    </div>
                </div>
                
                <h6 class="border-bottom pb-2 mb-3">Faculty per Department</h6>
                <div class="row">
                    ${Object.entries(deptCounts).map(([dept, count]) => `
                        <div class="col-md-6 mb-2">
                            <div class="d-flex justify-content-between border-bottom pb-2">
                                <span>${dept}</span>
                                <span class="fw-bold text-success">${count} faculty</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="text-end text-muted small mt-4 pt-2 border-top">
                    Generated on ${new Date().toLocaleString()} for ${currentUser.name || currentUser.fullName}
                </div>
            </div>
        `;
    } catch (err) {
        console.error('Failed to generate faculty report:', err);
        content.innerHTML = '<div class="alert alert-danger">Failed to generate report.</div>';
    }
}

async function generateNAACReport() {
    const modal = new bootstrap.Modal(document.getElementById('naacReportModal'));
    modal.show();
    
    const content = document.getElementById('naacReportContent');
    content.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-3 text-muted fw-semibold">Compiling NAAC report from live database...</p>
        </div>
    `;

    try {
        const response = await window.api.request('/reports/naac');
        const d = response.data;

        const bar = (pct, color = 'primary') => `
            <div class="d-flex align-items-center gap-2">
                <div class="flex-grow-1 bg-secondary bg-opacity-25 rounded" style="height:10px;">
                    <div class="rounded bg-${color}" style="height:10px;width:${Math.min(parseFloat(pct),100)}%;transition:width .8s ease;"></div>
                </div>
                <span class="fw-bold small" style="min-width:48px;">${pct}%</span>
            </div>`;

        const categoryLabels = { certification:'Certifications', hackathon:'Hackathons', internship:'Internships', publication:'Publications', sports:'Sports', cultural:'Cultural', seminar:'Seminars', volunteering:'Volunteering', other:'Other' };

        content.innerHTML = `
<div class="px-2 py-2" style="font-size:.93rem;">

  <!-- Header Strip -->
  <div class="rounded-3 p-4 mb-4 text-white" style="background:linear-gradient(120deg,#1a237e,#1565c0);">
    <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
      <div>
        <h5 class="mb-1 fw-bold"><i class="fas fa-university me-2"></i>NAAC Self-Assessment Report</h5>
        <div class="opacity-75 small">${d.institution}</div>
      </div>
      <div class="text-end opacity-75 small">
        Generated: ${new Date(d.generatedAt).toLocaleString()}<br>
        Prepared by: ${currentUser.name || currentUser.fullName}
      </div>
    </div>
  </div>

  <!-- KPI Row 1 – Student Metrics -->
  <h6 class="border-bottom pb-2 mb-3 text-primary fw-bold"><i class="fas fa-user-graduate me-2"></i>Criterion I &amp; II — Student Quality &amp; Academic Performance</h6>
  <div class="row g-3 mb-4">
    ${[
      { label:'Total Students', value: d.totalStudents, icon:'users', color:'primary' },
      { label:'Avg CGPA', value: `${d.avgCGPA}/10`, icon:'chart-line', color:'success' },
      { label:'Excellence (CGPA≥8.5)', value: `${d.excellencePercentage}%`, icon:'star', color:'warning' },
      { label:'Participation Rate', value: `${d.participationPercentage}%`, icon:'running', color:'info' },
    ].map(m => `
      <div class="col-md-3 col-6">
        <div class="p-3 rounded-3 border text-center h-100" style="background:rgba(255,255,255,.03);">
          <i class="fas fa-${m.icon} fa-lg text-${m.color} mb-2"></i>
          <div class="fw-bold fs-5">${m.value}</div>
          <div class="text-muted small">${m.label}</div>
        </div>
      </div>`).join('')}
  </div>

  <!-- Progress bars -->
  <div class="row g-3 mb-4">
    <div class="col-md-6">
      <div class="p-3 rounded-3 border" style="background:rgba(255,255,255,.03);">
        <div class="d-flex justify-content-between mb-2"><span class="small fw-semibold">Academic Excellence</span><span class="small text-muted">Benchmark 30%</span></div>
        ${bar(d.excellencePercentage,'warning')}
      </div>
    </div>
    <div class="col-md-6">
      <div class="p-3 rounded-3 border" style="background:rgba(255,255,255,.03);">
        <div class="d-flex justify-content-between mb-2"><span class="small fw-semibold">Student Participation</span><span class="small text-muted">Benchmark 50%</span></div>
        ${bar(d.participationPercentage,'info')}
      </div>
    </div>
  </div>

  <!-- Students by Dept -->
  <div class="mb-4">
    <h6 class="fw-semibold mb-2">Student Distribution by Department</h6>
    <div class="row g-2">
      ${Object.entries(d.studentsByDept || {}).map(([dept, count]) => `
        <div class="col-md-6">
          <div class="d-flex justify-content-between align-items-center border-bottom py-2">
            <span>${dept}</span><span class="badge bg-primary rounded-pill">${count}</span>
          </div>
        </div>`).join('') || '<div class="text-muted small col-12">No department data available.</div>'}
    </div>
  </div>

  <!-- Faculty -->
  <h6 class="border-bottom pb-2 mb-3 text-success fw-bold"><i class="fas fa-chalkboard-teacher me-2"></i>Criterion III — Faculty Profile &amp; Research</h6>
  <div class="row g-3 mb-4">
    ${[
      { label:'Total Faculty', value: d.totalFaculty, icon:'user-tie', color:'success' },
      { label:'Avg Experience', value: `${d.avgExperience} yrs`, icon:'calendar-check', color:'teal' },
      { label:'Ph.D. Holders', value: `${d.phDPercentage}%`, icon:'graduation-cap', color:'purple' },
      { label:'Faculty w/ Publications', value: `${d.facultyArticlesPercentage}%`, icon:'book-open', color:'danger' },
    ].map(m => `
      <div class="col-md-3 col-6">
        <div class="p-3 rounded-3 border text-center h-100" style="background:rgba(255,255,255,.03);">
          <i class="fas fa-${m.icon} fa-lg text-${m.color === 'teal' ? 'info' : m.color === 'purple' ? 'warning' : m.color} mb-2"></i>
          <div class="fw-bold fs-5">${m.value}</div>
          <div class="text-muted small">${m.label}</div>
        </div>
      </div>`).join('')}
  </div>

  <div class="row g-3 mb-4">
    <div class="col-md-6">
      <div class="p-3 rounded-3 border" style="background:rgba(255,255,255,.03);">
        <div class="d-flex justify-content-between mb-2"><span class="small fw-semibold">Faculty with Publications</span><span class="small text-muted">Benchmark 40%</span></div>
        ${bar(d.facultyArticlesPercentage,'danger')}
      </div>
    </div>
    <div class="col-md-6">
      <div class="p-3 rounded-3 border" style="background:rgba(255,255,255,.03);">
        <div class="d-flex justify-content-between mb-2"><span class="small fw-semibold">Ph.D. Qualification Rate</span><span class="small text-muted">Benchmark 30%</span></div>
        ${bar(d.phDPercentage,'success')}
      </div>
    </div>
  </div>

  <!-- Faculty by Dept -->
  <div class="mb-4">
    <h6 class="fw-semibold mb-2">Faculty Distribution by Department</h6>
    <div class="row g-2">
      ${Object.entries(d.facultyByDept || {}).map(([dept, count]) => `
        <div class="col-md-6">
          <div class="d-flex justify-content-between align-items-center border-bottom py-2">
            <span>${dept}</span><span class="badge bg-success rounded-pill">${count}</span>
          </div>
        </div>`).join('') || '<div class="text-muted small col-12">No department data available.</div>'}
    </div>
  </div>

  <!-- Achievements & Certifications -->
  <h6 class="border-bottom pb-2 mb-3 text-warning fw-bold"><i class="fas fa-trophy me-2"></i>Criterion IV — Student Achievements &amp; Certifications</h6>
  <div class="row g-3 mb-3">
    ${[
      { label:'Total Achievements', value: d.totalAchievements, icon:'medal', color:'warning' },
      { label:'Verified Achievements', value: d.verifiedAchievements, icon:'check-double', color:'success' },
      { label:'Verification Rate', value: `${d.verificationRate}%`, icon:'shield-check', color:'info' },
      { label:'Total Certifications', value: d.totalCertifications, icon:'certificate', color:'primary' },
    ].map(m => `
      <div class="col-md-3 col-6">
        <div class="p-3 rounded-3 border text-center h-100" style="background:rgba(255,255,255,.03);">
          <i class="fas fa-${m.icon} fa-lg text-${m.color} mb-2"></i>
          <div class="fw-bold fs-5">${m.value}</div>
          <div class="text-muted small">${m.label}</div>
        </div>
      </div>`).join('')}
  </div>

  <div class="row g-3 mb-4">
    <div class="col-md-6">
      <div class="p-3 rounded-3 border" style="background:rgba(255,255,255,.03);">
        <div class="d-flex justify-content-between mb-2"><span class="small fw-semibold">Achievement Verification Rate</span><span class="small text-muted">Benchmark 70%</span></div>
        ${bar(d.verificationRate,'success')}
      </div>
    </div>
    <div class="col-md-6">
      <div class="p-3 rounded-3 border" style="background:rgba(255,255,255,.03);">
        <div class="d-flex justify-content-between mb-2"><span class="small fw-semibold">Certification &amp; Achievement Rate</span></div>
        ${bar(d.certificationRate,'warning')}
      </div>
    </div>
  </div>

  <!-- Category Breakdown -->
  <div class="mb-4">
    <h6 class="fw-semibold mb-2">Achievement Category Breakdown</h6>
    <div class="row g-2">
      ${Object.entries(d.categoryBreakdown || {}).map(([cat, cnt]) => `
        <div class="col-md-4 col-6">
          <div class="d-flex justify-content-between align-items-center border-bottom py-2">
            <span class="text-capitalize">${categoryLabels[cat] || cat}</span>
            <span class="badge bg-secondary rounded-pill">${cnt}</span>
          </div>
        </div>`).join('') || '<div class="text-muted small col-12">No category data available.</div>'}
    </div>
  </div>

  <!-- Research Publications -->
  <h6 class="border-bottom pb-2 mb-3 text-danger fw-bold"><i class="fas fa-flask me-2"></i>Criterion V — Research &amp; Publications</h6>
  <div class="row g-3 mb-4">
    <div class="col-md-4 col-6">
      <div class="p-3 rounded-3 border text-center" style="background:rgba(255,255,255,.03);">
        <i class="fas fa-newspaper fa-lg text-danger mb-2"></i>
        <div class="fw-bold fs-5">${d.totalPublications}</div>
        <div class="text-muted small">Total Publications</div>
      </div>
    </div>
    <div class="col-md-8">
      <div class="p-3 rounded-3 border h-100" style="background:rgba(255,255,255,.03);">
        <div class="d-flex justify-content-between mb-2"><span class="small fw-semibold">Faculty Research Participation</span><span class="small text-muted">Benchmark 40%</span></div>
        ${bar(d.facultyArticlesPercentage,'danger')}
        <p class="text-muted small mt-2 mb-0">${d.totalPublications} research papers/publications recorded by ${d.totalFaculty} faculty members.</p>
      </div>
    </div>
  </div>

  <!-- Positive Insights -->
  <h6 class="border-bottom pb-2 mb-3 text-info fw-bold"><i class="fas fa-lightbulb me-2"></i>Criterion VI — Positive Institutional Notices &amp; Insights</h6>
  <div class="mb-4">
    ${d.insights.length
      ? d.insights.map(ins => `
        <div class="d-flex align-items-start mb-2 p-2 rounded-2" style="background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.25);">
          <i class="fas fa-check-circle text-success mt-1 me-3 flex-shrink-0"></i>
          <span>${ins}</span>
        </div>`).join('')
      : '<div class="text-muted small">No positive insights generated. Ensure data is complete in the system.</div>'}
  </div>

  <!-- Summary Table -->
  <h6 class="border-bottom pb-2 mb-3 fw-bold"><i class="fas fa-table me-2"></i>Executive Summary — All Criteria</h6>
  <div class="table-responsive mb-4">
    <table class="table table-sm table-bordered" style="font-size:.88rem;">
      <thead class="table-dark">
        <tr><th>NAAC Criterion</th><th>Metric</th><th>Value</th><th>Benchmark</th><th>Status</th></tr>
      </thead>
      <tbody>
        ${[
          ['I–II', 'Total Students', d.totalStudents, '—', '✅'],
          ['I–II', 'Average CGPA', `${d.avgCGPA}/10`, '≥7.5', parseFloat(d.avgCGPA) >= 7.5 ? '✅' : '⚠️'],
          ['I–II', 'Excellence Rate (CGPA≥8.5)', `${d.excellencePercentage}%`, '≥30%', parseFloat(d.excellencePercentage) >= 30 ? '✅' : '⚠️'],
          ['I–II', 'Student Participation Rate', `${d.participationPercentage}%`, '≥50%', parseFloat(d.participationPercentage) >= 50 ? '✅' : '⚠️'],
          ['III', 'Total Faculty', d.totalFaculty, '—', '✅'],
          ['III', 'Average Experience', `${d.avgExperience} yrs`, '≥5 yrs', parseFloat(d.avgExperience) >= 5 ? '✅' : '⚠️'],
          ['III', 'Ph.D. Holders', `${d.phDPercentage}%`, '≥30%', parseFloat(d.phDPercentage) >= 30 ? '✅' : '⚠️'],
          ['IV', 'Achievement Verification Rate', `${d.verificationRate}%`, '≥70%', parseFloat(d.verificationRate) >= 70 ? '✅' : '⚠️'],
          ['IV', 'Total Certifications', d.totalCertifications, '—', '✅'],
          ['V', 'Total Publications', d.totalPublications, '—', '✅'],
          ['V', 'Faculty with Publications', `${d.facultyArticlesPercentage}%`, '≥40%', parseFloat(d.facultyArticlesPercentage) >= 40 ? '✅' : '⚠️'],
        ].map(([crit, metric, value, benchmark, status]) => `
          <tr>
            <td class="fw-semibold">${crit}</td>
            <td>${metric}</td>
            <td class="fw-bold">${value}</td>
            <td class="text-muted">${benchmark}</td>
            <td class="text-center">${status}</td>
          </tr>`).join('')}
      </tbody>
    </table>
  </div>

  <div class="text-center text-muted small border-top pt-3">
    <i class="fas fa-file-alt me-1"></i>NAAC Self-Assessment Report &bull; ${d.institution} &bull; ${new Date(d.generatedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}
  </div>
</div>`;

    } catch (err) {
        console.error('Error generating NAAC report:', err);
        content.innerHTML = '<div class="alert alert-danger"><i class="fas fa-exclamation-circle me-2"></i>Failed to generate NAAC report. Please ensure you are logged in as a college admin and the backend is running.</div>';
    }
}

function generatePlacementReport() {
    showToast('Generating placement statistics report...', 'info');
}

function exportStudentReport() {
    const collegeStudents = dummyData.students.filter(s => s.college === currentUser.name);
    const csvData = [
        ['Name', 'Course', 'Year', 'CGPA', 'Email', 'Credits', 'Phone'],
        ...collegeStudents.map(student => [
            student.name,
            student.course,
            student.year,
            student.cgpa,
            student.email,
            student.credits,
            student.phone
        ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentUser.name}_students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showToast('Student data exported successfully!', 'success');
}

// Profile editing
function editInstitutionProfile() {
    const form = document.getElementById('institutionProfileForm');
    const inputs = form.querySelectorAll('input:not([readonly]), textarea');
    inputs.forEach(input => input.disabled = false);
}

function cancelInstitutionEdit() {
    loadCollegeData();
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showToast(message, type) {
    // Create toast notification
    const toastHTML = `
        <div class="toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'danger' ? 'danger' : 'info'} border-0 position-fixed" 
             style="top: 20px; right: 20px; z-index: 1055;" role="alert">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', toastHTML);
    const toast = new bootstrap.Toast(document.querySelector('.toast:last-child'));
    toast.show();

    // Remove toast element after it's hidden
    setTimeout(() => {
        const toastElement = document.querySelector('.toast:last-child');
        if (toastElement) toastElement.remove();
    }, 5000);
}