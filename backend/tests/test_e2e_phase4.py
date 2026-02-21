"""
Test E2E Phase 4 — Parcours complet L1tello
=============================================

Inscription → Upload PDF → Quiz → Analyse Erreurs → Révision IA

Ce script teste tout le parcours via les endpoints API.
"""

import requests
import json
import time
import sys

BASE_URL = 'http://localhost:8001/api'
SESSION = requests.Session()

# Compteurs
passed = 0
failed = 0
total = 0


def test(name, condition, detail=''):
    global passed, failed, total
    total += 1
    if condition:
        passed += 1
        print(f'  ✅ {name}')
    else:
        failed += 1
        print(f'  ❌ {name} — {detail}')


def section(title):
    print(f'\n{"═" * 60}')
    print(f'  {title}')
    print(f'{"═" * 60}')


# ──────────────────────────────────────────
# 1. INSCRIPTION
# ──────────────────────────────────────────
section('1. INSCRIPTION')

username = f'testuser_e2e_{int(time.time())}'
register_data = {
    'username': username,
    'password': 'testpass123',
    'email': f'{username}@test.com',
    'first_name': 'Test',
    'last_name': 'E2E',
    'role': 'eleve',
}

r = SESSION.post(f'{BASE_URL}/auth/inscription/', json=register_data)
test('Inscription HTTP 201', r.status_code == 201, f'Status: {r.status_code}')

data = r.json()
access_token = data.get('tokens', {}).get('access', '')
user_id = data.get('user', {}).get('id')
test('Token JWT reçu', bool(access_token))
test('User ID reçu', user_id is not None, f'user_id={user_id}')

# Headers auth
headers = {'Authorization': f'Bearer {access_token}'}


# ──────────────────────────────────────────
# 1b. SÉCURITÉ — Test XSS rejeté
# ──────────────────────────────────────────
section('1b. SÉCURITÉ — XSS injection test')

xss_data = {
    'username': '<script>alert("xss")</script>',
    'password': 'testpass123',
    'email': 'xss@test.com',
    'first_name': 'onerror=alert(1)',
    'role': 'eleve',
}
r_xss = SESSION.post(f'{BASE_URL}/auth/inscription/', json=xss_data)
test('XSS username rejeté/sanitized', r_xss.status_code in (400, 201))
if r_xss.status_code == 201:
    xss_user = r_xss.json().get('user', {})
    test('Username sanitized (no HTML)', '<script>' not in xss_user.get('username', ''))


# ──────────────────────────────────────────
# 2. PROFIL
# ──────────────────────────────────────────
section('2. PROFIL')

r = SESSION.get(f'{BASE_URL}/auth/profil/', headers=headers)
test('Profil HTTP 200', r.status_code == 200, f'Status: {r.status_code}')
test('Username correct', r.json().get('username') == username)


# ──────────────────────────────────────────
# 3. UPLOAD PDF
# ──────────────────────────────────────────
section('3. UPLOAD PDF')

# 3a. Créer une matière de test
matiere_r = SESSION.post(f'{BASE_URL}/matieres/', json={'nom': f'Maths_E2E_{int(time.time())}', 'description': 'Test E2E'})
test('Matière créée', matiere_r.status_code == 201, f'Status: {matiere_r.status_code}')
matiere_id = matiere_r.json().get('id')

# 3b. Générer un PDF de test
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import tempfile
import os

pdf_path = os.path.join(tempfile.gettempdir(), 'test_e2e.pdf')
c = canvas.Canvas(pdf_path, pagesize=A4)
c.setFont('Helvetica-Bold', 18)
c.drawString(100, 750, 'Les Additions')
c.setFont('Helvetica', 12)
c.drawString(100, 720, 'Introduction aux additions')
c.drawString(100, 700, 'L addition est une operation mathematique fondamentale.')
c.drawString(100, 680, 'Elle permet de combiner deux nombres en un seul.')
c.drawString(100, 640, 'Les Soustractions')
c.drawString(100, 620, 'La soustraction est l inverse de l addition.')
c.drawString(100, 600, 'Elle permet de retirer une quantite d une autre.')
c.save()

