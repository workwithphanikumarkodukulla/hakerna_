// Events Page JavaScript
let events = [];
let filteredEvents = [];
let currentSection = 'upcoming';
let currentCategory = 'all';
let currentEvent = null;
let displayCount = 6;

// Initialize page when DOM is loaded
$(document).ready(function () {
    // Initialize AOS
    AOS.init({
        duration: 1000,
        once: true,
        offset: 100
    });

    // Check if user is logged in
    checkUserAuth();

    // Load events data
    loadEvents();

    // Display upcoming events by default
    showSection('upcoming');
});

// Check user authentication and update navigation
function checkUserAuth() {
    if (checkAuth()) {
        const user = getCurrentUser();
        if (user) {
            $('#loginBtn').hide();
            $('#userDropdown').show();
            $('#userName').text(user.name);
            $('#userAvatar').attr('src', user.avatar || 'https://via.placeholder.com/30/007bff/white?text=U');

            // Set dashboard link based on user type
            const dashboardLinks = {
                'student': 'student-dashboard.html',
                'faculty': 'faculty-dashboard.html',
                'college': 'college-dashboard.html',
                'company': 'company-dashboard.html'
            };
            $('#dashboardLink').attr('href', dashboardLinks[user.type] || '#');
        }
    }
}

// Load events data
function loadEvents() {
    // Dummy events data
    events = [
        {
            id: 1,
            title: "Smart India Hackathon 2024",
            description: "36-hour national level hackathon to solve real-world problems using innovative technology solutions.",
            category: "competition",
            date: "2024-02-15",
            time: "09:00",
            venue: "IIT Delhi, New Delhi",
            organizer: "Ministry of Education, Government of India",
            capacity: 1000,
            registered: 756,
            fee: 0,
            image: "https://via.placeholder.com/400x200/007bff/white?text=SIH+2024",
            tags: ["hackathon", "innovation", "technology", "problem-solving"],
            registrationDeadline: "2024-02-10",
            organizedBy: "Government",
            status: "upcoming",
            featured: true
        },
        {
            id: 2,
            title: "Annual Tech Fest - TechVision 2024",
            description: "Three-day technical festival featuring workshops, competitions, and exhibitions showcasing latest technologies.",
            category: "technical",
            date: "2024-03-20",
            time: "10:00",
            venue: "ANITS Campus, Visakhapatnam",
            organizer: "ANITS Technical Society",
            capacity: 500,
            registered: 342,
            fee: 200,
            image: "https://via.placeholder.com/400x200/28a745/white?text=TechVision",
            tags: ["technology", "festival", "workshops", "exhibitions"],
            registrationDeadline: "2024-03-15",
            organizedBy: "College",
            status: "upcoming",
            featured: true
        },
        {
            id: 3,
            title: "Career Guidance Workshop",
            description: "Interactive workshop on career planning, resume building, and interview preparation for final year students.",
            category: "workshop",
            date: "2024-02-05",
            time: "14:00",
            venue: "GITAM University, Hyderabad",
            organizer: "Career Development Cell",
            capacity: 200,
            registered: 178,
            fee: 0,
            image: "https://via.placeholder.com/400x200/6f42c1/white?text=Career+Workshop",
            tags: ["career", "guidance", "resume", "interview"],
            registrationDeadline: "2024-02-03",
            organizedBy: "College",
            status: "upcoming",
            featured: false
        },
        {
            id: 4,
            title: "Cultural Night - Rang De Basanti",
            description: "Grand cultural celebration featuring dance, music, drama, and art performances by students.",
            category: "cultural",
            date: "2024-01-30",
            time: "18:00",
            venue: "VIT University, Vellore",
            organizer: "Cultural Committee",
            capacity: 800,
            registered: 650,
            fee: 100,
            image: "https://via.placeholder.com/400x200/fd7e14/white?text=Cultural+Night",
            tags: ["cultural", "dance", "music", "celebration"],
            registrationDeadline: "2024-01-28",
            organizedBy: "College",
            status: "past",
            featured: false
        },
        {
            id: 5,
            title: "Inter-College Basketball Championship",
            description: "Annual basketball tournament featuring teams from top engineering colleges across the region.",
            category: "sports",
            date: "2024-03-10",
            time: "08:00",
            venue: "Sports Complex, SRM University",
            organizer: "Sports Department",
            capacity: 300,
            registered: 24,
            fee: 500,
            image: "https://via.placeholder.com/400x200/dc3545/white?text=Basketball",
            tags: ["sports", "basketball", "championship", "competition"],
            registrationDeadline: "2024-03-05",
            organizedBy: "College",
            status: "upcoming",
            featured: false
        },
        {
            id: 6,
            title: "AI & Machine Learning Symposium",
            description: "One-day symposium featuring keynote speakers, research presentations, and networking opportunities in AI/ML.",
            category: "academic",
            date: "2024-02-25",
            time: "09:30",
            venue: "MIT Manipal, Karnataka",
            organizer: "Computer Science Department",
            capacity: 300,
            registered: 198,
            fee: 150,
            image: "https://via.placeholder.com/400x200/20c997/white?text=AI+Symposium",
            tags: ["AI", "machine learning", "research", "symposium"],
            registrationDeadline: "2024-02-20",
            organizedBy: "College",
            status: "upcoming",
            featured: true
        },
        {
            id: 7,
            title: "Entrepreneurship Summit 2024",
            description: "Annual summit bringing together entrepreneurs, investors, and students to discuss startup ecosystem.",
            category: "academic",
            date: "2024-01-15",
            time: "10:00",
            venue: "IIM Bangalore, Bangalore",
            organizer: "Entrepreneurship Cell",
            capacity: 400,
            registered: 400,
            fee: 300,
            image: "https://via.placeholder.com/400x200/e83e8c/white?text=Startup+Summit",
            tags: ["entrepreneurship", "startup", "business", "networking"],
            registrationDeadline: "2024-01-10",
            organizedBy: "Institute",
            status: "past",
            featured: false
        },
        {
            id: 8,
            title: "Web Development Bootcamp",
            description: "Intensive 3-day bootcamp covering full-stack web development with hands-on projects.",
            category: "workshop",
            date: "2024-02-12",
            time: "09:00",
            venue: "TechHub Coworking, Pune",
            organizer: "TechCorp Solutions",
            capacity: 50,
            registered: 45,
            fee: 1500,
            image: "https://via.placeholder.com/400x200/17a2b8/white?text=Web+Bootcamp",
            tags: ["web development", "bootcamp", "coding", "full-stack"],
            registrationDeadline: "2024-02-08",
            organizedBy: "Company",
            status: "upcoming",
            featured: false
        }
    ];

    // Add more past events for demonstration
    for (let i = 9; i <= 15; i++) {
        events.push({
            id: i,
            title: `Past Event ${i - 8}`,
            description: `Description for past event ${i - 8} that already happened.`,
            category: ['academic', 'cultural', 'technical'][Math.floor(Math.random() * 3)],
            date: `2023-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
            time: "10:00",
            venue: "Various Locations",
            organizer: "Various Organizers",
            capacity: 100,
            registered: Math.floor(Math.random() * 100),
            fee: Math.floor(Math.random() * 500),
            image: "https://via.placeholder.com/400x200/6c757d/white?text=Past+Event",
            tags: ["past", "event"],
            registrationDeadline: "2023-12-31",
            organizedBy: "College",
            status: "past",
            featured: false
        });
    }

    updateEventCounts();
}

// Show different sections
function showSection(section) {
    currentSection = section;

    // Update tab active state
    $('.nav-link').removeClass('active');
    $(`#${section}-tab`).addClass('active');

    // Filter and display events
    filterAndDisplayEvents();
}

// Filter by category
function filterByCategory(category) {
    currentCategory = category;

    // Update button active state
    $('.category-filter').removeClass('active');
    $(`.category-filter[data-category="${category}"]`).addClass('active');

    // Filter and display events
    filterAndDisplayEvents();
}

// Filter and display events
function filterAndDisplayEvents() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Filter by section (upcoming/past)
    let sectionFiltered = events.filter(event => {
        if (currentSection === 'upcoming') {
            return event.date >= today;
        } else {
            return event.date < today;
        }
    });

    // Filter by category
    if (currentCategory !== 'all') {
        sectionFiltered = sectionFiltered.filter(event => event.category === currentCategory);
    }

    // Sort events
    sectionFiltered.sort((a, b) => {
        if (currentSection === 'upcoming') {
            return new Date(a.date) - new Date(b.date); // Upcoming first
        } else {
            return new Date(b.date) - new Date(a.date); // Recent first
        }
    });

    filteredEvents = sectionFiltered;
    displayCount = 6; // Reset display count
    displayEvents();
}

// Display events
function displayEvents() {
    const container = $('#eventsContainer');
    const eventsToShow = filteredEvents.slice(0, displayCount);

    if (eventsToShow.length === 0) {
        container.empty();
        $('#emptyState').show();
        $('#loadMoreBtn').hide();
        return;
    }

    $('#emptyState').hide();

    let html = '';
    eventsToShow.forEach((event, index) => {
        const isUpcoming = event.date >= new Date().toISOString().split('T')[0];
        const registrationOpen = isUpcoming && event.date >= new Date().toISOString().split('T')[0];
        const isFull = event.registered >= event.capacity;

        const categoryIcons = {
            'academic': 'fas fa-book',
            'cultural': 'fas fa-theater-masks',
            'technical': 'fas fa-code',
            'sports': 'fas fa-running',
            'workshop': 'fas fa-tools',
            'competition': 'fas fa-trophy'
        };

        const categoryColors = {
            'academic': 'primary',
            'cultural': 'warning',
            'technical': 'success',
            'sports': 'danger',
            'workshop': 'info',
            'competition': 'purple'
        };

        html += `
            <div class="col-lg-4 col-md-6 mb-4" data-aos="fade-up" data-aos-delay="${index * 100}">
                <div class="event-card h-100">
                    <div class="event-image">
                        <img src="${event.image}" alt="${event.title}" class="img-fluid">
                        ${event.featured ? '<div class="featured-badge"><i class="fas fa-star"></i> Featured</div>' : ''}
                        <div class="event-category">
                            <span class="badge bg-${categoryColors[event.category]}">
                                <i class="${categoryIcons[event.category]} me-1"></i>
                                ${event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                            </span>
                        </div>
                    </div>
                    <div class="event-content p-3">
                        <div class="event-date mb-2">
                            <i class="fas fa-calendar text-primary me-2"></i>
                            <span class="fw-bold">${formatDate(event.date)} at ${formatTime(event.time)}</span>
                        </div>
                        <h5 class="event-title mb-2">
                            <a href="#" onclick="openEvent(${event.id})" class="text-decoration-none">
                                ${event.title}
                            </a>
                        </h5>
                        <p class="event-description text-muted mb-3">${event.description.length > 100 ? event.description.substring(0, 100) + '...' : event.description}</p>
                        
                        <div class="event-meta mb-3">
                            <div class="d-flex align-items-center mb-2">
                                <i class="fas fa-map-marker-alt text-primary me-2"></i>
                                <small class="text-muted">${event.venue}</small>
                            </div>
                            <div class="d-flex align-items-center mb-2">
                                <i class="fas fa-user text-primary me-2"></i>
                                <small class="text-muted">${event.organizer}</small>
                            </div>
                            <div class="d-flex align-items-center">
                                <i class="fas fa-users text-primary me-2"></i>
                                <small class="text-muted">${event.registered}/${event.capacity} registered</small>
                                ${isFull ? '<span class="badge bg-danger ms-2">Full</span>' : ''}
                            </div>
                        </div>
                        
                        <div class="event-tags mb-3">
                            ${event.tags.slice(0, 3).map(tag => `<span class="badge bg-light text-dark me-1">#${tag}</span>`).join('')}
                        </div>
                        
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="event-price">
                                <span class="fw-bold ${event.fee === 0 ? 'text-success' : 'text-primary'}">
                                    ${event.fee === 0 ? 'Free' : '₹' + event.fee}
                                </span>
                            </div>
                            <div class="event-actions">
                                <button class="btn btn-outline-primary btn-sm me-2" onclick="openEvent(${event.id})">
                                    <i class="fas fa-eye"></i>
                                </button>
                                ${registrationOpen && !isFull ?
                `<button class="btn btn-primary btn-sm" onclick="registerForEvent(${event.id})">
                                        <i class="fas fa-user-plus me-1"></i>Register
                                    </button>` :
                `<button class="btn btn-secondary btn-sm" disabled>
                                        ${!isUpcoming ? 'Past Event' : 'Registration Closed'}
                                    </button>`
            }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    container.html(html);

    // Show/hide load more button
    if (filteredEvents.length > displayCount) {
        $('#loadMoreBtn').show();
    } else {
        $('#loadMoreBtn').hide();
    }
}

// Load more events
function loadMoreEvents() {
    displayCount += 6;
    displayEvents();
}

// Update event counts
function updateEventCounts() {
    const now = new Date().toISOString().split('T')[0];
    const upcomingCount = events.filter(event => event.date >= now).length;
    const pastCount = events.filter(event => event.date < now).length;

    $('#upcomingCount').text(upcomingCount);
    $('#pastCount').text(pastCount);
}

// Open event details
function openEvent(eventId) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    currentEvent = event;

    $('#eventModalTitle').text(event.title);

    const isUpcoming = event.date >= new Date().toISOString().split('T')[0];
    const registrationOpen = isUpcoming && new Date(event.registrationDeadline) >= new Date();
    const isFull = event.registered >= event.capacity;

    const modalContent = `
        <div class="event-header mb-4">
            <img src="${event.image}" alt="${event.title}" class="img-fluid rounded mb-3">
            <div class="row">
                <div class="col-md-8">
                    <h6 class="mb-2">
                        <span class="badge bg-primary me-2">${event.category.charAt(0).toUpperCase() + event.category.slice(1)}</span>
                        ${event.featured ? '<span class="badge bg-warning"><i class="fas fa-star me-1"></i>Featured</span>' : ''}
                    </h6>
                    <p class="text-muted mb-3">${event.description}</p>
                </div>
                <div class="col-md-4">
                    <div class="event-quick-info p-3 bg-light rounded">
                        <div class="mb-2">
                            <i class="fas fa-calendar text-primary me-2"></i>
                            <strong>${formatDate(event.date)}</strong>
                        </div>
                        <div class="mb-2">
                            <i class="fas fa-clock text-primary me-2"></i>
                            <strong>${formatTime(event.time)}</strong>
                        </div>
                        <div class="mb-2">
                            <i class="fas fa-map-marker-alt text-primary me-2"></i>
                            ${event.venue}
                        </div>
                        <div class="mb-2">
                            <i class="fas fa-user text-primary me-2"></i>
                            ${event.organizer}
                        </div>
                        <div class="mb-2">
                            <i class="fas fa-users text-primary me-2"></i>
                            ${event.registered}/${event.capacity} registered
                        </div>
                        <div class="mb-2">
                            <i class="fas fa-rupee-sign text-primary me-2"></i>
                            <strong class="${event.fee === 0 ? 'text-success' : 'text-primary'}">
                                ${event.fee === 0 ? 'Free Event' : '₹' + event.fee}
                            </strong>
                        </div>
                        ${event.registrationDeadline ?
            `<div class="mb-2">
                                <i class="fas fa-hourglass-end text-primary me-2"></i>
                                Registration deadline: ${formatDate(event.registrationDeadline)}
                            </div>` : ''
        }
                    </div>
                </div>
            </div>
        </div>
        
        <div class="event-details">
            <h6>Event Tags</h6>
            <div class="mb-3">
                ${event.tags.map(tag => `<span class="badge bg-light text-dark me-1">#${tag}</span>`).join('')}
            </div>
            
            <h6>Registration Status</h6>
            <div class="mb-3">
                ${registrationOpen && !isFull ?
            '<span class="badge bg-success">Registration Open</span>' :
            isFull ? '<span class="badge bg-danger">Event Full</span>' :
                !isUpcoming ? '<span class="badge bg-secondary">Past Event</span>' :
                    '<span class="badge bg-warning">Registration Closed</span>'
        }
            </div>
        </div>
    `;

    $('#eventModalContent').html(modalContent);

    // Update register button
    if (registrationOpen && !isFull) {
        $('#registerBtn').show().text('Register Now');
    } else {
        $('#registerBtn').hide();
    }

    $('#eventModal').modal('show');
}

// Register for event
function registerForEvent(eventId = null) {
    if (!checkAuth()) {
        showLoginModal();
        return;
    }

    const event = eventId ? events.find(e => e.id === eventId) : currentEvent;
    if (!event) return;

    if (event.registered >= event.capacity) {
        showToast('Sorry, this event is full!', 'error');
        return;
    }

    // Simulate registration
    event.registered++;

    showToast('Successfully registered for the event!', 'success');

    // Update display
    filterAndDisplayEvents();

    // Update modal if open
    if (currentEvent && currentEvent.id === event.id) {
        openEvent(event.id);
    }
}

// Create event
function createEvent() {
    if (!checkAuth()) {
        showLoginModal();
        return;
    }

    const user = getCurrentUser();
    if (user.type === 'student') {
        showToast('Only faculty, colleges, and companies can create events.', 'warning');
        return;
    }

    // Clear form and show modal
    $('#createEventForm')[0].reset();
    $('#eventOrganizer').val(user.name);
    $('#createEventModal').modal('show');
}

// Save event
function saveEvent() {
    const form = $('#createEventForm')[0];
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const user = getCurrentUser();
    if (!user) return;

    const newEvent = {
        id: events.length + 1,
        title: $('#eventTitle').val(),
        description: $('#eventDescription').val(),
        category: $('#eventCategory').val(),
        date: $('#eventDate').val(),
        time: $('#eventTime').val(),
        venue: $('#eventVenue').val(),
        organizer: $('#eventOrganizer').val(),
        capacity: parseInt($('#eventCapacity').val()) || 100,
        registered: 0,
        fee: parseInt($('#eventFee').val()) || 0,
        image: $('#eventImage').val() || 'https://via.placeholder.com/400x200/6c757d/white?text=Event',
        tags: $('#eventTags').val().split(',').map(tag => tag.trim()).filter(tag => tag),
        registrationDeadline: $('#registrationDeadline').val() || $('#eventDate').val(),
        organizedBy: user.type === 'faculty' ? 'Faculty' : user.type === 'college' ? 'College' : 'Company',
        status: 'upcoming',
        featured: false
    };

    events.unshift(newEvent);

    $('#createEventModal').modal('hide');
    showToast('Event created successfully!', 'success');

    // Refresh display
    updateEventCounts();
    filterAndDisplayEvents();
}

// Share event
function shareEvent() {
    if (!currentEvent) return;

    if (navigator.share) {
        navigator.share({
            title: currentEvent.title,
            text: currentEvent.description,
            url: window.location.href
        });
    } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(`${currentEvent.title}\n${currentEvent.description}\n${window.location.href}`);
        showToast('Event details copied to clipboard!', 'success');
    }
}

// Add to calendar
function addToCalendar() {
    if (!currentEvent) return;

    const startDate = new Date(`${currentEvent.date}T${currentEvent.time}`);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Assume 2 hours duration

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(currentEvent.title)}&dates=${startDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}&details=${encodeURIComponent(currentEvent.description)}&location=${encodeURIComponent(currentEvent.venue)}`;

    window.open(googleCalendarUrl, '_blank');
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format time
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
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