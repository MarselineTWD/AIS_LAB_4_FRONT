from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any

class StudentBase(BaseModel):
    first_name: str
    last_name: str
    age: int
    sex: str
    email: str
    level: str
    vocabulary: int
    teacher_id: int
    finished_tests: bool = False  # Added field with default False

class StudentCreate(StudentBase):
    first_name: str
    last_name: str
    age: int
    sex: str
    email: str
    level: str
    vocabulary: int
    teacher_id: int
    password: str

class Student(StudentBase):
    id: int
    is_active: bool = True
    class Config:
        from_attributes = True

# Rest of the schemas remain the same (TeacherBase, TeacherCreate, Teacher, ManagerBase, ManagerCreate, Manager, Token, TokenData, UserInfo)
class TeacherBase(BaseModel):
    first_name: str
    last_name: str
    age: int
    sex: str
    qualification: str
    email: Optional[str] = None

class TeacherCreate(TeacherBase):
    password: Optional[str] = None

class Teacher(TeacherBase):
    id: int
    is_active: bool = True
    students: List[Student] = []
    class Config:
        from_attributes = True

class ManagerBase(BaseModel):
    email: str
    is_superuser: bool = False
    is_active: bool = True

class ManagerCreate(ManagerBase):
    password: str

class Manager(ManagerBase):
    id: int
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class UserInfo(BaseModel):
    id: int
    email: str
    role: str
    is_active: bool
    additional_info: Dict[str, Any] = {}
    class Config:
        from_attributes = True