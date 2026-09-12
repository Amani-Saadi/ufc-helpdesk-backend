import prisma from '../config/database.js';
import path from 'path';
import fs from 'fs';

export const ajouterFichierJoint = async (req, res, next) => {
  try {
    const { ticketId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni.' });
    }

    const fichier = await prisma.fichierJoint.create({
      data: {
        nomFichier: req.file.originalname,
        cheminFichier: req.file.path,
        typeFichier: req.file.mimetype,
        tailleOctets: BigInt(req.file.size),
        ticketId: parseInt(ticketId),
      },
    });

    const responseData = {
      ...fichier,
      tailleOctets: fichier.tailleOctets.toString(),
    };

    res.status(201).json({ status: 'success', data: responseData });
  } catch (error) {
    next(error);
  }
};

export const telechargerFichier = async (req, res, next) => {
  try {
    const { id } = req.params;

    const fichier = await prisma.fichierJoint.findUnique({
      where: { id: parseInt(id) },
    });

    if (!fichier) {
      return res.status(404).json({ message: 'Fichier non trouvé.' });
    }

    const absolutePath = path.resolve(fichier.cheminFichier);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: 'Fichier introuvable sur le serveur.' });
    }

    res.download(absolutePath, fichier.nomFichier);
  } catch (error) {
    next(error);
  }
};
