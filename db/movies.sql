USE trakit_db;

CREATE TABLE IF NOT EXISTS movies (
    id INT PRIMARY KEY,
    title VARCHAR(255),
    genre VARCHAR(255),
    release_date DATE,
    description TEXT,
    poster_path VARCHAR(255),
    tmdb_id INT UNIQUE
);