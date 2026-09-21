import prisma from '../config/database.js';
import { creerNotification, notifierLesTechniciens } from '../utils/notification.util.js';

// Mapping of technicians to their authorized centers based on the distribution sheet
const technicianCentersMap = {
  "صفية": ["وهران", "معسكر", "سعيدة", "البليدة", "ميلة", "سكيكدة"],
  "عبد الرؤوف": ["الجلفة", "غرداية", "تيسمسيلت"],
  "كريمة": ["بشار", "برج بوعريريج", "جيجل", "سيدي بلعباس", "الأغواط", "تبسة"],
  "سميرة": ["المدية", "تيبياززة", "النعامة", "البويرة"],
  "لمياء": ["الباب الزوار", "عين الدفلى", "بجاية"],
  "منير": ["الجزائر شرق", "أم البواقي", "بن عكنون", "بومرداس"],
  "عبد الرحمن": ["بسكرة"],
  "جميلة": ["قسنطينة", "عنابة", "تلمسان", "سوق أهراس", "اليزي"],
  "سهيلة": ["قالمة", "تڤرت", "الطارف", "بوزريعة"],
  "سامية": ["خنشلة", "ورقلة", "الوادي", "تيارت", "مستغانم", "البيض"],
  "مصطفى": ["تمنراست", "تيزي وزو", "المسيلة", "الشلف", "خميس مليانة", "غليزان", "أدرار", "باتنة"]
};

export const creerTicket = async (req, res, next) => {
  try {
    const { titre, description, priorite, categorieId, centerId } = req.body;
    
    const employeId = req.user.id;
    const userCentreId = req.user.centreId;

    const targetCentreId = centerId ? parseInt(centerId) : userCentreId;

    let technicienId = null;

    if (targetCentreId) {
      const center = await prisma.centre.findUnique({
        where: { id: parseInt(targetCentreId) },
        include: { technicien: true }
      });
      
      if (center) {
        technicienId = center.technicienId;

        // Fallback: If technician is not linked in DB, find by center name using the distribution map
        if (!technicienId && center.nom) {
          const centerName = center.nom.trim();
          const techNameMatch = Object.entries(technicianCentersMap).find(([_, centers]) => 
            centers.includes(centerName)
          );
          
          if (techNameMatch) {
            const foundTech = await prisma.utilisateur.findFirst({
              where: { 
                OR: [
                  { prenom: { equals: techNameMatch[0], mode: 'insensitive' } },
                  { nom: { equals: techNameMatch[0], mode: 'insensitive' } }
                ],
                role: 'TECHNICIEN_IT'
              }
            });
            if (foundTech) {
              technicienId = foundTech.id;
            }
          }
        }
      }
    }

    const ticket = await prisma.ticket.create({
      data: {
        titre,
        description,
        priorite: priorite || 'MOYENNE',
        statut: 'NOUVEAU_NON_VU',
        categorieId: categorieId ? parseInt(categorieId) : null,
        centreId: targetCentreId ? parseInt(targetCentreId) : null,
        technicienId: technicienId ? parseInt(technicienId) : null,
        employeId: employeId,
      },
      include: {
        categorie: true,
        centre: {
          include: {
            technicien: true
          }
        },
        employe: {
          include: { 
            centre: true 
          }
        },
        technicien: true
      }
    });

    if (ticket.technicienId) {
      await creerNotification(
        ticket.technicienId,
        `Nouveau ticket de centre (#${ticket.id}): ${ticket.titre}`
      );
    } else {
      await notifierLesTechniciens(`Nouveau ticket (#${ticket.id}): ${ticket.titre}`);
    }

    res.status(201).json({ status: 'success', data: ticket });
  } catch (error) {
    next(error);
  }
};

export const consulterTickets = async (req, res, next) => {
  try {
    const { categorieId, statut } = req.query;
    let whereClause = {};

    if (req.user.role === 'EMPLOYE') {
      if (req.user.centreId) {
        whereClause.OR = [
          { employeId: req.user.id },
          { centreId: req.user.centreId }
        ];
      } else {
        whereClause.employeId = req.user.id;
      }
    } else if (req.user.role === 'TECHNICIEN_IT') {
      const dbUser = await prisma.utilisateur.findUnique({
        where: { id: req.user.id }
      });

      const techSpecialty = dbUser?.specialite ? String(dbUser.specialite).trim() : '';
      const techName = dbUser?.prenom || dbUser?.nom || '';
      
      const orConditions = [
        { technicienId: req.user.id }
      ];

      // Include tickets from centers assigned to this technician in the distribution sheet
      const allowedCenters = technicianCentersMap[techName] || [];
      if (allowedCenters.length > 0) {
        orConditions.push({
          centre: {
            nom: {
              in: allowedCenters
            }
          }
        });
      }

      if (techSpecialty) {
        orConditions.push({
          categorie: {
            nom: {
              contains: techSpecialty,
              mode: 'insensitive'
            }
          }
        });
      }

      whereClause.OR = orConditions;
    }

    if (categorieId && categorieId !== 'all' && !isNaN(parseInt(categorieId))) {
      whereClause.categorieId = parseInt(categorieId);
    }
    
    if (statut && statut !== 'all') {
      whereClause.statut = statut;
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: { 
        employe: { 
          include: { 
            centre: true 
          } 
        }, 
        technicien: true, 
        categorie: true, 
        centre: true 
      },
      orderBy: { dateCreation: 'desc' },
    });

    res.status(200).json({ status: 'success', data: tickets });
  } catch (error) {
    next(error);
  }
};

