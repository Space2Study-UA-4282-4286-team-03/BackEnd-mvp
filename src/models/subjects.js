const { Schema, model } = require('mongoose')

const subjectSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Subject title is required'],
      minLength: [2, 'Subject title must be at least 2 characters'],
      maxLength: [50, 'Subject title must be at most 50 characters']
    },

    value: {
      type: String,
      required: [true, 'Subject value is required'],
      unique: true,
      index: true,
      minLength: [2, 'Subject value must be at least 2 characters'],
      maxLength: [50, 'Subject value must be at most 50 characters']
    },

    category: {
      type: String,
      required: [true, 'Subject category is required'],
      index: true,
      enum: {
        values: [
          'Languages',
          'Mathematics',
          'Computer Science',
          'Music & Arts',
          'Science',
          'History & Social Studies',
          'Sports & Physical Education',
          'Technology & Design'
        ],
        message: 'Invalid subject category'
      }
    }
  },
  {
    timestamps: true,
    versionKey: false,
    id: false
  }
)

module.exports = model('Subject', subjectSchema)
