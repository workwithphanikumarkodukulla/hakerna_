// Job Portal JavaScript
let allJobs = [];
let filteredJobs = [];
let currentPage = 1;
const jobsPerPage = 10;
let currentSort = 'latest';

// Sample job data
const jobsData = [
    {
        id: 1,
        title: "Full Stack Developer",
        company: "TechCorp Solutions",
        location: "Mumbai",
        type: "fulltime",
        experience: "1-3",
        salary: "₹8-12 LPA",
        description: "Join our dynamic team as a Full Stack Developer and work on cutting-edge web applications using React, Node.js, and MongoDB.",
        skills: ["React", "Node.js", "MongoDB", "JavaScript", "HTML/CSS"],
        posted: "2 days ago",
        featured: true,
        logo: "https://via.placeholder.com/60x60/007bff/white?text=TC"
    },
    {
        id: 2,
        title: "Data Scientist",
        company: "DataFlow Analytics",
        location: "Bangalore",
        type: "fulltime",
        experience: "3-5",
        salary: "₹15-20 LPA",
        description: "Seeking an experienced Data Scientist to analyze complex datasets and build machine learning models for business insights.",
        skills: ["Python", "Machine Learning", "SQL", "TensorFlow", "Statistics"],
        posted: "1 day ago",
        featured: false,
        logo: "https://via.placeholder.com/60x60/28a745/white?text=DF"
    },
    {
        id: 3,
        title: "Frontend Developer Intern",
        company: "StartupHub",
        location: "Delhi",
        type: "internship",
        experience: "0-1",
        salary: "₹25,000/month",
        description: "Great opportunity for students to gain hands-on experience in frontend development with modern frameworks.",
        skills: ["React", "JavaScript", "CSS", "HTML", "Git"],
        posted: "3 days ago",
        featured: false,
        logo: "https://via.placeholder.com/60x60/dc3545/white?text=SH"
    },
    {
        id: 4,
        title: "DevOps Engineer",
        company: "CloudTech Systems",
        location: "Hyderabad",
        type: "fulltime",
        experience: "3-5",
        salary: "₹12-18 LPA",
        description: "Join our infrastructure team to manage CI/CD pipelines, containerization, and cloud deployments.",
        skills: ["Docker", "Kubernetes", "AWS", "Jenkins", "Linux"],
        posted: "4 days ago",
        featured: true,
        logo: "https://via.placeholder.com/60x60/6f42c1/white?text=CT"
    },
    {
        id: 5,
        title: "UI/UX Designer",
        company: "DesignStudio Pro",
        location: "Pune",
        type: "parttime",
        experience: "1-3",
        salary: "₹6-10 LPA",
        description: "Creative UI/UX Designer needed to design intuitive user interfaces and enhance user experience.",
        skills: ["Figma", "Adobe XD", "Photoshop", "Wireframing", "Prototyping"],
        posted: "5 days ago",
        featured: false,
        logo: "https://via.placeholder.com/60x60/fd7e14/white?text=DS"
    },
    {
        id: 6,
        title: "Backend Developer",
        company: "ServerSide Solutions",
        location: "Chennai",
        type: "fulltime",
        experience: "1-3",
        salary: "₹7-11 LPA",
        description: "Backend Developer role focusing on API development, database design, and server-side logic implementation.",
        skills: ["Java", "Spring Boot", "MySQL", "REST API", "Microservices"],
        posted: "1 week ago",
        featured: false,
        logo: "https://via.placeholder.com/60x60/20c997/white?text=SS"
    },
    {
        id: 7,
        title: "Mobile App Developer",
        company: "MobileFirst Tech",
        location: "Remote",
        type: "contract",
        experience: "3-5",
        salary: "₹10-15 LPA",
        description: "Develop cross-platform mobile applications using React Native and Flutter for iOS and Android platforms.",
        skills: ["React Native", "Flutter", "Dart", "Firebase", "Mobile UI"],
        posted: "2 days ago",
        featured: true,
        logo: "https://via.placeholder.com/60x60/6610f2/white?text=MF"
    },
    {
        id: 8,
        title: "AI/ML Engineer",
        company: "AI Innovations Lab",
        location: "Bangalore",
        type: "fulltime",
        experience: "3-5",
        salary: "₹18-25 LPA",
        description: "Work on cutting-edge AI projects including computer vision, NLP, and deep learning applications.",
        skills: ["Python", "TensorFlow", "PyTorch", "Computer Vision", "NLP"],
        posted: "3 days ago",
        featured: true,
        logo: "https://via.placeholder.com/60x60/e83e8c/white?text=AI"
    },
    {
        id: 9,
        title: "Quality Assurance Engineer",
        company: "TestPro Solutions",
        location: "Mumbai",
        type: "fulltime",
        experience: "1-3",
        salary: "₹5-8 LPA",
        description: "Ensure software quality through manual and automated testing, test case development, and bug reporting.",
        skills: ["Selenium", "TestNG", "Java", "Manual Testing", "API Testing"],
        posted: "4 days ago",
        featured: false,
        logo: "https://via.placeholder.com/60x60/198754/white?text=TP"
    },
    {
        id: 10,
        title: "Digital Marketing Specialist",
        company: "MarketGrow Digital",
        location: "Delhi",
        type: "fulltime",
        experience: "1-3",
        salary: "₹4-7 LPA",
        description: "Drive online marketing campaigns, SEO optimization, social media management, and content marketing.",
        skills: ["SEO", "Google Ads", "Social Media", "Content Marketing", "Analytics"],
        posted: "5 days ago",
        featured: false,
        logo: "https://via.placeholder.com/60x60/0dcaf0/white?text=MG"
    },
    {
        id: 11,
        title: "Cybersecurity Analyst",
        company: "SecureNet Systems",
        location: "Kolkata",
        type: "fulltime",
        experience: "3-5",
        salary: "₹12-16 LPA",
        description: "Protect organizational systems from cyber threats, conduct security assessments, and implement security measures.",
        skills: ["Network Security", "Penetration Testing", "SIEM", "Incident Response", "Compliance"],
        posted: "6 days ago",
        featured: false,
        logo: "https://via.placeholder.com/60x60/dc3545/white?text=SN"
    },
    {
        id: 12,
        title: "Product Manager",
        company: "InnovateTech",
        location: "Bangalore",
        type: "fulltime",
        experience: "5+",
        salary: "₹20-30 LPA",
        description: "Lead product strategy, roadmap planning, and cross-functional team coordination for innovative tech products.",
        skills: ["Product Strategy", "Agile", "Market Research", "Analytics", "Leadership"],
        posted: "1 week ago",
        featured: true,
        logo: "https://via.placeholder.com/60x60/795548/white?text=IT"
    }
];

