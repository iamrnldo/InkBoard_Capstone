const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const { query } = require("./database");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const existingUser = await query(
          "SELECT * FROM users WHERE email = $1 OR (oauth_provider = $2 AND oauth_id = $3)",
          ["google", profile.id, email],
        );

        if (existingUser.rows.length > 0) {
          const user = existingUser.rows[0];
          if (!user.oauth_provider) {
            await query(
              "UPDATE users SET oauth_provider = $1, oauth_id = $2, avatar_url = $3, email_verified = true WHERE id = $4",
              ["google", profile.id, profile.photos[0]?.value, user.id],
            );
          }
          return done(null, existingUser.rows[0]);
        }

        const username =
          profile.displayName.replace(/\s+/g, "").toLowerCase() +
          "_" +
          Math.random().toString(36).substr(2, 5);
        const newUser = await query(
          `INSERT INTO users (id, username, email, oauth_provider, oauth_id, avatar_url, email_verified, plan, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, true, 'lite', NOW()) RETURNING *`,
          [
            uuidv4(),
            username,
            email,
            "google",
            profile.id,
            profile.photos[0]?.value,
          ],
        );

        return done(null, newUser.rows[0]);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ["user:email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email =
          profile.emails?.[0]?.value || `${profile.username}@github.local`;
        const existingUser = await query(
          "SELECT * FROM users WHERE email = $1 OR (oauth_provider = $2 AND oauth_id = $3)",
          [email, "github", String(profile.id)],
        );

        if (existingUser.rows.length > 0) {
          const user = existingUser.rows[0];
          if (!user.oauth_provider) {
            await query(
              "UPDATE users SET oauth_provider = $1, oauth_id = $2, avatar_url = $3, email_verified = true WHERE id = $4",
              ["github", String(profile.id), profile.photos[0]?.value, user.id],
            );
          }
          return done(null, existingUser.rows[0]);
        }

        const username =
          profile.username + "_" + Math.random().toString(36).substr(2, 5);
        const newUser = await query(
          `INSERT INTO users (id, username, email, oauth_provider, oauth_id, avatar_url, email_verified, plan, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, true, 'lite', NOW()) RETURNING *`,
          [
            uuidv4(),
            username,
            email,
            "github",
            String(profile.id),
            profile.photos[0]?.value,
          ],
        );

        return done(null, newUser.rows[0]);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const result = await query("SELECT * FROM users WHERE id = $1", [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
