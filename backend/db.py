import sqlite3
import os

def get_connection():
    db_path = os.path.join(os.path.dirname(__file__), "..", "fitness.db")
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON")
    return conn