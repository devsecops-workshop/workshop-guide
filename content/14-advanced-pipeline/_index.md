+++
title = "Advanced Pipeline"
weight = 30
+++

## Optimizing our DevSecOps Pipeline

In the chapter before we created a Pipeline which builds, checks and deploys our image, if the image passes all ACS checks. But what should happen, if the image doesn't pass the ACS check? It doesn't seems to be a good idea to save an unsafe image in the internal OpenShift registry. 
So lets modify our pipeline to an advanced one, which deletes an image, if it doesn't pass the ACS checks. 

### Let's go: Create our advanced Pipeline

In OpenShift administration view: 

- navigate to **Pipelines > Pipelines**
- on the left click **Create > Pipeline**
- switch to **YAML view**
- Replace the YAML displayed with this: 

```yaml
apiVersion: tekton.dev/v1beta1
kind: Pipeline
metadata:
  labels:
  name: workshop-advanced
  namespace: workshop-int
spec:
  finally:
    - name: delete-image
      params:
        - name: SCRIPT
          value: 'oc tag -d workshop-int/workshop:dev -n workshop-int'
        - name: VERSION
          value: latest
      taskRef:
        kind: ClusterTask
        name: openshift-client
      when:
        - input: $(tasks.image-check.status)
          operator: in
          values:
            - Failed
  params:
    - default: workshop
      name: APP_NAME
      type: string
    - default: >-
        https://repository-openshift-operators.apps.cluster-rsph7.rsph7.sandbox1788.opentlc.com/gitea/quarkus-build-options.git
      name: GIT_REPO
      type: string
    - default: master
      name: GIT_REVISION
      type: string
    - default: >-
        image-registry.openshift-image-registry.svc:5000/workshop-int/workshop:dev
      name: IMAGE_NAME
      type: string
    - default: .
      name: PATH_CONTEXT
      type: string
    - default: openjdk-11-el7
      name: VERSION
      type: string
  tasks:
    - name: git-update-deployment
      params:
        - name: GIT_REPOSITORY
          value: >-
            https://repository-openshift-operators.apps.cluster-rsph7.rsph7.sandbox1788.opentlc.com/gitea/openshift-gitops-getting-started.git
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
        - tag-checked-image
        - remove-dev-tag
      taskRef:
        kind: Task
        name: git-update-deployment
      workspaces:
        - name: workspace
          workspace: workspace
    - name: fetch-repository
      params:
        - name: url
          value: $(params.GIT_REPO)
        - name: revision
          value: $(params.GIT_REVISION)
        - name: deleteExisting
          value: 'true'
      taskRef:
        kind: ClusterTask
        name: git-clone
      workspaces:
        - name: output
          workspace: workspace
    - name: build
      params:
        - name: IMAGE
          value: $(params.IMAGE_NAME)
        - name: TLSVERIFY
          value: 'false'
        - name: PATH_CONTEXT
          value: $(params.PATH_CONTEXT)
        - name: VERSION
          value: $(params.VERSION)
      runAfter:
        - fetch-repository
      taskRef:
        kind: ClusterTask
        name: s2i-java
      workspaces:
        - name: source
          workspace: workspace
    - name: deploy
      params:
        - name: SCRIPT
          value: oc rollout status deploy/$(params.APP_NAME)
      runAfter:
        - tag-checked-image
        - remove-dev-tag
      taskRef:
        kind: ClusterTask
        name: openshift-client
    - name: image-check
      params:
        - name: rox_central_endpoint
          value: roxsecrets
        - name: rox_api_token
          value: roxsecrets
        - name: image
          value: >-
            image-registry.openshift-image-registry.svc:5000/workshop-int/workshop
        - name: image_digest
          value: $(tasks.build.results.IMAGE_DIGEST)
      runAfter:
        - build
      taskRef:
        kind: ClusterTask
        name: rox-image-check
    - name: tag-checked-image
      params:
        - name: SCRIPT
          value: 'oc tag workshop:dev workshop:latest'
        - name: VERSION
          value: latest
      runAfter:
        - image-check
      taskRef:
        kind: ClusterTask
        name: openshift-client
    - name: remove-dev-tag
      params:
        - name: SCRIPT
          value: 'oc tag -d workshop:dev'
        - name: VERSION
          value: latest
      runAfter:
        - image-check
      taskRef:
        kind: ClusterTask
        name: openshift-client
  workspaces:
    - name: workspace
```

Lets see what has changed in the Pipeline:

- the image which was build through the **build task** will be pushed in a new **ImageStreamTag** called `dev`
- if the image passes the ACS checks, the image will be pushed to the **ImageStreamTag** called `latest` and the `dev`tag will be removed
- if the image doesn't pass the ACS checks, the **ImageStreamTag** called `dev` will be removed. This is handled by a function called `finally`and a `when expression`
  - have a look at your Pipeline YAML and try to understand how this works
- the last three steps stays the same as before


### Test the advanced Pipeline

Go ahead and start your newly created advanced Pipeline. See what happens and play a little bit around with it. Have fun! 

