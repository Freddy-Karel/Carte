# Cahier des charges — Publicom Cartographie V2

**Statut :** document de cadrage à valider  
**Version :** 0.1  
**Produit :** plateforme web de consultation et de valorisation du réseau d'affichage Publicom à Libreville

## 1. Vision du projet

Publicom Cartographie V2 est une application web moderne permettant de découvrir, localiser et qualifier les emplacements publicitaires de Publicom. Le produit doit transformer une simple carte illustrative en outil commercial : un prospect identifie rapidement les supports adaptés à sa campagne et peut demander une proposition ; l'équipe Publicom dispose d'une source de vérité maintenable pour présenter son parc.

Le premier périmètre couvre Libreville et les zones aéroportuaires. L'architecture doit toutefois permettre l'ajout de nouvelles villes, zones et formats sans refonte.

## 2. Objectifs

### Objectifs métier

- Valoriser l'offre d'affichage Publicom par une présentation crédible et qualitative.
- Réduire le temps nécessaire pour identifier des emplacements pertinents.
- Générer des demandes commerciales qualifiées.
- Centraliser les informations de chaque support dans une interface cohérente.
- Donner aux équipes la possibilité de maintenir le catalogue sans modifier le code.

### Objectifs utilisateurs

- Comprendre l'étendue du réseau en quelques secondes.
- Explorer une carte fluide, lisible et utilisable sur mobile comme sur ordinateur.
- Rechercher ou filtrer les supports selon une zone, un format, un budget indicatif ou une disponibilité.
- Consulter une fiche support claire avec photos, localisation et caractéristiques.
- Constituer une sélection puis envoyer une demande de devis.

### Indicateurs de réussite

- Un visiteur atteint une fiche support en trois interactions maximum.
- La carte et les premiers résultats deviennent utilisables en moins de trois secondes sur une connexion mobile standard.
- Chaque support publié possède au minimum : titre, coordonnées, zone, format, photo, statut et appel à l'action.
- Les demandes de devis indiquent les supports sélectionnés et les coordonnées du prospect.

## 3. Utilisateurs cibles

| Profil | Attentes principales |
| --- | --- |
| Annonceur / marque | Trouver des emplacements pour une campagne, comparer les possibilités, demander un devis. |
| Agence média / communication | Préparer une recommandation avec des supports, zones et informations fiables. |
| Commercial Publicom | Présenter le parc, créer une sélection et suivre les demandes. |
| Administrateur Publicom | Créer, modifier, publier ou archiver les zones et supports. |

## 4. Périmètre fonctionnel — version initiale

### 4.1 Carte interactive

- Afficher une carte professionnelle de Libreville avec fond cartographique adapté et identité Publicom.
- Positionner les supports par marqueurs regroupés automatiquement à faible niveau de zoom.
- Afficher les zones commerciales (urbaine 1 à 5, aéroportuaires, etc.) sous forme de contours ou d'ensembles visuels.
- Au clic ou au toucher, ouvrir un aperçu de support puis sa fiche détaillée.
- Permettre zoom, déplacement, recentrage et géolocalisation facultative de l'utilisateur.
- Conserver une alternative sous forme de liste pour les utilisateurs ne pouvant ou ne souhaitant pas utiliser la carte.

### 4.2 Catalogue et recherche

- Lister les supports sous forme de cartes avec photo, nom, zone, format et statut.
- Rechercher par mot-clé, zone, quartier ou repère.
- Filtrer par zone, type de support, format, orientation, éclairage, disponibilité et fourchette de budget si cette donnée est publiée.
- Trier par pertinence, proximité, nouveauté ou disponibilité.
- Synchroniser la liste et la carte : un filtre appliqué affecte les deux vues.

### 4.3 Fiche support

Chaque fiche doit afficher :

- Identifiant et nom commercial du support.
- Zone, adresse ou repère, coordonnées cartographiques.
- Galerie de photos réelles, avec photo principale et légendes facultatives.
- Type de support, dimensions, orientation, visibilité, éclairage et audience/flux si les données sont disponibles.
- Statut : disponible, optionné, réservé ou indisponible.
- Supports ou emplacements similaires.
- Boutons « Ajouter à ma sélection » et « Demander un devis ».

### 4.4 Sélection et demande de devis

- Créer une sélection persistante pendant la visite, comparable à un panier.
- Ajouter ou retirer des supports depuis la carte, la liste ou les fiches.
- Afficher le nombre de supports sélectionnés et un récapitulatif clair.
- Permettre l'envoi d'une demande contenant : identité, société, email, téléphone, période de campagne, message et supports sélectionnés.
- Confirmer l'envoi à l'écran et envoyer une notification à l'équipe commerciale.
- Prévoir un consentement explicite lié aux données personnelles.

### 4.5 Administration

- Protéger l'accès à un espace d'administration par authentification.
- Gérer les zones, supports, photos, statuts, caractéristiques et contenus éditoriaux.
- Importer ou modifier plusieurs supports via un fichier tableur normalisé, si nécessaire après la première version.
- Conserver les brouillons, la publication et l'archivage pour éviter l'affichage de données incomplètes.
- Afficher un tableau de bord minimal : nombre de supports publiés, demandes reçues et taux de disponibilité.

### 4.6 Pages institutionnelles

- Accueil : proposition de valeur, entrée vers la carte et exemples de supports.
- Carte / catalogue : expérience principale.
- À propos de Publicom : présentation, contacts et zones couvertes.
- Contact et demande de devis.
- Mentions légales, politique de confidentialité et gestion des cookies/analytiques.

## 5. Parcours prioritaires

### Parcours A — découverte d'un support

