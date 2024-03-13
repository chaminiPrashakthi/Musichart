const express = require('express');
const http = require('http');
const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const validator = require('validator');
const cors = require('cors')

const HOST = 'localhost';
const PORT = 8000;
const musixMatchApiKey = '8e343bd24865f49e56ffb12348bb9ccf';
const musixMatchApiUrl = 'https://api.musixmatch.com/ws/1.1';

// Common configuration object for API requests
const apiConfig = {
    params: {
        apikey: musixMatchApiKey,
    },
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(cors());


// Enable CORS headers
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Credentials', false);
    next();
});


// DB config
mongoose.connect('mongodb://localhost:27017/musichart');

// Create a user schema
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: (value) => validator.isEmail(value),
            message: 'Please enter a valid email address',
        },
    },
    password: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
});

// Create a user model for the 'user' collection
const User = mongoose.model('User', userSchema);

// User registration
app.post('/register', async (req, res) => {
    try {
        const { email, password, phone, country } = req.body;
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ error: 'User already registerd' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ email, password: hashedPassword, phone, country });
        await newUser.save();

        const token = jwt.sign({ email, country }, 'secretKey', { expiresIn: '1h' });
        return res
            .status(201)
            .json({ token: token, message: "Successfully logged in", user: newUser})

    } catch (error) {
        if (error.name === 'ValidationError') {
            const validationErrors = Object.keys(error.errors).map((key) => ({
                field: key,
                message: error.errors[key].message,
            }));
            return res.status(400).json({ error: validationErrors });
        }
        console.error('Error registering the user:', error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }

});

// User login
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        // Check if the user exists
        if (!user) {
            return res.status(401).json({ message: 'User not exists' });
        }
        const Comparepassword = await bcrypt.compare(password, user.password);
        const user_country = user.country
        if (!Comparepassword) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const token = jwt.sign({ email, user_country }, 'secretKey', { expiresIn: '8h' });
        return res
            .status(201)
            .json({ token: token, message: "Successfully logged in", user: user })
    } catch (error) {
        console.error('Error logging in user:', error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Fetch top  artists for the user's country
app.get('/topArtists/:country', async (req, res) => {
    try {
        const country = req.params.country
        const response = await axios.get(`${musixMatchApiUrl}/chart.artists.get`, {
            params: {
                ...apiConfig.params,
                country: country
            },
        });
        const { status, data } = response;
        const artistsData = data.message.body.artist_list;

        return res.status(status).json({ artistsData });

    } catch (error) {
        console.error('Error fetching top three artists:', error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }

});

// Fetch last 3 released albums for a specific artist
app.get('/albums/:artistId', async (req, res) => {
    try {
        const artistId = req.params.artistId;

        const response = await axios.get(`${musixMatchApiUrl}/artist.albums.get?page_size=3`, {
            params: {
                ...apiConfig.params,
                artist_id: artistId,
                s_release_date: 'desc',
            },
        });

        const { status, data } = response;
        const albums = data.message.body.album_list;
        return res.status(status).json({ albums });
    } catch (error) {
        console.error('Error fetching albums:', error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }


});

// Fetch lyrics for a specific album
app.get('/lyrics/:albumId', async (req, res) => {
    try {
        const albumId = req.params.albumId;
        const tracksResponse = await axios.get(`${musixMatchApiUrl}/album.tracks.get`, {
            params: {
                ...apiConfig.params,
                album_id: albumId,
            },
        });
        const tracks = tracksResponse.data.message.body.track_list;

        // Fetch lyrics for each track
        const tracksWithLyrics = await Promise.all(
            tracks.map(async (track) => {
                const trackId = track.track.track_id;

                // Example API endpoint: track.lyrics.get
                const lyricsResponse = await axios.get(`${musixMatchApiUrl}/track.lyrics.get`, {
                    params: {
                        ...apiConfig.params,
                        track_id: trackId,
                    },
                });

                const lyrics = lyricsResponse.data.message.body.lyrics;
                // Return track details along with lyrics
                return {
                    track: track.track,
                    lyrics: lyrics,
                };
            })
        );
        return res.json(tracksWithLyrics);

    } catch (error) {
        // Handle errors appropriately
        console.error('Error fetching lyrics:', error.message);
        return res.status(500).json({ error: 'Internal Server Error' });
    }

});


app.listen(PORT, () => {
    console.log(`Server is running on port ${HOST} and ${PORT}`);
});
