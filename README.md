# Fitness Tracker Database Final Project
# COP 4710

# Made by Group 34:
- Alejandro Perez
- William Delaosa
- Miguel Bayon
- Isaiah Fuller

## Overview

This project is a simple fitness tracking system built using SQLite, Flask, and a basic frontend. It demonstrates how a relational database connects to a backend and is used through a frontend interface.

The app allows you to:
- View users and workouts
- Run different queries (summary, filters, analytics)
- Add users
- Update workouts
- Delete users (with constraint checks)


## Tech Stack

- Database: SQLite  
- Backend: Flask (Python) + flask-cors  
- Frontend: HTML, CSS, JavaScript  


## Database

Tables:
- Users  
- Workout  
- FoodLog  
- Exercise  
- WorkoutExercise  

Includes:
- Primary keys and foreign keys  
- Constraints (NOT NULL, UNIQUE, CHECK)  
- View: `UserWorkoutSummary`  
- Trigger: prevents negative calories  


## How to Run the Project

### 1. Set up the database

From the root folder:

sqlite3 fitness.db

Then run:

.read db_proof/schema.sql
.read db_proof/data.sql
.quit

### 2. Install dependencies
python3 -m pip install flask flask-cors

### 3. Start the backend
cd backend
python3 app.py

Backend will run on: http://127.0.0.1:5000

### 4. Start the frontend
In a new terminal run:

cd frontend
python3 -m http.server 8000

Then open: http://localhost:8000

OR you can also just open static HTML
open frontend/index.html


Testing
	•	Click buttons to load data and run queries
	•	Add a user using the form
	•	Update workouts
	•	Try deleting users:
	•	If the user has related records → deletion will fail (expected)
	•	If not → deletion will work


Proof Files

Located in db_proof/:
	•	schema.sql
	•	data.sql
	•	constraints_test.sql
	•	queries.sql
	•	query_outputs.txt


Notes
	•	All queries run through the backend (Flask)
	•	Database constraints are enforced (foreign keys, checks, etc.)
	•	Errors shown in the UI reflect actual database rules


Summary

This project shows a complete database application with:
	•	Proper schema design
	•	Backend API using SQL
	•	Working frontend interface
	•	Constraint enforcement and error handling