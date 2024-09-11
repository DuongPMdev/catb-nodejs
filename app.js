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
        
      const accessToken = jwt.sign({
        id: user.id,
        telegram_id: user.telegram_id,
        account_id: user.account_id,
        display_name: user.display_name,
        ton: statistic.ton,
        bnb: statistic.bnb,
        plays: statistic.plays,
      }, SECRET_KEY);
      res.json({ accessToken });

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
  const now = new Date();
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

    res.json({
      result: catLuckyData
    });

  });
});

/**
 * @swagger
 * /cat_lucky/play_stage:
 *   post:
 *     summary:
 *     description:
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stage:
 *                   type: int
 *                   example: 0
 *                 end_game:
 *                   type: boolean
 *                   example: false
 *     responses:
 *       200:
 *         description:
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
app.post('/cat_lucky/play_stage', authenticateToken, (req, res) => {
  const now = new Date();
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

    var playStage = req.body.stage;
    var isEndGame = req.body.end_game;
    if (playStage !== currentStage) {
      return res.json({
        result: catLuckyData
      });
    }
    else if (playStage === currentStage) {
      if (isEndGame == false) {
        var currentStageResult = catLuckyData.current_stage_result;
        if (currentStageResult !== "") {
          var currentStageResultArray = currentStageResult.split(",");
          var firstCurrentStageResult = currentStageResultArray[0];
          var firstCurrentStageResultArray = firstCurrentStageResult.split(":");
          var type = firstCurrentStageResultArray[0];
          var value = firstCurrentStageResultArray[1];
          if (type === "GAMEOVER") {
            catLuckyData.stage = 0;
            catLuckyData.current_stage_result = "";
          }
          else{
            catLuckyData.stage++;
            catLuckyData.current_stage_result = getStageResult();
            if (type === "COIN") {
              catLuckyData.collected_coin += value;
            }
          }
        }
      }
    }

    if (results.length === 1) {
      db.query('UPDATE cat_lucky SET stage = ?, current_stage_result = ?, collected_coin = ? WHERE account_id = ?', [catLuckyData.stage, catLuckyData.current_stage_result, catLuckyData.collected_coin, req.user.account_id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          result: catLuckyData
        });
      });
    }
    else {
      db.query('INSERT INTO cat_lucky(account_id, stage, current_stage_result, collected_coin) VALUE (?, ?, ?)', [req.user.account_id, catLuckyData.stage, catLuckyData.current_stage_result, catLuckyData.collected_coin], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          result: catLuckyData
        });
      });
    }

  });
});

function getStageResult(stage) {
  var result = "";
  var gameOverPosition = Math.floor(Math.random() * 4);
  for (var i = 0; i < 4; i++) {
    if (i === gameOverPosition) {
      result += "GAMEOVER:1";
    }
    else {
      result += "COIN:100";
    }
    if (i < 3) {
      result += ",";
    }
  }
  return result;
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
