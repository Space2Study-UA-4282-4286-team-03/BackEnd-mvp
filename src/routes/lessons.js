const router = require('express').Router()
const validationMiddleWare = require('~/middlewares/validation')
const lessonValidationSchema = require('~/validation/schemas/lesson')
const updateLessonValidationSchema = require('~/validation/schemas/updateLesson')

const Lesson = require('~/models/lessons')

const lessonsController = require('~/controllers/lessons')
const asyncWrapper = require('~/middlewares/asyncWrapper')
const isEntityValid = require('~/middlewares/entityValidation')
const idValidation = require('~/middlewares/idValidation')
const { authMiddleware, restrictTo } = require('~/middlewares/auth')

const {
  roles: { TUTOR }
} = require('~/consts/auth')

router.use(authMiddleware)
router.use(restrictTo(TUTOR))
router.param('id', idValidation)
const params = [{ model: Lesson, idName: 'id' }]

router.get('/', asyncWrapper(lessonsController.getLessons))
router.get('/:id', isEntityValid({ params }), asyncWrapper(lessonsController.getLessonById))
router.post('/', validationMiddleWare(lessonValidationSchema), asyncWrapper(lessonsController.createLesson))
router.patch(
  '/:id',
  isEntityValid({ params }),
  validationMiddleWare(updateLessonValidationSchema),
  asyncWrapper(lessonsController.updateLesson)
)
router.delete('/:id', isEntityValid({ params }), asyncWrapper(lessonsController.deleteLessonById))

module.exports = router
