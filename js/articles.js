// Articles Page JavaScript
let articles = [];
let filteredArticles = [];
let currentPage = 1;
const articlesPerPage = 6;
let currentArticle = null;

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

    // Load articles data
    loadArticles();

    // Display articles
    displayArticles();

    // Load sidebar content
    loadFeaturedArticles();
    loadPopularCategories();
    loadTopAuthors();
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

// Load articles data
function loadArticles() {
    // Dummy articles data
    articles = [
        {
            id: 1,
            title: "The Future of Artificial Intelligence in Education",
            author: "Dr. Priya Patel",
            authorType: "faculty",
            authorAvatar: "https://via.placeholder.com/50/28a745/white?text=PP",
            category: "technology",
            tags: ["AI", "Education", "Technology"],
            summary: "Exploring how AI is revolutionizing the educational landscape and preparing students for the future.",
            content: "Artificial Intelligence is transforming every aspect of our lives, and education is no exception. In this comprehensive article, we explore how AI technologies are being integrated into educational systems worldwide...",
            image: "https://via.placeholder.com/400x200/007bff/white?text=AI+Education",
            publishDate: "2024-01-15",
            readTime: "5 min read",
            likes: 45,
            views: 1250,
            featured: true,
            trending: true
        },
        {
            id: 2,
            title: "Career Opportunities in Data Science",
            author: "Rahul Kumar",
            authorType: "industry",
            authorAvatar: "https://via.placeholder.com/50/dc3545/white?text=RK",
            category: "career",
            tags: ["Data Science", "Career", "Technology"],
            summary: "A comprehensive guide to building a successful career in data science.",
            content: "Data Science has emerged as one of the most promising career paths in the 21st century. This article provides insights into the skills required, career prospects, and growth opportunities...",
            image: "https://via.placeholder.com/400x200/28a745/white?text=Data+Science",
            publishDate: "2024-01-12",
            readTime: "7 min read",
            likes: 32,
            views: 890,
            featured: false,
            trending: true
        },
        {
            id: 3,
            title: "Research Methodologies in Computer Science",
            author: "Dr. Anita Sharma",
            authorType: "faculty",
            authorAvatar: "https://via.placeholder.com/50/6f42c1/white?text=AS",
            category: "research",
            tags: ["Research", "Computer Science", "Methodology"],
            summary: "Understanding different research approaches and methodologies in computer science.",
            content: "Research in computer science requires a systematic approach and understanding of various methodologies. This article discusses quantitative and qualitative research methods...",
            image: "https://via.placeholder.com/400x200/6f42c1/white?text=Research",
            publishDate: "2024-01-10",
            readTime: "8 min read",
            likes: 28,
            views: 650,
            featured: true,
            trending: false
        },
        {
            id: 4,
            title: "Industry 4.0 and IoT Integration",
            author: "Vikram Singh",
            authorType: "industry",
            authorAvatar: "https://via.placeholder.com/50/fd7e14/white?text=VS",
            category: "industry",
            tags: ["Industry 4.0", "IoT", "Technology"],
            summary: "How Industry 4.0 is leveraging IoT technologies for smart manufacturing.",
            content: "The fourth industrial revolution is characterized by the integration of digital technologies into manufacturing processes. This article explores the role of IoT...",
            image: "https://via.placeholder.com/400x200/fd7e14/white?text=Industry+4.0",
            publishDate: "2024-01-08",
            readTime: "6 min read",
            likes: 41,
            views: 1100,
            featured: false,
            trending: true
        },
        {
            id: 5,
            title: "Academic Excellence: Study Strategies for Success",
            author: "Dr. Sneha Gupta",
            authorType: "faculty",
            authorAvatar: "https://via.placeholder.com/50/e83e8c/white?text=SG",
            category: "academic",
            tags: ["Study Tips", "Academic", "Success"],
            summary: "Proven strategies and techniques for achieving academic excellence.",
            content: "Academic success requires more than just hard work; it requires smart strategies and effective study techniques. This article shares proven methods...",
            image: "https://via.placeholder.com/400x200/e83e8c/white?text=Study+Success",
            publishDate: "2024-01-05",
            readTime: "4 min read",
            likes: 56,
            views: 1450,
            featured: true,
            trending: false
        },
        {
            id: 6,
            title: "Building a Professional Network as a Student",
            author: "Arjun Sharma",
            authorType: "student",
            authorAvatar: "https://via.placeholder.com/50/007bff/white?text=AS",
            category: "career",
            tags: ["Networking", "Student Life", "Professional Development"],
            summary: "Essential tips for students to build meaningful professional connections.",
            content: "Networking is crucial for career development, and students can start building their professional network early. This article provides practical tips...",
            image: "https://via.placeholder.com/400x200/007bff/white?text=Networking",
            publishDate: "2024-01-03",
            readTime: "5 min read",
            likes: 23,
            views: 720,
            featured: false,
            trending: false
        },
        {
            id: 7,
            title: "Machine Learning Applications in Healthcare",
            author: "Dr. Rajesh Patel",
            authorType: "faculty",
            authorAvatar: "https://via.placeholder.com/50/20c997/white?text=RP",
            category: "technology",
            tags: ["Machine Learning", "Healthcare", "AI"],
            summary: "Exploring the transformative impact of ML in healthcare systems.",
            content: "Machine Learning is revolutionizing healthcare by enabling predictive analytics, personalized treatment, and improved patient outcomes...",
            image: "https://via.placeholder.com/400x200/20c997/white?text=ML+Healthcare",
            publishDate: "2024-01-01",
            readTime: "9 min read",
            likes: 67,
            views: 1800,
            featured: false,
            trending: true
        },
        {
            id: 8,
            title: "Sustainable Technology: Green Computing Practices",
            author: "Meera Krishnan",
            authorType: "industry",
            authorAvatar: "https://via.placeholder.com/50/198754/white?text=MK",
            category: "technology",
            tags: ["Green Computing", "Sustainability", "Environment"],
            summary: "How technology companies are adopting sustainable practices.",
            content: "As environmental concerns grow, the tech industry is adopting green computing practices to reduce carbon footprint and promote sustainability...",
            image: "https://via.placeholder.com/400x200/198754/white?text=Green+Tech",
            publishDate: "2023-12-28",
            readTime: "6 min read",
            likes: 34,
            views: 920,
            featured: false,
            trending: false
        }
    ];

    filteredArticles = [...articles];
}

