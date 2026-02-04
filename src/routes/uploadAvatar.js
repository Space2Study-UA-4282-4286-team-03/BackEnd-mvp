const upload = require('~/middlewares/multer')
const { uploadAvatar } = require('~/controllers/uploadAvatar')
const { authMiddleware } = require('~/middlewares/auth')

const router = require('express').Router()
router.post('/upload-photo', authMiddleware, upload.single('photo'), uploadAvatar)
module.exports = router
