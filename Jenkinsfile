pipeline {
    agent any

    environment {
        GCP_PROJECT = 'ardhra-977805'
        GCR_REGISTRY = 'us-central1-docker.pkg.dev/ardhra-977805/test-registry'
        IMAGE_NAME = 'nodejs-mongo-app_nodejs-app'
        IMAGE_TAG = "${BUILD_NUMBER}"
        K8S_DEPLOYMENT = 'nodejs-app-deployment'
        K8S_NAMESPACE = 'default'
       
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main', url: 'https://github.com/Botsky123/node-test-app.git'
            }
        }

        stage('SonarQube Analysis') {
            environment {
                SONAR_AUTH_TOKEN = credentials('sonarqube-token')
                SONAR_HOST_URL = credentials('sonarqube-url')
            }
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        /var/lib/jenkins/tools/hudson.plugins.sonar.SonarRunnerInstallation/sonar-scanner/bin/sonar-scanner \
                        -Dsonar.projectKey=nodejs-app-jenkins \
                        -Dsonar.projectName=nodejs-app-jenkins \
                        -Dsonar.projectVersion=1.0 \
                        -Dsonar.sources=. \
                        -Dsonar.host.url=${SONAR_HOST_URL} \
                        -Dsonar.login=${SONAR_AUTH_TOKEN}
                    '''
                }
                sh '''
                    curl -u ${SONAR_AUTH_TOKEN}: ${SONAR_HOST_URL}/api/issues/search?componentKeys=nodejs-app-jenkins > sonar-report.json
                '''
                archiveArtifacts artifacts: 'sonar-report.json', fingerprint: true
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh """
                        docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} . 
                    """
                }
            }
        }

        stage('Download and Install Trivy') {
            steps {
                script {
                    sh '''
                        #!/bin/bash
                        sudo apt-get install -y wget gnupg
                        wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | gpg --dearmor | sudo tee /usr/share/keyrings/trivy.gpg > /dev/null
                        echo "deb [signed-by=/usr/share/keyrings/trivy.gpg] https://aquasecurity.github.io/trivy-repo/deb generic main" | sudo tee -a /etc/apt/sources.list.d/trivy.list
                        sudo apt-get update
                        sudo apt-get install -y trivy
                    '''
                }
            }
        }

        stage('Scan for Vulnerabilities') {
            steps {
                script {
                    sh '''
                        #!/bin/bash
                        trivy image --severity MEDIUM,HIGH,CRITICAL --format json --output trivy-report.json ${IMAGE_NAME} || true
                    '''
                    archiveArtifacts artifacts: 'trivy-report.json', fingerprint: true
                }
            }
        }

        stage('Authenticate to GCR') {
            steps {
                script {
                    withCredentials([file(credentialsId: 'gcr-service-account-key', variable: 'GCLOUD_KEY_FILE')]) {
                        sh """
                            gcloud auth activate-service-account --key-file=${GCLOUD_KEY_FILE}
                            gcloud auth configure-docker us-central1-docker.pkg.dev
                        """
                    }
                }
            }
        }

        stage('Push Image to GCR') {
            steps {
                script {
                    sh """
                        docker tag ${IMAGE_NAME} ${GCR_REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}
                        docker push ${GCR_REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}
                    """
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    withCredentials([file(credentialsId: 'kube-config', variable: 'KUBECONFIG_FILE')]) {
                        sh """
                            export KUBECONFIG=${KUBECONFIG_FILE}
                            helm upgrade --install ${IMAGE_NAME} ./helm \
                                --namespace ${K8S_NAMESPACE} \
                                --create-namespace \
                                --set app.image.repository=${GCR_REGISTRY}/${IMAGE_NAME} \
                                --set app.image.tag=${BUILD_NUMBER} \
                                --kubeconfig $KUBECONFIG
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                def jobName = env.JOB_NAME
                def buildNumber = env.BUILD_NUMBER
                def pipelineStatus = currentBuild.result ?: 'UNKNOWN'
                def bannerColor = pipelineStatus.toUpperCase() == 'SUCCESS' ? 'green' : 'red'

                def body = """<html>
                    <body>
                        <div style="border: 4px solid ${bannerColor}; padding: 10px;">
                            <h2>${jobName} - Build ${buildNumber}</h2>
                            <div style="background-color: ${bannerColor}; padding: 10px;"> 
                                <h3 style="color: white;">Pipeline Status: ${pipelineStatus.toUpperCase()}</h3>
                            </div>
                            <p>Check the <a href="${BUILD_URL}">console output</a>.</p>
                        </div>
                    </body>
                </html>"""

                emailext (
                    subject: "${jobName} - Build ${buildNumber} - ${pipelineStatus.toUpperCase()}",
                    body: body,
                    to: 'ardhraharidas444@gmail.com',
                    from: 'jenkins@example.com',
                    replyTo: 'jenkins@example.com',
                    mimeType: 'text/html',
                    attachmentsPattern: 'sonar-report.json,trivy-report.json'
                )
            }
            cleanWs()
        }
    }
}
