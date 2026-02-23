const updateLessonValidationSchema = {
  title: {
    type: 'string',
    required: false,
    length: {
      min: 1,
      max: 50
    }
  }
}

module.exports = updateLessonValidationSchema
