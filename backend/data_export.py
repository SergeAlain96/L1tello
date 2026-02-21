import os
import django
import json

# Configuration de l'environnement Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.core import serializers

# Liste de tes applications à exporter
# Ajoute ici le nom exact de tes dossiers d'apps (ceux dans ton INSTALLED_APPS)
MY_APPS = [
    'api'
]

output_file = "data_export.json"
all_objects = []

print("Début de l'exportation sélective...")

from django.apps import apps

for app_label in MY_APPS:
    try:
        app_config = apps.get_app_config(app_label)
        for model in app_config.get_models():
            # On récupère tous les objets du modèle
            queryset = model.objects.all()
            all_objects.extend(list(queryset))
            print(f" - {app_label}.{model.__name__} : {queryset.count()} objets récupérés")
    except LookupError:
        print(f" ! L'application {app_label} n'a pas été trouvée, vérifie le nom.")

# Sérialisation finale
print("Sérialisation en JSON...")
data = serializers.serialize("json", all_objects, indent=2, use_natural_foreign_keys=True)

with open(output_file, "w", encoding="utf-8") as f:
    f.write(data)

print(f"\nSuccès ! {len(all_objects)} objets exportés dans {output_file}")