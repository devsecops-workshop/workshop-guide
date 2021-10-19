+++
title = "Inner Loop"
weight = 7
+++

- Login to OpenShift Console
- Create deepspace-int project
- Copy Login Command
```
./oc login ...
./odo catalog list components
./odo create java-quarkus
./odo url create deepdive-app
./odo push
```
- Open Developer Console
- Jump To Link
- Open /hello Endpoint
- Change GreetingRessource,java to “Hello Deepdive”
```
./odo push
```
- Recheck link
