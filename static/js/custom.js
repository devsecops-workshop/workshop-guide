window.onload = function () {
  console.log("Found parameters -> " + !window.location.search);
  if (!window.location.search) {
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const params = new Proxy(urlParams, {
    get: (searchParams, prop) => searchParams.get(prop),
  });

  // Replace Domain Placeholder with dynamic parameter 'domain'
  const domain = params.domain;
  if (domain != null) {
    console.log("Replacing domain domain -> " + domain);
    var html = document.querySelector("html");
    var walker = document.createTreeWalker(html, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) {
      node.nodeValue = node.nodeValue.replace(/<DOMAIN>/, domain);
    }
  }

  // Hide Chapters by parameter 'hidechapters'
  const chapters = params.hidechapters;
  if (chapters != null) {
    console.log("Hiding chapters -> " + chapters);
    const chaptersArray = chapters.split(":");
    var ul = document.querySelector('[class="topics"]');
    var items = ul.getElementsByTagName("li");

    for (var i = 0, item; (item = items[i]); ++i) {
      if (chaptersArray.includes(i.toString())) {
        item.remove();
      }
    }
  }
  // Add Current Query Params to all links
  console.log("Adding urlParams -> " + urlParams);
  var links = document.getElementsByTagName("a");
  for (var i = 0, link; (link = links[i]); ++i) {
    console.log("URL -> " + link.id + " " + link.href);
    if (link.id == "skip") continue;
    const url = new URL(link.href);
    const newUrl = new URL(`${url.origin}${url.pathname}?${urlParams}`);
    link.href = newUrl;
  }
};
