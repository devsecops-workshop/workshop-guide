+++
title = "Inner Loop"
weight = 7
+++

In this part of the workshop you'll experience how modern software development using the OpenShift tooling can be done in a fast, iterative way. **Inner loop** here means `this is the way`, sorry, process, for a developer to try out new things and quickly change and test her/his code.

As an example you'll create a new Quarkus application. You don't need to have prior experience programming in Java as this will be kept really simple.

- Bring up your CodeReady Workspace in your browser.
- In CRW open Terminal
  - In **My Workspace** to the right click **New Terminal**
- Copy the login command from your OpenShift cluster, and use it to log in `oc` in the CRW terminal.
- Create a new project `deepspace-dev`
- First use `odo` ("OpenShift Do") to list the programming languages/frameworks it supports
  - Note that not all languages `odo` works with are officially supported!
```
./odo catalog list components
```
Now initialize a new Quarkus application
```
./odo create java-quarkus
```
Create the app
```
./odo url create deepdive-app
```
And finally push the app to OpenShift
```
./odo push
```
To test the app:
- In OpenShift open the `deepspace-dev` project and switch to the **Developer Console**
- Open the deployment and access the route
- Your app should show up as a simple web page. In the `RESTEasy JAX-RS` section click the `@Path` endpoint `/hello` to see the result.

Now for the fun part: Using `odo` you can just dynamically change your code and push it out again without doing a new build! No dev magic involved:
- In your code access and change `GreetingRessource.java` to `Hello Deepdive`
- Push the code to OpenShift
```
./odo push
```
- And access the endpoint in the web app again.
