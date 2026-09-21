import prisma from '../config/database.js';

export const consulterCentres = async (req, res, next) => {
  try {
    // Note: Must use 'centre' with a lowercase 'c' for the prisma client instance, 
    // matching 'model Centre' in your schema.
    const centres = await prisma.centre.findMany({
      include: {
        technicien: true, // Matches 'technicien Utilisateur? @relation("TechnicienCentres")'
      },
    });
    
    return res.status(200).json({ status: 'success', data: centres });
  } catch (error) {
    console.error("Error fetching centers:", error);
    next(error);
  }
};