// Initialize the job portal
document.addEventListener('DOMContentLoaded', function () {
    allJobs = [...jobsData];
    filteredJobs = [...allJobs];
    renderJobs();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', function () {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            filterJobsByType(this.dataset.type);
        });
    });

    // Search input
    document.getElementById('jobSearch').addEventListener('input', debounce(searchJobs, 300));
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Filter jobs by type
function filterJobsByType(type) {
    if (type === 'all') {
        filteredJobs = [...allJobs];
    } else {
        filteredJobs = allJobs.filter(job => job.type === type);
    }
    currentPage = 1;
    renderJobs();
    updateJobCount();
}

// Search jobs
function searchJobs() {
    const searchTerm = document.getElementById('jobSearch').value.toLowerCase();
    const location = document.getElementById('locationFilter').value;
    const experience = document.getElementById('experienceFilter').value;

    filteredJobs = allJobs.filter(job => {
        const matchesSearch = !searchTerm ||
            job.title.toLowerCase().includes(searchTerm) ||
            job.company.toLowerCase().includes(searchTerm) ||
            job.skills.some(skill => skill.toLowerCase().includes(searchTerm));

        const matchesLocation = !location || job.location === location;
        const matchesExperience = !experience || job.experience === experience;

        return matchesSearch && matchesLocation && matchesExperience;
    });

    currentPage = 1;
    renderJobs();
    updateJobCount();
}

// Apply filters
function applyFilters() {
    searchJobs();
}

// Sort jobs
function sortJobs(sortType) {
    currentSort = sortType;

    switch (sortType) {
        case 'latest':
            filteredJobs.sort((a, b) => new Date(b.posted) - new Date(a.posted));
            break;
        case 'salary':
            filteredJobs.sort((a, b) => {
                const salaryA = parseInt(a.salary.match(/₹(\d+)/)[1]);
                const salaryB = parseInt(b.salary.match(/₹(\d+)/)[1]);
                return salaryB - salaryA;
            });
            break;
        case 'company':
            filteredJobs.sort((a, b) => a.company.localeCompare(b.company));
            break;
        case 'relevance':
            // Sort by featured first, then by latest
            filteredJobs.sort((a, b) => {
                if (a.featured && !b.featured) return -1;
                if (!a.featured && b.featured) return 1;
                return 0;
            });
            break;
    }

    renderJobs();
}

