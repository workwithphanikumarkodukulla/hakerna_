// Simplified Working Resume Generator
let currentTemplate = 'modern';
let currentStudentData = {
    personalInfo: {
        name: "Arjun Sharma",
        email: "arjun.sharma@iiitg.ac.in",
        phone: "+91 9876543210",
        address: "Guwahati, Assam, India",
        linkedin: "linkedin.com/in/arjunsharma",
        github: "github.com/arjunsharma",
        profileImage: "https://ui-avatars.com/api/?name=Arjun+Sharma&background=1f4e79&color=fff&size=150&bold=true"
    },
    objective: "Passionate Computer Science student with strong foundation in software development, data structures, and algorithms. Seeking opportunities to contribute to innovative projects while expanding technical expertise in full-stack development and emerging technologies.",
    education: [{
        degree: "Bachelor of Technology in Computer Science & Engineering",
        institution: "Indian Institute of Information Technology Guwahati",
        location: "Guwahati, Assam",
        duration: "2021 - 2025",
        cgpa: "8.7/10"
    }],
    skills: {
        programming: ["Python", "Java", "JavaScript", "C++", "TypeScript"],
        web: ["React.js", "Node.js", "Express.js", "HTML5", "CSS3", "Bootstrap"],
        database: ["MongoDB", "PostgreSQL", "MySQL", "Redis"],
        tools: ["Git", "Docker", "AWS", "VS Code", "Postman"]
    },
    projects: [{
        title: "Smart Student Hub",
        description: "Comprehensive digital platform for student record management with role-based dashboards.",
        technologies: ["React.js", "Node.js", "MongoDB", "Express.js"],
        duration: "Aug 2024 - Present",
        highlights: [
            "Developed responsive dashboards with government-compliant UI design",
            "Implemented JWT-based authentication and authorization"
        ]
    }],
    internships: [{
        company: "TechCorp Solutions Pvt. Ltd.",
        position: "Software Development Intern",
        location: "Bangalore, Karnataka",
        duration: "May 2024 - Jul 2024",
        description: "Worked on developing microservices architecture for e-commerce platform.",
        achievements: [
            "Optimized database queries resulting in 35% performance improvement",
            "Developed RESTful APIs using Spring Boot"
        ]
    }],
    achievements: [{
        title: "Winner - Smart India Hackathon 2024",
        description: "Led team of 6 to develop innovative solution for digital student record management",
        date: "2024-09-15",
        category: "Hackathon"
    }],
    certificates: [{
        title: "AWS Certified Cloud Practitioner",
        issuer: "Amazon Web Services",
        date: "2024-08-15",
        credentialId: "AWS-CCP-2024-AS789"
    }]
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    generateResume();
});

// Main function to generate and display resume
function generateResume() {
    const resumePreview = document.getElementById('resumePreview');
    if (!resumePreview) {
        console.error('Resume preview element not found');
        return;
    }

    let html = '';

    switch (currentTemplate) {
        case 'modern':
            html = generateModernTemplate();
            break;
        case 'classic':
            html = generateClassicTemplate();
            break;
        case 'creative':
            html = generateCreativeTemplate();
            break;
        default:
            html = generateModernTemplate();
    }

    resumePreview.innerHTML = html;
}

