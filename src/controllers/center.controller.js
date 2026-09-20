import prisma from '../config/database.js';

export const consulterCentres = async (req, res, next) => {
  try {
    // Note: Adjust 'centre' or 'center' here to match whatever your Prisma model is named
    const centres = await prisma.centre.findMany({
      include: {
        technicien: true
      }
    });
    res.status(200).json({ status: 'success', data: centres });
  } catch (error) {
    next(error);
  }
};