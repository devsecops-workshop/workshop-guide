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
- You should already have created an OpenShift **Project** `workshop-prod`
- In the project `workshop-prod` click on **Installed Operators** and then **Red Hat OpenShift GitOps**.
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

- Find the local **ArgoCD URL** (not the global instance) by going to **Networking > Routes** in namespace `workshop-prod`
- Open the ArgoCD website ignoring the certificate warning
- Don't login with OpenShift but with username and password
- User is `admin` and password will be in Secret `argocd-cluster`

ArgoCD works with the concept of **Apps**. We will create an App and point it to the Config Git Repo. ArgoCD will look for k8s yaml files in the repo and path and deploy them to the defined namespace. Additionally ArgoCD will also react to changes to the repo and reflect these to the namespace. You can also enable self-healing to prevent configuration drift. If you want find out more about OpenShift GitOps have look [here](https://docs.openshift.com/container-platform/4.10/cicd/gitops/understanding-openshift-gitops.html).

- Create App
  - Click the **Manage your applications** icon on the left
  - Click **Create Application**
  - **Application Name**: workshop
  - **Project**: default
  - **SYNC POLICY**: Automatic
  - **Repository URL**: Copy the URL of your config repo from Gitea
  - **Path**: environments/dev
  - **Cluster URL**: https://kubernetes.default.svc
  - **Namespace**: workshop-prod
  - Click **Create**
  - Click on **Sync** and then **Synchronize** to manually trigger the first sync
  - Click on the `workshop` to show the deployment graph

Watch the resources (`Deployment`, `Service`, `Route`) get rolled out to the namespace `workshop-prod`. Notice we have also scaled our app to 2 pods in the prod stage as we want some HA.

{{% notice info %}}
Since we have not published our image to the Quay `workshop-int` repository the initial Deployment will roll out a defined dummy image from the public quay.io Registry. This is just to ensure a initial succesful sync in ArgoCD. Once the fist pipeline runs, our actual built image will be rolled out.
{{% /notice %}}

Our complete prod stage is now configured and controlled though GitOps. But how do we tell ArgoCD that there is a new version of our app to deploy? Well, we will add a step to our build pipeline updating the config repo.

As we do not want to modify our original repo file we will use a tool called [Kustomize](https://kustomize.io/) that can add incremental change layers to YAML files. Since ArgoCD permanently watches this repo it will pick up these Kustomize changes.

{{% notice tip %}}
It is also possible to update the repo with a Pull request. Then you have an approval process for your prod deployment.
{{% /notice %}}

## Initialize the workshop-prod/workshop repo in Quay

We will need to initialize the `workshop-prod/workshop` in Quay so the robo user will be able to to push images there later on.

- In Quay select the organization `openshift_workshop-prod` on the right
- Click on **+ Create New Repository** on the top left
  {{< figure src="../images/quay-create-repo.png?width=50pc&classes=border,shadow" title="Click image to enlarge" >}}
- Make sure to select `openshift_workshop-prod` as Organization
- Enter `workshop`as repo name
- Set the repo to **Public**
- Click **Create Public Repository**
  {{< figure src="../images/quay-create-repo2.png?width=30pc&classes=border,shadow" title="Click image to enlarge" >}}

## Add Kustomize and Git Push Tekton Task

Let's add a new custom Tekton task that can update the Image `tag` via Kustomize after the build and then push the change to our git config repo.

We could add this through the OpenShift Web Console as well but to save time we will apply the file directly via the `oc` command.

- Go to your Web Terminal or open a new one.
- Apply the task via YAML: `oc create -f https://raw.githubusercontent.com/devsecops-workshop/yaml/main/tekton-kustomize.yml`
- In the OpenShift Webconsole go to **Pipelines > Tasks > ClusterTasks** and have a look at the just imported task `git-update-deployment`. You should see the git commands how the config repo will be cloned, patched by **Kustomize** and the pushed again.

## Add Tekton Tasks to your Pipeline to Promote your Image to workshop-prod

So now we have a new Tekton Task in our task catalog to update a Gitops Git repo, but we still need to pomote the actual Image from out `workshop-int` to `workshop-prod` project. Otherwise the image will not be available for our Deployment.

- Go to **Pipelines > Pipelines > workshop** and then YAML

{{% notice tip %}}
You can edit pipelines either directly in YAML or in the visual **Pipeline Builder**. We will see how to use the Builder later on so let's edit the YAML for now.
{{% /notice %}}

Add the new Task to your Pipeline by adding it to the YAML like this:

- First we will add a new Pipeline Parameter 'GIT_CONFIG_REPO' at the beginning of the Pipeline and set it by default to our GitOps Config Repository (This will be updated by the Pipeline and then trigger ArgoCD to deploy to Prod)
- So in the YAML view at the end of the `spec > params` section add the following (if the `<DOMAIN>` placeholder hasn't been replaced automatically, do it manually):

```yaml
- default: >-
      https://repository-git.apps.<DOMAIN>/gitea/openshift-gitops-getting-started.git
    name: GIT_CONFIG_REPO
    type: string
```

- Next insert the new **tasks** at the `tasks` level right after the `deploy` task
- We will map the Pipeline parameter `GIT_CONFIG_REPO` to the Task parameter `GIT_REPOSITORY`
- Make sure to fix indentation after pasting into the YAML!

{{% notice tip %}}
In the OpenShift YAML viewer/editor you can mark multiple lines and use **tab** to indent this lines for one step.
{{% /notice %}}

```yaml
- name: skopeo-copy
  params:
    - name: srcImageURL
      value: "docker://$(params.QUAY_URL)/openshift_workshop-int/workshop:latest"
    - name: destImageURL
      value: "docker://$(params.QUAY_URL)/openshift_workshop-prod/workshop:latest"
    - name: srcTLSverify
      value: "false"
    - name: destTLSverify
      value: "false"
  runAfter:
    - build
  taskRef:
    kind: ClusterTask
    name: skopeo-copy-updated
  workspaces:
    - name: images-url
      workspace: workspace
- name: git-update-deployment
  params:
    - name: GIT_REPOSITORY
      value: $(params.GIT_CONFIG_REPO)
    - name: CURRENT_IMAGE
      value: "quay.io/nexus6/hello-microshift:1.0.0-SNAPSHOT"
    - name: NEW_IMAGE
      value: $(params.QUAY_URL)/openshift_workshop-prod/workshop
    - name: NEW_DIGEST
      value: $(tasks.build.results.IMAGE_DIGEST)
    - name: KUSTOMIZATION_PATH
      value: environments/dev
  runAfter:
    - skopeo-copy
  taskRef:
    kind: Task
    name: git-update-deployment
  workspaces:
    - name: workspace
      workspace: workspace
```

The `Pipeline` should now look like this. Notice that the new `tasks` runs in parallel to the `deploy` task

<!-- ![workshop Pipeline](../images/tekton.png) -->

{{< figure src="../images/pipeline1.png?width=40pc&classes=border,shadow" title="Click image to enlarge" >}}

Now the pipeline is set. The last thing we need is authentication against the Gitea repo and the workshop-prod Quay org. We will add those from the `start pipeline` form next. Make sure to replace the <DOMAIN> placeholder if required.

## Update our Prod Stage via Pipeline and GitOps

- Click on Pipeline **Start**

  - In the form go down and expand **Show credential options**
  - Click **Add Secret**, then enter
    - **Secret name :** quay-workshop-prod-token
    - **Access to:** Image Registry
    - **Authentication type:** Basic Authentication
    - **Server URL:** quay-quay-quay.apps.&lt;DOMAIN&gt;/openshift_workshop-prod
    - **Username:** openshift_workshop-prod+builder
    - **Password** : (Retrieve this from the Quay organization openshift_workshop-prod robo account `openshift_workshop-prod+builder` as before)
    - Click the checkmark
  - Then click **Add Secret** again
    - **Secret name :** gitea-secret
    - **Access to:** Git Server
    - **Authentication type:** Basic Authentication
    - **Server URL:** https://repository-git.apps.&lt;DOMAIN&gt;/gitea/openshift-gitops-getting-started.git
    - **Username:** gitea
    - **Password** : gitea
    - Click the checkmark

- Run the pipeline by clicking **Start** and see that in your Gitea config repo the file `/environment/dev/kustomize.yaml` is updated with the new image version
  {{% notice tip %}}
  Notice that the `deploy` and the `git-update` steps now run in parallel. This is one of the powers of Tekton. It can scale natively with pods on OpenShift.
  {{% /notice %}}

- This will tell ArgoCD to update the `Deployment` with this new image version
- Check that the new image is rolled out (you may need to sync manually in ArgoCD to speed things up)

## Architecture recap

{{< figure src="../images/workshop_architecture_gitops.png?width=50pc&classes=border,shadow" title="Click image to enlarge" >}}
