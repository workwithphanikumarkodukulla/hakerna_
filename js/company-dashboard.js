// Company Dashboard JavaScript
let currentSection = 'overview';
let editMode = false;

// Initialize dashboard when page loads
$(document).ready(function () {
    if (!checkAuth()) return;

    const user = getCurrentUser();
    if (!user || user.type !== 'company') {
        window.location.href = 'index.html';
        return;
    }

    initializeCompanyDashboard();
    loadOverviewData();
    showSection('overview');
});

// Initialize company dashboard with user data
function initializeCompanyDashboard() {
    const user = getCurrentUser();
    if (user && user.companyData) {
        updateCompanyDisplay(user.companyData);
    } else if (user) {
        // Use default company data from dummyData
        const companyData = getDummyData().companies.find(c => c.email === user.email);
        if (companyData && companyData.companyData) {
            updateCompanyDisplay(companyData.companyData);
        }
    }
}

// Update company display information
function updateCompanyDisplay(companyData) {
    $('#companyName').text(companyData.name || 'TechCorp Solutions');
    $('#companyIndustry').text(companyData.industry || 'Software Development');

    // Update profile section
    $('#profileName').text(companyData.name || 'TechCorp Solutions');
    $('#profileDescription').text(companyData.description || 'Leading Software Development Company');

    // Update form fields
    $('#companyNameInput').val(companyData.name || 'TechCorp Solutions');
    $('#companyIndustryInput').val(companyData.industry || 'Software Development');
    $('#companyPhone').val(companyData.phone || '+1-555-0123');
    $('#companyWebsite').val(companyData.website || 'https://techcorp.com');
    $('#companyAddress').val(companyData.address || '123 Tech Street, Silicon Valley, CA 94000');
    $('#hrContactName').val(companyData.hrContact || 'Sarah Johnson');
    $('#companyDescription').val(companyData.description || 'Leading software development company specializing in cutting-edge solutions for enterprise clients.');

    if (companyData.size) {
        $('#companySize').val(companyData.size);
    }
}

// Show different sections
function showSection(sectionName) {
    // Hide all sections
    $('.content-section').hide();

    // Remove active class from sidebar items
    $('.sidebar-item').removeClass('active');

    // Show selected section
    $(`#${sectionName}`).show();

    // Add active class to current sidebar item
    $(`.sidebar-item:contains('${getSectionTitle(sectionName)}')`).addClass('active');

    currentSection = sectionName;

    // Load section-specific data
    switch (sectionName) {
        case 'overview':
            loadOverviewData();
            break;
        case 'search':
            loadTalentSearch();
            break;
        case 'opportunities':
            loadJobOpportunities();
            break;
        case 'saved':
            loadSavedProfiles();
            break;
        case 'analytics':
            loadAnalytics();
            break;
        case 'messages':
            loadMessages();
            break;
    }
}

// Get section title for sidebar highlighting
function getSectionTitle(sectionName) {
    const titles = {
        'overview': 'Overview',
        'profile': 'Company Profile',
        'search': 'Talent Search',
        'opportunities': 'Job Opportunities',
        'saved': 'Saved Profiles',
        'analytics': 'Analytics',
        'messages': 'Messages'
    };
    return titles[sectionName] || sectionName;
}

// Load overview data
function loadOverviewData() {
    // Load recommended talent
    const recommendedTalent = getRecommendedTalent();
    displayRecommendedTalent(recommendedTalent);
}

// Get recommended talent based on company requirements
function getRecommendedTalent() {
    const allStudents = getDummyData().students;
    // Filter and sort students based on skills and performance
    return allStudents
        .filter(student => student.cgpa >= 8.0)
        .sort((a, b) => b.cgpa - a.cgpa)
        .slice(0, 5);
}

