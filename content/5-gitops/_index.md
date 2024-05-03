+++
title = "Configure GitOps"
weight = 10
+++

Now that our CI/CD build and integration stage is ready we could promote the app version directly to a production stage. But with the help of the GitOps approach, we can leverage our Git system to handle promotion that is tracked through commits and can deploy and configure the whole production environment. This stage is just too critical to configure manually and without an audit.

## Install OpenShift GitOps

So let's start be installing the OpenShift GitOps Operator based on the project [ArgoCD](https://argo-cd.readthedocs.io/en/stable/).

- Install the **Red Hat OpenShift GitOps** Operator from OperatorHub with the default settings
  {{% notice tip %}}
  The installation of the GitOps Operator will give you a clusterwide ArgoCD instance available at the link in the top right menu, but since we want to have an instance to manage just our prod project we will create another ArgoCD instance in that specific project.
  {{% /notice %}}
- You should already have created an OpenShift **Project** `workshop-prod`
- With the project `workshop-prod` selected in the top menu click on **Installed Operators** and then **Red Hat OpenShift GitOps**.
- On the **ArgoCD** "tile" click on **Create instance** to create an ArgoCD instance in the `workshop-prod` project.

<!-- ![ArgoCD](../images/argo.png) -->

{{< figure src="../images/argo.png?width=50pc&classes=border,shadow" title="Click image to enlarge" >}}

- Keep the settings as they are and click **Create**

## Check the GitOps Config Repository

We already have a second repository, called `openshift-gitops-getting-started` in Gitea that holds the required Gitops yaml resources. We will use this repo to push changes to our `workshop-prod` enivronment.

Have a quick look at the structure of this git project:

**app** - contains yaml files for the deployment, service and route resources needed by our application. These will be applied to the cluster. There is also a `kustomization.yaml` defining that kustomize layers will be applied to all yamls

**environments/dev** - contains the `kustomization.yaml` which will be modified by our builds with new Image versions. ArgoCD will pick up these changes and trigger new deployments.

## Setup the GitOps Project in ArgoCD

Let's setup the project that tells ArgoCD to watch our configuration repository and update resources in the `workshop-prod` project accordingly.

- Find the local **ArgoCD URL** (not the global instance) by going to **Networking > Routes** in namespace `workshop-prod`
- Open the ArgoCD website, ignoring the certificate warning
- Don't login with OpenShift but with username and password
  - User is `admin` and password will be in **Secret** `argocd-cluster` in the **Project** `workspace-prod`

