document.addEventListener('DOMContentLoaded', async function() {
    // Показываем welcome-section при загрузке страницы
    const welcomeSection = document.getElementById('welcomeSection');
    welcomeSection.classList.remove('hidden');
    welcomeSection.classList.add('show');

    // Скрываем через 3 секунды с плавным исчезновением
    setTimeout(() => {
        welcomeSection.classList.remove('show');
        welcomeSection.classList.add('fade-out');
        // Полностью скрываем после завершения анимации (0.5s)
        setTimeout(() => {
            welcomeSection.classList.add('hidden');
            welcomeSection.classList.remove('fade-out');
        },500);
    }, 1000); // Увеличил до 3000 для лучшей видимости

    await loadTeachers();
    
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const userData = await fetchUserData(token);
            updateUIforLoggedInUser(userData);
            await loadRoleSpecificData(userData.role, token, userData);
        } catch (error) {
            console.error('Error loading user data:', error);
            if (error.status === 401) {
                localStorage.removeItem('token');
                updateUIforGuest();
            }
        }
    } else {
        updateUIforGuest();
    }
});

// Загрузка списка преподавателей
async function loadTeachers() {
    try {
        const response = await fetch('/api/teachers/public');
        const teachers = await response.json();
        displayTeachers(teachers);
    } catch (error) {
        console.error('Error loading teachers:', error);
        document.getElementById('teachersList').innerHTML = 
            '<div class="text-red-500">Failed to load teachers list. Please try again later.</div>';
    }
}

function displayTeachers(teachers) {
    const teachersList = document.getElementById('teachersList');
    if (teachers.length === 0) {
        teachersList.innerHTML = '<div class="teacherlist-text">Нет доступных преподавателей в данный момент.</div>';
        return;
    }
    
    teachersList.innerHTML = teachers.map(teacher => `
        <div class="teacherlist-show">
            <div class="teacherlist-show-p">${teacher.first_name} ${teacher.last_name}</div>
            <div class="teacherlist-show-p">Qualification: ${teacher.qualification || 'Not specified'}</div>
            <div class="teacherlist-show-p">${teacher.email}</div>
        </div>
    `).join('');
}

// UI для гостя
function updateUIforGuest() {
    const loginPrompt = document.getElementById('loginPrompt');
    if (loginPrompt) loginPrompt.classList.remove('hidden');
    
    document.getElementById('studentDashboard')?.classList.add('hidden');
    document.getElementById('teacherDashboard')?.classList.add('hidden');
    document.getElementById('managerDashboard')?.classList.add('hidden');
}

// UI для авторизованного пользователя
function updateUIforLoggedInUser(userData) {
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage) {
        welcomeMessage.textContent = 
            `С возвращением, ${userData.additional_info.first_name || userData.email}! Вы вошли как ${userData.role}.`;
    }
    
    const loginPrompt = document.getElementById('loginPrompt');
    if (loginPrompt) loginPrompt.classList.add('hidden');
    
    if (userData.role === 'student') {
        document.getElementById('studentDashboard')?.classList.remove('hidden');
    } else if (userData.role === 'teacher') {
        document.getElementById('teacherDashboard')?.classList.remove('hidden');
    } else if (userData.role === 'manager') {
        document.getElementById('managerDashboard')?.classList.remove('hidden');
    }
}

// Получение данных пользователя
async function fetchUserData(token) {
    const response = await fetch('/api/me', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!response.ok) {
        const error = new Error('Failed to load user data');
        error.status = response.status;
        throw error;
    }
    
    return await response.json();
}

