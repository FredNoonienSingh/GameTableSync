from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from extensions import db
from models import User
from .utils import log

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")
    discord_account = (data.get("discord_account") or "").strip() or None

    log(f"DEBUG [Auth]: POST /api/register for username={username}, email={email}, discord={discord_account}")

    if not username or not email or not password:
        return jsonify({"msg": "Bitte alle Felder ausfüllen"}), 400

    hashed_pw = generate_password_hash(password)
    new_user = User(
        display_name=username,
        email=email,
        password_hash=hashed_pw,
        discord_account=discord_account,
    )

    try:
        db.session.add(new_user)
        db.session.commit()
        log(f"DEBUG [Auth]: Registered new user ID={new_user.id}")
        return jsonify({"msg": "Account erfolgreich erstellt!"}), 201
    except IntegrityError:
        db.session.rollback()
        return (
            jsonify(
                {
                    "msg": "Benutzername, E-Mail oder Discord-Account ist bereits vergeben"
                }
            ),
            409,
        )


@auth_bp.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password")

    user = User.query.filter(func.lower(User.email) == email).first()

    if user and check_password_hash(user.password_hash, password):
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                "username": user.display_name,
                "is_admin": user.is_admin,
            },
        )
        log(f"DEBUG [Auth]: Login successful for user ID={user.id} ({user.display_name})")
        return jsonify(access_token=access_token, is_admin=user.is_admin), 200

    log(f"DEBUG [Auth]: Login failed for email={email}")
    return jsonify({"msg": "Falsche E-Mail oder Passwort"}), 401