import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get all IT Technicians with their assigned centers directly from the database
export const consulterTechniciens = async (req, res) => {
  try {
    const techniciens = await prisma.utilisateur.findMany({
      where: { role: 'TECHNICIEN_IT' },
      include: {
        centres: true // Imports/fetches all centers linked to the technician from the database
      }
    });
    return res.status(200).json(techniciens);
  } catch (error) {
    console.error("Error fetching technicians:", error);
    return res.status(500).json({ error: 'Erreur lors de la récupération des techniciens.' });
  }
};

// Get all Employees with their assigned center
export const consulterEmployes = async (req, res) => {
  try {
    const employes = await prisma.utilisateur.findMany({
      where: { role: 'EMPLOYE' },
      include: {
        centre: true
      }
    });
    return res.status(200).json(employes);
  } catch (error) {
    console.error("Error fetching employees:", error);
    return res.status(500).json({ error: 'Erreur lors de la récupération des employés.' });
  }
};

// Add a center to a technician (Persists in Database)
export const ajouterCentreTechnicien = async (req, res) => {
  const techId = parseInt(req.params.id || req.params.techId, 10);
  const centreId = parseInt(req.body.centreId || req.params.centreId, 10);

  if (isNaN(techId) || isNaN(centreId)) {
    return res.status(400).json({ error: 'IDs de technicien ou de centre invalides.' });
  }

  try {
    const updatedTechnicien = await prisma.utilisateur.update({
      where: { id: techId },
      data: {
        centres: {
          connect: { id: centreId }
        }
      },
      include: { centres: true }
    });

    return res.status(200).json(updatedTechnicien);
  } catch (error) {
    console.error("Error connecting center:", error);
    return res.status(500).json({ error: 'Erreur lors de l\'ajout du centre.', details: error.message });
  }
};

// Remove a center from a technician (Persists in Database)
export const supprimerCentreTechnicien = async (req, res) => {
  const techId = parseInt(req.params.id || req.params.techId, 10);
  const centreId = parseInt(req.params.centreId || req.body.centreId, 10);

  if (isNaN(techId) || isNaN(centreId)) {
    return res.status(400).json({ error: 'IDs de technicien ou de centre invalides.' });
  }

  try {
    const updatedTechnicien = await prisma.utilisateur.update({
      where: { id: techId },
      data: {
        centres: {
          disconnect: { id: centreId }
        }
      },
      include: { centres: true }
    });

    return res.status(200).json(updatedTechnicien);
  } catch (error) {
    console.error("Error disconnecting center:", error);
    return res.status(500).json({ error: 'Erreur lors de la suppression du centre.', details: error.message });
  }
};