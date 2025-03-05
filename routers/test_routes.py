# routes/test_routes.py
import json
import os
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import schemas
import models

router = APIRouter(tags=["students"])
templates = Jinja2Templates(directory="templates")

# Level progression order
LEVEL_PROGRESSION = ["A1", "A2", "B1", "B2", "C1", "C2"]

@router.get("/test", response_class=HTMLResponse)
async def get_api_test_page(
    request: Request, 
    current_user: dict = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    try:
        # Print out current user details for debugging
        print("Current User:", current_user)
        
        user = current_user["user"]
        role = current_user["role"]
        
        # Explicit role check
        if role != "student":
            raise HTTPException(status_code=403, detail="Only students can access tests")
        
        # Load the corresponding test file
        test_file_path = f"tests/{user.level}.json"
        print(f"Test file path: {test_file_path}")
        
        if not os.path.exists(test_file_path):
            raise HTTPException(status_code=404, detail=f"Test file not found: {test_file_path}")
        
        with open(test_file_path, 'r') as f:
            test = json.load(f)
        
        return templates.TemplateResponse("test.html", {
            "request": request,
            "level": test['level'],
            "questions": test['questions']
        })
    except Exception as e:
        print(f"Error in test route: {e}")
        raise

@router.post("/submit-test")
async def submit_test(
    test_data: dict, 
    current_user: dict = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    user = current_user["user"]
    role = current_user["role"]
    
    if role != "student":
        raise HTTPException(status_code=403, detail="Only students can submit tests")
    
    # Load the corresponding test file
    test_file_path = f"tests/{user.level}.json"
    if not os.path.exists(test_file_path):
        raise HTTPException(status_code=404, detail="Test file not found")
    
    with open(test_file_path, 'r') as f:
        test = json.load(f)
    
    # Calculate score
    score = 0
    for i, question in enumerate(test['questions']):
        if test_data['answers'][i] == question['correct_answer']:
            score += 1
    
    # Determine level progression
    current_level_index = LEVEL_PROGRESSION.index(user.level)
    
    if score <= 2:
        # Demotion
        if current_level_index > 0:
            user.level = LEVEL_PROGRESSION[current_level_index - 1]
        user.finished_tests = False
    elif score >= 8:
        # Promotion
        if current_level_index < len(LEVEL_PROGRESSION) - 1:
            user.level = LEVEL_PROGRESSION[current_level_index + 1]
        user.finished_tests = True
    else:
        # No change in level, tests not finished
        user.finished_tests = False
    
    # Save changes
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {
        "score": score,
        "new_level": user.level,
        "finished_tests": user.finished_tests
    }