1. Le visiteur arrive sur l'accueil et ouvre la carte.
2. Il recherche une zone ou applique un filtre.
3. Il clique sur un marqueur ou une carte de résultat.
4. Il consulte la fiche et ajoute le support à sa sélection.

### Parcours B — demande commerciale

1. Le visiteur constitue une sélection d'un ou plusieurs supports.
2. Il ouvre le récapitulatif et vérifie les emplacements.
3. Il renseigne ses coordonnées et son besoin de campagne.
4. Publicom reçoit une demande structurée et le visiteur reçoit une confirmation.

### Parcours C — mise à jour d'un support

1. Un administrateur se connecte à l'espace sécurisé.
2. Il crée ou modifie un support, ajoute ses photos et définit son statut.
3. Il contrôle l'aperçu puis publie les changements.
4. La carte et le catalogue reflètent immédiatement les données publiées.

## 6. Exigences d'expérience et de design

- Direction artistique sobre, premium, urbaine et cohérente avec la marque Publicom.
- Carte au centre de l'expérience ; interface aérée, contrastée et sans surcharge de bibliothèques visuelles.
- Design mobile-first : filtres accessibles, fiche en panneau coulissant, sélection toujours visible.
- États explicites pour chargement, absence de résultat, erreur, support indisponible et succès d'envoi.
- Conformité cible WCAG 2.2 niveau AA : navigation clavier, libellés, contrastes, focus visible, textes alternatifs et structure sémantique.
- Français comme langue initiale ; préparer les contenus et l'interface à une traduction future.

## 7. Données à préparer

Pour chaque zone : nom, ville, description courte, ordre d'affichage et géométrie/coordonnées.

Pour chaque support : identifiant, nom, zone, latitude, longitude, adresse/repère, type, dimensions, orientation, éclairage, description, photos, statut, dates de disponibilité, tarif ou règle de tarification, date de mise à jour et publication.

Pour chaque demande : date, coordonnées du contact, contexte de campagne, période souhaitée, message, supports sélectionnés, consentement et statut de traitement.

Les valeurs commerciales sensibles (prix, inventaire détaillé, audience) doivent être validées par Publicom avant publication ou réservées à l'espace interne.

## 8. Exigences techniques

- Application web responsive, performante et SEO-friendly.
- Cartographie basée sur une solution moderne et maintenue (par exemple Mapbox ou Leaflet avec un fournisseur de tuiles approprié) ; le choix final dépendra du budget, du volume et des conditions d'usage.
- Front-end moderne composant par composant ; aucune dépendance de template héritée de l'ancien projet.
- API sécurisée et base de données relationnelle pour les supports, zones, médias et demandes.
- Stockage optimisé des images avec redimensionnement, formats modernes et chargement différé.
- Validation serveur des formulaires, protection anti-spam, journalisation des erreurs et sauvegardes.
- Environnements séparés : développement, préproduction et production.
- Documentation d'installation, configuration, données de démonstration et procédures d'administration.

## 9. Qualité, sécurité et conformité

- Tous les liens, images et appels à l'action doivent être testés avant mise en ligne.
- Les données saisies doivent être chiffrées en transit (HTTPS) et protégées contre les entrées malveillantes.
- Accès administrateur avec mots de passe robustes, rôles et traçabilité des actions sensibles.
- Collecte limitée aux données nécessaires, durée de conservation définie et information des utilisateurs.
- Mesure d'audience respectueuse du consentement et configurable.
- Tests prévus : unitaires sur la logique, intégration API, parcours essentiels de bout en bout, accessibilité et compatibilité mobile.

## 10. Hors périmètre initial

- Paiement en ligne ou réservation contractuelle automatique.
- Calcul tarifaire complexe et devis juridiquement engageant.
- Application mobile native.
- Intégration à un ERP/CRM tiers, sauf export ou notification simple.
- Gestion de campagnes complète après signature.

Ces éléments pourront être planifiés une fois la première version stabilisée.

## 11. Livrables attendus

1. Identité d'interface et maquettes des écrans principaux.
2. Application publique : accueil, carte, catalogue, fiches et demande de devis.
3. Espace d'administration sécurisé.
4. Base de données et jeu de données initial validé par Publicom.
5. Documentation technique et guide d'administration.
6. Plan de recette, rapport de tests et procédure de mise en production.

## 12. Décisions à valider avant le plan de réalisation

- Nom et identité visuelle définitifs du produit.
- Liste exacte des zones et supports à publier au lancement.
- Données commerciales visibles publiquement (tarifs, disponibilité, audience).
- Destinataires et processus de traitement des demandes de devis.
- Compte, budget et préférence pour le fournisseur de cartographie.
- Hébergement, nom de domaine et responsable de la validation des contenus.

## 13. Roadmap proposée après validation

1. Valider ce cahier des charges et les décisions ouvertes.
2. Produire l'architecture fonctionnelle, les maquettes et le modèle de données.
3. Mettre en place le socle du projet et les données de démonstration.
4. Développer la carte, le catalogue et les fiches support.
5. Ajouter la sélection, les demandes de devis et l'administration.
6. Recetter avec les contenus réels, optimiser puis déployer.

## 14. Décisions validées

- Les fonctionnalités, parcours et objectifs définis dans ce document sont validés.
- Les tarifs et statuts de disponibilité peuvent être affichés publiquement lorsqu'ils sont renseignés et validés par Publicom.
- Les données d'audience ne font pas partie de la première version ; le modèle de données restera extensible pour les ajouter ultérieurement.
- Le lancement s'appuie sur les huit zones déjà représentées dans le prototype : Zones Urbaines 1 à 5 et Zones Aéroportuaires 1 à 3 de Libreville.
- La demande de devis est conservée comme formulaire simple : elle enregistre la demande et notifie l'équipe Publicom, sans intégration CRM ni automatisation commerciale avancée dans la première version.
