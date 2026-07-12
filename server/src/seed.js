const bcrypt = require('bcryptjs');
const { Achievement, User, Department } = require('./models');

async function ensureUser(data) {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
        return existing;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await User.create({
        ...data,
        email: data.email.toLowerCase(),
        passwordHash,
        emailVerified: true,
        profileCompletion: data.profileCompletion || 80
    });
    return user;
}

async function seedDemoData() {
    // Clear out existing data to apply new seeds
    await User.deleteMany({});
    await Achievement.deleteMany({});
    await Department.deleteMany({});

    const [csDept] = await Department.create([
        { name: 'Computer Science', code: 'CSE' },
        { name: 'Electronics and Communication', code: 'ECE' }
    ]);

    const faculty = await ensureUser({
        role: 'faculty',
        name: 'Prof. Amit Verma',
        email: 'amit.verma@anits.edu.in',
        password: 'Password@123',
        institution: 'Orbit Institute of Technology',
        department: csDept.name,
        designation: 'Professor',
        profileImage: 'https://ui-avatars.com/api/?name=Prof.+Amit+Verma&background=2d5016&color=fff&size=150&bold=true',
        facultyProfile: {
            experience: '12 years',
            employeeId: 'FAC-AMIT',
            specialization: 'Data Science & AI',
            teacherCode: 'AMIT-2024'
        }
    });

    const faculty2 = await ensureUser({
        role: 'faculty',
        name: 'Dr. Neha Sharma',
        email: 'neha.sharma@anits.edu.in',
        password: 'Password@123',
        institution: 'Orbit Institute of Technology',
        department: 'Electronics and Communication',
        designation: 'Associate Professor',
        profileImage: 'https://ui-avatars.com/api/?name=Dr.+Neha+Sharma&background=34495e&color=fff&size=150&bold=true',
        facultyProfile: {
            experience: '8 years',
            employeeId: 'FAC-NEHA',
            specialization: 'Embedded Systems',
            teacherCode: 'NEHA-2024'
        }
    });

    const student1 = await ensureUser({
        role: 'student',
        name: 'Kavya Singh',
        email: 'kavya.singh@student.anits.edu.in',
        password: 'Password@123',
        institution: 'Orbit Institute of Technology',
        department: csDept.name,
        profileImage: 'https://ui-avatars.com/api/?name=Kavya+Singh&background=1f4e79&color=fff&size=150&bold=true',
        studentProfile: {
            course: 'B.Tech CSE',
            year: '3rd Year',
            semester: '6',
            academicYear: '2025-26',
            credits: 65,
            cgpa: 9.2,
            phone: '+91 9876543211',
            classTeacherEmail: 'amit.verma@anits.edu.in',
            classTeacherCode: 'AMIT-2024',
            classTeacherName: 'Prof. Amit Verma',
            fatherName: 'Rajesh Singh',
            motherName: 'Anjali Singh',
            socialMedia: {
                linkedin: 'https://linkedin.com/in/kavyasingh',
                github: 'https://github.com/kavyasingh',
                portfolio: 'https://kavyasingh.dev'
            }
        }
    });

    const student2 = await ensureUser({
        role: 'student',
        name: 'Rohan Gupta',
        email: 'rohan.gupta@student.anits.edu.in',
        password: 'Password@123',
        institution: 'Orbit Institute of Technology',
        department: csDept.name,
        profileImage: 'https://ui-avatars.com/api/?name=Rohan+Gupta&background=9b2226&color=fff&size=150&bold=true',
        studentProfile: {
            course: 'B.Tech CSE',
            year: '3rd Year',
            semester: '6',
            academicYear: '2025-26',
            credits: 35,
            cgpa: 8.1,
            phone: '+91 9876543222',
            classTeacherEmail: 'amit.verma@anits.edu.in',
            classTeacherCode: 'AMIT-2024',
            classTeacherName: 'Prof. Amit Verma',
            fatherName: 'Sanjay Gupta',
            motherName: 'Meera Gupta',
            socialMedia: {
                linkedin: 'https://linkedin.com/in/rohangupta',
                github: 'https://github.com/rohangupta',
                portfolio: 'https://rohangupta.dev'
            }
        }
    });

    const student3 = await ensureUser({
        role: 'student',
        name: 'Priya Patel',
        email: 'priya.patel@student.anits.edu.in',
        password: 'Password@123',
        institution: 'Orbit Institute of Technology',
        department: 'Electronics and Communication',
        profileImage: 'https://ui-avatars.com/api/?name=Priya+Patel&background=f39c12&color=fff&size=150&bold=true',
        studentProfile: {
            course: 'B.Tech ECE',
            year: '2nd Year',
            semester: '4',
            academicYear: '2025-26',
            credits: 40,
            cgpa: 8.8,
            phone: '+91 9876543333',
            classTeacherEmail: 'neha.sharma@anits.edu.in',
            classTeacherCode: 'NEHA-2024',
            classTeacherName: 'Dr. Neha Sharma',
            fatherName: 'Ramesh Patel',
            motherName: 'Geeta Patel'
        }
    });

    await ensureUser({
        role: 'institution',
        name: 'Orbit',
        email: 'admin@anits.edu.in',
        password: 'Password@123',
        institution: 'Orbit Institute of Technology',
        profileImage: 'https://ui-avatars.com/api/?name=Orbit&background=5b2c6f&color=fff&size=150&bold=true',
        companyProfile: {
            location: 'Bangalore, Karnataka',
            website: 'https://anits.edu.in',
            description: 'A leading educational institution fostering innovation and technology.'
        }
    });

    await ensureUser({
        role: 'company',
        name: 'TechCorp Solutions',
        email: 'hr@techcorp.com',
        password: 'Password@123',
        institution: 'TechCorp Solutions',
        profileImage: 'https://ui-avatars.com/api/?name=TechCorp+Solutions&background=833c0c&color=fff&size=150&bold=true',
        companyProfile: {
            industry: 'Software Development',
            size: 'medium',
            website: 'https://techcorp.com',
            hrContact: 'Sarah Johnson',
            phone: '+1-555-0123',
            location: '123 Tech Street, Silicon Valley, CA 94000',
            description: 'Leading software development company specializing in enterprise solutions.'
        }
    });

    await ensureUser({
        role: 'admin',
        name: 'System Admin',
        email: 'principal@anits.edu.in',
        password: 'Password@123',
        institution: 'Smart Student Hub',
        profileImage: 'https://ui-avatars.com/api/?name=Admin&background=1f2937&color=fff&size=150&bold=true'
    });

    // Kavya Singh Achievements
    await Achievement.create({
        ownerUserId: student1._id,
        ownerRole: 'student',
        category: 'certification',
        title: 'NPTEL: Data Structures and Algorithms',
        description: 'Elite + Silver certification in DSA with Python',
        department: csDept.name,
        academicYear: '2025-26',
        semester: '6',
        organizer: 'NPTEL',
        venue: 'Online',
        startDate: new Date('2024-01-14'),
        endDate: new Date('2024-04-15'),
        certificateId: 'NPTEL-2024-DSA',
        status: 'approved',
        credits: 12,
        history: [{ action: 'seeded', actorRole: 'system', statusFrom: 'pending', statusTo: 'approved' }]
    });

    await Achievement.create({
        ownerUserId: student1._id,
        ownerRole: 'student',
        category: 'internship',
        title: 'Salesforce Developer Intern',
        description: '3 months internship on Salesforce Lightning platform',
        department: csDept.name,
        academicYear: '2025-26',
        semester: '6',
        organizer: 'Salesforce',
        venue: 'Remote',
        startDate: new Date('2023-11-01'),
        endDate: new Date('2024-02-01'),
        certificateId: 'SF-INT-2024',
        status: 'pending',
        credits: 15,
        history: [{ action: 'seeded', actorRole: 'system', statusFrom: 'pending', statusTo: 'pending' }]
    });

    // Rohan Gupta Achievements
    await Achievement.create({
        ownerUserId: student2._id,
        ownerRole: 'student',
        category: 'certification',
        title: 'Stanford Machine Learning',
        description: 'Completed Andrew Ng Machine Learning Specialization via Coursera',
        department: csDept.name,
        academicYear: '2025-26',
        semester: '5',
        organizer: 'Stanford University',
        venue: 'Online',
        startDate: new Date('2023-08-01'),
        endDate: new Date('2023-12-01'),
        certificateId: 'STANFORD-ML-99',
        status: 'approved',
        credits: 20,
        history: [{ action: 'seeded', actorRole: 'system', statusFrom: 'pending', statusTo: 'approved' }]
    });
    
    // Priya Patel Achievements
    await Achievement.create({
        ownerUserId: student3._id,
        ownerRole: 'student',
        category: 'hackathon',
        title: 'Smart India Hackathon 2024',
        description: 'First Runner up in Software Edition',
        department: 'Electronics and Communication',
        academicYear: '2025-26',
        semester: '4',
        organizer: 'MoE Govt of India',
        venue: 'New Delhi',
        startDate: new Date('2024-05-15'),
        status: 'approved',
        credits: 30,
        history: [{ action: 'seeded', actorRole: 'system', statusFrom: 'pending', statusTo: 'approved' }]
    });

    await Achievement.create({
        ownerUserId: faculty._id,
        ownerRole: 'faculty',
        category: 'publication',
        title: 'Advancements in Machine Learning for Healthcare',
        description: 'Published in IEEE Transactions',
        department: csDept.name,
        academicYear: '2025-26',
        semester: 'NA',
        organizer: 'IEEE',
        venue: 'London',
        startDate: new Date('2024-02-20'),
        certificateId: 'PUB-2024-AMIT',
        status: 'faculty_review',
        credits: 15,
        facultyAssignedId: faculty._id,
        history: [{ action: 'seeded', actorRole: 'system', statusFrom: 'pending', statusTo: 'faculty_review' }]
    });
    
    await Achievement.create({
        ownerUserId: faculty2._id,
        ownerRole: 'faculty',
        category: 'publication',
        title: 'Next Generation Embedded IoT Systems',
        description: 'Published in ACM IoT Journal',
        department: 'Electronics and Communication',
        academicYear: '2025-26',
        semester: 'NA',
        organizer: 'ACM',
        venue: 'New York',
        startDate: new Date('2024-01-10'),
        certificateId: 'PUB-2024-NEHA',
        status: 'approved',
        credits: 20,
        facultyAssignedId: faculty2._id,
        history: [{ action: 'seeded', actorRole: 'system', statusFrom: 'pending', statusTo: 'approved' }]
    });
}

module.exports = { seedDemoData };
