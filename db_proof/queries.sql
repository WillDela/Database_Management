-- Query 1: Users and Workouts
SELECT u.Name, w.WorkoutDate, w.WorkoutType
FROM Users u
JOIN Workout w ON u.UserID = w.UserID
ORDER BY w.WorkoutDate;

-- Query 2: Total calories burned per user
SELECT UserID, SUM(CaloriesBurned) AS TotalCalories
FROM Workout
GROUP BY UserID
ORDER BY UserID;

-- Query 3: Users with above average calories burned
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

-- Query 4: Workout intensity classification
SELECT WorkoutID,
CASE
    WHEN CaloriesBurned > 350 THEN 'High'
    WHEN CaloriesBurned BETWEEN 200 AND 350 THEN 'Medium'
    ELSE 'Low'
END AS Intensity
FROM Workout
ORDER BY WorkoutID;

-- Query 5: Using view
SELECT * FROM UserWorkoutSummary ORDER BY UserID;

-- Query 6: Filtering workouts
SELECT *
FROM Workout
WHERE CaloriesBurned > 200 AND DurationMinutes > 30;

-- Query 7: Top calorie workout per user
SELECT UserID, MAX(CaloriesBurned) AS MaxCalories
FROM Workout
GROUP BY UserID
ORDER BY UserID;

-- Query 8: Average calories burned
SELECT AVG(CaloriesBurned) AS AvgCalories
FROM Workout;

-- Query 9: Insert a new food log row
INSERT INTO FoodLog (FoodName, Calories, MealType, LogDate, UserID)
VALUES ('Apple', 95, 'Snack', '2026-03-03', 1);

-- Query 10: Update workout duration
UPDATE Workout
SET DurationMinutes = 50
WHERE WorkoutID = 2;

-- Query 11: Delete the inserted food log row
DELETE FROM FoodLog
WHERE FoodName = 'Apple' AND UserID = 1;

-- Query 12: Exercises performed per workout (joins Workout, WorkoutExercise, Exercise)
SELECT w.WorkoutID, w.WorkoutType, e.ExerciseName, we.Sets, we.Reps, we.Weight
FROM Workout w
JOIN WorkoutExercise we ON w.WorkoutID = we.WorkoutID
JOIN Exercise e ON we.ExerciseID = e.ExerciseID
ORDER BY w.WorkoutID;