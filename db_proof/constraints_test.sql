PRAGMA foreign_keys = ON;

-- Should fail: CHECK constraint (negative calories not allowed)
INSERT INTO FoodLog (FoodName, Calories, LogDate, UserID)
VALUES ('Bad Food', -10, '2026-03-01', 1);

-- Should fail: UNIQUE constraint (duplicate email)
INSERT INTO Users (Name, Email, Age)
VALUES ('Duplicate User', 'alex@email.com', 22);

-- Should fail: NOT NULL constraint (Name cannot be NULL)
INSERT INTO Users (Name, Email, Age)
VALUES (NULL, 'noname@email.com', 20);

-- Should fail: CHECK constraint (Age must be > 0)
INSERT INTO Users (Name, Email, Age)
VALUES ('Invalid Age', 'invalid-age@email.com', 0);

-- Should fail: FOREIGN KEY constraint (UserID does not exist)
INSERT INTO Workout (WorkoutDate, DurationMinutes, WorkoutType, CaloriesBurned, UserID)
VALUES ('2026-03-04', 30, 'Cardio', 200, 999);