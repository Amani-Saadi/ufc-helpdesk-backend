import prisma from '../config/database.js';
import {
  creerNotification,
  notifierLesTechniciens
} from '../utils/notification.util.js';

export const creerTicket = async (req, res, next) => {
  try {
    const {
      titre,
      description,
      priorite,
      categorieId,
      centerId
    } = req.body;

    const employeId = Number(req.user.id);

    if (!employeId) {
      return res.status(401).json({
        message: 'Utilisateur non authentifié.'
      });
    }

    // Always read the employee and their center from the database.
    const dbUser = await prisma.utilisateur.findUnique({
      where: {
        id: employeId
      },
      select: {
        id: true,
        role: true,
        centreId: true,
        centre: {
          select: {
            id: true,
            nom: true,
            codeBureau: true,
            statutActif: true,
            technicienId: true
          }
        }
      }
    });

    if (!dbUser) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé.'
      });
    }

    // Employees MUST create tickets for their own center.
    // Admins/technicians can provide a centerId.
    const requestedCentreId =
      centerId
        ? Number.parseInt(centerId, 10)
        : null;

    const targetCentreId =
      dbUser.role === 'EMPLOYE'
        ? dbUser.centreId
        : (
            Number.isInteger(requestedCentreId)
              ? requestedCentreId
              : dbUser.centreId
          );

    console.log('--- TICKET ROUTING ---');
    console.log('employeeId:', employeId);
    console.log(
      'employee centreId from DB:',
      dbUser.centreId
    );
    console.log(
      'centerId from request:',
      centerId
    );
    console.log(
      'targetCentreId:',
      targetCentreId
    );

    if (!targetCentreId) {
      return res.status(400).json({
        message:
          'Aucun centre n’est associé à votre compte. Contactez l’administrateur.'
      });
    }

    const center = await prisma.centre.findUnique({
      where: {
        id: targetCentreId
      },
      select: {
        id: true,
        nom: true,
        codeBureau: true,
        statutActif: true,
        technicienId: true,
        technicien: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true,
            statutActif: true
          }
        }
      }
    });

    if (!center) {
      return res.status(400).json({
        message:
          'Centre sélectionné introuvable.'
      });
    }

    if (!center.statutActif) {
      return res.status(400).json({
        message:
          'Le centre sélectionné est désactivé.'
      });
    }

    // Primary routing:
    // Centre.technicienId
    let technicienId =
      center.technicienId || null;

    // Fallback routing:
    // Look for a technician connected to this center
    // through the many-to-many relation.
    if (!technicienId) {
      const assignedTechnician =
        await prisma.utilisateur.findFirst({
          where: {
            role: 'TECHNICIEN_IT',
            statutActif: true,
            centres: {
              some: {
                id: center.id
              }
            }
          },
          select: {
            id: true
          }
        });

      technicienId =
        assignedTechnician?.id || null;
    }

    // Final safety check:
    // only assign an active IT technician.
    if (technicienId) {
      const technician =
        await prisma.utilisateur.findFirst({
          where: {
            id: technicienId,
            role: 'TECHNICIEN_IT',
            statutActif: true
          },
          select: {
            id: true
          }
        });

      if (!technician) {
        technicienId = null;
      }
    }

    console.log(
      'assigned technicienId:',
      technicienId
    );

    console.log(
      'assigned center:',
      center.nom
    );

    const ticket =
      await prisma.ticket.create({
        data: {
          titre,
          description,
          priorite:
            priorite || 'MOYENNE',
          statut:
            'NOUVEAU_NON_VU',
          categorieId:
            categorieId
              ? Number.parseInt(
                  categorieId,
                  10
                )
              : null,
          centreId:
            targetCentreId,
          technicienId,
          employeId
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

    // Notify assigned technician.
    if (ticket.technicienId) {
      await creerNotification(
        ticket.technicienId,
        `Nouveau ticket de centre (#${ticket.id}): ${ticket.titre}`
      );
    } else {
      // Only happens when the center has no active IT technician.
      await notifierLesTechniciens(
        `Nouveau ticket sans technicien assigné (#${ticket.id}): ${ticket.titre}`
      );
    }

    return res.status(201).json({
      status: 'success',
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

export const consulterTickets = async (
  req,
  res,
  next
) => {
  try {
    const {
      categorieId,
      statut
    } = req.query;

    let whereClause = {};

    /*
     * EMPLOYEE
     */
    if (req.user.role === 'EMPLOYE') {
      if (req.user.centreId) {
        whereClause.OR = [
          {
            employeId: req.user.id
          },
          {
            centreId: req.user.centreId
          }
        ];
      } else {
        whereClause.employeId =
          req.user.id;
      }
    }

    /*
     * IT TECHNICIAN
     */
    else if (
      req.user.role === 'TECHNICIEN_IT'
    ) {
      /*
       * IMPORTANT:
       * The old code used technicianCentersMap,
       * but that variable was never defined.
       *
       * We now read the technician's centers
       * directly from the database.
       */
      const dbUser =
        await prisma.utilisateur.findUnique({
          where: {
            id: req.user.id
          },
          select: {
            id: true,
            role: true,
            nom: true,
            prenom: true,
            specialite: true,
            centreId: true,
            centres: {
              select: {
                id: true
              }
            }
          }
        });

      const techSpecialty =
        dbUser?.specialite
          ? String(
              dbUser.specialite
            ).trim()
          : '';

      /*
       * Always show tickets directly assigned
       * to this technician.
       */
      const orConditions = [
        {
          technicienId:
            req.user.id
        }
      ];

      /*
       * Build the list of centers assigned
       * to this technician.
       */
      const centerIds =
        new Set();

      // Primary center
      if (dbUser?.centreId) {
        centerIds.add(
          dbUser.centreId
        );
      }

      // Many-to-many centers
      for (
        const centre
        of dbUser?.centres || []
      ) {
        if (centre?.id) {
          centerIds.add(
            centre.id
          );
        }
      }

      /*
       * Show tickets belonging to the
       * technician's assigned centers.
       */
      if (centerIds.size > 0) {
        orConditions.push({
          centreId: {
            in: [
              ...centerIds
            ]
          }
        });
      }

      /*
       * Keep specialty-based visibility.
       */
      if (techSpecialty) {
        orConditions.push({
          categorie: {
            nom: {
              contains:
                techSpecialty,
              mode:
                'insensitive'
            }
          }
        });
      }

      whereClause.OR =
        orConditions;
    }

    /*
     * CATEGORY FILTER
     */
    if (
      categorieId &&
      categorieId !== 'all' &&
      !isNaN(
        parseInt(
          categorieId
        )
      )
    ) {
      whereClause.categorieId =
        parseInt(
          categorieId
        );
    }

    /*
     * STATUS FILTER
     */
    if (
      statut &&
      statut !== 'all'
    ) {
      whereClause.statut =
        statut;
    }

    const tickets =
      await prisma.ticket.findMany({
        where:
          whereClause,
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
        orderBy: {
          dateCreation:
            'desc'
        }
      });

    res.status(200).json({
      status: 'success',
      data: tickets
    });
  } catch (error) {
    next(error);
  }
};

export const marquerCommeVu = async (
  req,
  res,
  next
) => {
  try {
    const { id } =
      req.params;

    const ticket =
      await prisma.ticket.findUnique({
        where: {
          id: parseInt(id)
        },
        include: {
          categorie: true,
          centre: true,
          employe: {
            include: {
              centre: true
            }
          },
          technicien: true
        }
      });

    if (!ticket) {
      return res.status(404).json({
        message:
          'Ticket non trouvé.'
      });
    }

    if (
      ticket.statut ===
        'NOUVEAU_NON_VU' &&
      (
        req.user.role ===
          'TECHNICIEN_IT' ||
        req.user.role ===
          'ADMINISTRATEUR'
      )
    ) {
      const updated =
        await prisma.ticket.update({
          where: {
            id: parseInt(id)
          },
          data: {
            statut:
              'NOUVEAU_VU'
          },
          include: {
            categorie: true,
            centre: true,
            employe: {
              include: {
                centre: true
              }
            },
            technicien: true
          }
        });

      return res.status(200).json({
        status: 'success',
        data: updated
      });
    }

    res.status(200).json({
      status: 'success',
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

export const changerStatut = async (
  req,
  res,
  next
) => {
  try {
    const { id } =
      req.params;

    const { statut } =
      req.body;

    const updateData = {
      statut
    };

    if (statut === 'RESOLU') {
      updateData.dateResolution =
        new Date();
    }

    if (statut === 'FERME') {
      updateData.dateCloture =
        new Date();
    }

    // Ticket reopened:
    // reset resolution/cloture dates.
    if (
      statut !== 'RESOLU' &&
      statut !== 'FERME'
    ) {
      updateData.dateResolution =
        null;

      updateData.dateCloture =
        null;
    }

    const ticket =
      await prisma.ticket.update({
        where: {
          id: parseInt(id)
        },
        data: updateData,
        include: {
          categorie: true,
          centre: true,
          employe: {
            include: {
              centre: true
            }
          },
          technicien: true
        }
      });

    if (ticket.employeId) {
      await creerNotification(
        ticket.employeId,
        `Le statut de votre ticket #${ticket.id} est maintenant : ${statut}`
      );
    }

    res.status(200).json({
      status: 'success',
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

export const changerPriorite = async (
  req,
  res,
  next
) => {
  try {
    const { id } =
      req.params;

    const { priorite } =
      req.body;

    const ticket =
      await prisma.ticket.update({
        where: {
          id: parseInt(id)
        },
        data: {
          priorite
        },
        include: {
          categorie: true,
          centre: true,
          employe: {
            include: {
              centre: true
            }
          },
          technicien: true
        }
      });

    if (ticket.employeId) {
      await creerNotification(
        ticket.employeId,
        `La priorité de votre ticket #${ticket.id} a été modifiée à : ${priorite}`
      );
    }

    res.status(200).json({
      status: 'success',
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

export const assignerTicket = async (
  req,
  res,
  next
) => {
  try {
    const { id } =
      req.params;

    const ticket =
      await prisma.ticket.update({
        where: {
          id: parseInt(id)
        },
        data: {
          technicienId:
            req.user.id,
          statut:
            'EN_COURS'
        },
        include: {
          categorie: true,
          centre: true,
          employe: {
            include: {
              centre: true
            }
          },
          technicien: true
        }
      });

    if (ticket.employeId) {
      await creerNotification(
        ticket.employeId,
        `Votre ticket #${ticket.id} a été pris en charge par un technicien.`
      );
    }

    res.status(200).json({
      status: 'success',
      data: ticket
    });
  } catch (error) {
    next(error);
  }
};

export const confirmerResolution =
  async (
    req,
    res,
    next
  ) => {
    try {
      const { id } =
        req.params;

      const ticket =
        await prisma.ticket.update({
          where: {
            id: parseInt(id)
          },
          data: {
            statut:
              'FERME',
            dateCloture:
              new Date()
          },
          include: {
            categorie: true,
            centre: true,
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
          `L'employé a confirmé la résolution du ticket #${ticket.id}.`
        );
      }

      res.status(200).json({
        status: 'success',
        message:
          'Ticket clôturé avec succès.',
        data: ticket
      });
    } catch (error) {
      next(error);
    }
  };

// Only expose safe author fields (never the password hash)
const AUTEUR_SELECT = {
  id: true,
  nom: true,
  prenom: true,
  email: true,
  role: true
};

export const consulterCommentaires = async (req, res, next) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (Number.isNaN(ticketId)) {
      return res.status(400).json({ status: 'error', message: 'ID de ticket invalide' });
    }

    const commentaires = await prisma.commentaire.findMany({
      where: { ticketId },
      include: { auteur: { select: AUTEUR_SELECT } },
      orderBy: { dateCreation: 'asc' }
    });

    res.status(200).json({ status: 'success', data: commentaires });
  } catch (error) {
    console.error('[consulterCommentaires]', error);
    next(error);
  }
};

export const ajouterCommentaire = async (req, res, next) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    if (Number.isNaN(ticketId)) {
      return res.status(400).json({ status: 'error', message: 'ID de ticket invalide' });
    }

    const contenu = String(req.body?.contenu ?? req.body?.texte ?? req.body?.content ?? '').trim();
    if (!contenu) {
      return res.status(400).json({ status: 'error', message: 'Le contenu du commentaire est requis' });
    }

    // Check the ticket first: avoids a foreign-key crash on a bad ticket id
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { employeId: true, technicienId: true, titre: true }
    });
    if (!ticket) {
      return res.status(404).json({ status: 'error', message: 'Ticket non trouvé' });
    }

    const commentaire = await prisma.commentaire.create({
      data: { contenu, ticketId, auteurId: req.user.id },
      include: { auteur: { select: AUTEUR_SELECT } }
    });

    // Notification is best-effort: if it fails, the comment is still saved
    // and the user must not see an error for a comment that actually exists.
    try {
      const destinataireId =
        req.user.id === ticket.employeId ? ticket.technicienId : ticket.employeId;
      if (destinataireId) {
        await creerNotification(
          destinataireId,
          `Nouveau commentaire sur le ticket #${ticketId} (${ticket.titre})`
        );
      }
    } catch (notifError) {
      console.error('[ajouterCommentaire] notification failed:', notifError);
    }

    res.status(201).json({ status: 'success', data: commentaire });
  } catch (error) {
    console.error('[ajouterCommentaire]', error);
    next(error);
  }
};

export const telechargerFichier =
  async (
    req,
    res,
    next
  ) => {
    try {
      const { fichierId } =
        req.params;

      const fichier =
        await prisma.fichierJoint.findUnique({
          where: {
            id: parseInt(
              fichierId
            )
          }
        });

      if (!fichier) {
        return res.status(404).json({
          message:
            'Fichier non trouvé.'
        });
      }

      res.download(
        fichier.cheminFichier,
        fichier.nomFichier
      );
    } catch (error) {
      next(error);
    }
  };