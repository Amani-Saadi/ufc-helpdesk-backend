
import bcrypt from 'bcryptjs';
import prisma from '../config/database.js';
import { creerNotification } from '../utils/notification.util.js';

const parseId = (value) => {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
};

// Centers managed by a technician
const centresSelect = {
  select: { id: true, nom: true },
  orderBy: { nom: 'asc' },
};

export const listerUtilisateurs = async (req, res, next) => {
  try {
    const users = await prisma.utilisateur.findMany({
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        telephone: true,
        poste: true,
        specialite: true,
        niveauPrivilege: true,
        statutActif: true,
        centreId: true,
        centre: {
          select: {
            id: true,
            nom: true,
          },
        },
        centres: centresSelect,
      },
      orderBy: { id: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenirUtilisateurParId = async (req, res, next) => {
  try {
    const userId = parseId(req.params.id);

    if (userId === null) {
      return res.status(400).json({
        status: 'fail',
        message: 'ID invalide.',
      });
    }

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        telephone: true,
        poste: true,
        specialite: true,
        niveauPrivilege: true,
        statutActif: true,
        centreId: true,
        centre: {
          select: {
            id: true,
            nom: true,
          },
        },
        centres: centresSelect,
      },
    });

    if (!utilisateur) {
      return res.status(404).json({
        status: 'fail',
        message: 'Utilisateur non trouvé.',
      });
    }

    res.status(200).json({
      status: 'success',
      data: utilisateur,
    });
  } catch (error) {
    next(error);
  }
};

export const listerTechniciensAvecStats = async (req, res, next) => {
  try {
    const techniciens = await prisma.utilisateur.findMany({
      where: {
        role: 'TECHNICIEN_IT',
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        telephone: true,
        poste: true,
        specialite: true,
        statutActif: true,
        centreId: true,
        centre: {
          select: {
            id: true,
            nom: true,
          },
        },
        centres: centresSelect,
        _count: {
          select: {
            ticketsAssignee: true,
          },
        },
      },
      orderBy: {
        nom: 'asc',
      },
    });

    res.status(200).json({
      status: 'success',
      data: techniciens,
    });
  } catch (error) {
    next(error);
  }
};

export const listerCentres = async (req, res, next) => {
  try {
    const centres = await prisma.centre.findMany({
      include: {
        technicien: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
      },
      orderBy: {
        nom: 'asc',
      },
    });

    res.status(200).json({
      status: 'success',
      data: centres,
    });
  } catch (error) {
    next(error);
  }
};

export const creerUtilisateur = async (req, res, next) => {
  try {
    const {
      nom,
      prenom,
      email,
      motDePasse,
      password,
      role,
      telephone,
      poste,
      specialite,
      niveauPrivilege,
      centreId,
    } = req.body;

    if (!nom || !prenom || !email) {
      return res.status(400).json({
        status: 'fail',
        message: 'Nom, prénom et email sont obligatoires.',
      });
    }

    const existing = await prisma.utilisateur.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(400).json({
        status: 'fail',
        message: 'Un utilisateur avec cet email existe déjà.',
      });
    }

    const plainPassword = motDePasse || password;

    if (!plainPassword || plainPassword.length < 6) {
      return res.status(400).json({
        status: 'fail',
        message: 'Le mot de passe doit contenir au moins 6 caractères.',
      });
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const normalizedRole = role
      ? role.toUpperCase().includes('ADMIN')
        ? 'ADMINISTRATEUR'
        : role.toUpperCase().includes('TECH')
          ? 'TECHNICIEN_IT'
          : 'EMPLOYE'
      : 'EMPLOYE';

    const parsedCentreId =
      centreId !== undefined &&
      centreId !== null &&
      centreId !== '' &&
      !Number.isNaN(parseInt(centreId, 10))
        ? parseInt(centreId, 10)
        : null;

    const createdUser = await prisma.utilisateur.create({
      data: {
        nom,
        prenom,
        email,
        motDePasse: hashedPassword,
        role: normalizedRole,
        telephone: telephone || null,
        poste: poste || null,
        specialite: specialite || null,
        niveauPrivilege: niveauPrivilege || null,
        centreId: parsedCentreId,
        statutActif: true,
      },
      include: {
        centre: {
          select: {
            id: true,
            nom: true,
          },
        },
        centres: centresSelect,
      },
    });

    const { motDePasse: _, ...userWithoutPassword } = createdUser;

    res.status(201).json({
      status: 'success',
      data: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};

export const modifierUtilisateur = async (req, res, next) => {
  try {
    const userId = parseId(req.params.id);

    if (userId === null) {
      return res.status(400).json({
        status: 'fail',
        message: 'ID invalide.',
      });
    }

    const {
      nom,
      prenom,
      email,
      motDePasse,
      password,
      role,
      telephone,
      poste,
      specialite,
      niveauPrivilege,
      centreId,
      statutActif,
    } = req.body;

    const data = {};

    if (nom !== undefined) data.nom = nom;
    if (prenom !== undefined) data.prenom = prenom;
    if (email !== undefined) data.email = email;
    if (telephone !== undefined) data.telephone = telephone;
    if (poste !== undefined) data.poste = poste;
    if (specialite !== undefined) data.specialite = specialite;
    if (niveauPrivilege !== undefined) data.niveauPrivilege = niveauPrivilege;
    if (statutActif !== undefined) data.statutActif = statutActif;

    if (motDePasse || password) {
      const pwd = motDePasse || password;

      if (pwd.length < 6) {
        return res.status(400).json({
          status: 'fail',
          message: 'Mot de passe trop court (min 6 caractères).',
        });
      }

      data.motDePasse = await bcrypt.hash(pwd, 10);
    }

    if (centreId !== undefined) {
      data.centreId =
        centreId === null ||
        centreId === '' ||
        Number.isNaN(parseInt(centreId, 10))
          ? null
          : parseInt(centreId, 10);
    }

    if (role !== undefined) {
      const normalizedRole = role.toUpperCase();

      data.role = normalizedRole.includes('ADMIN')
        ? 'ADMINISTRATEUR'
        : normalizedRole.includes('TECH')
          ? 'TECHNICIEN_IT'
          : 'EMPLOYE';
    }

    const updatedUser = await prisma.utilisateur.update({
      where: { id: userId },
      data,
      include: {
        centre: {
          select: {
            id: true,
            nom: true,
          },
        },
        centres: centresSelect,
      },
    });

    const { motDePasse: _, ...userWithoutPassword } = updatedUser;

    res.status(200).json({
      status: 'success',
      message: 'Utilisateur mis à jour avec succès.',
      data: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
};

export const assignerCentreUtilisateur = async (req, res, next) => {
  try {
    const userId = parseId(req.params.id);
    const parsedCentreId =
      req.body.centreId !== undefined &&
      req.body.centreId !== null &&
      req.body.centreId !== '' &&
      !Number.isNaN(parseInt(req.body.centreId, 10))
        ? parseInt(req.body.centreId, 10)
        : null;

    if (userId === null) {
      return res.status(400).json({
        status: 'fail',
        message: 'ID utilisateur invalide.',
      });
    }

    const user = await prisma.utilisateur.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'Utilisateur non trouvé.',
      });
    }

    if (parsedCentreId !== null) {
      const centre = await prisma.centre.findUnique({
        where: { id: parsedCentreId },
      });

      if (!centre) {
        return res.status(404).json({
          status: 'fail',
          message: 'Centre non trouvé.',
        });
      }
    }

    /*
     * IMPORTANT:
     * If this is a technician, Centre.technicienId must also be updated.
     * Ticket creation uses Centre.technicienId to route tickets.
     */
    if (user.role === 'TECHNICIEN_IT') {
      const oldCenters = await prisma.centre.findMany({
        where: {
          technicienId: userId,
        },
        select: {
          id: true,
        },
      });

      await prisma.$transaction(async (tx) => {
        await tx.centre.updateMany({
          where: {
            technicienId: userId,
          },
          data: {
            technicienId: null,
          },
        });

        if (parsedCentreId !== null) {
          await tx.centre.update({
            where: {
              id: parsedCentreId,
            },
            data: {
              technicienId: userId,
            },
          });
        }

        await tx.utilisateur.update({
          where: {
            id: userId,
          },
          data: {
            centreId: parsedCentreId,
          },
        });
      });
    } else {
      await prisma.utilisateur.update({
        where: {
          id: userId,
        },
        data: {
          centreId: parsedCentreId,
        },
      });
    }

    const updatedUser = await prisma.utilisateur.findUnique({
      where: {
        id: userId,
      },
      include: {
        centre: {
          select: {
            id: true,
            nom: true,
          },
        },
        centres: centresSelect,
      },
    });

    res.status(200).json({
      status: 'success',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const retirerCentreUtilisateur = async (req, res, next) => {
  try {
    const userId = parseId(req.params.id);

    if (userId === null) {
      return res.status(400).json({
        status: 'fail',
        message: 'ID invalide.',
      });
    }

    const user = await prisma.utilisateur.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'Utilisateur non trouvé.',
      });
    }

    if (user.role === 'TECHNICIEN_IT') {
      await prisma.$transaction(async (tx) => {
        await tx.centre.updateMany({
          where: {
            technicienId: userId,
          },
          data: {
            technicienId: null,
          },
        });

        await tx.utilisateur.update({
          where: {
            id: userId,
          },
          data: {
            centreId: null,
          },
        });
      });
    } else {
      await prisma.utilisateur.update({
        where: {
          id: userId,
        },
        data: {
          centreId: null,
        },
      });
    }

    const updatedUser = await prisma.utilisateur.findUnique({
      where: { id: userId },
      include: {
        centre: {
          select: {
            id: true,
            nom: true,
          },
        },
        centres: centresSelect,
      },
    });

    res.status(200).json({
      status: 'success',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const desactiverUtilisateur = async (req, res, next) => {
  try {
    const userId = parseId(req.params.id);

    if (userId === null) {
      return res.status(400).json({
        status: 'fail',
        message: 'ID invalide.',
      });
    }

    const targetUser = await prisma.utilisateur.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return res.status(404).json({
        status: 'fail',
        message: 'Utilisateur non trouvé.',
      });
    }

    const updatedUser = await prisma.utilisateur.update({
      where: { id: userId },
      data: {
        statutActif: !(targetUser.statutActif ?? true),
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        statutActif: true,
      },
    });

    res.status(200).json({
      status: 'success',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const desactiverCentre = async (req, res, next) => {
  try {
    const centreId = parseId(req.params.id);

    if (centreId === null) {
      return res.status(400).json({
        status: 'fail',
        message: 'ID invalide.',
      });
    }

    const targetCentre = await prisma.centre.findUnique({
      where: { id: centreId },
    });

    if (!targetCentre) {
      return res.status(404).json({
        status: 'fail',
        message: 'Centre non trouvé.',
      });
    }

    const updatedCentre = await prisma.centre.update({
      where: { id: centreId },
      data: {
        statutActif: !(targetCentre.statutActif ?? true),
      },
    });

    res.status(200).json({
      status: 'success',
      data: updatedCentre,
    });
  } catch (error) {
    next(error);
  }
};

export const ajouterCentre = async (req, res, next) => {
  try {
    const nom = String(req.body.nom || '').trim();
    const codeBureau = req.body.codeBureau
      ? String(req.body.codeBureau).trim()
      : null;

    if (!nom) {
      return res.status(400).json({
        status: 'fail',
        message: 'Le nom du centre est obligatoire.',
      });
    }

    const existing = await prisma.centre.findUnique({
      where: { nom },
    });

    if (existing) {
      return res.status(400).json({
        status: 'fail',
        message: 'Un centre avec ce nom existe déjà.',
      });
    }

    const centre = await prisma.centre.create({
      data: {
        nom,
        codeBureau,
        statutActif: true,
      },
    });

    res.status(201).json({
      status: 'success',
      data: centre,
    });
  } catch (error) {
    next(error);
  }
};

export const ajouterCentreTechnicien = async (req, res, next) => {
  try {
    const techId = parseId(req.params.id);
    const centreId = parseId(
      req.body.centreId ?? req.params.centreId
    );

    if (techId === null || centreId === null) {
      return res.status(400).json({
        status: 'fail',
        message: 'IDs de technicien ou de centre invalides.',
      });
    }

    const tech = await prisma.utilisateur.findUnique({
      where: { id: techId },
    });

    if (!tech) {
      return res.status(404).json({
        status: 'fail',
        message: 'Technicien non trouvé.',
      });
    }

    if (tech.role !== 'TECHNICIEN_IT') {
      return res.status(400).json({
        status: 'fail',
        message: "Cet utilisateur n'est pas un technicien.",
      });
    }

    const centre = await prisma.centre.findUnique({
      where: { id: centreId },
    });

    if (!centre) {
      return res.status(404).json({
        status: 'fail',
        message: 'Centre non trouvé.',
      });
    }

    /*
     * IMPORTANT:
     * Keep both relations synchronized.
     */
    await prisma.$transaction(async (tx) => {
      // Remove this technician as the direct technician
      // from any previous center.
      await tx.centre.updateMany({
        where: {
          technicienId: techId,
          id: {
            not: centreId,
          },
        },
        data: {
          technicienId: null,
        },
      });

      // If another technician was assigned to this center,
      // remove the direct assignment before assigning the new one.
      await tx.centre.update({
        where: {
          id: centreId,
        },
        data: {
          technicienId: techId,
        },
      });

      // Also update the technician's primary center.
      await tx.utilisateur.update({
        where: {
          id: techId,
        },
        data: {
          centreId,
        },
      });

      // Keep the many-to-many relation.
      await tx.utilisateur.update({
        where: {
          id: techId,
        },
        data: {
          centres: {
            connect: {
              id: centreId,
            },
          },
        },
      });
    });

    const updated = await prisma.utilisateur.findUnique({
      where: { id: techId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        centres: centresSelect,
        centre: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
    });

    res.status(200).json({
      status: 'success',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// GET  /admin/technicians/:id/centers
// PUT  /admin/technicians/:id/centers { centreIds: [..] }
export const gererCentresTechnicien = async (req, res, next) => {
  try {
    const userId = parseId(req.params.id);

    if (userId === null) {
      return res.status(400).json({
        status: 'fail',
        message: 'ID invalide.',
      });
    }

    const select = {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      centreId: true,
      centre: {
        select: {
          id: true,
          nom: true,
        },
      },
      centres: centresSelect,
    };

    if (req.method === 'GET') {
      const user = await prisma.utilisateur.findUnique({
        where: { id: userId },
        select,
      });

      if (!user) {
        return res.status(404).json({
          status: 'fail',
          message: 'Utilisateur non trouvé.',
        });
      }

      return res.status(200).json({
        status: 'success',
        data: user,
      });
    }

    if (req.method === 'PUT') {
      const ids = (
        Array.isArray(req.body.centreIds)
          ? req.body.centreIds
          : []
      )
        .map(parseId)
        .filter((n) => n !== null);

      await prisma.$transaction(async (tx) => {
        // First remove this technician from all direct center assignments.
        await tx.centre.updateMany({
          where: {
            technicienId: userId,
          },
          data: {
            technicienId: null,
          },
        });

        // Update many-to-many relation.
        await tx.utilisateur.update({
          where: { id: userId },
          data: {
            centres: {
              set: ids.map((id) => ({ id })),
            },
          },
        });

        // The first selected center becomes the primary/direct center.
        if (ids.length > 0) {
          await tx.centre.update({
            where: {
              id: ids[0],
            },
            data: {
              technicienId: userId,
            },
          });

          await tx.utilisateur.update({
            where: {
              id: userId,
            },
            data: {
              centreId: ids[0],
            },
          });
        } else {
          await tx.utilisateur.update({
            where: {
              id: userId,
            },
            data: {
              centreId: null,
            },
          });
        }
      });

      const updated = await prisma.utilisateur.findUnique({
        where: { id: userId },
        select,
      });

      return res.status(200).json({
        status: 'success',
        data: updated,
      });
    }

    return res.status(405).json({
      status: 'fail',
      message: 'Method not allowed',
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /admin/technicians/:id/centers/:centreId
export const supprimerCentreTechnicien = async (req, res, next) => {
  try {
    const techId = parseId(req.params.id);
    const centreId = parseId(
      req.params.centreId ?? req.body?.centreId
    );

    if (techId === null || centreId === null) {
      return res.status(400).json({
        status: 'fail',
        message: 'IDs de technicien ou de centre invalides.',
      });
    }

    const centre = await prisma.centre.findUnique({
      where: { id: centreId },
    });

    if (!centre) {
      return res.status(404).json({
        status: 'fail',
        message: 'Centre non trouvé.',
      });
    }

    if (centre.technicienId !== techId) {
      return res.status(400).json({
        status: 'fail',
        message: "Ce centre n'est pas rattaché à ce technicien.",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.centre.update({
        where: {
          id: centreId,
        },
        data: {
          technicienId: null,
        },
      });

      await tx.utilisateur.update({
        where: {
          id: techId,
        },
        data: {
          centres: {
            disconnect: {
              id: centreId,
            },
          },
          centreId: null,
        },
      });
    });

    const updated = await prisma.utilisateur.findUnique({
      where: { id: techId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        centreId: true,
        centres: centresSelect,
      },
    });

    res.status(200).json({
      status: 'success',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const affecterTicket = async (req, res, next) => {
  try {
    const ticketId = parseId(req.params.id);
    const technicienId = parseId(req.body.technicienId);

    if (ticketId === null) {
      return res.status(400).json({
        status: 'fail',
        message: 'ID de ticket invalide.',
      });
    }

    if (technicienId !== null) {
      const tech = await prisma.utilisateur.findUnique({
        where: { id: technicienId },
      });

      if (!tech || tech.role !== 'TECHNICIEN_IT') {
        return res.status(400).json({
          status: 'fail',
          message: 'Technicien invalide.',
        });
      }
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        technicienId,
      },
      include: {
        technicien: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        centre: true,
        categorie: true,
        employe: {
          include: {
            centre: true,
          },
        },
      },
    });

    if (technicienId !== null) {
      await creerNotification(
        technicienId,
        `Le ticket #${updatedTicket.id} vous a été assigné : ${updatedTicket.titre}`
      );
    }

    res.status(200).json({
      status: 'success',
      data: updatedTicket,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /admin/tickets/:id
export const supprimerTicket = async (req, res, next) => {
  try {
    const ticketId = parseId(req.params.id);

    if (ticketId === null) {
      return res.status(400).json({
        status: 'fail',
        message: 'ID de ticket invalide.',
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({
        status: 'fail',
        message: 'Ticket non trouvé.',
      });
    }

    await prisma.ticket.delete({
      where: { id: ticketId },
    });

    res.status(200).json({
      status: 'success',
      message: 'Ticket supprimé.',
    });
  } catch (error) {
    next(error);
  }
};

export const ajouterCategorie = async (req, res, next) => {
  try {
    const { nom, description } = req.body;

    if (!nom) {
      return res.status(400).json({
        status: 'fail',
        message: 'Le nom est obligatoire.',
      });
    }

    const nouvelleCategorie = await prisma.categorie.create({
      data: {
        nom,
        description,
      },
    });

    res.status(201).json({
      status: 'success',
      data: nouvelleCategorie,
    });
  } catch (error) {
    next(error);
  }
};

export const consulterStatistiques = async (req, res, next) => {
  try {
    const totalTickets = await prisma.ticket.count();
    const totalUtilisateurs = await prisma.utilisateur.count();
    const totalCentres = await prisma.centre.count();

    const ticketsResolus = await prisma.ticket.count({
      where: {
        statut: {
          in: ['RESOLU', 'FERME'],
        },
      },
    });

    res.status(200).json({
      status: 'success',
      data: {
        totalTickets,
        totalUtilisateurs,
        totalCentres,
        ticketsResolus,
        ticketsEnCours: totalTickets - ticketsResolus,
      },
    });
  } catch (error) {
    next(error);
  }
};

/*
 * IMPORTANT:
 * This export is required by your admin.routes.js.
 *
 * It returns the average response/resolution time grouped by day.
 */
export const obtenirTempsReponseParJour = async (req, res, next) => {
  try {
    const tickets = await prisma.ticket.findMany({
      where: {
        dateCreation: {
          not: null,
        },
        dateResolution: {
          not: null,
        },
      },
      select: {
        dateCreation: true,
        dateResolution: true,
      },
      orderBy: {
        dateCreation: 'asc',
      },
    });

    const parJour = {};

    for (const ticket of tickets) {
      if (!ticket.dateCreation || !ticket.dateResolution) {
        continue;
      }

      const date = new Date(ticket.dateCreation)
        .toISOString()
        .slice(0, 10);

      const creation = new Date(ticket.dateCreation).getTime();
      const resolution = new Date(ticket.dateResolution).getTime();

      const difference = resolution - creation;

      if (difference < 0) {
        continue;
      }

      if (!parJour[date]) {
        parJour[date] = {
          totalMs: 0,
          count: 0,
        };
      }

      parJour[date].totalMs += difference;
      parJour[date].count += 1;
    }

    const data = Object.entries(parJour).map(
      ([date, value]) => ({
        date,
        moyenneMs: Math.round(
          value.totalMs / value.count
        ),
        moyenneHeures: Number(
          (
            value.totalMs /
            value.count /
            (1000 * 60 * 60)
          ).toFixed(2)
        ),
        nombreTickets: value.count,
      })
    );

    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const changerMotDePasseAdmin = async (
  req,
  res,
  next
) => {
  try {
    const id = parseId(req.params.id);

    const nouveauMotDePasse =
      req.body.nouveauMotDePasse ||
      req.body.password;

    if (id === null) {
      return res.status(400).json({
        status: 'fail',
        message: 'ID invalide.',
      });
    }

    if (
      !nouveauMotDePasse ||
      nouveauMotDePasse.length < 6
    ) {
      return res.status(400).json({
        status: 'fail',
        message:
          'Mot de passe trop court (min 6 caractères).',
      });
    }

    const hashedPassword = await bcrypt.hash(
      nouveauMotDePasse,
      10
    );

    await prisma.utilisateur.update({
      where: { id },
      data: {
        motDePasse: hashedPassword,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Mot de passe mis à jour.',
    });
  } catch (error) {
    next(error);
  }
};

export const supprimerUtilisateur = async (
  req,
  res,
  next
) => {
  try {
    const userId = parseId(req.params.id);

    if (userId === null) {
      return res.status(400).json({
        status: 'fail',
        message: 'ID invalide.',
      });
    }

    if (req.user?.id === userId) {
      return res.status(400).json({
        status: 'fail',
        message:
          'Vous ne pouvez pas supprimer votre propre compte.',
      });
    }

    const [
      ticketsDeclares,
      commentaires,
    ] = await Promise.all([
      prisma.ticket.count({
        where: {
          employeId: userId,
        },
      }),
      prisma.commentaire.count({
        where: {
          auteurId: userId,
        },
      }),
    ]);

    if (
      ticketsDeclares > 0 ||
      commentaires > 0
    ) {
      return res.status(409).json({
        status: 'fail',
        message:
          "Cet utilisateur a des tickets ou commentaires. Désactivez-le au lieu de le supprimer.",
      });
    }

    await prisma.utilisateur.delete({
      where: {
        id: userId,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Utilisateur supprimé.',
    });
  } catch (error) {
    next(error);
  }
};

export const supprimerCentre = async (
  req,
  res,
  next
) => {
  try {
    const centreId = parseId(req.params.id);

    if (centreId === null) {
      return res.status(400).json({
        status: 'fail',
        message: 'ID invalide.',
      });
    }

    const centre = await prisma.centre.findUnique({
      where: {
        id: centreId,
      },
    });

    if (!centre) {
      return res.status(404).json({
        status: 'fail',
        message: 'Centre non trouvé.',
      });
    }

    await prisma.centre.delete({
      where: {
        id: centreId,
      },
    });

    res.status(200).json({
      status: 'success',
      message: 'Centre supprimé.',
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /admin/centers/:id/password
export const changerMotDePasseCentre = async (
  req,
  res,
  next
) => {
  try {
    const centreId = parseId(req.params.id);

    const nouveau =
      req.body.nouveauMotDePasse ||
      req.body.password;

    if (centreId === null) {
      return res.status(400).json({
        status: 'fail',
        message: 'ID invalide.',
      });
    }

    if (!nouveau || nouveau.length < 6) {
      return res.status(400).json({
        status: 'fail',
        message:
          'Mot de passe trop court (min 6 caractères).',
      });
    }

    const hashedPassword = await bcrypt.hash(
      nouveau,
      10
    );

    const result =
      await prisma.utilisateur.updateMany({
        where: {
          centreId,
          role: 'EMPLOYE',
        },
        data: {
          motDePasse: hashedPassword,
        },
      });

    if (result.count === 0) {
      return res.status(404).json({
        status: 'fail',
        message:
          'Aucun compte trouvé pour ce centre.',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Mot de passe mis à jour.',
    });
  } catch (error) {
    next(error);
  }
};
