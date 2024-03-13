# Conpago Full-stack Coding Test:

## Features

- New users can register for the application using a valid email address.
- Users can log in to the system with their existing email address and password.
- When a user logs into the system, they will be navigated to the Artists page, which displays top-charting artists based on the user's country.
- Clicking on an artist's name will display the last three released albums of the artist.
- Clicking on an album will display the lyrics for songs included in that album.
- Included a caching API on the client side to improve performance and reduce the load (used localStorage because the data load is not significant).

## Technologies Used

- BE - NodeJs
- FE - reactJs/ Material UI components and templates
- DB - Mongo DB

## Libraries Used
 
- Axios -  making HTTP requests
- redux store (react-redux)
- js-cookie - to keep the jwt token from user authentication

## Prerequisites

- NPM latest version
- NodeJs latest version

## Getting Started

1. Clone the repository:
git clone https://github.com/chaminiPrashakthi/Musichart

2. Build and run the application using npm:

### BE:
npm install
npm start

### FE:
cd lyricschartclient
npm install
npm start 

## API Endpoints

- `POST /register`: Registe a new user.
- `POST /login`: Log a user.
- `GET /topArtists/${country}`: Get tops artists.
- `GET /albums/${artistId}`: get latest albums.
- `GET /lyrics/${albumId}`: Get all lyrics of the album.

## Unit Testing

//TODO