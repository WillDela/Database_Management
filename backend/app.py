
from flask import Flask, jsonify, request
from flask_cors import CORS
from db import get_connection
import re
import sqlite3

app = Flask(__name__)
CORS(app)  # allow frontend (different port) to call backend

# simple email validation pattern
EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


# helper function to run SELECT queries and return results
def execute_select(query, params=()):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return rows


# helper to safely parse integers from input
def parse_positive_int(value, field_name):
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return None, f"{field_name} must be an integer."
    if parsed < 0:
        return None, f"{field_name} must be >= 0."
    return parsed, None


# WORKOUT ROUTES

# get all workouts with user names (JOIN query)
@app.route("/workouts")
def workouts():
    rows = execute_select("""
        SELECT u.Name, w.WorkoutDate, w.WorkoutType
        FROM Users u
        JOIN Workout w ON u.UserID = w.UserID
        ORDER BY w.WorkoutDate;
    """)
    return jsonify(rows), 200


# filter workouts based on calories and duration
@app.route("/workouts/filter")
def filter_workouts():
    min_calories, calories_error = parse_positive_int(
        request.args.get("minCalories", 200), "minCalories"
    )
    min_duration, duration_error = parse_positive_int(
        request.args.get("minDuration", 30), "minDuration"
    )

    if calories_error or duration_error:
        return jsonify({"message": calories_error or duration_error}), 400

    rows = execute_select(
        """
        SELECT *
        FROM Workout
        WHERE CaloriesBurned > ? AND DurationMinutes > ?;
        """,
        (min_calories, min_duration),
    )
    return jsonify(rows), 200


# USER ROUTES

# get all users
@app.route("/users", methods=["GET"])
def users():
    rows = execute_select("""
        SELECT UserID, Name, Email, Age, FitnessGoal
        FROM Users
        ORDER BY UserID;
    """)
    return jsonify(rows), 200


# add new user with validation
@app.route("/users", methods=["POST"])
def add_user():
    data = request.get_json()
    if not data:
        return jsonify({"message": "Request body is required."}), 400

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    age = data.get("age")

    goal = data.get("goal")
    goal = goal.strip() if isinstance(goal, str) and goal.strip() else None

    if not name:
        return jsonify({"message": "Name is required."}), 400
    if not EMAIL_REGEX.match(email):
        return jsonify({"message": "Valid email is required."}), 400

    try:
        age = int(age)
    except (TypeError, ValueError):
        return jsonify({"message": "Age must be an integer."}), 400

    if age <= 0:
        return jsonify({"message": "Age must be greater than 0."}), 400

    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(
            """
            INSERT INTO Users (Name, Email, Age, FitnessGoal)
            VALUES (?, ?, ?, ?)
            """,
            (name, email, age, goal),
        )
        conn.commit()
        return jsonify(
            {"message": "User added successfully", "user_id": cursor.lastrowid}
        ), 201

    # handles constraint errors like duplicate email
    except sqlite3.IntegrityError as e:
        return jsonify({"message": f"Database constraint error: {str(e)}"}), 409
    except Exception as e:
        return jsonify({"message": f"Server error: {str(e)}"}), 500
    finally:
        conn.close()


# delete user (will fail if related records exist)
@app.route("/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM Users WHERE UserID = ?", (user_id,))
        if cursor.rowcount == 0:
            return jsonify({"message": "User not found."}), 404
        conn.commit()
        return jsonify({"message": "User deleted successfully."}), 200

    # foreign key constraint triggers this
    except sqlite3.IntegrityError as e:
        return jsonify(
            {"message": f"Cannot delete user due to related records: {str(e)}"}
        ), 409
    except Exception as e:
        return jsonify({"message": f"Server error: {str(e)}"}), 500
    finally:
        conn.close()


# FOOD LOG ROUTES

