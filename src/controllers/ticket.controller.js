import prisma from '../config/database.js';

export const creerTicket = async (req, res, next) => {
  try {
    const { titre, description, priorite, categorieId, departementId } = req.body;
    const ticket = await prisma.ticket.create({
      data: {
        titre,
        description,
        priorite: priorite || 'MOYENNE',
        statut: 'NOUVEAU_NON_VU',
        categorieId: categorieId ? parseInt(categorieId) : null,
        departementId: departementId ? parseInt(departementId) : null,
        employeId: req.user.id,
      },
    });
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
      whereClause.employeId = req.user.id;
    } else if (req.user.role === 'TECHNICIEN_IT') {
      // Technicians can view all tickets to manage and assign them
    }

    if (categorieId) whereClause.categorieId = parseInt(categorieId);
    if (statut) whereClause.statut = statut;

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: { employe: true, technicien: true, categorie: true, departement: true },
      orderBy: { dateCreation: 'desc' },
    });
    res.status(200).json({ status: 'success', data: tickets });
  } catch (error) {
    next(error);
  }
};

// Ticket.marquerCommeVu()
export const marquerCommeVu = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.ticket.findUnique({ where: { id: parseInt(id) } });

    if (!ticket) return res.status(404).json({ message: 'Ticket non trouvé.' });

    if (ticket.statut === 'NOUVEAU_NON_VU' && (req.user.role === 'TECHNICIEN_IT' || req.user.role === 'ADMINISTRATEUR')) {
      const updated = await prisma.ticket.update({
        where: { id: parseInt(id) },
        data: { statut: 'NOUVEAU_VU' },
      });
      return res.status(200).json({ status: 'success', data: updated });
    }

    res.status(200).json({ status: 'success', data: ticket });
  } catch (error) {
    next(error);
  }
};

// TechnicienIT.changerStatut()
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
    });
    res.status(200).json({ status: 'success', data: ticket });
  } catch (error) {
    next(error);
  }
};

// TechnicienIT.changerPriorite()
export const changerPriorite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { priorite } = req.body;

    const ticket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: { priorite },
    });
    res.status(200).json({ status: 'success', data: ticket });
  } catch (error) {
    next(error);
  }
};

// TechnicienIT.assignerTicket (Assign to me)
export const assignerTicket = async (req, res, next) => {
  try {
    const { id } = req.params;

    const ticket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        technicienId: req.user.id,
        statut: 'EN_COURS'
      },
    });

    res.status(200).json({ status: 'success', data: ticket });
  } catch (error) {
    next(error);
  }
};

// Employe.confirmerResolution() & Ticket.cloturer()
export const confirmerResolution = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: {
        statut: 'FERME',
        dateCloture: new Date(),
      },
    });
    res.status(200).json({ status: 'success', message: 'Ticket clôturé avec succès.', data: ticket });
  } catch (error) {
    next(error);
  }
};