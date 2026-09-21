pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend - Install & Test') {
            steps {
                dir('backend') {
                    sh 'cp /var/lib/jenkins/secrets-env/immo.env .env'
                    sh 'python3 -m venv venv'
                    sh '. venv/bin/activate && pip install -r requirements.txt'
                    sh '. venv/bin/activate && python manage.py test'
                }
            }
        }

        stage('Frontend - Install & Build') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }
    }
}
