const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('./db'); // Import the database connection
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
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
  const { telegram_id } = req.body;

  db.query('SELECT * FROM account WHERE telegram_id = ?', [telegram_id], (err, results) => {
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
        display_name: user.display_name,
        account_id: user.account_id
      }, SECRET_KEY);
      var responsesData = {
        telegram_id: user.telegram_id,
        display_name: user.display_name,
        ton: statistic.ton,
        bnb: statistic.bnb,
        plays: statistic.plays
      };
      res.json({ responsesData });
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
  res.json({ message: 'This is a protected route', user: req.user });
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
app.get('/cat_lucky/get_status', authenticateToken, (req, res) => {
  const now = new Date();
  res.json({
    stage: 0,
    lock_until: now.toLocaleString(),
    message: "Locked until " + now.toLocaleString()
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
  const now = new Date();
  console.log('req.user : ', req.user);
  console.log('req.user.account_id : ', req.user.account_id);
  res.json({
    stage: 0,
    lock_until: now.toLocaleString(),
    message: "Locked until " + now.toLocaleString()
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
