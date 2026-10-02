pipeline {
    agent any

    options {
        // Prevents duplicate checkout if using Pipeline from SCM
        skipDefaultCheckout()
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Inject Environment Configuration') {
            steps {
                // If using Jenkins Credentials (recommended):
                // withCredentials([file(credentialsId: 'immo-env-secrets', variable: 'SECRET_ENV')]) {
                //     sh 'cp "$SECRET_ENV" .env'
                //     sh 'cp "$SECRET_ENV" backend/.env'
                // }

                // Fallback if relying on local host file:
                sh '''
                    if [ -f /var/lib/jenkins/secrets-env/immo.env ]; then
                        cp /var/lib/jenkins/secrets-env/immo.env .env
                        cp /var/lib/jenkins/secrets-env/immo.env backend/.env
                    elif [ ! -f .env ]; then
                        cp .env.example .env || true
                        cp backend/.env.example backend/.env || true
                    fi
                '''
            }
        }

        stage('Backend - Lint & Test') {
            steps {
                dir('backend') {
                    sh '''
                        python3 -m venv venv
                        . venv/bin/activate
                        pip install --no-cache-dir -r requirements.txt
                        # Note: Requires Postgres running on the host or DB container
                        python manage.py test
                    '''
                }
            }
            post {
                always {
                    // Clean up host venv to avoid cluttering workspace
                    dir('backend') {
                        sh 'rm -rf venv'
                    }
                }
            }
        }

        stage('Frontend - Lint & Build') {
            steps {
                dir('frontend') {
                    sh '''
                        npm ci
                        npm run lint || true
                        npm run build
                    '''
                }
            }
        }

        stage('Docker - Build & Push') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub',
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )
                ]) {
                    sh '''
                        echo "$DOCKER_PASSWORD" | docker login \
                            --username "$DOCKER_USERNAME" \
                            --password-stdin

                        docker compose build

                        docker tag immo-backend:latest \
                            "$DOCKER_USERNAME/immo-backend:latest"

                        docker tag immo-frontend:latest \
                            "$DOCKER_USERNAME/immo-frontend:latest"

                        docker push "$DOCKER_USERNAME/immo-backend:latest"
                        docker push "$DOCKER_USERNAME/immo-frontend:latest"

                        docker logout
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'CI pipeline completed successfully.'
        }
        failure {
            echo 'CI pipeline failed. Check the stage logs above.'
        }
        always {
            sh 'docker compose down --remove-orphans || true'
        }
    }
}
