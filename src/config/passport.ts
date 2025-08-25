// config/passport.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pool from './db.js'; // import your database connection

export default passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || "",      // use .env, not hardcode
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let email = profile?.emails?.[0]?.value || "";
        const googleId = profile.id;

        let result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        let user = result.rows[0];

        if (!user) {
            result = await pool.query(
                'INSERT INTO users (email, google_id, name) VALUES ($1, $2, $3) RETURNING *',
                [email, googleId, profile.displayName]
            );
            user = result.rows[0];
        }
        else {
            result = await pool.query(
                'UPDATE users SET google_id=$1, name=$2 WHERE email = $3',
                [googleId, profile.displayName, email]
            );
            user = result.rows[0];
        }

        return done(null, user);
    } catch (err) {
        return done(err, false);
    }
}));
