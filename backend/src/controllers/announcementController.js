import Announcement from '../models/Announcement.js'
import User from '../models/User.js'

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Public
export const getAnnouncements = async (req, res, next) => {
  try {
    const { country } = req.query

    const filter = {}
    if (country && country !== 'all') {
      filter.country = country
    }

    const announcements = await Announcement.find(filter)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(100)

    res.json(announcements)
  } catch (error) {
    next(error)
  }
}

// @desc    Get single announcement
// @route   GET /api/announcements/:id
// @access  Public
export const getAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone')

    if (!announcement) {
      return res.status(404).json({ error: 'Ogłoszenie nie zostało znalezione' })
    }

    res.json(announcement)
  } catch (error) {
    next(error)
  }
}

// @desc    Create new announcement
// @route   POST /api/announcements
// @access  Private (authenticated users)
export const createAnnouncement = async (req, res, next) => {
  try {
    const { title, description, country, phone } = req.body

    // Validate required fields
    if (!title || !description || !country) {
      return res.status(400).json({ error: 'Tytuł, opis i kraj są wymagane' })
    }

    // Get full user info from database (JWT token only has id and email)
    const user = await User.findById(req.user.id)
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie został znaleziony' })
    }

    const announcement = await Announcement.create({
      userId: user._id,
      userType: user.userType || 'customer',
      firstName: user.firstName,
      email: user.email,
      phone: phone || user.phone,
      country,
      title,
      description
    })

    res.status(201).json(announcement)
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message)
      return res.status(400).json({ error: messages.join(', ') })
    }
    next(error)
  }
}

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private (owner only)
export const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findById(req.params.id)

    if (!announcement) {
      return res.status(404).json({ error: 'Ogłoszenie nie zostało znalezione' })
    }

    // Check if user is the owner
    if (announcement.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Nie masz uprawnień do usunięcia tego ogłoszenia' })
    }

    await Announcement.findByIdAndDelete(req.params.id)

    res.json({ message: 'Ogłoszenie zostało usunięte' })
  } catch (error) {
    next(error)
  }
}
