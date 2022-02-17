+++
title = "Advanced ACS Pipeline"
weight = 31
+++

## Optimizing our DevSecOps Pipeline

In the chapter before we created a Pipeline which builds, checks and deploys our image, if the image passes all ACS checks. But what should happen, if the image doesn't pass the ACS check? It doesn't seems to be a good idea to save an unsafe image in the internal OpenShift registry. 
So lets modify our pipeline to an advanced one, which deletes an image, if it doesn't pass the ACS checks.

### Adding a Package Level Vulnerability
Before we adjust our pipeline let's add another vulnerability to our Deployment. So far we had a system library security issue but let's image a developer tried to add (hopefully by mistake) a vulnerable Java library to his/her application. How about we pick one of the most infamous current ones such as the **Log4Shell** vulnerability?  But don't worry ACS already ships with a policy for that and has your back.


{{% notice tip %}}
Quarkus doesn't use the log4J library for logging so is not affected by it. Although it is a bit contrived we will still force it to include the library just to trigger our policy.  If you want to find out more about this particular vulnerability have look [here](https://www.wired.com/story/log4j-log4shell/) 
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
There is a major security vulnerability in our code, but ACS is not able to detect it at the moment. So first of all navigate to ACS and follow these steps: 
- navigate to **Platform Configuration > System Policies**
- search for `Log4Shell` and click on it.
- go next until you are at the enforcement card and enable both `build` and `deploy` 
- save the policy

ACS is now able to detect the vulnerability. It is time now to implement your advanced Pipeline. 


### Let's go: Create our advanced Pipeline

In OpenShift administration view: 

- navigate to **Pipelines > Pipelines**
- on the right click **Create > Pipeline**
- switch to **YAML view**
- Replace the YAML with this making sure to update your `Gitea` Repo URLS (Specifically replace the {YOUR_CLUSTER_HOSTNAME}): 

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
        - tag-checked-image
      taskRef:
        kind: ClusterTask
        name: openshift-client
  workspaces:
    - name: workspace
```
- Click **Create**

As you can see in the Pipeline visualization the flow is now a bit different. Lets see what has changed:

- the image which was built through the **build task** will be pushed in a new **ImageStreamTag** called `dev`
- if the image passes the ACS checks, the image will be pushed to the **ImageStreamTag** called `latest` and the `dev` tag will be removed
- if the image doesn't pass the ACS checks, the **ImageStreamTag** called `dev` will be removed. This is handled by a function called `finally` and a `when expression`
  - have a look at your Pipeline YAML and try to understand how it works
- the last three steps stays the same as before


### Test the advanced Pipeline

Go ahead and start your newly created advanced Pipeline. See what happens and play a little bit around with it. Have fun! 

#### Fix the Vulnerability
If by the now the developer that introduced the log4jShell vulnerability has not realized by now that he/she "broke the build" you can tell him/her to update their dependency to a safe version.

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

