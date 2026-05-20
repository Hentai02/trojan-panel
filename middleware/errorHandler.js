function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}:`, err.message);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body too large' });
  }

  const status = err.status || err.statusCode || 500;
  const message = status === 500 ? 'Internal server error' : err.message;

  res.status(status).json({ error: message });
}

function notFound(req, res) {
  if (req.accepts('html')) {
    return res.status(404).type('text/html').send('<h1>404 Not Found</h1>');
  }
  res.status(404).json({ error: 'Not found' });
}

module.exports = { errorHandler, notFound };
