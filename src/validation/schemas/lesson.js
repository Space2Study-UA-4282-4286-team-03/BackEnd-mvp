const lessonValidationSchema = {
  title: {
    type: 'string',
    required: true,
    length: {
      min: 1,
      max: 50
    }
  }
}

module.exports = lessonValidationSchema
