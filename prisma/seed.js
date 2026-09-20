import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Password123', 10);

  // 1. Create Categories
  const categories = [
    { nom: 'Maintenance', description: 'Maintenance du materiel et des equipements' },
    { nom: 'Reseau', description: 'Problemes de connexion, routeurs et cablage' },
    { nom: 'Site Web', description: 'Problemes lies a la plateforme web et aux acces' }
  ];

  for (const cat of categories) {
    await prisma.categorie.upsert({
      where: { nom: cat.nom },
      update: {},
      create: cat
    });
  }

  // 2. Admin User
  await prisma.utilisateur.upsert({
    where: { email: 'admin@ufc.dz' },
    update: { motDePasse: hashedPassword },
    create: {
      nom: 'sadi',
      prenom: 'Amani',
      email: 'admin@ufc.dz',
      motDePasse: hashedPassword,
      role: Role.ADMINISTRATEUR,
      statutActif: true
    }
  });

  // 3. The 11 Technicians and their assigned Centers
  const techMappings = [
    { nom: 'صفية', prenom: 'Safia', centers: ['وهران', 'معسكر', 'سعيدة', 'البليدة', 'ميلة', 'سكيكدة'] },
    { nom: 'عبد الرؤوف', prenom: 'Abderraouf', centers: ['الجلفة', 'غرداية', 'تيسيمسيلت'] },
    { nom: 'كريمة', prenom: 'Karima', centers: ['بشار', 'تندوف', 'سيدي بلعباس', 'عين تموشنت'] },
    { nom: 'سميرة', prenom: 'Samira', centers: ['برج بوعريريج', 'جيجل', 'النعامة', 'البويرة', 'تبسة'] },
    { nom: 'لمياء', prenom: 'Lamia', centers: ['المدية', 'تيبازة', 'عين الدفلى', 'بجاية'] },
    { nom: 'منير', prenom: 'Mounir', centers: ['الجزائر شرق', 'باب الزوار', 'بن عكنون', 'بومرداس'] },
    { nom: 'عبد الرحمن', prenom: 'Abderrahmane', centers: ['بسكرة', 'أم البواقي', 'تلمسان', 'سوق أهراس', 'إيليزي'] },
    { nom: 'جميلة', prenom: 'Djamila', centers: ['قسنطينة', 'عنابة', 'الطارف', 'بوزريعة'] },
    { nom: 'سهيلة', prenom: 'Souhila', centers: ['قالمة', 'تقرت', 'الوادي', 'الخروبة'] },
    { nom: 'سامية', prenom: 'Samia', centers: ['خنشلة', 'ورقلة', 'سطيف', 'تيارت', 'مستغانم', 'البيض'] },
    { nom: 'مصطفى', prenom: 'Mostefa', centers: ['تمنراست', 'تيزي وزو', 'المسيلة', 'الشلف', 'خميس مليانة', 'غليزان', 'أدرار', 'باتنة'] }
  ];

  let centerCounter = 1;

  for (const t of techMappings) {
    const techEmail = `${t.prenom.toLowerCase()}@ufc.dz`;

    // Upsert technician account
    const techUser = await prisma.utilisateur.upsert({
      where: { email: techEmail },
      update: { motDePasse: hashedPassword, statutActif: true },
      create: {
        nom: t.nom,
        prenom: t.prenom,
        email: techEmail,
        motDePasse: hashedPassword,
        role: Role.TECHNICIEN_IT,
        statutActif: true,
        specialite: 'Support Régional'
      }
    });

    // For each center, create the Center record and its unique login account
    for (const centerName of t.centers) {
      const center = await prisma.centre.upsert({
        where: { nom: centerName },
        update: { technicienId: techUser.id },
        create: {
          nom: centerName,
          technicienId: techUser.id
        }
      });

      const centerEmail = `centre.${centerCounter}@ufc.dz`;
      centerCounter++;

      // Create login account for this center
      await prisma.utilisateur.upsert({
        where: { email: centerEmail },
        update: { motDePasse: hashedPassword, centreId: center.id },
        create: {
          nom: `Centre ${centerName}`,
          prenom: 'UFC',
          email: centerEmail,
          motDePasse: hashedPassword,
          role: Role.EMPLOYE,
          statutActif: true,
          centreId: center.id
        }
      });
    }
  }

  console.log('Seed executed successfully: Technicians, centers, and center accounts created (no departments)!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });