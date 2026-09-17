import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Password123', 10);

  // 1. Create Default Department
  const dept = await prisma.departement.upsert({
    where: { nom: 'Informatique' },
    update: {},
    create: {
      nom: 'Informatique',
      codeBureau: 'INF-101'
    }
  });

  // 2. Create Categories
  await prisma.categorie.upsert({
    where: { nom: 'Maintenance' },
    update: {},
    create: {
      nom: 'Maintenance',
      description: 'Maintenance du materiel et des equipements'
    }
  });

  await prisma.categorie.upsert({
    where: { nom: 'Reseau' },
    update: {},
    create: {
      nom: 'Reseau',
      description: 'Problemes de connexion, routeurs et cablage'
    }
  });

  await prisma.categorie.upsert({
    where: { nom: 'Site Web' },
    update: {},
    create: {
      nom: 'Site Web',
      description: 'Problemes lies a la plateforme web et aux acces'
    }
  });

  // 3. Admin User
  await prisma.utilisateur.upsert({
    where: { email: 'admin@ufc.dz' },
    update: { motDePasse: hashedPassword },
    create: {
      nom: 'sadi',
      prenom: 'Amani',
      email: 'admin@ufc.dz',
      motDePasse: hashedPassword,
      role: 'ADMINISTRATEUR',
      statutActif: true
    }
  });

  // 4. Employee User
  await prisma.utilisateur.upsert({
    where: { email: 'employe@ufc.dz' },
    update: { motDePasse: hashedPassword },
    create: {
      nom: 'Benali',
      prenom: 'Karim',
      email: 'employe@ufc.dz',
      motDePasse: hashedPassword,
      role: 'EMPLOYE',
      statutActif: true,
      departementId: dept.id
    }
  });

  // 5. Technician - Maintenance
  await prisma.utilisateur.upsert({
    where: { email: 'maintenance.tech@ufc.dz' },
    update: { motDePasse: hashedPassword, specialite: 'Maintenance' },
    create: {
      nom: 'Mansouri',
      prenom: 'Sami',
      email: 'maintenance.tech@ufc.dz',
      motDePasse: hashedPassword,
      role: 'TECHNICIEN_IT',
      statutActif: true,
      specialite: 'Maintenance',
      departementId: dept.id
    }
  });

  // 6. Technician - Reseau
  await prisma.utilisateur.upsert({
    where: { email: 'reseau.tech@ufc.dz' },
    update: { motDePasse: hashedPassword, specialite: 'Reseau' },
    create: {
      nom: 'Brahimi',
      prenom: 'Amine',
      email: 'reseau.tech@ufc.dz',
      motDePasse: hashedPassword,
      role: 'TECHNICIEN_IT',
      statutActif: true,
      specialite: 'Reseau',
      departementId: dept.id
    }
  });

  // 7. Technician - Site Web
  await prisma.utilisateur.upsert({
    where: { email: 'web.tech@ufc.dz' },
    update: { motDePasse: hashedPassword, specialite: 'Site Web' },
    create: {
      nom: 'Ziani',
      prenom: 'Meriem',
      email: 'web.tech@ufc.dz',
      motDePasse: hashedPassword,
      role: 'TECHNICIEN_IT',
      statutActif: true,
      specialite: 'Site Web',
      departementId: dept.id
    }
  });

  console.log('Seed executed successfully with all categories and 3 dedicated technicians!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });