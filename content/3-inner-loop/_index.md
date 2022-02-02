+++
title = "Inner Loop"
weight = 7
+++

In this part of the workshop you'll experience how modern software development using the OpenShift tooling can be done in a fast, iterative way. **Inner loop** here means `this is the way`, sorry, `process`, for developers to try out new things and quickly change and test their code on OpenShift without having to build new images all the time or being a Kubernetes expert.

As an example you'll create a new Java application. You don't need to have prior experience programming in Java as this will be kept really simple.

{{% notice tip %}}
We will use an application based on the [Quarkus](https://quarkus.io/) stack. Quarkus enables you to create much smaller and faster containerized Java applications than ever before.  You can even transcompile these apps to native Linux binaries that start blazingly fast.  Fun fact : Every OpenShift Subscription already comes with a Quarkus Subscription.      
{{% /notice %}}

Let's clone our project into our workspace :
- Bring up your CodeReady Workspace in your browser
- In the bottom left click on **Clone Repository** and then enter the Git URL to your Gitea Repo (You can copy the URL by clicking on clipboard icon)

Then we want to create a new OpenShift project for our app 
- Open a Terminal
  - In **My Workspace** (cube icon) to the right click **New Terminal**
- Copy the `oc login` command from your OpenShift cluster (top right > Username > Copy login command) and execute in the terminal to log into the OpenShift cluster
- Create a new project `workshop-dev`
```
oc new-project workshop-dev
```
First use `odo` ("OpenShift Do") to list the programming languages/frameworks it supports
```
./odo catalog list components
```
Now initialize a new Quarkus application
```
./odo create java-quarkus
```
Make the app accessible via http
```
./odo url create deepdive-app
```
And finally push the app to OpenShift
```
./odo push
```
To test the app:
- In OpenShift open the `workshop-dev` project and switch to the **Developer Console**
- Open the **Topology** view and click on the top right link of OpenShift icon to display the website of the app
- Your app should show up as a simple web page. In the `RESTEasy JAX-RS` section click the `@Path` endpoint `/hello` to see the result.

Now for the fun part: Using `odo` you can just dynamically change your code and push it out again without doing a new image build! No dev magic involved:
- In your CRW Workspace on the left, expand the file tree to open file `src/main/java/org/acmeGreetingRessource.java` and change the string "Hello RESTEasy" to "Hello Workshop"
- Push the code to OpenShift again
```
./odo push
```
- And reload the app webpage.
- Bam! The change should be there in a matter of seconds  
