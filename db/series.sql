USE trakit_db;

CREATE TABLE series (
    id INT PRIMARY KEY,
    title VARCHAR(255),
    genre VARCHAR(255),
    first_air_date DATE,
    description TEXT,
    poster_path VARCHAR(255),
    tmdb_id INT UNIQUE
);