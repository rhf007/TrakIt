CREATE DATABASE IF NOT EXISTS trakit_db;
USE trakit_db;

-- Create the watchlists table
CREATE TABLE IF NOT EXISTS watchlists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    media_id INTEGER NOT NULL,
    media_type ENUM('movie', 'series') NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('to_watch','completed','on_hold','dropped','watching') DEFAULT 'to_watch',
    UNIQUE(user_id, media_id, media_type)
);

-- Create the movies_cache table to avoid making requests to the API for the same movie multiple times
-- The poster_path is stored to avoid making requests to the API for the poster image
-- The media_id is the primary key to avoid duplicates
CREATE TABLE IF NOT EXISTS movies_cache (
    media_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    poster_path VARCHAR(255),
    PRIMARY KEY (media_id)
);