# add food entry
@app.route("/foodlog", methods=["POST"])
def add_foodlog():
    data = request.get_json()
    if not data:
        return jsonify({"message": "Request body is required."}), 400

    food_name = (data.get("food_name") or "").strip()
    calories, calories_error = parse_positive_int(data.get("calories"), "calories")
    meal_type = data.get("meal_type")
    meal_type = meal_type.strip() if isinstance(meal_type, str) and meal_type.strip() else None
    log_date = (data.get("log_date") or "").strip()
    user_id = data.get("user_id")

    if not food_name:
        return jsonify({"message": "food_name is required."}), 400
    if calories_error:
        return jsonify({"message": calories_error}), 400
    if not log_date:
        return jsonify({"message": "log_date is required."}), 400

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return jsonify({"message": "user_id must be an integer."}), 400

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO FoodLog (FoodName, Calories, MealType, LogDate, UserID)
            VALUES (?, ?, ?, ?, ?)
            """,
            (food_name, calories, meal_type, log_date, user_id),
        )
        conn.commit()
        return jsonify(
            {"message": "Food log added successfully.", "food_log_id": cursor.lastrowid}
        ), 201
    except sqlite3.IntegrityError as e:
        return jsonify({"message": f"Database constraint error: {str(e)}"}), 409
    except Exception as e:
        return jsonify({"message": f"Server error: {str(e)}"}), 500
    finally:
        conn.close()


# delete food entry
@app.route("/foodlog", methods=["DELETE"])
def delete_foodlog():
    data = request.get_json()
    if not data:
        return jsonify({"message": "Request body is required."}), 400

    food_name = (data.get("food_name") or "").strip()
    user_id = data.get("user_id")

    if not food_name:
        return jsonify({"message": "food_name is required."}), 400

    try:
        user_id = int(user_id)
    except (TypeError, ValueError):
        return jsonify({"message": "user_id must be an integer."}), 400

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM FoodLog WHERE FoodName = ? AND UserID = ?", (food_name, user_id))
        if cursor.rowcount == 0:
            return jsonify({"message": "Food log not found."}), 404
        conn.commit()
        return jsonify({"message": "Food log deleted successfully.", "rows_affected": cursor.rowcount}), 200
    except Exception as e:
        return jsonify({"message": f"Server error: {str(e)}"}), 500
    finally:
        conn.close()


# UPDATE ROUTES

# update workout info
# ADVANCED FEATURE: explicit transaction with rollback on failure
@app.route("/workouts/<int:workout_id>", methods=["PUT"])
def update_workout(workout_id):
    data = request.get_json()
    if not data:
        return jsonify({"message": "Request body is required."}), 400

    duration = data.get("duration")
    calories = data.get("calories")

    duration_value, duration_error = parse_positive_int(duration, "duration")
    calories_value, calories_error = parse_positive_int(calories, "calories")
    if duration_error or calories_error:
        return jsonify({"message": duration_error or calories_error}), 400

    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("BEGIN")
        cursor.execute(
            """
            UPDATE Workout
            SET DurationMinutes = ?, CaloriesBurned = ?
            WHERE WorkoutID = ?
            """,
            (duration_value, calories_value, workout_id),
        )
        if cursor.rowcount == 0:
            cursor.execute("ROLLBACK")
            return jsonify({"message": "Workout not found."}), 404
        cursor.execute("COMMIT")
        return jsonify({"message": "Workout updated successfully."}), 200
    except Exception as e:
        cursor.execute("ROLLBACK")
        return jsonify({"message": f"Transaction failed: {str(e)}"}), 500
    finally:
        conn.close()


# ANALYTICS ROUTES

# total calories per user (GROUP BY)
@app.route("/summary")
def summary():
    rows = execute_select("""
        SELECT UserID, SUM(CaloriesBurned) AS TotalCalories
        FROM Workout
        GROUP BY UserID
        ORDER BY UserID;
    """)
    return jsonify(rows), 200


# max calories per user
@app.route("/analytics/max-calories")
def max_calories():
    rows = execute_select("""
        SELECT UserID, MAX(CaloriesBurned) AS MaxCalories
        FROM Workout
        GROUP BY UserID
        ORDER BY UserID;
    """)
    return jsonify(rows), 200


# average calories across all workouts
@app.route("/avg-calories")
def avg_calories():
    rows = execute_select("""
        SELECT AVG(CaloriesBurned) AS AvgCalories
        FROM Workout;
    """)
    return jsonify(rows), 200


# users above average calories (subquery)
@app.route("/analytics/above-average")
def above_average():
    rows = execute_select("""
        SELECT Name
        FROM Users
        WHERE UserID IN (
            SELECT UserID
            FROM Workout
            GROUP BY UserID
            HAVING SUM(CaloriesBurned) > (
                SELECT AVG(CaloriesBurned) FROM Workout
            )
        );
    """)
    return jsonify(rows), 200


# classify workouts using CASE
@app.route("/analytics/intensity")
def workout_intensity():
    rows = execute_select("""
        SELECT WorkoutID,
               CASE
                   WHEN CaloriesBurned > 350 THEN 'High'
                   WHEN CaloriesBurned BETWEEN 200 AND 350 THEN 'Medium'
                   ELSE 'Low'
               END AS Intensity
        FROM Workout
        ORDER BY WorkoutID;
    """)
    return jsonify(rows), 200


# query using view
@app.route("/analytics/view-summary")
def view_summary():
    rows = execute_select("""
        SELECT *
        FROM UserWorkoutSummary
        ORDER BY UserID;
    """)
    return jsonify(rows), 200


# exercises performed per workout (joins Workout, WorkoutExercise, Exercise)
@app.route("/analytics/workout-exercises")
def workout_exercises():
    rows = execute_select("""
        SELECT w.WorkoutID, w.WorkoutType, e.ExerciseName, we.Sets, we.Reps, we.Weight
        FROM Workout w
        JOIN WorkoutExercise we ON w.WorkoutID = we.WorkoutID
        JOIN Exercise e ON we.ExerciseID = e.ExerciseID
        ORDER BY w.WorkoutID;
    """)
    return jsonify(rows), 200


if __name__ == "__main__":
    app.run(debug=True)