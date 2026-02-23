const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i

const updateLessonValidationSchema = {
  title: {
    type: 'string',
    required: false,
    length: {
      min: 1,
      max: 50
    }
  },
  files: {
    isArray: true
  },
  category: {
    type: 'string',
    regex: OBJECT_ID_PATTERN
  }
}

module.exports = updateLessonValidationSchema
