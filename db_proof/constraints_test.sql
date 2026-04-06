PRAGMA foreign_keys = ON;

-- Test 1: CHECK constraint (negative calories not allowed)
-- Trigger: prevent_negative_calories fires BEFORE INSERT on FoodLog
INSERT INTO FoodLog (FoodName, Calories, LogDate, UserID)
VALUES ('Bad Food', -10, '2026-03-01', 1);
-- Expected error: Calories cannot be negative

-- Test 2: UNIQUE constraint (duplicate email)
INSERT INTO Users (Name, Email, Age)
VALUES ('Duplicate User', 'alex@email.com', 22);
-- Expected error: UNIQUE constraint failed: Users.Email

-- Test 3: NOT NULL constraint (Name cannot be NULL)
INSERT INTO Users (Name, Email, Age)
VALUES (NULL, 'noname@email.com', 20);
-- Expected error: NOT NULL constraint failed: Users.Name

-- Test 4: CHECK constraint (Age must be > 0)
INSERT INTO Users (Name, Email, Age)
VALUES ('Invalid Age', 'invalid-age@email.com', 0);
-- Expected error: CHECK constraint failed: Age > 0

-- Test 5: FOREIGN KEY constraint (UserID 999 does not exist)
INSERT INTO Workout (WorkoutDate, DurationMinutes, WorkoutType, CaloriesBurned, UserID)
VALUES ('2026-03-04', 30, 'Cardio', 200, 999);
-- Expected error: FOREIGN KEY constraint failed