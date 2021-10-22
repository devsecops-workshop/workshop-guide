+++
title = "Inner Loop"
weight = 7
+++

In this part of the workshop you'll experience how modern software development using the OpenShift tooling can be done in a fast, iterative way. **Inner loop** here means `this is the way`, sorry, process, for a developer to try out new things and quickly change and test her/his code on OpenShift without having to build new images all the time or being a Kubernetes expert.

As an example you'll create a new Quarkus application. You don't need to have prior experience programming in Java as this will be kept really simple.

- Bring up your CodeReady Workspace in your browser.
- In CRW open Terminal
  - In **My Workspace** (cube icon) to the right click **New Terminal**
- Copy the oc login command from your OpenShift cluster (tope right > Username > Copy login command), and use it to log in `oc` in the CRW terminal.
- Create a new project `deepspace-dev`
```
./oc new-project deepspace-dev
```
- First use `odo` ("OpenShift Do") to list the programming languages/frameworks it supports
  - Note that not all languages `odo` works with are officially supported!
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
- In OpenShift open the `deepspace-dev` project and switch to the **Developer Console**
- Open the **Topology** tab and click on the top right link of OpenShift icon to display the website of the app
- Your app should show up as a simple web page. In the `RESTEasy JAX-RS` section click the `@Path` endpoint `/hello` to see the result.

Now for the fun part: Using `odo` you can just dynamically change your code and push it out again without doing a new build! No dev magic involved:
- In your CRW Workspace on the left expand the file tree to open file `src/main/java/org/acmeGreetingRessource.java` to `Hello Deepdive`
- Push the code to OpenShift again
```
./odo push
```
- And reload the app webpage.
- The change should be there in a matter of seconds  
