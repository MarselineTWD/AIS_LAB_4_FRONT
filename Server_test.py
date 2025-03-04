from locust import HttpUser, task, between, tag
import random
import json

# Постоянные данные для тестирования
TEST_CREDENTIALS = {
    "student": {"username": "student@example.com", "password": "password123"},
    "teacher": {"username": "john.doe@example.com", "password": "teacher123"},
    "manager": {"username": "admin@example.com", "password": "admin123"}
}

class EnglishGangUser(HttpUser):
    """
    Класс для эмуляции пользователя системы English Gang
    """
    # Время ожидания между запросами (от 1 до 5 секунд)
    wait_time = between(1.0, 5.0)
    
    # Токены доступа для разных типов пользователей
    access_tokens = {
        "student": None,
        "teacher": None,
        "manager": None
    }
    
    def on_start(self):
        """Действия при старте тестирования - открытие главной страницы"""
        self.client.get("/")
        
        # Авторизуемся как студент для последующих запросов
        self.authenticate("student")
    
    def authenticate(self, user_type):
        """Метод для авторизации пользователя и получения токена"""
        if self.access_tokens[user_type] is None:
            with self.client.post("/api/token", 
                                 data=TEST_CREDENTIALS[user_type],
                                 catch_response=True,
                                 name="Авторизация") as response:
                if response.status_code == 200:
                    token_data = response.json()
                    self.access_tokens[user_type] = token_data["access_token"]
                    response.success()
                else:
                    response.failure(f"Ошибка авторизации: {response.status_code}")
    
    # GET запросы (публичные)
    @tag("get")
    @task(5)
    def get_public_teachers(self):
        """Тест GET-запроса для получения публичного списка преподавателей"""
        with self.client.get("/api/teachers/public", 
                            catch_response=True,
                            name="GET public teachers") as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Ошибка получения списка преподавателей: {response.status_code}")
    
    @tag("get")
    @task(3)
    def visit_homepage(self):
        """Тест GET-запроса для главной страницы"""
        with self.client.get("/", 
                            catch_response=True,
                            name="GET homepage") as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Ошибка доступа к главной странице: {response.status_code}")
    
    @tag("get")
    @task(2)
    def visit_team_page(self):
        """Тест GET-запроса для страницы команды"""
        with self.client.get("/team.html", 
                            catch_response=True,
                            name="GET team page") as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Ошибка доступа к странице команды: {response.status_code}")
    
    # GET запросы (авторизованные)
    @tag("get")
    @task(3)
    def get_student_profile(self):
        """Тест GET-запроса для получения профиля студента"""
        if not self.access_tokens["student"]:
            return
            
        headers = {"Authorization": f"Bearer {self.access_tokens['student']}"}
        with self.client.get("/api/me", 
                            headers=headers,
                            catch_response=True,
                            name="GET student profile") as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Ошибка получения профиля: {response.status_code}")
    
    @tag("get")
    @task(2)
    def get_students_list(self):
        """Тест GET-запроса для получения списка студентов (требуется авторизация)"""
        if not self.access_tokens["student"]:
            return
            
        headers = {"Authorization": f"Bearer {self.access_tokens['student']}"}
        with self.client.get("/api/students/", 
                            headers=headers,
                            catch_response=True,
                            name="GET students list") as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Ошибка получения списка студентов: {response.status_code}")
    
    # PUT запросы (авторизованные)
    @tag("put")
    @task(1)
    def update_student_info(self):
        """Тест PUT-запроса для обновления информации о студенте"""
        if not self.access_tokens["student"]:
            return
        
        # Получаем информацию о текущем студенте
        headers = {"Authorization": f"Bearer {self.access_tokens['student']}"}
        with self.client.get("/api/me", 
                            headers=headers,
                            catch_response=True,
                            name="GET student for update") as response:
            if response.status_code != 200:
                response.failure(f"Не удалось получить данные студента: {response.status_code}")
                return
            
            student_data = response.json()
            student_id = student_data["id"]
            
            # Обновляем данные студента
            update_data = {
                "first_name": student_data["additional_info"].get("first_name", "Test"),
                "last_name": student_data["additional_info"].get("last_name", "Student"),
                "age": student_data["additional_info"].get("age", 20),
                "sex": "M",
                "email": student_data["email"],
                "level": "B" + str(random.randint(1, 2)),  # Случайно меняем уровень между B1 и B2
                "vocabulary": student_data["additional_info"].get("vocabulary", 2000),
                "teacher_id": student_data["additional_info"].get("teacher_id", 1),
                "password": ""  # Пустой пароль не будет менять существующий
            }
            
            # Отправляем PUT запрос
            with self.client.put(f"/api/students/{student_id}", 
                                headers=headers,
                                json=update_data,
                                catch_response=True,
                                name="PUT update student") as put_response:
                if put_response.status_code == 200:
                    put_response.success()
                else:
                    put_response.failure(f"Ошибка обновления студента: {put_response.status_code}")

# Можно добавить тег post для POST запросов в последующих этапах тестирования:
"""
    @tag("post")
    @task(1)
    def register_new_student(self):
        # Тест POST-запроса для регистрации нового студента
        student_data = {
            "first_name": f"Test{random.randint(1000, 9999)}",
            "last_name": f"Student{random.randint(1000, 9999)}",
            "age": random.randint(18, 30),
            "sex": random.choice(["M", "F"]),
            "email": f"test{random.randint(1000, 9999)}@example.com",
            "level": random.choice(["A1", "A2", "B1", "B2"]),
            "vocabulary": random.randint(1000, 3000),
            "teacher_id": 1,
            "password": "password123"
        }
        
        with self.client.post("/api/register", 
                             json=student_data,
                             catch_response=True,
                             name="POST register student") as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Ошибка регистрации студента: {response.status_code}")
"""