// Display articles
function displayArticles() {
    const container = $('#articlesContainer');
    const startIndex = (currentPage - 1) * articlesPerPage;
    const endIndex = startIndex + articlesPerPage;
    const articlesToShow = filteredArticles.slice(startIndex, endIndex);

    let html = '';

    if (articlesToShow.length === 0) {
        html = `
            <div class="text-center py-5">
                <i class="fas fa-search text-muted mb-3" style="font-size: 3rem;"></i>
                <h4 class="text-muted">No articles found</h4>
                <p class="text-muted">Try adjusting your search criteria or filters.</p>
            </div>
        `;
    } else {
        articlesToShow.forEach((article, index) => {
            const badgeClass = {
                'technology': 'bg-primary',
                'career': 'bg-success',
                'research': 'bg-purple',
                'industry': 'bg-warning',
                'academic': 'bg-info'
            };

            const authorTypeIcon = {
                'faculty': 'fas fa-chalkboard-teacher',
                'industry': 'fas fa-building',
                'student': 'fas fa-user-graduate'
            };

            html += `
                <article class="article-card mb-4" data-aos="fade-up" data-aos-delay="${index * 100}">
                    <div class="row g-0">
                        <div class="col-md-4">
                            <div class="article-image">
                                <img src="${article.image}" alt="${article.title}" class="img-fluid h-100 w-100" style="object-fit: cover;">
                                ${article.featured ? '<div class="featured-badge"><i class="fas fa-star"></i> Featured</div>' : ''}
                                ${article.trending ? '<div class="trending-badge"><i class="fas fa-fire"></i> Trending</div>' : ''}
                            </div>
                        </div>
                        <div class="col-md-8">
                            <div class="article-content p-4">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <span class="badge ${badgeClass[article.category] || 'bg-secondary'}">${article.category.charAt(0).toUpperCase() + article.category.slice(1)}</span>
                                    <small class="text-muted">${formatDate(article.publishDate)}</small>
                                </div>
                                <h4 class="article-title mb-3">
                                    <a href="#" onclick="openArticle(${article.id})" class="text-decoration-none">
                                        ${article.title}
                                    </a>
                                </h4>
                                <p class="article-summary text-muted mb-3">${article.summary}</p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <div class="author-info d-flex align-items-center">
                                        <img src="${article.authorAvatar}" alt="${article.author}" class="rounded-circle me-2" style="width: 32px; height: 32px;">
                                        <div>
                                            <small class="fw-medium">${article.author}</small>
                                            <div class="text-muted" style="font-size: 0.75rem;">
                                                <i class="${authorTypeIcon[article.authorType]} me-1"></i>
                                                ${article.authorType.charAt(0).toUpperCase() + article.authorType.slice(1)}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="article-meta text-muted">
                                        <small class="me-3">
                                            <i class="fas fa-clock me-1"></i>${article.readTime}
                                        </small>
                                        <small class="me-3">
                                            <i class="fas fa-eye me-1"></i>${article.views}
                                        </small>
                                        <small>
                                            <i class="fas fa-thumbs-up me-1"></i>${article.likes}
                                        </small>
                                    </div>
                                </div>
                                <div class="article-tags mt-3">
                                    ${article.tags.map(tag => `<span class="badge bg-light text-dark me-1">#${tag}</span>`).join('')}
                                </div>
                            </div>
                        </div>
                    </div>
                </article>
            `;
        });
    }

    container.html(html);

    // Update pagination
    updatePagination();
}

// Update pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);
    const pagination = $('#articlesPagination');

    let html = '';

    if (totalPages > 1) {
        // Previous button
        html += `
            <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a>
            </li>
        `;

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage || i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
                html += `
                    <li class="page-item ${i === currentPage ? 'active' : ''}">
                        <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                    </li>
                `;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
            }
        }

        // Next button
        html += `
            <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>
            </li>
        `;
    }

    pagination.html(html);
}

// Change page
function changePage(page) {
    const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        displayArticles();
        $('html, body').animate({ scrollTop: 0 }, 300);
    }
}

// Search articles
function searchArticles() {
    const query = $('#articleSearch').val().toLowerCase();

    filteredArticles = articles.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.author.toLowerCase().includes(query) ||
        article.summary.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query))
    );

    currentPage = 1;
    displayArticles();
}

// Filter articles
function filterArticles() {
    const category = $('#categoryFilter').val();
    const authorType = $('#authorTypeFilter').val();

    filteredArticles = articles.filter(article => {
        return (category === '' || article.category === category) &&
            (authorType === '' || article.authorType === authorType);
    });

    currentPage = 1;
    displayArticles();
}

// Sort articles
function sortArticles() {
    const sortBy = $('#sortFilter').val();

    switch (sortBy) {
        case 'latest':
            filteredArticles.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
            break;
        case 'oldest':
            filteredArticles.sort((a, b) => new Date(a.publishDate) - new Date(b.publishDate));
            break;
        case 'popular':
            filteredArticles.sort((a, b) => b.likes - a.likes);
            break;
        case 'trending':
            filteredArticles.sort((a, b) => {
                if (a.trending && !b.trending) return -1;
                if (!a.trending && b.trending) return 1;
                return b.views - a.views;
            });
            break;
    }

    currentPage = 1;
    displayArticles();
}

// Open article in modal
function openArticle(articleId) {
    const article = articles.find(a => a.id === articleId);
    if (!article) return;

    currentArticle = article;

    $('#articleModalTitle').text(article.title);

    const modalContent = `
        <div class="article-header mb-4">
            <img src="${article.image}" alt="${article.title}" class="img-fluid rounded mb-3">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="author-info d-flex align-items-center">
                    <img src="${article.authorAvatar}" alt="${article.author}" class="rounded-circle me-3" style="width: 48px; height: 48px;">
                    <div>
                        <h6 class="mb-1">${article.author}</h6>
                        <small class="text-muted">${formatDate(article.publishDate)} • ${article.readTime}</small>
                    </div>
                </div>
                <div class="article-stats">
                    <span class="badge bg-primary me-2">${article.category.charAt(0).toUpperCase() + article.category.slice(1)}</span>
                    <small class="text-muted me-2"><i class="fas fa-eye me-1"></i>${article.views}</small>
                </div>
            </div>
            <div class="article-tags mb-3">
                ${article.tags.map(tag => `<span class="badge bg-light text-dark me-1">#${tag}</span>`).join('')}
            </div>
        </div>
        <div class="article-body">
            <p class="lead">${article.summary}</p>
            <div class="article-content">
                ${article.content.split('\n').map(paragraph => `<p>${paragraph}</p>`).join('')}
            </div>
        </div>
    `;

    $('#articleModalContent').html(modalContent);
    $('#likeCount').text(article.likes);

    $('#articleModal').modal('show');

    // Increment view count
    article.views++;
}

// Load featured articles
function loadFeaturedArticles() {
    const featured = articles.filter(article => article.featured).slice(0, 3);
    const container = $('#featuredArticles');

    let html = '';
    featured.forEach(article => {
        html += `
            <div class="featured-article mb-3 pb-3 border-bottom">
                <h6 class="mb-2">
                    <a href="#" onclick="openArticle(${article.id})" class="text-decoration-none">
                        ${article.title}
                    </a>
                </h6>
                <div class="d-flex align-items-center">
                    <img src="${article.authorAvatar}" alt="${article.author}" class="rounded-circle me-2" style="width: 24px; height: 24px;">
                    <small class="text-muted">${article.author}</small>
                </div>
                <small class="text-muted">${formatDate(article.publishDate)} • ${article.readTime}</small>
            </div>
        `;
    });

    container.html(html);
}

// Load popular categories
function loadPopularCategories() {
    const categories = {};
    articles.forEach(article => {
        categories[article.category] = (categories[article.category] || 0) + 1;
    });

    const sortedCategories = Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const container = $('#popularCategories');
    let html = '';

    sortedCategories.forEach(([category, count]) => {
        html += `
            <button class="btn btn-outline-primary btn-sm me-2 mb-2" onclick="filterByCategory('${category}')">
                ${category.charAt(0).toUpperCase() + category.slice(1)} (${count})
            </button>
        `;
    });

    container.html(html);
}

// Load top authors
function loadTopAuthors() {
    const authors = {};
    articles.forEach(article => {
        if (!authors[article.author]) {
            authors[article.author] = {
                name: article.author,
                avatar: article.authorAvatar,
                type: article.authorType,
                articles: 0,
                totalLikes: 0
            };
        }
        authors[article.author].articles++;
        authors[article.author].totalLikes += article.likes;
    });

    const sortedAuthors = Object.values(authors)
        .sort((a, b) => b.totalLikes - a.totalLikes)
        .slice(0, 5);

    const container = $('#topAuthors');
    let html = '';

    sortedAuthors.forEach(author => {
        const typeIcon = {
            'faculty': 'fas fa-chalkboard-teacher',
            'industry': 'fas fa-building',
            'student': 'fas fa-user-graduate'
        };

        html += `
            <div class="top-author mb-3 d-flex align-items-center">
                <img src="${author.avatar}" alt="${author.name}" class="rounded-circle me-3" style="width: 40px; height: 40px;">
                <div>
                    <h6 class="mb-0">${author.name}</h6>
                    <small class="text-muted">
                        <i class="${typeIcon[author.type]} me-1"></i>
                        ${author.articles} articles • ${author.totalLikes} likes
                    </small>
                </div>
            </div>
        `;
    });

    container.html(html);
}

// Filter by category
function filterByCategory(category) {
    $('#categoryFilter').val(category);
    filterArticles();
}

// Write article
function writeArticle() {
    if (!checkAuth()) {
        showLoginModal();
        return;
    }

    // Clear form
    $('#writeArticleForm')[0].reset();
    $('#writeArticleModal').modal('show');
}

// Save article
function saveArticle() {
    const form = $('#writeArticleForm')[0];
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const user = getCurrentUser();
    if (!user) return;

    const newArticle = {
        id: articles.length + 1,
        title: $('#articleTitle').val(),
        author: user.name,
        authorType: user.type,
        authorAvatar: user.avatar || 'https://via.placeholder.com/50/007bff/white?text=U',
        category: $('#articleCategory').val(),
        tags: $('#articleTags').val().split(',').map(tag => tag.trim()).filter(tag => tag),
        summary: $('#articleSummary').val(),
        content: $('#articleContent').val(),
        image: $('#articleImage').val() || 'https://via.placeholder.com/400x200/6c757d/white?text=Article',
        publishDate: new Date().toISOString().split('T')[0],
        readTime: Math.ceil($('#articleContent').val().split(' ').length / 200) + ' min read',
        likes: 0,
        views: 0,
        featured: false,
        trending: false
    };

    articles.unshift(newArticle);
    filteredArticles = [...articles];

    $('#writeArticleModal').modal('hide');
    showToast('Article published successfully!', 'success');

    // Refresh display
    currentPage = 1;
    displayArticles();
    loadPopularCategories();
    loadTopAuthors();
}

// Like article
function likeArticle() {
    if (!currentArticle) return;

    currentArticle.likes++;
    $('#likeCount').text(currentArticle.likes);

    // Update display
    displayArticles();
    loadTopAuthors();
}

// Share article
function shareArticle() {
    if (!currentArticle) return;

    if (navigator.share) {
        navigator.share({
            title: currentArticle.title,
            text: currentArticle.summary,
            url: window.location.href
        });
    } else {
        // Fallback - copy to clipboard
        navigator.clipboard.writeText(window.location.href);
        showToast('Article link copied to clipboard!', 'success');
    }
}

// Format date
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

// Search on Enter key
$('#articleSearch').on('keypress', function (e) {
    if (e.which === 13) {
        searchArticles();
    }
});