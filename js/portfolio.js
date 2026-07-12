document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');

    if (!userId) {
        showError('No student ID provided in the URL.');
        return;
    }

    try {
        const data = await window.api.getPortfolio(userId);
        renderPortfolio(data);
    } catch (error) {
        showError(error.message || 'Failed to load portfolio.');
    }
});

function showError(message) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('portfolioContent').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
    document.getElementById('errorText').textContent = message;
}

function renderPortfolio(data) {
    const { profile, items } = data;
    
    // Header
    document.getElementById('portName').textContent = profile.name || 'Student';
    document.getElementById('portHeadline').textContent = profile.headline || 'Student at Orbit';
    document.getElementById('portCollege').textContent = profile.college || 'Not specified';
    document.getElementById('portCourse').textContent = `${profile.course || ''} ${profile.year ? `(${profile.year})` : ''}`;
    document.getElementById('portCgpa').textContent = profile.cgpa || 'N/A';
    document.getElementById('portImage').src = profile.profileImage;
    document.getElementById('portBio').textContent = profile.bio || 'No bio provided.';
    
    // Social Links
    const socialsDiv = document.getElementById('portSocials');
    socialsDiv.innerHTML = '';
    if (profile.socialMedia) {
        if (profile.socialMedia.linkedin) {
            socialsDiv.innerHTML += `<a href="${profile.socialMedia.linkedin}" target="_blank" class="btn btn-outline-light me-2"><i class="fab fa-linkedin me-2"></i>LinkedIn</a>`;
        }
        if (profile.socialMedia.github) {
            socialsDiv.innerHTML += `<a href="${profile.socialMedia.github}" target="_blank" class="btn btn-outline-light me-2"><i class="fab fa-github me-2"></i>GitHub</a>`;
        }
        if (profile.socialMedia.portfolio) {
            socialsDiv.innerHTML += `<a href="${profile.socialMedia.portfolio}" target="_blank" class="btn btn-outline-light"><i class="fas fa-globe me-2"></i>Website</a>`;
        }
    }
    
    // Skills
    const skillsDiv = document.getElementById('portSkills');
    skillsDiv.innerHTML = '';
    if (profile.skills && profile.skills.length > 0) {
        profile.skills.forEach(skill => {
            const span = document.createElement('span');
            span.className = 'skill-tag text-light';
            span.textContent = skill;
            skillsDiv.appendChild(span);
        });
    } else {
        skillsDiv.innerHTML = '<p class="text-light opacity-75">No skills listed.</p>';
    }

    // Achievements
    const achDiv = document.getElementById('portAchievements');
    achDiv.innerHTML = '';
    
    if (items && items.length > 0) {
        items.forEach(item => {
            const dateStr = item.date ? new Date(item.date).toLocaleDateString() : 'Unknown Date';
            
            // Icon based on category
            let iconClass = 'fa-star text-primary';
            if (item.category === 'hackathon') iconClass = 'fa-laptop-code text-warning';
            else if (item.category === 'certification') iconClass = 'fa-certificate text-success';
            else if (item.category === 'internship') iconClass = 'fa-briefcase text-info';
            else if (item.category === 'publication') iconClass = 'fa-book text-danger';

            achDiv.innerHTML += `
                <div class="timeline-item text-light">
                    <h5 class="mb-1">${item.title} <span class="badge bg-secondary ms-2 text-capitalize">${item.category}</span></h5>
                    <p class="text-muted small mb-2"><i class="far fa-calendar-alt me-1"></i>${dateStr}</p>
                    <p class="opacity-75">${item.description}</p>
                </div>
            `;
        });
    } else {
        achDiv.innerHTML = '<p class="text-light opacity-75">No verified achievements to show yet.</p>';
    }

    // Show content
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('portfolioContent').style.display = 'block';
}
