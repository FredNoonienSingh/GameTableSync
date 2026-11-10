from .auth import auth_bp
from .account import account_bp
from .events import events_bp
from .armylists import armylists_bp
from .games import games_bp
from .admin import admin_bp
from .tournaments import tournaments_bp



def register_blueprints(app):
    app.register_blueprint(auth_bp)
    app.register_blueprint(account_bp)
    app.register_blueprint(events_bp)
    app.register_blueprint(armylists_bp)
    app.register_blueprint(games_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(tournaments_bp)