import os
import json
from datetime import timedelta
from flask import Flask
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.security import generate_password_hash
from flask_jwt_extended import JWTManager
from sqlalchemy import func

from extensions import db
from models import User, FactionCategory, Faction
from endpoints import register_blueprints
from endpoints.utils import log

app = Flask(__name__)

app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_size": 5,
    "max_overflow": 5,
    "pool_pre_ping": True,
    "pool_recycle": 300,
}

app.config["SECRET_KEY"] = os.environ.get(
    "SECRET_KEY", "blood-for-the-blood-god-skulls-for-the-skull-throne"
)
app.config["JWT_SECRET_KEY"] = os.environ.get(
    "JWT_SECRET_KEY", "blood-for-the-blood-god-skulls-for-the-skull-throne"
)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(
    hours=int(os.environ.get("JWT_EXPIRES_HOURS", "24"))
)

cors_origins_env = os.environ.get("CORS_ORIGINS", "*")
cors_origins = (
    "*"
    if cors_origins_env.strip() == "*"
    else [o.strip() for o in cors_origins_env.split(",") if o.strip()]
)
CORS(app, resources={r"/api/*": {"origins": cors_origins}}, supports_credentials=True)

db.init_app(app)
jwt = JWTManager(app)

register_blueprints(app)


def init_factions():
    json_path = os.path.join(os.path.dirname(__file__), "factions.json")
    if not os.path.exists(json_path):
        log("⚠️ factions.json nicht gefunden; überspringe Fraktions-Seeding.")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    for sys_data in data.get("systems", []):
        sys_code = sys_data["system"]

        for cat_data in sys_data.get("categories", []):
            cat_name = cat_data["name"]

            category = FactionCategory.query.filter_by(
                name=cat_name, system=sys_code
            ).first()
            if not category:
                category = FactionCategory(name=cat_name, system=sys_code)
                db.session.add(category)
                db.session.commit()

            for fac_name in cat_data.get("factions", []):
                faction = Faction.query.filter_by(
                    name=fac_name, category_id=category.id
                ).first()
                if not faction:
                    faction = Faction(name=fac_name, category_id=category.id)
                    db.session.add(faction)

            db.session.commit()
    log("🎲 Fraktionen aus factions.json erfolgreich synchronisiert.")


def init_db_and_admin():
    with app.app_context():
        db.create_all()
        init_factions()

        admin_username = os.environ.get("ADMIN_USERNAME")
        admin_email = os.environ.get("ADMIN_EMAIL")
        admin_password = os.environ.get("ADMIN_PASSWORD")

        if not admin_email or not admin_password or not admin_username:
            log(
                "⚠️ ADMIN_USERNAME, ADMIN_EMAIL, or ADMIN_PASSWORD missing in .env; skipping admin seed."
            )
            return

        admin_email_clean = admin_email.strip().lower()

        existing_admin = User.query.filter(
            (func.lower(User.email) == admin_email_clean)
            | (User.display_name == admin_username)
        ).first()

        if not existing_admin:
            new_admin = User(
                display_name=admin_username.strip(),
                email=admin_email_clean,
                discord_account=f"{admin_username.strip().lower()}_admin",
                password_hash=generate_password_hash(admin_password),
                is_admin=True,
            )
            db.session.add(new_admin)
            db.session.commit()
            log(f"✅ Default admin '{admin_username}' ({admin_email_clean}) created with ID={new_admin.id}.")
        else:
            existing_admin.email = admin_email_clean
            existing_admin.is_admin = True
            existing_admin.password_hash = generate_password_hash(admin_password)
            db.session.commit()
            log(
                f"ℹ️ Admin '{existing_admin.display_name}' ({existing_admin.email}) verified & synced (ID={existing_admin.id})."
            )

        mock_usernames = [
            "TabletopGeneral",
            "OrkBoy123",
            "NulnOilDrinker",
            "BolterGoBrrr",
            "HazardStripeEnjoyer",
            "DiceGoblin",
        ]

        added_mocks = 0
        for name in mock_usernames:
            existing_mock = User.query.filter_by(display_name=name).first()
            if not existing_mock:
                user = User(
                    display_name=name,
                    email=f"{name.lower()}@mindanddice.de",
                    discord_account=f"{name.lower()}_discord",
                    password_hash=generate_password_hash("password123"),
                    is_admin=False,
                )
                db.session.add(user)
                added_mocks += 1

        if added_mocks > 0:
            db.session.commit()
            log(f"✅ Successfully seeded {added_mocks} mock users into the database.")


@app.cli.command("init-db")
def init_db_command():
    init_db_and_admin()


if __name__ == "__main__":
    init_db_and_admin()
    app.run(host="0.0.0.0", port=5000)