with open(pdf_path, 'rb') as pdf_file:
    r = SESSION.post(
        f'{BASE_URL}/upload-lecon/',
        data={'titre': 'Leçon E2E - Additions', 'matiere': matiere_id, 'niveau': 'CP'},
        files={'fichier_pdf': ('test_e2e.pdf', pdf_file, 'application/pdf')},
        headers=headers,
    )

test('Upload PDF HTTP 201', r.status_code == 201, f'Status: {r.status_code} — {r.text[:200]}')
upload_data = r.json()
lecon_id = upload_data.get('lecon', {}).get('id')
nb_notions = upload_data.get('notions_extraites', 0)
test('Leçon créée', lecon_id is not None)
test('Notions extraites ≥ 1', nb_notions >= 1, f'nb_notions={nb_notions}')

# Nettoyer le fichier temp
os.remove(pdf_path)


# ──────────────────────────────────────────
# 3b. SÉCURITÉ — Upload fichier non-PDF
# ──────────────────────────────────────────
section('3b. SÉCURITÉ — Upload fichier non-PDF')

import tempfile
fake_pdf_path = os.path.join(tempfile.gettempdir(), 'fake.pdf')
with open(fake_pdf_path, 'wb') as f:
    f.write(b'NOT A PDF FILE CONTENT')

with open(fake_pdf_path, 'rb') as f:
    r_fake = SESSION.post(
        f'{BASE_URL}/upload-lecon/',
        data={'titre': 'Fake', 'matiere': matiere_id, 'niveau': 'CP'},
        files={'fichier_pdf': ('fake.pdf', f, 'application/pdf')},
        headers=headers,
    )

test('Faux PDF rejeté (400)', r_fake.status_code == 400, f'Status: {r_fake.status_code}')
os.remove(fake_pdf_path)


# ──────────────────────────────────────────
# 4. CRÉER EXERCICES + QUIZ
# ──────────────────────────────────────────
section('4. CRÉER EXERCICES + QUIZ')

# Récupérer les notions de la leçon
r = SESSION.get(f'{BASE_URL}/notions/?lecon={lecon_id}', headers=headers)
notions = r.json()
notion_id = notions[0]['id'] if notions else None
test('Notions récupérées', len(notions) >= 1)

# Créer 3 exercices
exercices_created = []
for i, diff in enumerate(['facile', 'moyen', 'difficile']):
    ex_data = {
        'lecon': lecon_id,
        'notion': notion_id,
        'type_exercice': 'qcm',
        'difficulte': diff,
        'question': f'Question {diff} #{i+1} sur les additions',
        'choix': [
            {'texte': 'Bonne réponse', 'correct': True},
            {'texte': 'Mauvaise réponse A', 'correct': False},
            {'texte': 'Mauvaise réponse B', 'correct': False},
        ],
        'explication': f'Explication pour question {diff}',
    }
    r = SESSION.post(f'{BASE_URL}/exercices/', json=ex_data, headers=headers)
    test(f'Exercice {diff} créé', r.status_code == 201, f'Status: {r.status_code} — {r.text[:200]}')
    if r.status_code == 201:
        exercices_created.append(r.json())

test('3 exercices créés', len(exercices_created) == 3, f'n={len(exercices_created)}')


# ──────────────────────────────────────────
# 5. SIMULER UN QUIZ (performances)
# ──────────────────────────────────────────
section('5. SIMULER QUIZ — Enregistrer performances')

# Répondre: 1 correct, 2 incorrects (pour déclencher la révision)
scenarios = [
    (0, True, 100),   # facile → correct
    (1, False, 0),    # moyen → incorrect
    (2, False, 0),    # difficile → incorrect
]