// Generate Modern Template
function generateModernTemplate() {
    const data = currentStudentData;
    const personalInfo = data.personalInfo;

    let html = `
        <div style="background: linear-gradient(135deg, #1f4e79 0%, #2d5016 100%); color: white; padding: 40px 30px;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 300px;">
                    <h1 style="font-size: 36px; font-weight: 700; margin: 0 0 10px 0;">${personalInfo.name}</h1>
                    <p style="font-size: 18px; margin: 0 0 15px 0; opacity: 0.9;">${data.education[0].degree}</p>
                    <p style="font-size: 16px; margin: 0; opacity: 0.8;">${data.education[0].institution}</p>
                </div>
                <div style="margin-left: 20px;">
                    <img src="${personalInfo.profileImage}" alt="${personalInfo.name}" 
                         style="width: 120px; height: 120px; border-radius: 50%; border: 4px solid rgba(255,255,255,0.3); object-fit: cover;">
                </div>
            </div>
            <div style="margin-top: 25px; display: flex; flex-wrap: wrap; gap: 20px;">
                <div style="display: flex; align-items: center;">
                    <i class="fas fa-envelope" style="margin-right: 8px; color: #ffd700;"></i>
                    <span style="font-size: 14px;">${personalInfo.email}</span>
                </div>
                <div style="display: flex; align-items: center;">
                    <i class="fas fa-phone" style="margin-right: 8px; color: #ffd700;"></i>
                    <span style="font-size: 14px;">${personalInfo.phone}</span>
                </div>
                <div style="display: flex; align-items: center;">
                    <i class="fab fa-linkedin" style="margin-right: 8px; color: #ffd700;"></i>
                    <span style="font-size: 14px;">${personalInfo.linkedin}</span>
                </div>
            </div>
        </div>
    `;

    // Objective Section
    if (isChecked('includeObjective')) {
        html += `
            <div style="padding: 30px; border-left: 4px solid #1f4e79; background: #f8fafc;">
                <h3 style="color: #1f4e79; font-size: 20px; font-weight: 600; margin: 0 0 15px 0;">
                    <i class="fas fa-bullseye" style="margin-right: 10px; color: #2d5016;"></i>
                    Professional Objective
                </h3>
                <p style="margin: 0; line-height: 1.6; color: #4a5568; font-size: 15px;">${data.objective}</p>
            </div>
        `;
    }

    // Education Section
    if (isChecked('includeEducation')) {
        html += `
            <div style="padding: 30px; border-bottom: 1px solid #e2e8f0;">
                <h3 style="color: #1f4e79; font-size: 20px; font-weight: 600; margin: 0 0 20px 0;">
                    <i class="fas fa-graduation-cap" style="margin-right: 10px; color: #2d5016;"></i>
                    Education
                </h3>
        `;

        data.education.forEach(edu => {
            html += `
                <div style="margin-bottom: 20px; padding: 20px; background: #f7fafc; border-radius: 8px; border-left: 3px solid #2d5016;">
                    <h5 style="font-size: 16px; font-weight: 600; margin: 0 0 8px 0; color: #2d4a22;">${edu.degree}</h5>
                    <div style="color: #666; font-size: 14px; margin-bottom: 8px; font-weight: 500;">
                        <i class="fas fa-university" style="margin-right: 8px; color: #1f4e79;"></i>
                        ${edu.institution}${edu.location ? ', ' + edu.location : ''}
                    </div>
                    <div style="color: #666; font-size: 14px; margin-bottom: 8px;">
                        <i class="fas fa-calendar" style="margin-right: 8px; color: #1f4e79;"></i>
                        ${edu.duration}
                    </div>
                    ${edu.cgpa ? `
                    <div style="color: #666; font-size: 14px;">
                        <i class="fas fa-star" style="margin-right: 8px; color: #1f4e79;"></i>
                        CGPA: <strong>${edu.cgpa}</strong>
                    </div>
                    ` : ''}
                </div>
            `;
        });

        html += '</div>';
    }

    // Skills Section
    if (isChecked('includeSkills')) {
        html += `
            <div style="padding: 30px; border-bottom: 1px solid #e2e8f0;">
                <h3 style="color: #1f4e79; font-size: 20px; font-weight: 600; margin: 0 0 20px 0;">
                    <i class="fas fa-code" style="margin-right: 10px; color: #2d5016;"></i>
                    Technical Skills
                </h3>
                <div style="display: grid; gap: 15px;">
        `;

        Object.entries(data.skills).forEach(([category, skills]) => {
            html += `
                <div style="background: #f7fafc; padding: 15px; border-radius: 8px; border-left: 3px solid #1f4e79;">
                    <h6 style="font-size: 14px; font-weight: 600; color: #2d4a22; margin: 0 0 10px 0; text-transform: capitalize;">${category}</h6>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            `;
            skills.forEach(skill => {
                html += `<span style="background: #1f4e79; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 500;">${skill}</span>`;
            });
            html += '</div></div>';
        });

        html += '</div></div>';
    }

    // Projects Section
    if (isChecked('includeProjects') && data.projects && data.projects.length > 0) {
        html += `
            <div style="padding: 30px; border-bottom: 1px solid #e2e8f0;">
                <h3 style="color: #1f4e79; font-size: 20px; font-weight: 600; margin: 0 0 20px 0;">
                    <i class="fas fa-project-diagram" style="margin-right: 10px; color: #2d5016;"></i>
                    Projects
                </h3>
        `;

        data.projects.slice(0, 3).forEach(project => {
            html += `
                <div style="margin-bottom: 25px; padding: 20px; background: #f7fafc; border-radius: 8px; border-left: 3px solid #2d5016;">
                    <h5 style="font-size: 16px; font-weight: 600; margin: 0 0 10px 0; color: #2d4a22;">${project.title}</h5>
                    <div style="color: #666; font-size: 13px; margin-bottom: 10px;">
                        <i class="fas fa-tools" style="margin-right: 8px; color: #1f4e79;"></i>
                        <strong>Technologies:</strong> ${project.technologies.join(', ')}
                    </div>
                    <p style="margin: 0 0 10px 0; color: #4a5568; font-size: 14px; line-height: 1.6;">${project.description}</p>
            `;
            if (project.highlights) {
                html += '<ul style="margin: 10px 0 0 20px; color: #4a5568; font-size: 13px;">';
                project.highlights.forEach(highlight => {
                    html += `<li style="margin-bottom: 5px;">${highlight}</li>`;
                });
                html += '</ul>';
            }
            html += '</div>';
        });

        html += '</div>';
    }

    // Experience Section
    if (isChecked('includeInternships') && data.internships && data.internships.length > 0) {
        html += `
            <div style="padding: 30px; border-bottom: 1px solid #e2e8f0;">
                <h3 style="color: #1f4e79; font-size: 20px; font-weight: 600; margin: 0 0 20px 0;">
                    <i class="fas fa-briefcase" style="margin-right: 10px; color: #2d5016;"></i>
                    Experience
                </h3>
        `;

        data.internships.forEach(internship => {
            html += `
                <div style="margin-bottom: 25px; padding: 20px; background: #f7fafc; border-radius: 8px; border-left: 3px solid #2d5016;">
                    <h5 style="font-size: 16px; font-weight: 600; margin: 0 0 8px 0; color: #2d4a22;">${internship.position}</h5>
                    <div style="color: #666; font-size: 14px; margin-bottom: 10px; font-weight: 500;">
                        <i class="fas fa-building" style="margin-right: 8px; color: #1f4e79;"></i>
                        ${internship.company}${internship.location ? ', ' + internship.location : ''}
                    </div>
                    <div style="color: #666; font-size: 13px; margin-bottom: 10px;">${internship.duration}</div>
                    <p style="margin: 0 0 10px 0; color: #4a5568; font-size: 14px; line-height: 1.6;">${internship.description}</p>
            `;
            if (internship.achievements) {
                html += '<ul style="margin: 10px 0 0 20px; color: #4a5568; font-size: 13px;">';
                internship.achievements.forEach(achievement => {
                    html += `<li style="margin-bottom: 5px;">${achievement}</li>`;
                });
                html += '</ul>';
            }
            html += '</div>';
        });

        html += '</div>';
    }

    // Achievements Section
    if (isChecked('includeAchievements') && data.achievements && data.achievements.length > 0) {
        html += `
            <div style="padding: 30px; border-bottom: 1px solid #e2e8f0;">
                <h3 style="color: #1f4e79; font-size: 20px; font-weight: 600; margin: 0 0 20px 0;">
                    <i class="fas fa-trophy" style="margin-right: 10px; color: #2d5016;"></i>
                    Achievements
                </h3>
        `;

        data.achievements.forEach(achievement => {
            html += `
                <div style="padding: 15px; background: #f7fafc; border-radius: 8px; border-left: 3px solid #ffd700; margin-bottom: 15px;">
                    <h5 style="font-size: 15px; font-weight: 600; margin: 0 0 8px 0; color: #2d4a22;">${achievement.title}</h5>
                    <p style="margin: 0 0 8px 0; color: #4a5568; font-size: 14px;">${achievement.description}</p>
                    <span style="background: #ffd700; color: #2d4a22; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 500;">${formatDate(achievement.date)}</span>
                </div>
            `;
        });

        html += '</div>';
    }

    // Certificates Section
    if (isChecked('includeCertificates') && data.certificates && data.certificates.length > 0) {
        html += `
            <div style="padding: 30px;">
                <h3 style="color: #1f4e79; font-size: 20px; font-weight: 600; margin: 0 0 20px 0;">
                    <i class="fas fa-certificate" style="margin-right: 10px; color: #2d5016;"></i>
                    Certifications
                </h3>
        `;

        data.certificates.forEach(cert => {
            html += `
                <div style="padding: 15px; background: #f7fafc; border-radius: 8px; border-left: 3px solid #1f4e79; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap;">
                    <div>
                        <h5 style="font-size: 14px; font-weight: 600; margin: 0 0 5px 0; color: #2d4a22;">${cert.title}</h5>
                        <div style="color: #666; font-size: 13px;">${cert.issuer}${cert.credentialId ? ' • ID: ' + cert.credentialId : ''}</div>
                    </div>
                    <div style="background: #1f4e79; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; margin-top: 8px;">${formatDate(cert.date)}</div>
                </div>
            `;
        });

        html += '</div>';
    }

    return html;
}

