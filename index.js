require('dotenv').config();
const express = require('express');
const app = express();
const SpotifyWebApi = require('spotify-web-api-node');

const port = process.env.PORT || 3000;

// Spotify Web Api Client Credentials object
const spotifyApi = new SpotifyWebApi({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
});

app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => res.sendFile('/index.html'));

/* ENDPOINT TO GET RANDOM SONG */
app.get('/search', async (req, res) => {
    let success = false;
    let tries = 0;
    while (!success && tries !== 2) {
        try {
            // get playlists
            const playlists_data = await spotifyApi.searchPlaylists('indie r&b');
            // store total amount of playlists from response
            const playlists_total = playlists_data.body.playlists['total'];
            // set limit of playlists to receive from request
            const limit = 50;
            // set offset based on the amount of playlists (playlists_total)
            // API limits the offset to 10000 at max
            const offset = Math.floor(Math.random() * ((playlists_total > 10000 ? 10000 : playlists_total) - limit));
            // get playlists again but using the limit and offset values set above
            const playlists_data_final = await spotifyApi.searchPlaylists('indie r&b', {
                limit,
                offset
            });
            // set array of playlists obtained
            const playlists_arr = playlists_data_final.body.playlists['items'];
            //console.log("playlists_arr", playlists_arr);
            // select one playlist at random from playlists_arr
            const playlist = playlists_arr[Math.floor(Math.random() * playlists_arr.length)];
            //console.log("playlist", playlist)
            // get selected playlist's tracks
            const tracks = await spotifyApi.getPlaylistTracks(playlist.id);
            // select one track at random from tracks
            const track_data = tracks.body['items'][Math.floor(Math.random() * tracks.body['items'].length)]
            // send track's URI
            console.log("Track URI: ", track_data.track.uri)
            res.statusCode = 200;
            res.setHeader('Content-Type', 'Application/json');
            res.json({
                trackURI: track_data.track.uri
            });

            success = true;
            tries = 0;
        } catch (err) {
            console.log("Catch 1", err);
            if (err.statusCode === 401) {
                try {
                    // get credentials -> access token
                    let credential_data = await spotifyApi.clientCredentialsGrant();
                    let access_token = credential_data.body['access_token'];
                    // set access token for future use
                    spotifyApi.setAccessToken(access_token);
                } catch (err) {
                    console.log("Catch 2", err);
                }
            }
            tries++;
        }
    }
});


app.listen(port, () => console.log(`Example app listening on port ${port}!`));