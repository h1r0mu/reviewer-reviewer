FROM python:3.7
ENV PYTHONBUFFERED 1
ADD ./src /src
WORKDIR /src
RUN pip install --upgrade pip && \
    pip install pipenv && \
    pipenv install --system
