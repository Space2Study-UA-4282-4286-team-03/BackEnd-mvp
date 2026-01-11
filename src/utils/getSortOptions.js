const getSortOptions = (sort) => {
  if (!sort) return { updatedAt: -1 }

  try {
    let decoded = decodeURIComponent(sort)
    try {
      decoded = decodeURIComponent(decoded)
    } catch (err) {
      // ignore double decoding if not needed
    }

    const parsed = JSON.parse(decoded)
    const orderBy = parsed.orderBy || 'updatedAt'
    const order = parsed.order === 'desc' ? -1 : 1

    return { [orderBy]: order }
  } catch (err) {
    return { updatedAt: -1 }
  }
}

module.exports = getSortOptions
