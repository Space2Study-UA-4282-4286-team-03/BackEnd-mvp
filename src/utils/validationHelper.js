const {
  FIELD_IS_NOT_DEFINED,
  FIELD_IS_NOT_OF_PROPER_TYPE,
  FIELD_IS_NOT_OF_PROPER_LENGTH,
  FIELD_IS_NOT_OF_PROPER_FORMAT,
  FIELD_IS_NOT_OF_PROPER_ENUM_VALUE
} = require('~/consts/errors')
const { createError } = require('./errorsHelper')

const validateRequired = (schemaFieldKey, required, field) => {
  if (required && !field) {
    throw createError(422, FIELD_IS_NOT_DEFINED(schemaFieldKey))
  }
}

const validateType = (schemaFieldKey, type, field) => {
  if (type != typeof field) {
    throw createError(422, FIELD_IS_NOT_OF_PROPER_TYPE(schemaFieldKey, type))
  }
}

const validateLength = (schemaFieldKey, length, field) => {
  if (field.length < length.min || field.length > length.max) {
    throw createError(422, FIELD_IS_NOT_OF_PROPER_LENGTH(schemaFieldKey, length))
  }
}

const validateRegex = (schemaFieldKey, regex, field) => {
  if (!regex.test(field)) {
    throw createError(422, FIELD_IS_NOT_OF_PROPER_FORMAT(schemaFieldKey))
  }
}

const validateEnum = (schemaFieldKey, enumSet, field) => {
  const isEnumValue = enumSet.some((value) => value === field)
  if (!isEnumValue) {
    throw createError(422, FIELD_IS_NOT_OF_PROPER_ENUM_VALUE(schemaFieldKey, enumSet))
  }
}

const validateIsArray = (schemaFieldKey, shouldBeArray, field) => {
  if (shouldBeArray && !Array.isArray(field)) {
    throw createError(422, FIELD_IS_NOT_OF_PROPER_TYPE(schemaFieldKey, 'array'))
  }
}

const validateFunc = {
  required: validateRequired,
  type: validateType,
  length: validateLength,
  regex: validateRegex,
  enum: validateEnum,
  isArray: validateIsArray
}

module.exports = {
  validateRequired,
  validateType,
  validateLength,
  validateFunc
}
