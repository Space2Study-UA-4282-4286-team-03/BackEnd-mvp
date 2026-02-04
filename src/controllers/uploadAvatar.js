const cloudinary = require('~/utils/cloudinary')
const User = require('~/models/user')

const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id
    const file = req.file

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    if (user.photoPublicId) {
      await cloudinary.uploader.destroy(user.photoPublicId)
    }
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: 'image', folder: 'avatars' },
      async (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error)
          return res.status(500).json({ message: 'Cloudinary error' })
        }

        await User.findByIdAndUpdate(userId, { photo: result.secure_url, photoPublicId: result.public_id })
        res.status(200).json({ photoUrl: result.secure_url })
      }
    )

    stream.end(file.buffer)
  } catch (error) {
    console.error('Error uploading photo:', error)
    res.status(500).json({ message: 'Server error during photo upload' })
  }
}

module.exports = { uploadAvatar }
