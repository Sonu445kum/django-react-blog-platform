#!/usr/bin/env bash

echo "📦 Installing backend dependencies..."
pip install -r requirements.txt

echo "⚛️ Building frontend..."
cd ../frontend
npm install
npm run build

echo "📁 Moving back to backend..."
cd ../backend/blog_project

echo "🗄️ Running migrations..."
python manage.py migrate

echo "📦 Collecting static files..."
python manage.py collectstatic --noinput