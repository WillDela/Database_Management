INSERT INTO Users (Name, Email, Age, FitnessGoal) VALUES
('Alejandro Perez', 'alex@email.com', 22, 'Build Muscle'),
('Miguel Bayon', 'miguel@email.com', 30, 'Lose Weight'),
('William Delaosa', 'william@email.com', 1, NULL);

INSERT INTO Workout (WorkoutDate, DurationMinutes, WorkoutType, CaloriesBurned, UserID) VALUES
('2026-03-01', 60, 'Strength', 400, 1),
('2026-03-02', 45, 'Cardio', 300, 2),
('2026-03-03', 0, NULL, 0, 3);

INSERT INTO FoodLog (FoodName, Calories, MealType, LogDate, UserID) VALUES
('Chicken', 300, 'Lunch', '2026-03-01', 1),
('Protein Shake', 250, 'Breakfast', '2026-03-01', 1),
('Water', 0, NULL, '2026-03-02', 2);

INSERT INTO Exercise (ExerciseName, MuscleGroup, Equipment, DifficultyLevel) VALUES
('Bench Press', 'Chest', 'Barbell', 'Medium'),
('Squat', 'Legs', 'Barbell', 'Hard');

INSERT INTO WorkoutExercise (WorkoutID, ExerciseID, Sets, Reps, Weight) VALUES
(1, 1, 4, 10, 135),
(1, 2, 3, 8, 185),
(3, 2, 1, 5, 0);