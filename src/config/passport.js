const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const env = require('./env');
const User = require('../models/User');

passport.use(
  new GoogleStrategy(
    {
      clientID: env.googleClientId,
      clientSecret: env.googleClientSecret,
      callbackURL: env.googleCallbackUrl,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) return done(null, false, { message: 'Conta Google sem email público' });

        const givenName = profile.name?.givenName || profile.displayName || email.split('@')[0];
        const familyName = profile.name?.familyName || '';

        let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] }).select('+refreshToken');
        if (!user) {
          user = await User.create({
            nome: givenName,
            sobrenome: familyName,
            email,
            googleId: profile.id,
          });
        } else if (!user.googleId) {
          user.googleId = profile.id;
          if (!user.sobrenome && familyName) user.sobrenome = familyName;
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

module.exports = passport;
