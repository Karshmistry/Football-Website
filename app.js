const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Match = require('./models/Match');
const app = express();


const cookieParser = require('cookie-parser');
const path = require('path');
const bodyParser = require('body-parser');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// Connect to MongoDB (Hardcoded Connection String for Local Use)
mongoose.connect("mongodb://127.0.0.1:27017/FootBallDb").then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

  app.get('/test', (req, res) => {
    console.log("✅ PUT /test hit successfully");
    res.send("Test route working!");
});
  app.get('/', (req, res) => {
    console.log("hey");
    res.render("index");
});
app.get('/startMatch', (req, res) => {
    console.log("hey");
    res.render("update_match.ejs");
});
app.get('/teams', (req, res) => {
    console.log("hey");
    res.render("teams.ejs");
});
app.get('/about', (req, res) => {
    console.log("hey");
    res.render("about.ejs");
});
app.get('/players', (req, res) => {
    console.log("hey");
    res.render("player.ejs");
});
app.get('/footBall', (req, res) => {
    // Render the intermediate page
    res.render('footBall.ejs');
});
// Create a new match
app.post('/match', async (req, res) => {
    try {
        const { team1, team2 } = req.body;
        const match = new Match({ team1, team2 });
        await match.save();
        res.status(201).json({ message: "Match created", match });
        console.log("team name saved ");
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update match details
app.post('/match/update/:id', async (req, res) => {
    console.log("✅ POST /match/update/:id hit");
    console.log("Match ID:", req.params.id);
    console.log("Request Body:", req.body);

    try {
        let { goals1, goals2, touchdowns1, touchdowns2, safeties1, safeties2, fouls1, fouls2, team1, team2 } = req.body;

        // Convert undefined or NaN values to 0
        goals1 = Number(goals1) || 0;
        goals2 = Number(goals2) || 0;
        touchdowns1 = Number(touchdowns1) || 0;
        touchdowns2 = Number(touchdowns2) || 0;
        safeties1 = Number(safeties1) || 0;
        safeties2 = Number(safeties2) || 0;
        fouls1 = Number(fouls1) || 0;
        fouls2 = Number(fouls2) || 0;

        let totalPoints1 = (goals1 * 3) + (touchdowns1 * 6) + (safeties1 * 2) - fouls1;
        let totalPoints2 = (goals2 * 3) + (touchdowns2 * 6) + (safeties2 * 2) - fouls2;

        let winner = "Draw";
        if (totalPoints1 > totalPoints2) winner = "Team 1 Wins";
        else if (totalPoints2 > totalPoints1) winner = "Team 2 Wins";

        // ✅ Update ALL fields, including match stats
        const updatedFields = {
            goals1, goals2, touchdowns1, touchdowns2, safeties1, safeties2, fouls1, fouls2,
            totalPoints1, totalPoints2, winner
        };

        // ✅ Also update team names if provided
        if (team1) updatedFields.team1 = team1;
        if (team2) updatedFields.team2 = team2;

        const match = await Match.findByIdAndUpdate(req.params.id, updatedFields, { new: true });

        res.json(match);
    } catch (error) {
        console.error("❌ Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Get match details
app.get('/match/:id', async (req, res) => {
    try {
        const match = await Match.findById(req.params.id);
        res.json(match);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(3000, () => {
    console.log("🚀 Server is running on port 3000");
}); 