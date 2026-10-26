# Plan de réalisation — Publicom Cartographie V2

**Statut :** prêt à démarrer après validation technique  
**Référence :** `CAHIER_DES_CHARGES.md`

## 1. Décisions de conception

La V2 sera une application indépendante du prototype. Aucun code, style ou fichier de template de l'ancien projet ne sera repris ; seules les huit zones métier et certains contenus réels pourront servir de référence après vérification.

### Architecture proposée

| Couche | Choix proposé | Rôle |
| --- | --- | --- |
| Interface web | Next.js avec TypeScript | Application responsive, SEO, composants réutilisables et pages publiques. |
| Design | Tailwind CSS + bibliothèque de composants accessible | Système visuel cohérent, rapide à faire évoluer et accessible. |
| Cartographie | MapLibre GL JS + fond cartographique OpenStreetMap/MapTiler | Carte vectorielle moderne, marqueurs, regroupement et zones interactives. |
| API et données | Next.js API + PostgreSQL + Prisma | Catalogue structuré, formulaires et espace d'administration. |
| Médias | Stockage objet compatible S3 | Photos optimisées, sécurisées et indépendantes du code. |
| Authentification | Auth.js avec rôles administrateur | Protection de l'administration et gestion des comptes internes. |
| Emails | Fournisseur transactionnel | Notification de demande de devis et accusé de réception. |
| Qualité | ESLint, Prettier, tests unitaires et Playwright | Fiabilité et tests des parcours essentiels. |

Les fournisseurs exacts d'hébergement, d'email et de fond cartographique seront sélectionnés avant la mise en production selon le budget et le domaine de Publicom. Pendant le développement, des configurations locales et de démonstration seront utilisées.

## 2. Structure fonctionnelle

### Pages publiques

- `/` : accueil, proposition de valeur, aperçu des zones et appel à l'action vers la carte.
- `/carte` : carte, recherche, filtres, liste synchronisée et sélection.
- `/supports/[slug]` : fiche détaillée d'un support et ajout à la sélection.
- `/selection` : récapitulatif des supports retenus.
- `/demande-devis` : formulaire associé à la sélection.
- `/a-propos`, `/contact`, `/mentions-legales`, `/confidentialite` : pages institutionnelles et légales.

### Administration

- `/admin` : tableau de bord.
- `/admin/zones` : gestion des zones.
- `/admin/supports` : création, modification, publication, archivage et ajout de médias.
- `/admin/demandes` : liste et qualification manuelle des demandes de devis.

## 3. Modèle de données initial

### Entités principales

| Entité | Champs essentiels | Usage |
| --- | --- | --- |
| Zone | nom, slug, ville, description, couleur, géométrie, statut | Regroupe les supports sur la carte et dans les filtres. |
| Support | référence, nom, slug, zone, coordonnées, adresse, type, dimensions, orientation, éclairage, statut, tarif indicatif, publication | Représente un emplacement commercialisable. |
| Média | support, fichier, texte alternatif, ordre, photo principale | Alimente les galeries et aperçus cartographiques. |
| Disponibilité | support, statut, début, fin, note interne | Gère l'information affichée sans exposer une logique de réservation. |
| Sélection | identifiant temporaire, supports, date d'expiration | Conserve le panier de supports d'un visiteur. |
| Demande de devis | contact, société, campagne, période, message, supports, consentement, statut de traitement | Enregistre et notifie une demande commerciale. |
| Utilisateur | email, nom, rôle, dernier accès | Donne accès à l'administration. |

### Référentiel de zones de lancement

| Code | Nom affiché | Ville |
| --- | --- | --- |
| ZU1 | Zone Urbaine 1 | Libreville |
| ZU2 | Zone Urbaine 2 | Libreville |
| ZU3 | Zone Urbaine 3 | Libreville |
| ZU4 | Zone Urbaine 4 | Libreville |
| ZU5 | Zone Urbaine 5 | Libreville |
| ZA1 | Zone Aéroportuaire 1 | Libreville — Aéroport / Okala |
| ZA2 | Zone Aéroportuaire 2 | Libreville — Aéroport / Okala |
| ZA3 | Zone Aéroportuaire 3 | Libreville — Voie de contournement |

Les coordonnées et contours ne seront pas inventés : la première implémentation utilisera des données de démonstration explicitement identifiées, remplacées avant publication par les positions validées par Publicom.

## 4. Découpage en phases

### Phase 0 — socle et conventions

- Initialiser le dépôt applicatif dans ce dossier, le typage, l'outillage et les variables d'environnement.
- Mettre en place le design system de base : couleurs, typographies, boutons, formulaires, cartes et états d'interface.
- Configurer la base de données locale et les jeux de données de démonstration.
- Ajouter le contrôle de qualité, les conventions et la documentation de démarrage.

**Validation :** application lancée localement, données de test chargées et contrôles automatiques opérationnels.

### Phase 1 — expérience publique de découverte

- Réaliser l'accueil et la navigation principale.
- Construire la page carte avec marqueurs, regroupement, légende et vue liste.
- Ajouter recherche, filtres et synchronisation carte/liste.
- Créer la fiche support avec galerie, caractéristiques, tarif et disponibilité.

**Validation :** un visiteur peut filtrer, ouvrir et consulter tous les supports de démonstration sur ordinateur et mobile.

### Phase 2 — sélection et demande de devis

- Mettre en place la sélection persistante côté visiteur.
- Créer le récapitulatif et le formulaire de demande.
- Valider, stocker et notifier la demande par email.
- Ajouter les messages d'erreur, succès et protection anti-spam.

**Validation :** une demande complète contient les supports sélectionnés, est stockée et notifiée correctement.

### Phase 3 — espace d'administration

- Ajouter authentification et rôle administrateur.
- Créer la gestion des zones, supports, médias, disponibilités et tarifs.
- Ajouter publication, brouillon et archivage.
- Afficher et qualifier les demandes de devis.

**Validation :** un administrateur peut publier un nouveau support sans intervention technique.

**État :** le schéma des comptes et sessions administrateurs est prêt. L'interface et l'authentification seront ajoutées après configuration du premier compte interne.

### Phase 4 — qualité et mise en ligne

- Compléter les contenus réels, coordonnées, photos et textes alternatifs.
- Optimiser performances, référencement, accessibilité et compatibilité navigateurs.
- Exécuter tests de parcours, recette métier et contrôle des liens/médias.
- Configurer hébergement, domaine, sauvegardes, suivi d'erreurs et production.

**Validation :** recette signée sur les contenus réels et mise en ligne contrôlée.

## 5. Priorité de la première implémentation

La première itération de code couvrira seulement le socle et la découverte publique : structure de l'application, identité visuelle, données de démonstration, carte, filtres, liste et fiche support. La demande de devis sera conçue dès le départ dans le modèle de données, mais pourra être livrée après validation de l'expérience de carte.

## 6. Règles de réalisation

- Ne pas intégrer de contenu issu de l'ancien site sans validation de sa pertinence et de ses droits d'usage.
- Ne jamais afficher une audience si cette donnée n'est pas validée ; la fonctionnalité n'en dépend pas.
- Ne pas afficher un tarif ou une disponibilité sans date de mise à jour claire.
- Rendre toute fonction cartographique utilisable au clavier et disponible en mode liste.
- Optimiser toutes les images avant publication et imposer un texte alternatif significatif.
- Écrire les tests au fil des parcours, pas uniquement à la fin.

## 7. Prochaine action

Après validation de ce plan, démarrer la phase 0 : initialiser le projet applicatif, installer le socle technique et créer les premières données de démonstration des huit zones.