// Generate Classic Template (simplified)
function generateClassicTemplate() {
    const data = currentStudentData;
    const personalInfo = data.personalInfo;

    return `
        <div style="text-align: center; padding: 40px 30px; border-bottom: 3px solid #1f4e79; background: #f8fafc;">
            <h1 style="font-size: 28px; margin: 0 0 10px 0; color: #1f4e79; font-weight: 700;">${personalInfo.name.toUpperCase()}</h1>
            <p style="font-size: 16px; margin: 0 0 15px 0; color: #666;">${data.education[0].degree}</p>
            <div style="display: flex; justify-content: center; gap: 15px; flex-wrap: wrap;">
                <span style="color: #666; font-size: 14px;">📧 ${personalInfo.email}</span>
                <span style="color: #666; font-size: 14px;">📱 ${personalInfo.phone}</span>
            </div>
        </div>
        <div style="padding: 30px;">
            <div style="margin-bottom: 30px;">
                <h3 style="color: #1f4e79; border-bottom: 2px solid #2d5016; padding-bottom: 5px; margin-bottom: 15px;">OBJECTIVE</h3>
                <p style="color: #444; line-height: 1.6;">${data.objective}</p>
            </div>
        </div>
    `;
}

// Generate Creative Template (simplified)
function generateCreativeTemplate() {
    const data = currentStudentData;
    const personalInfo = data.personalInfo;

    return `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 50px 30px; text-align: center;">
            <img src="${personalInfo.profileImage}" alt="${personalInfo.name}" 
                 style="width: 100px; height: 100px; border-radius: 50%; border: 3px solid white; margin-bottom: 20px;">
            <h1 style="font-size: 36px; margin: 0 0 10px 0; font-weight: 700;">${personalInfo.name}</h1>
            <p style="font-size: 18px; margin: 0 0 20px 0; opacity: 0.9;">${data.education[0].degree}</p>
            <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
                <span>✉️ ${personalInfo.email}</span>
                <span>📱 ${personalInfo.phone}</span>
            </div>
        </div>
        <div style="padding: 40px 30px; background: #f8fafc;">
            <h3 style="color: #667eea; text-align: center; font-size: 24px; margin-bottom: 20px;">🎯 My Vision</h3>
            <p style="text-align: center; font-style: italic; color: #555; font-size: 16px; line-height: 1.7;">"${data.objective}"</p>
        </div>
    `;
}