// Загрузка данных в зависимости от роли
async function loadRoleSpecificData(role, token, userData) {
    try {
        if (role === 'student') {
            const studentData = document.getElementById('studentData');
            studentData.innerHTML = '<div class="text-center">Loading your data...</div>';

            const studentInfo = userData.additional_info;
            const vocabularyProgress = calculateVocabularyProgress(studentInfo.vocabulary);

            studentData.innerHTML = `
                <div class="student-profile">
                    <div class="student-details">
                        <p><strong>Имя:</strong> ${studentInfo.first_name} ${studentInfo.last_name}</p>
                        <p><strong>Email:</strong> ${userData.email}</p>
                        <p><strong>Уровень английского:</strong> ${studentInfo.level}</p>
                    </div>
                    <div class="vocabulary-section">
                        <h3>Словарный запас</h3>
                        <div class="vocabulary-progress-container">
                            <div class="vocabulary-progress" style="width: ${vocabularyProgress}%">
                                ${studentInfo.vocabulary} слов
                            </div>
                        </div>
                        <p class="vocabulary-description">
                            ${getVocabularyDescription(studentInfo.vocabulary)}
                        </p>
                    </div>
                    <div class="learning-progress">
                        <h3>Прогресс обучения</h3>
                        <div class="progress-details">
                            <p>Уроки пройдены: <span id="completedLessons">0</span></p>
                            <p>Тесты сданы: <span id="completedTests">0</span></p>
                        </div>
                    </div>
                </div>
            `;
        } else if (role === 'teacher') {
            const teacherData = document.getElementById('teacherData');
            teacherData.innerHTML = '<div class="loading-text">Загрузка ваших студентов...</div>';
            const response = await fetch('/api/students/', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to load students data');
            const students = await response.json();
            teacherData.innerHTML = students.length === 0 ? 
                '<div class="no-students-text">У вас нет студентов</div>' :
                `
                    <h3 class="students-title">Ваши студенты</h3>
                    <div class="students-grid">
                        ${students.map(s => `
                            <div class="student-card">
                                <div class="student-name">${s.first_name} ${s.last_name}</div>
                                <div class="student-level">Level: ${s.level}</div>
                                <div class="student-vocab">Vocabulary: ${s.vocabulary} words</div>
                            </div>
                        `).join('')}
                    </div>
                `;
        } else if (role === 'manager') {
            const managerData = document.getElementById('managerData');
            managerData.innerHTML = '<div class="text-center">Загрузка данных...</div>';
            const [teachersRes, studentsRes] = await Promise.all([
                fetch('/api/teachers/', { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json()),
                fetch('/api/students/', { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json())
            ]);
            managerData.innerHTML = `
                <div class="manager-admin">
                    <div class="manager-teacher">
                        <h3>Управление преподавателями</h3>
                        <p class="mb-3">Всего учителей: ${teachersRes.length} </p>
                        <button class="teacher-add-button">Добавить нового учителя</button>
                    </div>
                    <div class="manager-student">
                        <h3>Управление студентами</h3>
                        <p class="mb-3">Всего студентов: ${studentsRes.length} </p>
                        <button class="student-add-button">Добавить нового студента</button>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error(`Error loading ${role} data:`, error);
        const dataContainer = document.getElementById(`${role}Data`);
        if (dataContainer) {
            dataContainer.innerHTML = '<div class="text-red-500">Error loading your data. Please try again later.</div>';
        }
    }
}

// Расчет прогресса словарного запаса
function calculateVocabularyProgress(vocabularyCount) {
    const maxVocabulary = 5000;
    return Math.min((vocabularyCount / maxVocabulary) * 100, 100);
}

// Описание уровня словарного запаса
function getVocabularyDescription(vocabularyCount) {
    if (vocabularyCount < 1000) {
        return 'Начальный уровень словарного запаса. Продолжайте изучение!';
    } else if (vocabularyCount < 2000) {
        return 'Хороший прогресс! Ваш словарный запас растет.';
    } else if (vocabularyCount < 3000) {
        return 'Отличный уровень! Вы значительно расширили свой словарный запас.';
    } else if (vocabularyCount < 4000) {
        return 'Впечатляющий словарный запас! Вы близки к свободному владению.';
    } else {
        return 'Превосходный словарный запас! Вы практически носитель языка.';
    }
}