// Render job listings
function renderJobs() {
    const jobListings = document.getElementById('jobListings');
    const startIndex = (currentPage - 1) * jobsPerPage;
    const endIndex = startIndex + jobsPerPage;
    const jobsToShow = filteredJobs.slice(startIndex, endIndex);

    if (jobsToShow.length === 0) {
        jobListings.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No jobs found</h5>
                <p class="text-muted">Try adjusting your search filters</p>
            </div>
        `;
        return;
    }

    jobListings.innerHTML = jobsToShow.map(job => createJobCard(job)).join('');
}

// Create job card HTML
function createJobCard(job) {
    const getJobTypeBadge = (type) => {
        const badges = {
            'fulltime': 'job-type-fulltime',
            'parttime': 'job-type-parttime',
            'internship': 'job-type-internship',
            'contract': 'job-type-contract'
        };
        const labels = {
            'fulltime': 'Full Time',
            'parttime': 'Part Time',
            'internship': 'Internship',
            'contract': 'Contract'
        };
        return `<span class="job-type-badge ${badges[type]}">${labels[type]}</span>`;
    };

    return `
        <div class="job-card ${job.featured ? 'featured-job' : ''}">
            <div class="card-body p-4">
                <div class="row">
                    <div class="col-md-8">
                        <div class="d-flex align-items-start mb-3">
                            <img src="${job.logo}" alt="${job.company}" class="company-logo me-3">
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <h5 class="card-title mb-1">${job.title}</h5>
                                    ${getJobTypeBadge(job.type)}
                                </div>
                                <h6 class="card-subtitle text-primary mb-2">${job.company}</h6>
                                <div class="job-location mb-2">
                                    <i class="fas fa-map-marker-alt me-1"></i>${job.location}
                                    <span class="ms-3 job-posted">
                                        <i class="fas fa-clock me-1"></i>${job.posted}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <p class="card-text text-muted mb-3">${job.description}</p>
                        
                        <div class="job-skills">
                            ${job.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                        </div>
                    </div>
                    
                    <div class="col-md-4 text-end">
                        <div class="salary-range mb-3">${job.salary}</div>
                        <div class="mb-3">
                            <small class="text-muted">Experience: ${job.experience} years</small>
                        </div>
                        <div class="d-grid gap-2">
                            <button class="btn apply-btn" onclick="quickApply(${job.id})">
                                <i class="fas fa-paper-plane me-2"></i>Quick Apply
                            </button>
                            <button class="btn btn-outline-primary btn-sm" onclick="viewJobDetails(${job.id})">
                                <i class="fas fa-eye me-2"></i>View Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Quick apply function
function quickApply(jobId) {
    const job = allJobs.find(j => j.id === jobId);
    if (!job) return;

    // Populate job details in modal
    document.getElementById('jobDetails').innerHTML = `
        <div class="d-flex align-items-center mb-3">
            <img src="${job.logo}" alt="${job.company}" class="company-logo me-3">
            <div>
                <h6 class="mb-1">${job.title}</h6>
                <p class="text-muted mb-0">${job.company} • ${job.location}</p>
            </div>
        </div>
    `;

    // Show modal
    new bootstrap.Modal(document.getElementById('quickApplyModal')).show();
}

// View job details
function viewJobDetails(jobId) {
    const job = allJobs.find(j => j.id === jobId);
    if (!job) return;

    // Create detailed view (you can implement a detailed modal or page)
    alert(`Viewing details for: ${job.title} at ${job.company}\n\n${job.description}`);
}

// Submit application
function submitApplication() {
    const form = document.getElementById('quickApplyForm');

    // Basic form validation
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Simulate application submission
    setTimeout(() => {
        // Hide modal
        bootstrap.Modal.getInstance(document.getElementById('quickApplyModal')).hide();

        // Show success toast
        showToast('Application submitted successfully! You will hear back from the company soon.', 'success');

        // Reset form
        form.reset();
    }, 1000);
}

// Change page
function changePage(page) {
    currentPage = page;
    renderJobs();
    updatePagination();
}

// Update job count
function updateJobCount() {
    document.getElementById('jobCount').textContent = filteredJobs.length.toLocaleString();
}

// Update pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
    // Update pagination UI here if needed
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('successToast');
    const toastBody = document.getElementById('toastMessage');
    const toastHeader = toast.querySelector('.toast-header');

    toastBody.textContent = message;

    // Update toast styling based on type
    if (type === 'error') {
        toastHeader.className = 'toast-header bg-danger text-white';
        toastHeader.innerHTML = '<i class="fas fa-exclamation-circle me-2"></i><strong class="me-auto">Error</strong><button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>';
    } else {
        toastHeader.className = 'toast-header bg-success text-white';
        toastHeader.innerHTML = '<i class="fas fa-check-circle me-2"></i><strong class="me-auto">Success</strong><button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>';
    }

    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'index.html';
}

// Check authentication
function checkAuth() {
    // Allow access to job portal for demo purposes
    // const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    // if (!isLoggedIn) {
    //     window.location.href = 'index.html';
    // }
    console.log('Job portal loaded successfully');
}

// Initialize authentication check
checkAuth();