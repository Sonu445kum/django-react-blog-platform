#!/usr/bin/env bash

pip install -r requirements.txt

cd blog_project   

python manage.py collectstatic --noinput
python manage.py migrate