import prisma from '../config/database.js';

export const consulterCategories = async (req, res, next) => {
  try {
    const categories = await prisma.categorie.findMany();
    res.status(200).json({ status: 'success', data: categories });
  } catch (error) {
    next(error);
  }
};
