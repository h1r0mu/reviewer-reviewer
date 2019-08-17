import os
from flask import (
    Flask,
    jsonify,
    request,
)

from src.app.models import User
from src.app.utils import profile_utils


def create_app():
    """Create and configure an instance of the Flask application."""
    app = Flask(__name__)

    @app.route('/api/v1/profiles/similarity', methods=('POST',))
    def profiles_similarity():
        data = request.get_json()
        user = User.get_or_create(user_id=data['user_id'], text=data['user_text'])
        reviewer = User.get_or_create(user_id=data['reviewer_id'], text=data['reviewer_text'])
        similarity = profile_utils.calc_similarity(user.profile, reviewer.profile)
        return jsonify(similarity=similarity)

    return app


if __name__ == '__main__':
    app = create_app()
    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('FLASK_PORT')),
    )
