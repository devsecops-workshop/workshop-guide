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
```yaml
apiVersion: tekton.dev/v1beta1
kind: Task
metadata:
  annotations:
    tekton.dev/pipelines.minVersion: 0.12.1
    tekton.dev/tags: git
  resourceVersion: '94554874'
  name: git-update-deployment
  uid: 0099bf67-93ee-4cfb-9e09-94ed743b26bf
  creationTimestamp: '2021-10-20T17:15:32Z'
  generation: 52
  managedFields:
    - apiVersion: tekton.dev/v1beta1
      fieldsType: FieldsV1
      fieldsV1:
        'f:metadata':
          'f:annotations':
            .: {}
            'f:tekton.dev/pipelines.minVersion': {}
            'f:tekton.dev/tags': {}
          'f:labels':
            .: {}
            'f:app.kubernetes.io/version': {}
            'f:operator.tekton.dev/provider-type': {}
        'f:spec':
          .: {}
          'f:description': {}
          'f:params': {}
          'f:results': {}
          'f:steps': {}
          'f:workspaces': {}
      manager: Mozilla
      operation: Update
      time: '2021-10-20T17:15:32Z'
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


        kustomize edit set image \
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


        #git remote add auth-origin $(echo $(params.GIT_REPOSITORY) | sed -E \
        #"s#http://(.*)#http://$(params.GIT_USERNAME):$(params.GIT_PASSWORD)@\1#g")

        git remote add auth-origin
        https://gitea:gitea@repository-gitea.apps.{YOUR_DOMAIN}/gitea/openshift-gitops-getting-started.git


        git show-ref

        git push auth-origin main



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
```yaml
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
- Run the pipeline and see that in your Gitea repo /environment/dev/kustomize.yaml is updated with the newImage version
- This will tell ArgoCD to update the Deployment with this new Image version
- Check that the new image is rolled out (you may need to Sync manually in ArgoCD to speed it up)


