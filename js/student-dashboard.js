// Student Dashboard JavaScript

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function () {
    if (!checkAuth() || currentUserType !== 'student') {
        window.location.href = 'index.html';
        return;
    }

    initializeStudentDashboard();
    refreshStudentAchievements();
});

async function refreshStudentAchievements() {
    try {
        // Optionally refresh profile from API too
        if (window.api) {
            try {
                const me = await window.api.getMe();
                if (me && me._id) {
                    // Merge fresh data into currentUser while preserving UI state
                    Object.assign(currentUser, {
                        name: me.name || currentUser.name,
                        email: me.email || currentUser.email,
                        classTeacherEmail: me.studentProfile?.classTeacherEmail || currentUser.classTeacherEmail,
                        classTeacherCode: me.studentProfile?.classTeacherCode || currentUser.classTeacherCode,
                        studentProfile: me.studentProfile || currentUser.studentProfile,
                        teacherCode: me.facultyProfile?.teacherCode || currentUser.teacherCode
                    });
                }
            } catch (profileErr) {
                console.warn('Could not refresh profile:', profileErr.message);
            }

            const response = await window.api.getAchievements();
            const items = (response && response.items) ? response.items : (Array.isArray(response) ? response : []);
            currentUser.achievements = items.filter(item => item.category !== 'certification' && item.category !== 'internship');
            currentUser.certificates = items.filter(item => item.category === 'certification');
            currentUser.internships = items.filter(item => item.category === 'internship');
        } else {
            const response = await dataManager.request(`/achievements?ownerUserId=${encodeURIComponent(currentUser.id)}&ownerRole=student`);
            const items = response.items || [];
            currentUser.achievements = items.filter(item => item.category !== 'certification' && item.category !== 'internship');
            currentUser.certificates = items.filter(item => item.category === 'certification');
            currentUser.internships = items.filter(item => item.category === 'internship');
        }

        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        loadStudentData();
        loadRecentAchievements();
        loadAchievements();
        loadCertificates();
        loadInternships();

        const totalAchEl = document.getElementById('totalAchievements');
        const totalCertEl = document.getElementById('totalCertificates');
        const totalIntEl = document.getElementById('totalInternships');
        if (totalAchEl) totalAchEl.textContent = currentUser.achievements.length;
        if (totalCertEl) totalCertEl.textContent = currentUser.certificates.length;
        if (totalIntEl) totalIntEl.textContent = currentUser.internships.length;
    } catch (error) {
        console.warn('Unable to refresh achievements from API:', error.message);
    }
}

// Initialize student dashboard
function initializeStudentDashboard() {
    loadStudentData();
    loadRecentAchievements();
    loadSkillTags();
    loadAchievements();
    loadCertificates();
    loadInternships();
    loadAcademicRecords();
    loadSkills();
    loadArticles();
    loadEvents();
}

