// config/passport.js
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import pool from "./db.js"; // database connection

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {

                const email = profile?.emails?.[0]?.value || "";
                const googleId = profile.id;

                let result = await pool.query("SELECT * FROM users WHERE email = $1", [
                    email,
                ]);
                let user = result.rows[0];

                if (!user) {
                    // Insert new user
                    result = await pool.query(
                        "INSERT INTO users (email, google_id, name) VALUES ($1, $2, $3) RETURNING *",
                        [email, googleId, profile.displayName]
                    );
                    user = result.rows[0];
                } else {
                    // Update existing user
                    result = await pool.query(
                        "UPDATE users SET google_id=$1, name=$2 WHERE email = $3 RETURNING *",
                        [googleId, profile.displayName, email]
                    );
                    user = result.rows[0];
                }
                console.log("ana geet hna");
                return done(null, user);
            } catch (err) {
                return done(err, false);
            }
        }
    )
);

// ✅ Export the configured passport
export default passport;
