from werkzeug.security import generate_password_hash
from app import app
from extensions import db
from models import User

def seed_database():
    with app.app_context():
        # Clear existing users to prevent IntegrityErrors if you run this multiple times
        User.query.delete()
        
        # 1. Create your specific Admin account
        admin = User(
            display_name="Fred",
            email="FredBaumeister@Icloud.com",
            password_hash=generate_password_hash("Kreator95"),
            is_admin=True
        )
        db.session.add(admin)

        # 2. Create random mock users
        mock_usernames = [
            "TabletopGeneral", 
            "OrkBoy123", 
            "NulnOilDrinker", 
            "BolterGoBrrr", 
            "HazardStripeEnjoyer", 
            "DiceGoblin"
        ]

        for name in mock_usernames:
            user = User(
                display_name=name,
                email=f"{name.lower()}@mindanddice.de",
                password_hash=generate_password_hash("password123"),
                is_admin=False
            )
            db.session.add(user)

        # 3. Save to database
        db.session.commit()
        print("Database successfully seeded!")
        print("Admin account created: Fred / FredBaumeister@Icloud.com")

if __name__ == "__main__":
    seed_database()