// Load student data into UI
function loadStudentData() {
    if (!currentUser) return;

    // Ensure profile image exists, use default if not
    if (!currentUser.profileImage || currentUser.profileImage.includes('via.placeholder.com')) {
        currentUser.profileImage = typeof dataManager !== 'undefined'
            ? dataManager.getDefaultProfileImage('student', currentUser.name)
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=1f4e79&color=fff&size=150&bold=true`;
    }

    // Update profile information
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userCourse').textContent = `${currentUser.course} - ${currentUser.year}`;
    document.getElementById('userCredits').textContent = currentUser.credits;
    document.getElementById('welcomeName').textContent = currentUser.name.split(' ')[0];
    document.getElementById('userAvatar').src = currentUser.profileImage;
    document.getElementById('profileImage').src = currentUser.profileImage;
    document.getElementById('profileName').textContent = currentUser.name;
    document.getElementById('profileHeadline').textContent = currentUser.headline;

    // Update stats
    document.getElementById('totalAchievements').textContent = currentUser.achievements.length;
    document.getElementById('totalCertificates').textContent = currentUser.certificates.length;
    document.getElementById('totalInternships').textContent = currentUser.internships.length;
    document.getElementById('currentCGPA').textContent = currentUser.cgpa;

    // Update profile form
    document.getElementById('fullName').value = currentUser.name;
    document.getElementById('headline').value = currentUser.headline;
    document.getElementById('bio').value = currentUser.bio;
    document.getElementById('email').value = currentUser.email;
    document.getElementById('phone').value = currentUser.phone;
    document.getElementById('college').value = currentUser.college;
    const teacherEmailInput = document.getElementById('classTeacherEmail');
    if (teacherEmailInput) {
        teacherEmailInput.value = currentUser.classTeacherEmail || currentUser.studentProfile?.classTeacherEmail || '';
    }
    const teacherCodeInput = document.getElementById('classTeacherCode');
    if (teacherCodeInput) {
        teacherCodeInput.value = currentUser.classTeacherCode || currentUser.studentProfile?.classTeacherCode || '';
    }
    document.getElementById('fatherName').value = currentUser.fatherName;
    document.getElementById('motherName').value = currentUser.motherName;
    document.getElementById('courseYear').value = `${currentUser.course} - ${currentUser.year}`;
    document.getElementById('linkedin').value = currentUser.socialMedia.linkedin;
    document.getElementById('github').value = currentUser.socialMedia.github;
    document.getElementById('portfolio').value = currentUser.socialMedia.portfolio || '';
    document.getElementById('editProfileImage').src = currentUser.profileImage;
}

// Handle profile image upload
async function handleProfileImageUpload(inputElement) {
    const file = handleImageUpload(inputElement, document.getElementById('editProfileImage'), 'student');

    if (file) {
        try {
            const imagePath = await dataManager.updateProfileImage(currentUser.id, 'student', file);

            // Update all profile images on the page
            document.getElementById('userAvatar').src = imagePath;
            document.getElementById('profileImage').src = imagePath;
            document.getElementById('editProfileImage').src = imagePath;

            showToast('Profile image updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating profile image:', error);
            showToast('Error updating profile image. Please try again.', 'error');
        }
    }
}

// Load recent achievements
function loadRecentAchievements() {
    const container = document.getElementById('recentAchievements');
    const achievements = currentUser.achievements.slice(0, 3); // Show only 3 recent

    if (achievements.length === 0) {
        container.innerHTML = '<p class="text-muted">No achievements added yet. Start by adding your first achievement!</p>';
        return;
    }

    container.innerHTML = achievements.map(achievement => `
        <div class="achievement-card">
            <div class="d-flex align-items-start">
                <div class="achievement-icon me-3">
                    <i class="fas fa-trophy"></i>
                </div>
                <div class="flex-grow-1">
                    <div class="d-flex align-items-center gap-2 mb-1">
                        <h6 class="mb-0">${achievement.title}</h6>
                        ${renderStatusBadge(achievement.status)}
                    </div>
                    <p class="text-muted mb-1">${achievement.description}</p>
                    <small class="text-muted">
                        <i class="fas fa-calendar me-1"></i>${formatDate(achievement.date)}
                        ${achievement.status ? `<span class="ms-2">${formatStatusText(achievement.status)}</span>` : ''}
                    </small>
                </div>
            </div>
        </div>
    `).join('');
}

// Load skill tags
function loadSkillTags() {
    const container = document.getElementById('skillTags');
    container.innerHTML = currentUser.skills.map(skill =>
        `<span class="skill-tag">${skill}</span>`
    ).join('');
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

// Load achievements
function loadAchievements(filterStatus = 'all') {
    const container = document.getElementById('achievementsList');
    
    let displayAchievements = currentUser.achievements || [];
    if (filterStatus !== 'all') {
        displayAchievements = displayAchievements.filter(a => {
            if (filterStatus === 'pending') {
                return !['approved', 'rejected'].includes(a.status);
            }
            return a.status === filterStatus;
        });
    }

    if (displayAchievements.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-trophy fa-3x text-muted mb-3"></i>
                <h6 class="text-muted">No ${filterStatus !== 'all' ? filterStatus : ''} achievements found</h6>
                <p class="text-muted">Start building your achievement portfolio</p>
                <button class="btn btn-primary" onclick="addAchievement()">
                    <i class="fas fa-plus me-1"></i>Add Your First Achievement
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = displayAchievements.map((achievement, index) => `
        <div class="achievement-card mb-3" style="border-left: 4px solid ${achievement.status === 'approved' ? '#28a745' : achievement.status === 'rejected' ? '#dc3545' : '#ffc107'};">
            <div class="d-flex justify-content-between align-items-start">
                <div class="d-flex align-items-start flex-grow-1">
                    <div class="achievement-icon me-3" style="background: ${achievement.status === 'approved' ? 'var(--success-color, #28a745)' : achievement.status === 'rejected' ? 'var(--danger-color, #dc3545)' : 'var(--warning-color, #ffc107)'};">
                        <i class="fas fa-${achievement.status === 'approved' ? 'check-circle' : achievement.status === 'rejected' ? 'times-circle' : 'clock'}"></i>
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
                            <h6 class="mb-0">${achievement.title}</h6>
                            ${renderStatusBadge(achievement.status)}
                        </div>
                        <p class="text-muted mb-1 small">${achievement.description || ''}</p>
                        <div class="d-flex gap-3 flex-wrap">
                            <small class="text-muted"><i class="fas fa-calendar me-1"></i>${formatDate(achievement.date || achievement.startDate)}</small>
                            ${achievement.category ? `<small class="text-muted"><i class="fas fa-tag me-1"></i>${achievement.category}</small>` : ''}
                            ${achievement.credits ? `<small class="text-success"><i class="fas fa-star me-1"></i>${achievement.credits} credits</small>` : ''}
                        </div>
                        ${achievement.status === 'rejected' ? `<div class="alert alert-danger mt-2 py-1 px-2 small mb-0"><i class="fas fa-info-circle me-1"></i>${achievement.remarks || 'Rejected by reviewer.'}</div>` : ''}
                    </div>
                </div>
                <div class="dropdown ms-2">
                    <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown"><i class="fas fa-ellipsis-v"></i></button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item text-danger" href="#" onclick="deleteStudentAchievement('${achievement._id || achievement.id}', ${index})">
                            <i class="fas fa-trash me-2"></i>Delete
                        </a></li>
                    </ul>
                </div>
            </div>
        </div>
    `).join('');
}

function filterAchievements(status, el) {
    // Update active tab styling
    document.querySelectorAll('#achievementFilters .nav-link').forEach(link => {
        link.classList.remove('active');
        link.style.background = 'transparent';
    });
    
    el.classList.add('active');
    el.style.background = 'rgba(255,255,255,0.1)';
    
    // Reload list with filter
    loadAchievements(status);
}

// Load certificates
function loadCertificates() {
    const container = document.getElementById('certificatesList');

    if (currentUser.certificates.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-certificate fa-3x text-muted mb-3"></i>
                <h6 class="text-muted">No certificates added yet</h6>
                <p class="text-muted">Add your professional certifications</p>
                <button class="btn btn-success" onclick="addCertificate()">
                    <i class="fas fa-plus me-1"></i>Add Your First Certificate
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = currentUser.certificates.map((cert, index) => `
        <div class="achievement-card">
            <div class="d-flex justify-content-between align-items-start">
                <div class="d-flex align-items-start">
                    <div class="achievement-icon me-3" style="background-color: var(--success-color);">
                        <i class="fas fa-certificate"></i>
                    </div>
                    <div>
                        <h6 class="mb-1">${cert.title}</h6>
                        <p class="text-muted mb-1">Issued by: ${cert.organization}</p>
                        <p class="text-muted mb-2">Certificate ID: ${cert.id}</p>
                        <small class="text-muted">
                            <i class="fas fa-calendar me-1"></i>${formatDate(cert.date)}
                        </small>
                    </div>
                </div>
                <div class="dropdown">
                    <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="#" onclick="deleteCertificate(${index})">
                            <i class="fas fa-trash me-2"></i>Delete
                        </a></li>
                    </ul>
                </div>
            </div>
        </div>
    `).join('');
}

// Load internships
function loadInternships() {
    const container = document.getElementById('internshipsList');

    if (currentUser.internships.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-briefcase fa-3x text-muted mb-3"></i>
                <h6 class="text-muted">No internships added yet</h6>
                <p class="text-muted">Add your internship experiences</p>
                <button class="btn btn-info" onclick="addInternship()">
                    <i class="fas fa-plus me-1"></i>Add Your First Internship
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = currentUser.internships.map((internship, index) => `
        <div class="achievement-card">
            <div class="d-flex justify-content-between align-items-start">
                <div class="d-flex align-items-start">
                    <div class="achievement-icon me-3" style="background-color: var(--info-color);">
                        <i class="fas fa-briefcase"></i>
                    </div>
                    <div>
                        <h6 class="mb-1">${internship.role}</h6>
                        <p class="text-muted mb-1">${internship.company}</p>
                        <p class="text-muted mb-2">${internship.description}</p>
                        <small class="text-muted">
                            <i class="fas fa-clock me-1"></i>Duration: ${internship.duration}
                        </small>
                    </div>
                </div>
                <div class="dropdown">
                    <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="#" onclick="deleteInternship(${index})">
                            <i class="fas fa-trash me-2"></i>Delete
                        </a></li>
                    </ul>
                </div>
            </div>
        </div>
    `).join('');
}

// Load academic records
function loadAcademicRecords() {
    const container = document.getElementById('academicRecordsList');

    // Sample academic records
    const academicRecords = [
        { semester: "Semester 1", cgpa: "8.2", year: "2022-23" },
        { semester: "Semester 2", cgpa: "8.4", year: "2022-23" },
        { semester: "Semester 3", cgpa: "8.6", year: "2023-24" },
        { semester: "Semester 4", cgpa: "8.5", year: "2023-24" },
        { semester: "Semester 5", cgpa: "8.7", year: "2024-25" },
    ];

    container.innerHTML = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Semester</th>
                        <th>Academic Year</th>
                        <th>CGPA</th>
                        <th>Grade</th>
                    </tr>
                </thead>
                <tbody>
                    ${academicRecords.map(record => `
                        <tr>
                            <td>${record.semester}</td>
                            <td>${record.year}</td>
                            <td>${record.cgpa}</td>
                            <td>
                                <span class="badge bg-success">${getGrade(record.cgpa)}</span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Load skills
function loadSkills() {
    const container = document.getElementById('skillsList');
    if (!container) return;

    const skills = Array.isArray(currentUser.skills) ? currentUser.skills : [];

    container.innerHTML = `
        <div class="row">
            <div class="col-md-8">
                <h6 class="mb-3">Your Skills</h6>
                <div id="currentSkills">
                    ${skills.map((skill, index) => `
                        <span class="skill-tag me-2 mb-2">
                            ${skill}
                            <button class="btn btn-sm ms-2" onclick="removeSkill(${index})" style="background: none; border: none; color: white; padding: 0;">
                                <i class="fas fa-times"></i>
                            </button>
                        </span>
                    `).join('')}
                </div>
            </div>
            <div class="col-md-4">
                <h6 class="mb-3">Add New Skill</h6>
                <div class="input-group">
                    <input type="text" class="form-control" id="newSkillInput" placeholder="Enter skill name">
                    <button class="btn btn-info" onclick="addNewSkill()">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Load articles
function loadArticles() {
    const container = document.getElementById('articlesList');
    const articles = dummyData.faculty[0]?.articles || [];

    if (articles.length === 0) {
        container.innerHTML = '<p class="text-muted">No articles available at the moment.</p>';
        return;
    }

    container.innerHTML = articles.map(article => `
        <div class="card mb-3">
            <div class="card-body">
                <h6 class="card-title">${article.title}</h6>
                <p class="card-text">${article.content.substring(0, 150)}...</p>
                <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted">
                        <i class="fas fa-calendar me-1"></i>${formatDate(article.date)}
                    </small>
                    <button class="btn btn-sm btn-outline-primary">Read More</button>
                </div>
            </div>
        </div>
    `).join('');
}

// Load events
function loadEvents() {
    const container = document.getElementById('eventsList');
    const events = dummyData.colleges[0]?.events || [];
    const opportunities = dummyData.companies[0]?.opportunities || [];

    const allEvents = [...events, ...opportunities.map(opp => ({
        title: opp.title,
        description: opp.description,
        date: new Date().toISOString().split('T')[0],
        type: 'opportunity'
    }))];

    if (allEvents.length === 0) {
        container.innerHTML = '<p class="text-muted">No events or opportunities available at the moment.</p>';
        return;
    }

    container.innerHTML = allEvents.map(event => `
        <div class="card mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="card-title">
                            ${event.title}
                            ${event.type === 'opportunity' ? '<span class="badge bg-success ms-2">Job Opportunity</span>' : '<span class="badge bg-primary ms-2">Event</span>'}
                        </h6>
                        <p class="card-text">${event.description}</p>
                        <small class="text-muted">
                            <i class="fas fa-calendar me-1"></i>${formatDate(event.date)}
                        </small>
                    </div>
                    <button class="btn btn-sm btn-outline-primary">
                        ${event.type === 'opportunity' ? 'Apply' : 'Register'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Modal functions
function addAchievement() {
    const modal = new bootstrap.Modal(document.getElementById('addAchievementModal'));
    modal.show();
}

function addCertificate() {
    // Show certificate modal
    showCertificateModal();
}

function addInternship() {
    // Show internship modal
    showInternshipModal();
}

// Certificate modal functions
function showCertificateModal() {
    const modalHTML = `
        <div class="modal fade" id="addCertificateModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add Certificate</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="certificateForm">
                            <div class="mb-3">
                                <label for="certificateTitle" class="form-label">Certificate Title *</label>
                                <input type="text" class="form-control" id="certificateTitle" required>
                            </div>
                            <div class="mb-3">
                                <label for="certificateOrganization" class="form-label">Organization *</label>
                                <input type="text" class="form-control" id="certificateOrganization" required>
                            </div>
                            <div class="mb-3">
                                <label for="certificateDate" class="form-label">Date Issued *</label>
                                <input type="date" class="form-control" id="certificateDate" required>
                            </div>
                            <div class="mb-3">
                                <label for="certificateId" class="form-label">Certificate ID</label>
                                <input type="text" class="form-control" id="certificateId" placeholder="e.g., CERT-123456">
                            </div>
                            <div class="mb-3">
                                <label for="certificateImage" class="form-label">Upload Certificate Image</label>
                                <input type="file" class="form-control" id="certificateImage" accept="image/*">
                                <div class="form-text">Upload certificate image (optional)</div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveCertificate()">Save Certificate</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('addCertificateModal');
    if (existingModal) existingModal.remove();

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addCertificateModal'));
    modal.show();
}

// Save certificate
async function saveCertificate() {
    const title = document.getElementById('certificateTitle').value;
    const organization = document.getElementById('certificateOrganization').value;
    const date = document.getElementById('certificateDate').value;
    const id = document.getElementById('certificateId').value;
    const imageFile = document.getElementById('certificateImage').files[0];

    if (!title || !organization || !date) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    try {
        // Prepare certificate data
        const certificateData = {
            title,
            organization,
            date,
            id: id || `CERT-${Date.now()}`
        };

        // Handle image upload if provided
        if (imageFile) {
            certificateData.image = await dataManager.saveImage(imageFile, 'certificates');
        }

        // Save certificate using data manager
        const savedCertificate = await submitForm(certificateData, 'certificate');

        if (savedCertificate) {
            // Add to current user data for immediate UI update
            currentUser.certificates.push(savedCertificate);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            // Refresh the display
            loadCertificates();
            document.getElementById('totalCertificates').textContent = currentUser.certificates.length;

            // Close modal and reset form
            bootstrap.Modal.getInstance(document.getElementById('addCertificateModal')).hide();
            document.getElementById('certificateForm').reset();

            showToast('Certificate added successfully!', 'success');
        }
    } catch (error) {
        console.error('Error saving certificate:', error);
        showToast('Error saving certificate. Please try again.', 'error');
    }
}

// Internship modal functions
function showInternshipModal() {
    const modalHTML = `
        <div class="modal fade" id="addInternshipModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Add Internship</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="internshipForm">
                            <div class="mb-3">
                                <label for="internshipCompany" class="form-label">Company *</label>
                                <input type="text" class="form-control" id="internshipCompany" required>
                            </div>
                            <div class="mb-3">
                                <label for="internshipRole" class="form-label">Role/Position *</label>
                                <input type="text" class="form-control" id="internshipRole" required>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="internshipStartDate" class="form-label">Start Date *</label>
                                    <input type="date" class="form-control" id="internshipStartDate" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="internshipEndDate" class="form-label">End Date</label>
                                    <input type="date" class="form-control" id="internshipEndDate">
                                </div>
                            </div>
                            <div class="mb-3">
                                <label for="internshipDuration" class="form-label">Duration</label>
                                <input type="text" class="form-control" id="internshipDuration" placeholder="e.g., 3 months">
                            </div>
                            <div class="mb-3">
                                <label for="internshipDescription" class="form-label">Description *</label>
                                <textarea class="form-control" id="internshipDescription" rows="3" required placeholder="Describe your work and responsibilities..."></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveInternship()">Save Internship</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('addInternshipModal');
    if (existingModal) existingModal.remove();

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addInternshipModal'));
    modal.show();
}

// Save internship
async function saveInternship() {
    const company = document.getElementById('internshipCompany').value;
    const role = document.getElementById('internshipRole').value;
    const startDate = document.getElementById('internshipStartDate').value;
    const endDate = document.getElementById('internshipEndDate').value;
    const duration = document.getElementById('internshipDuration').value;
    const description = document.getElementById('internshipDescription').value;

    if (!company || !role || !startDate || !description) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    try {
        // Prepare internship data
        const internshipData = {
            company,
            role,
            startDate,
            endDate,
            duration: duration || calculateDuration(startDate, endDate),
            description
        };

        // Save internship using data manager
        const savedInternship = await submitForm(internshipData, 'internship');

        if (savedInternship) {
            // Add to current user data for immediate UI update
            currentUser.internships.push(savedInternship);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            // Refresh the display
            loadInternships();
            document.getElementById('totalInternships').textContent = currentUser.internships.length;

            // Close modal and reset form
            bootstrap.Modal.getInstance(document.getElementById('addInternshipModal')).hide();
            document.getElementById('internshipForm').reset();

            showToast('Internship added successfully!', 'success');
        }
    } catch (error) {
        console.error('Error saving internship:', error);
        showToast('Error saving internship. Please try again.', 'error');
    }
}

// Helper function to calculate duration
function calculateDuration(startDate, endDate) {
    if (!startDate || !endDate) return '';

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.round(diffDays / 30)} months`;
    return `${Math.round(diffDays / 365)} years`;
}

function addAcademicRecord() {
    alert('Academic record form would open here');
}

function addSkill() {
    document.getElementById('newSkillInput').focus();
}

async function saveAchievement() {
    const title = document.getElementById('achievementTitle').value.trim();
    const description = document.getElementById('achievementDescription').value.trim();
    const date = document.getElementById('achievementDate').value;
    const category = document.getElementById('achievementCategory').value;
    const imageFile = document.getElementById('achievementFile').files[0];

    if (!title || !description || !date) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    try {
        // Build achievement payload
        const payload = {
            category,
            title,
            description,
            startDate: date,
            ownerUserId: currentUser.id || currentUser._id,
            ownerRole: 'student'
        };

        // Step 1: Create achievement
        let saved;
        try {
            saved = await window.api.createAchievement(payload);
        } catch (apiErr) {
            // Fallback: use dataManager which has its own retry logic
            saved = await dataManager.saveAchievement(currentUser.id || currentUser._id, { ...payload, date });
        }

        // Step 2: Upload proof file if provided
        if (imageFile && saved && (saved._id || saved.id)) {
            try {
                await window.api.uploadProof(saved._id || saved.id, imageFile);
            } catch (uploadErr) {
                console.warn('Proof upload failed (achievement still saved):', uploadErr.message);
            }
        }

        // Update local state optimistically
        const localAchievement = {
            ...(saved || {}),
            title,
            description,
            date,
            category,
            status: saved?.status || 'pending'
        };
        currentUser.achievements.unshift(localAchievement);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Refresh the display
        loadAchievements();
        loadRecentAchievements();
        document.getElementById('totalAchievements').textContent = currentUser.achievements.length;

        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('addAchievementModal'));
        if (modal) modal.hide();
        document.getElementById('achievementForm').reset();

        showToast('Achievement submitted! Your class teacher will be notified for verification.', 'success');
        // Refresh from server after short delay
        setTimeout(() => refreshStudentAchievements(), 1500);
    } catch (error) {
        console.error('Error saving achievement:', error);
        showToast(error.message || 'Error saving achievement. Please try again.', 'error');
    }
}

// Delete functions - calls backend API
async function deleteStudentAchievement(achievementId, index) {
    if (!confirm('Are you sure you want to delete this achievement?')) return;
    try {
        if (achievementId && achievementId !== 'undefined') {
            await window.api.deleteAchievement(achievementId);
        }
        currentUser.achievements.splice(index, 1);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        loadAchievements();
        loadRecentAchievements();
        document.getElementById('totalAchievements').textContent = currentUser.achievements.length;
        showToast('Achievement deleted successfully!', 'success');
    } catch (error) {
        showToast(error.message || 'Error deleting achievement', 'error');
    }
}

// Legacy alias
function deleteAchievement(index) {
    const ach = currentUser.achievements[index];
    deleteStudentAchievement(ach?._id || ach?.id, index);
}

function deleteCertificate(index) {
    if (confirm('Are you sure you want to delete this certificate?')) {
        currentUser.certificates.splice(index, 1);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        loadCertificates();
        document.getElementById('totalCertificates').textContent = currentUser.certificates.length;
        showToast('Certificate deleted successfully!', 'success');
    }
}

function deleteInternship(index) {
    if (confirm('Are you sure you want to delete this internship?')) {
        currentUser.internships.splice(index, 1);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        loadInternships();
        document.getElementById('totalInternships').textContent = currentUser.internships.length;
        showToast('Internship deleted successfully!', 'success');
    }
}

// Skill management
async function addNewSkill() {
    const skillInput = document.getElementById('newSkillInput');
    const skill = skillInput.value.trim();

    if (!skill) {
        showToast('Please enter a skill name', 'error');
        return;
    }

    if (currentUser.skills.includes(skill)) {
        showToast('Skill already exists', 'warning');
        return;
    }

    try {
        // Save skill using data manager
        const savedSkill = await submitForm(skill, 'skill');

        if (savedSkill) {
            // Add to current user data for immediate UI update
            currentUser.skills.push(skill);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            skillInput.value = '';
            loadSkills();
            loadSkillTags();
            showToast('Skill added successfully!', 'success');
        }
    } catch (error) {
        console.error('Error saving skill:', error);
        showToast('Error saving skill. Please try again.', 'error');
    }
}

function removeSkill(index) {
    currentUser.skills.splice(index, 1);
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    loadSkills();
    loadSkillTags();
    showToast('Skill removed successfully!', 'success');
}

// Profile editing
function editProfile() {
    const form = document.getElementById('profileForm');
    // Enable all inputs except permanently-readonly fields (email, college, courseYear)
    form.querySelectorAll('input, textarea').forEach(input => {
        if (!['email', 'college', 'courseYear'].includes(input.id)) {
            input.disabled = false;
            input.removeAttribute('readonly');
        }
    });
    // Show save button
    const saveBtn = document.getElementById('saveProfileBtn');
    if (saveBtn) saveBtn.style.display = 'inline-block';
}

function cancelEdit() {
    loadStudentData();
    const saveBtn = document.getElementById('saveProfileBtn');
    if (saveBtn) saveBtn.style.display = 'none';
}

async function saveProfile() {
    // Read values from form
    const updates = {
        name: document.getElementById('fullName')?.value?.trim() || currentUser.name,
        headline: document.getElementById('headline')?.value?.trim() || currentUser.headline,
        bio: document.getElementById('bio')?.value?.trim() || currentUser.bio,
        phone: document.getElementById('phone')?.value?.trim() || currentUser.phone,
        fatherName: document.getElementById('fatherName')?.value?.trim() || currentUser.fatherName,
        motherName: document.getElementById('motherName')?.value?.trim() || currentUser.motherName,
        socialMedia: {
            linkedin: document.getElementById('linkedin')?.value?.trim() || '',
            github: document.getElementById('github')?.value?.trim() || '',
            portfolio: document.getElementById('portfolio')?.value?.trim() || ''
        },
        studentProfile: {
            ...(currentUser.studentProfile || {}),
            classTeacherEmail: document.getElementById('classTeacherEmail')?.value?.trim() || '',
            classTeacherCode: document.getElementById('classTeacherCode')?.value?.trim() || '',
        }
    };

    // Update local state
    Object.assign(currentUser, updates);
    currentUser.classTeacherEmail = updates.studentProfile.classTeacherEmail;
    currentUser.classTeacherCode = updates.studentProfile.classTeacherCode;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));

    // Attempt backend save (PATCH /api/auth/me if available, otherwise graceful)
    try {
        await window.api.request('/auth/me', {
            method: 'PATCH',
            body: JSON.stringify(updates)
        });
    } catch (err) {
        // Non-critical: local save still applied
        console.warn('Profile update to API failed (saved locally):', err.message);
    }

    loadStudentData();
    const saveBtn = document.getElementById('saveProfileBtn');
    if (saveBtn) saveBtn.style.display = 'none';
    showToast('Profile updated successfully!', 'success');
}

// Resume and portfolio generation
function generateResume() {
    showToast('Redirecting to Resume Builder...', 'info');
    setTimeout(() => {
        window.location.href = 'resume-generator.html';
    }, 1500);
}

function generatePortfolio() {
    const portfolioUrl = `${window.location.origin}/portfolio.html?id=${currentUser.id}`;
    showToast(`Portfolio generated successfully! Redirecting...`, 'success');
    setTimeout(() => {
        window.open(portfolioUrl, '_blank');
    }, 1000);
}

// View portfolio
function viewPortfolio() {
    const portfolioUrl = `${window.location.origin}/portfolio.html?id=${currentUser.id}`;
    window.open(portfolioUrl, '_blank');
}

// Utility functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getGrade(cgpa) {
    if (cgpa >= 9.0) return 'A+';
    if (cgpa >= 8.0) return 'A';
    if (cgpa >= 7.0) return 'B+';
    if (cgpa >= 6.0) return 'B';
    return 'C';
}

function showToast(message, type = 'info') {
    // Remove any existing toasts
    const existingToasts = document.querySelectorAll('.toast');
    existingToasts.forEach(toast => toast.remove());

    // Create toast notification
    const bgClass = type === 'success' ? 'bg-success' :
        type === 'error' || type === 'danger' ? 'bg-danger' :
            type === 'warning' ? 'bg-warning' : 'bg-info';

    const toastHTML = `
        <div class="toast align-items-center text-white ${bgClass} border-0 position-fixed" 
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

// Generate resume
function generateResume() {
    window.open('resume-generator.html', '_blank');
}

// View portfolio
function viewPortfolio() {
    showToast('Portfolio feature coming soon!', 'info');
}

// Export student data as JSON
function exportData() {
    const studentData = {
        profile: currentUser,
        achievements: achievements,
        certificates: certificates,
        skills: currentUser.skills,
        timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(studentData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentUser.name.replace(' ', '_')}_data.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Data exported successfully!', 'success');
}

function renderStatusBadge(status) {
    if (status === 'approved') return '<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i>Verified</span>';
    if (status === 'rejected') return '<span class="badge bg-danger"><i class="fas fa-times-circle me-1"></i>Rejected</span>';
    if (status === 'correction_requested') return '<span class="badge bg-warning text-dark"><i class="fas fa-undo me-1"></i>Correction Requested</span>';
    if (status === 'institution_verification') return '<span class="badge bg-primary"><i class="fas fa-university me-1"></i>College Review</span>';
    return '<span class="badge bg-secondary"><i class="fas fa-clock me-1"></i>Pending</span>';
}

function formatStatusText(status) {
    if (status === 'approved') return 'Accepted';
    if (status === 'rejected') return 'Rejected';
    if (status === 'correction_requested') return 'Correction Requested';
    if (status === 'institution_verification') return 'Under College Review';
    return 'Waiting for verification';
}