const express = require('express');
const router = express.Router();
const penilaianController = require('../controllers/penilaianController');
const authenticate = require('../middlewares/authMiddleware');
const authorizeRole = require('../middlewares/roleMiddleware');

// Penilaian (user)
router.post('/', authenticate, penilaianController.createPenilaian);
router.get('/me', authenticate, penilaianController.getMyPenilaian);

// Penilaian (admin)
router.get('/all', authenticate, authorizeRole('admin'), penilaianController.getAllPenilaian);

// Update penilaian milik sendiri
router.put('/:id', authenticate, penilaianController.updatePenilaian);

// Hapus penilaian milik sendiri
router.delete('/:id', authenticate, penilaianController.deletePenilaian);


module.exports = router;
