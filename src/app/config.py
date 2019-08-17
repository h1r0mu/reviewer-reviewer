import os


def get_global_config_dict():
    return dict(
        APP_NAME=os.environ.get('APP_NAME', 'reviewer-reviewer'),
        AWS_REGION=os.environ.get('AWS_REGION', 'ap-northeast-1'),
        DYNAMODB_HOST=os.environ.get('DYNAMODB_HOST', None),
        BASE_URL=os.environ.get('BASE_URL', ''),
    )
