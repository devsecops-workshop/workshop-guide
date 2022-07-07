+++
title = "Advanced ACS Pipeline"
weight = 31
+++

## Optimizing our DevSecOps Pipeline

In the chapter before we created a Pipeline which builds, checks and deploys our image, if the image passes all ACS checks. But what should happen, if the image doesn't pass the ACS check? It doesn't seems to be a good idea to keep an unsafe image in the internal OpenShift registry.
So lets modify our pipeline to a more advanced one, which deletes an image, if it doesn't pass the ACS checks.

### Adding a Package Level Vulnerability

Before we adjust our pipeline let's add another vulnerability to our Deployment. So far we had a system library security issue but let's imagine a developer tried to add (hopefully by mistake) a vulnerable Java library to his/her application. How about we pick one of the most infamous current ones such as the **Log4Shell** vulnerability? But don't worry ACS already ships with a policy for that and has your back.

{{% notice tip %}}
Quarkus doesn't use the log4J library for logging so is not affected by it. Although it is a bit contrived we will still force it to include the library just to trigger our policy. If you want to find out more about this particular vulnerability have look [here](https://www.wired.com/story/log4j-log4shell/)
{{% /notice %}}

To add this library to you Quarkus app

- Go to your `quarkus-build-options` repo in `Gitea`
- Edit the `pom.xml` file to include the new dependency
- Find the line

```xml
    <!-- Add dependency here  -->
```

and after that paste

```xml
    <!-- Add dependency here  -->
    <dependency>
      <groupId>org.apache.logging.log4j</groupId>
      <artifactId>log4j-core</artifactId>
      <version>2.9.1</version>
    </dependency>
    <dependency>
      <groupId>org.apache.logging.log4j</groupId>
      <artifactId>log4j-api</artifactId>
      <version>2.9.1</version>
    </dependency>
```

- Commit
- Edit the `src/main/java/org/acme/GreetingResource.java` file to use the new dependency (otherwise Quarkus will just optimize it away)
- Find the line

```java
   // Add import here
```

and after that paste

```java
   // Add import here
  import org.apache.logging.log4j.Logger;
  import org.apache.logging.log4j.LogManager;
```

- Find the line

```java
    // Add Logger instantiation here
```

and after that paste

```java
   // Add Logger instantiation here
   private Logger logger = LogManager.getLogger(GreetingResource.class.getName());
```

- Commit

There you go. That developer has just introduced a ticking timebomb into the application. Let's see how far he will get with that.

### ACS Prerequisites

So there is a major security vulnerability in our code. ACS would detect the deployment because the System Policy `Log4Shell: log4j Remote Code Execution vulnerability` is enabled but won't stop it, because the Policy is not set to enforce.

## Modify Log4Shell Policy

So first of all in the **ACS Portal** follow these steps:

- Navigate to **Platform Configuration > Policies**
- Search for `Log4Shell` and click on the Policy.
- Click **Edit** at the upper right

Remember setting up image scanning with `roxctl` in our first pipeline? We use `roxctl` in a way that it only scans against Policies from a certain category, `Workshop` in our case. To have the task scan for the Log4Shell Policy, first add the Policy to the category `Workshop`:

- Remove the current categorie and add `Workshop`
- Now hit next until you are at the enforcement tab
- Enable both `Build` and `Deploy` enforcement by switching to **Inform and enforce** and setting them to **On**
- Save the policy

ACS is now able to detect and enforce the vulnerability. It is time now to implement your advanced Pipeline.

### Let's go: Create our advanced Pipeline

Our current pipeline is quite simple. In production you will have more complex flows with conditionals and parallel execution. To learn more abou these have a look a the [Tekton Documentation]{https://tekton.dev/docs/}.

To make it bit easier we have prepared a pipeline for you. But do take the time to look at the genera flow and tasks.

In the **OpenShift Web Console**:

- Make sure you are in the `workshop-int` Project
- Navigate to **Pipelines > Pipelines**
- On the right click **Create > Pipeline**
- Switch to **YAML view**
- Replace the YAML with this making sure to update your two `Gitea` Repo URL's (Specifically replace the {YOUR_CLUSTER_HOSTNAME}):

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
          value: "oc tag -d workshop-int/workshop:dev -n workshop-int"
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
        https://repository-git.apps.{YOUR_CLUSTER_HOSTNAME}/gitea/quarkus-build-options.git
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
            https://repository-git.apps.{YOUR_CLUSTER_HOSTNAME}/gitea/openshift-gitops-getting-started.git
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
          value: "true"
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
          value: "false"
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
          value: "oc tag workshop:dev workshop:latest"
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
          value: "oc tag -d workshop:dev"
        - name: VERSION
          value: latest
      runAfter:
        - tag-checked-image
      taskRef:
        kind: ClusterTask
        name: openshift-client
  workspaces:
    - name: workspace
```

- Click **Create**

As you can see in the Pipeline visualization the flow is now a bit different. Lets see what has changed:

- The image which was built through the **build task** will be pushed in a new **ImageStreamTag** called `dev`
- If the image passes the ACS checks, the image will be pushed to the **ImageStreamTag** called `latest` and the `dev` tag will be removed
- If the image doesn't pass the ACS checks, the **ImageStreamTag** called `dev` will be removed. This is handled by a function called `finally` and a `when expression`
  - Have a look at your Pipeline YAML and try to understand how it works
- The last three steps stays the same as before

{{< figure src="../images/pipeline-adv.png?width=50pc&classes=border,shadow" title="Click image to enlarge" >}}

### Test the advanced Pipeline

Go ahead and start your newly created advanced Pipeline.
Navigate to:

- **Pipelines -> Pipelines**
- Click on **workshop-advanced**
- In the top right corner click **Actions** -> **Start**
- In the **Start Pipeline** window at the bottom set **workspace** to **PersistentVolumeClaim**
- Set the **Select a PVC** drop-down to a PVC
- Start the Pipeline

See what happens and maybe play around with it and start again. Have fun!

### Fix the Vulnerability

If by now the developer that introduced the log4jShell vulnerability has not realized that he/she "broke the build" you can tell him/her to update their dependency to a safe version.

Go to your `quarkus-build-options` repo in `Gitea` again

- Edit the `pom.xml` file update dependency to a safe version like this

```xml
    <!-- Add dependency here  -->
    <dependency>
      <groupId>org.apache.logging.log4j</groupId>
      <artifactId>log4j-core</artifactId>
      <version>2.17.1</version>
    </dependency>
    <dependency>
      <groupId>org.apache.logging.log4j</groupId>
      <artifactId>log4j-api</artifactId>
      <version>2.17.1</version>
    </dependency>
```
