CREATE TABLE IF NOT EXISTS releases (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    genre VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    cover_url TEXT,
    audio_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_releases_genre ON releases(genre);
CREATE INDEX idx_releases_year ON releases(year);
CREATE INDEX idx_releases_created_at ON releases(created_at DESC);