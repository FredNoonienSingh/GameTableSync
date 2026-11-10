import json
import os
from extensions import db
from models import FactionCategory, Faction

def init_factions(app):
    json_path = os.path.join(os.path.dirname(__file__), 'factions.json')
    if not os.path.exists(json_path):
        print("⚠️ factions.json nicht gefunden!")
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    with app.app_context():
        # Optional: Tabellen prüfen/anlegen falls noch nicht geschehen
        db.create_all()

        for sys_data in data.get('systems', []):
            sys_code = sys_data['system']
            
            for cat_data in sys_data.get('categories', []):
                cat_name = cat_data['name']
                
                # Kategorie suchen oder anlegen
                category = FactionCategory.query.filter_by(name=cat_name, system=sys_code).first()
                if not category:
                    category = FactionCategory(name=cat_name, system=sys_code)
                    db.session.add(category)
                    db.session.commit()

                # Fraktionen durchgehen
                for fac_name in cat_data.get('factions', []):
                    faction = Faction.query.filter_by(name=fac_name, category_id=category.id).first()
                    if not faction:
                        faction = Faction(name=fac_name, category_id=category.id)
                        db.session.add(faction)
                
                db.session.commit()
        
        print("🎲 Fraktionen erfolgreich aus factions.json eingelesen und synchronisiert!")