from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import warnings
warnings.filterwarnings('ignore')

app = FastAPI(title="Smart ERP 4.0 — ML Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────
# DONNÉES D'ENTRAÎNEMENT — Historique simulé réaliste
# ─────────────────────────────────────────────────────

def generer_donnees_entrainement():
    """
    Génère un historique réaliste de maintenances passées
    avec saisonnalité et charge de réservations
    """
    np.random.seed(42)
    n = 300

    data = {
        # Caractéristiques véhicule
        'kilometrage':           np.random.randint(5000, 150000, n),
        'km_depuis_vidange':     np.random.randint(0, 15000, n),
        'age_vehicule':          np.random.randint(1, 12, n),
        'nb_maintenances_passees': np.random.randint(0, 25, n),

        # Caractéristiques temporelles et saisonnalité
        'mois':                  np.random.randint(1, 13, n),
        'taux_occupation_flotte': np.random.uniform(0.3, 1.0, n),
        'nb_reservations_mois':  np.random.randint(0, 30, n),
        'nb_reservations_mois_suivant': np.random.randint(0, 35, n),

        # Catégorie (encodée)
        'categorie_enc':         np.random.randint(0, 4, n),
    }

    df = pd.DataFrame(data)

    # Saisons : haute saison = été (6,7,8) + hiver (12,1)
    df['est_haute_saison'] = df['mois'].apply(
        lambda m: 1 if m in [6, 7, 8, 12, 1] else 0
    )

    # Calcul du score de risque réel (variable cible)
    df['score_risque'] = (
        df['km_depuis_vidange']     / 15000 * 0.30 +
        df['kilometrage']           / 150000 * 0.25 +
        df['age_vehicule']          / 12     * 0.20 +
        df['taux_occupation_flotte']         * 0.15 +
        df['nb_maintenances_passees']/ 25    * 0.10
    ).clip(0, 1)

    # Jours optimaux avant intervention (variable cible principale)
    # En haute saison → on reporte si risque faible, on anticipe si risque élevé
    df['jours_optimal'] = (
        (1 - df['score_risque']) * 90
        - df['est_haute_saison'] * df['score_risque'] * 20
        + (1 - df['taux_occupation_flotte']) * 15
        - df['nb_reservations_mois_suivant'] / 35 * 10
    ).clip(0, 120).astype(int)

    # Urgence (0=normale, 1=urgente, 2=critique)
    df['urgence'] = pd.cut(
        df['score_risque'],
        bins=[-0.1, 0.35, 0.65, 1.1],
        labels=[0, 1, 2]
    ).astype(int)

    return df


# ─────────────────────────────────────────────────────
# ENTRAÎNEMENT DES MODÈLES AU DÉMARRAGE
# ─────────────────────────────────────────────────────

print("🤖 Entraînement des modèles ML...")
df_train = generer_donnees_entrainement()

FEATURES = [
    'kilometrage', 'km_depuis_vidange', 'age_vehicule',
    'nb_maintenances_passees', 'mois', 'taux_occupation_flotte',
    'nb_reservations_mois', 'nb_reservations_mois_suivant',
    'categorie_enc', 'est_haute_saison'
]

X = df_train[FEATURES]

# Modèle 1 — Prédiction du nombre de jours avant intervention
modele_jours = RandomForestRegressor(n_estimators=100, random_state=42)
modele_jours.fit(X, df_train['jours_optimal'])

# Modèle 2 — Prédiction du niveau d'urgence
modele_urgence = RandomForestClassifier(n_estimators=100, random_state=42)
modele_urgence.fit(X, df_train['urgence'])

# Modèle 3 — Score de risque
modele_risque = RandomForestRegressor(n_estimators=100, random_state=42)
modele_risque.fit(X, df_train['score_risque'])

CATEGORIES = {'citadine': 0, 'berline': 1, 'suv': 2, 'utilitaire': 3}
MOIS_NOMS  = {1:'Jan',2:'Fev',3:'Mar',4:'Avr',5:'Mai',6:'Jun',
               7:'Jul',8:'Aou',9:'Sep',10:'Oct',11:'Nov',12:'Dec'}

print("✅ Modèles ML entraînés avec succès !")


# ─────────────────────────────────────────────────────
# FONCTIONS UTILITAIRES
# ─────────────────────────────────────────────────────

def get_saison(mois: int) -> str:
    if mois in [12, 1, 2]: return "hiver"
    if mois in [3, 4, 5]:  return "printemps"
    if mois in [6, 7, 8]:  return "ete"
    return "automne"

def get_taux_occupation_saison(mois: int) -> float:
    """Taux d'occupation typique par mois pour une agence de location"""
    taux = {
        1: 0.45, 2: 0.40, 3: 0.55, 4: 0.60, 5: 0.65,
        6: 0.85, 7: 0.95, 8: 0.92, 9: 0.70, 10: 0.60,
        11: 0.50, 12: 0.80
    }
    return taux.get(mois, 0.6)

def get_recommandations(km_depuis_vidange, kilometrage, age, score):
    recs = []
    if km_depuis_vidange > 10000: recs.append("🔴 Vidange huile moteur urgente")
    elif km_depuis_vidange > 7000: recs.append("🟡 Vidange huile moteur bientôt")
    if kilometrage > 80000:  recs.append("🔴 Vérification courroie distribution")
    if kilometrage > 50000:  recs.append("🟡 Contrôle plaquettes de frein")
    if kilometrage > 30000:  recs.append("🟡 Remplacement filtre à air")
    if age > 5:              recs.append("🔵 Contrôle technique recommandé")
    if age > 8:              recs.append("🔴 Révision complète nécessaire")
    if score > 0.7:          recs.append("🔴 Inspection complète immédiate")
    if not recs:             recs.append("✅ Véhicule en bon état — surveillance normale")
    return recs

def calculer_fenetres_optimales(jours_avant: int, reservations_mois: dict) -> List[dict]:
    """
    Calcule les 3 meilleures fenêtres de maintenance
    en évitant les périodes de haute demande
    """
    from datetime import datetime, timedelta
    aujourd_hui = datetime.now()
    date_intervention = aujourd_hui + timedelta(days=jours_avant)

    fenetres = []
    for delta_semaines in [0, 2, 4]:
        date_proposee = date_intervention + timedelta(weeks=delta_semaines)
        mois_propose  = date_proposee.month
        taux_occ      = get_taux_occupation_saison(mois_propose)

        # Score de cette fenêtre (plus bas = meilleur)
        score_fenetre = taux_occ
        qualite = "Excellent" if taux_occ < 0.5 else "Bon" if taux_occ < 0.7 else "Acceptable"
        couleur = "#16a34a"   if taux_occ < 0.5 else "#ca8a04" if taux_occ < 0.7 else "#dc2626"

        fenetres.append({
            "date":          date_proposee.strftime("%Y-%m-%d"),
            "date_affichage": date_proposee.strftime("%d/%m/%Y"),
            "mois":          MOIS_NOMS[mois_propose],
            "saison":        get_saison(mois_propose),
            "taux_occupation": round(taux_occ * 100),
            "qualite":       qualite,
            "couleur":       couleur,
            "recommande":    delta_semaines == 0
        })

    # Trier par meilleure opportunité
    fenetres.sort(key=lambda x: x['taux_occupation'])
    return fenetres


# ─────────────────────────────────────────────────────
# MODÈLES PYDANTIC
# ─────────────────────────────────────────────────────

class VehiculeData(BaseModel):
    vehicule_id: int
    kilometrage: int
    derniere_vidange_km: int
    annee: int
    nb_maintenances: int = 0
    categorie: str = "berline"
    mois_actuel: Optional[int] = None
    nb_reservations_mois: Optional[int] = 5
    nb_reservations_mois_suivant: Optional[int] = 5

class ClientData(BaseModel):
    client_id: int
    nb_reservations: int = 0
    nb_incidents: int = 0
    nb_retards: int = 0
    valeur_client: float = 0.0


# ─────────────────────────────────────────────────────
# ROUTE 1 — Prédiction Maintenance Intelligente
# ─────────────────────────────────────────────────────

@app.post("/predict/maintenance")
def predire_maintenance(data: VehiculeData):
    from datetime import datetime
    mois = data.mois_actuel or datetime.now().month
    cat_enc = CATEGORIES.get(data.categorie.lower(), 1)
    km_depuis_vidange = data.kilometrage - data.derniere_vidange_km
    age_vehicule = 2025 - data.annee
    taux_occ = get_taux_occupation_saison(mois)
    est_haute_saison = 1 if mois in [6, 7, 8, 12, 1] else 0

    X_pred = np.array([[
        data.kilometrage,
        km_depuis_vidange,
        age_vehicule,
        data.nb_maintenances,
        mois,
        taux_occ,
        data.nb_reservations_mois or 5,
        data.nb_reservations_mois_suivant or 5,
        cat_enc,
        est_haute_saison
    ]])

    # Prédictions ML
    jours_avant  = int(max(0, modele_jours.predict(X_pred)[0]))
    urgence_code = int(modele_urgence.predict(X_pred)[0])
    score_risque = round(float(modele_risque.predict(X_pred)[0].clip(0, 1)), 2)

    # Importance des features
    importances = dict(zip(FEATURES, modele_jours.feature_importances_))
    top_facteurs = sorted(importances.items(), key=lambda x: x[1], reverse=True)[:3]

    # Niveau de risque
    if score_risque < 0.35:
        niveau, couleur = "faible", "#16a34a"
    elif score_risque < 0.65:
        niveau, couleur = "moyen", "#ca8a04"
    else:
        niveau, couleur = "élevé", "#dc2626"

    urgence_labels = {0: "normale", 1: "urgente", 2: "critique"}
    urgence_label  = urgence_labels[urgence_code]

    # Fenêtres optimales de maintenance
    fenetres = calculer_fenetres_optimales(jours_avant, {})

    # Recommandations
    recommandations = get_recommandations(km_depuis_vidange, data.kilometrage, age_vehicule, score_risque)

    return {
        "vehicule_id":              data.vehicule_id,
        "score_risque":             score_risque,
        "niveau_risque":            niveau,
        "couleur":                  couleur,
        "urgence":                  urgence_label,
        "jours_avant_intervention": jours_avant,
        "saison_actuelle":          get_saison(mois),
        "taux_occupation_actuel":   round(taux_occ * 100),
        "est_haute_saison":         bool(est_haute_saison),
        "fenetres_optimales":       fenetres,
        "meilleure_date":           fenetres[0]["date_affichage"] if fenetres else "-",
        "recommandations":          recommandations,
        "facteurs_principaux": [
            {"facteur": f, "importance": round(i * 100, 1)}
            for f, i in top_facteurs
        ],
        "details": {
            "km_depuis_vidange":  km_depuis_vidange,
            "age_vehicule_ans":   age_vehicule,
            "kilometrage_total":  data.kilometrage,
            "mois_analyse":       MOIS_NOMS[mois],
            "modele_utilise":     "RandomForest v2.0"
        }
    }


# ─────────────────────────────────────────────────────
# ROUTE 2 — Scoring Client ML
# ─────────────────────────────────────────────────────

@app.post("/predict/scoring")
def scorer_client(data: ClientData):
    score_risque = 0.0
    if data.nb_reservations > 0:
        taux_incidents = data.nb_incidents / data.nb_reservations
        taux_retards   = data.nb_retards   / data.nb_reservations
        score_risque  += min(taux_incidents * 0.5, 0.5)
        score_risque  += min(taux_retards   * 0.3, 0.3)
    if data.nb_reservations < 2:
        score_risque += 0.1
    score_risque  = round(min(score_risque, 1.0), 2)
    score_valeur  = round(min(data.valeur_client / 50, 100), 1)
    score_fidelite = round(min(data.nb_reservations * 8, 100), 1)

    if score_risque < 0.2:
        categorie, couleur = "faible", "#16a34a"
        recommandation = "Client fiable — offrir des avantages fidélité"
        caution_recommandee = 300
    elif score_risque < 0.5:
        categorie, couleur = "moyen", "#ca8a04"
        recommandation = "Surveillance standard — caution normale"
        caution_recommandee = 500
    else:
        categorie, couleur = "élevé", "#dc2626"
        recommandation = "Client risqué — caution majorée recommandée"
        caution_recommandee = 1000

    return {
        "client_id":           data.client_id,
        "score_risque":        score_risque,
        "categorie_risque":    categorie,
        "couleur":             couleur,
        "score_valeur":        score_valeur,
        "score_fidelite":      score_fidelite,
        "recommandation":      recommandation,
        "caution_recommandee": caution_recommandee,
        "details": {
            "taux_incidents": round(data.nb_incidents / max(data.nb_reservations, 1), 2),
            "taux_retards":   round(data.nb_retards   / max(data.nb_reservations, 1), 2),
            "valeur_totale":  data.valeur_client
        }
    }


# ─────────────────────────────────────────────────────
# ROUTE 3 — Analyse saisonnière
# ─────────────────────────────────────────────────────

@app.get("/saisonnalite")
def get_saisonnalite():
    mois_data = []
    for m in range(1, 13):
        taux = get_taux_occupation_saison(m)
        mois_data.append({
            "mois":           MOIS_NOMS[m],
            "numero":         m,
            "taux_occupation": round(taux * 100),
            "saison":         get_saison(m),
            "ideal_maintenance": taux < 0.55
        })
    return {
        "mois": mois_data,
        "meilleurs_mois_maintenance": [d["mois"] for d in mois_data if d["ideal_maintenance"]],
        "pires_mois_maintenance":     [d["mois"] for d in mois_data if not d["ideal_maintenance"]]
    }


# ─────────────────────────────────────────────────────
# ROUTE 4 — Batch predictions
# ─────────────────────────────────────────────────────

@app.post("/predict/maintenance/batch")
def predire_batch(vehicules: List[VehiculeData]):
    return [predire_maintenance(v) for v in vehicules]

@app.post("/predict/scoring/batch")
def scorer_batch(clients: List[ClientData]):
    return [scorer_client(c) for c in clients]


# ─────────────────────────────────────────────────────
# ROUTE 5 — Test
# ─────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "message": "Smart ERP 4.0 — ML Service v2.0",
        "modeles": ["RandomForest Maintenance", "RandomForest Urgence", "RandomForest Risque", "Scoring Client"],
        "routes":  ["/predict/maintenance", "/predict/scoring", "/saisonnalite", "/docs"]
    }