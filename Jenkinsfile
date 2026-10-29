// BIMLab Ticket CI: verify the frontend and backend and build the backend image.
// Verification only: there is no registry push or deploy stage until the service has a deploy target.
// Like the other BIMLab pipelines, Jenkins runs in a container, so each step runs in a tool container
// that shares the Jenkins workspace volume (--volumes-from "$HOSTNAME").

def normalizeTagPart(String value) {
  def sanitized = (value ?: 'local').toLowerCase().replaceAll(/[^a-z0-9_.-]/, '-')
  return sanitized.length() > 80 ? sanitized.substring(0, 80) : sanitized
}

pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '30', artifactNumToKeepStr: '10'))
    timeout(time: 45, unit: 'MINUTES')
  }

  parameters {
    booleanParam(name: 'RUN_SECURITY_AUDIT', defaultValue: false, description: 'Also fail on npm audit findings of high severity or worse.')
  }

  environment {
    APP_SLUG = 'ticket'
    RUN_SECURITY_AUDIT = "${params.RUN_SECURITY_AUDIT ?: false}"
    MAVEN_IMAGE = 'maven:3.9.9-eclipse-temurin-17'
    NODE_IMAGE = 'node:22-alpine'
    DOCKER_BUILDKIT = '1'
  }

  stages {
    stage('Prepare metadata') {
      steps {
        sh '''
          set -eu
          rm -rf ci-artifacts reports dist backend/ticket-service/target
          mkdir -p ci-artifacts reports .jenkins-cache/m2
        '''
        script {
          env.GIT_SHA = sh(returnStdout: true, script: 'git rev-parse HEAD').trim()
          env.GIT_SHA_SHORT = sh(returnStdout: true, script: 'git rev-parse --short=12 HEAD').trim()
          env.IMAGE_TAG = "${normalizeTagPart(env.BRANCH_NAME)}-${normalizeTagPart(env.BUILD_NUMBER)}-${env.GIT_SHA_SHORT}"
          writeFile file: 'ci-artifacts/build-metadata.env', text: """APP_SLUG=${env.APP_SLUG}
GIT_SHA=${env.GIT_SHA}
IMAGE_TAG=${env.IMAGE_TAG}
BRANCH_NAME=${env.BRANCH_NAME ?: ''}
BUILD_NUMBER=${env.BUILD_NUMBER ?: ''}
"""
        }
      }
    }

    stage('Frontend: typecheck, test, build') {
      steps {
        sh '''
          set -eu
          docker run --rm \
            --user "$(id -u):$(id -g)" \
            --volumes-from "$HOSTNAME" \
            -w "$PWD" \
            -e CI=true \
            -e HOME=/tmp \
            -e NPM_CONFIG_CACHE=/tmp/npm \
            -e RUN_SECURITY_AUDIT="$RUN_SECURITY_AUDIT" \
            "$NODE_IMAGE" sh -lc '
              set -eu
              rm -rf node_modules
              npm ci
              npm run typecheck
              npx vitest run --reporter=default --reporter=junit --outputFile=reports/vitest-junit.xml
              test -s reports/vitest-junit.xml
              npm run build
              if [ "${RUN_SECURITY_AUDIT:-false}" = "true" ]; then npm audit --audit-level=high; fi
            '
        '''
      }
    }

    stage('Backend: verify and package (JDK 17)') {
      steps {
        sh '''
          set -eu
          docker run --rm \
            --user "$(id -u):$(id -g)" \
            --volumes-from "$HOSTNAME" \
            -w "$PWD/backend/ticket-service" \
            -e HOME=/tmp \
            -e MAVEN_CONFIG=/tmp/.m2 \
            "$MAVEN_IMAGE" \
            mvn -B -ntp -Dmaven.repo.local="$PWD/.jenkins-cache/m2/repository" verify
        '''
      }
    }

    stage('Build and inspect backend image') {
      steps {
        sh '''
          set -eu
          LOCAL_TAG="bimlab-ci/bimlab-ticket-service:$IMAGE_TAG"
          docker build \
            --label ci.repo="$APP_SLUG" \
            --label org.opencontainers.image.revision="$GIT_SHA" \
            -t "$LOCAL_TAG" \
            backend/ticket-service
          docker image inspect "$LOCAL_TAG" >/dev/null
          printf 'bimlab-ticket-service %s\\n' "$LOCAL_TAG" > ci-artifacts/local-images.txt
        '''
      }
    }
  }

  post {
    always {
      junit allowEmptyResults: true, testResults: 'reports/**/*.xml,backend/ticket-service/target/surefire-reports/*.xml'
      archiveArtifacts allowEmptyArchive: true, fingerprint: true, artifacts: 'ci-artifacts/**,dist/**,backend/ticket-service/target/*.jar'
    }
  }
}