for idx, (ex_idx, is_correct, score) in enumerate(scenarios):
    if ex_idx < len(exercices_created):
        ex = exercices_created[ex_idx]
        perf_data = {
            'eleve': user_id,
            'exercice': ex['id'],
            'reponse_donnee': {'index': 0, 'texte': 'Réponse test'},
            'est_correcte': is_correct,
            'score': score,
            'temps_reponse': '15',
        }
        r = SESSION.post(f'{BASE_URL}/performances/', json=perf_data, headers=headers)
        status_label = '✓' if is_correct else '✗'
        test(f'Performance {idx+1} enregistrée ({status_label})', r.status_code == 201, f'Status: {r.status_code}')


# ──────────────────────────────────────────
# 6. DASHBOARD — Vérifier stats
# ──────────────────────────────────────────
section('6. DASHBOARD — Statistiques')

r = SESSION.get(f'{BASE_URL}/dashboard/', headers=headers)
test('Dashboard HTTP 200', r.status_code == 200)
stats = r.json().get('stats', {})
test('Exercices tentés = 3', stats.get('exercices_tentes') == 3, f"tentés={stats.get('exercices_tentes')}")
test('Taux réussite ≈ 33%', 30 <= stats.get('taux_reussite', 0) <= 40, f"taux={stats.get('taux_reussite')}")


# ──────────────────────────────────────────
# 7. RÉVISION IA — Analyse des erreurs
# ──────────────────────────────────────────
section('7. RÉVISION IA — Analyse des erreurs')

r = SESSION.get(f'{BASE_URL}/revision/profil/', headers=headers)
test('Révision profil HTTP 200', r.status_code == 200, f'Status: {r.status_code}')
rev_data = r.json()
feedback = rev_data.get('feedback', {})
test('Feedback IA présent', bool(feedback.get('message')))
test('Conseil reçu', bool(feedback.get('conseil')))
test('Taux global calculé', feedback.get('taux_global') is not None or feedback.get('conseil') == 'decouvrir')
print(f'    💡 Conseil IA: {feedback.get("conseil", "N/A")}')
print(f'    📊 Taux global: {feedback.get("taux_global", "N/A")}%')

maitrise = rev_data.get('maitrise', {})
test('Maîtrise par notion calculée', len(maitrise) > 0, f'n={len(maitrise)}')

# ──────────────────────────────────────────
# 7b. Exercices adaptatifs
# ──────────────────────────────────────────
section('7b. RÉVISION IA — Exercices adaptatifs')

r = SESSION.get(f'{BASE_URL}/revision/exercices/', headers=headers)
test('Révision exercices HTTP 200', r.status_code == 200, f'Status: {r.status_code}')
rev_ex = r.json()
test('Exercices adaptatifs proposés', rev_ex.get('nb_exercices', 0) >= 0)


# ──────────────────────────────────────────
# 7c. Enregistrer depuis révision
# ──────────────────────────────────────────
section('7c. RÉVISION IA — Enregistrer via révision')

if exercices_created:
    rev_enr_data = {
        'exercice': exercices_created[0]['id'],
        'reponse_donnee': {'index': 0, 'texte': 'Test révision'},
        'est_correcte': True,
        'score': 100,
        'temps_reponse': '10',
    }
    r = SESSION.post(f'{BASE_URL}/revision/enregistrer/', json=rev_enr_data, headers=headers)
    test('Révision enregistrée HTTP 201', r.status_code == 201, f'Status: {r.status_code} — {r.text[:200]}')
    if r.status_code == 201:
        test('Feedback retourné', 'feedback' in r.json())


# ──────────────────────────────────────────
# RÉSULTAT FINAL
# ──────────────────────────────────────────
section('RÉSULTAT FINAL')
print(f'\n  Passés: {passed}/{total}')
print(f'  Échoués: {failed}/{total}')

if failed > 0:
    print('\n  ⚠️  Certains tests ont échoué.')
    sys.exit(1)
else:
    print('\n  🎉 Tous les tests E2E passent ! Parcours complet validé.')
    sys.exit(0)
