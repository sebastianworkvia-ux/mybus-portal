import Review from '../models/Review.js'
import Carrier from '../models/Carrier.js'

// Lista wulgaryzmów do filtrowania
const PROFANITY_LIST = [
  'kurwa', 'kurwy', 'kurwą', 'chuj', 'chuja', 'cipa', 'cipą', 'pierdol', 
  'jebać', 'jebany', 'zajebisty', 'pierdolić', 'skurwysyn', 'suka', 
  'gówno', 'huj', 'dupa', 'dupę', 'fuck', 'shit', 'ass', 'bitch'
]

const containsProfanity = (text) => {
  const lowerText = text.toLowerCase()
  return PROFANITY_LIST.some(word => lowerText.includes(word))
}

export const getReviewsByCarrier = async (req, res, next) => {
  try {
    const { carrierId } = req.params
    const reviews = await Review.find({ carrierId })
      .populate('userId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .select('-__v')
    
    res.json(reviews)
  } catch (error) {
    next(error)
  }
}

export const createReview = async (req, res, next) => {
  try {
    const { carrierId, rating, comment } = req.body

    // Validation
    if (!carrierId || !rating || !comment) {
      return res.status(400).json({ error: 'Wszystkie pola są wymagane' })
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Ocena musi być w zakresie 1-5' })
    }

    if (comment.length < 10) {
      return res.status(400).json({ error: 'Komentarz musi mieć minimum 10 znaków' })
    }

    if (comment.length > 500) {
      return res.status(400).json({ error: 'Komentarz może mieć maksymalnie 500 znaków' })
    }

    // Check profanity
    if (containsProfanity(comment)) {
      return res.status(400).json({ 
        error: 'Komentarz zawiera niedozwolone słowa. Prosimy o kulturalny język.' 
      })
    }

    // Check if carrier exists
    const carrier = await Carrier.findById(carrierId)
    if (!carrier) {
      return res.status(404).json({ error: 'Przewoźnik nie został znaleziony' })
    }

    // Check if user already reviewed this carrier
    const existingReview = await Review.findOne({
      carrierId,
      userId: req.user.id
    })

    if (existingReview) {
      return res.status(409).json({ 
        error: 'Dodałeś już opinię o tym przewoźniku. Możesz ją edytować.' 
      })
    }

    // Create review
    const review = new Review({
      carrierId,
      userId: req.user.id,
      rating,
      comment
    })

    await review.save()

    // Update carrier rating
    const allReviews = await Review.find({ carrierId })
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    
    carrier.rating = Math.round(avgRating * 10) / 10 // Round to 1 decimal
    carrier.reviewCount = allReviews.length
    await carrier.save()

    // Populate and return
    const populatedReview = await Review.findById(review._id)
      .populate('userId', 'firstName lastName')

    res.status(201).json({
      message: 'Opinia dodana pomyślnie',
      review: populatedReview,
      carrierRating: carrier.rating,
      carrierReviewCount: carrier.reviewCount
    })
  } catch (error) {
    next(error)
  }
}

export const updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params
    const { rating, comment } = req.body

    const review = await Review.findById(reviewId)
    if (!review) {
      return res.status(404).json({ error: 'Opinia nie została znaleziona' })
    }

    // Check ownership
    if (review.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Nie możesz edytować cudzych opinii' })
    }

    // Validate
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'Ocena musi być w zakresie 1-5' })
    }

    if (comment && comment.length < 10) {
      return res.status(400).json({ error: 'Komentarz musi mieć minimum 10 znaków' })
    }

    if (comment && comment.length > 500) {
      return res.status(400).json({ error: 'Komentarz może mieć maksymalnie 500 znaków' })
    }

    if (comment && containsProfanity(comment)) {
      return res.status(400).json({ 
        error: 'Komentarz zawiera niedozwolone słowa. Prosimy o kulturalny język.' 
      })
    }

    // Update
    if (rating) review.rating = rating
    if (comment) review.comment = comment
    await review.save()

    // Recalculate carrier rating
    const carrier = await Carrier.findById(review.carrierId)
    const allReviews = await Review.find({ carrierId: review.carrierId })
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    
    carrier.rating = Math.round(avgRating * 10) / 10
    carrier.reviewCount = allReviews.length
    await carrier.save()

    res.json({
      message: 'Opinia zaktualizowana pomyślnie',
      review,
      carrierRating: carrier.rating
    })
  } catch (error) {
    next(error)
  }
}

export const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params

    const review = await Review.findById(reviewId)
    if (!review) {
      return res.status(404).json({ error: 'Opinia nie została znaleziona' })
    }

    // Check ownership
    if (review.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Nie możesz usunąć cudzych opinii' })
    }

    const carrierId = review.carrierId
    await Review.deleteOne({ _id: reviewId })

    // Recalculate carrier rating
    const carrier = await Carrier.findById(carrierId)
    const allReviews = await Review.find({ carrierId })
    
    if (allReviews.length > 0) {
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
      carrier.rating = Math.round(avgRating * 10) / 10
      carrier.reviewCount = allReviews.length
    } else {
      carrier.rating = 0
      carrier.reviewCount = 0
    }
    
    await carrier.save()

    res.json({
      message: 'Opinia usunięta pomyślnie',
      carrierRating: carrier.rating,
      carrierReviewCount: carrier.reviewCount
    })
  } catch (error) {
    next(error)
  }
}
