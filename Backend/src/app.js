const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { getEnv, isAllowedOrigin } = require('./config/env');

function createApp() {
  const env = getEnv();
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // Non-browser / same-origin tools may omit Origin.
        if (!origin) {
          return callback(null, true);
        }
        if (isAllowedOrigin(origin, env.clientOrigins, env.isProd)) {
          return callback(null, true);
        }
        // Do not throw — throwing skips CORS headers and the browser
        // only reports a generic CORS failure.
        console.warn(`CORS blocked for origin: ${origin}`);
        return callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.use('/api/v1', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
module.exports.createApp = createApp;
