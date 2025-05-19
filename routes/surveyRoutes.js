const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');
const authenticate = require('../middlewares/authMiddleware');
const authorizeRole = require('../middlewares/roleMiddleware');

// Admin-only routes
router.post('/', authenticate, authorizeRole('admin'), surveyController.createSurvey);
router.get('/all', authenticate, authorizeRole('admin'), surveyController.getAllSurveys);
router.put('/:id', authenticate, authorizeRole('admin'), surveyController.updateSurvey);
router.delete('/:id', authenticate, authorizeRole('admin'), surveyController.deleteSurvey);
router.post('/add-member', authenticate, authorizeRole('admin'), surveyController.addSurveyMember);

// User-specific survey list
router.get('/my', authenticate, surveyController.getSurveysByUser);

module.exports = router;