export const marquerCommeVu = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.ticket.findUnique({ 
      where: { id: parseInt(id) },
      include: { categorie: true, centre: true, employe: { include: { centre: true } }, technicien: true }
    });

    if (!ticket) return res.status(404).json({ message: 'Ticket non trouvé.' });

    if (ticket.statut === 'NOUVEAU_NON_VU' && (req.user.role === 'TECHNICIEN_IT' || req.user.role === 'ADMINISTRATEUR')) {
      const updated = await prisma.ticket.update({
        where: { id: parseInt(id) },
        data: { statut: 'NOUVEAU_VU' },
        include: { categorie: true, centre: true, employe: { include: { centre: true } }, technicien: true }
      });
      return res.status(200).json({ status: 'success', data: updated });
    }

    res.status(200).json({ status: 'success', data: ticket });
  } catch (error) {
    next(error);
  }
};

export const changerStatut = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { statut } = req.body;

    const updateData = { statut };
    if (statut === 'RESOLU') updateData.dateResolution = new Date();
    if (statut === 'FERME') updateData.dateCloture = new Date();

    const ticket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { categorie: true, centre: true, employe: { include: { centre: true } }, technicien: true }
    });

    if (ticket.employeId) {
      await creerNotification(
        ticket.employeId,
        `Le statut de votre ticket #${ticket.id} est maintenant : ${statut}`
      );
    }

    res.status(200).json({ status: 'success', data: ticket });
  } catch (error) {
    next(error);
  }
};

export const changerPriorite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { priorite } = req.body;

    const ticket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: { priorite },
      include: { categorie: true, centre: true, employe: { include: { centre: true } }, technicien: true }
    });

    if (ticket.employeId) {
      await creerNotification(
        ticket.employeId,
        `La priorité de votre ticket #${ticket.id} a été modifiée à : ${priorite}`
      );
    }

    res.status(200).json({ status: 'success', data: ticket });
  } catch (error) {
    next(error);
  }
};

export const assignerTicket = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        technicienId: req.user.id,
        statut: 'EN_COURS'
      },
      include: { categorie: true, centre: true, employe: { include: { centre: true } }, technicien: true }
    });

    if (ticket.employeId) {
      await creerNotification(
        ticket.employeId,
        `Votre ticket #${ticket.id} a été pris en charge par un technicien.`
      );
    }

    res.status(200).json({ status: 'success', data: ticket });
  } catch (error) {
    next(error);
  }
};

export const confirmerResolution = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        statut: 'FERME',
        dateCloture: new Date(),
      },
      include: { categorie: true, centre: true, employe: { include: { centre: true } }, technicien: true }
    });

    if (ticket.technicienId) {
      await creerNotification(
        ticket.technicienId,
        `L'employé a confirmé la résolution du ticket #${ticket.id}.`
      );
    }

    res.status(200).json({ status: 'success', message: 'Ticket clôturé avec succès.', data: ticket });
  } catch (error) {
    next(error);
  }
};

export const consulterCommentaires = async (req, res, next) => {
  try {
    const { id } = req.params;
    const commentaires = await prisma.commentaire.findMany({
      where: { ticketId: parseInt(id) },
      include: { auteur: true },
      orderBy: { dateCreation: 'asc' },
    });
    res.status(200).json({ status: 'success', data: commentaires });
  } catch (error) {
    next(error);
  }
};

export const ajouterCommentaire = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { contenu } = req.body;

    const commentaire = await prisma.commentaire.create({
      data: {
        contenu,
        ticketId: parseInt(id),
        auteurId: req.user.id,
      },
      include: { auteur: true },
    });

    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(id) },
      select: { employeId: true, technicienId: true, titre: true }
    });

    if (ticket) {
      const destinataireId = req.user.id === ticket.employeId ? ticket.technicienId : ticket.employeId;

      if (destinataireId) {
        await creerNotification(
          destinataireId,
          `Nouveau commentaire sur le ticket #${id} (${ticket.titre})`
        );
      }
    }

    res.status(201).json({ status: 'success', data: commentaire });
  } catch (error) {
    next(error);
  }
};

export const telechargerFichier = async (req, res, next) => {
  try {
    const { fichierId } = req.params;
    const fichier = await prisma.fichierJoint.findUnique({
      where: { id: parseInt(fichierId) },
    });

    if (!fichier) {
      return res.status(404).json({ message: 'Fichier non trouvé.' });
    }

    res.download(fichier.cheminFichier, fichier.nomFichier);
  } catch (error) {
    next(error);
  }
};