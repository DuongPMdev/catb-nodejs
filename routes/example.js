/**
 * @swagger
 * /api/v1/hello_world:
 *   get:
 *     summary: Returns a resource
 *     description: Get a simple resource from the API
 *     responses:
 *       200:
 *         description: A resource object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: API Resource
 */
const express = require('express');
const router = express.Router();

router.get('/api/v1/hello_world', (req, res) => {
  res.json({ message: 'Hello world from Vteles 2025' });
});

module.exports = router;
