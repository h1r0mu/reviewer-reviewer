import os
from flask import (
    Flask,
    abort,
    request,
)
from werkzeug.wrappers import Response

from app.client import APIClient

app = Flask(__name__)


class APIResponse(Response):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.headers['content-type'] = 'application/json'

@app.route('/users/<string:user_id>/reviewers/<string:reviewer_id>', method=('POST',))
def handle_request(user_id, reviewer_id):
    client = APIClient()
    data = request.get_json()
    profile = client.get_profile(data['reviews'])
    user = User(user_id)
    user.profile
    similarity = calc_similarity(profile)
    response = Response(content_type='application/json')
    return 'OK'


if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('FLASK_PORT')),
    )