ArgoCD works with the concept of **Applications**. We will create an Application and point it to the configuration Git repository. ArgoCD will look for Kubernetes yaml files in the repository and path and deploy them to the defined project. Additionally, ArgoCD will also react to changes to the repository and reflect these to the project. You can also enable self-healing to prevent configuration drift. If you want find out more about OpenShift GitOps have look [here](https://docs.openshift.com/gitops/1.12/understanding_openshift_gitops/about-redhat-openshift-gitops.html).

- Create Application
  - Click the **Applications** icon on the left
  - Click **Create Application**
  - **Application Name**: workshop
  - **Project**: default
  - **SYNC POLICY**: Automatic
  - **Repository URL**: Copy the URL of your config repo `openshift-gitops-getting-started` from Gitea
  - **Path**: environments/dev
  - **Cluster URL**: https://kubernetes.default.svc
  - **Namespace**: workshop-prod
  - Click **Create**
  - Click on **Sync** and then **Synchronize** to manually trigger the first sync

Watch the resources (`Deployment`, `Service`, `Route`) get rolled out to the project `workshop-prod`. Notice, we also scaling our app to 2 pods in the production stage as we want some high availability. But the actual deployment will not succeed as shown by the 'broken heart' icons!

{{% notice info %}}
Since we have not published our image to the Quay `workshop-prod` repository the initial Deployment will try to roll out non existant image from Quay. Once the first pipeline run is complete, our newly built image will be replaced in the Deployment and rolled out.
{{% /notice %}}

Our complete production stage is now configured and controlled through GitOps. But how do we tell ArgoCD that there is a new version of our app to deploy? Well, we will add a step to our build pipeline updating the configuration repository.

As we do not want to modify our original repository file we will use a tool called [Kustomize](https://kustomize.io/) that can add incremental change layers to YAML files. Since ArgoCD permanently watches this repository, it will pick up these Kustomize changes.

{{% notice tip %}}
It is also possible to update the repository with a Pull request. Then you have an approval process for your production deployment.
{{% /notice %}}

## Initialize the workshop-prod/workshop Repository in Quay

We will need to initialize the `workshop-prod/workshop` in Quay so the robo user will be able to push images there later on.

- In Quay select the organization `openshift_workshop-prod` on the right
- Click on **+ Create New Repository** on the top left
  {{< figure src="../images/quay-create-repo.png?width=50pc&classes=border,shadow" title="Click image to enlarge" >}}
- Make sure to select `openshift_workshop-prod` as Organization
- Enter `workshop` as repo name
- Set the repo to **Public**
- Click **Create Public Repository**
  {{< figure src="../images/quay-create-repo2.png?width=30pc&classes=border,shadow" title="Click image to enlarge" >}}

## Add Kustomize and Git Push Tekton Task

Let's add a new custom Tekton task to the `workshop-int` project that can update the Image `tag` via Kustomize after the build process completed and then push the change to our git configuration repository.

We could add this through the OpenShift Web Console as well but to save time we will apply the file directly via the `oc` command.

- Go to your Web Terminal or open a new one.
- Apply the task via YAML:

```bash
oc create -f https://raw.githubusercontent.com/devsecops-workshop/yaml/main/tekton-kustomize.yml
```

- In the OpenShift Web Console switch back to project `workshop-int` and then go to **Pipelines > Tasks > Tasks** and have a look at the just imported task `git-update-deployment`. You should see the git commands how the configuration repository will be cloned, patched by **Kustomize** and then pushed again.

## Add Tekton Tasks to your Pipeline to Promote your Image to workshop-prod

So now we have a new Tekton Task in our task catalog to update a GitOps Git repository, but we still need to promote the actual image from our `workshop-int` to `workshop-prod` project. Otherwise the image will not be available for our deployment.

- In the `workshop_int` project, go to **Pipelines > Pipelines > workshop** and then YAML

{{% notice tip %}}
You can edit pipelines either directly in YAML or in the visual **Pipeline Builder**. We will see how to use the Builder later on, so let's edit the YAML for now.
{{% /notice %}}

Add the new Task to your Pipeline by adding it to the YAML like this:

- First we will add a new Pipeline Parameter 'GIT_CONFIG_REPO' at the beginning of the pipeline and set it by default to our GitOps configuration repository (This will be updated by the Pipeline and then trigger ArgoCD to deploy to Production)
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
    name: skopeo-copy
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

The `Pipeline` should now look like this. Notice that the new **tasks** runs in parallel to the `deploy` task

<!-- ![workshop Pipeline](../images/tekton.png) -->

{{< figure src="../images/pipeline1.png?width=40pc&classes=border,shadow" title="Click image to enlarge" >}}

Now, the pipeline is set. The last thing we need is authentication against the Gitea repository and the workshop-prod Quay org. We will add those from the **_start pipeline_** form next. Make sure to replace the <DOMAIN> placeholder if required.

## Update our Prod Stage via Pipeline and GitOps

- Click on Pipeline **Start**

  - In the form go down and expand **Show credential options**
  - Click **Add Secret**, then enter
    - **Secret name :** quay-workshop-prod-token
    - **Access to:** Image Registry
    - **Authentication type:** Basic Authentication
    - **Server URL:** quay-quay-quay.apps.&lt;DOMAIN&gt;/openshift_workshop-prod
    - **Username:** openshift_workshop-prod+builder
    - **Password** : (Retrieve this from the Quay organization `openshift_workshop-prod` robo account `openshift_workshop-prod+builder` as before)
    - Click the checkmark
  - Then click **Add Secret** again
    - **Secret name :** gitea-secret
    - **Access to:** Git Server
    - **Authentication type:** Basic Authentication
    - **Server URL:** https://repository-git.apps.&lt;DOMAIN&gt;/gitea/openshift-gitops-getting-started.git (replace url if necassary)
    - **Username:** gitea
    - **Password** : gitea
    - Click the checkmark

- Run the pipeline by clicking **Start** and see that in your Gitea configuration repository the file `/environment/dev/kustomize.yaml` is updated with the new image version
  {{% notice tip %}}
  Notice that the `deploy` and the `git-update` steps now run in parallel. This is one of the strength of Tekton. It can scale natively with pods on OpenShift.
  {{% /notice %}}

- This will tell ArgoCD to update the **Deployment** with this new image version
- Check that the new image is rolled out sucessfully now (you may need to sync manually in ArgoCD to speed things up)

## Architecture recap

{{< figure src="../images/workshop_architecture_gitops.png?width=50pc&classes=border,shadow" title="Click image to enlarge" >}}
