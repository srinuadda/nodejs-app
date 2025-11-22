pipeline {
  agent any

  environment {
    APP_NAME = "nodejs-app"
    REGISTRY = "nexus.devops.internal:5000"
    IMAGE_TAG = "1.0.0-${BUILD_NUMBER}-${GIT_COMMIT[0..6]}"
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Build & Test') {
      steps {
        sh 'npm ci'
        sh 'npm test'
      }
    }

    stage('SonarQube Analysis') {
      steps {
        withSonarQubeEnv('MySonar') {
          sh '''
            sonar-scanner \
              -Dsonar.projectKey=nodejs-app \
              -Dsonar.sources=. \
              -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info || true
          '''
        }
      }
    }

    stage('Quality Gate') {
      steps {
        script {
          def qg = waitForQualityGate()
          if (qg.status != 'OK') {
            error "Quality Gate failed: ${qg.status}"
          }
        }
      }
    }

    stage('Build Docker Image') {
      steps {
        sh "docker build -t ${REGISTRY}/${APP_NAME}:${IMAGE_TAG} ."
      }
    }

    stage('Trivy Scan') {
      steps {
        sh """
          trivy image --severity HIGH,CRITICAL \
            --exit-code 1 ${REGISTRY}/${APP_NAME}:${IMAGE_TAG} || true
        """
      }
    }

    stage('Push Image') {
      steps {
        sh "docker push ${REGISTRY}/${APP_NAME}:${IMAGE_TAG}"
      }
    }

    stage('Deploy to Dev') {
      steps {
        sh """
          kubectl -n dev set image deployment/${APP_NAME} \
            ${APP_NAME}=${REGISTRY}/${APP_NAME}:${IMAGE_TAG} --record || true
        """
      }
    }
  }

  post {
    success {
      echo "Dev pipeline completed for ${APP_NAME} with tag ${IMAGE_TAG}"
    }
  }
}
