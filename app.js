const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('./db'); // Import the database connection
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const e = require('express');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;
const SECRET_KEY = process.env.SECRET_KEY || 'c15afo';

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My API',
      version: '1.0.0',
      description: 'A simple API with JWT authentication',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./app.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middleware to authenticate JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Generate JWT token
 *     description: Authenticates the user and returns a JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               telegram_id:
 *                 type: string
 *                 example: testuser
 *     responses:
 *       200:
 *         description: Returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: JWT token
 *       401:
 *         description: Invalid credentials
 */
app.post('/login', (req, res) => {
  db.query('SELECT * FROM account WHERE telegram_id = ?', [req.body.telegram_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(401).json({ message: 'Invalid credentials' });
    const user = results[0];
  
    db.query('SELECT * FROM statistic WHERE account_id = ?', [user.account_id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) return res.status(401).json({ message: 'Invalid credentials' });
      statistic = results[0];

      db.query('SELECT * FROM cat_lucky WHERE account_id = ?', [req.user.account_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
    
        var catLuckyData = {
          stage: 0,
          current_stage_result: "",
          collected_coin: 0,
          collected_gem: 0,
          collected_shard: 0,
          collected_ton: 0,
          collected_bnb: 0,
          collected_plays: 0,
          lock_until: now.toLocaleString()
        };
    
        if (results.length === 1) {
          var cat_lucky = results[0];
          catLuckyData.stage = cat_lucky.stage;
          catLuckyData.current_stage_result = cat_lucky.current_stage_result;
          catLuckyData.collected_coin = cat_lucky.collected_coin;
          catLuckyData.collected_gem = cat_lucky.collected_gem;
          catLuckyData.collected_shard = cat_lucky.collected_shard;
          catLuckyData.collected_ton = cat_lucky.collected_ton;
          catLuckyData.collected_bnb = cat_lucky.collected_bnb;
          catLuckyData.collected_plays = cat_lucky.collected_plays;
          catLuckyData.lock_until = cat_lucky.lock_until;
        }
        
        const accessToken = jwt.sign({
          id: user.id,
          telegram_id: user.telegram_id,
          account_id: user.account_id,
          display_name: user.display_name,
          ton: statistic.ton,
          bnb: statistic.bnb,
          plays: statistic.plays,
          cat_lucky: catLuckyData
        }, SECRET_KEY);
        res.json({ accessToken });

      });
    });
  });
});

/**
 * @swagger
 * /protected:
 *   get:
 *     summary: Protected route
 *     description: Returns a protected message if a valid JWT token is provided.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns a protected message
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
app.get('/protected', authenticateToken, (req, res) => {
  var responsesData = {
    telegram_id: req.user.telegram_id,
    display_name: req.user.display_name,
    ton: req.user.ton,
    bnb: req.user.bnb,
    plays: req.user.plays
  };
  res.json({ message: 'This is a protected route', user: responsesData });
});

/**
 * @swagger
 * /cat_lucky/get_status:
 *   get:
 *     summary: Get account cat lucky game status
 *     description: Returns a protected message if a valid JWT token is provided.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns a protected message
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
app.get('/cat_lucky/get_status', authenticateToken, (req, res) => {
  res.json({
    result: req.user.catLuckyData
  });
});

/**
 * @swagger
 * /cat_lucky/play_stage:
 *   get:
 *     summary:
 *     description:
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stage:
 *                   type: int
 *                   example: 0
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
app.get('/cat_lucky/play_stage', authenticateToken, (req, res) => {
  var playStage = req.body.stage;
  console.log(playStage);
  var currentStage = res.user.catLuckyData.stage;
  console.log(currentStage);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
