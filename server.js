const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const config = require('./config');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const logsRouter = require('./routes/logs');
const configRouter = require('./routes/config');
const statusRouter = require('./routes/status');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

const sessions = new Map();
app.locals.sessions = sessions;

setInterval(() => {
  const now = Date.now();
  for (const [token, entry] of sessions) {
    if (now - entry.createdAt > config.SESSION_MAX_AGE) {
      sessions.delete(token);
    }
  }
}, config.SESSION_CLEANUP_INTERVAL);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use('/auth', authRouter);

app.use((req, res, next) => {
  if (req.path === '/login.html' || req.path.startsWith('/auth/')) {
    return next();
  }
  const token = req.cookies?.session_token;
  if (token && sessions.has(token)) {
    return next();
  }
  if (req.accepts('html')) {
    return res.redirect('/login.html');
  }
  res.status(401).json({ error: 'Unauthorized' });
});

app.use(express.static('public', { maxAge: '1h' }));

app.use('/users', usersRouter);
app.use('/logs', logsRouter);
app.use('/config', configRouter);
app.use('/status', statusRouter);

app.use(notFound);
app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log(`Server running on http://localhost:${config.PORT}`);
});
