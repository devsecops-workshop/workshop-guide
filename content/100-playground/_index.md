+++
title = "Playground"
weight = 100
draft = true
+++

## Test

### Using a variable from config.toml

Value of var "deployment" is: {{< param "deployment" >}}

### Annotations:

{{% notice tip %}}
Text here
{{% /notice %}}


{{% notice warning %}}
Text here
{{% /notice %}}

### Fold-outs

<details><summary><b>Click here for Solution</b></summary>
<hr/>
<p>

- **Module:** yum

- **Arguments:** name=nano

- Tick **Enable Privilege Escalation**

</p>
<hr/>
</details>

### Images
```
![Install odo](../images/crw2.png?width=75pc)
```

Or using Hugo shortcut "figure" to easily add a caption, here with border and shadow, too:

```
{{< figure src="../images/crw2.png?width=75pc&classes=border,shadow" title="Click image to enlarge" >}}
```

Will automatically open larger in extra window when clicked.
