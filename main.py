# main.py
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from database import engine, get_db
import models
import schemas
from typing import List, Optional
from datetime import timedelta

# Import API route modules
from routers import auth_routes, teacher_routes, student_routes

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="English Gang API",
    docs_url="/api/docs",  # URL для Swagger UI
    openapi_url="/api/openapi.json"  # URL для OpenAPI схемы
)
# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Include routers with prefixes
app.include_router(auth_routes.router, prefix="/api")
app.include_router(teacher_routes.router, prefix="/api")
app.include_router(student_routes.router, prefix="/api")


# Serve HTML pages
@app.get("/", response_class=HTMLResponse)
async def serve_index():
    with open("templates/index2.html", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@app.get("/login.html", response_class=HTMLResponse)
async def serve_login():
    with open("templates/login.html", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@app.get("/login2.html", response_class=HTMLResponse)
async def serve_login2():
    with open("templates/login2.html", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@app.get("/registration.html", response_class=HTMLResponse)
async def serve_registration():
    with open("templates/registration.html", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@app.get("/contact.html", response_class=HTMLResponse)
async def serve_contact():
    with open("templates/contact.html", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())
    
@app.get("/Courses.html", response_class=HTMLResponse)
async def serve_Courses():
    with open("templates/Courses.html", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())
    
@app.get("/projects.html", response_class=HTMLResponse)
async def serve_projects():
    with open("templates/projects.html", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())
    
@app.get("/Teachers.html", response_class=HTMLResponse)
async def serve_Teachers():
    with open("templates/Teachers.html", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())
    
@app.get("/team.html", response_class=HTMLResponse)
async def serve_teamn():
    with open("templates/team.html", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@app.get("/technical.html", response_class=HTMLResponse)
async def serve_technical():
    with open("templates/technical.html", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())
    
@app.get("/Tests.html", response_class=HTMLResponse)
async def serve_Tests():
    with open("templates/Tests.html", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@app.get("/kabinet.html", response_class=HTMLResponse)
async def serve_kabinet():
    with open("templates/kabinet.html", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

# Health check endpoint for Nginx
@app.get("/health")
async def health_check():
    return {"status": "ok"}
