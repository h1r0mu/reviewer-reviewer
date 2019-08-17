import os
from flask import (
    Flask,
    abort,
    request,
)
from werkzeug.wrappers import Response

from app.models import User
from app.utils import profile_utils

app = Flask(__name__)


@app.route('/profile/similarity', method=('POST',))
def profiles_similarity():
    data = request.get_json()
    user = User.get_or_create(user_id=data['user_id'], text=data['user_text'])
    reviewer = User.get_or_create(user_id=data['reviewer_id'], text=data['reviewer_text'])
    similarity = profile_utils.calc_similarity(user.profile, reviewer.profile)
    return Response(
        status=200,
        content_type='application/json',
        response={'similarity': similarity},
    )


if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('FLASK_PORT')),
    )
