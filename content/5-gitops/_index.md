+++
title = "Configure GitOps"
weight = 10
+++

Now that our CI/CD build and integration stage is really we could promote the app version directly to a production stage.  But with the help of the GitOps approach we can leverage our Git System to handle promotion that is tracked through commits and can deploy and configure the whole production environment.  This stage is just too critical to configuare manually and without audit.

So let's start be installing the OpenShift GitOps Operator based on project ArgoCD. 

- Install the **Red Hat OpenShift GitOps** Operator from OperatorHub
- Create a new Migration and clone the **Config GitOps Repository** to Gitea. This will be the repository that contains our GitOps infrastructure components and state
 - https://github.com/devsecops-workshop/openshift-gitops-getting-started.git
- Create OpenShift Project `workshop-prod`
Give ArgoCD Permissions to create objects in namespace workshop-prod
```
 oc adm policy add-role-to-user admin system:serviceaccount:openshift-gitops:openshift-gitops-argocd-application-controller -n workshop-prod
 ```
- Give namespace `workshop-prod` permissions to pull images from `workshop-int`
```
oc policy add-role-to-user \
    system:image-puller system:serviceaccount:workshop-prod:default \
    --namespace=workshop-int
```
- Go to **ArgoCD** URL (There is new shortcut at the top right menu with the squares)
- User is `admin` and password will be in namespace `openshift-gitops` in Secret `openshift-gitops-cluster`
- Modify ckuster settings
  - Click the gears on the left
  - Go to 'clusters'
  - Go to 'in-cluster'
  - Click **edit**
  - Modify `namespaces` to 'workshop-prod'
  - Click **save**
- Create App
  - Application name : workshop
  - Project : default
  - Repo URL : https://repository-gitea.apps.{YOUR DOMAIN}.com/gitea/openshift-gitops-getting-started.git (replacing {YOUR DOMAIN) so this matches your Gitea config repo)
  - Path : environments/dev
  - Cluster URL : https://kubernetes.default.svc
  - Namespace : workshop-prod
  - ENABLE AUTO-SYNC
  - Click **Create**
- In the **NAMESPACES** filter in the bottom left filter to `ẁorkspace-prod`
- Watch the resources (Deployment, Service, Route) get rolled out to the namespace `workshop-prod`. Notice we have also scaled our app to 2 pods in the prod stage as we want some HA. 

Our complete prod stage is now configured and controlled though GitOps. But how do we now tell ArgoCD that there is a new version of our app to deploy? Weel, we will add a step to our build pipeline updating the config repo. Since ArgoCD permanently watches this repo it will react to a chnage immediately.  

It is also possible to update the repo with a Pull request. Then you have an approval process for your prod deployment.  

Let's add a new custom Tekton task that can push to a git repo
- In the namespace`ẁorkshop-int` switch to Administrator Perspective > Pipelines > Tasks > New Task
- And enter
```yaml
apiVersion: tekton.dev/v1beta1
kind: Task
metadata:
  annotations:
    tekton.dev/pipelines.minVersion: 0.12.1
    tekton.dev/tags: git
  name: git-update-deployment
  namespace: workshop-int
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
- name: git-update-deployment
     params:
       - name: GIT_REPOSITORY
         value: >-
           https://repository-git.apps.{YOUR DOMAIN}/gitea/openshift-gitops-getting-started.git
       - name: GIT_USERNAME
         value: gitea
       - name: GIT_PASSWORD
         value: gitea
       - name: CURRENT_IMAGE
         value: >-
           image-registry.openshift-image-registry.svc:5000/workshop-int/workshop:latest
       - name: NEW_IMAGE
         value: >-
           image-registry.openshift-image-registry.svc:5000/workshop-int/workshop
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
- Create a secret with credentials for your gitea repository, so the task can authenticate and push to Gitea. Replace {YOUR DOMAIN}
```yaml
kind: Secret
apiVersion: v1
metadata:
  name: gitea
  namespace: workshop-int
  annotations:
    tekton.dev/git-0: 'https://repository-git.apps.{YOUR DOMAIN}'
data:
  password: Z2l0ZWE=
  username: Z2l0ZWE=
type: kubernetes.io/basic-auth
```
- Edit the serviceaccount "pipeline" and add the secret to it, so it will be available during the pipeline run
```yaml
kind: ServiceAccount
apiVersion: v1
metadata:
  name: pipeline
  namespace: workshop-int
secrets:
  - name: gitea
```
- Run the pipeline and see that in your Gitea repo /environment/dev/kustomize.yaml is updated with the new image version
- This will tell ArgoCD to update the `Deployment` with this new image version
- Check that the new image is rolled out (you may need to sync manually in ArgoCD to speed things up)


