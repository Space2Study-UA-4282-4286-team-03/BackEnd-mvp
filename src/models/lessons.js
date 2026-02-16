const { Schema, model } = require('mongoose')
const { LESSON, USER, RESOURCES_CATEGORY } = require('~/consts/models')
const { FIELD_CANNOT_BE_EMPTY, FIELD_CANNOT_BE_LONGER, FIELD_CANNOT_BE_SHORTER } = require('~/consts/errors')

const lessonSchema = new Schema({
  title: {
    type: String,
    required: [true, FIELD_CANNOT_BE_EMPTY('title')],
    minLength: [1, FIELD_CANNOT_BE_SHORTER('title', 1)],
    maxLength: [50, FIELD_CANNOT_BE_LONGER('title', 50)]
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: USER,
    required: [true, FIELD_CANNOT_BE_EMPTY('author')],
    default: null
  },
  files: {
    type: [String],
    default: []
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: RESOURCES_CATEGORY,
    default: null
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
})
module.exports = model(LESSON, lessonSchema)
