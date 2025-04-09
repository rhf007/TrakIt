import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();
import {MovieDb} from 'moviedb-promise';
import bcrypt from 'bcrypt';
import pool from './db/connect.js';
import session from 'express-session';

//this stores session data securely and makes session persistent 
//even when reloading to prevent the user from signin on every page or every reload
import MySQLStore from 'express-mysql-session';
const mysqlStore = MySQLStore(session);
const sessionStore = new mysqlStore({}, pool);

const app = express();
const __dirname = path.resolve();
const moviedb = new MovieDb(process.env.TMDB_API_KEY);

//get styles and scripts from public folder
app.use(express.static('./public'));

// Set views folder location and use EJS as template engine for rendering pages
app.set('views', path.join(__dirname, 'public'));
app.set('view engine', 'ejs');

//to avoid form submission errors
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: { 
        httpOnly: true,
        secure: false,
        maxAge: 40000 * 60 * 60 * 24 * 1000
    }
}));

//home/index page
app.get('/', async(req, res) => {
    //get relevant movies and series
    let now_playing_movies = [];
    let popular_movies = [];
    let top_rated_movies = [];
    let upcoming_movies =[];
    let airing_today_series = [];
    let popular_series = [];
    let on_the_air_series = [];
    let top_rated_series = [];
    
    try {
        const now_playing_results = await moviedb.movieNowPlaying();
        now_playing_movies.push(...now_playing_results.results);
        
        const popular_results = await moviedb.moviePopular();
        popular_movies.push(...popular_results.results);
        
        const top_rated_results = await moviedb.movieTopRated();
        top_rated_movies.push(...top_rated_results.results);
        
        const upcoming_results = await moviedb.upcomingMovies();
        upcoming_movies.push(...upcoming_results.results);
        
        const airing_today_results = await moviedb.tvAiringToday();
        airing_today_series.push(...airing_today_results.results);
        
        const popular_series_results = await moviedb.tvPopular();
        popular_series.push(...popular_series_results.results);
        
        const on_the_air_results = await moviedb.tvOnTheAir();
        on_the_air_series.push(...on_the_air_results.results);
        
        const top_rated_series_results = await moviedb.tvTopRated();
        top_rated_series.push(...top_rated_series_results.results);
        
        res.render('index', {
            now_playing_movies: now_playing_movies,
            popular_movies: popular_movies,
            top_rated_movies: top_rated_movies,
            upcoming_movies: upcoming_movies,
            airing_today_series: airing_today_series,
            popular_series: popular_series,
            on_the_air_series: on_the_air_series,
            top_rated_series: top_rated_series,
            user: req.session.user
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
});

//sign in page
app.get('/sign-in', (req, res) => {
    res.render('sign-in', { errors: [] });
});

//register page
app.get('/register', (req, res) => {
    res.render('register', { errors: [] });
});
    
//validation for both sign in and register
app.post('/validate', async (req, res) => {
    const { username, email, password, 'confirm-password': confirm_password } = req.body;
    const errors = [];
    //check if its the register form
    const isRegistration = username && confirm_password;
    
    if (!email || !password) {
        errors.push('Email and password are required.');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email && !emailRegex.test(email)) {
        errors.push('Invalid email address.');
    }
    
    if (password && password.length < 8) {
        errors.push('Password must be at least 8 characters.');
    }
    
    //checking form data and existence of the user
    if (isRegistration) {
        if (!username) {
            errors.push('Username is required.');
        }
        
        if (password !== confirm_password) {
            errors.push('Passwords do not match.');
        }
        
        try {
            const [existingUser] = await pool.query(
                'SELECT * FROM users WHERE username = ? OR email = ?',
                [username, email]
            );
            if (existingUser.length > 0) {
                errors.push('Username or email already exists.');
            }
        } catch (error) {
            console.error('Database error during registration check:', error);
            return res.status(500).send('Internal Server Error.');
        }
    }
    
    //if there are errors display them
    if (errors.length > 0) {
        const view = isRegistration ? 'register' : 'sign-in';
        return res.status(400).render(view, { errors });
    }
    
    //if the register form is filled with all the right/appropriate values
    //start saving the user in the database
    if (isRegistration) {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            const [result] = await pool.query(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                [username, email, hashedPassword]
            );
            
            const userId = result.insertId;
            
            // Store userId in session
            req.session.user = { userId, username, email };
            
            return res.redirect('/');
        } catch (error) {
            console.error('Error inserting user during registration:', error);
            return res.status(500).send('Internal Server Error.');
        }
    }
    
    //if its the sign in form
    //check credentials from the database
    try {
        const [user] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (user.length === 0) {
            errors.push('Invalid email or password.');
            return res.status(400).render('sign-in', { errors });
        }
        
        const isPasswordValid = await bcrypt.compare(password, user[0].password);
        if (!isPasswordValid) {
            errors.push('Invalid email or password.');
            return res.status(400).render('sign-in', { errors });
        }
        
        // Include userId in the session
        req.session.user = {
            userId: user[0].id,
            username: user[0].username,
            email: user[0].email,
        };
        
        return res.redirect('/');
    } catch (error) {
        console.error('Database error during login:', error);
        return res.status(500).send('Internal Server Error.');
    }
});
    
// handle sessions in other routes
app.use((req, res, next) => {
    if (req.session.user) {
        res.locals.user = req.session.user;
    }
    next();
});

//movies page
app.get('/movies', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    let Movies = [];
    //get movies along with some more data to populate filters
    try {
        
        const movieResults = await moviedb.discoverMovie({ page });
        Movies = movieResults.results;
        
        const genreResponse = await moviedb.genreMovieList();
        const genres = genreResponse.genres;
        const countries = await moviedb.countries();
        
        const totalPages = movieResults.total_pages;
        const currentPage = movieResults.page;
        
        res.render('movies', {
            movies: Movies,
            genres,
            countries,
            currentPage,
            totalPages,
        });
    } catch (error) {
        console.error(`Error fetching data: ${error}`);
        res.status(500).send('Internal Server Error');
    }
});

//little api to fetch movies according to selected filters
//this api is the midpoint between  the frontend and tmdb 
// instead of making the call directly from the frontend
app.get('/api/movies', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const { year, genre, country, runtime } = req.query;
    
    //sort by popularity
    try {
        const discoverOptions = {
            page,
            sort_by: 'popularity.desc'
        };
        
        if (year) {
            discoverOptions.primary_release_year = year;
        }
        
        if (genre) {
            discoverOptions.with_genres = genre;
        }
        
        if (country) {
            discoverOptions.with_origin_country = country;
        }
        
        if (runtime) {
            switch (runtime) {
                case 'short':
                discoverOptions['with_runtime.lte'] = 90;
                break;
                case 'medium':
                discoverOptions['with_runtime.gte'] = 90;
                discoverOptions['with_runtime.lte'] = 120;
                break;
                case 'long':
                discoverOptions['with_runtime.gte'] = 120;
                break;
            }
        }
        
        //send to tmdb
        const movieResults = await moviedb.discoverMovie(discoverOptions);
        
        //convert to json and send back to frontend
        res.json({
            movies: movieResults.results,
            currentPage: movieResults.page,
            totalPages: movieResults.total_pages
        });
    } catch (error) {
        console.error(`Error fetching filtered movies: ${error}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//popular,playing now, top rated and upcoming movies
app.get('/movies/:category', async (req, res) => {
    const category = req.params.category;
    let page = parseInt(req.query.page) || 1;
    
    try {
        let category_results;
        
        switch(category) {
            case 'now_playing':
            category_results = await moviedb.movieNowPlaying({ page });
            break;
            case 'popular':
            category_results = await moviedb.moviePopular({ page });
            break;
            case 'top_rated':
            category_results = await moviedb.movieTopRated({ page });
            break;
            case 'upcoming':
            category_results = await moviedb.upcomingMovies({ page });
            break;
            default:
            return res.status(400).send('Invalid category');
        }
        
        //data for filters
        const genreResponse = await moviedb.genreMovieList();
        const genres = genreResponse.genres;
        const countries = await moviedb.countries();
        const movies = category_results.results;
        // in the popular endpoint in tmdb,
        // the same number of totalpages in the discover endpoint is returned
        //  so in case the popular endpoint is chosen the pages are limited to  500
        //  because any page beyond 500 returns status code 22
        // same with series
        let total_pages = category_results.total_pages;
        if (category === 'popular' && total_pages > 500) {
            total_pages = 500;
        }
        
        res.render('movies', {
            movies: movies,
            category: category,
            genres: genres,
            countries: countries,
            totalPages: total_pages,
            currentPage: page
        });
    } catch (error) {
        console.error(`Error fetching data: ${error}`);
        res.status(500).send('Internal Server Error');
    }
});

//series page
app.get('/series', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    let tv = [];

    //get series along with some more data to populate filters
    try {
        
        const tvResults = await moviedb.discoverTv({ page });
        tv = tvResults.results;
        
        const genreResponse = await moviedb.genreTvList();
        const genres = genreResponse.genres;
        const countries = await moviedb.countries();
        
        const totalPages = tvResults.total_pages;
        const currentPage = tvResults.page;
        
        res.render('series', {
            series: tv,
            genres,
            countries,
            currentPage,
            totalPages,
        });
    } catch (error) {
        console.error(`Error fetching data: ${error}`);
        res.status(500).send('Internal Server Error');
    }
})

//little api to fetch series according to selected filters
//this api is the midpoint between  the frontend and tmdb 
// instead of making the call directly from the frontend
app.get('/api/series', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const { year, genre, country } = req.query;
    
    //sort by popularity
    try {
        const discoverOptions = {
            page,
            sort_by: 'popularity.desc'
        };
        
        if (year) {
            discoverOptions.first_air_date_year = year;
        }
        
        if (genre) {
            discoverOptions.with_genres = genre;
        }
        
        if (country) {
            discoverOptions.with_origin_country = country;
        }
        
        //send to tmdb
        const seriesResults = await moviedb.discoverTv(discoverOptions);

        //convert to json and send back to frontend
        res.json({
            series: seriesResults.results,
            currentPage: seriesResults.page,
            totalPages: seriesResults.total_pages
        });
    } catch (error) {
        console.error(`Error fetching filtered series: ${error}`);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

//popular, airing now, on the air, and top rated series
app.get('/series/:category', async (req, res) => {
    const category = req.params.category;
    let page = parseInt(req.query.page) || 1;
    
    try {
        let category_results;
        
        switch (category) {
            case 'airing_today':
            category_results = await moviedb.tvAiringToday({page})
            break;
            case 'on_the_air':
            category_results = await moviedb.tvOnTheAir({page})
            break;
            case 'popular':
            category_results = await moviedb.tvPopular({ page });
            break;
            case 'top_rated':
            category_results = await moviedb.tvTopRated({page})
            break;
            default:
            return res.status(400).send('Invalid category');
        }

        //data for filters
        const genreResponse = await moviedb.genreTvList();
        const genres = genreResponse.genres;
        const countries = await moviedb.countries();
        const tvs = category_results.results;
        
        let total_pages = category_results.total_pages;
        if (category === 'popular' && total_pages > 500) {
            total_pages = 500;
        }
        
        res.render('series', {
            series: tvs,
            category: category,
            genres: genres,
            countries: countries,
            totalPages: total_pages,
            currentPage: page
        });
    }
    catch (error) {
        console.error(`Error fetching data: ${error}`);
        res.status(500).send('Internal Server Error');
    }
})

//movie details when a movie card is clicked
app.get('/movie/details/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const movieDetails = await moviedb.movieInfo({ id });
        res.render('details', { details: movieDetails, type: 'movie' });
    } catch (error) {
        console.error('Error fetching movie details:', error);
        res.status(500).send('Internal Server Error');
    }
});

//series details when a show card is clicked
app.get('/series/details/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const seriesDetails = await moviedb.tvInfo({ id });
        
        res.render('details', { details: seriesDetails, type: 'series' });
    } catch (error) {
        console.error('Error fetching series details:', error);
        res.status(500).send('Internal Server Error');
    }
});

//search page
app.get('/search', async (req, res) => {
    const query = req.query.query;
    const page = parseInt(req.query.page) || 1;
    
    if (!query) {
        return res.redirect('/');
    }
    
    try {
        const searchResults = await moviedb.searchMulti({
            query: query,
            page: page
        });
        
        //only get movies and series
        const filteredResults = searchResults.results
            .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
            .sort((a, b) => b.popularity - a.popularity);
        
        res.render('search', {
            results: filteredResults,
            query: query,
            currentPage: page,
            totalPages: searchResults.total_pages,
            totalResults: searchResults.total_results
        });
        
    } catch (error) {
        console.error(`Error searching: ${error}`);
        res.status(500).render('error', { 
            message: 'An error occurred while searching' 
        });
    }
});

//adding to a user's list
app.post('/watchlist/add', async (req, res) => {
    // if user is not signed in
    if (!req.session.user) {
        return res.status(401).json({ error: 'Please sign up or log in to add items to your watchlist.' });
    }
    try {
        const { media_id, media_type, status } = req.body;
        const user_id = req.session.user.userId;

        //get movie details
        const details = media_type === 'movie' ? await moviedb.movieInfo(media_id) : await moviedb.tvInfo(media_id);

        // Cache necessary movie details to avoid redundant calls to tmdb
        await pool.query(
            'INSERT INTO movies_cache (media_id, title, poster_path) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE title = ?, poster_path = ?',
            [media_id, details.title || details.name, details.poster_path, details.title || details.name, details.poster_path]
        );

        // insert into list and update status if it already exists
        await pool.query(
            'INSERT INTO watchlists (user_id, media_id, media_type, status) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = ?',
            [user_id, media_id, media_type, status, status]
        );

        res.status(200).json({ message: 'Successfully added to watchlist' });
    } catch (error) {
        console.error('Error adding to watchlist:', error);
        res.status(500).json({ error: 'Error adding to watchlist' });
    }
});

//display user's list
app.get('/list', async (req, res) => {
    // redirect if user isn't signed in
    if (!req.session.user) {
        return res.redirect('/sign-in');
    }

    //get from the cache
    try {
        const query = `
            SELECT 
                w.*,
                m.title,
                m.poster_path
            FROM watchlists w
            LEFT JOIN (
                SELECT DISTINCT media_id, title, poster_path
                FROM movies_cache
            ) m ON w.media_id = m.media_id
            WHERE w.user_id = ?
            ORDER BY w.added_at DESC
        `;

        const [watchlist] = await pool.query(query, [req.session.user.userId]);
        res.render('list', { watchlist });
    } catch (error) {
        console.error('Error fetching watchlist:', error);
        res.status(500).send('Error fetching watchlist');
    }
});

//logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
        }
        res.redirect('/');
    });
});

app.listen(5000, () => {
    console.log('server listening on port 5000')
});