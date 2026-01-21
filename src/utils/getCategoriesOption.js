const mongoose = require('mongoose')

const getCategoriesOptions = (categories) => {
  if (!categories) return undefined

  const normalize = (cat) => {
    if (typeof cat === 'object') {
      if (!cat.value || cat.value === 'null') return null
      return cat.value
    }

    if (cat === 'null') return null

    if (!mongoose.Types.ObjectId.isValid(cat)) return null

    return cat
  }

  // якщо масив
  if (Array.isArray(categories)) {
    const ids = categories.map(normalize).filter(Boolean)
    return ids.length ? ids : undefined
  }

  // якщо одиночне значення
  const id = normalize(categories)
  return id ? [id] : undefined
}

module.exports = getCategoriesOptions