// Display recommended talent
function displayRecommendedTalent(talents) {
    const container = $('#recommendedTalent');
    let html = '';

    talents.forEach(talent => {
        const skillsDisplay = talent.skills.slice(0, 3).map(skill =>
            `<span class="badge bg-primary bg-opacity-20 text-primary me-1">${skill}</span>`
        ).join('');

        html += `
            <div class="talent-card mb-3 p-3 border rounded" data-student-id="${talent.id}">
                <div class="row align-items-center">
                    <div class="col-auto">
                        <img src="${talent.avatar}" alt="${talent.name}" class="rounded-circle" style="width: 50px; height: 50px;">
                    </div>
                    <div class="col">
                        <h6 class="mb-1">${talent.name}</h6>
                        <small class="text-muted">${talent.course} • CGPA: ${talent.cgpa}</small>
                        <div class="mt-1">${skillsDisplay}</div>
                    </div>
                    <div class="col-auto">
                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-primary btn-sm" onclick="viewStudentProfile(${talent.id})">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="saveProfile(${talent.id})">
                                <i class="fas fa-heart"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    container.html(html);
}

// Load talent search
function loadTalentSearch() {
    // Initially show all students
    searchTalent();
}

// Search talent based on criteria
async function searchTalent() {
    const skillSearch = $('#skillSearch').val().toLowerCase();
    const courseFilter = $('#courseFilter').val();
    const cgpaFilter = $('#cgpaFilter').val();
    const academicYear = $('#filterAcademicYear').val();
    const certName = $('#filterCertName').val();
    const certStart = $('#filterCertStart').val();
    const certEnd = $('#filterCertEnd').val();

    const container = $('#searchResults');
    container.html('<div class="text-center py-4"><p class="text-muted">Loading talent...</p></div>');

    try {
        const queryParams = new URLSearchParams({ role: 'student', limit: 50 });
        if (skillSearch) queryParams.append('search', skillSearch); // using general search for skills
        if (academicYear) queryParams.append('academicYear', academicYear);
        if (certName) queryParams.append('certName', certName);
        if (certStart) queryParams.append('certStart', certStart);
        if (certEnd) queryParams.append('certEnd', certEnd);

        const response = await window.api.request(`/users?${queryParams.toString()}`);
        let students = response.items || [];

        // Client-side filtering for course and CGPA if needed
        if (courseFilter) {
            students = students.filter(s => s.studentProfile?.course === courseFilter);
        }
        if (cgpaFilter) {
            const minCgpa = parseFloat(cgpaFilter.replace('+', ''));
            students = students.filter(s => (s.studentProfile?.cgpa || 0) >= minCgpa);
        }

        displaySearchResults(students);
    } catch (err) {
        console.error('Error fetching talent:', err);
        container.html('<div class="text-center py-4"><p class="text-danger">Failed to load talent.</p></div>');
    }
}

// Display search results
function displaySearchResults(students) {
    const container = $('#searchResults');
    let html = '';

    if (students.length === 0) {
        html = '<div class="text-center py-4"><p class="text-muted">No students found matching your criteria.</p></div>';
    } else {
        html = `<div class="mb-3"><small class="text-muted">Found ${students.length} students</small></div>`;

        students.forEach(student => {
            const skillsDisplay = (student.studentProfile?.skills || []).map(skill =>
                `<span class="badge bg-primary bg-opacity-20 text-primary me-1">${skill}</span>`
            ).join('');

            html += `
                <div class="student-card mb-3 p-3 border rounded" data-student-id="${student._id}">
                    <div class="row">
                        <div class="col-auto">
                            <img src="${student.profileImage || 'images/profiles/default-student.svg'}" class="rounded-circle" style="width: 60px; height: 60px; object-fit: cover;">
                        </div>
                        <div class="col">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="mb-1">${student.name}</h6>
                                    <small class="text-muted">${student.studentProfile?.course || 'N/A'} • CGPA: ${student.studentProfile?.cgpa || 'N/A'}</small>
                                    <div class="mt-2">${skillsDisplay}</div>
                                </div>
                                <div class="d-flex gap-2">
                                    <button class="btn btn-outline-primary btn-sm" onclick="window.open('portfolio.html?id=${student._id}', '_blank')">
                                        <i class="fas fa-eye me-1"></i>View Profile
                                    </button>
                                </div>
                            </div>
                            <div class="mt-2">
                                <small class="text-muted">
                                    <i class="fas fa-map-marker-alt me-1"></i>${student.institution || 'N/A'}
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    container.html(html);
}

// Load job opportunities
function loadJobOpportunities() {
    const jobs = getCompanyJobs();
    displayJobOpportunities(jobs);
}

// Get company jobs
function getCompanyJobs() {
    const savedJobs = localStorage.getItem('companyJobs');
    if (savedJobs) {
        return JSON.parse(savedJobs);
    }

    // Default jobs
    const defaultJobs = [
        {
            id: 1,
            title: 'Frontend Developer',
            role: 'Software Engineer',
            location: 'Remote',
            type: 'full-time',
            experience: 'fresher',
            salary: '$50,000 - $70,000',
            description: 'We are looking for a talented Frontend Developer to join our team.',
            skills: ['JavaScript', 'React', 'HTML/CSS'],
            deadline: '2024-02-15',
            posted: '2024-01-15',
            applications: 12,
            status: 'active'
        },
        {
            id: 2,
            title: 'Backend Developer Intern',
            role: 'Software Engineer Intern',
            location: 'San Francisco, CA',
            type: 'internship',
            experience: 'fresher',
            salary: '$25/hour',
            description: 'Summer internship opportunity for backend development.',
            skills: ['Python', 'Django', 'PostgreSQL'],
            deadline: '2024-03-01',
            posted: '2024-01-10',
            applications: 25,
            status: 'active'
        }
    ];

    localStorage.setItem('companyJobs', JSON.stringify(defaultJobs));
    return defaultJobs;
}

// Display job opportunities
function displayJobOpportunities(jobs) {
    const container = $('#jobsList');
    let html = '';

    if (jobs.length === 0) {
        html = `
            <div class="text-center py-4">
                <i class="fas fa-briefcase text-muted mb-3" style="font-size: 3rem;"></i>
                <p class="text-muted">No job postings yet. Create your first job posting!</p>
                <button class="btn btn-success" onclick="postNewJob()">
                    <i class="fas fa-plus me-1"></i>Post Your First Job
                </button>
            </div>
        `;
    } else {
        jobs.forEach(job => {
            const skillsDisplay = job.skills.map(skill =>
                `<span class="badge bg-secondary me-1">${skill}</span>`
            ).join('');

            const statusBadge = job.status === 'active' ?
                '<span class="badge bg-success">Active</span>' :
                '<span class="badge bg-secondary">Closed</span>';

            html += `
                <div class="job-card mb-3 p-3 border rounded">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div>
                            <h6 class="mb-1">${job.title}</h6>
                            <small class="text-muted">${job.role} • ${job.type} • ${job.location}</small>
                        </div>
                        <div class="d-flex gap-2 align-items-center">
                            ${statusBadge}
                            <div class="dropdown">
                                <button class="btn btn-outline-secondary btn-sm dropdown-toggle" data-bs-toggle="dropdown">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item" href="#" onclick="editJob(${job.id})">
                                        <i class="fas fa-edit me-2"></i>Edit
                                    </a></li>
                                    <li><a class="dropdown-item" href="#" onclick="viewJobApplications(${job.id})">
                                        <i class="fas fa-users me-2"></i>View Applications
                                    </a></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item text-danger" href="#" onclick="deleteJob(${job.id})">
                                        <i class="fas fa-trash me-2"></i>Delete
                                    </a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    <p class="mb-2">${job.description}</p>
                    <div class="mb-2">${skillsDisplay}</div>
                    <div class="row">
                        <div class="col-md-6">
                            <small class="text-muted">
                                <i class="fas fa-calendar me-1"></i>Posted: ${formatDate(job.posted)}
                                <i class="fas fa-clock ms-3 me-1"></i>Deadline: ${formatDate(job.deadline)}
                            </small>
                        </div>
                        <div class="col-md-6 text-end">
                            <small class="text-muted">
                                <i class="fas fa-users me-1"></i>${job.applications} applications
                                <i class="fas fa-dollar-sign ms-3 me-1"></i>${job.salary}
                            </small>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    container.html(html);
}

// Load saved profiles
function loadSavedProfiles() {
    const savedProfiles = getSavedProfiles();
    displaySavedProfiles(savedProfiles);
}

// Get saved profiles
function getSavedProfiles() {
    const saved = localStorage.getItem('savedProfiles');
    return saved ? JSON.parse(saved) : [];
}

// Display saved profiles
function displaySavedProfiles(profileIds) {
    const container = $('#savedProfilesList');

    if (profileIds.length === 0) {
        container.html(`
            <div class="text-center py-4">
                <i class="fas fa-heart text-muted mb-3" style="font-size: 3rem;"></i>
                <p class="text-muted">No saved profiles yet. Save profiles while browsing talent!</p>
                <button class="btn btn-primary" onclick="showSection('search')">
                    <i class="fas fa-search me-1"></i>Search Talent
                </button>
            </div>
        `);
        return;
    }

    const allStudents = getDummyData().students;
    const savedStudents = allStudents.filter(student => profileIds.includes(student.id));

    let html = '';
    savedStudents.forEach(student => {
        const skillsDisplay = student.skills.slice(0, 4).map(skill =>
            `<span class="badge bg-primary bg-opacity-20 text-primary me-1">${skill}</span>`
        ).join('');

        html += `
            <div class="saved-profile-card mb-3 p-3 border rounded">
                <div class="row align-items-center">
                    <div class="col-auto">
                        <img src="${student.avatar}" alt="${student.name}" class="rounded-circle" style="width: 60px; height: 60px;">
                    </div>
                    <div class="col">
                        <h6 class="mb-1">${student.name}</h6>
                        <small class="text-muted">${student.course} • CGPA: ${student.cgpa}</small>
                        <div class="mt-1">${skillsDisplay}</div>
                        <small class="text-muted mt-1 d-block">
                            <i class="fas fa-heart text-danger me-1"></i>Saved on ${formatDate(new Date())}
                        </small>
                    </div>
                    <div class="col-auto">
                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-primary btn-sm" onclick="viewStudentProfile(${student.id})">
                                <i class="fas fa-eye me-1"></i>View
                            </button>
                            <button class="btn btn-outline-success btn-sm" onclick="contactStudent(${student.id})">
                                <i class="fas fa-envelope me-1"></i>Contact
                            </button>
                            <button class="btn btn-outline-danger btn-sm" onclick="unsaveProfile(${student.id})">
                                <i class="fas fa-heart-broken me-1"></i>Remove
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    container.html(html);
}

// Load analytics data
function loadAnalytics() {
    // Analytics are already loaded in the HTML, but we can add dynamic updates here
    updateAnalyticsData();
}

// Update analytics data
function updateAnalyticsData() {
    const jobs = getCompanyJobs();
    const savedProfiles = getSavedProfiles();

    $('#activeJobs').text(jobs.filter(job => job.status === 'active').length);
    $('#savedProfiles').text(savedProfiles.length);

    // Calculate total applications
    const totalApplications = jobs.reduce((sum, job) => sum + job.applications, 0);
    $('#applications').text(totalApplications);
}

// Load messages
function loadMessages() {
    const messages = getCompanyMessages();
    displayMessages(messages);
}

// Get company messages
function getCompanyMessages() {
    return [
        {
            id: 1,
            from: 'Rahul Sharma',
            subject: 'Interest in Frontend Developer Position',
            message: 'Hi, I am very interested in the Frontend Developer position posted by your company.',
            date: '2024-01-20',
            type: 'application',
            read: false
        },
        {
            id: 2,
            from: 'Priya Patel',
            subject: 'Portfolio Submission',
            message: 'Please find attached my portfolio for the internship opportunity.',
            date: '2024-01-19',
            type: 'portfolio',
            read: true
        },
        {
            id: 3,
            from: 'System',
            subject: 'New job application received',
            message: 'You have received a new application for Backend Developer position.',
            date: '2024-01-18',
            type: 'notification',
            read: false
        }
    ];
}

// Display messages
function displayMessages(messages) {
    const container = $('#messagesList');
    let html = '';

    if (messages.length === 0) {
        html = `
            <div class="text-center py-4">
                <i class="fas fa-envelope text-muted mb-3" style="font-size: 3rem;"></i>
                <p class="text-muted">No messages yet.</p>
            </div>
        `;
    } else {
        messages.forEach(message => {
            const readClass = message.read ? '' : 'fw-bold';
            const typeIcon = message.type === 'application' ? 'fas fa-user' :
                message.type === 'portfolio' ? 'fas fa-folder' : 'fas fa-bell';

            html += `
                <div class="message-card mb-3 p-3 border rounded ${readClass}" data-message-id="${message.id}">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <div class="d-flex align-items-center mb-1">
                                <i class="${typeIcon} text-primary me-2"></i>
                                <h6 class="mb-0">${message.subject}</h6>
                            </div>
                            <small class="text-muted">From: ${message.from}</small>
                            <p class="mt-2 mb-0">${message.message}</p>
                        </div>
                        <small class="text-muted">${formatDate(message.date)}</small>
                    </div>
                </div>
            `;
        });
    }

    container.html(html);
}

// View student profile
function viewStudentProfile(studentId) {
    const allStudents = getDummyData().students;
    const student = allStudents.find(s => s.id === studentId);

    if (!student) return;

    let html = `
        <div class="row">
            <div class="col-md-4 text-center">
                <img src="${student.avatar}" alt="${student.name}" class="rounded-circle mb-3" style="width: 120px; height: 120px;">
                <h5>${student.name}</h5>
                <p class="text-muted">${student.course}</p>
                <div class="mb-3">
                    <span class="badge bg-success">CGPA: ${student.cgpa}</span>
                </div>
            </div>
            <div class="col-md-8">
                <h6>Skills</h6>
                <div class="mb-3">
                    ${student.skills.map(skill => `<span class="badge bg-primary me-1">${skill}</span>`).join('')}
                </div>
                
                <h6>Achievements</h6>
                <div class="mb-3">
                    ${student.achievements ? student.achievements.slice(0, 3).map(achievement =>
        `<div class="mb-1"><i class="fas fa-trophy text-warning me-2"></i>${achievement.title}</div>`
    ).join('') : '<p class="text-muted">No achievements listed</p>'}
                </div>
                
                <h6>Contact Information</h6>
                <div class="mb-3">
                    <p class="mb-1"><i class="fas fa-envelope me-2"></i>${student.email || student.name.toLowerCase().replace(' ', '.') + '@gmail.com'}</p>
                    <p class="mb-1"><i class="fas fa-phone me-2"></i>+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}</p>
                    <p class="mb-0"><i class="fas fa-map-marker-alt me-2"></i>${student.college || 'IIT Delhi'}</p>
                </div>
            </div>
        </div>
    `;

    $('#studentProfileContent').html(html);
    $('#studentProfileModal').modal('show');
}

// Save profile
function saveProfile(studentId = null) {
    let savedProfiles = getSavedProfiles();

    if (studentId) {
        if (!savedProfiles.includes(studentId)) {
            savedProfiles.push(studentId);
            localStorage.setItem('savedProfiles', JSON.stringify(savedProfiles));
            showToast('Profile saved successfully!', 'success');
        } else {
            showToast('Profile already saved!', 'info');
        }
    }
}

// Unsave profile
function unsaveProfile(studentId) {
    let savedProfiles = getSavedProfiles();
    savedProfiles = savedProfiles.filter(id => id !== studentId);
    localStorage.setItem('savedProfiles', JSON.stringify(savedProfiles));
    showToast('Profile removed from saved list!', 'success');
    loadSavedProfiles(); // Reload the saved profiles
}

// Contact student
function contactStudent(studentId = null) {
    if (studentId) {
        showToast('Message sent to student!', 'success');
    }
    $('#studentProfileModal').modal('hide');
}

// Post new job
function postNewJob() {
    // Clear form
    $('#jobForm')[0].reset();
    $('#postJobModal').modal('show');
}

// Save job
function saveJob() {
    const form = $('#jobForm')[0];
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const jobData = {
        id: Date.now(),
        title: $('#jobTitle').val(),
        role: $('#jobRole').val(),
        location: $('#jobLocation').val(),
        type: $('#jobType').val(),
        experience: $('#experienceLevel').val(),
        salary: $('#salaryRange').val(),
        description: $('#jobDescription').val(),
        skills: $('#requiredSkills').val().split(',').map(s => s.trim()),
        deadline: $('#applicationDeadline').val(),
        posted: new Date().toISOString().split('T')[0],
        applications: 0,
        status: 'active'
    };

    let jobs = getCompanyJobs();
    jobs.push(jobData);
    localStorage.setItem('companyJobs', JSON.stringify(jobs));

    $('#postJobModal').modal('hide');
    showToast('Job posted successfully!', 'success');

    if (currentSection === 'opportunities') {
        loadJobOpportunities();
    }
}

// Edit company profile
function editCompanyProfile() {
    editMode = true;
    $('#companyProfileForm input, #companyProfileForm textarea, #companyProfileForm select').prop('disabled', false);
    showToast('Profile editing enabled', 'info');
}

// Cancel company edit
function cancelCompanyEdit() {
    editMode = false;
    $('#companyProfileForm input, #companyProfileForm textarea, #companyProfileForm select').prop('disabled', true);
    initializeCompanyDashboard(); // Reset form values
}

// Handle company profile form submission
$('#companyProfileForm').on('submit', function (e) {
    e.preventDefault();

    const user = getCurrentUser();
    if (!user) return;

    const companyData = {
        name: $('#companyNameInput').val(),
        industry: $('#companyIndustryInput').val(),
        size: $('#companySize').val(),
        phone: $('#companyPhone').val(),
        website: $('#companyWebsite').val(),
        address: $('#companyAddress').val(),
        hrContact: $('#hrContactName').val(),
        description: $('#companyDescription').val()
    };

    user.companyData = companyData;
    updateUser(user);
    updateCompanyDisplay(companyData);

    editMode = false;
    $('#companyProfileForm input, #companyProfileForm textarea, #companyProfileForm select').prop('disabled', true);

    showToast('Profile updated successfully!', 'success');
});

// Export talent data
function exportTalentData() {
    const data = {
        searchResults: getDummyData().students,
        savedProfiles: getSavedProfiles(),
        jobs: getCompanyJobs(),
        timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `talent-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Data exported successfully!', 'success');
}

// Utility function to format dates
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Show toast notification
function showToast(message, type = 'info') {
    // Create toast if it doesn't exist
    if (!$('#toast').length) {
        $('body').append(`
            <div class="toast-container position-fixed top-0 end-0 p-3">
                <div id="toast" class="toast" role="alert">
                    <div class="toast-header">
                        <i id="toastIcon" class="fas fa-info-circle text-primary me-2"></i>
                        <strong class="me-auto">Notification</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                    </div>
                    <div class="toast-body" id="toastMessage"></div>
                </div>
            </div>
        `);
    }

    // Update toast content
    const iconClasses = {
        'success': 'fas fa-check-circle text-success',
        'error': 'fas fa-exclamation-circle text-danger',
        'warning': 'fas fa-exclamation-triangle text-warning',
        'info': 'fas fa-info-circle text-primary'
    };

    $('#toastIcon').attr('class', iconClasses[type] + ' me-2');
    $('#toastMessage').text(message);

    // Show toast
    const toast = new bootstrap.Toast($('#toast')[0]);
    toast.show();
}