# HabitFlow - Gestionnaire de Suivi d'Habitudes

> **MEMBRES DU GROUPE :**
> - **Elliot Fiorese**

---

## 1. Presentation du Projet

HabitFlow est une application web permettant de suivre ses habitudes quotidiennes. L'idee est simple : on cree une habitude (sport, lecture, meditation...) et on peut la marquer comme faite chaque jour pour suivre sa progression.

**Fonctionnalites principales :**
* Creer des habitudes avec nom, description et frequence
* Marquer une habitude comme complete
* Voir les statistiques (nombre d'habitudes, completions du jour, total)
* Supprimer une habitude

**Lien accessible :** https://honor-stored-headed-remainder.trycloudflare.com 

---

## 2. Architecture Technique

### Schema d'infrastructure

![Architecture du Projet](http://www.plantuml.com/plantuml/proxy?cache=no&src=https://raw.githubusercontent.com/elliotfio/habit-flow/main/architecture.puml)

### Description des services

| Service | Image Docker | Role | Port Interne |
| :--- | :--- | :--- | :--- |
| **frontend** | `nginx:alpine` (custom) | Interface utilisateur | 80 |
| **api** | `node:18-alpine` (custom) | API REST | 3000 |
| **db** | `postgres:15-alpine` | Base de donnees | 5432 |
| **adminer** | `adminer:latest` | Interface admin BDD | 8080 |
| **caddy** | `caddy:2-alpine` | Reverse Proxy | 80, 443 |
| **tunnel** | `cloudflare/cloudflared` | Tunnel HTTPS | N/A |

### Reseau

Tous les services sont sur un reseau interne `habitflow-network`. Seul Caddy expose les ports 80 et 443 vers l'exterieur. La base de donnees n'est pas accessible depuis Internet.

---

## 3. Guide d'Installation

### Prerequis
- Docker et Docker Compose installes

### Lancement

1. Cloner le depot :
```bash
git clone https://github.com/elliotfio/habit-flow.git
cd votre-repo
```

2. Creer le fichier d'environnement :
```bash
cp env.example .env
```

3. Lancer la stack :
```bash
docker compose up -d
```

4. Acceder aux services :
   * Application : `http://localhost`
   * Admin BDD : `http://localhost/adminer`

5. Pour l'URL publique (Cloudflare) :
```bash
docker compose logs tunnel
```
L'URL apparait dans les logs sous la forme `https://xxx-xxx-xxx.trycloudflare.com`

### Arret
```bash
docker compose down
```

Pour supprimer aussi les donnees :
```bash
docker compose down -v
```

---

## 4. Methodologie & Transparence IA

### Organisation

J'ai travaille seul sur ce projet. J'ai commence par definir l'architecture generale avant de coder les differents services.

### Utilisation de l'IA

**Outils utilises :** Cursor avec Claude

**Usage :**
* **Generation de code :** J'ai utilise l'IA pour generer la base du code de l'API Node.js et du frontend. Ca m'a permis d'avoir une structure de depart propre.
* **Debuggage :** Quand j'avais des erreurs de connexion entre les services, j'ai demande a l'IA de m'aider a comprendre le probleme.
* **Docker Compose :** La configuration des healthchecks et des depends_on a ete facilitee par l'IA.

**Ce que j'ai appris :**
L'IA m'a aide a comprendre comment fonctionne le routing avec Caddy et comment configurer les variables d'environnement entre les services Docker. J'ai du quand meme adapter certaines choses car le code genere ne marchait pas toujours du premier coup.

---

## 5. Difficultes Rencontrees

### Probleme 1 : L'API ne se connectait pas a la base de donnees

Au debut, l'API essayait de se connecter a PostgreSQL avant que celui-ci soit pret. Le container crashait en boucle.

**Solution :** J'ai ajoute un `healthcheck` sur le service db et un `depends_on` avec `condition: service_healthy` sur l'API. Comme ca, l'API attend que PostgreSQL soit vraiment pret avant de demarrer.

### Probleme 2 : Le routing Caddy ne fonctionnait pas

Les requetes vers `/api` n'arrivaient pas au bon service. J'avais une erreur 502.

**Solution :** J'ai du utiliser `handle` au lieu de `route` dans le Caddyfile et bien specifier `/api/*` avec l'etoile pour matcher toutes les sous-routes.

### Probleme 3 : Perte des donnees au redemarrage

Apres un `docker compose down` puis `up`, toutes mes habitudes avaient disparu.

**Solution :** J'avais oublie de configurer un volume pour PostgreSQL. J'ai ajoute `postgres_data:/var/lib/postgresql/data` pour persister les donnees.

### Probleme 4 : Variables d'environnement

Au debut j'avais mis les mots de passe directement dans le docker-compose. C'est pas une bonne pratique.

**Solution :** J'ai cree un fichier `.env` avec les variables et utilise `${VARIABLE}` dans le docker-compose. Le fichier `.env` est dans le `.gitignore`.