// Utility function to check if checkbox is checked
function isChecked(id) {
    const checkbox = document.getElementById(id);
    return checkbox ? checkbox.checked : true; // Default to true if checkbox not found
}

// Format date helper
function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'short' };
        return date.toLocaleDateString('en-US', options);
    } catch (e) {
        return dateString;
    }
}

// Template selection function
function selectTemplate(template) {
    currentTemplate = template;
    // Update UI selection
    document.querySelectorAll('.template-option').forEach(option => {
        option.classList.remove('selected');
    });
    const selectedOption = document.querySelector(`[data-template="${template}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
    }

    generateResume();
}

// Update resume when settings change
function updateResume() {
    generateResume();
}

// Apply custom objective
function applyCustomObjective() {
    const customInput = document.getElementById('customObjective');
    if (customInput && customInput.value.trim()) {
        currentStudentData.objective = customInput.value.trim();
        generateResume();

        // Close modal if it exists
        const modal = document.getElementById('objectiveModal');
        if (modal && window.bootstrap) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
        }

        showToast('Objective updated successfully!');
    }
}

// Use objective template
function useObjectiveTemplate(element) {
    const text = element.textContent.split(': ')[1]?.replace(/"/g, '') || '';
    const customInput = document.getElementById('customObjective');
    if (customInput) {
        customInput.value = text;
    }
}

// Download resume
function downloadResume() {
    const element = document.getElementById('resumePreview');
    if (!element) return;

    const resumeHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${currentStudentData.personalInfo.name} - Resume</title>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
                @media print { body { margin: 0; } }
                * { box-sizing: border-box; }
            </style>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        </head>
        <body>
            ${element.innerHTML}
        </body>
        </html>
    `;

    const blob = new Blob([resumeHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentStudentData.personalInfo.name.replace(/\s+/g, '_')}_Resume.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Resume downloaded successfully!');
}

// Print resume
function printResume() {
    window.print();
}

// Save resume
function saveResume() {
    try {
        const resumeData = {
            template: currentTemplate,
            studentData: currentStudentData,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('savedResume', JSON.stringify(resumeData));
        showToast('Resume template saved successfully!');
    } catch (error) {
        showToast('Error saving resume', 'error');
    }
}

// Generate portfolio
function generatePortfolio() {
    showToast('Portfolio generation feature coming soon!', 'info');
}

// Show toast notification
function showToast(message, type = 'success') {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.temp-toast');
    existingToasts.forEach(toast => toast.remove());

    // Create new toast
    const toast = document.createElement('div');
    toast.className = 'temp-toast';
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#dc3545' : '#28a745'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 9999;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = message;

    // Add animation keyframes
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 3000);
}