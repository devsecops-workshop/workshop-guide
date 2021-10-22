+++
title = "Configure GitOps"
weight = 10
+++

- Install GitOps Operator from Operator Hub
- Clone Config GitOps Repo to Gitea
 https://github.com/devsecops-workshop/openshift-gitops-getting-started.git
- Create OpenShift Project deepspace-prod
Give ArgoCD Permissions to create objects in namespace deepspace-prod
```
 oc adm policy add-role-to-user admin system:serviceaccount:openshift-gitops:openshift-gitops-argocd-application-controller -n deepspace-prod
 ```
- Give namespace deepspace-prod permissions to pull images from deepspace-int
```
oc policy add-role-to-user \
    system:image-puller system:serviceaccount:deepspace-prod:default \
    --namespace=deepspace-int
```
- Go to ArgoCD URL (The is new shortcut at the top right menu with the squares)
- User is admin and password will be in namespace openshift-gitops in Secret openshift-gitops-cluster
- Create App
  - Application name : quarkus-options
  - Project : default
  - Self Heal true
  - Repo URL : https://repository-gitea.apps.{YOUR DOMAIN}.com/gitea/openshift-gitops-getting-started.git
  - Path : environments/dev
  - Cluster URL : https://kubernetes.default.svc
  - Namespace : deepspace-prod
- Watch the resources (Deployment, Service, Route)get rolled out to the namespace deepspace-prod
- Add a new custom Tekton task (Switch to Administrator Perspective > Pipelines > Tasks > New Task) that can push to a git repo.
- Make sure to replace {YOUR_DOMAIN}
```yaml
apiVersion: tekton.dev/v1beta1
kind: Task
metadata:
  annotations:
    tekton.dev/pipelines.minVersion: 0.12.1
    tekton.dev/tags: git
  name: git-update-deployment
  namespace: deepspace-int
  labels:
    app.kubernetes.io/version: '0.1'
    operator.tekton.dev/provider-type: community
spec:
  description: This Task can be used to update image digest in a Git repo using kustomize
  params:
    - name: GIT_REPOSITORY
      type: string
    - name: GIT_USERNAME
      type: string
    - name: GIT_PASSWORD
      type: string
    - name: CURRENT_IMAGE
      type: string
    - name: NEW_IMAGE
      type: string
    - name: NEW_DIGEST
      type: string
    - name: KUSTOMIZATION_PATH
      type: string
  results:
    - description: The commit SHA
      name: commit
  steps:
    - image: 'docker.io/alpine/git:v2.26.2'
      name: git-clone
      resources: {}
      script: |
        rm -rf git-update-digest-workdir
        git clone $(params.GIT_REPOSITORY) git-update-digest-workdir
      workingDir: $(workspaces.workspace.path)
    - image: 'quay.io/wpernath/kustomize-ubi:latest'
      name: update-digest
      resources: {}
      script: >
        #!/usr/bin/env bash

        echo "Start"

        pwd

        cd git-update-digest-workdir/$(params.KUSTOMIZATION_PATH)

        pwd


        #echo "kustomize edit set image
        #$(params.CURRENT_IMAGE)=$(params.NEW_IMAGE)@$(params.NEW_DIGEST)"


        kustomize version


        kustomize edit set image
        $(params.CURRENT_IMAGE)=$(params.NEW_IMAGE)@$(params.NEW_DIGEST)


        echo "##########################"



        echo "### kustomization.yaml ###"



        echo "##########################"


        ls


        cat kustomization.yaml
      workingDir: $(workspaces.workspace.path)
    - image: 'docker.io/alpine/git:v2.26.2'
      name: git-commit
      resources: {}
      script: >
        pwd


        cd git-update-digest-workdir



        git config user.email "tekton-pipelines-ci@redhat.com"



        git config user.name "tekton-pipelines-ci"



        git status



        git add $(params.KUSTOMIZATION_PATH)/kustomization.yaml


        # git commit -m "[$(context.pipelineRun.name)] Image digest updated"


        git status


        git commit -m "[ci] Image digest updated"


        git status

        git push



        RESULT_SHA="$(git rev-parse HEAD | tr -d '\n')"



        EXIT_CODE="$?"



        if [ "$EXIT_CODE" != 0 ]



        then
          exit $EXIT_CODE
        fi


        # Make sure we don't add a trailing newline to the result!


        echo -n "$RESULT_SHA" > $(results.commit.path)
      workingDir: $(workspaces.workspace.path)
  workspaces:
    - description: The workspace consisting of maven project.
      name: workspace

```
- Add this Task to your Pipeline by adding it to the YAML like this
- Make sure to replace {YOUR_DOMAIN}
```yaml
...
- name: git-update-deployment
     params:
       - name: GIT_REPOSITORY
         value: >-
           https://repository-gitea.apps.{YOUR DOMAIN}/gitea/openshift-gitops-getting-started.git
       - name: GIT_USERNAME
         value: gitea
       - name: GIT_PASSWORD
         value: gitea
       - name: CURRENT_IMAGE
         value: >-
           image-registry.openshift-image-registry.svc:5000/deepspace-int/quarkus-build:latest
       - name: NEW_IMAGE
         value: >-
           image-registry.openshift-image-registry.svc:5000/deepspace-int/quarkus-build
       - name: NEW_DIGEST
         value: $(tasks.build.results.IMAGE_DIGEST)
       - name: KUSTOMIZATION_PATH
         value: environments/dev
     runAfter:
       - build
     taskRef:
       kind: Task
       name: git-update-deployment
     workspaces:
       - name: workspace
         workspace: workspace

```
- Create a secret with credentails for your gitea repository
```yaml
kind: Secret
apiVersion: v1
metadata:
  name: gitea
  namespace: deepspace-int
  annotations:
    tekton.dev/git-0: 'https://repository-git.apps.{YOUR DOMAIN}'
data:
  password: Z2l0ZWE=
  username: Z2l0ZWE=
type: kubernetes.io/basic-auth
```
- Edit the serviceaccount "pipeline" and add the secret to it:
```yaml
kind: ServiceAccount
apiVersion: v1
metadata:
  name: pipeline
  namespace: deepspace-int
secrets:
  - name: gitea
```
- Run the pipeline and see that in your Gitea repo /environment/dev/kustomize.yaml is updated with the newImage version
- This will tell ArgoCD to update the Deployment with this new Image version
- Check that the new image is rolled out (you may need to Sync manually in ArgoCD to speed it up)


