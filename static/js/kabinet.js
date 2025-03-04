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

    // Добавляем модальные окна для форм к body
    addModalWindows();
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
            // Дополнительно загрузим всех преподавателей для заполнения выпадающего списка
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
            
            // Сохраним список преподавателей для использования в модальном окне добавления студента
            window.teachersList = teachersRes;
            
            // Добавляем обработчики для кнопок добавления
            document.querySelector('.teacher-add-button').addEventListener('click', showTeacherModal);
            document.querySelector('.student-add-button').addEventListener('click', showStudentModal);
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

// Добавление модальных окон для форм
function addModalWindows() {
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = `
        <!-- Модальное окно для добавления преподавателя -->
        <div id="teacherModal" class="modal">
            <div class="modal-content">
                <span class="close-button">&times;</span>
                <h2>Добавить нового преподавателя</h2>
                <form id="addTeacherForm">
                    <div class="form-group">
                        <label for="teacher-first-name">Имя</label>
                        <input type="text" id="teacher-first-name" required>
                    </div>
                    <div class="form-group">
                        <label for="teacher-last-name">Фамилия</label>
                        <input type="text" id="teacher-last-name" required>
                    </div>
                    <div class="form-group">
                        <label for="teacher-age">Возраст</label>
                        <input type="number" id="teacher-age" min="18" max="100" required>
                    </div>
                    <div class="form-group">
                        <label for="teacher-sex">Пол</label>
                        <select id="teacher-sex" required>
                            <option value="">Выберите пол</option>
                            <option value="M">Мужской</option>
                            <option value="F">Женский</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="teacher-qualification">Квалификация</label>
                        <select id="teacher-qualification" required>
                            <option value="">Выберите уровень</option>
                            <option value="A1">A1</option>
                            <option value="A2">A2</option>
                            <option value="B1">B1</option>
                            <option value="B2">B2</option>
                            <option value="C1">C1</option>
                            <option value="C2">C2</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="teacher-email">Email</label>
                        <input type="email" id="teacher-email" required>
                    </div>
                    <div class="form-group">
                        <label for="teacher-password">Пароль</label>
                        <input type="password" id="teacher-password" required>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="cancel-button">Отмена</button>
                        <button type="submit" class="submit-button">Добавить</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Модальное окно для добавления студента -->
        <div id="studentModal" class="modal">
            <div class="modal-content">
                <span class="close-button">&times;</span>
                <h2>Добавить нового студента</h2>
                <form id="addStudentForm">
                    <div class="form-group">
                        <label for="student-first-name">Имя</label>
                        <input type="text" id="student-first-name" required>
                    </div>
                    <div class="form-group">
                        <label for="student-last-name">Фамилия</label>
                        <input type="text" id="student-last-name" required>
                    </div>
                    <div class="form-group">
                        <label for="student-age">Возраст</label>
                        <input type="number" id="student-age" min="7" max="100" required>
                    </div>
                    <div class="form-group">
                        <label for="student-sex">Пол</label>
                        <select id="student-sex" required>
                            <option value="">Выберите пол</option>
                            <option value="M">Мужской</option>
                            <option value="F">Женский</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="student-email">Email</label>
                        <input type="email" id="student-email" required>
                    </div>
                    <div class="form-group">
                        <label for="student-level">Уровень английского</label>
                        <select id="student-level" required>
                            <option value="">Выберите уровень</option>
                            <option value="A1">A1 (Начальный)</option>
                            <option value="A2">A2 (Элементарный)</option>
                            <option value="B1">B1 (Средний)</option>
                            <option value="B2">B2 (Выше среднего)</option>
                            <option value="C1">C1 (Продвинутый)</option>
                            <option value="C2">C2 (Профессиональный)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="student-vocabulary">Словарный запас (кол-во слов)</label>
                        <input type="number" id="student-vocabulary" min="0" value="0" required>
                    </div>
                    <div class="form-group">
                        <label for="student-teacher">Преподаватель</label>
                        <select id="student-teacher" required>
                            <option value="">Выберите преподавателя</option>
                            <!-- Опции будут добавлены динамически -->
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="student-password">Пароль</label>
                        <input type="password" id="student-password" required>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="cancel-button">Отмена</button>
                        <button type="submit" class="submit-button">Добавить</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalContainer);

    // Добавляем обработчики закрытия модальных окон
    const closeButtons = document.querySelectorAll('.close-button, .cancel-button');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            document.getElementById('teacherModal').style.display = 'none';
            document.getElementById('studentModal').style.display = 'none';
        });
    });

    // Закрытие при клике вне модального окна
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    // Добавляем обработчики отправки форм
    document.getElementById('addTeacherForm').addEventListener('submit', addTeacher);
    document.getElementById('addStudentForm').addEventListener('submit', addStudent);
}

// Показать модальное окно добавления преподавателя
function showTeacherModal() {
    document.getElementById('teacherModal').style.display = 'block';
}

// Показать модальное окно добавления студента
function showStudentModal() {
    const modal = document.getElementById('studentModal');
    
    // Заполняем выпадающий список преподавателей
    const teacherSelect = document.getElementById('student-teacher');
    teacherSelect.innerHTML = '<option value="">Выберите преподавателя</option>';
    
    if (window.teachersList && window.teachersList.length > 0) {
        window.teachersList.forEach(teacher => {
            const option = document.createElement('option');
            option.value = teacher.id;
            option.textContent = `${teacher.first_name} ${teacher.last_name}`;
            teacherSelect.appendChild(option);
        });
    }
    
    modal.style.display = 'block';
}

// Добавление нового преподавателя
async function addTeacher(event) {
    event.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Вы не авторизованы!');
        return;
    }
    
    // Собираем данные из формы
    const teacherData = {
        first_name: document.getElementById('teacher-first-name').value,
        last_name: document.getElementById('teacher-last-name').value,
        age: parseInt(document.getElementById('teacher-age').value),
        sex: document.getElementById('teacher-sex').value,
        qualification: document.getElementById('teacher-qualification').value,
        email: document.getElementById('teacher-email').value,
        password: document.getElementById('teacher-password').value
    };
    
    try {
        // Отправляем запрос на создание преподавателя
        const response = await fetch('/api/teachers/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(teacherData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Ошибка при добавлении преподавателя');
        }
        
        // Успешное добавление
        const result = await response.json();
        alert('Преподаватель успешно добавлен!');
        
        // Обновляем список преподавателей
        if (window.teachersList) {
            window.teachersList.push(result);
        }
        
        // Перезагружаем страницу, чтобы обновить данные
        location.reload();
        
    } catch (error) {
        console.error('Ошибка при добавлении преподавателя:', error);
        alert(`Ошибка: ${error.message}`);
    }
}

// Добавление нового студента
async function addStudent(event) {
    event.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Вы не авторизованы!');
        return;
    }
    
    // Собираем данные из формы
    const studentData = {
        first_name: document.getElementById('student-first-name').value,
        last_name: document.getElementById('student-last-name').value,
        age: parseInt(document.getElementById('student-age').value),
        sex: document.getElementById('student-sex').value,
        email: document.getElementById('student-email').value,
        level: document.getElementById('student-level').value,
        vocabulary: parseInt(document.getElementById('student-vocabulary').value),
        teacher_id: parseInt(document.getElementById('student-teacher').value),
        password: document.getElementById('student-password').value
    };
    
    try {
        // Отправляем запрос на создание студента
        const response = await fetch('/api/students/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(studentData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Ошибка при добавлении студента');
        }
        
        // Успешное добавление
        alert('Студент успешно добавлен!');
        
        // Перезагружаем страницу, чтобы обновить данные
        location.reload();
        
    } catch (error) {
        console.error('Ошибка при добавлении студента:', error);
        alert(`Ошибка: ${error.message}`);
    }
}