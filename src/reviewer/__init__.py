from flask import (
    Flask,
    jsonify,
    request,
)

from reviewer.models import User
from reviewer.utils import (
    d3_utils,
    profile_utils,
)


def create_app():
    app = Flask(__name__)

    @app.route('/api/v1/profiles/similarity', methods=('POST',))
    def profiles_similarity():
        app.logger.debug(f'request: {request}')
        data = request.get_json()
        user = User.get_or_create(user_id=data['user_id'], text=data['user_text'].replace('\n', ''))
        reviewer = User.get_or_create(user_id=data['reviewer_id'], text=data['reviewer_text'].replace('\n', ''))
        similarity = profile_utils.calc_similarity(user.profile, reviewer.profile)
        app.logger.debug(f'similarity: {similarity}')
        parsed_profile = d3_utils.d3_formatter(reviewer_profile=reviewer.profile)
        return jsonify(similarity=similarity, profile=parsed_profile)

    return app
