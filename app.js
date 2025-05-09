const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Match = require('./models/Match');
const userModel = require("./models/user");
const app = express();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const cookieParser = require('cookie-parser');
const path = require('path');
const bodyParser = require('body-parser');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
app.get('/loginpage', (req, res) => {
    res.render('login.ejs'); // Renders login.ejs
});
app.post('/loginpage', (req, res) => {
    res.render('login.ejs'); // Renders login.ejs
});
app.post('/register', async (req, res) => {
    let { username, email, password } = req.body;
    let user = await userModel.findOne({ email })
    if (user) return res.status(500).send({ message: "user already exists" })
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
            let user = await userModel.create({
                username,
                email,
                password: hash
            });
            let token = jwt.sign({ email: email, userid: user._id }, "shhhh");
            res.cookie("token", token);
            res.redirect('/'); 
        })
    });
})
app.post('/logining', async (req, res) => {
    console.log("he");
    let { email, password } = req.body;
    let user = await userModel.findOne({ email });

    // Check if user exists
    if (!user) return res.status(404).send("User  not found");

    // Compare password
    bcrypt.compare(password, user.password, (err, result) => {
        if (err) return res.status(500).send("Error comparing passwords");
        if (result) {

            let token = jwt.sign({ email: email, userid: user._id }, "shhhh");
            res.cookie("token", token);
            res.redirect('/');      //res.status(200).send("You can login");
        } else {
            res.status(401).send("Incorrect password");
        }
    });
});
app.get('/logout', (req, res) => {
    res.cookie("token", "");
    res.redirect('/loginpage');
});
app.get('/news', (req,res) => {
    res.render("rugbNews.ejs");
})
function isLoggedIn(req, res, next) {
    if (req.cookies.token === "") res.send("you must be logged in");// when verified after checcking orther things res.redirect('/loginpage');
    else {
        let data = jwt.verify(req.cookies.token, "shhhh");
        req.user = data;
        next();
    }

}

app.get('/startMatch', isLoggedIn, (req, res) => {
    console.log("hey");
    res.render("update_match.ejs");
});
app.get('/teams', isLoggedIn, (req, res) => {
    console.log("hey");
    res.render("teams.ejs");
});
app.get('/about', (req, res) => {
    console.log("hey");
    res.render("about.ejs");
});
app.get('/players', isLoggedIn, (req, res) => {
    console.log("hey");
    res.render("player.ejs");
});
app.get('/footBall', isLoggedIn, (req, res) => {
    // Render the intermediate page
    res.render('footBall.ejs');
});
app.get('/chart', isLoggedIn, (req, res) => {
    // Render the intermediate page
    res.render('chart.ejs');
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

app.get('/localTeams', isLoggedIn, async (req, res) => {
    try {
        let liveMatches = await Match.find({ status: "Live" });
        res.render("localTeams", { liveMatches });
    } catch (error) {
        console.error("❌ Error fetching live matches:", error);
        res.status(500).send("Server Error");
    }
});

// Start server
app.listen(3000, () => {
    console.log("🚀 Server is running on port 3000");
}); 