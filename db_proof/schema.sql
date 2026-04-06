CREATE TABLE Users (
    UserID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Email TEXT UNIQUE NOT NULL,
    Age INTEGER CHECK (Age > 0),
    FitnessGoal TEXT
);

CREATE TABLE Workout (
    WorkoutID INTEGER PRIMARY KEY AUTOINCREMENT,
    WorkoutDate TEXT NOT NULL,
    DurationMinutes INTEGER CHECK (DurationMinutes >= 0),
    WorkoutType TEXT,
    CaloriesBurned INTEGER CHECK (CaloriesBurned >= 0),
    UserID INTEGER,
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE FoodLog (
    FoodLogID INTEGER PRIMARY KEY AUTOINCREMENT,
    FoodName TEXT NOT NULL,
    Calories INTEGER CHECK (Calories >= 0),
    MealType TEXT,
    LogDate TEXT NOT NULL,
    UserID INTEGER,
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

CREATE TABLE Exercise (
    ExerciseID INTEGER PRIMARY KEY AUTOINCREMENT,
    ExerciseName TEXT NOT NULL,
    MuscleGroup TEXT,
    Equipment TEXT,
    DifficultyLevel TEXT
);

CREATE TABLE WorkoutExercise (
    WorkoutID INTEGER,
    ExerciseID INTEGER,
    Sets INTEGER,
    Reps INTEGER,
    Weight INTEGER,
    PRIMARY KEY (WorkoutID, ExerciseID),
    FOREIGN KEY (WorkoutID) REFERENCES Workout(WorkoutID),
    FOREIGN KEY (ExerciseID) REFERENCES Exercise(ExerciseID)
);

CREATE VIEW UserWorkoutSummary AS
SELECT UserID, COUNT(*) AS TotalWorkouts, SUM(CaloriesBurned) AS TotalCalories
FROM Workout
GROUP BY UserID;

CREATE TRIGGER prevent_negative_calories
BEFORE INSERT ON FoodLog
FOR EACH ROW
WHEN NEW.Calories < 0
BEGIN
    SELECT RAISE(FAIL, 'Calories cannot be negative');
END;