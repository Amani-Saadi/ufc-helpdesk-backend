import prisma from '../config/database.js';

export const consulterDepartements = async (req, res, next) => {
  try {
    const departements = await prisma.departement.findMany({
      include: { 
        utilisateurs: { 
          select: { 
            id: true, 
            nom: true, 
            prenom: true, 
            email: true, 
            role: true 
          } 
        } 
      },
    });
    
    res.status(200).json({ status: 'success', data: departements });
  } catch (error) {
    next(error);
  }
};
