+++
title = "Configure GitOps"
weight = 10
+++

Now that our CI/CD build and integration stage is ready we could promote the app version directly to a production stage. But with the help of the GitOps approach, we can leverage our Git System to handle promotion that is tracked through commits and can deploy and configure the whole production environment. This stage is just too critical to configure manually and without audit.

## Install OpenShift GitOps

So let's start be installing the OpenShift GitOps Operator based on project ArgoCD.

- Install the **Red Hat OpenShift GitOps** Operator from OperatorHub with default settings
  {{% notice tip %}}
  The installation of the GitOps Operator will give you a clusterwide ArgoCD instance available at the link in the top right menu, but since we want to have an instance to manage just our prod namespaces we will create another ArgoCD in that specific namespace.  
  {{% /notice %}}
- Create a new OpenShift Project `workshop-prod`
- Then in the project `workshop-prod` click on **Installed Operators** and then **Red Hat OpenShift GitOps**.
- On the **ArgoCD** "tile" click on **Create instance** to create an ArgoCD instance in the `workshop-prod` project.

<!-- ![ArgoCD](../images/argo.png) -->

{{< figure src="../images/argo.png?width=50pc&classes=border,shadow" title="Click image to enlarge" >}}

- Keep the settings as they are and click **Create**

## Prepare the GitOps Config Repository

- In `Gitea` create a **New Migration** and clone the Config GitOps Repo which will be the repository that contains our GitOps infrastructure components and state
- The URL is https://github.com/devsecops-workshop/openshift-gitops-getting-started.git

Have quick look at the structure of this project :

**app** - contains yamls for the deployment, service and route resources needed by our application. These will be applied to the cluster. There is also a `kustomization.yaml` defining that kustomize layers will be applied to all yamls

**environments/dev** - contains the `kustomization.yaml` which will be modified by our builds with new Image versions. ArgoCD will pick up these changes and trigger new deployments.

## Setup GitOps Project

Let's setup the project that tells ArgoCD to watch our config repo and updated resources in the `workshop-prod` project accordingly.

- Give namespace `workshop-prod` permissions to pull images from `workshop-int`

```
oc policy add-role-to-user \
    system:image-puller system:serviceaccount:workshop-prod:default \
    --namespace=workshop-int
```

- Find the local **ArgoCD URL** by going to **Networking > Routes** in namespace `workshop-prod`
- Open the ArgoCD website ignoring the certificate warning
- Don't login with OpenShift but with username and password
- User is `admin` and password will be in Secret `argocd-cluster`

ArgoCD works with the concept of **Apps**. We will create an App and point it to the Config Git Repo. ArgoCD will look for k8s yaml files in the repo and path and deploy them to the defined namespace. Additionally ArgoCD will also react to changes to the repo and reflect these to the namespace. You can also enable self-healing to prevent configuration drift. If you want find out more about OpenShift GitOps have look [here](https://docs.openshift.com/container-platform/4.10/cicd/gitops/understanding-openshift-gitops.html) :

- Create App
  - Click the **Manage your applications** icon on the left
  - Click **Create Application**
  - **Application Name**: workshop
  - **Project**: default
  - **SYNC POLICY**: Automatic
  - **Repository URL**: Copy the URL of your config repo from Gitea (It should resemble `http://repository-git.apps.{YOUR DOMAIN}.com/gitea/openshift-gitops-getting-started.git`)
  - **Path**: environments/dev
  - **Cluster URL**: https://kubernetes.default.svc
  - **Namespace**: workshop-prod
  - Click **Create**
  - Click on **Sync** and then **Synchronize** to manually trigger the first sync
  - Click on the `workshop` to show the deployment graph

Watch the resources (`Deployment`, `Service`, `Route`) get rolled out to the namespace `workshop-prod`. Notice we have also scaled our app to 2 pods in the prod stage as we want some HA.

Our complete prod stage is now configured and controlled though GitOps. But how do we tell ArgoCD that there is a new version of our app to deploy? Well, we will add a step to our build pipeline updating the config repo.

As we do not want to modify our original repo file we will use a tool called [Kustomize](https://kustomize.io/) that can add incremental change layers to YAML files. Since ArgoCD permanently watches this repo it will pick up these Kustomize changes.

{{% notice tip %}}
It is also possible to update the repo with a Pull request. Then you have an approval process for your prod deployment.
{{% /notice %}}

## Add Kustomize and Git Push Tekton Task

Let's add a new custom Tekton task that can update the Image `tag` via Kustomize after the build an then push the change to out git config repo.

- In the namespace `workshop-int` switch to the **Administrator** Perspective and go to **Pipelines > Tasks > Create Task**
- Replace the YAML definition with the following and click **Create**:

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
    app.kubernetes.io/version: "0.1"
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
    - image: "docker.io/alpine/git:v2.26.2"
      name: git-clone
      resources: {}
      script: |
        rm -rf git-update-digest-workdir
        git clone $(params.GIT_REPOSITORY) git-update-digest-workdir
      workingDir: $(workspaces.workspace.path)
    - image: "quay.io/wpernath/kustomize-ubi:latest"
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
    - image: "docker.io/alpine/git:v2.26.2"
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

## Add Tekton Task to Your Pipeline

- Go to **Pipeline > Pipelines > workshop** and then YAML

{{% notice tip %}}
You can edit pipelines either directly in YAML or in the visual **Pipeline Builder**. We will see how to use the Builder later on so let's edit the YAML for now.
{{% /notice %}}

Add the new Task to your Pipeline by adding it to the YAML like this:

- In the YAML view insert it at the **tasks** level after the `deploy` task
- For the `param` `GIT_REPOSITORY` use your git config repo url (eg. replace {YOUR DOMAIN})
- Make sure to fix indentation after pasting into the YAML!

{{% notice tip %}}
In the OpenShift YAML viewer/editor you can mark multiple lines and use **tab** to indent this lines for one step.
{{% /notice %}}

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

The `Pipeline` should now look like this

<!-- ![workshop Pipeline](../images/tekton.png) -->

{{< figure src="../images/pipeline1.png?width=50pc&classes=border,shadow" title="Click image to enlarge" >}}

- Create a secret with credentials for your `Gitea` repository, so the `task` can authenticate and push to `Gitea`. Replace {YOUR DOMAIN} here to match your `Gitea`URL
- You can add this by clicking on the **+** on the top right ob the Web Console

```yaml
kind: Secret
apiVersion: v1
metadata:
  name: gitea
  namespace: workshop-int
  annotations:
    tekton.dev/git-0: "https://repository-git.apps.{YOUR DOMAIN}"
data:
  password: Z2l0ZWE=
  username: Z2l0ZWE=
type: kubernetes.io/basic-auth
```

Now we need to add the secret to the `serviceaccount` that runs our pipelines so the `task` can push to our config repo.

- Go to **User Management > ServiceAccounts > pipeline**
- To make the secret available during a pipeline run: Open the YAML and in the `secrets` section add:

```yaml
- name: gitea
```

- Save and ignore the warning

## Update our Prod Stage via Pipeline and GitOps

- Run the pipeline and see that in your Gitea repo `/environment/dev/kustomize.yaml` is updated with the new image version
  {{% notice tip %}}
  Notice that the `deploy` and the `git-update` steps now run in parallel. This is one of the powers of Tekton. It can scale natively with pods on OpenShift.  
  {{% /notice %}}

- This will tell ArgoCD to update the `Deployment` with this new image version
- Check that the new image is rolled out (you may need to sync manually in ArgoCD to speed things up)
